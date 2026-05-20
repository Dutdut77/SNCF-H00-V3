-- Unification : "Listes" et "Commandes (fusions)" deviennent une seule entité
-- "Liste de matières" portant un statut (brouillon / commandee).
-- Les fusions existantes sont migrées comme listes ayant statut='commandee'.

-- ─── 1. Ajout des colonnes de statut sur commandes_matieres ──────────────────
ALTER TABLE "public"."commandes_matieres"
  ADD COLUMN IF NOT EXISTS "statut" TEXT NOT NULL DEFAULT 'brouillon'
    CHECK ("statut" IN ('brouillon', 'commandee')),
  ADD COLUMN IF NOT EXISTS "valide_at"   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "exported_at" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS "commandes_matieres_statut_idx"
  ON "public"."commandes_matieres" ("statut");

-- ─── 2. Migration des fusions existantes → commandes_matieres ────────────────
-- On préserve l'id pour ne pas casser d'éventuels liens externes.
INSERT INTO "public"."commandes_matieres"
  (id, chantier_id, nom, description, statut, valide_at, created_at, updated_at)
SELECT
  f.id,
  f.chantier_id,
  f.nom,
  COALESCE(f.description, ''),
  CASE WHEN f.validee THEN 'commandee' ELSE 'brouillon' END,
  f.valide_at,
  f.created_at,
  f.updated_at
FROM "public"."commandes_matieres_fusions" f
ON CONFLICT (id) DO NOTHING;

-- ─── 3. Migration des lignes de fusions → commandes_matieres_lignes ──────────
INSERT INTO "public"."commandes_matieres_lignes"
  (commande_id, numero_symbole, quantite, notes, ordre, created_at)
SELECT
  fl.fusion_id,
  fl.numero_symbole,
  fl.quantite,
  COALESCE(fl.notes, ''),
  fl.ordre,
  fl.created_at
FROM "public"."commandes_matieres_fusions_lignes" fl;

-- ─── 4. Drop des tables devenues redondantes ─────────────────────────────────
DROP TABLE IF EXISTS "public"."commandes_matieres_fusions_lignes";
DROP TABLE IF EXISTS "public"."commandes_matieres_fusions_listes";
DROP TABLE IF EXISTS "public"."commandes_matieres_fusions";
