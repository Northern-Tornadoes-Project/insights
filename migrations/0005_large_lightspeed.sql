CREATE TABLE IF NOT EXISTS "dent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hailpad_id" uuid NOT NULL,
	"major_axis" numeric NOT NULL,
	"minor_axis" numeric NOT NULL,
	"rotation" numeric,
	"centroid_x" numeric NOT NULL,
	"centroid_y" numeric NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "hailpad" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hailpad_name" text NOT NULL,
	"boxfit" numeric NOT NULL,
	"adaptive_block_size" numeric NOT NULL,
	"adaptive_c" numeric NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dent" ADD CONSTRAINT "dent_hailpad_id_hailpad_id_fk" FOREIGN KEY ("hailpad_id") REFERENCES "public"."hailpad"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hailpad" ADD CONSTRAINT "hailpad_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "hailpad" ADD CONSTRAINT "hailpad_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
