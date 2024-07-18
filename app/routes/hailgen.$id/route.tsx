import { LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { eq } from 'drizzle-orm';
import { ClientOnly } from 'remix-utils/client-only';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from '~/components/ui/card';
import { db } from '~/db/db.server';
import { hailpad, dent } from '~/db/schema';
import { env } from '~/env.server';
import { lazy, useEffect, useState } from 'react';

const HailpadMap = lazy(() => import('./hailpad-map'));

interface HailpadDent { // TODO: Use shared interface
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

	return {
		queriedHailpad,
		hailpadURL: `${url.origin}${env.PUBLIC_PATH_DIRECTORY}/${hailpad.folderName}/${hailpad.id}`,
	};
}

function HailpadDetail({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col">
			<p className="text-sm text-muted-foreground">{label}</p>
			<p>{value}</p>
		</div>
	);
}

export default function () {
	const data = useLoaderData<typeof loader>();

	const [currentIndex, setCurrentIndex] = useState<number>(0);
	const [showCentroids, setShowCentroids] = useState<boolean>(false);
	const [download, setDownload] = useState<boolean>(false);
	const [dentData, setDentData] = useState<HailpadDent[]>([]);

	const { queriedHailpad } = data;
	const depthMapPath = `${data.hailpadURL}/dmap.png`;

	const getDentData = async () => {
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

		setDentData(dents);
	};

	useEffect(() => {
		getDentData();
	}), [];

	useEffect(() => {
		if (download) {
			setDownload(false);
			// TODO: Updated download method
		}
	}, [download]);

	return (
		<div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-3 lg:grid-rows-2">
			<Card className="row-span-2 lg:col-span-2 h-min">
				<CardHeader>
					<CardTitle>Hailpad Viewer</CardTitle>
					<CardDescription>View the interactable hailpad depth map with dent analysis.</CardDescription>
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
							<HailpadMap
								index={currentIndex}
								dentData={dentData}
								depthMapPath={depthMapPath}
								showCentroids={showCentroids}
								onIndexChange={setCurrentIndex}
							/>
						)}
					</ClientOnly>
				</CardContent>
			</Card>
		</div>
	);
}
