


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  existing_user RECORD;
  oidc_sub TEXT;
  user_email TEXT;
  user_nom TEXT;
  user_prenom TEXT;
BEGIN
  -- Récupérer les infos du nouvel utilisateur auth
  user_email := NEW.email;
  oidc_sub := NEW.raw_user_meta_data->>'oidc_id';
  user_nom := NEW.raw_user_meta_data->>'nom';
  user_prenom := NEW.raw_user_meta_data->>'prenom';

  -- Vérifier si un utilisateur avec cet email existe déjà
  SELECT * INTO existing_user 
  FROM public.users 
  WHERE email = user_email;

  IF existing_user.id IS NOT NULL THEN
    -- L'utilisateur existe → mettre à jour avec auth_uuid et oidc_id
    UPDATE public.users
    SET 
      auth_uuid = NEW.id,
      oidc_id = COALESCE(oidc_sub, oidc_id),
      nom = COALESCE(existing_user.nom, user_nom),
      prenom = COALESCE(existing_user.prenom, user_prenom),
      updated_at = NOW()
    WHERE id = existing_user.id;
    
    RAISE NOTICE 'Utilisateur existant mis à jour: %', user_email;
  ELSE
    -- Nouvel utilisateur → créer l'entrée
    INSERT INTO public.users (id, email, oidc_id, auth_uuid, nom, prenom, profils, role)
    VALUES (
      NEW.id,
      user_email,
      oidc_sub,
      NEW.id,
      user_nom,
      user_prenom,
      -1,
      0
    );
    
    RAISE NOTICE 'Nouvel utilisateur créé: %', user_email;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_absences_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_absences_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_chantier_pages_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_chantier_pages_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_commentaires_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;$$;


ALTER FUNCTION "public"."update_commentaires_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_etudes_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."update_etudes_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_timeline_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;$$;


ALTER FUNCTION "public"."update_timeline_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."absences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_email" "text" NOT NULL,
    "type" "text" NOT NULL,
    "semaine_debut" integer NOT NULL,
    "annee_debut" integer NOT NULL,
    "semaine_fin" integer NOT NULL,
    "annee_fin" integer NOT NULL,
    "commentaire" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "absences_annee_debut_check" CHECK ((("annee_debut" >= 2020) AND ("annee_debut" <= 2100))),
    CONSTRAINT "absences_annee_fin_check" CHECK ((("annee_fin" >= 2020) AND ("annee_fin" <= 2100))),
    CONSTRAINT "absences_semaine_debut_check" CHECK ((("semaine_debut" >= 1) AND ("semaine_debut" <= 53))),
    CONSTRAINT "absences_semaine_fin_check" CHECK ((("semaine_fin" >= 1) AND ("semaine_fin" <= 53))),
    CONSTRAINT "absences_type_check" CHECK (("type" = ANY (ARRAY['conges'::"text", 'formation'::"text"])))
);


ALTER TABLE "public"."absences" OWNER TO "postgres";


COMMENT ON TABLE "public"."absences" IS 'Table des absences des utilisateurs (congés et formations)';



COMMENT ON COLUMN "public"."absences"."user_email" IS 'Email de l''utilisateur concerné';



COMMENT ON COLUMN "public"."absences"."type" IS 'Type d''absence : conges ou formation';



COMMENT ON COLUMN "public"."absences"."semaine_debut" IS 'Numéro de semaine de début (1-53)';



COMMENT ON COLUMN "public"."absences"."annee_debut" IS 'Année de début';



COMMENT ON COLUMN "public"."absences"."semaine_fin" IS 'Numéro de semaine de fin (1-53)';



COMMENT ON COLUMN "public"."absences"."annee_fin" IS 'Année de fin';



COMMENT ON COLUMN "public"."absences"."commentaire" IS 'Commentaire optionnel sur l''absence';



CREATE TABLE IF NOT EXISTS "public"."categories" (
    "idcategories" integer NOT NULL,
    "name" character varying
);


ALTER TABLE "public"."categories" OWNER TO "postgres";


