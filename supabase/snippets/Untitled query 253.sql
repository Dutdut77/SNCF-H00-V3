ALTER TABLE "public"."chantier_contacts_generalites"
  ADD COLUMN IF NOT EXISTS "moetx_amont_email" "text",
  ADD COLUMN IF NOT EXISTS "moetx_amont_nom" "text";
