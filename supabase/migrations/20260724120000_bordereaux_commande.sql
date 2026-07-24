-- ─── Niveau « Commande » (bordereau) au-dessus des listes de matières ────────
-- Un bordereau de commande reprend une ou plusieurs « listes de matières »
-- (commandes_matieres) : son contenu est aplati (ensembles éclatés) et fusionné
-- par numéro de symbole. Il porte un suivi Base Arrière (quantité + emplacement)
-- et un statut en_cours → validee. La quantité « à commander » n'est pas stockée :
-- elle se calcule = (quantite_demandee - quantite_ba) arrondie à l'unité de distribution.
-- Tables nommées bordereaux_commande* pour éviter toute confusion avec commandes_matieres*.
-- Sécurité applicative (RLS ouverte, cohérent avec commandes_matieres).

-- ─── 1. Bordereau de commande ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."bordereaux_commande" (
  "id"          uuid        DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "chantier_id" integer,
  "nom"         text        NOT NULL,
  "description" text        NOT NULL DEFAULT '',
  "metier"      text,
  "statut"      text        NOT NULL DEFAULT 'en_cours'
                  CHECK ("statut" IN ('en_cours', 'validee')),
  "created_by"  uuid,
  "valide_at"   timestamptz,
  "exported_at" timestamptz,
  "created_at"  timestamptz DEFAULT now() NOT NULL,
  "updated_at"  timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "bordereaux_commande_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bordereaux_commande_chantier_id_fkey"
    FOREIGN KEY ("chantier_id") REFERENCES "public"."chantiers"("id") ON DELETE SET NULL,
  CONSTRAINT "bordereaux_commande_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "bordereaux_commande_chantier_id_idx" ON "public"."bordereaux_commande" ("chantier_id");
CREATE INDEX IF NOT EXISTS "bordereaux_commande_statut_idx" ON "public"."bordereaux_commande" ("statut");
CREATE INDEX IF NOT EXISTS "bordereaux_commande_created_by_idx" ON "public"."bordereaux_commande" ("created_by");

ALTER TABLE "public"."bordereaux_commande" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bordereaux_commande_select" ON "public"."bordereaux_commande";
CREATE POLICY "bordereaux_commande_select" ON "public"."bordereaux_commande" FOR SELECT USING (true);
DROP POLICY IF EXISTS "bordereaux_commande_insert" ON "public"."bordereaux_commande";
CREATE POLICY "bordereaux_commande_insert" ON "public"."bordereaux_commande" FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "bordereaux_commande_update" ON "public"."bordereaux_commande";
CREATE POLICY "bordereaux_commande_update" ON "public"."bordereaux_commande" FOR UPDATE USING (true);
DROP POLICY IF EXISTS "bordereaux_commande_delete" ON "public"."bordereaux_commande";
CREATE POLICY "bordereaux_commande_delete" ON "public"."bordereaux_commande" FOR DELETE USING (true);

-- ─── 2. Lignes du bordereau (symboles fusionnés, à plat) ─────────────────────
CREATE TABLE IF NOT EXISTS "public"."bordereaux_commande_lignes" (
  "id"                uuid          DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "commande_id"       uuid          NOT NULL,
  "numero_symbole"    text          NOT NULL,
  "quantite_demandee" numeric(12,3) NOT NULL DEFAULT 0,
  "quantite_ba"       numeric(12,3) NOT NULL DEFAULT 0,
  "emplacement_ba"    text          CHECK ("emplacement_ba" IN ('parc_ltv', 'd2', 'uo_travaux')),
  "notes"             text          NOT NULL DEFAULT '',
  "ordre"             integer       NOT NULL DEFAULT 0,
  "created_at"        timestamptz   DEFAULT now() NOT NULL,
  CONSTRAINT "bordereaux_commande_lignes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bordereaux_commande_lignes_commande_fkey"
    FOREIGN KEY ("commande_id") REFERENCES "public"."bordereaux_commande"("id") ON DELETE CASCADE,
  CONSTRAINT "bordereaux_commande_lignes_article_fkey"
    FOREIGN KEY ("numero_symbole") REFERENCES "public"."catalogue_matieres"("numero_symbole") ON DELETE RESTRICT,
  CONSTRAINT "bordereaux_commande_lignes_commande_symbole_key" UNIQUE ("commande_id", "numero_symbole")
);

CREATE INDEX IF NOT EXISTS "bordereaux_commande_lignes_commande_id_idx"
  ON "public"."bordereaux_commande_lignes" ("commande_id");

ALTER TABLE "public"."bordereaux_commande_lignes" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bordereaux_commande_lignes_select" ON "public"."bordereaux_commande_lignes";
CREATE POLICY "bordereaux_commande_lignes_select" ON "public"."bordereaux_commande_lignes" FOR SELECT USING (true);
DROP POLICY IF EXISTS "bordereaux_commande_lignes_insert" ON "public"."bordereaux_commande_lignes";
CREATE POLICY "bordereaux_commande_lignes_insert" ON "public"."bordereaux_commande_lignes" FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "bordereaux_commande_lignes_update" ON "public"."bordereaux_commande_lignes";
CREATE POLICY "bordereaux_commande_lignes_update" ON "public"."bordereaux_commande_lignes" FOR UPDATE USING (true);
DROP POLICY IF EXISTS "bordereaux_commande_lignes_delete" ON "public"."bordereaux_commande_lignes";
CREATE POLICY "bordereaux_commande_lignes_delete" ON "public"."bordereaux_commande_lignes" FOR DELETE USING (true);

-- ─── 3. Listes sources reprises par le bordereau (traçabilité) ───────────────
CREATE TABLE IF NOT EXISTS "public"."bordereaux_commande_sources" (
  "id"          uuid        DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "commande_id" uuid        NOT NULL,
  "liste_id"    uuid,
  CONSTRAINT "bordereaux_commande_sources_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bordereaux_commande_sources_commande_fkey"
    FOREIGN KEY ("commande_id") REFERENCES "public"."bordereaux_commande"("id") ON DELETE CASCADE,
  CONSTRAINT "bordereaux_commande_sources_liste_fkey"
    FOREIGN KEY ("liste_id") REFERENCES "public"."commandes_matieres"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "bordereaux_commande_sources_commande_id_idx"
  ON "public"."bordereaux_commande_sources" ("commande_id");

ALTER TABLE "public"."bordereaux_commande_sources" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bordereaux_commande_sources_select" ON "public"."bordereaux_commande_sources";
CREATE POLICY "bordereaux_commande_sources_select" ON "public"."bordereaux_commande_sources" FOR SELECT USING (true);
DROP POLICY IF EXISTS "bordereaux_commande_sources_insert" ON "public"."bordereaux_commande_sources";
CREATE POLICY "bordereaux_commande_sources_insert" ON "public"."bordereaux_commande_sources" FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "bordereaux_commande_sources_update" ON "public"."bordereaux_commande_sources";
CREATE POLICY "bordereaux_commande_sources_update" ON "public"."bordereaux_commande_sources" FOR UPDATE USING (true);
DROP POLICY IF EXISTS "bordereaux_commande_sources_delete" ON "public"."bordereaux_commande_sources";
CREATE POLICY "bordereaux_commande_sources_delete" ON "public"."bordereaux_commande_sources" FOR DELETE USING (true);

-- ─── Grants (cohérent avec les autres tables) ────────────────────────────────
GRANT ALL ON TABLE "public"."bordereaux_commande"          TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."bordereaux_commande_lignes"   TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."bordereaux_commande_sources"  TO "anon", "authenticated", "service_role";
