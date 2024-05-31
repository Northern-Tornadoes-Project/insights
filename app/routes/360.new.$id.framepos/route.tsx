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
import { Form, useLoaderData } from '@remix-run/react';
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
import { authenticator } from '~/lib/auth.server';

const schema = z.object({
	framepos: z.instanceof(File, {
		message: 'Please upload a file.'
	})
});

export async function loader({ request, params }: LoaderFunctionArgs) {
	const userId = await authenticator.isAuthenticated(request);

	if (!userId) {
		return redirect('/auth/login');
	}

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
		return submission.reply();
	}

	const file = formData.get('framepos');

	if (!file) {
		throw new Error('Could not read the file.');
	}

	const text = await (file as Blob).text();

	type FrameposLine = {
		systemtime_sec: number;
		frame_index: number;
		lat: number;
		lon: number;
		altitude: number;
		distance: number;
		heading: number;
		pitch: number;
		roll: number;
		track: number;
		jpeg_filename: string;
	};

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

	const framepos: FrameposLine[] = [];

	for (let i = 1; i < lines.length; i++) {
		// Skip empty lines
		if (lines[i] === '') continue;

		const line = lines[i].split(',');

		if (line.length !== 11) {
			console.log(i, line);
			throw new Error('Invalid file.');
		}

		framepos.push({
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
			jpeg_filename: line[10]
		});
	}

	await db
		.update(paths)
		.set({
			frame_pos_data: framepos,
			updatedBy: id,
			status: 'uploading'
		})
		.where(eq(paths.id, params.id));

	return redirect(`/360/new/${params.id}/images`);
}

export default function () {
	const path = useLoaderData<typeof loader>();
	const [form, fields] = useForm({
		onValidate({ formData }) {
			return parseWithZod(formData, { schema });
		}
	});

	return (
		<main className="flex justify-center items-center h-full">
			<Card className="sm:min-w-[500px]">
				<CardHeader>
					<CardTitle>{path.name}</CardTitle>
					<CardDescription>Upload the framepos.</CardDescription>
				</CardHeader>
				<Form method="post" encType="multipart/form-data">
					<CardContent className="grid gap-2">
						<Input type="file" id="framepos" name="framepos" required />
					</CardContent>
					<CardFooter>
						<Button type="submit">Next</Button>
					</CardFooter>
				</Form>
			</Card>
		</main>
	);
}
