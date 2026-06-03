ALTER TABLE "public"."users"
  ADD COLUMN IF NOT EXISTS "en_formation" boolean DEFAULT false;