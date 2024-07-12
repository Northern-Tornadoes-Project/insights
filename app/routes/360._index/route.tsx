import { LoaderFunctionArgs } from '@remix-run/node';
import { Link, MetaFunction, json, useLoaderData, useOutletContext } from '@remix-run/react';
import { motion } from 'framer-motion';
import { LucidePlus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { db } from '~/db/db.server';
import { Path, columns } from './columns';
import { DataTable } from './data-table';
import { PathCard } from './path-card';

export const meta: MetaFunction = () => {
	return [{ title: 'NTP Insights - 360' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);
	const limit = Number(url.searchParams.get('limit')) || 10;
	const page = Number(url.searchParams.get('page')) || 1;

	const paths = await db.query.paths.findMany({
		columns: {
			id: true,
			name: true,
			eventDate: true,
			createdAt: true,
			updatedAt: true,
			status: true,
			size: true
		},
		with: {
			segments: {
				columns: {
					id: true
				},
				with: {
					capture: {
						columns: {
							id: true
						}
					},
					streetView: {
						columns: {
							id: true
						}
					}
				}
			}
		},
		limit,
		offset: (page - 1) * limit
	});

	return json({
		paths: paths.map((path) => {
			return {
				id: path.id,
				name: path.name,
				eventDate: path.eventDate,
				createdAt: path.createdAt,
				updatedAt: path.updatedAt,
				status: path.status,
				size: path.size,
				captures:
					new Set(path.segments.map((segment) => segment.capture.id)).size +
					new Set(
						path.segments
							.filter((segment) => segment.streetView)
							.map((segment) => segment.streetView?.id)
					).size
			};
		})
	});
}

export default function () {
	const data = useLoaderData<typeof loader>();
	const userContext = useOutletContext<{
		id: string;
		email: string;
		name: string;
		imageUrl: string;
	} | null>();
	const [path, setPath] = useState<Path | null>(null);

	return (
		<div className="flex flex-col gap-4">
			{userContext && (
				<Link to="/360/new">
					<Button className="max-w-32 gap-2" disabled={!userContext}>
						<LucidePlus size={16} />
						New Path
					</Button>
				</Link>
			)}
			<div className="grid xl:grid-flow-col gap-4 min-w-0 min-h-0">
				<motion.div layout="size" className="min-w-0 h-min">
					<Card>
						<CardHeader>
							<CardTitle>Paths</CardTitle>
							<CardDescription>Explore the different paths available to you.</CardDescription>
						</CardHeader>
						<CardContent>
							<DataTable
								columns={columns}
								data={data.paths.map((path) => {
									return {
										...path,
										createdAt: new Date(path.createdAt),
										updatedAt: new Date(path.updatedAt),
										eventDate: new Date(path.eventDate)
									} as Path;
								})}
								onRowClick={(index) =>
									setPath({
										...data.paths[index],
										createdAt: new Date(data.paths[index].createdAt),
										updatedAt: new Date(data.paths[index].updatedAt),
										eventDate: new Date(data.paths[index].eventDate),
										size: data.paths[index].size || 0
									})
								}
							/>
						</CardContent>
					</Card>
				</motion.div>
				{path && (
					<PathCard
						path={path}
						loggedIn={userContext ? true : false}
						onClose={() => setPath(null)}
					/>
				)}
			</div>
		</div>
	);
}
