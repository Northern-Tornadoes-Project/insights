import { ActionFunctionArgs, json, LoaderFunctionArgs } from '@remix-run/node';
import { eq } from 'drizzle-orm';
import { db } from '~/db/db.server';
import { hailpad, dent } from '~/db/schema';
import { env } from '~/env.server';
import { protectedRoute } from '~/lib/auth.server';
import { uploadEventBus } from '~/lib/event-bus.server';
import { StatusResponseSchema, StatusUpdateSchema } from '~/lib/service-hailgen';
import { UploadStatusEvent } from './hailgen.new.$id.mesh/route';

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

	const data = await request.json();

	// const status = data.status !== 'pending' ? data.status : 'processing'; TODO: Remove

	// const update = await db
	// 	.update(hailpad)
	// 	.set({
	// 		status
	// 	})
	// 	.where(eq(hailpad.id, id));

	interface HailpadDent {
		// TODO: Use shared interface
		id: string;
		angle: string | null;
		centroidX: string;
		centroidY: string;
		majorAxis: string;
		minorAxis: string;
		maxDepth: string;
	}

	const dents = data.dents;

	dents.forEach(async (hailpadDent: HailpadDent) => {
		const newDent = await db
			.insert(dent)
			.values({
				hailpadId: id,
				angle: hailpadDent.angle,
				majorAxis: hailpadDent.majorAxis,
				minorAxis: hailpadDent.minorAxis,
				maxDepth: hailpadDent.maxDepth,
				centroidX: hailpadDent.centroidX,
				centroidY: hailpadDent.centroidY
			})
			.returning();

		if (newDent.length != 1) {
			throw new Error('Error creating dent');
		}
	});

	// Emit an event to the status bus to notify the client of the status change
	uploadEventBus.emit<UploadStatusEvent>({
		id,
		dents: data.dents,
		maxDepthLocation: data.maxDepthLocation,
	});

	// if (update.rowCount !== 1) return new Response(null, { status: 404 });

	return new Response(null, { status: 200 });
}
