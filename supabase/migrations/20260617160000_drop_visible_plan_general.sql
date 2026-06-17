-- Le drapeau visible_plan_general n'a jamais été branché : la consultation du plan de
-- charge général est désormais ouverte à tous les sites. On retire la colonne devenue inutile.
ALTER TABLE "public"."attributions" DROP COLUMN IF EXISTS "visible_plan_general";
