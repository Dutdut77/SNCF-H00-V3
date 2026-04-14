-- Table pour les lignes de calcul "Vieilles Matières" par chantier
CREATE TABLE IF NOT EXISTS "public"."vieilles_matieres_lignes" (
  "id" uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
  "chantier_id" integer NOT NULL,
  "section_type" text NOT NULL CHECK (section_type IN ('voie_courante', 'adv')),
  "ordre" integer DEFAULT 0 NOT NULL,
  "voie" text DEFAULT '' NOT NULL,
  "pk_debut" numeric(10,3),
  "pk_fin" numeric(10,3),
  "profil_rail" numeric(6,1),
  "type_traverses" text CHECK (type_traverses IN ('Bois', 'Bibloc', 'Monobloc')),
  "travelage" integer,
  "type_travaux" text CHECK (type_travaux IN ('RVB', 'RR', 'RB', 'RT', 'RB+RT', '2R')),
  "profondeur_degarnissage" numeric(5,1),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "vieilles_matieres_lignes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "vieilles_matieres_lignes_chantier_id_fkey"
    FOREIGN KEY ("chantier_id") REFERENCES "public"."chantiers"("id") ON DELETE CASCADE
);

-- Index pour les requêtes par chantier
CREATE INDEX IF NOT EXISTS "vieilles_matieres_lignes_chantier_id_idx"
  ON "public"."vieilles_matieres_lignes" ("chantier_id");

-- RLS
ALTER TABLE "public"."vieilles_matieres_lignes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vieilles_matieres_lignes_select" ON "public"."vieilles_matieres_lignes"
  FOR SELECT USING (true);

CREATE POLICY "vieilles_matieres_lignes_insert" ON "public"."vieilles_matieres_lignes"
  FOR INSERT WITH CHECK (true);

CREATE POLICY "vieilles_matieres_lignes_update" ON "public"."vieilles_matieres_lignes"
  FOR UPDATE USING (true);

CREATE POLICY "vieilles_matieres_lignes_delete" ON "public"."vieilles_matieres_lignes"
  FOR DELETE USING (true);
