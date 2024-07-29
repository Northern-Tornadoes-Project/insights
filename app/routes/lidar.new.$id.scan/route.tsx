import { parseWithZod } from '@conform-to/zod';
import {
	ActionFunctionArgs,
	json,
	LoaderFunctionArgs,
	NodeOnDiskFile,
	redirect,
	unstable_createFileUploadHandler,
	unstable_parseMultipartFormData
} from '@remix-run/node';
import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import { eq } from 'drizzle-orm';
import { readdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { useState } from 'react';
import { z } from 'zod';
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
import { Spinner } from '~/components/ui/spinner';
import { db } from '~/db/db.server';
import { scans } from '~/db/schema';
import { env } from '~/env.server';
import { protectedRoute } from '~/lib/auth.server';

const schema = z.object({
	scan: z
		.instanceof(NodeOnDiskFile, {
			message: 'Please select a pointcloud file.'
		})
		.refine((file) => {
			return file.name.endsWith('.las') || file.name.endsWith('.laz');
		}, 'File should be of .las or .laz type.')
});

export async function loader({ request, params }: LoaderFunctionArgs) {
	const id = params.id;

	if (!id) throw new Response(null, { status: 404, statusText: 'Not found' });

	const scan = await db.query.scans.findFirst({
		where: eq(scans.id, id)
	});

	if (!scan) throw new Response(null, { status: 404, statusText: 'Not found' });

	await protectedRoute(request);

	return json(scan);
}

export async function action({ request, params }: ActionFunctionArgs) {
	await protectedRoute(request);

	const id = params.id;

	if (!id) throw new Response(null, { status: 404, statusText: 'Not found' });

	const scan = await db.query.scans.findFirst({
		where: eq(scans.id, id)
	});

	if (!scan) throw new Response(null, { status: 404, statusText: 'Not found' });

	const directory = `${env.SCAN_DIRECTORY}/${scan.folderName}`;

	const handler = unstable_createFileUploadHandler({
		// 1GB
		maxPartSize: 1024 * 1024 * 1024,
		filter: (file) => {
			if (!file.filename) return false;
			return file.filename.endsWith('.las') || file.filename.endsWith('.laz');
		},
		directory,
		avoidFileConflicts: false,
		file({ filename }) {
			return `scan.${filename.split('.').pop()}`;
		}
	});

	const formData = await unstable_parseMultipartFormData(request, handler);
	const submission = parseWithZod(formData, { schema });

	if (submission.status !== 'success') {
		// Delete the uploaded file
		try {
			for (const file of await readdir(directory)) {
				await unlink(join(directory, file));
			}
		} catch (error) {
			console.error(error);
		}
		return json(submission.reply());
	}

	const file = formData.get('scan') as NodeOnDiskFile;

	if (!file) {
		throw new Error('File not found after uploading...');
	}

	return redirect(`/lidar/${scan.id}`);
}

export default function () {
	const scan = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const navigation = useNavigation();
	const [fileSelected, setFileSelected] = useState(false);

	return (
		<main className="flex h-full items-center justify-center">
			<Card className="sm:min-w-[500px]">
				<CardHeader>
					<CardTitle>{scan.name}</CardTitle>
					<CardDescription>Upload the images captured from the camera.</CardDescription>
				</CardHeader>
				<Form method="post" encType="multipart/form-data">
					<CardContent>
						<fieldset className="grid gap-2" disabled={navigation.state === 'submitting'}>
							<Label htmlFor="images">Images</Label>
							<Input
								type="file"
								key="scan"
								name="scan"
								onChange={(e) => setFileSelected(e.target.files?.length === 1 ? true : false)}
								required
							/>
							{lastResult && lastResult.status === 'error' && (
								<p className="text-sm text-primary/60">{lastResult.error?.['scan']}</p>
							)}
						</fieldset>
					</CardContent>
					<CardFooter className="space-x-4">
						<Button type="submit" disabled={navigation.state === 'submitting' || !fileSelected}>
							{navigation.state === 'submitting' && (
								<Spinner className="mr-2 fill-primary" size={16} />
							)}
							{navigation.state === 'submitting' ? 'Uploading...' : 'Upload'}
						</Button>
					</CardFooter>
				</Form>
			</Card>
		</main>
	);
}
