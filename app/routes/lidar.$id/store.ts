import { create } from 'zustand';

export const useStore = create<{
	cameraPosition: [number, number, number];
	cameraRotation: [number, number, number];
	shape: number;
	size: number;
	setShape: (shape: number) => void;
	setSize: (size: number) => void;
	setCameraPosition: (position: [number, number, number]) => void;
	setCameraRotation: (rotation: [number, number, number]) => void;
}>((set) => ({
	cameraPosition: [0, 0, 0],
	cameraRotation: [0, 0, 0],
	shape: 0,
	size: 1,
	setShape: (shape: number) => set({ shape }),
	setSize: (size: number) => set({ size }),
	setCameraPosition: (cameraPosition: [number, number, number]) => set({ cameraPosition }),
	setCameraRotation: (cameraRotation: [number, number, number]) => set({ cameraRotation })
}));
