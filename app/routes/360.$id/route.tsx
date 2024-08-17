import { json, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { and, eq } from 'drizzle-orm';
import { lazy, Suspense } from 'react';
import { ClientOnly } from 'remix-utils/client-only';
import { z } from 'zod';
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '~/components/ui/card';
import { Skeleton } from '~/components/ui/skeleton';
import { db } from '~/db/db.server';
import { paths, pathSegments } from '~/db/schema';
import { env } from '~/env.server';
import { FrameposSchema } from '~/lib/framepos';
import { FramePicker } from './frame-picker';
import { Fallback } from '~/components/fallback';

const Viewer360 = lazy(() => import('~/components/360/viewer-360.client'));
const PathMap = lazy(() => import('~/components/path-map'));

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
		ENV: {
			MAPBOX_KEY: env.MAPBOX_KEY
		},
		path: {
			index,
			eventDate: path.eventDate,
			segments: z
				.array(FrameposSchema)
				.parse(path.frameposData)
				.map((framepos) => ({
					lng: framepos.lon,
					lat: framepos.lat
				})),
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

function CaptureDetail({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col">
			<p className="text-sm text-muted-foreground">{label}</p>
			<p>{value}</p>
		</div>
	);
}

function ViewerFallback() {
	return (
		<div className="overflow-hidden rounded-md">
			<Fallback />
		</div>
	);
}

export default function () {
	const navigate = useNavigate();
	const data = useLoaderData<typeof loader>();

	return (
		<div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-2">
			<div className="row-span-2 rounded-lg border bg-card p-6 text-card-foreground shadow-sm lg:col-span-2">
				<Suspense fallback={<ViewerFallback />}>
					<ClientOnly fallback={<ViewerFallback />}>
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
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Capture Details</CardTitle>
					<CardDescription>About the current 360 view.</CardDescription>
				</CardHeader>
				<CardContent className="grid grid-cols-2 gap-4">
					<CaptureDetail
						label="Event date"
						value={new Intl.DateTimeFormat('en-CA', { dateStyle: 'long' }).format(
							new Date(data.path.eventDate)
						)}
					/>
					<CaptureDetail
						label="Capture date"
						value={new Intl.DateTimeFormat('en-CA', { dateStyle: 'long' }).format(
							new Date(data.path.capture.takenAt)
						)}
					/>
					<CaptureDetail
						label="Location"
						value={`${Number(data.path.capture.lat).toFixed(4)}, ${Number(data.path.capture.lng).toFixed(4)}`}
					/>
					<CaptureDetail
						label="Altitude"
						value={
							data.path.capture.altitude
								? `${Number(data.path.capture.altitude).toFixed(2)} m`
								: 'N/A'
						}
					/>
					<CaptureDetail
						label="Distance (from start)"
						value={
							data.path.capture.distance
								? `${Number(data.path.capture.distance).toFixed(2)} m`
								: 'N/A'
						}
					/>
					<CaptureDetail
						label="Size"
						value={`${(data.path.capture.size / 1024 / 1024).toFixed(2)} MB`}
					/>
				</CardContent>
				<CardFooter>
					<FramePicker
						index={data.path.index + 1}
						length={data.path.segments.length}
						onJump={(index) => {
							navigate({
								search: `?index=${index}&state=${data.path.currentState}`
							});
						}}
					/>
				</CardFooter>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Path Overview</CardTitle>
					<CardDescription>View the entire path and your current viewing position.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="h-64 w-full overflow-hidden rounded-md">
						<Suspense fallback={<Skeleton />}>
							<PathMap
								segments={data.path.segments}
								onSegmentClick={(index) => {
									navigate({
										search: `?index=${index}&state=${data.path.currentState}`
									});
								}}
								currentSegment={data.path.segments[data.path.index]}
								token={data.ENV.MAPBOX_KEY}
							/>
						</Suspense>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
