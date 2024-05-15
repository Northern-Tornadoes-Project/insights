import { MetaFunction, json, useLoaderData } from '@remix-run/react';
import { Path, columns } from './columns';
import { DataTable } from './data-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';

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
			}
		] as Path[]
	});
}

export default function Dashboard() {
	const data = useLoaderData<typeof loader>();

	return (
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
				/>
			</CardContent>
		</Card>
	);
}
