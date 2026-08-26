-- 1. Version validée par l'utilisateur
ALTER TABLE "public"."viewupdate"
  ADD COLUMN IF NOT EXISTS "last_seen_version" text;

-- 2. Reprise de l'existant : une ligne présente signifiait « a vu la dernière
--    version en date au moment de cette migration », soit la 3.75.
UPDATE "public"."viewupdate"
   SET "last_seen_version" = '3.75'
 WHERE "last_seen_version" IS NULL;

-- 3. L'upsert (ON CONFLICT user_email) passe désormais par un UPDATE à chaque
--    nouvelle version. Il manquait la policy correspondante : sans elle, la
--    mise à jour était rejetée par RLS et l'utilisateur revoyait le modal
--    indéfiniment. On aligne au passage sur le nommage des autres tables.
DROP POLICY IF EXISTS "viewupdate_update" ON "public"."viewupdate";
CREATE POLICY "viewupdate_update" ON "public"."viewupdate"
  FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);