ALTER TABLE "public"."categories" ALTER COLUMN "idcategories" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."categories_idcategories_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."chantier_contacts_autres" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chantier_id" integer NOT NULL,
    "metier" character varying(255),
    "entreprise" character varying(255),
    "responsable_nom" character varying(255),
    "responsable_email" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chantier_contacts_autres" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chantier_contacts_entreprises" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chantier_id" integer NOT NULL,
    "metier" character varying(255),
    "entreprise" character varying(255),
    "responsable_nom" character varying(255),
    "responsable_email" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chantier_contacts_entreprises" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chantier_contacts_etudes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chantier_id" integer NOT NULL,
    "plan_technique_nom" character varying(255),
    "plan_technique_email" character varying(255),
    "documents_execution_nom" character varying(255),
    "documents_execution_email" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "cdpe_nom" character varying,
    "cdpe_email" character varying,
    "eg_nom" character varying,
    "eg_email" character varying
);


ALTER TABLE "public"."chantier_contacts_etudes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chantier_contacts_generalites" (
    "id" integer NOT NULL,
    "chantier_id" integer NOT NULL,
    "chef_projet_nom" "text",
    "chef_projet_email" "text",
    "coordinateur_securite_nom" "text",
    "coordinateur_securite_email" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chantier_contacts_generalites" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."chantier_contacts_generalites_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."chantier_contacts_generalites_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."chantier_contacts_generalites_id_seq" OWNED BY "public"."chantier_contacts_generalites"."id";



CREATE TABLE IF NOT EXISTS "public"."chantier_contacts_travaux" (
    "id" integer NOT NULL,
    "chantier_id" integer NOT NULL,
    "rlt_voie_principale" "text",
    "rlt_voie_secondaire" "text"[],
    "rlt_ses_principale" "text",
    "rlt_ses_secondaire" "text"[],
    "rlt_cat_principale" "text",
    "rlt_cat_secondaire" "text"[],
    "preop_voie" "text",
    "preop_ses" "text",
    "logistique" "text",
    "supervisor" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "kv_voie" "text"[],
    "kv_ses" "text"[],
    "kv_cat" "text"[]
);


ALTER TABLE "public"."chantier_contacts_travaux" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."chantier_contacts_travaux_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."chantier_contacts_travaux_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."chantier_contacts_travaux_id_seq" OWNED BY "public"."chantier_contacts_travaux"."id";



CREATE TABLE IF NOT EXISTS "public"."chantier_dex" (
    "id" integer NOT NULL,
    "id_chantier" integer NOT NULL,
    "indice" character varying(50) NOT NULL,
    "titre" character varying(255),
    "date_prevu" "text"[],
    "date_mes" "date",
    "date_recu" "date",
    "observation" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_dex_chantier_id" CHECK (("id_chantier" IS NOT NULL)),
    CONSTRAINT "check_dex_indice" CHECK ((("indice" IS NOT NULL) AND (("indice")::"text" <> ''::"text")))
);


ALTER TABLE "public"."chantier_dex" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."chantier_dex_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."chantier_dex_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."chantier_dex_id_seq" OWNED BY "public"."chantier_dex"."id";



CREATE TABLE IF NOT EXISTS "public"."chantier_pages" (
    "id" integer NOT NULL,
    "chantier_id" integer NOT NULL,
    "content" "jsonb" DEFAULT '[]'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chantier_pages" OWNER TO "postgres";


COMMENT ON TABLE "public"."chantier_pages" IS 'Pages personnalisées des chantiers';



COMMENT ON COLUMN "public"."chantier_pages"."content" IS 'Array JSON de pages: [{id, template_key, navBarTitle, content}]';



CREATE SEQUENCE IF NOT EXISTS "public"."chantier_pages_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."chantier_pages_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."chantier_pages_id_seq" OWNED BY "public"."chantier_pages"."id";



CREATE TABLE IF NOT EXISTS "public"."chantier_pt" (
    "id" integer NOT NULL,
    "id_chantier" integer NOT NULL,
    "indice" character varying(50) NOT NULL,
    "titre" character varying(255),
    "date_prevu" "text"[],
    "date_mes" "date",
    "date_recu" "date",
    "observation" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_pt_chantier_id" CHECK (("id_chantier" IS NOT NULL)),
    CONSTRAINT "check_pt_indice" CHECK ((("indice" IS NOT NULL) AND (("indice")::"text" <> ''::"text")))
);


ALTER TABLE "public"."chantier_pt" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."chantier_pt_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."chantier_pt_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."chantier_pt_id_seq" OWNED BY "public"."chantier_pt"."id";



CREATE TABLE IF NOT EXISTS "public"."chantiers" (
    "id" integer NOT NULL,
    "compte" character varying(50) NOT NULL,
    "name" character varying(255) NOT NULL,
    "date_start_travaux" "date",
    "date_end_travaux" "date",
    "etat" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "ligne_id" integer,
    "decret" character varying(2),
    "type_essais" character varying(20),
    "matiere" "text",
    "compte_slg" character varying(255),
    "compte_moe" character varying(255),
    "compte_matieres" character varying(255),
    "autre" "text",
    "date_rea" "jsonb",
    "date_prepa" "jsonb",
    "matiere_da" "text"
);


ALTER TABLE "public"."chantiers" OWNER TO "postgres";


ALTER TABLE "public"."chantiers" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."chantiers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."commentaires" (
    "id" bigint NOT NULL,
    "chantier_id" integer NOT NULL,
    "type" character varying(50) NOT NULL,
    "content" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_type_commentaire" CHECK ((("type")::"text" = ANY (ARRAY[('generalite'::character varying)::"text", ('ses'::character varying)::"text", ('voie'::character varying)::"text", ('logistique'::character varying)::"text", ('terrain'::character varying)::"text"])))
);


ALTER TABLE "public"."commentaires" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."commentaires_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."commentaires_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."commentaires_id_seq" OWNED BY "public"."commentaires"."id";



ALTER TABLE "public"."commentaires" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."commentaires_id_seq1"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."h00" (
    "id" integer NOT NULL,
    "chantier_id" integer NOT NULL,
    "tache_id" integer NOT NULL,
    "commentaire" "text",
    "status" smallint DEFAULT 0 NOT NULL,
    "prevision" "date",
    "realisation" "date",
    "categorie_id" integer NOT NULL,
    "important" boolean DEFAULT false NOT NULL,
    "alerte" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."h00" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."h00_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."h00_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."h00_id_seq" OWNED BY "public"."h00"."id";



CREATE TABLE IF NOT EXISTS "public"."lignes" (
    "id" bigint NOT NULL,
    "name" character varying NOT NULL
);


ALTER TABLE "public"."lignes" OWNER TO "postgres";


ALTER TABLE "public"."lignes" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."lignes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."photo_repertoires" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chantier_id" integer NOT NULL,
    "nom" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_photo_repertoires_nom_not_empty" CHECK ((TRIM(BOTH FROM "nom") <> ''::"text"))
);


ALTER TABLE "public"."photo_repertoires" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."photos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chantier_id" integer NOT NULL,
    "repertoire_id" "uuid",
    "nom_fichier" "text" NOT NULL,
    "chemin_storage" "text" NOT NULL,
    "taille" bigint NOT NULL,
    "mime_type" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_photos_chemin_storage_not_empty" CHECK ((TRIM(BOTH FROM "chemin_storage") <> ''::"text")),
    CONSTRAINT "check_photos_mime_type_valid" CHECK (("mime_type" = ANY (ARRAY['image/jpeg'::"text", 'image/png'::"text", 'image/webp'::"text", 'image/gif'::"text"]))),
    CONSTRAINT "check_photos_nom_fichier_not_empty" CHECK ((TRIM(BOTH FROM "nom_fichier") <> ''::"text")),
    CONSTRAINT "check_photos_taille_positive" CHECK (("taille" > 0))
);


