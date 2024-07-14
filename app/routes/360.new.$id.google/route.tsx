import {
	ActionFunctionArgs,
	json,
	LoaderFunctionArgs,
	redirect,
	unstable_parseMultipartFormData
} from '@remix-run/node';
import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import { eq } from 'drizzle-orm';
import { LucideLink } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { UploadProgress } from '~/components/progress';
import { Button } from '~/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { db, updatePathSize } from '~/db/db.server';
import { paths } from '~/db/schema';
import { protectedRoute } from '~/lib/auth.server';
import { buildUploadHandler, clearUploads } from './uploader.server';

export async function loader({ request, params }: LoaderFunctionArgs) {
	await protectedRoute(request);

	if (!params.id) {
		return redirect('/360');
	}

	const path = await db.query.paths.findFirst({
		where: eq(paths.id, params.id)
	});

	if (!path) {
		throw new Error('Path not found');
	}

	if (path.status === 'framepos') {
		return redirect('/360');
	}

	return json(path);
}

export async function action({ request, params }: ActionFunctionArgs) {
	if (!params.id) {
		return redirect('/360');
	}

	await protectedRoute(request);
	const path = await db.query.paths.findFirst({
		where: eq(paths.id, params.id)
	});

	if (!path) {
		throw new Error('Path not found');
	}

	// Delete old panorama files
	await clearUploads(path.folderName, path.id);

	const formData = await unstable_parseMultipartFormData(
		request,
		buildUploadHandler({
			path,
			maxFileSize: 50 * 1024 * 1024
		})
	);

	const files = formData.getAll('images');

	let invalid = false;

	for (const file of files) {
		if (!file) {
			invalid = true;
			break;
		}
	}

	if (invalid) {
		try {
			await clearUploads(path.folderName, path.id);
		} catch (error) {
			console.error(error);
		}

		return json(
			{
				status: 'error',
				error: {
					files: 'Invalid upload'
				}
			},
			{
				status: 400
			}
		);
	}

	if (
		files.length === 0 ||
		files.length > Object.keys(path.panoramaData as Record<string, unknown>).length
	) {
		try {
			await clearUploads(path.folderName, path.id);
		} catch (error) {
			console.error(error);
		}

		return json(
			{
				status: 'error',
				error: {
					files: 'Invalid number of files'
				}
			},
			{
				status: 400
			}
		);
	}

	await updatePathSize(path.id);

	// Set status to processing
	await db
		.update(paths)
		.set({
			status: 'processing'
		})
		.where(eq(paths.id, path.id));

	return redirect(`/360/${path.id}`);
}

export default function () {
	const navigation = useNavigation();
	const path = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const [copyClicked, setCopyClicked] = useState(false);
	const [images, setImages] = useState<string[]>([]);

	return (
		<main className="flex h-full items-center justify-center">
			<Card className="sm:min-w-[500px]">
				<CardHeader>
					<CardTitle>{path.name}</CardTitle>
					<CardDescription>Upload the images downloaded from Google.</CardDescription>
				</CardHeader>
				<Form method="post" encType="multipart/form-data">
					<CardContent className="grid grid-cols-1 gap-2">
						<fieldset className="grid gap-2" disabled={navigation.state === 'submitting'}>
							<Label htmlFor="images">Copy Panorama IDs to download.</Label>
							<Button
								variant="link"
								className="w-min flex-row gap-2"
								onClick={() => {
									const panoramaIds = Object.keys(
										path.panoramaData as Record<string, unknown>
									).join('\n');
									navigator.clipboard.writeText(panoramaIds);
									toast('Panorama IDs copied to clipboard.', { duration: 3000 });
									setCopyClicked(true);
								}}
							>
								<LucideLink size={16} /> Copy
							</Button>
							{lastResult && lastResult.status === 'error' && (
								<p className="text-sm text-primary/60">{lastResult.error?.['files']}</p>
							)}
						</fieldset>
						<fieldset
							className="grid gap-2"
							disabled={navigation.state === 'submitting' || !copyClicked}
						>
							<Label htmlFor="images">Images</Label>
							<Input
								type="file"
								accept="image/png, image/jpeg"
								key="images"
								name="images"
								onChange={(event) => {
									const files = Array.from(event.target.files || []);
									setImages(files.map((file) => file.name));
								}}
								multiple
								required
							/>
							{lastResult && lastResult.status === 'error' && (
								<p className="text-sm text-primary/60">{lastResult.error?.['files']}</p>
							)}
						</fieldset>
						<UploadProgress id={path.id} className="pt-2" />
					</CardContent>
					<CardFooter className="space-x-4">
						<Button type="submit" disabled={navigation.state === 'submitting' || !copyClicked}>
							Upload
						</Button>
						{images.length !== Object.keys(path.panoramaData as Record<string, unknown>).length && (
							<p className="text-sm text-primary/60">
								{images.length} images selected,{' '}
								{Object.keys(path.panoramaData as Record<string, unknown>).length} recommended
							</p>
						)}
					</CardFooter>
				</Form>
			</Card>
		</main>
	);
}
