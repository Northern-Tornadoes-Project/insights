import { z } from 'zod';

export const PanoramaSchema = z.object({
	pano_id: z.string(),
	lat: z.number(),
	lon: z.number(),
	heading: z.number(),
	pitch: z.number().nullable(),
	roll: z.number().nullable(),
	date: z
		.string()
		.transform((date) => new Date(date))
		.or(z.date())
		.nullable(),
	elevation: z.number().nullable()
});

export type Panorama = z.infer<typeof PanoramaSchema>;
