-- Ajoute la notion d'origine sur les articles du catalogue
-- pour distinguer supply chain (par défaut) et contrats cadres.

ALTER TABLE "public"."catalogue_matieres"
  ADD COLUMN IF NOT EXISTS "origine" TEXT NOT NULL DEFAULT 'supply_chain'
    CHECK ("origine" IN ('supply_chain', 'contrat_cadre'));

CREATE INDEX IF NOT EXISTS "catalogue_matieres_origine_idx"
  ON "public"."catalogue_matieres" ("origine");
