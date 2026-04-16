-- Ajout état validation sur les fusions (commandes)
ALTER TABLE commandes_matieres_fusions
  ADD COLUMN IF NOT EXISTS validee   BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS valide_at TIMESTAMPTZ NULL;

-- Table des lignes statiques d'une commande (snapshot)
CREATE TABLE IF NOT EXISTS commandes_matieres_fusions_lignes (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  fusion_id      UUID          NOT NULL REFERENCES commandes_matieres_fusions(id) ON DELETE CASCADE,
  numero_symbole TEXT          NOT NULL REFERENCES catalogue_matieres(numero_symbole) ON DELETE RESTRICT,
  quantite       NUMERIC(12,3) NOT NULL DEFAULT 1,
  notes          TEXT,
  ordre          INTEGER       NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE(fusion_id, numero_symbole)
);

ALTER TABLE commandes_matieres_fusions_lignes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can all on fusions_lignes"
  ON commandes_matieres_fusions_lignes
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
