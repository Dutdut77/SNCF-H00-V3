-- ─── Annexes de chantier : écriture réservée aux SuperAdmins ────────────────
--
-- Avant : `chantier_pages` portait une policy unique « all for authenticated »
-- (USING true / WITH CHECK true) et le bucket `photos` acceptait n'importe quelle
-- écriture d'un utilisateur connecté. Côté UI, seule la CRÉATION d'une annexe
-- était réservée au SuperAdmin (bouton `v-if="isSuperAdmin"`) : la modification et
-- la suppression étaient ouvertes à tous, et rien en base ne s'y opposait.
--
-- Après : la lecture reste ouverte à tous les utilisateurs connectés (les annexes
-- sont consultées et imprimées par tous les intervenants), l'écriture — table ET
-- fichiers images — est réservée aux SuperAdmins (users.role = 2).
--
-- Le JWT Supabase est forgé côté serveur (server/utils/generateSupabaseJwt.js)
-- avec sub = l'uuid de l'utilisateur, et server/api/auth/callback.get.js
-- resynchronise `public.users.id` sur cet uuid à chaque connexion.
-- `auth.uid()` correspond donc bien à `public.users.id`.

-- ─── 1. Helper de contrôle de rôle ──────────────────────────────────────────
-- SECURITY DEFINER : la policy interroge `public.users`, elle-même protégée par
-- RLS. Sans SECURITY DEFINER on dépendrait de la policy de `users` (récursion
-- possible si elle se durcit un jour). search_path figé pour éviter tout
-- détournement de résolution de nom.
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
     WHERE u.id = auth.uid()
       AND u.role = 2
  );
$$;

ALTER FUNCTION "public"."is_superadmin"() OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."is_superadmin"() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."is_superadmin"() TO "authenticated";
GRANT EXECUTE ON FUNCTION "public"."is_superadmin"() TO "service_role";

COMMENT ON FUNCTION "public"."is_superadmin"() IS
  'true si l''utilisateur courant (auth.uid()) a users.role = 2. Utilisable en policy RLS.';

-- ─── 2. Table chantier_pages ────────────────────────────────────────────────
-- La policy « all for authenticated » couvrait les 4 commandes en une : on la
-- remplace par un jeu explicite, lecture ouverte / écriture SuperAdmin.
DROP POLICY IF EXISTS "all for authenticated" ON "public"."chantier_pages";

DROP POLICY IF EXISTS "chantier_pages_select" ON "public"."chantier_pages";
CREATE POLICY "chantier_pages_select" ON "public"."chantier_pages"
  FOR SELECT TO "authenticated" USING (true);

-- savePages() fait un upsert (INSERT ... ON CONFLICT DO UPDATE) : les deux
-- policies insert et update doivent passer pour qu'une sauvegarde aboutisse.
DROP POLICY IF EXISTS "chantier_pages_insert" ON "public"."chantier_pages";
CREATE POLICY "chantier_pages_insert" ON "public"."chantier_pages"
  FOR INSERT TO "authenticated" WITH CHECK ("public"."is_superadmin"());

DROP POLICY IF EXISTS "chantier_pages_update" ON "public"."chantier_pages";
CREATE POLICY "chantier_pages_update" ON "public"."chantier_pages"
  FOR UPDATE TO "authenticated"
  USING ("public"."is_superadmin"())
  WITH CHECK ("public"."is_superadmin"());

-- Pas de DELETE applicatif : supprimer une annexe réécrit le tableau JSONB.
-- La ligne ne disparaît que par CASCADE à la suppression du chantier.
DROP POLICY IF EXISTS "chantier_pages_delete" ON "public"."chantier_pages";
CREATE POLICY "chantier_pages_delete" ON "public"."chantier_pages"
  FOR DELETE TO "authenticated" USING ("public"."is_superadmin"());

-- ─── 3. Images des annexes dans le bucket `photos` ──────────────────────────
-- Les images d'annexes vivent sous le préfixe `custom-pages/{chantierId}/`, dans
-- le même bucket que la galerie photo (elle, ouverte à tous).
--
-- On n'y touche pas aux policies permissives existantes (créées depuis le
-- dashboard, nommées « Give users authenticated access to folder ... ») : on
-- ajoute des policies RESTRICTIVE, combinées en AND avec les permissives.
--
-- Volontairement AUCUNE restriction en SELECT : tout le monde doit pouvoir
-- afficher et imprimer les images des annexes (createSignedUrl lit l'objet).
DROP POLICY IF EXISTS "custom_pages_photos_insert_superadmin" ON "storage"."objects";
CREATE POLICY "custom_pages_photos_insert_superadmin" ON "storage"."objects"
  AS RESTRICTIVE FOR INSERT TO "authenticated"
  WITH CHECK (
    bucket_id <> 'photos'
    OR name NOT LIKE 'custom-pages/%'
    OR "public"."is_superadmin"()
  );

DROP POLICY IF EXISTS "custom_pages_photos_update_superadmin" ON "storage"."objects";
CREATE POLICY "custom_pages_photos_update_superadmin" ON "storage"."objects"
  AS RESTRICTIVE FOR UPDATE TO "authenticated"
  USING (
    bucket_id <> 'photos'
    OR name NOT LIKE 'custom-pages/%'
    OR "public"."is_superadmin"()
  )
  WITH CHECK (
    bucket_id <> 'photos'
    OR name NOT LIKE 'custom-pages/%'
    OR "public"."is_superadmin"()
  );

DROP POLICY IF EXISTS "custom_pages_photos_delete_superadmin" ON "storage"."objects";
CREATE POLICY "custom_pages_photos_delete_superadmin" ON "storage"."objects"
  AS RESTRICTIVE FOR DELETE TO "authenticated"
  USING (
    bucket_id <> 'photos'
    OR name NOT LIKE 'custom-pages/%'
    OR "public"."is_superadmin"()
  );

-- ─── Rollback ───────────────────────────────────────────────────────────────
-- En cas de blocage inattendu (un SuperAdmin qui ne peut plus enregistrer), pour
-- revenir au comportement précédent :
--
--   DROP POLICY IF EXISTS "custom_pages_photos_insert_superadmin" ON "storage"."objects";
--   DROP POLICY IF EXISTS "custom_pages_photos_update_superadmin" ON "storage"."objects";
--   DROP POLICY IF EXISTS "custom_pages_photos_delete_superadmin" ON "storage"."objects";
--   DROP POLICY IF EXISTS "chantier_pages_insert" ON "public"."chantier_pages";
--   DROP POLICY IF EXISTS "chantier_pages_update" ON "public"."chantier_pages";
--   DROP POLICY IF EXISTS "chantier_pages_delete" ON "public"."chantier_pages";
--   DROP POLICY IF EXISTS "chantier_pages_select" ON "public"."chantier_pages";
--   CREATE POLICY "all for authenticated" ON "public"."chantier_pages"
--     TO "authenticated" USING (true) WITH CHECK (true);
--
-- Contrôle préalable recommandé — doit renvoyer la liste attendue des SuperAdmins :
--   SELECT id, email, role FROM public.users WHERE role = 2;
