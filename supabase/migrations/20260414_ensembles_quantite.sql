-- Ajout d'une quantité sur les ensembles utilisés dans une commande
ALTER TABLE commandes_matieres_ensembles
  ADD COLUMN IF NOT EXISTS quantite NUMERIC(12,3) DEFAULT 1;
