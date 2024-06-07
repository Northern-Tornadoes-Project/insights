import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import {
	ActionFunctionArgs,
	LoaderFunctionArgs,
	NodeOnDiskFile,
	json,
	redirect,
	unstable_parseMultipartFormData
} from '@remix-run/node';
import { rm } from 'node:fs/promises';
import { Form, useActionData, useLoaderData, useNavigation } from '@remix-run/react';
import { eq } from 'drizzle-orm';
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
import { db } from '~/db/db.server';
import { paths } from '~/db/schema';
import { protectedRoute } from '~/lib/auth.server';
import { buildHandler } from './uploader.server';

const schema = z.object({
	// Can't be empty and must be smaller than 50MB
	files: z
		.array(
			z
				.instanceof(NodeOnDiskFile)
				.refine((file) => file.size > 0, { message: 'File is empty' })
				.refine((file) => file.size < 50 * 1024 * 1024, { message: 'File is too large' })
		)
		.min(1, 'At least one file is required')
		.refine(
			(files) => files.every((file) => file.size > 0 && file.size < 50 * 1024 * 1024),
			'Invalid files'
		)
});

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

	const formData = await unstable_parseMultipartFormData(request, buildHandler(path));
	const submission = parseWithZod(formData, { schema });

	if (submission.status !== 'success') {
		// Delete the uploaded files
		const files = formData.getAll('files') as NodeOnDiskFile[];

		if (files.length > 0) await Promise.all(files.map((file) => rm(file.getFilePath())));

		return json(submission.reply());
	}

	return redirect(`/360/new/google/${path.id}`);
}

export default function () {
	const navigation = useNavigation();
	const path = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const [form, fields] = useForm({
		lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema });
		},
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput'
	});

	return (
		<main className="flex justify-center items-center h-full">
			<Card className="sm:min-w-[500px]">
				<CardHeader>
					<CardTitle>{path.name}</CardTitle>
					<CardDescription>Upload the images captured from the camera.</CardDescription>
				</CardHeader>
				<Form
					method="post"
					encType="multipart/form-data"
					id={form.id}
					onSubmit={form.onSubmit}
					noValidate
				>
					<CardContent>
						<fieldset className="grid gap-2" disabled={navigation.state === 'submitting'}>
							<Label htmlFor={fields.files.key}>Images</Label>
							<Input
								type="file"
								accept="image/png, image/jpeg"
								key={fields.files.key}
								name={fields.files.name}
								multiple
								required
							/>
							<p className="text-primary/60 text-sm">{fields.files.errors}</p>
						</fieldset>
					</CardContent>
					<CardFooter>
						<Button type="submit" disabled={navigation.state === 'submitting'}>
							Upload
						</Button>
					</CardFooter>
				</Form>
			</Card>
		</main>
	);
}
