import { FlyControls, PointerLockControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Potree, type PointCloudOctree } from 'potree-core';
import { useEffect, useState } from 'react';
import { cn } from '~/lib/utils';
import { useStore } from './store';

const potree = new Potree();

function Renderer() {
	const { size, shape, budget, setCameraPosition, setCameraRotation } = useStore();
	const { scene } = useThree();
	const [pointClouds, setPointClouds] = useState<PointCloudOctree[]>([]);

	useEffect(() => {
		const load = async () => {
			const result = await potree.loadPointCloud(
				'metadata.json',
				(url) => `/scans/aceb_scan/output/${url}`
			);

			// Ensure the axes are aligned with the world axes
			result.rotation.x = -Math.PI / 2;
			result.material.pointSizeType = 0;

			scene.clear();
			scene.add(result);
			setPointClouds([result]);
		};

		potree.pointBudget = budget;

		load();
	}, []);

	useEffect(() => {
		potree.pointBudget = budget;

		if (!pointClouds.length) return;

		// Only ever one point cloud
		const pointCloud = pointClouds[0];

		pointCloud.material.shape = shape;
		pointCloud.material.size = size;
	}, [size, shape, budget]);

	useFrame(({ gl, camera }) => {
		potree.updatePointClouds(pointClouds, camera, gl);
		gl.render(scene, camera);
		setCameraPosition([camera.position.x, camera.position.y, camera.position.z]);
		setCameraRotation([camera.rotation.x, camera.rotation.y, camera.rotation.z]);
	});

	return (
		<>
			<PointerLockControls makeDefault selector="#potree-canvas">
				<FlyControls movementSpeed={5} rollSpeed={0} />
			</PointerLockControls>
		</>
	);
}

export default function ({ className }: { className?: string }) {
	return (
		<div className={cn('relative rounded-lg border bg-card shadow-sm h-full w-full', className)}>
			<p className="absolute bottom-3 left-5 z-10 text-2xl">
				<span className="font-bold">NTP</span> LiDAR
			</p>
			<Canvas id="potree-canvas">
				<Renderer />
			</Canvas>
		</div>
	);
}
