import { FormProvider, useForm } from '@conform-to/react';
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
import { Label } from '~/components/ui/label';
import { db } from '~/db/db.server';
import { dent, hailpad } from '~/db/schema';
import { env } from '~/env.server';
import { authenticator, protectedRoute } from '~/lib/auth.server';

interface HailpadDent {
	// TODO: Use shared interface
	angle: string | null;
	centroidX: string;
	centroidY: string;
	majorAxis: string;
	minorAxis: string;
}

// Instead of sharing a schema, prepare a schema creator
function createSchema() {
	return z.object({
		depth: z.number().min(0, {
			message: 'Maximum depth must be positive.'
		})
	});
}

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

export async function action({ request }: ActionFunctionArgs) {
	const userId = await protectedRoute(request);
	const formData = await request.formData();
	const submission = await parseWithZod(formData, {
		schema: createSchema(),
		async: true
	});

	if (submission.status !== 'success') {
		return json(submission.reply());
	}

	const { depth } = submission.value;

	const updatedHailpad = await db
		.update(hailpad)
		.set({
			maxDepth: depth,
			updatedBy: userId,
			updatedAt: new Date()
		})
		.returning({
			id: hailpad.id
		});

	if (updatedHailpad.length != 1) {
		throw new Error('Error updating hailpad with max. depth');
	}

	return redirect(`/hailgen/${updatedHailpad[0]}`);
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
					<CardDescription>The following region was identified to contain the greatest depth relative to the rest of the hailpad. Enter the mm measurement of this depth.</CardDescription>
				</CardHeader>
				<FormProvider context={form.context}>
					<Form method="post" id={form.id} onSubmit={form.onSubmit}>
						<CardContent className="grid gap-2">
							<div>
								<Label htmlFor={fields.depth.id}>Maximum Depth</Label>
								<Input
									key={fields.depth.key}
									name={fields.depth.name}
									defaultValue={fields.depth.initialValue}
									placeholder="Maximum Depth"
								/>
								<p className="text-sm text-primary/60">{fields.depth.errors}</p>
							</div>
						</CardContent>
						<CardFooter>
							<Button type="submit">Done</Button>
						</CardFooter>
					</Form>
				</FormProvider>
			</Card>
		</main>
	);
}
