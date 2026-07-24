ALTER TABLE "public"."bordereaux_commande_lignes"
  DROP CONSTRAINT IF EXISTS "bordereaux_commande_lignes_emplacement_ba_check";
ALTER TABLE "public"."bordereaux_commande_lignes"
  ADD CONSTRAINT "bordereaux_commande_lignes_emplacement_ba_check"
    CHECK ("emplacement_ba" IN ('parc_ltv', 'd2', 'uo_travaux'));