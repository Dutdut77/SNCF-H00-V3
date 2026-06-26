-- Catégories d'ensembles matières (rangement par métier).
-- Une catégorie regroupe des ensembles d'un même métier (VOIE / SES / CAT).
-- Un ensemble appartient à 0 ou 1 catégorie ; supprimer une catégorie ne
-- supprime pas ses ensembles (ils repassent « Sans catégorie » via SET NULL).
-- `ordre` sert d'index stable pour l'attribution automatique de couleur (palette UI).

CREATE TABLE IF NOT EXISTS "public"."ensembles_matieres_categories" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  metier TEXT NOT NULL DEFAULT 'SES',
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT "ensembles_matieres_categories_metier_check"
    CHECK (metier IN ('VOIE', 'SES', 'CAT'))
);

CREATE INDEX IF NOT EXISTS "ensembles_matieres_categories_metier_idx"
  ON "public"."ensembles_matieres_categories" ("metier");

-- Rattachement optionnel d'un ensemble à une catégorie.
ALTER TABLE "public"."ensembles_matieres"
  ADD COLUMN IF NOT EXISTS "categorie_id" UUID
    REFERENCES "public"."ensembles_matieres_categories"(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "ensembles_matieres_categorie_id_idx"
  ON "public"."ensembles_matieres" ("categorie_id");

-- ─── RLS (même politique ouverte que les autres tables matières) ──────────────

ALTER TABLE "public"."ensembles_matieres_categories" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all" ON "public"."ensembles_matieres_categories"
  FOR ALL USING (true) WITH CHECK (true);
