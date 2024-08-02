import { CameraControls, Html, useProgress } from '@react-three/drei';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { XR, useXR, useXRControllerState, useXRStore } from '@react-three/xr';
import {
	LucideChevronDown,
	LucideChevronUp,
	LucideChevronsDown,
	LucideChevronsUp,
	LucideExpand,
	LucideGlasses,
	LucideNavigation2,
	LucideShrink
} from 'lucide-react';
import { Suspense, useEffect, useRef, useState } from 'react';
import {
	BackSide,
	EquirectangularReflectionMapping,
	LinearFilter,
	Mesh,
	RepeatWrapping,
	Texture,
	TextureLoader,
	Vector3
} from 'three';
import { degToRad, radToDeg } from 'three/src/math/MathUtils.js';
import { Label } from '~/components/ui/label';
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group';
import { captures } from '~/db/schema';

function MovementController(props: {
	hand: 'left' | 'right';
	on0?: () => void;
	on1?: () => void;
	on5?: () => void;
	on2Right?: () => void;
	on2Left?: () => void;
	on3Fwd?: () => void;
	on3Bwd?: () => void;
}) {
	const { mode } = useXR();
	const controller = useXRControllerState(props.hand);

	useFrame(() => {
		if (controller && mode === 'immersive-vr') {
			const gamepad = controller.inputSource?.gamepad;

			// Buttons
			if (gamepad?.buttons[0].pressed) props.on0?.();
			if (gamepad?.buttons[1].pressed) props.on1?.();
			if (gamepad?.buttons[5].pressed) props.on5?.();
		}
	});

	return <></>;
}

function Loader() {
	const { progress, errors } = useProgress();

	if (errors.length > 0) {
		return (
			<Html center>
				<div className="flex h-full flex-col items-center justify-center">
					<div className="text-2xl font-bold">Error</div>
					<div className="text-lg">Could not load image!</div>
					<div className="text-sm">
						{errors.map((error) => (
							<p key={error}>{error}</p>
						))}
					</div>
				</div>
			</Html>
		);
	}

	return (
		<Html center>
			<div className="flex h-full flex-col items-center justify-center">
				<div className="text-2xl font-bold">Loading</div>
				<div className="text-lg">{progress.toFixed(2)}%</div>
			</div>
		</Html>
	);
}

function StreetViewImage({ image, startingAngle }: { image: string; startingAngle: number }) {
	const meshRef = useRef<Mesh>(null);

	let texture: Texture | null = null;
	texture = useLoader(TextureLoader, image);

	if (!texture) return null;

	useEffect(() => {
		texture.mapping = EquirectangularReflectionMapping;
		texture.minFilter = texture.magFilter = LinearFilter;
		texture.wrapS = RepeatWrapping;
		texture.repeat.x = -1;
		texture.needsUpdate = true;

		meshRef.current?.setRotationFromAxisAngle(new Vector3(0, 1, 0), -startingAngle);
	}, [texture, startingAngle]);

	return (
		<mesh ref={meshRef}>
			<sphereGeometry attach="geometry" args={[500, 60, 40, 90]} />
			<meshBasicMaterial attach="material" map={texture} side={BackSide} />
		</mesh>
	);
}

