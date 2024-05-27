import type { Config } from 'drizzle-kit';
import { env } from '~/env.server';

export default {
	schema: './app/db/schema.ts',
	out: 'migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: env.DATABASE_URL
	},
	verbose: process.env.NODE_ENV === 'development',
	strict: true
} satisfies Config;
