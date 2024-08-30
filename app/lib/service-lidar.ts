import { z } from 'zod';

const StatusSchema = z.enum(['complete', 'failed', 'pending']);

export const StatusUpdateSchema = z.object({
	status: StatusSchema
});

export const StatusResponseSchema = z.object({
	progress: z.number(),
	status: StatusSchema,
	date: z.optional(z.coerce.date())
});