ALTER TABLE "public"."photos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profil" (
    "id" bigint NOT NULL,
    "num_profil" bigint NOT NULL,
    "name_profil" character varying,
    "short_name" "text"
);


ALTER TABLE "public"."profil" OWNER TO "postgres";


ALTER TABLE "public"."profil" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."profil_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."taches" (
    "idtaches" integer NOT NULL,
    "id_categories" integer NOT NULL,
    "tache" character varying,
    "delais" bigint,
    "tache_profil" integer[],
    "opt_delais" smallint DEFAULT '0'::smallint,
    "rp1" smallint DEFAULT '0'::smallint
);


ALTER TABLE "public"."taches" OWNER TO "postgres";


ALTER TABLE "public"."taches" ALTER COLUMN "idtaches" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."taches_idtaches_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."timeline" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "chantier_id" integer NOT NULL,
    "type" character varying(20) NOT NULL,
    "semaine_debut" integer NOT NULL,
    "annee_debut" integer NOT NULL,
    "semaine_fin" integer,
    "annee_fin" integer,
    "contenu" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_weekend_fields" CHECK ((((("type")::"text" = 'semaine'::"text") AND ("semaine_fin" IS NULL) AND ("annee_fin" IS NULL)) OR ((("type")::"text" = 'weekend'::"text") AND ("semaine_fin" IS NOT NULL) AND ("annee_fin" IS NOT NULL)))),
    CONSTRAINT "timeline_semaine_debut_check" CHECK ((("semaine_debut" >= 1) AND ("semaine_debut" <= 53))),
    CONSTRAINT "timeline_semaine_fin_check" CHECK ((("semaine_fin" IS NULL) OR (("semaine_fin" >= 1) AND ("semaine_fin" <= 53)))),
    CONSTRAINT "timeline_type_check" CHECK ((("type")::"text" = ANY (ARRAY[('semaine'::character varying)::"text", ('weekend'::character varying)::"text"])))
);


