import { MetaFunction, json, useLoaderData, useOutletContext } from '@remix-run/react';
import { Path, columns } from './columns';
import { DataTable } from './data-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { useState } from 'react';
import { PathCard } from './path-card';
import { motion } from 'framer-motion';

export const meta: MetaFunction = () => {
	return [{ title: 'NTP Insights - 360' }];
};

export async function loader() {
	return json({
		paths: [
			{
				id: '1',
				name: 'Didsbury',
				size: 1254,
				captures: 123,
				created: new Date(),
				modified: new Date(),
				status: 'archived'
			},
			{
				id: '2',
				name: 'Testing',
				size: 1254,
				captures: 123,
				created: new Date(),
				modified: new Date(),
				status: 'processing'
			}
		] as Path[]
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
									created: new Date(path.created),
									modified: new Date(path.modified)
								};
							})}
							onRowClick={(index) =>
								setPath({
									...data.paths[index],
									created: new Date(data.paths[index].created),
									modified: new Date(data.paths[index].modified)
								})
							}
						/>
					</CardContent>
				</Card>
			</motion.div>
			{path && (
				<PathCard path={path} loggedIn={userContext ? true : false} onClose={() => setPath(null)} />
			)}
		</div>
	);
}
