import { Link } from '@remix-run/react';
import { LucideEdit, LucideX } from 'lucide-react';
import { Suspense, lazy, useEffect, useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Progress } from '~/components/ui/progress';
import { Skeleton } from '~/components/ui/skeleton';
import { Spinner } from '~/components/ui/spinner';
import { Path } from './columns';
import { StatusBadge } from './status-badge';

const PathMap = lazy(() => import('~/components/path-map'));

export function PathCard({
	path,
	token,
	loggedIn,
	onClose
}: {
	path: Path;
	token: string;
	loggedIn?: boolean;
	onClose: () => void;
}) {
	const [progress, setProgress] = useState<number | null>(null);

	useEffect(() => {
		if (path.status !== 'processing') return;

		// Pull data from /api/service/360/:id to update the status
		const interval = setInterval(async () => {
			const response = await fetch(`/api/service/360/${path.id}`);

			if (!response.ok) {
				clearInterval(interval);
				return;
			}

			const data: {
				completed: boolean;
				progress: number;
			} = await response.json();

			if (data.completed) {
				clearInterval(interval);
				return;
			}

			setProgress(data.progress);
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	return (
		<Card className="h-min min-w-96">
			<div className="flex flex-row items-center justify-between pr-6">
				<CardHeader>
					<CardTitle>{path.name}</CardTitle>
					<StatusBadge status={path.status} />
				</CardHeader>
				<div className="flex flex-row items-center gap-2">
					{loggedIn && (
						<Button
							variant="secondary"
							size="icon"
							onClick={() => {
								if (path.status === 'framepos')
									window.location.href = `/360/new/${path.id}/framepos`;
								else if (path.status === 'uploading')
									window.location.href = `/360/new/${path.id}/images`;
								else window.location.href = `/360/${path.id}`;
							}}
						>
							<LucideEdit />
						</Button>
					)}
					<Button variant="outline" size="icon" onClick={onClose}>
						<LucideX />
					</Button>
				</div>
			</div>
			<CardContent>
				{path.status === 'processing' && (
					<div className="flex flex-row items-center gap-2 pb-4">
						{!!progress ? (
							<>
								<p>Processing {progress.toFixed(1)}%</p>
								<Progress value={progress} />
							</>
						) : (
							<>
								<Spinner />
								<p>Fetching processing service...</p>
							</>
						)}
					</div>
				)}
				<div className="h-[400px] w-full overflow-hidden rounded-md lg:h-96">
					<Suspense fallback={<Skeleton />}>
						<PathMap segments={path.segments} token={token} />
					</Suspense>
				</div>
			</CardContent>
			<CardFooter className="justify-end">
				<Link to={`/360/${path.id}`} prefetch="none">
					<Button>View</Button>
				</Link>
			</CardFooter>
		</Card>
	);
}
