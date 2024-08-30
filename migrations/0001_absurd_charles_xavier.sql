ALTER TABLE "path_segments" DROP CONSTRAINT "path_segments_capture_id_captures_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "path_segments" ADD CONSTRAINT "path_segments_capture_id_captures_id_fk" FOREIGN KEY ("capture_id") REFERENCES "public"."captures"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "captures" DROP COLUMN IF EXISTS "created_at";