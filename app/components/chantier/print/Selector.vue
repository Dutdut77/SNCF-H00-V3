<script setup>
// Composant de sélection et ordonnancement des sections à imprimer
const isOpen = defineModel('isOpen', { type: Boolean, default: false })

const props = defineProps({
  chantierId: {
    type: [String, Number],
    required: true
  },
  customPages: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close'])

// Sections de base disponibles pour l'impression
const baseSections = [
  {
    id: 'generalites',
    label: 'Généralités',
    description: 'Période des travaux, informations générales, comptes',
    icon: 'lucide:info'
  },
  {
    id: 'contacts',
    label: 'Contacts',
    description: 'Tous les contacts du chantier',
    icon: 'lucide:users'
  },
  {
    id: 'timeline',
    label: 'Timeline',
    description: 'Planning des interventions',
    icon: 'lucide:git-branch'
  },
  {
    id: 'etudes',
    label: 'Études',
    description: "Documents d'exécution et plans techniques",
    icon: 'lucide:graduation-cap'
  },
  {
    id: 'commentaires',
    label: 'Commentaires',
    description: 'Tous les commentaires du chantier',
    icon: 'lucide:message-square'
  },
  {
    id: 'logistique',
    label: 'Logistique',
    description: 'Base vie, imprimante, réseau et radio',
    icon: 'lucide:package'
  }
]

// Liste des sections avec leur état de sélection et ordre
const sections = ref([])

// Initialiser les sections quand le modal s'ouvre
watch(
  isOpen,
  (open) => {
    if (open) {
      initializeSections()
    }
  },
  { immediate: true }
)

// Initialiser les sections avec les pages personnalisées
const initializeSections = () => {
  const allSections = [
    ...baseSections.map((s) => ({ ...s, selected: true, isCustomPage: false }))
  ]

  // Ajouter les pages personnalisées
  if (props.customPages && props.customPages.length > 0) {
    props.customPages.forEach((page) => {
      allSections.push({
        id: `custom-${page.id}`,
        label: page.navBarTitle || page.name || 'Page sans nom',
        description: `Page personnalisée - ${page.template_key || page.template || 'Template'}`,
        icon: 'lucide:file-text',
        selected: true,
        isCustomPage: true,
        pageData: page
      })
    })
  }

  sections.value = allSections
}

// Drag & Drop
const draggedItem = ref(null)
const dragOverItem = ref(null)

const handleDragStart = (e, index) => {
  draggedItem.value = index
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/html', e.target.outerHTML)
  // Ajouter une classe pour le style pendant le drag
  e.target.classList.add('opacity-50')
}

const handleDragEnd = (e) => {
  e.target.classList.remove('opacity-50')
  draggedItem.value = null
  dragOverItem.value = null
}

const handleDragOver = (e, index) => {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  dragOverItem.value = index
}

const handleDragLeave = () => {
  dragOverItem.value = null
}

const handleDrop = (e, dropIndex) => {
  e.preventDefault()

  if (draggedItem.value === null || draggedItem.value === dropIndex) {
    dragOverItem.value = null
    return
  }

  const newSections = [...sections.value]
  const [draggedSection] = newSections.splice(draggedItem.value, 1)
  newSections.splice(dropIndex, 0, draggedSection)

  sections.value = newSections
  draggedItem.value = null
  dragOverItem.value = null
}

// Toggle sélection d'une section
const toggleSection = (index) => {
  sections.value[index].selected = !sections.value[index].selected
}

// Sélectionner/Désélectionner tout
const selectAll = () => {
  sections.value.forEach((s) => (s.selected = true))
}

const deselectAll = () => {
  sections.value.forEach((s) => (s.selected = false))
}

// Nombre de sections sélectionnées
const selectedCount = computed(() => sections.value.filter((s) => s.selected).length)

// Sections sélectionnées dans l'ordre
const selectedSections = computed(() => sections.value.filter((s) => s.selected))

// Lancer l'impression - sauvegarde les sections et ouvre une nouvelle page
const handlePrint = () => {
  if (selectedCount.value === 0) return
  
  // Sauvegarder les sections sélectionnées dans le localStorage
  const printConfig = {
    sections: selectedSections.value.map(s => ({
      id: s.id,
      label: s.label,
      isCustomPage: s.isCustomPage,
      pageData: s.pageData || null
    }))
  }
  localStorage.setItem('h00-print-config', JSON.stringify(printConfig))
  
  // Ouvrir la page d'impression dans un nouvel onglet
  const printUrl = `/chantiers/print/${props.chantierId}`
  window.open(printUrl, '_blank')
  
  // Fermer le modal
  isOpen.value = false
  emit('close')
}

// Fermer le modal
const handleClose = () => {
  emit('close')
}
</script>

<template>
  <AppModal v-model="isOpen" size="2xl" @close="handleClose">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 flex h-10 w-10 items-center justify-center rounded-xl">
          <Icon name="lucide:printer" size="20" />
        </div>
        <div>
          <h2 class="text-lg font-bold text-gray-800 dark:text-white">Configuration de l'impression</h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Sélectionnez et réordonnez les sections à imprimer
          </p>
        </div>
      </div>
    </template>

    <template #default>
      <div class="space-y-4">
        <!-- Actions rapides -->
        <div class="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-300">
            {{ selectedCount }} / {{ sections.length }} sections sélectionnées
          </span>
          <div class="flex gap-2">
            <button
              type="button"
              class="rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600"
              @click="selectAll">
              Tout sélectionner
            </button>
            <button
              type="button"
              class="rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600"
              @click="deselectAll">
              Tout désélectionner
            </button>
          </div>
        </div>

        <!-- Instruction drag & drop -->
        <p class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Icon name="lucide:grip-vertical" size="14" />
          Glissez-déposez pour réordonner les sections
        </p>

        <!-- Liste des sections -->
        <div class="space-y-2">
          <div
            v-for="(section, index) in sections"
            :key="section.id"
            :draggable="true"
            class="group relative flex cursor-move items-center gap-3 rounded-lg border p-3 transition-all duration-200"
            :class="[
              section.selected
                ? 'border-primary-300 bg-primary-50 dark:border-primary-700 dark:bg-primary-900/20'
                : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500',
              dragOverItem === index && draggedItem !== index
                ? 'ring-2 ring-primary-400 ring-offset-2 dark:ring-offset-gray-900'
                : ''
            ]"
            @dragstart="handleDragStart($event, index)"
            @dragend="handleDragEnd"
            @dragover="handleDragOver($event, index)"
            @dragleave="handleDragLeave"
            @drop="handleDrop($event, index)">
            <!-- Poignée de drag -->
            <div class="flex h-8 w-6 shrink-0 items-center justify-center text-gray-400 dark:text-gray-500">
              <Icon name="lucide:grip-vertical" size="16" />
            </div>

            <!-- Checkbox -->
            <button
              type="button"
              class="flex h-5 w-5 shrink-0 items-center justify-center rounded border transition"
              :class="
                section.selected
                  ? 'border-primary-500 bg-primary-500 text-white'
                  : 'border-gray-300 bg-white hover:border-gray-400 dark:border-gray-500 dark:bg-gray-700'
              "
              @click.stop="toggleSection(index)">
              <Icon v-if="section.selected" name="lucide:check" size="14" />
            </button>

            <!-- Icône de la section -->
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              :class="
                section.selected
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-800/50 dark:text-primary-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              ">
              <Icon :name="section.icon" size="18" />
            </div>

            <!-- Infos de la section -->
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span
                  class="font-medium"
                  :class="section.selected ? 'text-gray-800 dark:text-white' : 'text-gray-600 dark:text-gray-300'">
                  {{ section.label }}
                </span>
                <span
                  v-if="section.isCustomPage"
                  class="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                  Page perso
                </span>
              </div>
              <p class="truncate text-xs text-gray-500 dark:text-gray-400">
                {{ section.description }}
              </p>
            </div>

            <!-- Numéro d'ordre -->
            <div
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              :class="
                section.selected
                  ? 'bg-primary-200 text-primary-700 dark:bg-primary-700 dark:text-primary-200'
                  : 'bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400'
              ">
              {{ index + 1 }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-between gap-3 pt-2">
        <p class="text-xs text-gray-500 dark:text-gray-400">
          L'impression s'ouvrira dans une nouvelle fenêtre
        </p>
        <div class="flex gap-3">
          <AppButtonValidated theme="cancel" type="button" @click="handleClose">
            <template #default>Annuler</template>
          </AppButtonValidated>
          <AppButtonValidated
            theme="primary"
            type="button"
            :validated="selectedCount > 0"
            @click="handlePrint">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:printer" size="16" />
                Imprimer ({{ selectedCount }})
              </span>
            </template>
          </AppButtonValidated>
        </div>
      </div>
    </template>
  </AppModal>
</template>

