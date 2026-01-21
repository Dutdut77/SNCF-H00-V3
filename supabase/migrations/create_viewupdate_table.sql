-- Table pour tracker les utilisateurs ayant vu les mises à jour
CREATE TABLE IF NOT EXISTS viewupdate (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL UNIQUE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index sur l'email pour des recherches rapides
CREATE INDEX IF NOT EXISTS idx_viewupdate_email ON viewupdate(user_email);

-- Activer RLS (Row Level Security)
ALTER TABLE viewupdate ENABLE ROW LEVEL SECURITY;

-- Policy pour permettre à tous les utilisateurs authentifiés de lire
CREATE POLICY "Users can read viewupdate" ON viewupdate
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy pour permettre aux utilisateurs authentifiés d'insérer leur propre entrée
CREATE POLICY "Users can insert their own viewupdate" ON viewupdate
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

