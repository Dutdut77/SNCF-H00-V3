/**
 * Registry des templates de pages personnalisées
 * 
 * Ce fichier centralise :
 * - La liste des templates disponibles
 * - Le mapping template_key → component Vue
 * - Les métadonnées des templates (nom, description, icône)
 */

import { defineAsyncComponent, type Component } from 'vue'

// Types
export interface TemplateFieldOption {
  value: string
  label: string
}

export interface TemplateField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'richtext' | 'image' | 'number' | 'select' | 'checkbox'
  placeholder?: string
  required?: boolean
  defaultValue?: unknown
  options?: TemplateFieldOption[] // Pour le type 'select'
  maxLength?: number
  helpText?: string
}

export interface TemplateSchema {
  templateKey: string
  name: string
  description: string
  icon: string
  fields: TemplateField[]
}

export interface TemplateDefinition {
  key: string
  name: string
  description: string
  icon: string
  component: Component
  schema: TemplateSchema
}

// Import des schemas
import { texteImageSchema } from './schemas/TexteImage.schema'
import { deuxColonnesSchema } from './schemas/DeuxColonnes.schema'

// Registry des templates
export const templateRegistry: Record<string, TemplateDefinition> = {
  'texte-image': {
    key: 'texte-image',
    name: 'Texte & Image',
    description: 'Une zone de texte avec une image sur le côté',
    icon: 'lucide:layout-panel-left',
    component: defineAsyncComponent(() => import('./templates/TexteImage.vue')),
    schema: texteImageSchema
  },
  'deux-colonnes': {
    key: 'deux-colonnes',
    name: 'Deux Colonnes',
    description: 'Deux colonnes de texte côte à côte',
    icon: 'lucide:columns-2',
    component: defineAsyncComponent(() => import('./templates/DeuxColonnes.vue')),
    schema: deuxColonnesSchema
  }
}

/**
 * Récupère un template par sa clé
 */
export const getTemplate = (templateKey: string): TemplateDefinition | undefined => {
  return templateRegistry[templateKey]
}

/**
 * Récupère le component Vue d'un template
 */
export const getTemplateComponent = (templateKey: string): Component | undefined => {
  return templateRegistry[templateKey]?.component
}

/**
 * Récupère le schema d'un template
 */
export const getTemplateSchema = (templateKey: string): TemplateSchema | undefined => {
  return templateRegistry[templateKey]?.schema
}

/**
 * Liste tous les templates disponibles (pour le sélecteur)
 */
export const getAvailableTemplates = (): TemplateDefinition[] => {
  return Object.values(templateRegistry)
}

/**
 * Génère un contenu vide basé sur le schema d'un template
 */
export const getDefaultContent = (templateKey: string): Record<string, unknown> => {
  const schema = getTemplateSchema(templateKey)
  if (!schema) return {}
  
  const content: Record<string, unknown> = {}
  
  for (const field of schema.fields) {
    if (field.defaultValue !== undefined) {
      content[field.key] = field.defaultValue
    } else {
      // Valeurs par défaut selon le type
      switch (field.type) {
        case 'text':
        case 'textarea':
        case 'richtext':
        case 'image':
          content[field.key] = ''
          break
        case 'number':
          content[field.key] = 0
          break
        case 'checkbox':
          content[field.key] = false
          break
        case 'select':
          content[field.key] = field.options?.[0]?.value || ''
          break
      }
    }
  }
  
  return content
}

