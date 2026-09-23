<script setup>
// Choix d'intervenants du formulaire chantier (design V4) : pastilles avatar + nom, liste avec recherche.
// v-model : un email (multiple = false) ou un tableau d'emails.
const model = defineModel({ default: null })

const props = defineProps({
  // [{ id: email, label: 'Prénom Nom' }]
  options: { type: Array, default: () => [] },
  multiple: { type: Boolean, default: false },
  // Couleur des avatars : celle de la discipline dans le plan de charge
  tone: { type: String, default: 'bg-slate-200 text-slate-600' },
  // 'field' : champ bordé ; 'cell' : pastille ou bouton « Ajouter », pour la grille des RLT
  variant: { type: String, default: 'field' },
  placeholder: { type: String, default: 'Choisir…' },
  // Nom accessible (la grille n'a pas de libellé visible par cellule)
  label: { type: String, default: '' }
})

const open = ref(false)
const search = ref('')
watch(open, (o) => {
  if (!o) search.value = ''
})

const initiales = (label) => {
  const mots = label.split(/[\s@.]+/).filter(Boolean)
  return ((mots[0]?.[0] || '') + (mots[1]?.[0] || '')).toUpperCase() || '?'
}

const ids = computed(() => (props.multiple ? model.value || [] : model.value ? [model.value] : []))

// Une valeur absente des options (profil changé, compte supprimé) reste affichée pour pouvoir la retirer
const selection = computed(() =>
  ids.value.map((id) => {
    const option = props.options.find((o) => o.id === id)
    return option ? { ...option, inconnu: false } : { id, label: 'Contact inconnu', inconnu: true }
  })
)

// Plusieurs personnes : prénoms seuls, pour tenir sur une ligne
const prenoms = computed(() => selection.value.map((p) => (p.inconnu ? 'Inconnu' : p.label.split(' ')[0])).join(', '))

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return q ? props.options.filter((o) => o.label.toLowerCase().includes(q)) : props.options
})

const isSelected = (id) => ids.value.includes(id)

const choisir = (id) => {
  if (props.multiple) {
    model.value = isSelected(id) ? ids.value.filter((x) => x !== id) : [...ids.value, id]
  } else {
    model.value = model.value === id ? null : id
    open.value = false
  }
}

const retirer = (id) => {
  model.value = props.multiple ? ids.value.filter((x) => x !== id) : null
}
</script>

<template>
  <AppDropdownMenu v-model:open="open" full-width>
    <template #trigger>
      <!-- Toujours sur une ligne : ajouter quelqu'un ne change pas la hauteur des lignes voisines -->
      <div
        class="flex min-w-0 cursor-pointer items-center gap-1.5"
        :class="
          props.variant === 'field'
            ? [
                'dark:bg-night-900 h-10 w-full rounded-lg border bg-white pr-2 pl-1.5 text-sm transition-colors',
                open
                  ? 'border-secondary-500 ring-secondary-500/25 ring-3'
                  : 'border-slate-300 hover:border-slate-400 dark:border-white/15 dark:hover:border-white/30'
              ]
            : 'h-9'
        "
        :aria-label="props.label"
        aria-haspopup="listbox"
        :aria-expanded="open">
        <template v-if="!selection.length">
          <span v-if="props.variant === 'field'" class="text-ink-soft/70 truncate pl-1.5">
            {{ props.placeholder }}
          </span>
          <span
            v-else
            class="text-ink-soft hover:border-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300 inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-2.5 py-1 text-[13px] transition-colors dark:border-white/20">
            <Icon name="lucide:plus" size="13" />
            Ajouter
          </span>
        </template>

        <!-- Une personne : pastille à son nom -->
        <span
          v-else-if="selection.length === 1"
          class="text-ink inline-flex min-w-0 items-center gap-1.5 rounded-full border border-slate-200 bg-white py-0.5 pr-1.5 pl-0.5 text-[13px] dark:border-white/10 dark:bg-white/6"
          :title="selection[0].inconnu ? selection[0].id : selection[0].label">
          <span
            class="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
            :class="selection[0].inconnu ? 'bg-rust-100 text-rust-700' : props.tone">
            {{ selection[0].inconnu ? '?' : initiales(selection[0].label) }}
          </span>
          <span class="truncate">{{ selection[0].label }}</span>
          <button
            type="button"
            class="text-ink-soft hover:text-rust-700 dark:hover:text-rust-300 flex size-4.5 shrink-0 cursor-pointer items-center justify-center rounded-full"
            :aria-label="`Retirer ${selection[0].label}`"
            @click.stop="retirer(selection[0].id)">
            <Icon name="lucide:x" size="12" />
          </button>
        </span>

        <!-- Plusieurs : avatars superposés et prénoms ; noms complets en infobulle, retrait dans la liste -->
        <span v-else class="flex min-w-0 items-center gap-2" :title="selection.map((p) => p.label).join(', ')">
          <span class="flex shrink-0 -space-x-1.5">
            <span
              v-for="p in selection"
              :key="p.id"
              class="ring-card flex size-6 items-center justify-center rounded-full text-[10px] font-bold ring-2"
              :class="p.inconnu ? 'bg-rust-100 text-rust-700' : props.tone">
              {{ p.inconnu ? '?' : initiales(p.label) }}
            </span>
          </span>
          <span class="text-ink truncate text-[13px]">{{ prenoms }}</span>
        </span>

        <span
          v-if="props.variant === 'cell' && props.multiple && selection.length"
          class="text-ink-soft hover:border-secondary-500 hover:text-secondary-700 dark:hover:text-secondary-300 flex size-7 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 transition-colors dark:border-white/20"
          title="Ajouter">
          <Icon name="lucide:plus" size="13" />
        </span>
        <Icon
          v-if="props.variant === 'field'"
          name="lucide:chevron-down"
          size="16"
          class="text-ink-soft ml-auto shrink-0 transition-transform"
          :class="{ 'rotate-180': open }" />
      </div>
    </template>

    <div class="w-64" role="listbox" :aria-multiselectable="props.multiple">
      <div v-if="props.options.length > 6" class="relative mb-1.5">
        <Icon name="lucide:search" size="15" class="text-ink-soft absolute top-1/2 left-2.5 -translate-y-1/2" />
        <input
          v-model="search"
          type="text"
          placeholder="Rechercher…"
          class="text-ink placeholder:text-ink-soft/60 focus:border-secondary-500 dark:bg-night-900 w-full rounded-md border border-slate-300 bg-white py-1.5 pr-2.5 pl-8 text-sm focus:outline-none dark:border-white/15"
          @click.stop />
      </div>
      <div class="max-h-64 overflow-y-auto">
        <button
          v-for="o in filtered"
          :key="o.id"
          type="button"
          role="option"
          :aria-selected="isSelected(o.id)"
          class="text-ink hover:bg-petrol-50 flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm transition-colors dark:hover:bg-white/6"
          @click="choisir(o.id)">
          <span
            class="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
            :class="props.tone">
            {{ initiales(o.label) }}
          </span>
          <span class="min-w-0 flex-1 truncate">{{ o.label }}</span>
          <Icon
            v-if="isSelected(o.id)"
            name="lucide:check"
            size="16"
            class="text-secondary-600 dark:text-secondary-300" />
        </button>
        <p v-if="!filtered.length" class="text-ink-soft px-2 py-3 text-sm">
          {{ props.options.length ? 'Aucun résultat.' : 'Aucun profil disponible.' }}
        </p>
      </div>
    </div>
  </AppDropdownMenu>
</template>