ALTER TABLE "public"."timeline" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text",
    "name" "text",
    "oidc_id" "text",
    "nom" "text",
    "prenom" "text",
    "profils" integer NOT NULL,
    "role" integer DEFAULT 0,
    "pre_op" boolean DEFAULT false,
    "ref_du_rdu" boolean DEFAULT false
);


ALTER TABLE "public"."users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."viewupdate" (
    "id" integer NOT NULL,
    "user_email" character varying(255) NOT NULL,
    "viewed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."viewupdate" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."viewupdate_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."viewupdate_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."viewupdate_id_seq" OWNED BY "public"."viewupdate"."id";



ALTER TABLE ONLY "public"."chantier_contacts_generalites" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."chantier_contacts_generalites_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."chantier_contacts_travaux" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."chantier_contacts_travaux_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."chantier_dex" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."chantier_dex_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."chantier_pages" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."chantier_pages_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."chantier_pt" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."chantier_pt_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."h00" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."h00_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."viewupdate" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."viewupdate_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."absences"
    ADD CONSTRAINT "absences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("idcategories");



ALTER TABLE ONLY "public"."chantier_contacts_autres"
    ADD CONSTRAINT "chantier_contacts_autres_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chantier_contacts_entreprises"
    ADD CONSTRAINT "chantier_contacts_entreprises_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chantier_contacts_etudes"
    ADD CONSTRAINT "chantier_contacts_etudes_chantier_id_key" UNIQUE ("chantier_id");



ALTER TABLE ONLY "public"."chantier_contacts_etudes"
    ADD CONSTRAINT "chantier_contacts_etudes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chantier_contacts_generalites"
    ADD CONSTRAINT "chantier_contacts_generalites_chantier_id_key" UNIQUE ("chantier_id");



ALTER TABLE ONLY "public"."chantier_contacts_generalites"
    ADD CONSTRAINT "chantier_contacts_generalites_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chantier_contacts_travaux"
    ADD CONSTRAINT "chantier_contacts_travaux_chantier_id_key" UNIQUE ("chantier_id");



ALTER TABLE ONLY "public"."chantier_contacts_travaux"
    ADD CONSTRAINT "chantier_contacts_travaux_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chantier_pages"
    ADD CONSTRAINT "chantier_pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chantiers"
    ADD CONSTRAINT "chantiers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."commentaires"
    ADD CONSTRAINT "commentaires_chantier_id_type_key" UNIQUE ("chantier_id", "type");



ALTER TABLE ONLY "public"."commentaires"
    ADD CONSTRAINT "commentaires_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chantier_dex"
    ADD CONSTRAINT "dex_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."h00"
    ADD CONSTRAINT "h00_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lignes"
    ADD CONSTRAINT "lignes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."photo_repertoires"
    ADD CONSTRAINT "photo_repertoires_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "photos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profil"
    ADD CONSTRAINT "profil_num_profil_key" UNIQUE ("num_profil");



ALTER TABLE ONLY "public"."profil"
    ADD CONSTRAINT "profil_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chantier_pt"
    ADD CONSTRAINT "pt_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."taches"
    ADD CONSTRAINT "taches_pkey" PRIMARY KEY ("idtaches");