export default function Viewer360({
	capture,
	captureURL,
	pathProgress,
	currentState,
	onCurrentStateChange,
	onNext,
	onJumpNext,
	onPrevious,
	onJumpPrevious,
	className
}: {
	capture: typeof captures.$inferSelect;
	captureURL: string;
	pathProgress: {
		hasBefore: boolean;
		hasNext: boolean;
		hasPrevious: boolean;
		hasNextJump: boolean;
		hasPreviousJump: boolean;
	};
	currentState: 'before' | 'after';
	onCurrentStateChange: (value: 'before' | 'after') => void;
	onNext: () => void;
	onJumpNext: () => void;
	onPrevious: () => void;
	onJumpPrevious: () => void;
	className?: string;
}) {
	const fullscreenRef = useRef<HTMLDivElement>(null);
	const cameraControlsRef = useRef<CameraControls>(null);
	const [hidden, setHidden] = useState(false);
	const [fullscreen, setFullscreen] = useState(false);
	const [input, setInput] = useState(false);
	const [startingAngle, setStartingAngle] = useState(capture.heading ? Number(capture.heading) : 0);
	const [rotation, setRotation] = useState(0);
	const store = useXRStore();

	const toggleFullscreen = async () => {
		if (fullscreen) {
			await document.exitFullscreen();
			setFullscreen(false);
		} else {
			await fullscreenRef.current?.requestFullscreen();
			setFullscreen(true);
		}
	};

	const toggleUI = (event: KeyboardEvent) => {
		if (event.key.toLowerCase() === 'h') {
			setHidden(!hidden);
		}
	};

	const setCurrentImage = (value: 'before' | 'after') => {
		if (value === 'before' && !pathProgress.hasBefore) return;
		onCurrentStateChange(value);
	};

	useEffect(() => {
		document.addEventListener('fullscreenchange', () => {
			setFullscreen(document.fullscreenElement !== null);
		});

		document.addEventListener('keydown', toggleUI);

		return () => {
			document.removeEventListener('fullscreenchange', () => {
				setFullscreen(document.fullscreenElement !== null);
			});

			document.removeEventListener('keydown', toggleUI);
		};
	});

	useEffect(() => {
		setStartingAngle(capture.heading ? Number(capture.heading) : 0);
	}, [capture]);

	return (
		<div
			className={className}
			ref={fullscreenRef}
			tabIndex={0}
			onKeyDown={(e) => {
				e.preventDefault();
				if (e.key == 'ArrowUp') {
					onNext?.();
				} else if (e.key == 'ArrowDown') {
					onPrevious?.();
				}
			}}
		>
			<div className="absolute bottom-3 left-5 z-10 text-2xl">
				<span className="font-bold">NTP</span> 360
			</div>
			<div className="absolute z-10 m-2 flex flex-row items-center gap-4 rounded-lg bg-background/60 p-2 text-lg backdrop-blur">
				<RadioGroup
					onValueChange={(value) => {
						if (value !== 'before' && value !== 'after') return;
						setCurrentImage(value);
					}}
					value={currentState}
					defaultChecked
					defaultValue="after"
				>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="before" id="before" disabled={!pathProgress.hasBefore} />
						<Label
							htmlFor="before"
							className={!pathProgress.hasBefore ? 'text-primary/50' : undefined}
						>
							Before
						</Label>
					</div>
					<div className="flex items-center space-x-2">
						<RadioGroupItem value="after" id="after" />
						<Label htmlFor="after">After</Label>
					</div>
				</RadioGroup>
			</div>
			<div
				className="absolute right-0 z-10 m-2 rounded-lg bg-background/60 p-2 backdrop-blur transition hover:cursor-pointer hover:bg-foreground/40 hover:text-background"
				onClick={() => {
					if (!cameraControlsRef.current) return;
					cameraControlsRef.current.rotateAzimuthTo(0, true);
				}}
			>
				<LucideNavigation2
					className="transform-gpu"
					style={{
						transform: `rotate(${rotation}deg)`
					}}
				/>
			</div>
			<div className="absolute bottom-1/2 right-0 top-1/2 z-10 m-2 flex flex-col items-center justify-center gap-4">
				<button
					className="rounded-lg bg-background/60 p-2 backdrop-blur transition hover:cursor-pointer hover:bg-foreground/40 hover:text-background disabled:pointer-events-none disabled:opacity-50"
					onClick={() => onJumpNext?.()}
					disabled={!pathProgress.hasNextJump}
				>
					<LucideChevronsUp />
				</button>
				<button
					className="rounded-lg bg-background/60 p-2 backdrop-blur transition hover:cursor-pointer hover:bg-foreground/40 hover:text-background disabled:pointer-events-none disabled:opacity-50"
					onClick={() => onNext?.()}
					disabled={!pathProgress.hasNext}
				>
					<LucideChevronUp />
				</button>
				<button
					className="rounded-lg bg-background/60 p-2 backdrop-blur transition hover:cursor-pointer hover:bg-foreground/40 hover:text-background disabled:pointer-events-none disabled:opacity-50"
					onClick={() => onPrevious?.()}
					disabled={!pathProgress.hasPrevious}
				>
					<LucideChevronDown />
				</button>
				<button
					className="rounded-lg bg-background/60 p-2 backdrop-blur transition hover:cursor-pointer hover:bg-foreground/40 hover:text-background disabled:pointer-events-none disabled:opacity-50"
					onClick={() => onJumpPrevious?.()}
					disabled={!pathProgress.hasPreviousJump}
				>
					<LucideChevronsDown />
				</button>
			</div>
			<div className="absolute bottom-0 right-0 z-10 m-2 flex flex-row gap-4">
				<button
					onClick={() => {
						if (store.getState().mode === 'immersive-vr') return;
						store.enterVR();
					}}
					className="rounded-lg bg-background/60 p-2 backdrop-blur transition hover:cursor-pointer hover:bg-foreground/40 hover:text-background disabled:pointer-events-none disabled:opacity-50"
				>
					<LucideGlasses />
				</button>
				<button
					onClick={() => {
						void (async () => {
							await toggleFullscreen();
						})();
					}}
					className="rounded-lg bg-background/60 p-2 backdrop-blur transition hover:cursor-pointer hover:bg-foreground/40 hover:text-background"
				>
					{fullscreen ? <LucideShrink /> : <LucideExpand />}
				</button>
			</div>
			<Canvas className="touch-none">
				<CameraControls
					ref={cameraControlsRef}
					dollySpeed={2}
					minZoom={0.5}
					azimuthRotateSpeed={-0.5}
					polarRotateSpeed={-0.5}
					draggingSmoothTime={0}
					makeDefault
					// https://github.com/yomotsu/camera-controls/blob/cee042753169f3bbeb593833ce92d70d52b6862f/src/types.ts#L29C1-L47
					mouseButtons={{
						left: 1,
						middle: 0,
						right: 0,
						wheel: 16
					}}
					touches={{
						one: 32,
						two: 512,
						three: 0
					}}
					onChange={() => {
						if (!cameraControlsRef.current) return;
						cameraControlsRef.current.normalizeRotations();
						setRotation(radToDeg(cameraControlsRef.current.azimuthAngle));
					}}
				/>
				<XR store={store}>
					<MovementController
						hand="left"
						on1={() => {
							setInput(!input);
							input ? onJumpPrevious?.() : undefined;
						}} // Left Grip (Jump Backward)
						on0={() => {
							setInput(!input);
							input ? onPrevious?.() : undefined;
						}} // Left Trigger (Backward)
						on5={() => {
							setCurrentImage('before');
						}} // Y (Before)
					/>
					<MovementController
						hand="right"
						on1={() => {
							setInput(!input);
							input ? onJumpNext?.() : undefined;
						}} // Right Grip (Jump Forward)
						on0={() => {
							setInput(!input);
							input ? onNext?.() : undefined;
						}} // Right Trigger (Forward)
						on5={() => {
							setCurrentImage('after');
						}} // B (After)
					/>
					<Suspense fallback={<Loader />}>
						<StreetViewImage image={captureURL} startingAngle={degToRad(startingAngle)} />
					</Suspense>
				</XR>
			</Canvas>
		</div>
	);
}
