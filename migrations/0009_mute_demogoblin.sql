ALTER TABLE "hailpad" ADD COLUMN "max_depth" numeric NOT NULL;--> statement-breakpoint
ALTER TABLE "paths" ADD COLUMN "hidden" boolean DEFAULT false NOT NULL;