import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import { Slider } from '~/components/ui/slider';
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
				<div className="flex flex-row gap-2">
					<Label className="text-sm font-normal">Point Size</Label>
					<Slider
						id="point-size-slider"
						min={1}
						max={5}
						step={1}
						value={[size]}
						onValueChange={(value) => setSize(value[0])}
					/>
					<Label htmlFor="point-size-slider" className="text-align text-sm font-normal">
						{size}
					</Label>
				</div>
				<div className="flex flex-row gap-2">
					<Label htmlFor="point-shape" className="text-sm font-normal">
						Point Shape
					</Label>
					<RadioGroup
						id="point-shape"
						defaultValue={shape === 1 ? 'circle' : 'square'}
						onValueChange={(value) => setShape(value === 'circle' ? 1 : 0)}
					>
						<div className="flex items-center space-x-2">
							<RadioGroupItem value="square" id="square" />
							<Label htmlFor="square">Square</Label>
						</div>
						<div className="flex items-center space-x-2">
							<RadioGroupItem value="circle" id="circle" />
							<Label htmlFor="circle">Circle</Label>
						</div>
					</RadioGroup>
				</div>
				<div className="flex flex-row gap-2">
					<Label className="text-sm font-normal">Camera Position</Label>
					<Label className="text-sm font-normal">
						{cameraPosition.map((coord, i) => (
							<span key={i}>{coord.toFixed(2)} </span>
						))}
					</Label>
				</div>
				<div className="flex flex-row gap-2">
					<Label className="text-sm font-normal">Camera Rotation</Label>
					<Label className="text-sm font-normal">
						{cameraRotation.map((coord, i) => (
							<span key={i}>{coord.toFixed(2)} </span>
						))}
					</Label>
				</div>
			</CardContent>
		</Card>
	);
}
