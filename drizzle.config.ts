import type { Config } from 'drizzle-kit';
import { env } from '~/env.server';

export default {
	schema: './app/db/schema.ts',
	out: 'migrations',
	driver: 'pg',
	dbCredentials: {
		connectionString: env.DATABASE_URL
	},
	verbose: true,
	strict: true
} satisfies Config;
