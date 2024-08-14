import { json, LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData, useOutletContext } from '@remix-run/react';
import { LucidePlus } from 'lucide-react';
import { useMemo } from 'react';
import { DataTable } from '~/components/table/data-table';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { db } from '~/db/db.server';
import { columns, Scan } from './columns';

export async function loader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);
	const limit = Number(url.searchParams.get('limit')) || 10;
	const page = Number(url.searchParams.get('page')) || 1;

	const scans = await db.query.scans.findMany({
		columns: {
			id: true,
			name: true,
			eventDate: true,
			captureDate: true,
			status: true,
			size: true
		},
		limit,
		offset: (page - 1) * limit
	});

	return json({
		scans
	});
}

export default function () {
	const { scans } = useLoaderData<typeof loader>();
	const data = useMemo<Scan[]>(
		() =>
			scans.map((scan) => ({
				...scan,
				eventDate: new Date(scan.eventDate),
				captureDate: new Date(scan.captureDate),
				size: scan.size || 0
			})),
		[scans]
	);

	const userContext = useOutletContext<{
		id: string;
		email: string;
		name: string;
		imageUrl: string;
	} | null>();

	return (
		<main className="flex flex-col gap-4">
			{userContext && (
				<Link to="/lidar/new">
					<Button className="max-w-32 gap-2" disabled={!userContext}>
						<LucidePlus size={16} />
						New Scan
					</Button>
				</Link>
			)}
			<div className="grid min-h-0 min-w-0 gap-4 xl:grid-flow-col">
				<Card>
					<CardHeader>
						<CardTitle>Scans</CardTitle>
						<CardDescription>Explore the different scans available to you.</CardDescription>
					</CardHeader>
					<CardContent>
						<DataTable columns={columns} data={data} />
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
