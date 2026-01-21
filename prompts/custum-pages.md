Agis comme un lead developer senior spécialisé en Nuxt 4, Vue 3, TailwindCSS 4 et Supabase.

Objectif : Implémenter un module d'ajout de pages personnalisable pour les chantiers, basé sur les spécifications suivantes.

Contexte technique :

- Framework : Nuxt 4 (Vue 3, script setup)
- Styling : TailwindCSS V4
- Backend : Supabase (Postgres + Storage)

Contraintes architecturales :

- Un seul enregistrement Supabase par chantier
- Table `chantier_pages` avec :
- chantier_id
- content (jsonb)
- Le champ `content` est un ARRAY de pages
- Chaque page contient :
- id
- template_key
- navBarTitle (string)
- content (JSON spécifique au template)

Templates :

- Les templates sont des components Vue pré-mis en forme avec Tailwind
- Un template = un component Vue
- Un template peut être utilisé par plusieurs pages
- Un template peut avoir plusieurs zones de textes et plusieurs zones d'images.
- Chaque template possède un fichier `*.schema.ts` décrivant les champs éditables
- Aucun HTML ni style stocké en base

Fonctionnalités à implémenter :

1. Premettre au component LeftNavBar la possibilité d'ajouter des pages personnalisées (onglets) pour les chantiers.
2. Mapping `template_key` → component Vue
3. Système de schemas permettant de générer automatiquement les formulaires d’édition
4. Ajout / édition / suppression de pages dans le document
5. Gestion des images via Supabase Storage (URL uniquement en base)

Attendus du code :

- Structure de dossiers claire
- Components Vue propres et découplés
- Exemples concrets de :
- template Vue (x2)
- schema associé
- renderer global
- logique de sauvegarde Supabase (via composable)

Contraintes supplémentaires :

- Code maintenable et évolutif
- Pas de logique métier dans les templates

Commence par proposer la structure du projet, puis implémente les éléments clés avec du code commenté.
