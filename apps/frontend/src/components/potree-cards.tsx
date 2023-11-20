import format from 'date-fns/format';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from './ui/card';

import { cn } from '@/lib/utils';
import { PropsWithChildren, type ReactNode } from 'react';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';

// Props for potree details card
type PotreeDetailsProps = {
	event_date: number | Date;
	date_taken: number | Date;
	scan_location: string;
	scan_size: bigint; // in bytes
	scan_type: string;
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

export function PotreeDetails(props: PotreeDetailsProps) {
	return (
		<>
			{/* LiDAR details card */}
			<Card id="lidar-details-card" className="lg:col-span-2">
				<CardHeader>
					<CardTitle>Details</CardTitle>
					<CardDescription>About the current LiDAR view</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col justify-around">
					<div className="grid grid-cols-2">
						<DetailsRow label="Event date">
							{(() => {
									try {
										return format(
											props.event_date,
											'MMMM d, yyyy'
										);
									} catch (err) {
										return 'N/A';
									}
								})()}
						</DetailsRow>
						<DetailsRow label="Event location">
							{props.scan_location}
						</DetailsRow>
					</div>
					<div className="grid grid-cols-2">
						<DetailsRow label="Capture date">
							{(() => {
									try {
										return format(
											props.date_taken,
											'MMMM d, yyyy'
										);
									} catch (err) {
										return 'N/A';
									}
								})()}
						</DetailsRow>
						<DetailsRow label="Capture type">
							{props.scan_type}
						</DetailsRow>
					</div>
					<div className="grid grid-cols-2">
						<DetailsRow label="Capture file size">
							<p>
							{`${props.scan_size / BigInt(1048576)} MB`} {/* Conversion from bytes to megabytes */}
							</p>
						</DetailsRow>
					</div>
				</CardContent>
			</Card>
		</>
	)

}


