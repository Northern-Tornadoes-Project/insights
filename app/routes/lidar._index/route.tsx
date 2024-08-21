import { json } from '@remix-run/node';
import { Link, useLoaderData, useOutletContext } from '@remix-run/react';
import { eq } from 'drizzle-orm';
import { LucidePlus } from 'lucide-react';
import { useMemo } from 'react';
import { DataTable } from '~/components/table/data-table';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { db } from '~/db/db.server';
import { scans } from '~/db/schema';
import { columns, Scan } from './columns';

export async function loader() {
	return json({
		scans: await db.query.scans.findMany({
			columns: {
				id: true,
				name: true,
				eventDate: true,
				captureDate: true,
				status: true,
				hidden: true,
				size: true
			},
			where: eq(scans.hidden, false)
		})
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
			<Card>
				<CardHeader>
					<CardTitle>LiDAR Scans</CardTitle>
					<CardDescription>Explore the different scans available to you.</CardDescription>
				</CardHeader>
				<CardContent>
					<DataTable columns={columns} data={data} />
				</CardContent>
			</Card>
		</main>
	);
}
