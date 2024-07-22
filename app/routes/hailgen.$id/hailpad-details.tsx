import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';

interface HailpadDent {
	// TODO: Use shared interface
	angle: string | null;
	centroidX: string;
	centroidY: string;
	majorAxis: string;
	minorAxis: string;
}

function Detail({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col">
			<p className="text-sm text-muted-foreground">{label}</p>
			<p>{value}</p>
		</div>
	);
}

function DetailSection({ min, max, avg }: { min: number; max: number; avg: number }) {
	const minStr = min.toFixed(2).toString();
	const maxStr = max.toFixed(2).toString();
	const avgStr = avg.toFixed(2).toString();

	return (
		<div className="mt-4 grid grid-cols-3 gap-4">
			<Detail label="Minimum" value={`${minStr} mm`} />
			<Detail label="Maximum" value={`${maxStr} mm`} />
			<Detail label="Average" value={`${avgStr} mm`} />
		</div>
	);
}

export default function HailpadDetails({
	dentData,
	onFilterChange,
	onShowCentroids,
	onDownload
}: {
	dentData: HailpadDent[];
	onFilterChange: (value: object) => void; // TODO: Define interface
	onShowCentroids: (value: boolean) => void;
	onDownload: (value: boolean) => void;
}) {
	const [minMinor, setMinMinor] = useState<number>(0);
	const [maxMinor, setMaxMinor] = useState<number>(0);

	const [minMajor, setMinMajor] = useState<number>(0);
	const [maxMajor, setMaxMajor] = useState<number>(0);

	const [avgMinor, setAvgMinor] = useState<number>(0);
	const [avgMajor, setAvgMajor] = useState<number>(0);

	useEffect(() => {
		setMinMinor(Math.min(...dentData.map((dent) => Number(dent.minorAxis))));
		setMaxMinor(Math.max(...dentData.map((dent) => Number(dent.minorAxis))));

		setMinMajor(Math.min(...dentData.map((dent) => Number(dent.majorAxis))));
		setMaxMajor(Math.max(...dentData.map((dent) => Number(dent.majorAxis))));

		setAvgMinor(dentData.reduce((acc, dent) => acc + Number(dent.minorAxis), 0) / dentData.length);
		setAvgMajor(dentData.reduce((acc, dent) => acc + Number(dent.majorAxis), 0) / dentData.length);
	}, [dentData]);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Hailpad Details</CardTitle>
				<CardDescription>About the current hailpad view.</CardDescription>
			</CardHeader>
			<CardContent>
				<Tabs defaultValue="minor">
					<TabsList>
						<TabsTrigger value="minor">Minor Axis</TabsTrigger>
						<TabsTrigger value="major">Major Axis</TabsTrigger>
					</TabsList>
					<TabsContent value="minor">
						<DetailSection min={minMinor} max={maxMinor} avg={avgMinor} />
					</TabsContent>
					<TabsContent value="major">
						<DetailSection min={minMajor} max={maxMajor} avg={avgMajor} />
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
