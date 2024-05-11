import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from './ui/card';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
// import { Histogram, BarSeries, XAxis, YAxis, Label } from '@data-ui/histogram';
import "chart.js/auto";
import { Bar } from 'react-chartjs-2';
import { cn } from '@/lib/utils';
import { PropsWithChildren, useRef, type ReactNode, useEffect, FormEvent } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, CornerDownLeft, FileSpreadsheet, Filter, FilterX, Trash, Trash2 } from 'lucide-react';
import { SubmitHandler, useForm } from 'react-hook-form';

// import dynamic from 'next/dynamic';
// const DynamicDataUI: any = dynamic(() => import('@data-ui/histogram').then(module => module.default), { ssr: false });

type HailpadMapProps = {
	onIndexChange: (value: number) => void;
	index: number;
	imgData: string;
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
	onFilterChange: (value: object) => void;
	onDownload: (value: boolean) => void;
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

export function HailpadMap(props: HailpadMapProps) {
	const canvasRef = useRef(null);
	const radius = 25;

	useEffect(() => {
		const canvas = canvasRef.current;
		// canvas.width = 1000;
		// canvas.height = 1000;
		const context = canvas.getContext('2d');

		const img = new Image();

		// Decode base64 image data
		img.src = `data:image/png;base64,${props.imgData}`;

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

					context.globalAlpha = 1;
				}
			});
		};

		img.onerror = (error) => {
			console.error('Error loading depth map: ', error);
		};

		// Event handler for clicking on a centroid to change index
		canvas.addEventListener('click', (event) => {
			const rect = canvas.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;

			// Set index based on if a centroid was clicked within a certain radius
			for (let i = 0; i < props.centroids.length; i++) {
				const [centroidX, centroidY] = props.centroids[i];
				const distance = Math.sqrt(Math.pow(x - centroidX, 2) + Math.pow(y - centroidY, 2));
				if (distance <= 20) {
					props.onIndexChange(i);
					break;
				}
			}
		});
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
	const renderHistogram = (data: number[]) => {
		// Filter anything over 100 TODO REMOVE
		data = data.filter((val) => val <= 100);

		// Place data into buckets of 5 mm increments TODO REMOVE
		// const buckets = data.reduce((acc, val) => {
		// 	const bucket = Math.floor(val / 5) * 5;
		// 	const key = `[${bucket}, ${bucket + 5})`;
		// 	if (!acc[key]) acc[key] = [];
		// 	acc[key].push(val);
		// 	return acc;
		// }, {});

		// Determine the minimum and maximum values in the data
		const min = Math.floor(Math.min(...data) / 5) * 5;
		const max = Math.floor(Math.max(...data) / 5) * 5;

		// Create an array of bucket keys from min to max in increments of 5
		const keys = Array.from({ length: (max - min) / 5 + 1 }, (_, i) => `[${min + i * 5}, ${min + (i + 1) * 5})`);

		// Create the buckets object
		const buckets = data.reduce((acc, val) => {
			const bucket = Math.floor(val / 5) * 5;
			const key = `[${bucket}, ${bucket + 5})`;
			if (!acc[key]) acc[key] = [];
			acc[key].push(val);
			return acc;
		}, Object.fromEntries(keys.map(key => [key, []])));

		return (
			<div className="rounded-sm bg-white border-2 p-2 w-[375px] h-[250px]">
				<Bar
					data={{
						labels: Object.keys(buckets),
						datasets: [
							{
								label: 'Dent Count',
								data: Object.values(buckets).map((bucket: number[]) => bucket.length),
								backgroundColor: '#4c2e72',
								borderColor: '#4c2e72',
								borderWidth: 1,
							},
						],
					}}
					options={{
						indexAxis: 'y',
						responsive: true,
						maintainAspectRatio: false,
						plugins: {
							legend: {
								display: false,
							},
						},
						scales: {
							x: {
								title: {
									display: true,
									text: 'Dent Count',
								},
							},
							y: {
								title: {
									display: true,
									text: 'Length (mm)',
								},
							},
						},
						layout: {
							padding: {
								left: 0,
								right: 0,
								top: 0,
								bottom: 0,
							},
						},
						barPercentage: 0.9,
						categoryPercentage: 1,
					}}
				/>

				{/* {data &&
					<Histogram
						ariaLabel="Indent distribution histogram"
						orientation="vertical"
						binCount={5}
						width={375}
						height={300}

					>
						<BarSeries
							rawData={data}
							fill="#4c2e72"
							fillOpacity={1}
						/>
						<XAxis numTicks={8} />
						<YAxis numTicks={8} />
					</Histogram>
				} */}
			</div>
		);
	};

	type Inputs = {
		minMinor: string;
		maxMinor: string;
		minMajor: string;
		maxMajor: string;
		minVolume: string;
		maxVolume: string;
	};

	const {
		register,
		handleSubmit,
		control,
		reset,
		formState: { errors }, // TODO
	} = useForm<Inputs>();

	const changeFilter = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		void (async () => {
			await handleSubmit(((data) => {
				props.onFilterChange({
					minMinor: Number(data.minMinor),
					maxMinor: Number(data.maxMinor),
					minMajor: Number(data.minMajor),
					maxMajor: Number(data.maxMajor),
					minVolume: Number(data.minVolume),
					maxVolume: Number(data.maxVolume),
				});
			}) as SubmitHandler<Inputs>)(event);
		})();
	};

	// const submitIndentNo = (event: FormEvent<HTMLFormElement>) => {
	// 	event.preventDefault();
	// 	void (async () => {
	// 		await handleSubmit(((data) => {
	// 			props.onIndexChange(Number(data.indent) - 1);
	// 			reset();
	// 		}) as SubmitHandler<Inputs>)(event);
	// 	})();
	// };

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
							<Button variant="outline" className="h-8 w-8 p-0.5 hover:text-green-500" onClick={() => props.onDownload(true)}>
								<FileSpreadsheet className="h-4" />
							</Button>
							<Popover>
								<PopoverTrigger>
									<Button asChild variant="outline" className="h-8 w-8 p-[7px]">
										<Filter className="h-2" />
									</Button>
								</PopoverTrigger>
								<PopoverContent>
									<p className="font-semibold text-sm">
										Filter Indents
									</p>
									<form className="mt-4 text-sm space-y-2" onSubmit={changeFilter}>
										<div className="flex flex-row justify-between items-center">
											<Input
												type="text"
												{...register('minMinor', { required: false, min: 0, max: 'maxMinor' })}
												placeholder="Min."
												className="w-14 h-8"
											/>
											<p>≤</p>
											<p>Minor Axis (mm)</p>
											<p>≤</p>
											<Input
												type="text"
												{...register('maxMinor', { required: false, min: 'minMinor' })}
												placeholder="Max."
												className="w-14 h-8"
											/>
										</div>
										<div className="flex flex-row justify-between items-center">
											<Input
												type="text"
												{...register('minMajor', { required: false, min: 0, max: 'maxMajor' })}
												placeholder="Min."
												className="w-14 h-8"
											/>
											<p>≤</p>
											<p>Major Axis (mm)</p>
											<p>≤</p>
											<Input
												type="text"
												{...register('maxMajor', { required: false, min: 'minMajor' })}
												placeholder="Max."
												className="w-14 h-8"
											/>
										</div>
										<div className="flex flex-row justify-between items-center">
											<Input
												type="text"
												{...register('minVolume', { required: false, min: 0, max: 'maxVolume' })}
												placeholder="Min."
												className="w-14 h-8"
											/>
											<p>≤</p>
											<p>Volume (mm³)</p>
											<p>≤</p>
											<Input
												type="text"
												{...register('maxVolume', { required: false, min: 'minVolume' })}
												placeholder="Max."
												className="w-14 h-8"
											/>
										</div>
										<div className="flex flex-row justify-between pt-2">
											<Button variant="outline" type="reset" className="h-8 w-8 p-0.5 hover:text-red-500">
												<FilterX className="h-4" />
											</Button>
											<Button variant="secondary" type="submit" className="h-8 w-8 p-0.5">
												<CornerDownLeft className="h-4" />
											</Button>
										</div>
									</form>
								</PopoverContent>
							</Popover>

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
							{/* {props.minors && renderHistogram(props.minors)} */}
							{renderHistogram(props.minors)}
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
							{/* {props.majors && renderHistogram(props.majors)} */}
							{renderHistogram(props.majors)}
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
							{/* {props.volumes && renderHistogram(props.volumes)} */}
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
