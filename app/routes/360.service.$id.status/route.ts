import { parseWithZod } from '@conform-to/zod';
import { ActionFunctionArgs, json, LoaderFunctionArgs } from '@remix-run/node';
import { eq } from 'drizzle-orm';
import { db } from '~/db/db.server';
import { paths } from '~/db/schema';
import { env } from '~/env.server';
import { protectedRoute } from '~/lib/auth.server';
import { StatusResponseSchema, StatusUpdateSchema } from '~/lib/service-360';

export async function loader({ params, request }: LoaderFunctionArgs) {
	const id = params.id;

	if (!id) {
		return new Response(null, { status: 400, statusText: 'No ID was specified' });
	}

	await protectedRoute(request);

	try {
		const path = await db.query.paths.findFirst({
			where: eq(paths.id, id)
		});

		if (!path) {
			return new Response(null, { status: 404, statusText: 'Could not find the requested path' });
		}

		if (!env.SERVICE_360_ENABLED)
			return new Response(null, { status: 400, statusText: 'Service not enabled' });

		const response = await fetch(new URL(`${env.SERVICE_360_URL}/${path.id}/status`));

		if (!response.ok) {
			return new Response(null, { status: 500, statusText: 'Service failed to respond' });
		}

		const status = StatusResponseSchema.parse(await response.json());

		return json({
			completed: status.task_status.completed,
			progress: status.task_status.progress
		});
	} catch (error) {
		return new Response(null, { status: 500, statusText: 'Internal server error' });
	}
}

export async function action({ request, params }: ActionFunctionArgs) {
	const id = params.id;

	if (!id) {
		return new Response(null, { status: 400 });
	}

	const authHeader = request.headers.get('Authorization');

	if (!authHeader) {
		return new Response(null, { status: 401 });
	}

	if (!authHeader.startsWith('Bearer ')) {
		return new Response(null, { status: 401 });
	}

	const key = authHeader.split(' ')[1];

	// Check key
	if (key !== env.SERVICE_360_KEY) {
		return new Response(null, { status: 401 });
	}

	const submission = parseWithZod(await request.json(), {
		schema: StatusUpdateSchema
	});

	if (submission.status !== 'success') {
		return new Response(null, { status: 400 });
	}

	const update = await db
		.update(paths)
		.set({
			status: submission.value.status
		})
		.where(eq(paths.id, id));

	if (update.rowCount !== 1) {
		return new Response(null, { status: 404 });
	}

	return new Response(null, { status: 200 });
}