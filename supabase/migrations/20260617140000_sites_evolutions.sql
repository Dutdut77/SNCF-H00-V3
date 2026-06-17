-- Évolution « sites » : le plan de charge général est filtré par site (attribution).
--   - attributions.is_site : true = vrai site (assignable à un user + génère les H00) ;
--     false = catégorie sans H00 (Externe).
--   - Nouveaux sites + la valeur « Externe ».
--   - users.site : site unique de l'utilisateur ('Pôle IT' = accès à tous les sites,
--     sinon un code d'attribution). Pas de FK ('Pôle IT' n'est pas une attribution).

-- ============================================
-- 1. attributions : flag is_site + nouvelles valeurs
-- ============================================
ALTER TABLE "public"."attributions"
  ADD COLUMN IF NOT EXISTS "is_site" boolean NOT NULL DEFAULT true;

INSERT INTO "public"."attributions" ("code", "label", "visible_plan_general", "ordre", "is_site")
VALUES
  ('UTM L1000', 'UTM L1000', false, 3, true),
  ('UTM L70000', 'UTM L70000', false, 4, true),
  ('UTM EOLE', 'UTM EOLE', false, 5, true),
  ('UP EALE-EE', 'UP EALE-EE', false, 6, true),
  ('Externe', 'Externe', false, 7, false)
ON CONFLICT ("code") DO NOTHING;

-- ============================================
-- 2. users.site (site unique)
-- ============================================
ALTER TABLE "public"."users"
  ADD COLUMN IF NOT EXISTS "site" "text";

-- Tous les utilisateurs existants rattachés à UO Travaux (préserve l'accès actuel) ;
-- les vrais Pôle IT seront repassés en 'Pôle IT' depuis Paramètres.
UPDATE "public"."users" SET "site" = 'UO Travaux' WHERE "site" IS NULL;

-- ============================================
-- 3. Chantiers externes existants -> attribution 'Externe'
--    (etat = 1 correspondait à l'ancien « Autre / externe »)
-- ============================================
UPDATE "public"."chantiers" SET "attribution" = 'Externe' WHERE "etat" = 1;
