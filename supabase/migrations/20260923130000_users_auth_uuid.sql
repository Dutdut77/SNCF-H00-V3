-- ─── public.users.auth_uuid : lien direct vers auth.users ──────────────────
--
-- /api/auth/refresh doit retrouver l'uuid Supabase Auth de l'utilisateur pour
-- signer son JWT (sub). Il parcourait jusqu'ici tous les comptes via
-- auth.admin.listUsers() (findUserByEmail), à chaque refresh — soit presque à
-- chaque rechargement de page, l'access token OIDC SNCF ne durant que 60 s.
--
-- `public.users.id` ne peut pas servir : il n'est pas resynchronisé sur l'uuid
-- Supabase Auth (FK en ON UPDATE NO ACTION). On stocke donc l'uuid à part.
-- Rempli par le callback OIDC à chaque connexion, et par le refresh en repli.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_uuid uuid;

-- Rattrapage des lignes existantes via l'oidc_id posé dans les métadonnées Auth
UPDATE public.users u
   SET auth_uuid = a.id
  FROM auth.users a
 WHERE u.auth_uuid IS NULL
   AND u.oidc_id IS NOT NULL
   AND a.raw_user_meta_data ->> 'oidc_id' = u.oidc_id;
