-- Empêche les cycles dans la hiérarchie ensembles_matieres → ensembles_matieres
-- La CHECK no_self_reference gère A→A ; ce trigger gère A→B→A, A→B→C→A, etc.

CREATE OR REPLACE FUNCTION check_no_cycle_ensemble()
RETURNS TRIGGER AS $$
DECLARE
  cycle_found BOOLEAN;
BEGIN
  -- Si le futur parent (NEW.ensemble_id) est déjà descendant de NEW.sous_ensemble_id,
  -- alors insérer la relation créerait un cycle.
  WITH RECURSIVE descendants AS (
    SELECT sous_ensemble_id AS id
      FROM ensembles_matieres_sous_ensembles
     WHERE ensemble_id = NEW.sous_ensemble_id
    UNION
    SELECT es.sous_ensemble_id
      FROM ensembles_matieres_sous_ensembles es
      JOIN descendants d ON es.ensemble_id = d.id
  )
  SELECT EXISTS (SELECT 1 FROM descendants WHERE id = NEW.ensemble_id)
    INTO cycle_found;

  IF cycle_found THEN
    RAISE EXCEPTION 'Cycle détecté : cet ajout créerait une boucle dans la hiérarchie des ensembles.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_no_cycle_ensemble ON ensembles_matieres_sous_ensembles;
CREATE TRIGGER trg_no_cycle_ensemble
BEFORE INSERT OR UPDATE ON ensembles_matieres_sous_ensembles
FOR EACH ROW EXECUTE FUNCTION check_no_cycle_ensemble();
