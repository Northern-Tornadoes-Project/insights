import { ActionFunctionArgs, LoaderFunctionArgs, json } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';
import { eq } from 'drizzle-orm';
import { Suspense, lazy, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { db } from '~/db/db.server';
import { dent, hailpad } from '~/db/schema';
import { env } from '~/env.server';

import DentDetails from './dent-details';
import HailpadDetails from './hailpad-details';

const HailpadMap = lazy(() => import('./hailpad-map'));

interface HailpadDent {
	// TODO: Use shared interface
	angle: string | null;
	centroidX: string;
	centroidY: string;
	majorAxis: string;
	minorAxis: string;
}

export async function loader({ params, request }: LoaderFunctionArgs) {
	const { id } = params;

	if (!id) {
		throw new Response(null, { status: 404, statusText: 'Hailpad not found' });
	}

	const queriedHailpad = await db.query.hailpad.findFirst({
		where: eq(hailpad.id, id)
	});

	if (!queriedHailpad) {
		throw new Response(null, { status: 404, statusText: 'Hailpad not found' });
	}

	const dents = await db
		.select({
			angle: dent.angle,
			centroidX: dent.centroidX,
			centroidY: dent.centroidY,
			majorAxis: dent.majorAxis,
			minorAxis: dent.minorAxis
		})
		.from(dent)
		.where(eq(dent.hailpadId, queriedHailpad.id));

	const depthMapPath = `${env.BASE_URL}/${env.PUBLIC_HAILPAD_DIRECTORY}/${queriedHailpad.folderName}/dmap.png`;
	const boxfit = queriedHailpad.boxfit;
	const maxDepth = "0"; // TODO
	const adaptiveBlockSize = queriedHailpad.adaptiveBlockSize;
	const adaptiveC = queriedHailpad.adaptiveC;
	const hailpadId = queriedHailpad.id;
	const hailpadName = queriedHailpad.name;

	return json({
		dents,
		depthMapPath,
		boxfit,
		maxDepth,
		adaptiveBlockSize,
		adaptiveC,
		hailpadId,
		hailpadName
	});
}

export async function action({ request }: ActionFunctionArgs) {
	// const formData = await request.formData();
	// const boxfit = formData.get('boxfit');

    const boxfitFetcher = useFetcher({ key: "boxfit"});

	console.log('hello');

	const boxfit = await boxfitFetcher.formData?.get('boxfit');
	// const boxfit = formData.get('boxfit');

	const hailpadId = useLoaderData<typeof loader>().hailpadId;

	console.log(boxfit);

	if (!boxfit) return;

	await db
		.update(hailpad)
		.set({
			boxfit: boxfit.toString(),
			// updatedBy: TODO,
			updatedAt: new Date()
		})
		.where(eq(hailpad.id, hailpadId));
}

export default function () {
	const data = useLoaderData<typeof loader>();
	// const fetcher = useFetcher();

	const [currentIndex, setCurrentIndex] = useState<number>(0);
	const [showCentroids, setShowCentroids] = useState<boolean>(false);
	const [download, setDownload] = useState<boolean>(false);
	const [dentData, setDentData] = useState<HailpadDent[]>([]);

	const { dents,
		depthMapPath,
		boxfit,
		maxDepth,
		adaptiveBlockSize,
		adaptiveC,
		hailpadName
	} = data;

	useEffect(() => {
		// Convert major and minor axes from px to mm based on boxfit length
		const scaledDents = dents.map((dent: HailpadDent) => {
			return {
				angle: dent.angle,
				centroidX: dent.centroidX,
				centroidY: dent.centroidY,
				majorAxis: String((Number(dent.majorAxis) / 1000) * Number(boxfit)),
				minorAxis: String((Number(dent.minorAxis) / 1000) * Number(boxfit))
			};
		});
		setDentData(scaledDents);
	}, []);

	useEffect(() => {
		if (download) {
			setDownload(false);

			// Prepare dent data for CSV
			const headers = ['Minor Axis (mm)', 'Major Axis (mm)'];
			const csvData = dentData.map((dent) => {
				return `${dent.minorAxis},${dent.majorAxis}`;
			});

			// Prepend headers to CSV data
			csvData.unshift(headers.join(','));
			const csv = csvData.join('\n');
			const blob = new Blob([csv], { type: 'text/csv' });

			// Download CSV
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${hailpadName}.csv`;
			a.click();
		}
	}, [download]);

	return (
		<div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-5">
			<Card className="row-span-5 h-min lg:col-span-2">
				<CardHeader>
					<CardTitle>{hailpadName}</CardTitle>
					<CardDescription>
						View the interactable hailpad depth map with dent analysis.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Suspense
						fallback={
							<div className="overflow-hidden rounded-md">
								<div className="flex h-full flex-col items-center justify-center">
									<div className="text-2xl font-bold">Loading</div>
								</div>
							</div>
						}
					>
						<HailpadMap
							index={currentIndex}
							dentData={dentData}
							depthMapPath={depthMapPath}
							showCentroids={showCentroids}
							onIndexChange={setCurrentIndex}
						/>
					</Suspense>
				</CardContent>
			</Card>
			<div className="lg:row-span-3">
				<HailpadDetails
					dentData={dentData}
					boxfit={boxfit}
					maxDepth={maxDepth}
					adaptiveBlockSize={adaptiveBlockSize}
					adaptiveC={adaptiveC}
					// fetcher={fetcher}
					onFilterChange={() => { }} // TODO
					onShowCentroids={setShowCentroids}
					onDownload={setDownload}
				/>
			</div>
			<div className="lg:row-span-2">
				<DentDetails
					dentData={dentData}
					index={currentIndex}
					onPrevious={() => {
						if (currentIndex - 1 >= 0) {
							setCurrentIndex(currentIndex - 1);
						} else {
							setCurrentIndex(dentData.length - 1);
						}
					}}
					onNext={() => {
						if (currentIndex + 1 < dentData.length) {
							setCurrentIndex(currentIndex + 1);
						} else {
							setCurrentIndex(0);
						}
					}}
					onIndexChange={setCurrentIndex}
				/>
			</div>
		</div>
	);
}
