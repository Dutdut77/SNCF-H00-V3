-- Table principale d'une tournée
CREATE TABLE tournees (
  id          bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  chantier_id integer NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
  titre       text,
  created_by  text NOT NULL,
  terminee    boolean NOT NULL DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Notes prises pendant la tournée
CREATE TABLE tournee_notes (
  id          bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  tournee_id  bigint NOT NULL REFERENCES tournees(id) ON DELETE CASCADE,
  content     text NOT NULL,
  type        text NOT NULL CHECK (type IN ('voix', 'texte')),
  ordre       integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE tournees ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournee_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all_tournees" ON tournees
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_all_tournee_notes" ON tournee_notes
  TO authenticated USING (true) WITH CHECK (true);

-- Colonne de liaison photos → tournée
ALTER TABLE photos ADD COLUMN tournee_id bigint REFERENCES tournees(id) ON DELETE SET NULL;
