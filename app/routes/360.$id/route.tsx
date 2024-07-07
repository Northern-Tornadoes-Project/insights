import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { Viewer360 } from '~/components/viewer-360';
import { db } from '~/db/db.server';
import { pathSegments, paths } from '~/db/schema';
import { env } from '~/env.server';

const JUMP_SIZE = 5;

export async function loader({ params, request }: LoaderFunctionArgs) {
	const { id } = params;

	if (!id) {
		throw new Response('Path not found', { status: 404 });
	}

	const path = await db.query.paths.findFirst({
		where: eq(paths.id, id)
	});

	if (!path) {
		throw new Response('Path not found', { status: 404 });
	}

	if (!path.frameposData) {
		throw new Response('Path not initialized', { status: 404 });
	}

	const url = new URL(request.url);
	const index = Number(url.searchParams.get('index') || url.searchParams.get('i') || 0);

	if (isNaN(index) || index < 0 || index >= path.frameposData?.length) {
		throw new Response('Invalid index', { status: 404 });
	}

	const pathSegment = await db.query.pathSegments.findFirst({
		where: and(eq(pathSegments.pathId, id), eq(pathSegments.index, index)),
		with: {
			capture: true,
			streetView: true
		}
	});

	if (!pathSegment) {
		throw new Response('Path segment not found', { status: 404 });
	}

	// Capture state
	const state = z
		.enum(['before', 'after'])
		.safeParse(url.searchParams.get('state') || url.searchParams.get('s') || 'after');

	if (!state.success) {
		throw new Response('Invalid state', { status: 404 });
	}

	if (state.data === 'before' && !pathSegment.streetView) {
		return redirect(`/360/${id}/?index=${index}&state=after`);
	}

	const capture = state.data === 'before' ? pathSegment.streetView : pathSegment.capture;

	if (!capture) {
		throw new Response('Capture not found', { status: 404 });
	}

	return {
		index,
		path,
		capture: capture,
		captureURL: `${url.origin}${env.PUBLIC_PATH_DIRECTORY}/${path.folderName}/${capture.file_name}`,
		currentState: state.data,
		pathProgress: {
			hasBefore: pathSegment.streetView !== null,
			hasNext: index < path.frameposData.length - 1,
			hasPrevious: index > 0,
			hasNextJump: index < path.frameposData.length - JUMP_SIZE,
			hasPreviousJump: index > JUMP_SIZE
		}
	};
}

export default function () {
	const navigate = useNavigate();
	const data = useLoaderData<typeof loader>();

	return (
		<div>
			<h1>{data.path.name}</h1>
			<div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-6 lg:grid-rows-2">
				<Viewer360
					capture={{
						...data.capture,
						uploadedAt: new Date(data.capture.uploadedAt)
					}}
					captureURL={data.captureURL}
					currentState={data.currentState}
					pathProgress={data.pathProgress}
					onCurrentStateChange={(state) => {
						navigate({
							search: `?index=${data.index}&state=${state}`
						});
					}}
					onNext={() => {
						navigate({
							search: `?index=${data.index + 1}&state=${data.currentState}`
						});
					}}
					onPrevious={() => {
						navigate({
							search: `?index=${data.index - 1}&state=${data.currentState}`
						});
					}}
					onJumpNext={() => {
						navigate({
							search: `?index=${data.index + JUMP_SIZE}&state=${data.currentState}`
						});
					}}
					onJumpPrevious={() => {
						navigate({
							search: `?index=${data.index - JUMP_SIZE}&state=${data.currentState}`
						});
					}}
					className="relative row-span-2 h-[500px] overflow-hidden rounded-md lg:col-span-4 lg:h-[505px]"
				/>
			</div>
		</div>
	);
}