ALTER TABLE ONLY "public"."timeline"
    ADD CONSTRAINT "timeline_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chantier_pages"
    ADD CONSTRAINT "unique_chantier_pages" UNIQUE ("chantier_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_unique" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_oidc_id_key" UNIQUE ("oidc_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."viewupdate"
    ADD CONSTRAINT "viewupdate_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."viewupdate"
    ADD CONSTRAINT "viewupdate_user_email_key" UNIQUE ("user_email");



CREATE INDEX "idx_absences_annee_debut" ON "public"."absences" USING "btree" ("annee_debut");



CREATE INDEX "idx_absences_type" ON "public"."absences" USING "btree" ("type");



CREATE INDEX "idx_absences_user_email" ON "public"."absences" USING "btree" ("user_email");



CREATE INDEX "idx_chantier_contacts_autres_chantier_id" ON "public"."chantier_contacts_autres" USING "btree" ("chantier_id");



CREATE INDEX "idx_chantier_contacts_entreprises_chantier_id" ON "public"."chantier_contacts_entreprises" USING "btree" ("chantier_id");



CREATE INDEX "idx_chantier_contacts_etudes_chantier_id" ON "public"."chantier_contacts_etudes" USING "btree" ("chantier_id");



CREATE INDEX "idx_chantier_contacts_generalites_chantier_id" ON "public"."chantier_contacts_generalites" USING "btree" ("chantier_id");



CREATE INDEX "idx_chantier_contacts_travaux_chantier_id" ON "public"."chantier_contacts_travaux" USING "btree" ("chantier_id");



CREATE INDEX "idx_chantier_pages_chantier_id" ON "public"."chantier_pages" USING "btree" ("chantier_id");



CREATE INDEX "idx_chantiers_compte" ON "public"."chantiers" USING "btree" ("compte");



CREATE INDEX "idx_chantiers_date_start" ON "public"."chantiers" USING "btree" ("date_start_travaux");



CREATE INDEX "idx_chantiers_etat" ON "public"."chantiers" USING "btree" ("etat");



CREATE INDEX "idx_commentaires_chantier_id" ON "public"."commentaires" USING "btree" ("chantier_id");



CREATE INDEX "idx_commentaires_chantier_type" ON "public"."commentaires" USING "btree" ("chantier_id", "type");



CREATE INDEX "idx_commentaires_type" ON "public"."commentaires" USING "btree" ("type");



CREATE INDEX "idx_dex_chantier_id" ON "public"."chantier_dex" USING "btree" ("id_chantier");



CREATE INDEX "idx_dex_indice" ON "public"."chantier_dex" USING "btree" ("indice");



CREATE INDEX "idx_h00_alerte" ON "public"."h00" USING "btree" ("alerte") WHERE ("alerte" = true);



CREATE INDEX "idx_h00_categorie_id" ON "public"."h00" USING "btree" ("categorie_id");



CREATE INDEX "idx_h00_chantier_id" ON "public"."h00" USING "btree" ("chantier_id");



CREATE INDEX "idx_h00_important" ON "public"."h00" USING "btree" ("important") WHERE ("important" = true);



CREATE INDEX "idx_h00_prevision" ON "public"."h00" USING "btree" ("prevision");



CREATE INDEX "idx_h00_status" ON "public"."h00" USING "btree" ("status");



CREATE INDEX "idx_h00_tache_id" ON "public"."h00" USING "btree" ("tache_id");



CREATE INDEX "idx_photo_repertoires_chantier_id" ON "public"."photo_repertoires" USING "btree" ("chantier_id");



CREATE INDEX "idx_photo_repertoires_created_at" ON "public"."photo_repertoires" USING "btree" ("created_at");



CREATE INDEX "idx_photos_chantier_id" ON "public"."photos" USING "btree" ("chantier_id");



CREATE INDEX "idx_photos_created_at" ON "public"."photos" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_photos_repertoire_id" ON "public"."photos" USING "btree" ("repertoire_id");



CREATE INDEX "idx_pt_chantier_id" ON "public"."chantier_pt" USING "btree" ("id_chantier");



CREATE INDEX "idx_pt_indice" ON "public"."chantier_pt" USING "btree" ("indice");



CREATE INDEX "idx_timeline_chantier_id" ON "public"."timeline" USING "btree" ("chantier_id");



CREATE INDEX "idx_timeline_date" ON "public"."timeline" USING "btree" ("annee_debut", "semaine_debut");



CREATE INDEX "idx_viewupdate_email" ON "public"."viewupdate" USING "btree" ("user_email");



CREATE OR REPLACE TRIGGER "trigger_update_absences_updated_at" BEFORE UPDATE ON "public"."absences" FOR EACH ROW EXECUTE FUNCTION "public"."update_absences_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_chantier_pages_updated_at" BEFORE UPDATE ON "public"."chantier_pages" FOR EACH ROW EXECUTE FUNCTION "public"."update_chantier_pages_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_dex_updated_at" BEFORE UPDATE ON "public"."chantier_dex" FOR EACH ROW EXECUTE FUNCTION "public"."update_etudes_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_pt_updated_at" BEFORE UPDATE ON "public"."chantier_pt" FOR EACH ROW EXECUTE FUNCTION "public"."update_etudes_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_timeline_updated_at" BEFORE UPDATE ON "public"."timeline" FOR EACH ROW EXECUTE FUNCTION "public"."update_timeline_updated_at"();



CREATE OR REPLACE TRIGGER "update_chantier_contacts_autres_updated_at" BEFORE UPDATE ON "public"."chantier_contacts_autres" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_chantier_contacts_entreprises_updated_at" BEFORE UPDATE ON "public"."chantier_contacts_entreprises" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_chantier_contacts_etudes_updated_at" BEFORE UPDATE ON "public"."chantier_contacts_etudes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_chantiers_updated_at" BEFORE UPDATE ON "public"."chantiers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_commentaires_updated_at" BEFORE UPDATE ON "public"."commentaires" FOR EACH ROW EXECUTE FUNCTION "public"."update_commentaires_updated_at"();



CREATE OR REPLACE TRIGGER "update_h00_updated_at" BEFORE UPDATE ON "public"."h00" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_photo_repertoires_updated_at" BEFORE UPDATE ON "public"."photo_repertoires" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_photos_updated_at" BEFORE UPDATE ON "public"."photos" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."absences"
    ADD CONSTRAINT "absences_user_email_fkey" FOREIGN KEY ("user_email") REFERENCES "public"."users"("email") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chantier_contacts_autres"
    ADD CONSTRAINT "chantier_contacts_autres_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "public"."chantiers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chantier_contacts_entreprises"
    ADD CONSTRAINT "chantier_contacts_entreprises_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "public"."chantiers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chantier_contacts_etudes"
    ADD CONSTRAINT "chantier_contacts_etudes_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "public"."chantiers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chantier_pages"
    ADD CONSTRAINT "chantier_pages_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "public"."chantiers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chantiers"
    ADD CONSTRAINT "chantiers_ligne_id_fkey" FOREIGN KEY ("ligne_id") REFERENCES "public"."lignes"("id");



ALTER TABLE ONLY "public"."chantier_dex"
    ADD CONSTRAINT "dex_id_chantier_fkey" FOREIGN KEY ("id_chantier") REFERENCES "public"."chantiers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chantier_contacts_generalites"
    ADD CONSTRAINT "fk_chantier_contacts_generalites_chantier" FOREIGN KEY ("chantier_id") REFERENCES "public"."chantiers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chantier_contacts_travaux"
    ADD CONSTRAINT "fk_chantier_contacts_travaux_chantier" FOREIGN KEY ("chantier_id") REFERENCES "public"."chantiers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."commentaires"
    ADD CONSTRAINT "fk_commentaires_chantier" FOREIGN KEY ("chantier_id") REFERENCES "public"."chantiers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."h00"
    ADD CONSTRAINT "fk_h00_categorie" FOREIGN KEY ("categorie_id") REFERENCES "public"."categories"("idcategories") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."h00"
    ADD CONSTRAINT "fk_h00_chantier" FOREIGN KEY ("chantier_id") REFERENCES "public"."chantiers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."h00"
    ADD CONSTRAINT "fk_h00_tache" FOREIGN KEY ("tache_id") REFERENCES "public"."taches"("idtaches") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photo_repertoires"
    ADD CONSTRAINT "fk_photo_repertoires_chantier" FOREIGN KEY ("chantier_id") REFERENCES "public"."chantiers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "fk_photos_chantier" FOREIGN KEY ("chantier_id") REFERENCES "public"."chantiers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."photos"
    ADD CONSTRAINT "fk_photos_repertoire" FOREIGN KEY ("repertoire_id") REFERENCES "public"."photo_repertoires"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chantier_pt"
    ADD CONSTRAINT "pt_id_chantier_fkey" FOREIGN KEY ("id_chantier") REFERENCES "public"."chantiers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."taches"
    ADD CONSTRAINT "taches_id_categories_fkey" FOREIGN KEY ("id_categories") REFERENCES "public"."categories"("idcategories");



ALTER TABLE ONLY "public"."timeline"
    ADD CONSTRAINT "timeline_chantier_id_fkey" FOREIGN KEY ("chantier_id") REFERENCES "public"."chantiers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_profils_fkey" FOREIGN KEY ("profils") REFERENCES "public"."profil"("num_profil");



CREATE POLICY "Users can insert their own viewupdate" ON "public"."viewupdate" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Users can read viewupdate" ON "public"."viewupdate" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "public"."absences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "absences_delete_policy" ON "public"."absences" FOR DELETE USING (true);



CREATE POLICY "absences_insert_policy" ON "public"."absences" FOR INSERT WITH CHECK (true);



CREATE POLICY "absences_select_policy" ON "public"."absences" FOR SELECT USING (true);



CREATE POLICY "absences_update_policy" ON "public"."absences" FOR UPDATE USING (true);



CREATE POLICY "all for authenticated" ON "public"."chantier_pages" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all_categories" ON "public"."categories" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all_chantier_contacts_autres" ON "public"."chantier_contacts_autres" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all_chantier_contacts_entreprises" ON "public"."chantier_contacts_entreprises" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all_chantier_contacts_etudes" ON "public"."chantier_contacts_etudes" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all_chantier_contacts_generalites" ON "public"."chantier_contacts_generalites" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all_chantier_contacts_travaux" ON "public"."chantier_contacts_travaux" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all_chantier_dex" ON "public"."chantier_dex" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all_chantier_pt" ON "public"."chantier_pt" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all_chantiers" ON "public"."chantiers" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all_h00" ON "public"."h00" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all_lignes" ON "public"."lignes" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all_photo_repertoires" ON "public"."photo_repertoires" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all_photos" ON "public"."photos" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all_profil" ON "public"."profil" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all_taches" ON "public"."taches" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all_timeline" ON "public"."timeline" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "authenticated_all_users" ON "public"."users" TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chantier_contacts_autres" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chantier_contacts_entreprises" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chantier_contacts_etudes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chantier_contacts_generalites" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chantier_contacts_travaux" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chantier_dex" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chantier_pages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chantier_pt" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chantiers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."commentaires" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "commentaires_insert_authenticated" ON "public"."commentaires" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "commentaires_select_authenticated" ON "public"."commentaires" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "commentaires_update_authenticated" ON "public"."commentaires" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."h00" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lignes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."photo_repertoires" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."photos" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profil" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."taches" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."timeline" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."viewupdate" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_absences_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_absences_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_absences_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_chantier_pages_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_chantier_pages_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_chantier_pages_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_commentaires_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_commentaires_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_commentaires_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_etudes_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_etudes_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_etudes_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_timeline_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_timeline_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_timeline_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."absences" TO "anon";
GRANT ALL ON TABLE "public"."absences" TO "authenticated";
GRANT ALL ON TABLE "public"."absences" TO "service_role";



GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."categories_idcategories_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."categories_idcategories_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."categories_idcategories_seq" TO "service_role";



GRANT ALL ON TABLE "public"."chantier_contacts_autres" TO "anon";
GRANT ALL ON TABLE "public"."chantier_contacts_autres" TO "authenticated";
GRANT ALL ON TABLE "public"."chantier_contacts_autres" TO "service_role";



GRANT ALL ON TABLE "public"."chantier_contacts_entreprises" TO "anon";
GRANT ALL ON TABLE "public"."chantier_contacts_entreprises" TO "authenticated";
GRANT ALL ON TABLE "public"."chantier_contacts_entreprises" TO "service_role";



GRANT ALL ON TABLE "public"."chantier_contacts_etudes" TO "anon";
GRANT ALL ON TABLE "public"."chantier_contacts_etudes" TO "authenticated";
GRANT ALL ON TABLE "public"."chantier_contacts_etudes" TO "service_role";



GRANT ALL ON TABLE "public"."chantier_contacts_generalites" TO "anon";
GRANT ALL ON TABLE "public"."chantier_contacts_generalites" TO "authenticated";
GRANT ALL ON TABLE "public"."chantier_contacts_generalites" TO "service_role";



GRANT ALL ON SEQUENCE "public"."chantier_contacts_generalites_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."chantier_contacts_generalites_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."chantier_contacts_generalites_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."chantier_contacts_travaux" TO "anon";
GRANT ALL ON TABLE "public"."chantier_contacts_travaux" TO "authenticated";
GRANT ALL ON TABLE "public"."chantier_contacts_travaux" TO "service_role";



GRANT ALL ON SEQUENCE "public"."chantier_contacts_travaux_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."chantier_contacts_travaux_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."chantier_contacts_travaux_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."chantier_dex" TO "anon";
GRANT ALL ON TABLE "public"."chantier_dex" TO "authenticated";
GRANT ALL ON TABLE "public"."chantier_dex" TO "service_role";



GRANT ALL ON SEQUENCE "public"."chantier_dex_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."chantier_dex_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."chantier_dex_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."chantier_pages" TO "anon";
GRANT ALL ON TABLE "public"."chantier_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."chantier_pages" TO "service_role";



GRANT ALL ON SEQUENCE "public"."chantier_pages_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."chantier_pages_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."chantier_pages_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."chantier_pt" TO "anon";
GRANT ALL ON TABLE "public"."chantier_pt" TO "authenticated";
GRANT ALL ON TABLE "public"."chantier_pt" TO "service_role";



GRANT ALL ON SEQUENCE "public"."chantier_pt_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."chantier_pt_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."chantier_pt_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."chantiers" TO "anon";
GRANT ALL ON TABLE "public"."chantiers" TO "authenticated";
GRANT ALL ON TABLE "public"."chantiers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."chantiers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."chantiers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."chantiers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."commentaires" TO "anon";
GRANT ALL ON TABLE "public"."commentaires" TO "authenticated";
GRANT ALL ON TABLE "public"."commentaires" TO "service_role";



GRANT ALL ON SEQUENCE "public"."commentaires_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."commentaires_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."commentaires_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."commentaires_id_seq1" TO "anon";
GRANT ALL ON SEQUENCE "public"."commentaires_id_seq1" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."commentaires_id_seq1" TO "service_role";



GRANT ALL ON TABLE "public"."h00" TO "anon";
GRANT ALL ON TABLE "public"."h00" TO "authenticated";
GRANT ALL ON TABLE "public"."h00" TO "service_role";



GRANT ALL ON SEQUENCE "public"."h00_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."h00_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."h00_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."lignes" TO "anon";
GRANT ALL ON TABLE "public"."lignes" TO "authenticated";
GRANT ALL ON TABLE "public"."lignes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."lignes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."lignes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."lignes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."photo_repertoires" TO "anon";
GRANT ALL ON TABLE "public"."photo_repertoires" TO "authenticated";
GRANT ALL ON TABLE "public"."photo_repertoires" TO "service_role";



GRANT ALL ON TABLE "public"."photos" TO "anon";
GRANT ALL ON TABLE "public"."photos" TO "authenticated";
GRANT ALL ON TABLE "public"."photos" TO "service_role";



GRANT ALL ON TABLE "public"."profil" TO "anon";
GRANT ALL ON TABLE "public"."profil" TO "authenticated";
GRANT ALL ON TABLE "public"."profil" TO "service_role";



GRANT ALL ON SEQUENCE "public"."profil_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."profil_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."profil_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."taches" TO "anon";
GRANT ALL ON TABLE "public"."taches" TO "authenticated";
GRANT ALL ON TABLE "public"."taches" TO "service_role";



GRANT ALL ON SEQUENCE "public"."taches_idtaches_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."taches_idtaches_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."taches_idtaches_seq" TO "service_role";



GRANT ALL ON TABLE "public"."timeline" TO "anon";
GRANT ALL ON TABLE "public"."timeline" TO "authenticated";
GRANT ALL ON TABLE "public"."timeline" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



GRANT ALL ON TABLE "public"."viewupdate" TO "anon";
GRANT ALL ON TABLE "public"."viewupdate" TO "authenticated";
GRANT ALL ON TABLE "public"."viewupdate" TO "service_role";



GRANT ALL ON SEQUENCE "public"."viewupdate_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."viewupdate_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."viewupdate_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";


  create policy "Give users authenticated access to folder 1io9m69_0"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'photos'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Give users authenticated access to folder 1io9m69_1"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'photos'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Give users authenticated access to folder 1io9m69_2"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'photos'::text) AND (auth.role() = 'authenticated'::text)));



  create policy "Give users authenticated access to folder 1io9m69_3"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'photos'::text) AND (auth.role() = 'authenticated'::text)));



