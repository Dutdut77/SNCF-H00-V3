/**
 * Schema du template "Paysage Deux Colonnes"
 * 
 * Ce template affiche en format A4 paysage :
 * - Partie gauche : Titre + Texte riche
 * - Partie droite : Une ou plusieurs images
 */

import type { TemplateSchema } from '../index'

export const paysageColonnesSchema: TemplateSchema = {
  templateKey: 'paysage-colonnes',
  name: 'Paysage Deux Colonnes',
  description: 'Format A4 paysage avec texte à gauche et images à droite',
  icon: 'lucide:columns-2',
  fields: [
    {
      key: 'titre',
      label: 'Titre principal',
      type: 'text',
      placeholder: 'Entrez le titre de la page...',
      required: true,
      maxLength: 150
    },
    {
      key: 'textes',
      label: 'Contenu texte',
      type: 'richtexts',
      placeholder: 'Rédigez votre contenu ici...',
      required: false,
      helpText: 'Ce texte apparaîtra dans la colonne de gauche, sous le titre',
      minItems: 1,
      maxItems: 4
    },
    {
      key: 'images',
      label: 'Images',
      type: 'images',
      required: false,
      helpText: 'Ajoutez une ou plusieurs images qui s\'afficheront dans la colonne de droite (max 4)',
      minItems: 1,
      maxItems: 4
    }
  ]
}

// Type pour le contenu de ce template
export interface PaysageColonnesContent {
  titre: string
  textes: string[]
  images: string[]
}

