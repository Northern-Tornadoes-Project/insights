ALTER TABLE "hailpad" RENAME COLUMN "hailpad_name" TO "name";--> statement-breakpoint
ALTER TABLE "hailpad" ADD COLUMN "folder_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "hailpad" ADD CONSTRAINT "hailpad_name_unique" UNIQUE("name");--> statement-breakpoint
ALTER TABLE "hailpad" ADD CONSTRAINT "hailpad_folder_name_unique" UNIQUE("folder_name");