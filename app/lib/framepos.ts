import { z } from 'zod';

export const FrameposSchema = z
	.object({
		systemtime_sec: z.number(),
		frame_index: z.number(),
		lat: z.number(),
		lon: z.number(),
		altitude: z.number(),
		distance: z.number(),
		heading: z.number(),
		pitch: z.number(),
		roll: z.number(),
		track: z.number(),
		jpeg_filename: z.string().optional(),
		png_filename: z.string().optional()
	})
	.refine((data) => {
		// Either jpeg or png filename should be present but not both
		return !data.jpeg_filename != !data.png_filename;
	});
