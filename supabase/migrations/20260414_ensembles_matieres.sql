-- ─── Ensembles matières (gabarits réutilisables tous chantiers) ───────────────

CREATE TABLE ensembles_matieres (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Articles constituant un ensemble
CREATE TABLE ensembles_matieres_lignes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ensemble_id UUID NOT NULL REFERENCES ensembles_matieres(id) ON DELETE CASCADE,
  numero_symbole TEXT NOT NULL REFERENCES catalogue_matieres(numero_symbole) ON DELETE RESTRICT,
  quantite NUMERIC(12,3) DEFAULT 0,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON ensembles_matieres_lignes(ensemble_id);

-- Ensembles utilisés dans une liste (commande) par chantier
CREATE TABLE commandes_matieres_ensembles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  commande_id UUID NOT NULL REFERENCES commandes_matieres(id) ON DELETE CASCADE,
  ensemble_id UUID NOT NULL REFERENCES ensembles_matieres(id) ON DELETE RESTRICT,
  ordre INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON commandes_matieres_ensembles(commande_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE ensembles_matieres ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all" ON ensembles_matieres FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE ensembles_matieres_lignes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all" ON ensembles_matieres_lignes FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE commandes_matieres_ensembles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all" ON commandes_matieres_ensembles FOR ALL USING (true) WITH CHECK (true);
