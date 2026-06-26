-- Séparation des matières par métier (VOIE / SES = SE/SM / CAT).
-- Le catalogue d'articles (catalogue_matieres) reste commun ; seuls les
-- ensembles, logiques métier et commandes sont rattachés à un métier.
-- L'existant est tagué 'SES' (métier d'origine de ces fonctionnalités).

-- ── Colonnes métier ──────────────────────────────────────────────────────────

ALTER TABLE "public"."ensembles_matieres"
  ADD COLUMN IF NOT EXISTS "metier" text NOT NULL DEFAULT 'SES';

ALTER TABLE "public"."assistants_logiques"
  ADD COLUMN IF NOT EXISTS "metier" text NOT NULL DEFAULT 'SES';

ALTER TABLE "public"."commandes_matieres"
  ADD COLUMN IF NOT EXISTS "metier" text NOT NULL DEFAULT 'SES';

ALTER TABLE "public"."ensembles_matieres"
  DROP CONSTRAINT IF EXISTS "ensembles_matieres_metier_check",
  ADD CONSTRAINT "ensembles_matieres_metier_check"
    CHECK ("metier" IN ('VOIE', 'SES', 'CAT'));

ALTER TABLE "public"."assistants_logiques"
  DROP CONSTRAINT IF EXISTS "assistants_logiques_metier_check",
  ADD CONSTRAINT "assistants_logiques_metier_check"
    CHECK ("metier" IN ('VOIE', 'SES', 'CAT'));

ALTER TABLE "public"."commandes_matieres"
  DROP CONSTRAINT IF EXISTS "commandes_matieres_metier_check",
  ADD CONSTRAINT "commandes_matieres_metier_check"
    CHECK ("metier" IN ('VOIE', 'SES', 'CAT'));

CREATE INDEX IF NOT EXISTS "ensembles_matieres_metier_idx"
  ON "public"."ensembles_matieres" ("metier");

CREATE INDEX IF NOT EXISTS "assistants_logiques_metier_idx"
  ON "public"."assistants_logiques" ("metier");

-- ── Garde-fou : cohérence métier des sous-ensembles ──────────────────────────
-- On étend le trigger anti-cycle existant pour qu'il refuse aussi un lien
-- parent → enfant de métiers différents (un ensemble VOIE ne contient que des
-- sous-ensembles VOIE, etc.). La garde principale reste l'UI (pickers filtrés).

CREATE OR REPLACE FUNCTION check_no_cycle_ensemble()
RETURNS TRIGGER AS $$
DECLARE
  cycle_found BOOLEAN;
  parent_metier text;
  enfant_metier text;
BEGIN
  -- Cohérence métier : parent et sous-ensemble doivent partager le même métier.
  SELECT metier INTO parent_metier FROM ensembles_matieres WHERE id = NEW.ensemble_id;
  SELECT metier INTO enfant_metier FROM ensembles_matieres WHERE id = NEW.sous_ensemble_id;
  IF parent_metier IS DISTINCT FROM enfant_metier THEN
    RAISE EXCEPTION 'Métier incohérent : un ensemble ne peut contenir que des sous-ensembles du même métier.';
  END IF;

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

-- Garde-fou : une réponse de logique ne peut attacher qu'un ensemble du même
-- métier que sa logique.
CREATE OR REPLACE FUNCTION check_reponse_ensemble_metier()
RETURNS TRIGGER AS $$
DECLARE
  logique_metier text;
  ensemble_metier text;
BEGIN
  SELECT l.metier INTO logique_metier
    FROM assistants_reponses r
    JOIN assistants_questions q ON q.id = r.question_id
    JOIN assistants_logiques l ON l.id = q.logique_id
   WHERE r.id = NEW.reponse_id;

  SELECT metier INTO ensemble_metier FROM ensembles_matieres WHERE id = NEW.ensemble_id;

  IF logique_metier IS DISTINCT FROM ensemble_metier THEN
    RAISE EXCEPTION 'Métier incohérent : une logique ne peut référencer qu''un ensemble du même métier.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reponse_ensemble_metier ON assistants_reponses_ensembles;
CREATE TRIGGER trg_reponse_ensemble_metier
BEFORE INSERT OR UPDATE ON assistants_reponses_ensembles
FOR EACH ROW EXECUTE FUNCTION check_reponse_ensemble_metier();
