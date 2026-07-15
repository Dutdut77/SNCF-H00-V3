-- Suivi EPM (entrée en périmètre maintenance) et EPTx (entrée en périmètre travaux)
-- par chantier et par métier (VOIE / SES). Une ligne par couple (chantier, métier).
-- Les réserves (total / réalisées / documents) concernent uniquement l'EPM (dashboard /dashboard/epm).

CREATE TABLE IF NOT EXISTS "public"."chantier_epm" (
  "chantier_id" integer NOT NULL,
  "metier" text NOT NULL CHECK ("metier" IN ('VOIE', 'SES')),
  "epm_date" date,
  "epm_lien" text,
  "eptx_date" date,
  "eptx_lien" text,
  "reserves_total" integer,
  "reserves_realisees" integer,
  "reserves_documents" text,
  "created_at" timestamp with time zone DEFAULT "now"(),
  "updated_at" timestamp with time zone DEFAULT "now"(),
  CONSTRAINT "chantier_epm_pkey" PRIMARY KEY ("chantier_id", "metier"),
  CONSTRAINT "chantier_epm_chantier_id_fkey"
    FOREIGN KEY ("chantier_id") REFERENCES "public"."chantiers"("id") ON DELETE CASCADE
);

ALTER TABLE "public"."chantier_epm" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all_chantier_epm"
  ON "public"."chantier_epm"
  TO "authenticated"
  USING (true) WITH CHECK (true);

GRANT ALL ON TABLE "public"."chantier_epm" TO "anon";
GRANT ALL ON TABLE "public"."chantier_epm" TO "authenticated";
GRANT ALL ON TABLE "public"."chantier_epm" TO "service_role";
