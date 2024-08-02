import { FlyControls, PointerLockControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Potree, type PointCloudOctree } from 'potree-core';
import { useEffect, useState } from 'react';
import { cn } from '~/lib/utils';
import { useStore } from './store';

const potree = new Potree();
potree.pointBudget = 200_000;

function Renderer() {
	const { size, shape, setCameraPosition, setCameraRotation } = useStore();
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

		load();
	}, []);

	useEffect(() => {
		if (!pointClouds.length) return;

		// Only ever one point cloud
		const pointCloud = pointClouds[0];

		pointCloud.material.shape = shape;
		pointCloud.material.size = size;
	}, [size, shape]);

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
		<Canvas id="potree-canvas" className={cn('rounded-lg border bg-card shadow-sm', className)}>
			<Renderer />
		</Canvas>
	);
}
