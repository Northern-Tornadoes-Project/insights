import { json, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { eq } from 'drizzle-orm';
import { lazy, Suspense } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { Fallback } from '~/components/fallback';
import { ViewerSettings, viewerSettingsSchema } from '~/components/lidar/schema';
import { db } from '~/db/db.server';
import { scans } from '~/db/schema';
import { env } from '~/env.server';

export const meta: MetaFunction = () => {
	return [{ title: 'NTP Insights - LiDAR iFrame View' }];
};

const Renderer = lazy(() => import('~/components/lidar/renderer.client'));

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
		<Suspense fallback={<Fallback />}>
			<ClientOnly fallback={<Fallback />}>
				{() => <Renderer url={url} initialTransform={initialTransform} />}
			</ClientOnly>
		</Suspense>
	);
}
