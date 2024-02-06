import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from './ui/card';
import { Input } from './ui/input';

import { Separator } from './ui/separator';

import { cn } from '@/lib/utils';
import { PropsWithChildren, type ReactNode } from 'react';

// Props for hailpad details card
type HailpadDetailsProps = {
	map_size: bigint; // in bytes
	indent_count: number;
	min_width: number;
	max_width: number;
	avg_width: number;
	min_height: number;
	max_height: number;
	avg_height: number;
	min_depth: number;
	max_depth: number;
	avg_depth: number;
};

// Props for indent details card
type IndentDetailsProps = {
	indent_count: number;
};

// Props for hailpad controls card
type HailpadControlsProps = {
};

function DetailsRow(
	props: PropsWithChildren<{ label: string; className?: string }>
) {
	return (
		<div className={cn('flex flex-row pb-4', props.className)}>
			<div className="flex flex-col">
				<p className="text-muted-foreground text-sm">{props.label}</p>
				{props.children}
			</div>
		</div>
	);
}

export function HailpadDetails(props: HailpadDetailsProps) {
	return (
		<>
			{/* Hailpad details card */}
			<Card id="hailpad-details-card" className="lg:col-span-2">
				<CardHeader>
					<CardTitle>Hailpad Details</CardTitle>
					<CardDescription>About the current hailpad view</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col justify-around">
					<div className="grid grid-cols-3 grid-rows-6">
						<DetailsRow label="Depth map file size">
							<p>
								{`${props.map_size / BigInt(1048576)} MB`} {/* Conversion from bytes to megabytes */}
							</p>
						</DetailsRow>
						<div></div>
						<DetailsRow label="Total indents">
							<p>
								{props.indent_count}
							</p>
						</DetailsRow>
						<h3 className="flex col-span-3 font-semibold items-end pb-4">Width</h3>
						<DetailsRow label="Min.">
							<p>
								{`${props.min_width} mm`}
							</p>
						</DetailsRow>
						<DetailsRow label="Max.">
							<p>
								{`${props.max_width} mm`}
							</p>
						</DetailsRow>
						<DetailsRow label="Avg.">
							<p>
								{`${props.avg_width} mm`}
							</p>
						</DetailsRow>
						<h3 className="flex col-span-3 font-semibold items-end pb-4">Height</h3>
						<DetailsRow label="Min.">
							<p>
								{`${props.min_height} mm`}
							</p>
						</DetailsRow>
						<DetailsRow label="Max.">
							<p>
								{`${props.max_height} mm`}
							</p>
						</DetailsRow>
						<DetailsRow label="Avg.">
							<p>
								{`${props.avg_height} mm`}
							</p>
						</DetailsRow>
						<h3 className="flex col-span-3 font-semibold items-end pb-4">Depth</h3>
						<DetailsRow label="Min.">
							<p>
								{`${props.min_depth} mm`}
							</p>
						</DetailsRow>
						<DetailsRow label="Max.">
							<p>
								{`${props.max_depth} mm`}
							</p>
						</DetailsRow>
						<DetailsRow label="Avg.">
							<p>
								{`${props.avg_depth} mm`}
							</p>
						</DetailsRow>
					</div>
				</CardContent>
			</Card>
		</>
	)
}

export function IndentDetails(props: IndentDetailsProps) {
	return (
		<>
			{/* Hailpad details card */}
			<Card id="hailpad-details-card" className="lg:col-span-2">
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
					<div className="grid grid-cols-3 grid-rows-6">
						
					</div>
				</CardContent>
			</Card>
		</>
	)
}

export function HailpadControls(props: HailpadControlsProps) {
	return (
		<>
			{/* Hailpad Controls Card */}
			<Card id="lidar-controls-card" className="lg:col-span-2 lg: row-span-2 bg-background/60 backdrop-blur">
				<CardHeader>
					<CardTitle>Indent Filters</CardTitle>
					<CardDescription>Adjust the default filters for identified indents</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col justify-around">
					Filters for min/max area, min/max width, min/max height
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
