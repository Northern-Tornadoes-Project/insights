import { json, LoaderFunctionArgs, MetaFunction, redirect } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { and, eq } from 'drizzle-orm';
import { lazy, Suspense } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { z } from 'zod';
import { Fallback } from '~/components/fallback';
import { db } from '~/db/db.server';
import { paths, pathSegments } from '~/db/schema';
import { env } from '~/env.server';

export const meta: MetaFunction = () => {
	return [{ title: 'NTP Insights - 360 iFrame View' }];
};

const Viewer360 = lazy(() => import('~/components/360/viewer-360.client'));

const JUMP_SIZE = 5;

export async function loader({ params, request }: LoaderFunctionArgs) {
	const { id } = params;

	if (!id) {
		throw new Response(null, { status: 404, statusText: 'Path not found' });
	}

	const path = await db.query.paths.findFirst({
		where: eq(paths.id, id)
	});

	if (!path) {
		throw new Response(null, { status: 404, statusText: 'Path not found' });
	}

	if (!path.frameposData) {
		throw new Response(null, { status: 404, statusText: 'Path not initialized' });
	}

	const url = new URL(request.url);
	const index = Number(url.searchParams.get('index') || url.searchParams.get('i') || 0);

	if (isNaN(index) || index < 0 || index >= path.frameposData?.length) {
		throw new Response(null, { status: 404, statusText: 'Invalid index' });
	}

	const pathSegment = await db.query.pathSegments.findFirst({
		where: and(eq(pathSegments.pathId, id), eq(pathSegments.index, index)),
		with: {
			capture: true,
			streetView: true
		}
	});

	if (!pathSegment) {
		throw new Response(null, { status: 404, statusText: 'Path segment not found' });
	}

	// Capture state
	const state = z
		.enum(['before', 'after'])
		.safeParse(url.searchParams.get('state') || url.searchParams.get('s') || 'after');

	if (!state.success) {
		throw new Response(null, { status: 404, statusText: 'Invalid state' });
	}

	if (state.data === 'before' && !pathSegment.streetView) {
		return redirect(`/360/${id}/?index=${index}&state=after`);
	}

	const capture = state.data === 'before' ? pathSegment.streetView : pathSegment.capture;

	if (!capture) {
		throw new Response(null, { status: 404, statusText: 'Capture not found' });
	}

	return json({
		path: {
			index,
			capture: capture,
			captureURL: new URL(
				`${env.BASE_URL}/${env.PUBLIC_PATH_DIRECTORY}/${path.folderName}/${capture.file_name}`
			).href,
			currentState: state.data,
			pathProgress: {
				hasBefore: pathSegment.streetView !== null,
				hasNext: index < path.frameposData.length - 1,
				hasPrevious: index > 0,
				hasNextJump: index < path.frameposData.length - JUMP_SIZE,
				hasPreviousJump: index > JUMP_SIZE
			}
		}
	});
}

export default function () {
	const navigate = useNavigate();
	const data = useLoaderData<typeof loader>();

	return (
		<Suspense fallback={<Fallback />}>
			<ClientOnly fallback={<Fallback />}>
				{() => (
					<Viewer360
						capture={{
							...data.path.capture,
							uploadedAt: new Date(data.path.capture.uploadedAt),
							takenAt: new Date(data.path.capture.takenAt)
						}}
						captureURL={data.path.captureURL}
						currentState={data.path.currentState}
						pathProgress={data.path.pathProgress}
						onCurrentStateChange={(state) => {
							navigate({
								search: `?index=${data.path.index}&state=${state}`
							});
						}}
						onNext={() => {
							navigate({
								search: `?index=${data.path.index + 1}&state=${data.path.currentState}`
							});
						}}
						onPrevious={() => {
							navigate({
								search: `?index=${data.path.index - 1}&state=${data.path.currentState}`
							});
						}}
						onJumpNext={() => {
							navigate({
								search: `?index=${data.path.index + JUMP_SIZE}&state=${data.path.currentState}`
							});
						}}
						onJumpPrevious={() => {
							navigate({
								search: `?index=${data.path.index - JUMP_SIZE}&state=${data.path.currentState}`
							});
						}}
						// Scale based on the height of the card
						className="relative h-full min-h-96 overflow-hidden rounded-md"
					/>
				)}
			</ClientOnly>
		</Suspense>
	);
}
