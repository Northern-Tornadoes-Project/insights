import { LoaderFunctionArgs, redirect } from '@remix-run/node';
import { useLoaderData, useNavigate } from '@remix-run/react';
import { and, eq } from 'drizzle-orm';
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
import { db } from '~/db/db.server';
import { pathSegments, paths } from '~/db/schema';
import { env } from '~/env.server';
import { FramePicker } from './frame-picker';
import { Viewer360 } from './viewer-360.client';

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

function CaptureDetail({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col">
			<p className="text-sm text-muted-foreground">{label}</p>
			<p>{value}</p>
		</div>
	);
}

export default function () {
	const navigate = useNavigate();
	const data = useLoaderData<typeof loader>();

	return (
		<div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-2">
			<Card className="row-span-2 lg:col-span-2 h-min">
				<CardHeader>
					<CardTitle>360 Viewer</CardTitle>
					<CardDescription>View the path in 360 with before and after imagery.</CardDescription>
				</CardHeader>
				<CardContent>
					<ClientOnly
						fallback={
							<div className="relative h-[500px] overflow-hidden rounded-md lg:h-[505px]">
								<div className="flex h-full flex-col items-center justify-center">
									<div className="text-2xl font-bold">Loading</div>
								</div>
							</div>
						}
					>
						{() => (
							<Viewer360
								capture={{
									...data.capture,
									uploadedAt: new Date(data.capture.uploadedAt),
									takenAt: new Date(data.capture.takenAt)
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
								className="relative h-[500px] overflow-hidden rounded-md lg:h-[550px]"
							/>
						)}
					</ClientOnly>
				</CardContent>
			</Card>
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
							new Date(data.capture.takenAt)
						)}
					/>
					<CaptureDetail
						label="Location"
						value={`${Number(data.capture.lat).toFixed(4)}, ${Number(data.capture.lng).toFixed(4)}`}
					/>
					<CaptureDetail
						label="Altitude"
						value={data.capture.altitude ? `${Number(data.capture.altitude).toFixed(2)} m` : 'N/A'}
					/>
					<CaptureDetail
						label="Distance (from start)"
						value={data.capture.distance ? `${Number(data.capture.distance).toFixed(2)} m` : 'N/A'}
					/>
					<CaptureDetail
						label="Size"
						value={`${(data.capture.size / 1024 / 1024).toFixed(2)} MB`}
					/>
				</CardContent>
				<CardFooter>
					<FramePicker
						index={data.index + 1}
						length={data.path.frameposData?.length}
						onJump={(index) => {
							navigate({
								search: `?index=${index}&state=${data.currentState}`
							});
						}}
					/>
				</CardFooter>
			</Card>
		</div>
	);
}
