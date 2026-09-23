-- ─── chantiers.attribution : plus de secteur par défaut codé en dur ─────────
--
-- La colonne avait DEFAULT 'UO Travaux' (20260617130000_attributions_table.sql).
-- H00 Travaux étant déployée une fois par infrapôle, chacun définit ses propres
-- secteurs (Paramètres → Application → Secteurs) : un infrapôle sans secteur
-- « UO Travaux » verrait toute création sans secteur échouer sur la clé étrangère.
--
-- L'application fournit désormais toujours le secteur choisi, ou à défaut le
-- premier secteur configuré (useAttributions → defaultAttributionCode).

ALTER TABLE "public"."chantiers" ALTER COLUMN "attribution" DROP DEFAULT;

-- ─── Rollback ───────────────────────────────────────────────────────────────
--   ALTER TABLE "public"."chantiers" ALTER COLUMN "attribution" SET DEFAULT 'UO Travaux';
