<script setup>
import { computed } from 'vue'

const props = defineProps({
  nom: { type: String, default: '' },
  prenom: { type: String, default: '' },
  color: { type: String, default: 'bg-sky-500' }, // <<< couleur passée par props
  size: { type: String, default: 'md' }, // sm | md | lg
  rounded: { type: Boolean, default: true }
})

const SIZE_MAP = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-14 w-14 text-xl',
  xl: 'h-16 w-16 text-2xl',
  xxl: 'h-20 w-20 text-3xl'
}

function makeInitials(nom = '', prenom = '') {
  nom = nom.trim()
  prenom = prenom.trim()

  if (prenom && nom) return (prenom[0] + nom[0]).toUpperCase()

  const full = (prenom + ' ' + nom).trim()
  if (!full) return '?'

  return full.slice(0, 2).toUpperCase()
}

const initials = computed(() => makeInitials(props.nom, props.prenom))
const sizeClass = computed(() => SIZE_MAP[props.size] || SIZE_MAP.md)
const shapeClass = computed(() => (props.rounded ? 'rounded-full' : 'rounded'))
</script>

<template>
  <div
    :class="[
      props.color, // <<< couleur choisie
      sizeClass,
      shapeClass,
      'flex items-center justify-center font-medium shadow-sm select-none'
    ]">
    {{ initials }}
  </div>
</template>
