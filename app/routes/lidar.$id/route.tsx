import { ActionFunctionArgs, json, LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { eq } from 'drizzle-orm';
import { lazy, Suspense } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Fallback } from '~/components/fallback';
import { actionSchema, ViewerSettings, viewerSettingsSchema } from '~/components/lidar/schema';
import { db } from '~/db/db.server';
import { scans } from '~/db/schema';
import { env } from '~/env.server';
import { protectedRoute } from '~/lib/auth.server';
import { Options } from './options';

const Renderer = lazy(() => import('~/components/lidar/renderer.client'));

export async function action({ params, request }: ActionFunctionArgs) {
	await protectedRoute(request);

	const id = params.id;

	if (!id) {
		throw new Response(null, { status: 404, statusText: 'Scan not found' });
	}

	const { data, success, error } = actionSchema.safeParse(await request.json());

	if (!success) {
		console.error(`[LiDAR Action] Error has occurred`, error);
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

export async function loader({ params }: LoaderFunctionArgs) {
	const id = params.id;

	if (!id) {
		throw new Response(null, { status: 404, statusText: 'Scan not found' });
	}

	const scan = await db.query.scans.findFirst({
		columns: {
			viewerSettings: true,
			folderName: true
		},
		where: eq(scans.id, id)
	});

	if (!scan) {
		throw new Response(null, { status: 404, statusText: 'Scan not found' });
	}

	const settings = viewerSettingsSchema.parse(scan.viewerSettings);
	const url = `${env.PUBLIC_SCAN_DIRECTORY}/${scan.folderName}/output`;

	return json({
		url,
		settings
	});
}

export default function () {
	const { url, settings } = useLoaderData<typeof loader>();
	const initialTransform: ViewerSettings = settings;

	return (
		<main className="flex flex-col justify-between gap-2 lg:flex-row">
			<div className="h-[300px] w-full min-w-0 lg:h-[500px] 2xl:h-[750px]">
				<Suspense fallback={<Fallback />}>
					<ClientOnly fallback={<Fallback />}>
						{() => <Renderer url={url} initialTransform={initialTransform} debug={true} />}
					</ClientOnly>
				</Suspense>
			</div>
			<Options className="lg:min-w-96" />
		</main>
	);
}
