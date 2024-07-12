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
import { db } from '~/db/db.server';
import { hailpad } from '~/db/schema';
import { env } from '~/env.server';
import { authenticator, protectedRoute } from '~/lib/auth.server';

const schema = z.object({
	mesh: z
		.instanceof(File, {
			message: 'Please select a .stl file.'
		})
		.refine((file) => {
			return file.name.endsWith('.stl');
		}, 'File should be of .stl type.')
});

export async function loader({ request, params }: LoaderFunctionArgs) {
	await protectedRoute(request);

	if (!params.id) {
		return redirect('/hailgen');
	}

	const queriedHailpad = await db.query.hailpad.findFirst({
		where: eq(hailpad.id, params.id)
	});

	if (!queriedHailpad) {
		throw new Error('Hailpad not found');
	}

	return json(queriedHailpad);
}

export async function action({ request, params }: ActionFunctionArgs) {
	const id = await authenticator.isAuthenticated(request);

	if (!id) {
		return redirect('/auth/login');
	}

	if (!params.id) {
		return redirect('/hailgen');
	}

	const handler = unstable_createMemoryUploadHandler({
		maxPartSize: 1024 * 1024 * 100,
		filter: async (file) => {
			if (!file.filename) return false;
			return file.filename.endsWith('.stl');
		}
	});

	const formData = await unstable_parseMultipartFormData(request, handler);
	const submission = parseWithZod(formData, { schema });

	if (submission.status !== 'success') {
		return json(submission.reply());
	}

	const file = formData.get('mesh');

	const queriedHailpad = await db.query.hailpad.findFirst({
		where: eq(hailpad.id, params.id)
	});

	if (!queriedHailpad) {
		throw new Error('Hailpad not found');
	}

	if (!file) {
		throw new Error('Could not read the file.');
	}

	// TODO: Save the mesh data to the associated hailpad folder
	const filePath = `${env.HAILPAD_DIRECTORY}/${queriedHailpad.folderName}/mesh.txt`;

	// Send file to microservice for processing
	if (env.SERVICE_HAILGEN_ENABLED) {
		const body = new FormData();
		body.append(
			'input_directory',
			new Blob([`${env.SERVICE_HAILGEN_DIRECTORY}/${hailpad.folderName}`], { type: 'text/plain' })
		);
		body.append('hailpad_id', new Blob([queriedHailpad.id], { type: 'text/plain' }));
		body.append('mesh_file', file);

		await fetch(`${process.env.SERVICE_HAILGEN_URL}/hailgen/dmap`, {
			method: 'POST',
			body: body
		});
	} else {
		console.log('Hailgen service is disabled');
	}

	return redirect(`/hailgen/${params.id}`);
}

export default function () {
	const navigation = useNavigation();
	const hailpad = useLoaderData<typeof loader>();
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
					<CardTitle>{hailpad.name}</CardTitle>
					<CardDescription>Upload the 3D hailpad mesh.</CardDescription>
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
							key={fields.mesh.key}
							name={fields.mesh.name}
							accept=".stl"
							required
							disabled={navigation.state === 'submitting'}
						/>
						<p className="text-primary/60 text-sm">{fields.mesh.errors}</p>
					</CardContent>
					<CardFooter>
						<Button
							type="submit"
							disabled={!!fields.mesh.errors || navigation.state === 'submitting'}
						>
							Next
						</Button>
					</CardFooter>
				</Form>
			</Card>
		</main>
	);
}
