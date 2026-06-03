-- Ajoute l'option "En formation" sur les utilisateurs,
-- au même titre que pre_op et ref_du_rdu.

ALTER TABLE "public"."users"
  ADD COLUMN IF NOT EXISTS "en_formation" boolean DEFAULT false;
