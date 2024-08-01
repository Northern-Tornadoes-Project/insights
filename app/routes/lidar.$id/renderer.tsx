import { FlyControls, PointerLockControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Potree, type PointCloudOctree } from 'potree-core';
import { useEffect, useState } from 'react';
import { useStore } from './store';

const potree = new Potree();
potree.pointBudget = 200_000;

export default function () {
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
		if (pointClouds.length === 0) return;

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
