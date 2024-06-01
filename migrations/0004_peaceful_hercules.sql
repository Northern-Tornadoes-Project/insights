ALTER TABLE "paths" ADD COLUMN "framepos_data" json[];--> statement-breakpoint
ALTER TABLE "paths" DROP COLUMN IF EXISTS "frame_pos_data";