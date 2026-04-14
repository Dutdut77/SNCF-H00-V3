-- ─── Catalogue des matières symbolisées SNCF 2026 ───────────────────────────
CREATE TABLE IF NOT EXISTS "public"."catalogue_matieres" (
  "numero_symbole"      text        NOT NULL,
  "description"         text        NOT NULL DEFAULT '',
  "prix_ud"             numeric(14,6),
  "unite_distribution"  text        NOT NULL DEFAULT '',
  "info_unite"          text        NOT NULL DEFAULT '',
  "famille_elan"        text        NOT NULL DEFAULT '',
  "famille_rff"         text        NOT NULL DEFAULT '',
  "specialite"          text        NOT NULL DEFAULT '',
  "groupe_famille"      text        NOT NULL DEFAULT '',
  "famille"             text        NOT NULL DEFAULT '',
  "sous_famille"        text        NOT NULL DEFAULT '',
  CONSTRAINT "catalogue_matieres_pkey" PRIMARY KEY ("numero_symbole")
);

CREATE INDEX IF NOT EXISTS "catalogue_matieres_description_idx"
  ON "public"."catalogue_matieres" USING gin(to_tsvector('french', "description"));

ALTER TABLE "public"."catalogue_matieres" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalogue_matieres_select" ON "public"."catalogue_matieres"
  FOR SELECT USING (true);

-- ─── Commandes matières (listes) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."commandes_matieres" (
  "id"          uuid        DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "nom"         text        NOT NULL,
  "description" text        NOT NULL DEFAULT '',
  "chantier_id" integer,
  "created_at"  timestamptz DEFAULT now() NOT NULL,
  "updated_at"  timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "commandes_matieres_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "commandes_matieres_chantier_id_fkey"
    FOREIGN KEY ("chantier_id") REFERENCES "public"."chantiers"("id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "commandes_matieres_chantier_id_idx"
  ON "public"."commandes_matieres" ("chantier_id");

ALTER TABLE "public"."commandes_matieres" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commandes_matieres_select" ON "public"."commandes_matieres"
  FOR SELECT USING (true);
CREATE POLICY "commandes_matieres_insert" ON "public"."commandes_matieres"
  FOR INSERT WITH CHECK (true);
CREATE POLICY "commandes_matieres_update" ON "public"."commandes_matieres"
  FOR UPDATE USING (true);
CREATE POLICY "commandes_matieres_delete" ON "public"."commandes_matieres"
  FOR DELETE USING (true);

-- ─── Lignes d'une commande (articles) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "public"."commandes_matieres_lignes" (
  "id"             uuid        DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "commande_id"    uuid        NOT NULL,
  "numero_symbole" text        NOT NULL,
  "quantite"       numeric(12,3) NOT NULL DEFAULT 0,
  "notes"          text        NOT NULL DEFAULT '',
  "ordre"          integer     NOT NULL DEFAULT 0,
  "created_at"     timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "commandes_matieres_lignes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "commandes_matieres_lignes_commande_fkey"
    FOREIGN KEY ("commande_id") REFERENCES "public"."commandes_matieres"("id") ON DELETE CASCADE,
  CONSTRAINT "commandes_matieres_lignes_article_fkey"
    FOREIGN KEY ("numero_symbole") REFERENCES "public"."catalogue_matieres"("numero_symbole") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS "commandes_matieres_lignes_commande_id_idx"
  ON "public"."commandes_matieres_lignes" ("commande_id");

ALTER TABLE "public"."commandes_matieres_lignes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "commandes_matieres_lignes_select" ON "public"."commandes_matieres_lignes"
  FOR SELECT USING (true);
CREATE POLICY "commandes_matieres_lignes_insert" ON "public"."commandes_matieres_lignes"
  FOR INSERT WITH CHECK (true);
CREATE POLICY "commandes_matieres_lignes_update" ON "public"."commandes_matieres_lignes"
  FOR UPDATE USING (true);
CREATE POLICY "commandes_matieres_lignes_delete" ON "public"."commandes_matieres_lignes"
  FOR DELETE USING (true);
