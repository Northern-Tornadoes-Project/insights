import { LucideCircle, LucideSquare } from 'lucide-react';
import { InsightsTooltip } from '~/components/insight-tooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { Slider } from '~/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '~/components/ui/toggle-group';
import { useStore } from './store';

export function Options() {
	const { size, setSize, shape, setShape, cameraPosition, cameraRotation } = useStore();

	return (
		<Card className="min-w-96">
			<CardHeader>
				<CardTitle>Options</CardTitle>
				<CardDescription>Change the current LiDAR view.</CardDescription>
			</CardHeader>
			<CardContent>
				<Tabs defaultValue="view" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="view">View</TabsTrigger>
						<TabsTrigger value="debug">Debug</TabsTrigger>
					</TabsList>
					<TabsContent value="view" className="grid grid-cols-1 gap-4">
						<div className="flex flex-col items-start gap-2">
							<Label htmlFor="point-size-slider">Point Size</Label>
							<div className="flex w-full flex-row items-center gap-2">
								<Slider
									id="point-size-slider"
									min={1}
									max={5}
									step={1}
									value={[size]}
									onValueChange={(value) => setSize(value[0])}
								/>
								<p className="text-sm font-normal">{size.toFixed(0)}</p>
							</div>
						</div>
						<div className="flex flex-col items-start gap-2">
							<Label htmlFor="point-shape">Point Shape</Label>
							<ToggleGroup
								type="single"
								defaultValue={shape === 1 ? 'circle' : 'square'}
								onValueChange={(value) => setShape(value === 'circle' ? 1 : 0)}
								variant="outline"
							>
								<InsightsTooltip tip="Square">
									<ToggleGroupItem value="square">
										<LucideSquare size={16} />
									</ToggleGroupItem>
								</InsightsTooltip>
								<InsightsTooltip tip="Circle">
									<ToggleGroupItem value="circle">
										<LucideCircle size={16} />
									</ToggleGroupItem>
								</InsightsTooltip>
							</ToggleGroup>
						</div>
					</TabsContent>
					<TabsContent value="debug" className="grid grid-cols-1 gap-4">
						<div className="flex flex-col items-start gap-2">
							<p className="text-sm font-medium">Camera Position</p>
							<div className="flex flex-row gap-1 text-sm font-normal">
								{cameraPosition.map((coord, i) => (
									<p key={i} className="rounded-lg bg-muted px-2 py-1 text-sm font-medium">
										{coord.toFixed(2)}
									</p>
								))}
							</div>
						</div>
						<div className="flex flex-col items-start gap-2">
							<p className="text-sm font-medium">Camera Rotation</p>
							<div className="flex flex-row gap-1 text-sm font-normal">
								{cameraRotation.map((coord, i) => (
									<p key={i} className="rounded-lg bg-muted px-2 py-1 text-sm font-medium">
										{coord.toFixed(2)}
									</p>
								))}
							</div>
						</div>
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
