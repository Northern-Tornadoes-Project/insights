import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import {
	ActionFunctionArgs,
	LoaderFunctionArgs,
	json,
	redirect,
	unstable_createMemoryUploadHandler,
	unstable_parseMultipartFormData
} from '@remix-run/node';
import { Form, useActionData, useLoaderData } from '@remix-run/react';
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
import { db } from '~/db/db.server';
import { paths } from '~/db/schema';
import { authenticator, protectedRoute } from '~/lib/auth.server';
import { FrameposSchema } from '~/lib/framepos';

const schema = z.object({
	framepos: z
		.instanceof(File, {
			message: 'Please select a framepos file.'
		})
		.refine((file) => {
			return file.name.endsWith('_framepos.txt') || file.name.endsWith('_framepos.csv');
		}, "File name should end with '_framepos.txt' or '_framepos.csv'")
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

	return json(path);
}

export async function action({ request, params }: ActionFunctionArgs) {
	const id = await authenticator.isAuthenticated(request);

	if (!id) {
		return redirect('/auth/login');
	}

	if (!params.id) {
		return redirect('/360');
	}

	const handler = unstable_createMemoryUploadHandler({
		maxPartSize: 1024 * 1024,
		filter: async (file) => {
			if (!file.filename) return false;
			return file.filename.endsWith('_framepos.txt') || file.filename.endsWith('_framepos.csv');
		}
	});

	const formData = await unstable_parseMultipartFormData(request, handler);
	const submission = parseWithZod(formData, { schema });

	if (submission.status !== 'success') {
		return json(submission.reply());
	}

	const file = formData.get('framepos');

	if (!file) {
		throw new Error('Could not read the file.');
	}

	const text = await (file as Blob).text();

	if (!text) {
		throw new Error('Empty file.');
	}

	const lines = text.split('\n');

	if (lines.length < 2) {
		throw new Error('Invalid file.');
	}

	const header = lines[0].split(',');

	if (header.length !== 11) {
		throw new Error('Invalid file.');
	}

	// Check if it uses png or jpeg
	const filenameHeader = header[10].split('_')[0];

	const framepos: z.infer<typeof FrameposSchema>[] = [];

	for (let i = 1; i < lines.length; i++) {
		// Skip empty lines
		if (lines[i] === '') continue;

		const line = lines[i].split(',');

		if (line.length !== 11) {
			console.log(i, line);
			throw new Error('Invalid file.');
		}

		const data = FrameposSchema.parse({
			systemtime_sec: Number(line[0]),
			frame_index: Number(line[1]),
			lat: Number(line[2]),
			lon: Number(line[3]),
			altitude: Number(line[4]),
			distance: Number(line[5]),
			heading: Number(line[6]),
			pitch: Number(line[7]),
			roll: Number(line[8]),
			track: Number(line[9]),
			png_filename: filenameHeader === 'png' ? line[10].trim() : undefined,
			jpeg_filename: filenameHeader === 'jpeg' ? line[10].trim() : undefined
		});

		framepos.push(data);
	}

	await db
		.update(paths)
		.set({
			frameposData: framepos,
			updatedBy: id,
			status: 'uploading'
		})
		.where(eq(paths.id, params.id));

	return redirect(`/360/new/${params.id}/images`, { headers: { 'Cache-Control': 'no-store' } });
}

export default function () {
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
					<CardDescription>Upload the framepos.</CardDescription>
				</CardHeader>
				<Form
					method="post"
					encType="multipart/form-data"
					id={form.id}
					onSubmit={form.onSubmit}
					noValidate
				>
					<CardContent className="grid gap-2">
						<Input
							type="file"
							key={fields.framepos.key}
							name={fields.framepos.name}
							accept=".txt,.csv"
							required
						/>
						<p className="text-primary/60 text-sm">{fields.framepos.errors}</p>
					</CardContent>
					<CardFooter>
						<Button type="submit" disabled={!!fields.framepos.errors}>
							Next
						</Button>
					</CardFooter>
				</Form>
			</Card>
		</main>
	);
}