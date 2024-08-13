import { ActionFunctionArgs } from '@remix-run/node';
import { eq } from 'drizzle-orm';
import { Suspense, lazy } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Skeleton } from '~/components/ui/skeleton';
import { db } from '~/db/db.server';
import { scans } from '~/db/schema';
import { protectedRoute } from '~/lib/auth.server';
import { Options } from './options';
import { actionSchema, viewerSettingsSchema } from './schema';

const Renderer = lazy(() => import('./renderer.client'));

export async function action({ params, request }: ActionFunctionArgs) {
	await protectedRoute(request);

	const id = params.id;

	if (!id) {
		throw new Response(null, { status: 404, statusText: 'Scan not found' });
	}

	const { data, success, error } = actionSchema.safeParse(await request.json());

	if (!success) {
		throw new Response(JSON.stringify(error), { status: 400 });
	}

	const scan = await db.query.scans.findFirst({
		columns: {
			viewerSettings: true
		},
		where: eq(scans.id, id)
	});

	if (!scan) {
		throw new Response(null, { status: 404, statusText: 'Scan not found' });
	}

	const oldSettings = viewerSettingsSchema.parse(scan.viewerSettings);

	switch (data.type) {
		case 'setTransform': {
			const newSettings = viewerSettingsSchema.parse({
				...oldSettings,
				...data.payload
			});
			await db.update(scans).set({
				viewerSettings: newSettings
			});
			return new Response(null, { status: 204 });
		}
		default:
			throw new Response(null, { status: 400, statusText: 'Invalid action type' });
	}
}

export default function () {
	return (
		<main className="flex flex-col justify-between gap-2 xl:flex-row">
			<div className="h-[500px] w-full xl:h-[1000px]">
				<Suspense fallback={<Skeleton />}>
					<ClientOnly fallback={<Skeleton />}>{() => <Renderer />}</ClientOnly>
				</Suspense>
			</div>
			<Options />
		</main>
	);
}
