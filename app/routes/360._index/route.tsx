import { Link, MetaFunction, json, useLoaderData, useOutletContext } from '@remix-run/react';
import { motion } from 'framer-motion';
import { LucidePlus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataTable } from '~/components/table/data-table';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { db } from '~/db/db.server';
import { env } from '~/env.server';
import { Path, columns } from './columns';
import { PathCard } from './path-card';

export const meta: MetaFunction = () => {
	return [{ title: 'NTP Insights - 360' }];
};

export async function loader() {
	const paths = await db.query.paths.findMany({
		columns: {
			id: true,
			name: true,
			eventDate: true,
			createdAt: true,
			status: true,
			size: true
		},
		with: {
			segments: {
				columns: {
					id: true,
					index: true
				},
				with: {
					capture: {
						columns: {
							id: true,
							lng: true,
							lat: true
						}
					},
					streetView: {
						columns: {
							id: true
						}
					}
				}
			}
		}
	});

	return json({
		ENV: {
			MAPBOX_KEY: env.MAPBOX_KEY
		},
		paths: paths.map((path) => {
			return {
				id: path.id,
				name: path.name,
				eventDate: path.eventDate,
				createdAt: path.createdAt,
				status: path.status,
				size: path.size,
				captures:
					new Set(path.segments.map((segment) => segment.capture.id)).size +
					new Set(
						path.segments
							.filter((segment) => segment.streetView)
							.map((segment) => segment.streetView?.id)
					).size,
				segments: path.segments
					.sort((a, b) => a.index - b.index)
					.map((segment) => {
						return {
							id: segment.id,
							lat: segment.capture.lat,
							lng: segment.capture.lng
						};
					})
			};
		})
	});
}

export default function () {
	const data = useLoaderData<typeof loader>();
	const paths = useMemo<Path[]>(
		() =>
			data.paths.map((path) => ({
				...path,
				eventDate: new Date(path.eventDate),
				createdAt: new Date(path.createdAt),
				size: path.size || 0,
				segments: path.segments.map((segment) => ({
					id: segment.id,
					lat: Number(segment.lat),
					lng: Number(segment.lng)
				}))
			})),
		[data]
	);
	const userContext = useOutletContext<{
		id: string;
		email: string;
		name: string;
		imageUrl: string;
	} | null>();
	const [path, setPath] = useState<Path | null>(null);

	return (
		<main className="flex flex-col gap-4">
			{userContext && (
				<Link to="/360/new">
					<Button className="max-w-32 gap-2" disabled={!userContext}>
						<LucidePlus size={16} />
						New Path
					</Button>
				</Link>
			)}
			<div className="grid min-h-0 min-w-0 gap-4 xl:grid-flow-col">
				<motion.div layout="size" className="h-min min-w-0">
					<Card>
						<CardHeader>
							<CardTitle>Paths</CardTitle>
							<CardDescription>Explore the different paths available to you.</CardDescription>
						</CardHeader>
						<CardContent>
							<DataTable
								columns={columns}
								data={paths}
								onRowClick={(index) => setPath(paths[index])}
							/>
						</CardContent>
					</Card>
				</motion.div>
				{path && (
					<PathCard
						token={data.ENV.MAPBOX_KEY}
						path={path}
						loggedIn={userContext ? true : false}
						onClose={() => setPath(null)}
					/>
				)}
			</div>
		</main>
	);
}
