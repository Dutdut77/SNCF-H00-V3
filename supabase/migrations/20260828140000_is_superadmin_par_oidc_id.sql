-- ─── is_superadmin() : reconnaître l'utilisateur par oidc_id ────────────────
--
-- Troisième et dernière itération. Les deux précédentes joignaient sur des clés
-- qui ne relient pas fiablement une session à une ligne `public.users` :
--
--   1. u.id = auth.uid()
--      `public.users.id` n'est jamais resynchronisé sur l'uuid Supabase Auth :
--      l'UPDATE du callback OIDC est rejeté par les FK qui référencent la ligne
--      (commandes_matieres.created_by, bordereaux_commande.created_by, en
--      ON UPDATE NO ACTION) et l'erreur n'est que console.warn-ée.
--
--   2. lower(u.email) = lower(auth.jwt() ->> 'email')
--      L'email renvoyé par l'IdP peut différer de celui stocké en base. Constat
--      sur la stack locale : 0 des 68 lignes de public.users ne correspond à
--      auth.users, ni par id ni par email (données de production en
--      @reseau.sncf.fr, IdP de développement en @sncf.fr).
--
-- La clé d'identité réellement utilisée par l'application est `oidc_id`, le `sub`
-- OIDC : app/middleware/auth.global.js appelle getOneUser(userInfo.sub), qui fait
-- `.eq('oidc_id', sub)`. C'est ce qui détermine `role` côté front, donc l'affichage
-- du bouton « Ajouter une annexe ».
--
-- On aligne donc la RLS sur cette même clé : front et base se prononcent
-- désormais sur le même critère, par construction.
--
-- PRÉREQUIS : la claim `oidc_id` est ajoutée au JWT Supabase par
-- server/utils/generateSupabaseJwt.js (appelée depuis callback.get.js et
-- refresh.get.js). Elle n'apparaît QUE dans les jetons émis après ce déploiement :
-- une déconnexion / reconnexion est nécessaire pour que les policies la voient.
--
-- Les correspondances par email et par id sont conservées en repli, pour les
-- sessions encore porteuses d'un ancien JWT et les bases où les clés sont bien
-- synchronisées.

CREATE OR REPLACE FUNCTION "public"."is_superadmin"()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.users u
     WHERE u.role = 2
       AND (
         -- Clé principale : le `sub` OIDC, comme getOneUser() côté front
         u.oidc_id = nullif(auth.jwt() ->> 'oidc_id', '')
         -- Replis
         OR lower(u.email) = lower(nullif(auth.jwt() ->> 'email', ''))
         OR u.id = auth.uid()
       )
  );
$$;

COMMENT ON FUNCTION "public"."is_superadmin"() IS
  'true si l''utilisateur courant a users.role = 2. Reconnu par oidc_id (claim JWT, clé d''identité de l''app), avec repli sur email puis auth.uid(). Utilisable en policy RLS.';

-- Les policies posées par 20260828120000 appellent la fonction par son nom :
-- elles prennent la nouvelle définition sans être recréées.

-- ─── Contrôle ───────────────────────────────────────────────────────────────
-- Après reconnexion, exécuté avec le JWT de l'utilisateur (pas depuis l'éditeur
-- SQL, qui s'exécute en postgres et n'a pas de claims) :
--
--   SELECT auth.jwt() ->> 'oidc_id' AS oidc_id_du_jeton, public.is_superadmin();
--
-- Si oidc_id_du_jeton est NULL, le jeton est antérieur au déploiement :
-- se déconnecter et se reconnecter.
