import { LoaderFunctionArgs, json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
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
		throw new Response('Hailpad not found', { status: 404 });
	}

	const queriedHailpad = await db.query.hailpad.findFirst({
		where: eq(hailpad.id, id)
	});

	if (!queriedHailpad) {
		throw new Response('Path not found', { status: 404 });
	}

	const url = new URL(request.url);

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
	const hailpadName = queriedHailpad.name;

	return json({
		dents,
		depthMapPath,
		boxfit,
		hailpadName
	});
}

export default function () {
	const data = useLoaderData<typeof loader>();

	const [currentIndex, setCurrentIndex] = useState<number>(0);
	const [showCentroids, setShowCentroids] = useState<boolean>(false);
	const [download, setDownload] = useState<boolean>(false);
	const [dentData, setDentData] = useState<HailpadDent[]>([]);

	const { dents, depthMapPath, boxfit, hailpadName } = data;

	useEffect(() => {
		const scaledDents = dents.map((dent: HailpadDent) => {
			return {
				angle: dent.angle,
				centroidX: dent.centroidX,
				centroidY: dent.centroidY,
				majorAxis: String(Number(dent.majorAxis) / 1000 * Number(boxfit)),
				minorAxis: String(Number(dent.minorAxis) / 1000 * Number(boxfit))
			};
		});
		setDentData(scaledDents);
	}, []);

	useEffect(() => {
		if (download) {
			setDownload(false);
			// TODO: Updated download method
		}
	}, [download]);

	return (
		<div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-2">
			<Card className="row-span-2 h-min lg:col-span-2">
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
			<HailpadDetails
				dentData={dentData}
				onFilterChange={() => { }} // TODO
				onShowCentroids={setShowCentroids}
				onDownload={setDownload}
			/>
			<DentDetails dentData={dentData} index={currentIndex} onIndexChange={setCurrentIndex} />
		</div>
	);
}
