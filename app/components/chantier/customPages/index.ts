/**
 * Registry des templates d'annexes de chantier
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
  type: 'text' | 'textarea' | 'richtext' | 'image' | 'number' | 'select' | 'checkbox' | 'images' | 'richtexts'
  placeholder?: string
  required?: boolean
  defaultValue?: unknown
  options?: TemplateFieldOption[] // Pour le type 'select'
  maxLength?: number
  helpText?: string
  maxItems?: number // Pour les types 'images' et 'richtexts'
  minItems?: number // Pour les types 'images' et 'richtexts'
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

import { paysageVerticalSchema } from './schemas/PaysageVertical.schema'
import { paysageColonnesSchema } from './schemas/PaysageColonnes.schema'
import { paysageVerticalReverseSchema } from './schemas/PaysageVerticalReverse.schema'

// Registry des templates
export const templateRegistry: Record<string, TemplateDefinition> = {

  'paysage-vertical': {
    key: 'paysage-vertical',
    name: 'Paysage Vertical',
    description: 'Format A4 paysage : titre, textes et images empilés',
    icon: 'lucide:layout-list',
    component: defineAsyncComponent(() => import('./templates/PaysageVertical.vue')),
    schema: paysageVerticalSchema
  },
  'paysage-colonnes': {
    key: 'paysage-colonnes',
    name: 'Paysage Deux Colonnes',
    description: 'Format A4 paysage : texte à gauche, images à droite',
    icon: 'lucide:columns-2',
    component: defineAsyncComponent(() => import('./templates/PaysageColonnes.vue')),
    schema: paysageColonnesSchema
  },
  'paysage-vertical-reverse': {
    key: 'paysage-vertical-reverse',
    name: 'Paysage Vertical Inversé',
    description: 'Format A4 paysage avec titre, textes et images empilés verticalement en sens inverse',
    icon: 'lucide:layout-list',
    component: defineAsyncComponent(() => import('./templates/PaysageVerticalReverse.vue')),
    schema: paysageVerticalReverseSchema
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
        case 'images':
        case 'richtexts':
          // Initialiser avec un élément vide
          content[field.key] = ['']
          break
      }
    }
  }
  
  return content
}

