import { z } from 'zod';

export const StatusUpdateSchema = z.object({
	status: z.enum(['complete', 'failed'])
});

export const StatusResponseSchema = z.object({
	task_status: z.object({
		number_of_files: z.number(),
		progress: z.number(),
		completed: z.boolean()
	})
});
