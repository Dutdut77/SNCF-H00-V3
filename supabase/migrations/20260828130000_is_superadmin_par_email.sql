-- ─── is_superadmin() : reconnaître l'utilisateur par email, pas seulement par id ──
--
-- Symptôme : un SuperAdmin voit bien le modal de création d'annexe (le front lit
-- users.role via l'email) mais l'enregistrement échoue sur
-- « new row violates row-level security policy for table chantier_pages ».
--
-- Cause : la version précédente de is_superadmin() joignait sur u.id = auth.uid().
-- Or `public.users.id` n'est PAS fiablement égal à l'uuid d'auth. Le callback OIDC
-- (server/api/auth/callback.get.js) essaie bien de le resynchroniser :
--
--     .update({ id: userUuid, ... }).eq('id', existingUser.id)
--
-- mais trois clés étrangères pointent sur public.users en ON UPDATE NO ACTION :
--   - commandes_matieres.created_by  → users.id
--   - bordereaux_commande.created_by → users.id
--   - absences.user_email            → users.email
--
-- Dès que l'utilisateur a créé une liste de matières ou un bordereau, cet UPDATE
-- est rejeté par la contrainte. L'erreur n'est que console.warn-ée côté serveur :
-- elle passe inaperçue, et users.id conserve sa valeur d'origine. Se reconnecter
-- ne répare donc rien.
--
-- Correctif : reconnaître l'utilisateur par email — la clé d'identité réellement
-- utilisée partout dans l'app (contacts chantier stockés par email, FK
-- absences.user_email sur users.email). Le JWT forgé par
-- server/utils/generateSupabaseJwt.js porte déjà la claim `email`.
--
-- La correspondance par id est conservée en complément : si les deux clés sont
-- synchronisées, l'une ou l'autre suffit.
--
-- Note : ceci ne corrige PAS la désynchronisation de users.id elle-même, qui
-- reste un sujet à part entière (le silence du console.warn dans le callback
-- mériterait d'être traité). Ici on ne fait que cesser d'en dépendre.

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
         u.id = auth.uid()
         OR lower(u.email) = lower(nullif(auth.jwt() ->> 'email', ''))
       )
  );
$$;

COMMENT ON FUNCTION "public"."is_superadmin"() IS
  'true si l''utilisateur courant a users.role = 2, reconnu par email (claim JWT) ou par id (auth.uid()). Utilisable en policy RLS.';

-- Les policies posées par 20260828120000_annexes_droits_superadmin.sql appellent
-- la fonction par son nom : elles prennent la nouvelle définition sans être
-- recréées. Rien d'autre à rejouer.

-- ─── Contrôle ───────────────────────────────────────────────────────────────
-- Pour vérifier l'état de synchronisation des comptes SuperAdmin :
--
--   SELECT u.email, u.role, u.id AS users_id, a.id AS auth_id,
--          (u.id = a.id) AS id_synchronise
--     FROM public.users u
--     LEFT JOIN auth.users a ON lower(a.email) = lower(u.email)
--    WHERE u.role = 2;
--
-- id_synchronise = false sur certaines lignes est désormais sans conséquence
-- pour les annexes, mais confirme le diagnostic ci-dessus.
