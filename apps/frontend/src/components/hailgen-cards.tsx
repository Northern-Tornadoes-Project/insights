import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from './ui/card';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Histogram, BarSeries, XAxis, YAxis } from '@data-ui/histogram';

import { Separator } from './ui/separator';

import { cn } from '@/lib/utils';
import { PropsWithChildren, useRef, type ReactNode, useEffect } from 'react';
import { Button } from './ui/button';
import { CornerDownLeft } from 'lucide-react';

type HailpadMapProps = {
	img_src: string;
	centroids: Array<[number, number]>;
};

type HailpadDetailsProps = {
	indent_count: number;
	min_minor: number;
	max_minor: number;
	avg_minor: number;
	min_major: number;
	max_major: number;
	avg_major: number;
	min_volume: number;
	max_volume: number;
	avg_volume: number;
	minors: number[];
	majors: number[];
	volumes: number[];
};

type IndentDetailsProps = {
	indent_count: number;
	minor: number;
	major: number;
	volume: number;
};

type HailpadControlsProps = {
};

export function HailpadMap(props: HailpadMapProps) {
	const canvasRef = useRef(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		const context = canvas.getContext('2d');

		const img = new Image();
		img.src = '../../dmap.png'; // TODO: replace with props.img_src

		img.onload = () => {
			context.drawImage(img, 0, 0, 1000, 1000);

			// Render clickable centroids
			props.centroids.forEach(([x, y]) => {
				context.beginPath();
				context.arc(x, y, 4, 0, 2 * Math.PI);
				context.fillStyle = '#4c2e72';
				context.fill();
			});
		};

		img.onerror = (error) => {
			console.error('Error loading depth map: ', error);
		};

		// TODO: Add event handler for clicking centroids

	}, [props.centroids]);

	return <canvas ref={canvasRef} width={1000} height={1000} />;
}

function DetailsRow(
	props: PropsWithChildren<{ label: string; className?: string }>
) {
	return (
		<div className={cn('flex flex-row', props.className)}>
			<div className="flex flex-col">
				<p className="text-muted-foreground text-sm">{props.label}</p>
				{props.children}
			</div>
		</div>
	);
}

export function HailpadDetails(props: HailpadDetailsProps) {
	const renderHistogram = (type: string) => {
		let data = [];

		if (type === "minor") {
			data = props.minors;
		} else if (type === "major") {
			data = props.majors;
		} else if (type === "volume") {
			data = props.volumes;
		}

		// TODO
		const rawData = Array(100).fill(30).map(Math.random);
		// const rawData = data;

		return (
			<div className="rounded-sm bg-white border-2">
				<Histogram
					ariaLabel="Indent distribution histogram"
					orientation="vertical"
					binCount={5}
					width={375}
					height={300}
					binType="numeric"
				>
					<BarSeries
						fill="#4c2e72"
						fillOpacity={1}
						rawData={rawData}
					/>
					<XAxis numTicks={5}/>
					<YAxis numTicks={10}/>
				</Histogram>
			</div>
		);
	};

	return (
		<>
			{/* Hailpad details card */}
			<Card id="hailpad-details-card">
				<CardHeader>
					<CardTitle>Hailpad Details</CardTitle>
					<CardDescription>About the current hailpad view</CardDescription>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="minor">
						<TabsList>
							<TabsTrigger value="minor">Minor Axis</TabsTrigger>
							<TabsTrigger value="major">Major Axis</TabsTrigger>
							<TabsTrigger value="volume">Volume</TabsTrigger>
						</TabsList>
						<TabsContent value="minor">
							<div className="flex flex-row justify-between pt-4">
								<DetailsRow label="Minimum">
									<p>
										{`${Number(props.min_minor.toFixed(2))} mm`}
									</p>
								</DetailsRow>
								<DetailsRow label="Maximum">
									<p>
										{`${Number(props.max_minor.toFixed(2))} mm`}
									</p>
								</DetailsRow>
								<DetailsRow label="Average">
									<p>
										{`${Number(props.avg_minor.toFixed(2))} mm`}
									</p>
								</DetailsRow>
							</div>
							<div className="pt-4">
								{renderHistogram("minor")}
							</div>
						</TabsContent>
						<TabsContent value="major">
							<div className="flex flex-row justify-between pt-4">
								<DetailsRow label="Minimum">
									<p>
										{`${Number(props.min_major.toFixed(2))} mm`}
									</p>
								</DetailsRow>
								<DetailsRow label="Maximum">
									<p>
										{`${Number(props.max_major.toFixed(2))} mm`}
									</p>
								</DetailsRow>
								<DetailsRow label="Average">
									<p>
										{`${Number(props.avg_major.toFixed(2))} mm`}
									</p>
								</DetailsRow>
							</div>
							<div className="pt-4">
								{renderHistogram('major')}
							</div>
						</TabsContent>
						<TabsContent value="volume">
							<div className="flex flex-row justify-between pt-4">
								<DetailsRow label="Minimum">
									<p>
										{`${Number(props.min_volume.toFixed(2))} mm³`}
									</p>
								</DetailsRow>
								<DetailsRow label="Maximum">
									<p>
										{`${Number(props.max_volume.toFixed(2))} mm³`}
									</p>
								</DetailsRow>
								<DetailsRow label="Average">
									<p>
										{`${Number(props.avg_volume.toFixed(2))} mm³`}
									</p>
								</DetailsRow>
							</div>
							<div className="pt-4">
								{renderHistogram('volume')}
							</div>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</>
	)
}

export function IndentDetails(props: IndentDetailsProps) {
	return (
		<>
			{/* Hailpad details card */}
			<Card id="hailpad-details-card" className="h-full">
				<CardHeader>
					<CardTitle>Indent Details</CardTitle>
					<CardDescription>About the current indent</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col justify-around">
					<CardDescription>Indent</CardDescription>
					<div className="flex flex-row mt-1">
						<Input className='w-12 h-8 p-0.5 mr-2 text-center text-base' />
						<p>
							{`/ ${props.indent_count}`}
						</p>
					</div>
					<div className="flex flex-row justify-between pt-4">
						<DetailsRow label="Minor Axis">
							<p>
								{`${Number(props.minor.toFixed(2))} mm`}
							</p>
						</DetailsRow>
						<DetailsRow label="Major Axis">
							<p>
								{`${Number(props.major.toFixed(2))} mm`}
							</p>
						</DetailsRow>
						<DetailsRow label="Volume">
							<p>
								{`${Number(props.volume.toFixed(2))} mm³`}
							</p>
						</DetailsRow>
					</div>
				</CardContent>
			</Card>
		</>
	)
}

// TODO
export function HailpadControls(props: HailpadControlsProps) {
	return (
		<>
			{/* Hailpad Controls Card */}
			<Card id="lidar-controls-card" className="bg-background/60 backdrop-blur">
				<CardHeader>
					<CardTitle>Indent Filters</CardTitle>
					<CardDescription>Filter out identified indents</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col justify-around">
					Filters for minor/major axis, volume, etc.
				</CardContent>
				{/* TODO: TBD */}
				{/* <div className="px-4">
					<Separator />
				</div>
				<CardHeader>
					<CardTitle>Advanced Controls</CardTitle>
					<CardDescription>Change the depth map analysis</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col justify-around">
				</CardContent> */}
			</Card>
		</>
	)
}
