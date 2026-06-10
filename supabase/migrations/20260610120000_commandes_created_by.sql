-- ─── Créateur d'une liste de commande matières ──────────────────────────────
-- Seul le créateur (ou un admin) peut modifier une liste ; les autres
-- utilisateurs la consultent en lecture seule et peuvent la dupliquer.
ALTER TABLE "public"."commandes_matieres"
  ADD COLUMN IF NOT EXISTS "created_by" uuid;

ALTER TABLE "public"."commandes_matieres"
  DROP CONSTRAINT IF EXISTS "commandes_matieres_created_by_fkey";

ALTER TABLE "public"."commandes_matieres"
  ADD CONSTRAINT "commandes_matieres_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "commandes_matieres_created_by_idx"
  ON "public"."commandes_matieres" ("created_by");
