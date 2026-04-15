-- Commandes (fusions nommées de listes de matières)
CREATE TABLE commandes_matieres_fusions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chantier_id INTEGER NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  nom TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON commandes_matieres_fusions(chantier_id);

ALTER TABLE commandes_matieres_fusions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all" ON commandes_matieres_fusions FOR ALL USING (true) WITH CHECK (true);

-- Listes (commandes_matieres) incluses dans chaque commande-fusion
CREATE TABLE commandes_matieres_fusions_listes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fusion_id UUID NOT NULL REFERENCES commandes_matieres_fusions(id) ON DELETE CASCADE,
  commande_id UUID NOT NULL REFERENCES commandes_matieres(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(fusion_id, commande_id)
);

CREATE INDEX ON commandes_matieres_fusions_listes(fusion_id);

ALTER TABLE commandes_matieres_fusions_listes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all" ON commandes_matieres_fusions_listes FOR ALL USING (true) WITH CHECK (true);
