import { Canvas } from '@react-three/fiber';
import { lazy, Suspense } from 'react';
import { Skeleton } from '~/components/ui/skeleton';
import { Options } from './options';

const Renderer = lazy(() => import('./renderer'));

export default function () {
	return (
		<main className="flex flex-row justify-between gap-2">
			<div className="h-[750px] w-full">
				<Suspense fallback={<Skeleton />}>
					<Canvas id="potree-canvas" className="rounded-lg border bg-card shadow-sm">
						<Renderer />
					</Canvas>
				</Suspense>
			</div>
		</main>
	);
}
