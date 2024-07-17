import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
	server: {
		HOST: z.string().url(),
		DATABASE_URL: z.string(),
		PUBLIC_URL: z.string().optional(),
		RESEND_KEY: z.string(),
		RESEND_EMAIL: z.string(),
		MAPBOX_KEY: z.string(),
		AUTH_SECRET: z.string(),
		COOKIE_SECRET: z.string(),
		SERVICE_360_ENABLED: z.boolean().default(false),
		SERVICE_360_URL: z.string().url(),
		SERVICE_360_DIRECTORY: z.string(),
		SERVICE_360_KEY: z.string(),
		PATH_DIRECTORY: z.string(),
		PUBLIC_PATH_DIRECTORY: z.string(),
		SERVICE_HAILGEN_ENABLED: z.boolean().default(true),
		SERVICE_HAILGEN_URL: z.string().url(),
		SERVICE_HAILGEN_DIRECTORY: z.string(),
		SERVICE_HAILGEN_KEY: z.string(),
		HAILPAD_DIRECTORY: z.string(),
		PUBLIC_HAILPAD_DIRECTORY: z.string()
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true
});
