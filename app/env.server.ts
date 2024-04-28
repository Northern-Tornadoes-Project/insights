import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
	server: {
		DATABASE_URL: z.string(),
		PUBLIC_URL: z.string().optional(),
		RESEND_KEY: z.string(),
		RESEND_EMAIL: z.string(),
		AUTH_SECRET: z.string(),
		COOKIE_SECRET: z.string()
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true
});
