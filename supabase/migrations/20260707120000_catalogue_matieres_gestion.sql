-- ─── Gestion du catalogue depuis l'app (Paramètres > Matières > Catalogue) ───
-- Le catalogue était en lecture seule (seul le script CLI écrivait avec la clé
-- service_role). L'UI d'import/édition écrit désormais via le client Supabase :
-- ouverture de la RLS, pattern projet (sécurité applicative).

DROP POLICY IF EXISTS "catalogue_matieres_select" ON "public"."catalogue_matieres";
DROP POLICY IF EXISTS "all" ON "public"."catalogue_matieres";
CREATE POLICY "all" ON "public"."catalogue_matieres"
  FOR ALL USING (true) WITH CHECK (true);

-- Date de dernière mise à jour, affichée dans les stats de la section catalogue
ALTER TABLE "public"."catalogue_matieres"
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION "public"."update_catalogue_matieres_updated_at"()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS "catalogue_matieres_updated_at" ON "public"."catalogue_matieres";
CREATE TRIGGER "catalogue_matieres_updated_at"
  BEFORE UPDATE ON "public"."catalogue_matieres"
  FOR EACH ROW EXECUTE FUNCTION "public"."update_catalogue_matieres_updated_at"();
