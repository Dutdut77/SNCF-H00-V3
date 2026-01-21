/**
 * Schema du template "Texte & Image"
 * 
 * Ce template affiche :
 * - Un titre principal
 * - Une zone de texte riche (gauche)
 * - Une image avec légende (droite)
 */

import type { TemplateSchema } from '../index'

export const texteImageSchema: TemplateSchema = {
  templateKey: 'texte-image',
  name: 'Texte & Image',
  description: 'Une zone de texte avec une image sur le côté',
  icon: 'lucide:layout-panel-left',
  fields: [
    {
      key: 'titre',
      label: 'Titre de la section',
      type: 'text',
      placeholder: 'Entrez le titre...',
      required: true,
      maxLength: 100
    },
    {
      key: 'texte',
      label: 'Contenu texte',
      type: 'richtext',
      placeholder: 'Rédigez votre contenu ici...',
      required: false,
      helpText: 'Vous pouvez utiliser la mise en forme (gras, italique, listes...)'
    },
    {
      key: 'image_url',
      label: 'Image',
      type: 'image',
      required: false,
      helpText: 'Formats acceptés : JPG, PNG, WebP (max 5 Mo)'
    },
    {
      key: 'image_legende',
      label: 'Légende de l\'image',
      type: 'text',
      placeholder: 'Description de l\'image...',
      required: false,
      maxLength: 200
    },
    {
      key: 'image_position',
      label: 'Position de l\'image',
      type: 'select',
      required: false,
      defaultValue: 'right',
      options: [
        { value: 'left', label: 'À gauche' },
        { value: 'right', label: 'À droite' }
      ]
    }
  ]
}

// Type pour le contenu de ce template
export interface TexteImageContent {
  titre: string
  texte: string
  image_url: string
  image_legende: string
  image_position: 'left' | 'right'
}

