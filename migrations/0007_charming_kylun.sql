DO $$ BEGIN
 CREATE TYPE "public"."scan_initialization_status" AS ENUM('uploading', 'processing', 'complete', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"size" integer,
	"folder_name" text NOT NULL,
	"event_date" timestamp NOT NULL,
	"capture_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"status" "scan_initialization_status" DEFAULT 'uploading' NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"viewer_settings" jsonb,
	CONSTRAINT "scans_name_unique" UNIQUE("name"),
	CONSTRAINT "scans_folder_name_unique" UNIQUE("folder_name")
);
--> statement-breakpoint
ALTER TABLE "dent" RENAME COLUMN "rotation" TO "angle";--> statement-breakpoint
ALTER TABLE "paths" ADD COLUMN "capture_date" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "valid_emails" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "valid_emails" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scans" ADD CONSTRAINT "scans_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "scans" ADD CONSTRAINT "scans_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
