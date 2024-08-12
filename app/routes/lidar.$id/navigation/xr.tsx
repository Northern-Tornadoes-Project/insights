import { useFrame } from '@react-three/fiber';
import { useXR, useXRControllerState, XROrigin } from '@react-three/xr';
import { useRef } from 'react';
import { Euler, Group, Vector3 } from 'three';

const HORIZONTAL_SPEED = 2.5;
const VERTICAL_SPEED = 1.5;

export function XRControls() {
	const ref = useRef<Group | null>(null);
	const leftController = useXRControllerState('left');
	const rightController = useXRControllerState('right');
	const mode = useXR((state) => state.mode);

	useFrame(({ camera }, delta) => {
		if (mode === null) return;

		// Use left stick to move camera horizontally
		if (!leftController || !rightController || !ref.current) return;

		const leftThumbState = leftController.gamepad['xr-standard-thumbstick'];
		const rightThumbState = rightController.gamepad['xr-standard-thumbstick'];

		if (!leftThumbState || !rightThumbState) return;

		const velocity = new Vector3(
			(leftThumbState.xAxis ?? 0) * delta,
			(rightThumbState.yAxis ?? 0) * delta * -1,
			(leftThumbState.yAxis ?? 0) * delta
		);

		// Make the velocity relative to the camera's rotation (yaw)
		const cameraRotation = new Euler().setFromQuaternion(camera.quaternion, 'YXZ');
		velocity.applyEuler(cameraRotation);

		// Apply speed
		velocity.x *= HORIZONTAL_SPEED;
		velocity.z *= HORIZONTAL_SPEED;
		velocity.y *= VERTICAL_SPEED;

		ref.current.position.add(velocity);
	});

	return <XROrigin ref={ref} />;
}
