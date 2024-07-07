import {
	ActionFunctionArgs,
	LoaderFunctionArgs,
	NodeOnDiskFile,
	json,
	redirect,
	unstable_parseMultipartFormData
} from '@remix-run/node';
import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import { eq, inArray, sum } from 'drizzle-orm';
import { useState } from 'react';
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
import { db } from '~/db/db.server';
import { captures, pathSegments, paths } from '~/db/schema';
import { env } from '~/env.server';
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

	if (path.status === 'processing' || path.status === 'framepos') {
		return redirect('/360');
	}

	// Check if the number of segments already matches the number of framepos data
	const completedSegments = await db.query.pathSegments.findMany({
		where: eq(pathSegments.pathId, path.id)
	});

	if (completedSegments.length === path.frameposData?.length) {
		return redirect(`/360/new/${path.id}/google`);
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

	// Check if the number of segments already matches the number of framepos data
	const completedSegments = await db.query.pathSegments.findMany({
		where: eq(pathSegments.pathId, path.id)
	});

	if (completedSegments.length === path.frameposData?.length) {
		return redirect(`/360/new/${path.id}/google`);
	}

	// Clear the uploads if the number of files does not match the number of segments
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

	if (files.length !== path.frameposData?.length) {
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

	// Get the total size of the images
	const savedSegments = await db.query.pathSegments.findMany({
		where: eq(pathSegments.pathId, path.id),
		columns: {
			id: true
		}
	});

	// Get the total size of the images
	const result = await db
		.select({
			size: sum(captures.size)
		})
		.from(captures)
		.where(
			inArray(
				captures.id,
				savedSegments.map((segment) => segment.id)
			)
		);

	const size = Number(result[0].size);

	await db
		.update(paths)
		.set({
			size: Number.isNaN(size) ? undefined : size,
			status: 'processing'
		})
		.where(eq(paths.id, path.id));

	const imageFiles: string[] = files.map(
		(file) => (file as NodeOnDiskFile).getFilePath().split('/').pop()!
	);

	// Send files to microservice
	if (env.SERVICE_360_ENABLED)
		await fetch(`${process.env.SERVICE_360_URL}/process_images`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				input_directory: `${env.SERVICE_360_DIRECTORY}/${path.folderName}`,
				event_id: path.id,
				file_list: imageFiles
			})
		});
	else console.log('Service 360 is disabled');

	return redirect(`/360/new/${path.id}/google`);
}

export default function () {
	const navigation = useNavigation();
	const path = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const [images, setImages] = useState<string[]>([]);

	return (
		<main className="flex justify-center items-center h-full">
			<Card className="sm:min-w-[500px]">
				<CardHeader>
					<CardTitle>{path.name}</CardTitle>
					<CardDescription>Upload the images captured from the camera.</CardDescription>
				</CardHeader>
				<Form method="post" encType="multipart/form-data">
					<CardContent>
						<fieldset className="grid gap-2" disabled={navigation.state === 'submitting'}>
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
								<p className="text-primary/60 text-sm">{lastResult.error?.['files']}</p>
							)}
						</fieldset>
					</CardContent>
					<CardFooter className="space-x-4">
						<Button
							type="submit"
							disabled={
								navigation.state === 'submitting' || images.length !== path.frameposData?.length
							}
						>
							Upload
						</Button>
						{images.length !== path.frameposData?.length && (
							<p className="text-primary/60 text-sm">
								{images.length} images selected, {path.frameposData?.length} required
							</p>
						)}
					</CardFooter>
				</Form>
			</Card>
		</main>
	);
}
