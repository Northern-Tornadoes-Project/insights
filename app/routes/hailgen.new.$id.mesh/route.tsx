import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import {
	ActionFunctionArgs,
	LoaderFunctionArgs,
	NodeOnDiskFile,
	json,
	redirect,
	unstable_createFileUploadHandler,
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
import { dent, hailpad } from '~/db/schema';
import { env } from '~/env.server';
import { protectedRoute } from '~/lib/auth.server';

interface HailpadDent {
	// TODO: Use shared interface
	angle: string | null;
	centroidX: string;
	centroidY: string;
	majorAxis: string;
	minorAxis: string;
}

const schema = z.object({
	mesh: z
		.instanceof(NodeOnDiskFile, {
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

	const filePath = `${env.HAILPAD_DIRECTORY}/${queriedHailpad.folderName}`;

	const handler = unstable_createFileUploadHandler({
		maxPartSize: 1024 * 1024 * 100,
		filter: (file) => {
			if (!file.filename) return false;
			return file.filename.endsWith('.stl');
		},
		directory: filePath,
		avoidFileConflicts: false,
		file({ filename }) {
			return filename;
		}
	});

	const formData = await unstable_parseMultipartFormData(request, handler);
	const submission = parseWithZod(formData, { schema });

	if (submission.status !== 'success') {
		return json(submission.reply());
	}

	// Save the mesh to the associated hailpad folder
	const file = formData.get('mesh') as NodeOnDiskFile;

	if (!file) {
		throw new Error('Could not read the file.');
	}

	let depthX;
	let depthY;

	// Invoke microservice with uploaded file path for processing
	// if (env.SERVICE_HAILGEN_ENABLED) {
	const response = await fetch(new URL(`${process.env.SERVICE_HAILGEN_URL}/hailgen/dmap`), {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			hailpad_id: params.id,
			file_paths: [`${filePath}/hailpad.stl`],
			adaptive_block: queriedHailpad.adaptiveBlockSize,
			adaptive_c: queriedHailpad.adaptiveC
		})
	});

	if (response.ok) {
		// Save dents to db
		const res = await response.json();
		const dents = res.dents;
		const maxDepthLocation = res.maxDepthLocation;

		dents.forEach(async (hailpadDent: HailpadDent) => {
			const newDent = await db
				.insert(dent)
				.values({
					hailpadId: queriedHailpad.id,
					angle: hailpadDent.angle,
					majorAxis: hailpadDent.majorAxis,
					minorAxis: hailpadDent.minorAxis,
					centroidX: hailpadDent.centroidX,
					centroidY: hailpadDent.centroidY
					// TODO: Depth information
				})
				.returning();

			if (newDent.length != 1) {
				throw new Error('Error creating dent');
			}
		});

		// Get location for max. depth
		console.log('max depth location is: ' + maxDepthLocation);
		depthX = Number(maxDepthLocation[0]);
		depthY = Number(maxDepthLocation[1]);
	} else {
		console.error('Error invoking Hailgen service');
	}
	// } else {
	// 	console.log('Hailgen service is disabled');
	// } // TODO: Uncomment

	return redirect(`/hailgen/new/${queriedHailpad.id}/depth?x=${depthX}&y=${depthY}`);
}

export default function () {
	const navigation = useNavigation();
	const hailpad = useLoaderData<typeof loader>();
	const lastResult = useActionData<typeof action>();
	const [form, fields] = useForm({
		lastResult,
		shouldValidate: 'onSubmit',
		shouldRevalidate: 'onSubmit'
	});

	return (
		<main className="flex h-full items-center justify-center">
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
						<p className="text-sm text-primary/60">{fields.mesh.errors}</p>
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
