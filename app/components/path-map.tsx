import { LngLatBounds } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMemo, useRef } from 'react';
import Map, { Layer, MapRef, Marker, Source } from 'react-map-gl';
import { Theme, useTheme } from 'remix-themes';

export type SegmentPoint = {
	lng: number;
	lat: number;
};

export default function ({
	segments,
	currentSegment,
	onSegmentClick,
	token
}: {
	segments: SegmentPoint[];
	currentSegment?: SegmentPoint;
	onSegmentClick?: (index: number) => void;
	token: string;
}) {
	const mapRef = useRef<MapRef | null>(null);
	const [theme, _] = useTheme();

	const bounds = useMemo(() => {
		const bounds = new LngLatBounds();
		segments.forEach((segment) => {
			bounds.extend([segment.lng, segment.lat]);
		});
		return bounds;
	}, [segments]);

	const markers = useMemo(() => {
		// Display a point for every 5 segments
		return segments
			.filter((_, index) => index % 5 === 0)
			.map((segment, index) => (
				<Marker
					key={index}
					longitude={segment.lng}
					latitude={segment.lat}
					onClick={() => onSegmentClick?.(index * 5)}
				>
					<div className="rounded-full bg-foreground">
						<div className="h-3 w-3" />
					</div>
				</Marker>
			));
	}, [segments]);

	return (
		<Map
			ref={mapRef}
			mapboxAccessToken={token}
			mapStyle={
				theme === Theme.LIGHT
					? 'mapbox://styles/mapbox/streets-v12'
					: 'mapbox://styles/mapbox/dark-v11'
			}
			initialViewState={{
				bounds,
				fitBoundsOptions: {
					minZoom: 10,
					padding: {
						top: 100,
						bottom: 100,
						left: 100,
						right: 100
					}
				}
			}}
		>
			<Source
				id="path"
				type="geojson"
				data={{
					type: 'Feature',
					properties: {},
					geometry: {
						type: 'LineString',
						coordinates: segments.map((point) => [point.lng, point.lat])
					}
				}}
			>
				<Layer
					id="route"
					type="line"
					layout={{
						'line-join': 'round',
						'line-cap': 'round'
					}}
					paint={{
						'line-color': theme === Theme.LIGHT ? '#888' : '#fff',
						'line-width': 2
					}}
				/>
			</Source>
			{currentSegment && markers}
			{currentSegment && (
				<Marker longitude={currentSegment.lng} latitude={currentSegment.lat} color="black" />
			)}
		</Map>
	);
}
