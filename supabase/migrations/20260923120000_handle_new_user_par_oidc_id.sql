-- ─── handle_new_user() : reconnaître l'utilisateur par oidc_id ──────────────
--
-- Même correction que dans server/api/auth/callback.get.js : la version
-- précédente ne cherchait la ligne `public.users` que par email. L'email renvoyé
-- par l'IdP SNCF peut différer de celui stocké en base : l'utilisateur n'était
-- pas trouvé et l'INSERT échouait sur la contrainte users_oidc_id_key (23505).
--
-- Recherche désormais :
--   1. par oidc_id (clé d'identité de l'app, cf. is_superadmin())
--   2. à défaut par email, insensible à la casse (utilisateur pré-créé par un
--      admin, oidc_id encore vide)
--
-- Corrige aussi la référence à la colonne `auth_uuid`, qui n'existe pas dans
-- public.users : toute exécution de l'ancienne fonction levait une erreur.
-- `id` et `email` d'une ligne existante ne sont pas modifiés (FK / unicité).

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  existing_id UUID;
  oidc_sub TEXT;
  user_email TEXT;
  user_nom TEXT;
  user_prenom TEXT;
  user_name TEXT;
BEGIN
  user_email := lower(NEW.email);
  oidc_sub := NEW.raw_user_meta_data->>'oidc_id';
  user_nom := NEW.raw_user_meta_data->>'nom';
  user_prenom := NEW.raw_user_meta_data->>'prenom';
  user_name := NEW.raw_user_meta_data->>'displayName';

  IF oidc_sub IS NOT NULL THEN
    SELECT id INTO existing_id FROM public.users WHERE oidc_id = oidc_sub;
  END IF;

  IF existing_id IS NULL AND user_email IS NOT NULL THEN
    SELECT id INTO existing_id FROM public.users WHERE lower(email) = user_email LIMIT 1;
  END IF;

  IF existing_id IS NOT NULL THEN
    UPDATE public.users
    SET
      oidc_id = COALESCE(oidc_sub, oidc_id),
      name = COALESCE(name, user_name),
      nom = COALESCE(nom, user_nom),
      prenom = COALESCE(prenom, user_prenom)
    WHERE id = existing_id;
  ELSE
    INSERT INTO public.users (id, email, oidc_id, name, nom, prenom, profils, role)
    VALUES (NEW.id, user_email, oidc_sub, user_name, user_nom, user_prenom, -1, 0);
  END IF;

  RETURN NEW;
END;
$$;
