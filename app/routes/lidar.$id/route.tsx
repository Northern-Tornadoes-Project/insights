import { Suspense, lazy } from 'react';
import { Skeleton } from '~/components/ui/skeleton';
import { Options } from './options';

const Renderer = lazy(() => import('./renderer'));

export default function () {
	return (
		<main className="flex flex-row justify-between gap-2">
			<div className="h-[750px] w-full">
				<Suspense fallback={<Skeleton />}>
					<Renderer />
				</Suspense>
			</div>
			<Options />
		</main>
	);
}
