/**
 * Schema du template "Deux Colonnes"
 * 
 * Ce template affiche :
 * - Un titre principal
 * - Deux colonnes avec chacune un sous-titre et du texte
 */

import type { TemplateSchema } from '../index'

export const deuxColonnesSchema: TemplateSchema = {
  templateKey: 'deux-colonnes',
  name: 'Deux Colonnes',
  description: 'Deux colonnes de texte côte à côte',
  icon: 'lucide:columns-2',
  fields: [
    {
      key: 'titre',
      label: 'Titre principal',
      type: 'text',
      placeholder: 'Entrez le titre principal...',
      required: true,
      maxLength: 100
    },
    {
      key: 'colonne1_titre',
      label: 'Titre colonne gauche',
      type: 'text',
      placeholder: 'Titre de la colonne gauche...',
      required: false,
      maxLength: 80
    },
    {
      key: 'colonne1_texte',
      label: 'Contenu colonne gauche',
      type: 'richtext',
      placeholder: 'Contenu de la colonne gauche...',
      required: false
    },
    {
      key: 'colonne1_image',
      label: 'Image colonne gauche',
      type: 'image',
      required: false
    },
    {
      key: 'colonne2_titre',
      label: 'Titre colonne droite',
      type: 'text',
      placeholder: 'Titre de la colonne droite...',
      required: false,
      maxLength: 80
    },
    {
      key: 'colonne2_texte',
      label: 'Contenu colonne droite',
      type: 'richtext',
      placeholder: 'Contenu de la colonne droite...',
      required: false
    },
    {
      key: 'colonne2_image',
      label: 'Image colonne droite',
      type: 'image',
      required: false
    },
    {
      key: 'afficher_separateur',
      label: 'Afficher un séparateur entre les colonnes',
      type: 'checkbox',
      defaultValue: true
    }
  ]
}

// Type pour le contenu de ce template
export interface DeuxColonnesContent {
  titre: string
  colonne1_titre: string
  colonne1_texte: string
  colonne1_image: string
  colonne2_titre: string
  colonne2_texte: string
  colonne2_image: string
  afficher_separateur: boolean
}

