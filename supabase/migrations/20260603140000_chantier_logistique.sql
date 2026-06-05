-- Suivi LOGISTIQUE par chantier (dashboard Logistique).
-- Une ligne par chantier, l'état de chaque poste est stocké dans une colonne jsonb
-- (même convention que h00.cloture_profil + app/utils/cloture.js / app/utils/logistique.js).
--
-- Forme du jsonb "equipements" :
-- {
--   "base_vie": {
--     "besoin": null,                                   -- null = non évalué, true = besoin, false = pas besoin
--     "modules": { "vac": null, "algeco": 0, "groupe_electrogene": false }, -- vac: bb8|bb10|base12d|null
--     "pose":   { "status": 0, "date": null, "commentaire": "" },
--     "depose": { "status": 0, "date": null, "commentaire": "" }
--   },
--   "imprimante": { "status": 0, "date": null, "commentaire": "" },
--   "wifi":       { "status": 0, "date": null, "commentaire": "" },
--   "radios":     { "status": 0, "date": null, "commentaire": "" }
-- }
--   status : 0 = À faire, 1 = En cours, 2 = Fait
--   date   : 'YYYY-MM-DD'

CREATE TABLE IF NOT EXISTS "public"."chantier_logistique" (
  "chantier_id" integer NOT NULL,
  "equipements" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp with time zone DEFAULT "now"(),
  CONSTRAINT "chantier_logistique_pkey" PRIMARY KEY ("chantier_id"),
  CONSTRAINT "chantier_logistique_chantier_id_fkey"
    FOREIGN KEY ("chantier_id") REFERENCES "public"."chantiers"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."chantier_logistique" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all_chantier_logistique"
  ON "public"."chantier_logistique"
  TO "authenticated"
  USING (true) WITH CHECK (true);

GRANT ALL ON TABLE "public"."chantier_logistique" TO "anon";
GRANT ALL ON TABLE "public"."chantier_logistique" TO "authenticated";
GRANT ALL ON TABLE "public"."chantier_logistique" TO "service_role";
