-- Sous-ensembles au sein d'un ensemble (un ensemble peut contenir d'autres ensembles)
CREATE TABLE ensembles_matieres_sous_ensembles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ensemble_id UUID NOT NULL REFERENCES ensembles_matieres(id) ON DELETE CASCADE,
  sous_ensemble_id UUID NOT NULL REFERENCES ensembles_matieres(id) ON DELETE RESTRICT,
  quantite NUMERIC(12,3) DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT no_self_reference CHECK (ensemble_id <> sous_ensemble_id)
);

CREATE INDEX ON ensembles_matieres_sous_ensembles(ensemble_id);

ALTER TABLE ensembles_matieres_sous_ensembles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all" ON ensembles_matieres_sous_ensembles FOR ALL USING (true) WITH CHECK (true);
