-- Ajout d'un nom aux box réseau (pour les bases où la table boxes existait déjà sans cette colonne).
ALTER TABLE "public"."boxes" ADD COLUMN IF NOT EXISTS "nom" "text";
