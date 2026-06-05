-- Clôture des tâches PAR PROFIL.
-- Une tâche (h00) peut concerner plusieurs profils (taches.tache_profil).
-- On stocke désormais l'état de clôture de CHAQUE profil dans une colonne jsonb,
-- tout en conservant status/realisation comme AGRÉGAT global (recalculé côté app)
-- pour ne pas casser dashboards / planning / filtres serveur existants.
--
-- Forme du jsonb : { "<num_profil>": { status, realisation, commentaire, non_concerne } }
--   status : 0 = à faire, 1 = en cours, 2 = clôturé
--   non_concerne : true => le profil ne compte plus dans l'agrégat

ALTER TABLE "public"."h00"
  ADD COLUMN IF NOT EXISTS "cloture_profil" jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Backfill : recopier l'état actuel (status/realisation/commentaire) dans chaque
-- profil concerné de la tâche, afin de préserver l'état "fait / en cours" existant.
UPDATE "public"."h00" h
SET "cloture_profil" = sub.cp
FROM (
  SELECT x.id,
         jsonb_object_agg(
           x.p::text,
           jsonb_build_object(
             'status', x.status,
             'realisation', x.realisation,
             'commentaire', COALESCE(x.commentaire, ''),
             'non_concerne', false
           )
         ) AS cp
  FROM (
    SELECT h2.id,
           h2.status,
           h2.realisation,
           h2.commentaire,
           unnest(t.tache_profil) AS p
    FROM "public"."h00" h2
    JOIN "public"."taches" t ON t.idtaches = h2.tache_id
    WHERE t.tache_profil IS NOT NULL
  ) x
  GROUP BY x.id
) sub
WHERE h.id = sub.id;
