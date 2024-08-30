import type { Config } from 'drizzle-kit';

export default {
	schema: './app/db/schema.ts',
	out: 'migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: process.env.DATABASE_URL || 'NOT_SET'
	},
	verbose: process.env.NODE_ENV === 'development',
	strict: true
} satisfies Config;
