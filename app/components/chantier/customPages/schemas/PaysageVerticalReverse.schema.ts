/**
 * Schema du template "Paysage Vertical Inversé"
 * 
 * Ce template affiche en format A4 paysage :
 * - Un titre principal
 * - Une zone de textes riches (plusieurs en flex)
 * - Une zone d'images (plusieurs en flex-1)
 */

import type { TemplateSchema } from '../index'

export const paysageVerticalReverseSchema: TemplateSchema = {
  templateKey: 'paysage-vertical-reverse',
  name: 'Paysage Vertical Inversé',
  description: 'Format A4 paysage avec titre, textes et images empilés verticalement en sens inverse',
  icon: 'lucide:layout-list',
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
      label: 'Contenus texte',
      type: 'richtexts',
      placeholder: 'Rédigez votre contenu ici...',
      required: false,
      helpText: 'Ajoutez plusieurs blocs de texte qui s\'afficheront côte à côte',
      minItems: 1,
      maxItems: 4
    },
    {
      key: 'images',
      label: 'Images',
      type: 'images',
      required: false,
      helpText: 'Ajoutez plusieurs images qui s\'afficheront côte à côte (max 6)',
      minItems: 1,
      maxItems: 6
    }
  ]
}

// Type pour le contenu de ce template
export interface PaysageVerticalContent {
  titre: string
  textes: string[]
  images: string[]
}

