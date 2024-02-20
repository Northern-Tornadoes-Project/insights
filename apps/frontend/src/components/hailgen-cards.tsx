import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from './ui/card';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';

import { cn } from '@/lib/utils';
import { PropsWithChildren, type ReactNode } from 'react';
import { Button } from './ui/button';
import { CornerDownLeft } from 'lucide-react';

// Props for hailpad details card
type HailpadDetailsProps = {
	map_size: bigint; // in bytes
	indent_count: number;
	min_len: number;
	max_len: number;
	avg_len: number;
	min_wid: number;
	max_wid: number;
	avg_wid: number;
	min_vol: number;
	max_vol: number;
	avg_vol: number;
};

// Props for indent details card
type IndentDetailsProps = {
	indent_count: number;
	len: number;
	wid: number;
	vol: number;
};

// Props for hailpad controls card
type HailpadControlsProps = {
};

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
	return (
		<>
			{/* Hailpad details card */}
			<Card id="hailpad-details-card">
				<CardHeader>
					<CardTitle>Hailpad Details</CardTitle>
					<CardDescription>About the current hailpad view</CardDescription>
				</CardHeader>
				<CardContent>
					<Tabs defaultValue="width">
						<TabsList>
							<TabsTrigger value="length">Length</TabsTrigger>
							<TabsTrigger value="width">Width</TabsTrigger>
							<TabsTrigger value="volume">Volume</TabsTrigger>
						</TabsList>
						<TabsContent value="length">
							<div className="flex flex-row justify-between pt-4">
								<DetailsRow label="Minimum">
									<p>
										{`${props.min_len} mm`}
									</p>
								</DetailsRow>
								<DetailsRow label="Maximum">
									<p>
										{`${props.max_len} mm`}
									</p>
								</DetailsRow>
								<DetailsRow label="Average">
									<p>
										{`${props.avg_len} mm`}
									</p>
								</DetailsRow>
							</div>
							<div className="pt-4">
								Length histogram here
							</div>
						</TabsContent>
						<TabsContent value="width">
						<div className="flex flex-row justify-between pt-4">
								<DetailsRow label="Minimum">
									<p>
										{`${props.min_wid} mm`}
									</p>
								</DetailsRow>
								<DetailsRow label="Maximum">
									<p>
										{`${props.max_wid} mm`}
									</p>
								</DetailsRow>
								<DetailsRow label="Average">
									<p>
										{`${props.avg_wid} mm`}
									</p>
								</DetailsRow>
							</div>
							<div className="pt-4">
								Width histogram here
							</div>
						</TabsContent>
						<TabsContent value="volume">
						<div className="flex flex-row justify-between pt-4">
								<DetailsRow label="Minimum">
									<p>
										{`${props.min_vol} mm³`}
									</p>
								</DetailsRow>
								<DetailsRow label="Maximum">
									<p>
										{`${props.max_vol} mm³`}
									</p>
								</DetailsRow>
								<DetailsRow label="Average">
									<p>
										{`${props.avg_vol} mm³`}
									</p>
								</DetailsRow>
							</div>
							<div className="pt-4">
								Volume histogram here
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
			<Card id="hailpad-details-card">
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
								<DetailsRow label="Length">
									<p>
										{`${props.len} mm`}
									</p>
								</DetailsRow>
								<DetailsRow label="Width">
									<p>
										{`${props.wid} mm`}
									</p>
								</DetailsRow>
								<DetailsRow label="Volume">
									<p>
										{`${props.vol} mm`}
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
					<CardDescription>Adjust the default filters for identified indents</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col justify-around">
					Filters for min/max area, min/max width, min/max height, min/max volume
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
