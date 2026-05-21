-- Assistant configurable (wizard métier) : un référentiel global de logiques
-- composées de questions, réponses, et actions (articles + ensembles à ajouter).

-- ─── 1. Logiques (référentiel global) ────────────────────────────────────────
CREATE TABLE assistants_logiques (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom TEXT NOT NULL,
  description TEXT DEFAULT '',
  icone TEXT DEFAULT 'lucide:workflow',
  start_question_id UUID,   -- FK ajoutée après création de la table questions
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ─── 2. Questions d'une logique ──────────────────────────────────────────────
CREATE TABLE assistants_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  logique_id UUID NOT NULL REFERENCES assistants_logiques(id) ON DELETE CASCADE,
  libelle TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('unique','multiple','booleen')),
  description TEXT DEFAULT '',
  next_question_id UUID REFERENCES assistants_questions(id) ON DELETE SET NULL,
  ordre INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE assistants_logiques
  ADD CONSTRAINT assistants_logiques_start_fkey
  FOREIGN KEY (start_question_id) REFERENCES assistants_questions(id) ON DELETE SET NULL;

CREATE INDEX ON assistants_questions(logique_id);

-- ─── 3. Réponses possibles d'une question ────────────────────────────────────
CREATE TABLE assistants_reponses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES assistants_questions(id) ON DELETE CASCADE,
  libelle TEXT NOT NULL,
  ordre INTEGER NOT NULL DEFAULT 0,
  next_question_id UUID REFERENCES assistants_questions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON assistants_reponses(question_id);

-- ─── 4. Articles attachés à une réponse ──────────────────────────────────────
CREATE TABLE assistants_reponses_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reponse_id UUID NOT NULL REFERENCES assistants_reponses(id) ON DELETE CASCADE,
  numero_symbole TEXT NOT NULL REFERENCES catalogue_matieres(numero_symbole) ON DELETE RESTRICT,
  quantite NUMERIC(12,3) NOT NULL DEFAULT 1,
  UNIQUE(reponse_id, numero_symbole)
);

-- ─── 5. Ensembles attachés à une réponse ─────────────────────────────────────
CREATE TABLE assistants_reponses_ensembles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reponse_id UUID NOT NULL REFERENCES assistants_reponses(id) ON DELETE CASCADE,
  ensemble_id UUID NOT NULL REFERENCES ensembles_matieres(id) ON DELETE RESTRICT,
  quantite NUMERIC(12,3) NOT NULL DEFAULT 1,
  UNIQUE(reponse_id, ensemble_id)
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE assistants_logiques ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistants_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistants_reponses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistants_reponses_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistants_reponses_ensembles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "all" ON assistants_logiques            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all" ON assistants_questions           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all" ON assistants_reponses            FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all" ON assistants_reponses_articles   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all" ON assistants_reponses_ensembles  FOR ALL USING (true) WITH CHECK (true);
