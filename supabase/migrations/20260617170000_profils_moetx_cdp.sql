-- Profils « Paramètres → Utilisateurs ».
-- Ajoute « Moetx Amont » (num_profil 41) et « Chef de projet » (num_profil 42),
-- et retire le profil « Pôle IT » (num_profil 40, ajouté dans 20260617120000).
--
-- NB : le profil « Pôle IT » est INDÉPENDANT du SITE « Pôle IT » (users.site). Le plan de
-- charge général ne filtre que sur le site (useLevelUser.isPoleIT) ; retirer ce profil n'a
-- donc aucun impact sur le plan de charge général.

-- 0. Filet de sécurité : garantir l'existence du profil « Visiteur » (-1), valeur par défaut
--    de users.profils référencée par la clé étrangère users_profils_fkey.
INSERT INTO "public"."profil" ("num_profil", "name_profil", "short_name")
VALUES (-1, 'Visiteur', 'VIS')
ON CONFLICT ("num_profil") DO NOTHING;

-- 1. Nouveaux profils (famille « Pôle IT » dans le select).
INSERT INTO "public"."profil" ("num_profil", "name_profil", "short_name")
VALUES
  (41, 'Moetx Amont', 'MOEtx'),
  (42, 'Chef de projet', 'CdP')
ON CONFLICT ("num_profil") DO NOTHING;

-- 2. Retrait du profil « Pôle IT » (40).
--    On réaffecte d'abord les utilisateurs concernés vers « Visiteur » (-1) pour respecter
--    la FK (users.profils NOT NULL) ; ils pourront être réaffectés depuis l'UI.
UPDATE "public"."users" SET "profils" = -1 WHERE "profils" = 40;
DELETE FROM "public"."profil" WHERE "num_profil" = 40;
