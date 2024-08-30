import { ActionFunctionArgs, json, LoaderFunctionArgs } from '@remix-run/node';
import { eq, inArray } from 'drizzle-orm';
import { db } from '~/db/db.server';
import { captures, paths, pathSegments } from '~/db/schema';
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

		if (!path)
			return new Response(null, { status: 404, statusText: 'Could not find the requested path' });

		if (!env.SERVICE_360_ENABLED)
			return new Response(null, { status: 400, statusText: 'Service not enabled' });

		const response = await fetch(new URL(`${env.SERVICE_360_URL}/${path.id}/status`));

		if (!response.ok)
			return new Response(null, { status: 500, statusText: 'Service failed to respond' });

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
		console.log(`[360 Service] Unauthorized access attempt with no header`);
		return new Response(null, { status: 401 });
	}

	const authParts = authHeader.split(' ');

	if (authParts.length !== 2) {
		console.log(
			`[360 Service] Unauthorized access attempt with header not containing 2 parts: ${authHeader}`
		);
		return new Response(null, { status: 401 });
	}

	if (authParts[0] !== 'Bearer' && authParts[1] !== env.SERVICE_360_KEY) {
		console.log(`[360 Service] Unauthorized access attempt with key: ${authParts[1]}`);
		return new Response(null, { status: 401 });
	}

	const { data, error, success } = StatusUpdateSchema.safeParse(await request.json());

	if (!success)
		return json(
			{
				error
			},
			{ status: 400 }
		);

	const update = await db
		.update(paths)
		.set({
			status: data.status
		})
		.where(eq(paths.id, id));

	if (update.rowCount !== 1) return new Response(null, { status: 404 });

	if (data.status === 'complete') {
		try {
			// Update the updated_at field of the captures
			const capturesToUpdate = await db
				.update(pathSegments)
				.set({
					updateAt: new Date()
				})
				.where(eq(pathSegments.pathId, id))
				.returning({
					captureId: pathSegments.captureId
				});

			await db
				.update(captures)
				.set({
					uploadedAt: new Date()
				})
				.where(
					inArray(
						captures.id,
						capturesToUpdate.map((capture) => capture.captureId)
					)
				);
		} catch (error) {
			console.error(
				`[360 Service] Failed to update the updated_at field of the captures: ${error}`
			);
		}
	}

	return new Response(null, { status: 200 });
}
