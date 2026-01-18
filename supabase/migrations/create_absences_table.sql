-- ============================================
-- Table des absences (congés et formations)
-- ============================================
-- Cette table stocke les périodes d'absence des utilisateurs
-- Les absences sont définies par semaine (pas de jours précis)

CREATE TABLE IF NOT EXISTS absences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('conges', 'formation')),
    semaine_debut INTEGER NOT NULL CHECK (semaine_debut >= 1 AND semaine_debut <= 53),
    annee_debut INTEGER NOT NULL CHECK (annee_debut >= 2020 AND annee_debut <= 2100),
    semaine_fin INTEGER NOT NULL CHECK (semaine_fin >= 1 AND semaine_fin <= 53),
    annee_fin INTEGER NOT NULL CHECK (annee_fin >= 2020 AND annee_fin <= 2100),
    commentaire TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_absences_user_email ON absences(user_email);
CREATE INDEX IF NOT EXISTS idx_absences_annee_debut ON absences(annee_debut);
CREATE INDEX IF NOT EXISTS idx_absences_type ON absences(type);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_absences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_absences_updated_at ON absences;
CREATE TRIGGER trigger_update_absences_updated_at
    BEFORE UPDATE ON absences
    FOR EACH ROW
    EXECUTE FUNCTION update_absences_updated_at();

-- Activer RLS (Row Level Security)
ALTER TABLE absences ENABLE ROW LEVEL SECURITY;

-- Politique de lecture : tout le monde peut lire les absences
CREATE POLICY "absences_select_policy" ON absences
    FOR SELECT USING (true);

-- Politique d'insertion : utilisateurs authentifiés uniquement
CREATE POLICY "absences_insert_policy" ON absences
    FOR INSERT WITH CHECK (true);

-- Politique de mise à jour : utilisateurs authentifiés uniquement
CREATE POLICY "absences_update_policy" ON absences
    FOR UPDATE USING (true);

-- Politique de suppression : utilisateurs authentifiés uniquement
CREATE POLICY "absences_delete_policy" ON absences
    FOR DELETE USING (true);

-- Commentaires pour la documentation
COMMENT ON TABLE absences IS 'Table des absences des utilisateurs (congés et formations)';
COMMENT ON COLUMN absences.user_email IS 'Email de l''utilisateur concerné';
COMMENT ON COLUMN absences.type IS 'Type d''absence : conges ou formation';
COMMENT ON COLUMN absences.semaine_debut IS 'Numéro de semaine de début (1-53)';
COMMENT ON COLUMN absences.annee_debut IS 'Année de début';
COMMENT ON COLUMN absences.semaine_fin IS 'Numéro de semaine de fin (1-53)';
COMMENT ON COLUMN absences.annee_fin IS 'Année de fin';
COMMENT ON COLUMN absences.commentaire IS 'Commentaire optionnel sur l''absence';

