import { Link, MetaFunction, json, useLoaderData, useOutletContext } from '@remix-run/react';
import { count, eq } from 'drizzle-orm';
import { motion } from 'framer-motion';
import { LucidePlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DataTable } from '~/components/table/data-table';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { db } from '~/db/db.server';
import { dent, hailpad } from '~/db/schema';
import { Hailpad, columns } from './columns';
import { HailpadCard } from './hailpad-card';
import { env } from '~/env.server';

export const meta: MetaFunction = () => {
	return [{ title: 'CSSL Insights - Hailgen' }];
};

export async function loader() {
	const basePath = `${env.BASE_URL}/${env.PUBLIC_HAILPAD_DIRECTORY}`;

	return json({
		hailpads: await db
			.select({
				id: hailpad.id,
				name: hailpad.name,
				folderName: hailpad.folderName,
				dents: count(dent.id),
				createdAt: hailpad.createdAt,
				updatedAt: hailpad.updatedAt
			})
			.from(hailpad)
			.where(eq(hailpad.hidden, false))
			.leftJoin(dent, eq(hailpad.id, dent.hailpadId))
			.groupBy(hailpad.id),
		basePath: basePath
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
	const [hailpad, setHailpad] = useState<Hailpad | null>(null);
	const [depthMapPath, setDepthMapPath] = useState<string | null>(null);

	useEffect(() => {
		if (hailpad) setDepthMapPath(`${data.basePath}/${hailpad.folderName}/dmap.png`);
	}, [hailpad]);

	return (
		<div className="flex flex-col gap-4">
			{userContext && (
				<Link to="/hailgen/new">
					<Button className="max-w-44 gap-2" disabled={!userContext}>
						<LucidePlus size={16} />
						New Hailpad Scan
					</Button>
				</Link>
			)}
			<div className="grid min-h-0 min-w-0 gap-4 xl:grid-flow-col">
				<motion.div layout="size" className="h-min min-w-0">
					<Card>
						<CardHeader>
							<CardTitle>Hailpad Scans</CardTitle>
							<CardDescription>View hailpad scans with detailed analyses.</CardDescription>
						</CardHeader>
						<CardContent>
							<DataTable
								columns={columns}
								data={data.hailpads.map((hailpad) => {
									return {
										...hailpad,
										dents: hailpad.dents,
										createdAt: new Date(hailpad.createdAt),
										updatedAt: new Date(hailpad.updatedAt)
									} as Hailpad;
								})}
								onRowClick={(index) =>
									setHailpad({
										...data.hailpads[index],
										name: data.hailpads[index].name,
										dents: data.hailpads[index].dents,
										createdAt: new Date(data.hailpads[index].createdAt),
										updatedAt: new Date(data.hailpads[index].updatedAt)
									})
								}
							/>
						</CardContent>
					</Card>
				</motion.div>
				{hailpad && (
					<div className="h-full">
					<HailpadCard
						hailpad={hailpad}
						depthMapPath={depthMapPath || ''}
						onClose={() => setHailpad(null)}
					/>
					</div>
				)}
			</div>
		</div>
	);
}
