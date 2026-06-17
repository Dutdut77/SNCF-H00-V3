-- « Externe » devient un interrupteur sur le chantier (et non un site).
-- Le chantier reste rattaché à un vrai site (attribution) ; le drapeau externe pilote les H00.

-- 1. Nouveau drapeau externe sur les chantiers.
ALTER TABLE "public"."chantiers"
  ADD COLUMN IF NOT EXISTS "externe" boolean NOT NULL DEFAULT false;

-- 2. Chantiers actuellement attribués à « Externe » -> rattachés à UO Travaux + drapeau externe.
UPDATE "public"."chantiers"
SET "externe" = true, "attribution" = 'UO Travaux'
WHERE "attribution" = 'Externe';

-- Sécurité : tout chantier externe historique (etat = 1) garde le drapeau externe.
UPDATE "public"."chantiers" SET "externe" = true WHERE "etat" = 1;

-- 3. Retirer « Externe » de la liste des sites.
DELETE FROM "public"."attributions" WHERE "code" = 'Externe';

-- 4. is_site n'a plus de raison d'être (toutes les attributions sont désormais des sites).
ALTER TABLE "public"."attributions" DROP COLUMN IF EXISTS "is_site";
