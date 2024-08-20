import { ActionFunctionArgs, json, LoaderFunctionArgs } from '@remix-run/node';
import { eq } from 'drizzle-orm';
import { db } from '~/db/db.server';
import { hailpad } from '~/db/schema';
import { env } from '~/env.server';
import { protectedRoute } from '~/lib/auth.server';
import { StatusResponseSchema, StatusUpdateSchema } from '~/lib/service-hailgen';

export async function loader({ params, request }: LoaderFunctionArgs) {
	const id = params.id;

	if (!id) {
		return new Response(null, { status: 400, statusText: 'No ID was specified' });
	}

	await protectedRoute(request);

	try {
		const queriedHailpad = await db.query.hailpad.findFirst({
			where: eq(hailpad.id, id),
			columns: {
				id: true
			}
		});

		if (!queriedHailpad)
			return new Response(null, { status: 404, statusText: 'Could not find the requested hailpad' });

		if (!env.SERVICE_HAILGEN_ENABLED)
			return new Response(null, { status: 400, statusText: 'Service not enabled' });

		const response = await fetch(new URL(`${env.SERVICE_HAILGEN_URL}/${queriedHailpad.id}/status`));

		if (!response.ok)
			return new Response(null, { status: 500, statusText: 'Service failed to respond' });

		const status = StatusResponseSchema.parse(await response.json());

		return json(status);
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
		console.log(`[Hailgen Service] Unauthorized access attempt with no header`);
		return new Response(null, { status: 401 });
	}

	const authParts = authHeader.split(' ');

	if (authParts.length !== 2) {
		console.log(
			`[Hailgen Service] Unauthorized access attempt with header not containing 2 parts: ${authHeader}`
		);
		return new Response(null, { status: 401 });
	}

	if (authParts[0] !== 'Bearer' && authParts[1] !== env.SERVICE_HAILGEN_KEY) {
		console.log(`[Hailgen Service] Unauthorized access attempt with key: ${authParts[1]}`);
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

	const status = data.status !== 'pending' ? data.status : 'processing';

	const update = await db
		.update(hailpad)
		.set({
			status
		})
		.where(eq(hailpad.id, id));

	if (update.rowCount !== 1) return new Response(null, { status: 404 });

	return new Response(null, { status: 200 });
}
