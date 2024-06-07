import { Link, MetaFunction, json, useLoaderData, useOutletContext } from '@remix-run/react';
import { Path, columns } from './columns';
import { DataTable } from './data-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { useState } from 'react';
import { PathCard } from './path-card';
import { motion } from 'framer-motion';
import { Button } from '~/components/ui/button';
import { LucidePlus } from 'lucide-react';
import { db } from '~/db/db.server';
import { LoaderFunctionArgs } from '@remix-run/node';
import { captures, pathSegments, paths } from '~/db/schema';
import { count, eq, or } from 'drizzle-orm';

export const meta: MetaFunction = () => {
	return [{ title: 'NTP Insights - 360' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);
	const limit = Number(url.searchParams.get('limit')) || 10;
	const page = Number(url.searchParams.get('page')) || 1;

	return json({
		paths: await db
			.select({
				id: paths.id,
				name: paths.name,
				eventDate: paths.eventDate,
				createdAt: paths.createdAt,
				updatedAt: paths.updatedAt,
				status: paths.status,
				captures: count(pathSegments.id),
				size: count(captures.size)
			})
			.from(paths)
			.leftJoin(pathSegments, eq(paths.id, pathSegments.pathId))
			.leftJoin(
				captures,
				or(eq(pathSegments.captureId, captures.id), eq(pathSegments.streetViewId, captures.id))
			)
			.limit(limit)
			.offset((page - 1) * limit)
			.groupBy(paths.id)
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
										eventDate: new Date(data.paths[index].eventDate)
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
