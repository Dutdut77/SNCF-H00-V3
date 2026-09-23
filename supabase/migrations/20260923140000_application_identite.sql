-- ─── Identité de l'application (design V4) ──────────────────────────────────
--
-- H00 Travaux est déployée une fois par infrapôle. Le nom de l'infrapôle et son
-- logo sont réglés par un SuperAdmin dans Paramètres → Application → Identité, puis
-- affichés partout : page de connexion, navbar, pied de page, loader, impressions,
-- e-mails. Les secteurs (UO Travaux, UTM…) restent dans la table `attributions`.
--
-- Une seule ligne (id = 1). Lecture ouverte y compris aux visiteurs non connectés :
-- la page de connexion affiche le nom et le logo. Écriture réservée aux SuperAdmins
-- via is_superadmin() (cf. 20260828120000_annexes_droits_superadmin.sql).

-- ─── 1. Table ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."application" (
  "id" smallint PRIMARY KEY DEFAULT 1 CHECK ("id" = 1),
  "nom_entite" text NOT NULL DEFAULT '',
  "logo_path" text,
  "updated_at" timestamp with time zone NOT NULL DEFAULT "now"()
);

COMMENT ON TABLE "public"."application" IS
  'Identité de l''installation (ligne unique id = 1) : nom de l''infrapôle et chemin du logo dans le bucket « application ».';

-- Installation de l'Infrapôle Paris-Est ; un autre infrapôle modifie ce nom dans les Paramètres.
INSERT INTO "public"."application" ("id", "nom_entite")
VALUES (1, 'Infrapôle Paris-Est')
ON CONFLICT ("id") DO NOTHING;

ALTER TABLE "public"."application" ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON TABLE "public"."application" TO "anon";
GRANT SELECT, UPDATE ON TABLE "public"."application" TO "authenticated";
GRANT ALL ON TABLE "public"."application" TO "service_role";

DROP POLICY IF EXISTS "application_select" ON "public"."application";
CREATE POLICY "application_select" ON "public"."application"
  FOR SELECT TO "anon", "authenticated" USING (true);

-- Pas d'INSERT ni de DELETE applicatifs : la ligne unique est créée ci-dessus.
DROP POLICY IF EXISTS "application_update" ON "public"."application";
CREATE POLICY "application_update" ON "public"."application"
  FOR UPDATE TO "authenticated"
  USING ("public"."is_superadmin"())
  WITH CHECK ("public"."is_superadmin"());

-- ─── 2. Bucket du logo ──────────────────────────────────────────────────────
-- Public : le logo s'affiche avant connexion et dans les impressions. PNG ou JPEG
-- seulement (Outlook n'affiche ni le SVG ni le WebP dans les e-mails), 1 Mo maximum.
INSERT INTO "storage"."buckets" ("id", "name", "public", "file_size_limit", "allowed_mime_types")
VALUES ('application', 'application', true, 1048576, ARRAY['image/png', 'image/jpeg'])
ON CONFLICT ("id") DO NOTHING;

-- Écriture : SuperAdmins uniquement. Une policy permissive l'autorise, et des
-- policies RESTRICTIVE l'interdisent à tous les autres, au cas où une policy
-- permissive plus large (créée depuis le dashboard) couvrirait tous les buckets.
DROP POLICY IF EXISTS "application_logo_select" ON "storage"."objects";
CREATE POLICY "application_logo_select" ON "storage"."objects"
  FOR SELECT TO "anon", "authenticated"
  USING ("bucket_id" = 'application');

DROP POLICY IF EXISTS "application_logo_insert" ON "storage"."objects";
CREATE POLICY "application_logo_insert" ON "storage"."objects"
  FOR INSERT TO "authenticated"
  WITH CHECK ("bucket_id" = 'application' AND "public"."is_superadmin"());

DROP POLICY IF EXISTS "application_logo_update" ON "storage"."objects";
CREATE POLICY "application_logo_update" ON "storage"."objects"
  FOR UPDATE TO "authenticated"
  USING ("bucket_id" = 'application' AND "public"."is_superadmin"())
  WITH CHECK ("bucket_id" = 'application' AND "public"."is_superadmin"());

DROP POLICY IF EXISTS "application_logo_delete" ON "storage"."objects";
CREATE POLICY "application_logo_delete" ON "storage"."objects"
  FOR DELETE TO "authenticated"
  USING ("bucket_id" = 'application' AND "public"."is_superadmin"());

DROP POLICY IF EXISTS "application_logo_insert_restrict" ON "storage"."objects";
CREATE POLICY "application_logo_insert_restrict" ON "storage"."objects"
  AS RESTRICTIVE FOR INSERT TO "authenticated"
  WITH CHECK ("bucket_id" <> 'application' OR "public"."is_superadmin"());

DROP POLICY IF EXISTS "application_logo_update_restrict" ON "storage"."objects";
CREATE POLICY "application_logo_update_restrict" ON "storage"."objects"
  AS RESTRICTIVE FOR UPDATE TO "authenticated"
  USING ("bucket_id" <> 'application' OR "public"."is_superadmin"())
  WITH CHECK ("bucket_id" <> 'application' OR "public"."is_superadmin"());

DROP POLICY IF EXISTS "application_logo_delete_restrict" ON "storage"."objects";
CREATE POLICY "application_logo_delete_restrict" ON "storage"."objects"
  AS RESTRICTIVE FOR DELETE TO "authenticated"
  USING ("bucket_id" <> 'application' OR "public"."is_superadmin"());

-- ─── Rollback ───────────────────────────────────────────────────────────────
--   DROP POLICY IF EXISTS "application_logo_select" ON "storage"."objects";
--   DROP POLICY IF EXISTS "application_logo_insert" ON "storage"."objects";
--   DROP POLICY IF EXISTS "application_logo_update" ON "storage"."objects";
--   DROP POLICY IF EXISTS "application_logo_delete" ON "storage"."objects";
--   DROP POLICY IF EXISTS "application_logo_insert_restrict" ON "storage"."objects";
--   DROP POLICY IF EXISTS "application_logo_update_restrict" ON "storage"."objects";
--   DROP POLICY IF EXISTS "application_logo_delete_restrict" ON "storage"."objects";
--   DELETE FROM "storage"."objects" WHERE "bucket_id" = 'application';
--   DELETE FROM "storage"."buckets" WHERE "id" = 'application';
--   DROP TABLE IF EXISTS "public"."application";
