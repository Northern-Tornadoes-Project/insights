import { Suspense, lazy } from 'react';
import { Options } from './options';

const Renderer = lazy(() => import('./renderer'));

export default function () {
	return (
		<main className="flex flex-row justify-between gap-2">
			<div className="h-[750px] w-full">
				<Suspense fallback={<div>Loading...</div>}>
					<Renderer />
				</Suspense>
			</div>
			<Options />
		</main>
	);
}
