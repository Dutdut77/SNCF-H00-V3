-- =============================================================================
-- Migration : Création de la table chantier_pages
-- Description : Stocke les pages personnalisées des chantiers
-- =============================================================================

-- Création de la table chantier_pages
-- Un seul enregistrement par chantier, avec un tableau de pages en JSONB
CREATE TABLE IF NOT EXISTS chantier_pages (
    id SERIAL PRIMARY KEY,
    chantier_id INTEGER NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
    content JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Contrainte d'unicité : un seul enregistrement par chantier
    CONSTRAINT unique_chantier_pages UNIQUE (chantier_id)
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_chantier_pages_chantier_id ON chantier_pages(chantier_id);

-- Trigger pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_chantier_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chantier_pages_updated_at
    BEFORE UPDATE ON chantier_pages
    FOR EACH ROW
    EXECUTE FUNCTION update_chantier_pages_updated_at();

-- Commentaires
COMMENT ON TABLE chantier_pages IS 'Pages personnalisées des chantiers';
COMMENT ON COLUMN chantier_pages.content IS 'Array JSON de pages: [{id, template_key, navBarTitle, content}]';

-- =============================================================================
-- Structure du champ content (JSONB Array) :
-- =============================================================================
-- [
--   {
--     "id": "uuid-unique",
--     "template_key": "texte-image",
--     "navBarTitle": "Ma Page",
--     "order": 0,
--     "content": {
--       // Structure spécifique au template
--       "titre": "Mon titre",
--       "texte": "Mon contenu...",
--       "image_url": "https://..."
--     }
--   },
--   ...
-- ]
-- =============================================================================

-- Politique RLS (Row Level Security) - Optionnel
-- ALTER TABLE chantier_pages ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Les utilisateurs peuvent voir les pages de leurs chantiers"
--     ON chantier_pages FOR SELECT
--     USING (true);

-- CREATE POLICY "Les utilisateurs peuvent modifier les pages de leurs chantiers"
--     ON chantier_pages FOR ALL
--     USING (true);

