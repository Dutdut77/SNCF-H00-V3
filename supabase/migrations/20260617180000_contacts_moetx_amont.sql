-- Contacts généralités : ajout du « Moetx Amont » (profil 41), comme le chef de projet.
-- Stocke l'email de l'utilisateur sélectionné (+ son nom dérivé), un seul par chantier.
ALTER TABLE "public"."chantier_contacts_generalites"
  ADD COLUMN IF NOT EXISTS "moetx_amont_email" "text",
  ADD COLUMN IF NOT EXISTS "moetx_amont_nom" "text";
