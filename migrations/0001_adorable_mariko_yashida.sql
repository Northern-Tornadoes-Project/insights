DO $$ BEGIN
 CREATE TYPE "public"."path_initialization_status" AS ENUM('framepos', 'uploading', 'processing', 'complete', 'failed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
