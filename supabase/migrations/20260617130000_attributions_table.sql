-- Table de référence des attributions (gérable, extensible : UO Travaux, UTM, et autres à venir).
-- Transforme chantiers.attribution (texte libre) en clé étrangère vers attributions.code.
-- Le flag visible_plan_general indique si une attribution apparaît dans le plan de charge général.

-- ============================================
-- 1. Table de référence
-- ============================================
CREATE TABLE IF NOT EXISTS "public"."attributions" (
  "code" "text" PRIMARY KEY,
  "label" "text" NOT NULL,
  "visible_plan_general" boolean NOT NULL DEFAULT false,
  "ordre" integer NOT NULL DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."attributions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_all_attributions" ON "public"."attributions";
CREATE POLICY "authenticated_all_attributions"
  ON "public"."attributions"
  TO "authenticated"
  USING (true) WITH CHECK (true);

GRANT ALL ON TABLE "public"."attributions" TO "anon";
GRANT ALL ON TABLE "public"."attributions" TO "authenticated";
GRANT ALL ON TABLE "public"."attributions" TO "service_role";

-- Valeurs initiales. Seules les attributions avec visible_plan_general = true s'affichent
-- dans le plan de charge général ; les autres ne sont visibles que dans le calendrier PIT.
INSERT INTO "public"."attributions" ("code", "label", "visible_plan_general", "ordre")
VALUES
  ('UO Travaux', 'UO Travaux', true, 1),
  ('UTM', 'UTM', false, 2)
ON CONFLICT ("code") DO NOTHING;

-- ============================================
-- 2. chantiers.attribution -> clé étrangère
-- ============================================
-- Sécurité : ramener à « UO Travaux » toute valeur orpheline avant d'ajouter la contrainte.
UPDATE "public"."chantiers"
SET "attribution" = 'UO Travaux'
WHERE "attribution" IS NOT NULL
  AND "attribution" NOT IN (SELECT "code" FROM "public"."attributions");

-- Aligner le type sur attributions.code (text) pour la clé étrangère.
ALTER TABLE "public"."chantiers" ALTER COLUMN "attribution" TYPE "text";
ALTER TABLE "public"."chantiers" ALTER COLUMN "attribution" SET DEFAULT 'UO Travaux';

-- Clé étrangère (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "pg_constraint" WHERE "conname" = 'chantiers_attribution_fkey') THEN
    ALTER TABLE "public"."chantiers"
      ADD CONSTRAINT "chantiers_attribution_fkey"
      FOREIGN KEY ("attribution") REFERENCES "public"."attributions"("code");
  END IF;
END $$;
