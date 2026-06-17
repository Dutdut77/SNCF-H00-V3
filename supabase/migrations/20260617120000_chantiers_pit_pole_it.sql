-- Calendrier « Pôle IT » (PIT)
-- Ajoute sur les chantiers les champs propres au pilotage de portefeuille du Pôle IT :
--   - attribution : UO Travaux | UTM. Discriminant d'affichage : un chantier non attribué à
--     « UO Travaux » disparaît du plan de charge général et n'est visible que dans le calendrier PIT.
--   - etat_pit : phase projet AVP | PRO | APO | REA.
--   - chef_projet_responsable_email : email d'un utilisateur PIT, sert au matching des droits
--     d'édition (responsable du projet) et à l'affichage du nom.
-- Ajoute également le profil « Pôle IT » (num_profil 40).
-- Note : la transformation de « attribution » en clé étrangère vers la table de référence
-- « attributions » est faite dans la migration suivante (20260617130000_attributions_table.sql).

ALTER TABLE "public"."chantiers"
  ADD COLUMN IF NOT EXISTS "attribution" character varying(20) DEFAULT 'UO Travaux',
  ADD COLUMN IF NOT EXISTS "etat_pit" character varying(10),
  ADD COLUMN IF NOT EXISTS "chef_projet_responsable_email" "text";

-- Rétro-affecter les chantiers existants à « UO Travaux » (restent visibles dans le plan général).
UPDATE "public"."chantiers" SET "attribution" = 'UO Travaux' WHERE "attribution" IS NULL;

-- Profil Pôle IT : devient automatiquement sélectionnable dans Paramètres → Utilisateurs.
INSERT INTO "public"."profil" ("num_profil", "name_profil", "short_name")
VALUES (40, 'Pôle IT', 'PIT')
ON CONFLICT ("num_profil") DO NOTHING;
