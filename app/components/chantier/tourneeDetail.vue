<script setup>
const props = defineProps({
  tournee: { type: Object, required: true }
})

const model = defineModel({ type: Boolean, default: false })
const emit = defineEmits(['close', 'deleted'])

const { getTourneeNotes, getTourneePhotos, deleteNote, deleteTournee, getSignedPhotoUrl } = useTournees()

const photoUrls = ref({})

const notes = ref([])
const photos = ref([])
const loading = ref(true)
const showDeleteConfirm = ref(false)
const deleting = ref(false)

// Fil chronologique fusionné
const timeline = computed(() => {
  const items = [
    ...notes.value.map((n) => ({ ...n, _kind: 'note' })),
    ...photos.value.map((p) => ({ ...p, _kind: 'photo' }))
  ]
  return items.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
})

onMounted(async () => {
  const [notesRes, photosRes] = await Promise.all([
    getTourneeNotes(props.tournee.id),
    getTourneePhotos(props.tournee.id)
  ])
  notes.value = notesRes.data
  photos.value = photosRes.data
  await Promise.all(
    photos.value
      .filter((p) => p.chemin_storage)
      .map(async (p) => {
        const url = await getSignedPhotoUrl(p.chemin_storage)
        if (url) photoUrls.value[p.id] = url
      })
  )
  loading.value = false
})

const formatDate = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const formatTime = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// Durée estimée
const duree = computed(() => {
  if (timeline.value.length < 2) return null
  const first = new Date(timeline.value[0].created_at)
  const last = new Date(timeline.value[timeline.value.length - 1].created_at)
  const diff = Math.round((last - first) / 60000)
  if (diff < 1) return null
  if (diff < 60) return `${diff} min`
  return `${Math.floor(diff / 60)}h${String(diff % 60).padStart(2, '0')}`
})

const onDeleteNote = async (noteId) => {
  await deleteNote(noteId)
  notes.value = notes.value.filter((n) => n.id !== noteId)
}

const onDeletePhoto = async (photo) => {
  const client = useSupabaseClient()
  await client.storage.from('photos').remove([photo.chemin_storage])
  await client.from('photos').delete().eq('id', photo.id)
  photos.value = photos.value.filter((p) => p.id !== photo.id)
}

const doDelete = async () => {
  deleting.value = true
  await deleteTournee(props.tournee.id)
  deleting.value = false
  showDeleteConfirm.value = false
  model.value = false
  emit('deleted')
}

const close = () => {
  model.value = false
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-full"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-full">
      <div v-if="model" class="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-900">

        <!-- Header -->
        <div class="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
          <button
            type="button"
            class="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-700"
            @click="close">
            <Icon name="lucide:arrow-left" size="20" />
          </button>
          <div class="flex-1 min-w-0">
            <h2 class="truncate text-base font-semibold text-gray-800 dark:text-white">
              {{ tournee.titre || 'Tournée du ' + formatDate(tournee.created_at) }}
            </h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatDate(tournee.created_at) }}
              <span v-if="duree"> · {{ duree }}</span>
              · {{ tournee.created_by }}
            </p>
          </div>
          <button
            type="button"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
            @click="showDeleteConfirm = true">
            <Icon name="lucide:trash-2" size="17" />
          </button>
        </div>

        <!-- Contenu -->
        <div class="flex-1 overflow-y-auto px-4 py-4">
          <!-- Chargement -->
          <div v-if="loading" class="flex items-center justify-center py-16">
            <Icon name="lucide:loader-2" size="32" class="animate-spin text-blue-500" />
          </div>

          <!-- Vide -->
          <div v-else-if="timeline.length === 0" class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
            <Icon name="lucide:file-text" size="40" class="mb-3 opacity-40" />
            <p class="text-sm font-medium">Aucune note dans cette tournée</p>
          </div>

          <!-- Fil -->
          <div v-else class="space-y-3">
            <template v-for="item in timeline" :key="item._kind + item.id">
              <!-- Note -->
              <div v-if="item._kind === 'note'" class="flex items-start gap-3">
                <div
                  class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                  :class="item.type === 'voix' ? 'bg-blue-100 dark:bg-blue-900/40' : 'bg-gray-100 dark:bg-gray-700'">
                  <Icon
                    :name="item.type === 'voix' ? 'lucide:mic' : 'lucide:type'"
                    size="13"
                    :class="item.type === 'voix' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="rounded-xl bg-white p-3 shadow-sm dark:bg-gray-800">
                    <p class="text-sm text-gray-800 dark:text-white">{{ item.content }}</p>
                  </div>
                  <p class="mt-1 text-xs text-gray-400">{{ formatTime(item.created_at) }}</p>
                </div>
                <button
                  type="button"
                  class="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-300 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  @click="onDeleteNote(item.id)">
                  <Icon name="lucide:trash-2" size="13" />
                </button>
              </div>

              <!-- Photo -->
              <div v-else-if="item._kind === 'photo'" class="flex items-start gap-3">
                <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                  <Icon name="lucide:image" size="13" class="text-amber-600 dark:text-amber-400" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="overflow-hidden rounded-xl shadow-sm">
                    <img
                      :src="photoUrls[item.id]"
                      :alt="item.nom_fichier"
                      class="max-h-72 w-full object-cover" />
                  </div>
                  <p class="mt-1 text-xs text-gray-400">{{ formatTime(item.created_at) }}</p>
                </div>
                <button
                  type="button"
                  class="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-300 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  @click="onDeletePhoto(item)">
                  <Icon name="lucide:trash-2" size="13" />
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Confirmation suppression -->
    <AppModal v-model="showDeleteConfirm" size="sm">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Supprimer la tournée ?</h3>
      </template>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Toutes les notes seront supprimées. Les photos seront déliées mais resteront dans le stockage.
        Cette action est irréversible.
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            @click="showDeleteConfirm = false">
            Annuler
          </button>
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
            :disabled="deleting"
            @click="doDelete">
            <Icon v-if="deleting" name="lucide:loader-2" size="14" class="animate-spin" />
            Supprimer
          </button>
        </div>
      </template>
    </AppModal>
  </Teleport>
</template>
