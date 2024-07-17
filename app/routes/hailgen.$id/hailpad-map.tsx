import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface HailpadDent {
	angle: number;
	centroidX: number;
	centroidY: number;
	majorAxis: number;
	minorAxis: number;
}

export function HailpadMap({
	index,
	dentData,
	depthMapPath,
	showCentroids,
	onIndexChange
}: {
	index: number;
	dentData: HailpadDent[];
	depthMapPath: string;
	showCentroids: boolean;
	onIndexChange: (index: number) => void;
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;

		if (!canvas) return;

		const context = canvas.getContext('2d');

		if (!context) return;

		// Get depth map image from hailpad folder
		const depthMap = new Image();
		depthMap.src = depthMapPath;

		depthMap.onload = () => {
			context.drawImage(depthMap, 0, 0, 1000, 1000);

			// Render clickable ellipse about centroid of selected dent
			dentData.forEach((dent: HailpadDent, i: number) => {
				const x = dent.centroidX;
				const y = dent.centroidY;

				if (i === index && context) {
					context.globalAlpha = 1;
					context.beginPath();
					context.ellipse(
						x,
						y,
						(dent.majorAxis / 2) * 1.5,
						(dent.minorAxis / 2) * 1.5,
						dent.angle,
						0,
						2 * Math.PI
					);
					context.strokeStyle = '#4c2e72'; // TODO: Use a theme color
					context.lineWidth = 3;
					context.setLineDash([7, 5]);
					context.stroke();
				}

				// Render all dent centroids
				if (showCentroids && context) {
					context.globalAlpha = 0.5;
					context.beginPath();
					context.arc(x, y, 2, 0, 2 * Math.PI);
					context.fill();
					context.globalAlpha = 1;
				}
			});
		};

		const handleClick = (event: MouseEvent) => {
			const rect = canvas.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;

			// Set index based on if a centroid was clicked within a certain radius
			const clickRadius = 25;
			for (let i = 0; i < dentData.length; i++) {
				const [centroidX, centroidY] = [dentData[i].centroidX, dentData[i].centroidY];
				const distance = Math.sqrt(Math.pow(x - centroidX, 2) + Math.pow(y - centroidY, 2));
				if (distance <= clickRadius) {
					onIndexChange(i);
					break;
				}
			}
		};

		const handleDoubleClick = async (event: MouseEvent) => {
			const rect = canvas.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;

			// Copy x and y to clipboard
			try {
				await navigator.clipboard.writeText(`(${x}, ${y})`);
			} catch (error) {
				console.error('Failed to write to clipboard: ' + error);
			}

			// Show toast notification
			toast('Coordinates copied to clipboard', {
				description: `(${x}, ${y})`
			});
		};

		// Event handler for clicking near a centroid to change index
		canvas.addEventListener('click', handleClick);

		// Event handler for double-clicking on the depth map to copy x and y coordinates to clipboard
		canvas.addEventListener('dblclick', handleDoubleClick);

		return () => {
			canvas.removeEventListener('click', handleClick);
			canvas.removeEventListener('dblclick', handleDoubleClick);
		};
	}, [onIndexChange, index, dentData, depthMapPath, showCentroids]);

	return (
		<canvas ref={canvasRef} width={1000} height={1000} /> // TODO: Responsive sizing
	);
}
