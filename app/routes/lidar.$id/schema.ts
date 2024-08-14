import { z } from 'zod';

export const viewerSettingsSchema = z
	.object({
		position: z.array(z.number()).length(3),
		rotation: z.array(z.number()).length(3)
	})
	.nullable();

export type ViewerSettings = z.infer<typeof viewerSettingsSchema>;

export const actionSchema = z.object({
	type: z.literal('setTransform'),
	payload: viewerSettingsSchema
});
