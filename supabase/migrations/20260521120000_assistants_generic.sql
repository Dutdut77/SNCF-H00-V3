-- Permet de marquer une question comme "générique" (partagée).
-- Une question générique :
--   - est affichée une seule fois dans une section dédiée du builder
--   - est référencée par d'autres réponses sans dupliquer son sous-arbre dans la vue principale
--   - sa modification impacte tous les parcours qui la référencent

ALTER TABLE "public"."assistants_questions"
  ADD COLUMN IF NOT EXISTS "is_generic" BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS "assistants_questions_is_generic_idx"
  ON "public"."assistants_questions" ("is_generic")
  WHERE "is_generic" = TRUE;
