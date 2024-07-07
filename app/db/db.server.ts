import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '~/db/schema';
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
