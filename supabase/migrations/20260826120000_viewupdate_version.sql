-- ─── « Quoi de neuf ? » : mémoriser LA VERSION vue, et non plus « vu / pas vu » ──
--
-- Avant : une ligne dans `viewupdate` = « cet utilisateur a vu le modal », sans
-- savoir quelle version. Publier une nouvelle version imposait donc de vider la
-- table à la main (DELETE FROM viewupdate) — manipulation manuelle, risquée et
-- impossible à tracer.
--
-- Après : on stocke la version validée. Le modal se ré-affiche automatiquement
-- dès que la version publiée (app/utils/changelog.js → APP_VERSION) diffère de
-- celle mémorisée. Plus aucune intervention en base pour livrer.

-- 1. Version validée par l'utilisateur
ALTER TABLE "public"."viewupdate"
  ADD COLUMN IF NOT EXISTS "last_seen_version" text;

-- 2. Reprise de l'existant : on positionne volontairement les lignes déjà
--    présentes sur l'AVANT-DERNIÈRE version (3.7.0) et non sur la 3.75. Les
--    utilisateurs concernés se verront donc proposer une dernière fois le modal
--    « Quoi de neuf ? » de la 3.75, ce qui valide le nouveau mécanisme en
--    conditions réelles dès la mise en production.
UPDATE "public"."viewupdate"
   SET "last_seen_version" = '3.7.0'
 WHERE "last_seen_version" IS NULL;

-- 3. L'upsert (ON CONFLICT user_email) passe désormais par un UPDATE à chaque
--    nouvelle version. Il manquait la policy correspondante : sans elle, la
--    mise à jour était rejetée par RLS et l'utilisateur revoyait le modal
--    indéfiniment. On aligne au passage sur le nommage des autres tables.
DROP POLICY IF EXISTS "viewupdate_update" ON "public"."viewupdate";
CREATE POLICY "viewupdate_update" ON "public"."viewupdate"
  FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);
