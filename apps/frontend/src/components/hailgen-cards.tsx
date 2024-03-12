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
import { cn } from '@/lib/utils';
import { PropsWithChildren, useRef, type ReactNode, useEffect, FormEvent } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, CornerDownLeft, FileSpreadsheet, Filter, Trash, Trash2 } from 'lucide-react';
import { SubmitHandler, useForm } from 'react-hook-form';

type HailpadMapProps = {
	onIndexChange: (value: number) => void;
	index: number;
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
	onPrevious?: () => void;
	onNext?: () => void;
	onIndexChange: (value: number) => void;
	index: number;
	indent_count: number;
	minor: number;
	major: number;
	volume: number;
};

type HailpadControlsProps = {
};

export function HailpadMap(props: HailpadMapProps) {
	const canvasRef = useRef(null);
	const radius = 20;

	useEffect(() => {
		const canvas = canvasRef.current;
		const context = canvas.getContext('2d');

		const img = new Image();
		img.src = '../../dmap.png'; // TODO: replace with props.img_src

		img.onload = () => {
			context.drawImage(img, 0, 0, 1000, 1000);

			// Render clickable centroids
			props.centroids.forEach(([x, y], i) => {
				if (i === props.index) {
					// context.globalAlpha = 0.75;
					
					context.beginPath();
					context.arc(x, y, radius, 0, 2 * Math.PI);
					context.strokeStyle = '#4c2e72';
					context.lineWidth = 3;
					context.setLineDash([7, 5]);
					context.stroke();

					context.beginPath();
					context.arc(x, y, 2, 0, 2 * Math.PI);
					context.fillStyle = '#4c2e72';
					context.fill();

					context.globalAlpha = 1;
				}
			});
		};

		img.onerror = (error) => {
			console.error('Error loading depth map: ', error);
		};

		// Event handler for clicking on a centroid to change index
		// TODO: Fix coordinate mismatch
        // canvas.addEventListener('click', (event) => {
        //     const rect = canvas.getBoundingClientRect();
        //     const x = event.clientX - rect.left;
        //     const y = event.clientY - rect.top;

        //     // Set index based on if a centroid was clicked within a certain radius
        //     for (let i = 0; i < props.centroids.length; i++) {
        //         const [centroidX, centroidY] = props.centroids[i];
        //         const distance = Math.sqrt(Math.pow(x - centroidX, 2) + Math.pow(y - centroidY, 2));
		// 		console.log(x, centroidX, y, centroidY, distance, radius);
        //         if (distance <= radius) {
        //             props.onIndexChange(i);
        //             break;
        //         }
        //     }
        // });
	}, [props.centroids, props.onIndexChange, props.index]);

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

		// TODO: Figure out why this is yelling 😭
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
					<XAxis numTicks={5} />
					<YAxis numTicks={10} />
				</Histogram>
			</div>
		);
	};

	return (
		<Card id="hailpad-details-card">
			<CardHeader>
				<CardTitle>Hailpad Details</CardTitle>
				<CardDescription>About the current hailpad view</CardDescription>
			</CardHeader>
			<CardContent>
				<Tabs defaultValue="minor">
					<div className="flex flex-row justify-between items-center">
						<TabsList>
							<TabsTrigger value="minor">Minor Axis</TabsTrigger>
							<TabsTrigger value="major">Major Axis</TabsTrigger>
							<TabsTrigger value="volume">Volume</TabsTrigger>
						</TabsList>
						<div className="flex flex-row space-x-4">
							<Button variant="outline" className="h-8 w-8 p-0.5 hover:text-green-500">
								<FileSpreadsheet className="h-4" />
							</Button>
							<Button variant="outline" className="h-8 w-8 p-0.5">
								<Filter className="h-4" />
							</Button>
						</div>
					</div>
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
	)
}

export function IndentDetails(props: IndentDetailsProps) {
	type Inputs = {
		indent: string;
	};

	const {
		register,
		handleSubmit,
		control,
		reset,
		formState: { errors },
	} = useForm<Inputs>();

	// Handle manual indent number input
	const submitIndentNo = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		void (async () => {
			await handleSubmit(((data) => {
				props.onIndexChange(Number(data.indent) - 1);
				reset();
			}) as SubmitHandler<Inputs>)(event);
		})();
	};

	return (
		<>
			<Card id="hailpad-details-card" className="h-full">
				<CardHeader>
					<div className="flex flex-row justify-between">
						<div>
							<CardTitle>Indent Details</CardTitle>
							<CardDescription>About the current indent</CardDescription>
						</div>
						<div className="flex flex-row items-center space-x-2">
							<Button variant="outline" className="h-8 w-8 p-0.5 mr-2 border-red hover:text-red-500">
								<Trash2 className="h-4" />
							</Button>
							<Button variant="secondary" onClick={() => props.onPrevious?.()} className="h-8 w-8 p-0.5">
								<ChevronLeft className="h-5" />
							</Button>
							<Button variant="secondary" onClick={() => props.onNext?.()} className="h-8 w-8 p-0.5">
								<ChevronRight className="h-5" />
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent className="flex flex-col justify-around">
					<form onSubmit={submitIndentNo}>
						<CardDescription>Indent</CardDescription>
						<div className="flex flex-row mt-1">
							<Input
								className='w-12 h-8 p-0.5 mr-2 text-center text-base'
								type="string"
								{...register('indent', { required: true, max: props.indent_count, min: 1 })}
								placeholder={String(props.index + 1)}
							/>
							<p className="mt-1">
								{`/ ${props.indent_count}`}
							</p>
							<Button variant="secondary" type="submit" className="h-8 w-8 p-0.5 ml-4">
								<CornerDownLeft className="h-4" />
							</Button>
						</div>
					</form>
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
