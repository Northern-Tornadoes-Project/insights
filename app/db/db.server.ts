import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '~/db/schema';
import { paths, pathSegments } from '~/db/schema';
import { env } from '~/env.server';

const pool = new pg.Pool({
	connectionString: env.DATABASE_URL
});

export const db = drizzle(pool, {
	schema
});

export function getUser(id: number) {
	return db.query.users.findFirst({
		where: eq(schema.users.id, id)
	});
}

export async function updatePathSize(id: string) {
	const segments = await db.query.pathSegments.findMany({
		where: eq(pathSegments.pathId, id),
		columns: {
			id: true
		},
		with: {
			capture: {
				columns: {
					size: true
				}
			},
			streetView: {
				columns: {
					size: true
				}
			}
		}
	});

	const size = segments.reduce((total, segment) => {
		const totalSize = segment.capture.size + (segment.streetView ? segment.streetView.size : 0);
		return total + totalSize;
	}, 0);

	await db
		.update(paths)
		.set({
			size: Number.isNaN(size) ? undefined : size
		})
		.where(eq(paths.id, id));
}
