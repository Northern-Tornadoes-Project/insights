import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { createXRStore, XR } from '@react-three/xr';
import { LucideGlasses } from 'lucide-react';
import { PointSizeType, Potree, type PointCloudOctree } from 'potree-core';
import { useEffect, useMemo, useState } from 'react';
import { Euler, Vector3 } from 'three';
import { useShallow } from 'zustand/react/shallow';
import { cn } from '~/lib/utils';
import Earth from './navigation/earth';
import Fly from './navigation/fly';
import { XRControls } from './navigation/xr';
import { useStore } from './store';

const potree = new Potree();

function DebugTools() {
	const { cameraPosition, cameraRotation, setCameraPosition, setCameraRotation, setFPS } = useStore(
		useShallow((state) => ({
			cameraPosition: state.cameraPosition,
			cameraRotation: state.cameraRotation,
			setCameraPosition: state.setCameraPosition,
			setCameraRotation: state.setCameraRotation,
			setFPS: state.setFPS
		}))
	);

	useFrame(({ camera }, delta) => {
		// Calculate FPS
		setFPS(Math.floor(1 / delta));

		// Check if the camera has moved
		const oldPosition = new Vector3(...cameraPosition);
		const oldRotation = new Euler(...cameraRotation);

		if (!camera.position.equals(oldPosition)) {
			setCameraPosition([camera.position.x, camera.position.y, camera.position.z]);
		}

		if (!camera.rotation.equals(oldRotation)) {
			setCameraRotation([camera.rotation.x, camera.rotation.y, camera.rotation.z]);
		}
	});

	return null;
}

function Renderer() {
	const { size, shape, budget, cameraControl } = useStore(
		useShallow((state) => ({
			size: state.size,
			shape: state.shape,
			budget: state.budget,
			cameraControl: state.cameraControl
		}))
	);
	const scene = useThree((state) => state.scene);
	const [pointClouds, setPointClouds] = useState<PointCloudOctree[]>([]);

	useEffect(() => {
		potree.pointBudget = budget;

		console.log('[LiDAR Renderer] Loading point cloud...');

		(async () => {
			const result = await potree.loadPointCloud(
				'metadata.json',
				(url) => `/scans/aceb_scan/output/${url}`
			);

			// Ensure the axes are aligned with the world axes
			result.position.set(0, 0, 0);
			result.rotation.x = -Math.PI / 2;
			result.material.shape = shape;
			result.material.size = size;

			result.material.inputColorEncoding = 1;
			result.material.outputColorEncoding = 1;

			// Set the point size type to adaptive
			result.material.pointSizeType = PointSizeType.ADAPTIVE;

			// Set to proper shader
			result.material.updateShaderSource();

			scene.clear();
			scene.add(result);
			setPointClouds([result]);

			console.log('[LiDAR Renderer] Loaded point cloud!');
		})();
	}, []);

	useEffect(() => {
		console.log('[LiDAR Renderer] Updating point budget...');
		potree.pointBudget = budget;
	}, [budget]);

	useEffect(() => {
		if (!pointClouds.length) return;

		console.log('[LiDAR Renderer] Updating point cloud...');

		// Only ever one point cloud
		const pointCloud = pointClouds[0];

		pointCloud.material.shape = shape;
		pointCloud.material.size = size;
	}, [size, shape]);

	// Overwrite the default render loop
	useFrame(({ gl, camera }) => {
		potree.updatePointClouds(pointClouds, camera, gl);
		gl.render(scene, camera);
	}, 1);

	return (
		<>
			{cameraControl === 'fly' && <Fly selector="#potree-canvas" />}
			{cameraControl === 'earth' && <Earth />}
		</>
	);
}

export default function ({ className }: { className?: string }) {
	const xrStore = useMemo(() => createXRStore(), []);

	return (
		<div className={cn('relative h-full w-full rounded-lg border bg-card shadow-sm', className)}>
			<p className="absolute bottom-3 left-5 z-10 text-2xl">
				<span className="font-bold">NTP</span> LiDAR
			</p>
			<div className="absolute bottom-0 right-0 z-10 m-2 flex flex-row gap-4">
				<button
					onClick={() => {
						xrStore.enterVR();
					}}
					className="rounded-lg bg-background/60 p-2 backdrop-blur transition hover:cursor-pointer hover:bg-foreground/40 hover:text-background disabled:pointer-events-none disabled:opacity-50"
				>
					<LucideGlasses />
				</button>
			</div>
			<Canvas id="potree-canvas">
				<XR store={xrStore}>
					<XRControls />
					<Renderer />
					<DebugTools />
				</XR>
			</Canvas>
		</div>
	);
}
