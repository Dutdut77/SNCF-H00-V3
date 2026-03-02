<script setup>
const props = defineProps({
  chantier: { type: Object, required: true },
  tourneeInitiale: { type: Object, default: null }
})

const model = defineModel({ type: Boolean, default: false })
const emit = defineEmits(['terminee'])

const {
  createTournee,
  terminerTournee,
  updateTourneeTitre,
  getTourneeNotes,
  addNote,
  updateNote,
  deleteNote,
  uploadTourneePhoto,
  getTourneePhotos,
  getSignedPhotoUrl
} = useTournees()
const user = useAuthUser()
const { addToast } = useToast()

// État de la tournée
const tournee = ref(props.tourneeInitiale)
const notes = ref([])
const photos = ref([])
const titreTmp = ref('')
const editingTitre = ref(false)
const initializing = ref(true)
const terminating = ref(false)
const showConfirmTerminer = ref(false)

// Entrée texte
const showTextInput = ref(false)
const textInput = ref('')
const savingText = ref(false)

// Voix
const isListening = ref(false)
const interimText = ref('')
const speechSupported = ref(false)
let recognition = null

// Upload photo
const photoInputRef = ref(null)
const uploadingPhoto = ref(false)

// Cache des URLs signées
const photoUrls = ref({})

// Fil chronologique fusionné (notes + photos triées par date)
const timeline = computed(() => {
  const items = [
    ...notes.value.map((n) => ({ ...n, _kind: 'note' })),
    ...photos.value.map((p) => ({ ...p, _kind: 'photo' }))
  ]
  return items.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
})

// Scroll automatique vers le bas
const feedRef = ref(null)
const scrollToBottom = () => {
  nextTick(() => {
    if (feedRef.value) {
      feedRef.value.scrollTop = feedRef.value.scrollHeight
    }
  })
}

// Initialisation
onMounted(async () => {
  // Vérifier le support Speech API
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  speechSupported.value = !!SpeechRecognition

  if (props.tourneeInitiale) {
    tournee.value = props.tourneeInitiale
    titreTmp.value = props.tourneeInitiale.titre || ''
    await refreshData()
  } else {
    // Créer une nouvelle tournée
    const userEmail = user.value?.email || 'inconnu'
    const { data, error } = await createTournee(props.chantier.id, userEmail)
    if (error) {
      model.value = false
      return
    }
    tournee.value = data
    titreTmp.value = ''
  }
  initializing.value = false
  scrollToBottom()
})

onUnmounted(() => {
  stopListening()
})

const loadSignedUrls = async (photoList) => {
  const toLoad = photoList.filter((p) => p.chemin_storage && !photoUrls.value[p.id])
  await Promise.all(
    toLoad.map(async (p) => {
      const url = await getSignedPhotoUrl(p.chemin_storage)
      if (url) photoUrls.value[p.id] = url
    })
  )
}

const refreshData = async () => {
  if (!tournee.value) return
  const [notesRes, photosRes] = await Promise.all([
    getTourneeNotes(tournee.value.id),
    getTourneePhotos(tournee.value.id)
  ])
  notes.value = notesRes.data
  photos.value = photosRes.data
  await loadSignedUrls(photos.value)
  scrollToBottom()
}

// --- Titre ---
const saveTitre = async () => {
  if (!tournee.value) return
  editingTitre.value = false
  await updateTourneeTitre(tournee.value.id, titreTmp.value.trim() || null)
}

// --- Note texte ---
const submitText = async () => {
  const content = textInput.value.trim()
  if (!content || !tournee.value) return
  savingText.value = true
  const { data } = await addNote(tournee.value.id, content, 'texte')
  if (data) {
    notes.value.push(data)
    scrollToBottom()
  }
  textInput.value = ''
  showTextInput.value = false
  savingText.value = false
}

const onTextKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submitText()
  }
  if (e.key === 'Escape') {
    showTextInput.value = false
    textInput.value = ''
  }
}

// --- Édition note ---
const editingNoteId = ref(null)
const editingNoteContent = ref('')

const startEditNote = (note) => {
  editingNoteId.value = note.id
  editingNoteContent.value = note.content
}

const cancelEditNote = () => {
  editingNoteId.value = null
  editingNoteContent.value = ''
}

const saveEditNote = async (noteId) => {
  const content = editingNoteContent.value.trim()
  if (!content) return
  const { data } = await updateNote(noteId, content)
  if (data) {
    const idx = notes.value.findIndex((n) => n.id === noteId)
    if (idx !== -1) notes.value[idx] = { ...notes.value[idx], content: data.content }
  }
  cancelEditNote()
}

const onEditKeydown = (e, noteId) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEditNote(noteId) }
  if (e.key === 'Escape') cancelEditNote()
}

// --- Suppression note ---
const onDeleteNote = async (noteId) => {
  await deleteNote(noteId)
  notes.value = notes.value.filter((n) => n.id !== noteId)
}

// --- Suppression photo ---
const onDeletePhoto = async (photo) => {
  const client = useSupabaseClient()
  await client.storage.from('photos').remove([photo.chemin_storage])
  await client.from('photos').delete().eq('id', photo.id)
  photos.value = photos.value.filter((p) => p.id !== photo.id)
}

// --- Speech Recognition ---
const initRecognition = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) return null

  const r = new SpeechRecognition()
  r.lang = 'fr-FR'
  r.continuous = true
  r.interimResults = true

  let finalBuffer = ''
  let silenceTimer = null

  r.onresult = (event) => {
    let interim = ''
    let newFinal = ''

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript
      if (event.results[i].isFinal) {
        newFinal += transcript
      } else {
        interim += transcript
      }
    }

    if (newFinal) {
      finalBuffer += (finalBuffer ? ' ' : '') + newFinal.trim()
    }
    interimText.value = interim

    // Auto-save après 2s de silence
    if (silenceTimer) clearTimeout(silenceTimer)
    silenceTimer = setTimeout(async () => {
      if (finalBuffer.trim()) {
        await saveVoiceNote(finalBuffer.trim())
        finalBuffer = ''
        interimText.value = ''
      }
    }, 2000)
  }

  r.onend = async () => {
    if (isListening.value) {
      // Sauvegarder ce qui reste dans le buffer
      if (finalBuffer.trim()) {
        await saveVoiceNote(finalBuffer.trim())
        finalBuffer = ''
        interimText.value = ''
      }
      isListening.value = false
    }
  }

  r.onerror = (event) => {
    console.error('Speech error:', event.error)
    isListening.value = false
    interimText.value = ''
    if (event.error !== 'aborted') {
      addToast({ title: 'Micro', message: 'Erreur de reconnaissance vocale', type: 'Error' })
    }
  }

  return r
}

const saveVoiceNote = async (content) => {
  if (!content || !tournee.value) return
  const { data } = await addNote(tournee.value.id, content, 'voix')
  if (data) {
    notes.value.push(data)
    scrollToBottom()
  }
}

const toggleListening = () => {
  if (isListening.value) {
    stopListening()
  } else {
    startListening()
  }
}

const startListening = () => {
  if (!speechSupported.value) {
    addToast({ title: 'Non supporté', message: 'La reconnaissance vocale n\'est pas disponible sur ce navigateur. Utilisez Chrome ou Safari iOS 14.1+.', type: 'Error' })
    return
  }
  recognition = initRecognition()
  if (!recognition) return
  recognition.start()
  isListening.value = true
  showTextInput.value = false
  interimText.value = ''
}

const stopListening = () => {
  if (recognition) {
    recognition.stop()
    recognition = null
  }
  isListening.value = false
}

// --- Photo ---
const triggerPhotoInput = () => {
  photoInputRef.value?.click()
}

// Conversion WebP avec contrainte sur les deux dimensions
const resizeImage = async (file) => {
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      const url = URL.createObjectURL(file)
      i.onload = () => { URL.revokeObjectURL(url); resolve(i) }
      i.onerror = () => { URL.revokeObjectURL(url); reject() }
      i.src = url
    })
    const MAX_WIDTH = 1600
    const MAX_HEIGHT = 1200
    // Ratio "fit dans la boîte" — contraint les deux dimensions, ne dépasse jamais 1
    const ratio = Math.min(MAX_WIDTH / img.width, MAX_HEIGHT / img.height, 1)
    const width = Math.round(img.width * ratio)
    const height = Math.round(img.height * ratio)
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    canvas.getContext('2d').drawImage(img, 0, 0, width, height)
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', { type: 'image/webp' }))
          else resolve(file)
        },
        'image/webp',
        0.72
      )
    })
  } catch {
    return file
  }
}

const uploadCount = ref(0)
const uploadTotal = ref(0)

const onPhotoSelected = async (event) => {
  const files = Array.from(event.target.files || [])
  if (!files.length || !tournee.value) return
  uploadingPhoto.value = true
  uploadCount.value = 0
  uploadTotal.value = files.length
  for (const file of files) {
    const resized = await resizeImage(file)
    const { data } = await uploadTourneePhoto(resized, props.chantier.id, tournee.value.id)
    if (data) {
      photos.value.push(data)
      await loadSignedUrls([data])
    }
    uploadCount.value++
  }
  scrollToBottom()
  uploadingPhoto.value = false
  uploadTotal.value = 0
  event.target.value = ''
}

// --- Terminer ---
const confirmTerminer = () => {
  showConfirmTerminer.value = true
}

const doTerminer = async () => {
  if (!tournee.value) return
  terminating.value = true
  // Sauvegarder le titre si édition en cours
  if (editingTitre.value) await saveTitre()
  // Sauvegarder note voix en cours
  if (isListening.value) stopListening()
  await terminerTournee(tournee.value.id)
  terminating.value = false
  showConfirmTerminer.value = false
  model.value = false
  emit('terminee')
}

const close = () => {
  if (isListening.value) stopListening()
  model.value = false
}

// Heure formatée
const formatTime = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
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

        <!-- Chargement initial -->
        <div v-if="initializing" class="flex flex-1 items-center justify-center">
          <Icon name="lucide:loader-2" size="32" class="animate-spin text-blue-500" />
        </div>

        <template v-else>
          <!-- Header -->
          <div class="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
            <button type="button" class="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-700" @click="close">
              <Icon name="lucide:x" size="20" />
            </button>

            <!-- Titre éditable -->
            <div class="flex-1 min-w-0">
              <input
                v-if="editingTitre"
                v-model="titreTmp"
                type="text"
                placeholder="Titre de la tournée…"
                class="w-full rounded-md border border-blue-400 bg-transparent px-2 py-1 text-base font-semibold text-gray-800 outline-none dark:text-white"
                autofocus
                @blur="saveTitre"
                @keydown.enter="saveTitre"
                @keydown.escape="editingTitre = false" />
              <button
                v-else
                type="button"
                class="flex items-center gap-1 text-left"
                @click="editingTitre = true">
                <span class="truncate text-base font-semibold text-gray-800 dark:text-white">
                  {{ titreTmp || 'Tournée en cours' }}
                </span>
                <Icon name="lucide:pencil" size="13" class="shrink-0 text-gray-400" />
              </button>
            </div>

            <button
              type="button"
              class="flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
              @click="confirmTerminer">
              <Icon name="lucide:check" size="15" />
              Terminer
            </button>
          </div>

          <!-- Fil chronologique -->
          <div ref="feedRef" class="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            <!-- Vide -->
            <div v-if="timeline.length === 0 && !isListening" class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
              <Icon name="lucide:map-pin" size="40" class="mb-3 opacity-40" />
              <p class="text-sm font-medium">Aucune note pour l'instant</p>
              <p class="mt-1 text-xs">Utilisez les boutons ci-dessous pour commencer</p>
            </div>

            <!-- Items du fil -->
            <template v-for="item in timeline" :key="item._kind + item.id">
              <!-- Note voix ou texte -->
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
                  <!-- Mode édition -->
                  <div v-if="editingNoteId === item.id" class="rounded-xl bg-white shadow-sm dark:bg-gray-800">
                    <textarea
                      v-model="editingNoteContent"
                      rows="3"
                      class="w-full rounded-t-xl bg-transparent px-3 pt-3 text-sm text-gray-800 outline-none resize-none dark:text-white"
                      autofocus
                      @keydown="onEditKeydown($event, item.id)" />
                    <div class="flex justify-end gap-2 border-t border-gray-100 px-2 py-1.5 dark:border-gray-700">
                      <button
                        type="button"
                        class="rounded px-2 py-1 text-xs text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-300"
                        @click="cancelEditNote">
                        Annuler
                      </button>
                      <button
                        type="button"
                        class="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-blue-700"
                        @click="saveEditNote(item.id)">
                        Enregistrer
                      </button>
                    </div>
                  </div>
                  <!-- Mode lecture -->
                  <div
                    v-else
                    class="group/note relative cursor-pointer rounded-xl bg-white p-3 shadow-sm dark:bg-gray-800"
                    @click="startEditNote(item)">
                    <p class="text-sm whitespace-pre-wrap text-gray-800 dark:text-white">{{ item.content }}</p>
                    <Icon name="lucide:pencil" size="11" class="absolute top-2 right-2 text-gray-300 opacity-0 transition group-hover/note:opacity-100" />
                  </div>
                  <p class="mt-1 text-xs text-gray-400">{{ formatTime(item.created_at) }}</p>
                </div>
                <button
                  v-if="editingNoteId !== item.id"
                  type="button"
                  class="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  @click="onDeleteNote(item.id)">
                  <Icon name="lucide:trash-2" size="13" />
                </button>
              </div>

              <!-- Photo -->
              <div v-else-if="item._kind === 'photo'" class="flex items-start gap-3">
                <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                  <Icon name="lucide:image" size="13" class="text-amber-600 dark:text-amber-400" />
                </div>
                <div class="min-w-0" style="max-width: min(100%, 360px)">
                  <div class="overflow-hidden rounded-xl shadow-sm">
                    <img
                      :src="photoUrls[item.id]"
                      :alt="item.nom_fichier"
                      class="h-auto w-full object-cover" />
                  </div>
                  <p class="mt-1 text-xs text-gray-400">{{ formatTime(item.created_at) }}</p>
                </div>
                <button
                  type="button"
                  class="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  @click="onDeletePhoto(item)">
                  <Icon name="lucide:trash-2" size="13" />
                </button>
              </div>
            </template>

            <!-- Texte intermédiaire voix -->
            <div v-if="isListening && interimText" class="flex items-start gap-3">
              <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
                <Icon name="lucide:mic" size="13" class="text-red-600 dark:text-red-400" />
              </div>
              <div class="flex-1 rounded-xl border border-dashed border-red-300 bg-white p-3 dark:border-red-700 dark:bg-gray-800">
                <p class="text-sm italic text-gray-400 dark:text-gray-500">{{ interimText }}…</p>
              </div>
            </div>
          </div>

          <!-- Input texte inline -->
          <div v-if="showTextInput" class="shrink-0 border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
            <div class="flex items-center gap-2">
              <input
                v-model="textInput"
                type="text"
                placeholder="Saisissez une note…"
                class="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                autofocus
                @keydown="onTextKeydown" />
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white disabled:opacity-50"
                :disabled="!textInput.trim() || savingText"
                @click="submitText">
                <Icon v-if="savingText" name="lucide:loader-2" size="16" class="animate-spin" />
                <Icon v-else name="lucide:send" size="16" />
              </button>
              <button
                type="button"
                class="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 dark:hover:bg-gray-700"
                @click="showTextInput = false; textInput = ''">
                <Icon name="lucide:x" size="16" />
              </button>
            </div>
          </div>

          <!-- Footer actions -->
          <div class="shrink-0 border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
            <div class="flex items-center justify-center gap-8">
              <!-- Bouton micro -->
              <div class="flex flex-col items-center gap-1">
                <button
                  type="button"
                  class="relative flex h-16 w-16 items-center justify-center rounded-full shadow-lg transition-all"
                  :class="isListening
                    ? 'bg-red-500 text-white animate-pulse scale-110'
                    : 'bg-blue-600 text-white hover:bg-blue-700'"
                  @click="toggleListening">
                  <Icon :name="isListening ? 'lucide:mic-off' : 'lucide:mic'" size="26" />
                </button>
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ isListening ? 'Arrêter' : 'Dicter' }}</span>
              </div>

              <!-- Bouton photo -->
              <div class="flex flex-col items-center gap-1">
                <button
                  type="button"
                  class="relative flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-white shadow-md transition hover:bg-amber-600 disabled:opacity-50"
                  :disabled="uploadingPhoto"
                  @click="triggerPhotoInput">
                  <Icon v-if="uploadingPhoto" name="lucide:loader-2" size="22" class="animate-spin" />
                  <Icon v-else name="lucide:camera" size="22" />
                  <span v-if="uploadingPhoto && uploadTotal > 1"
                    class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-amber-600 shadow">
                    {{ uploadCount }}/{{ uploadTotal }}
                  </span>
                </button>
                <span class="text-xs text-gray-500 dark:text-gray-400">Photo</span>
                <input
                  ref="photoInputRef"
                  type="file"
                  accept="image/*"
                  multiple
                  class="hidden"
                  @change="onPhotoSelected" />
              </div>

              <!-- Bouton texte -->
              <div class="flex flex-col items-center gap-1">
                <button
                  type="button"
                  class="flex h-14 w-14 items-center justify-center rounded-full bg-gray-600 text-white shadow-md transition hover:bg-gray-700"
                  :class="showTextInput ? 'ring-2 ring-gray-400' : ''"
                  @click="showTextInput = !showTextInput; isListening && stopListening()">
                  <Icon name="lucide:type" size="22" />
                </button>
                <span class="text-xs text-gray-500 dark:text-gray-400">Texte</span>
              </div>
            </div>
          </div>
        </template>
      </div>
    </Transition>

    <!-- Confirmation terminer -->
    <AppModal v-model="showConfirmTerminer" size="sm" :close-on-backdrop="false">
      <template #header>
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Terminer la tournée ?</h3>
      </template>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        La tournée sera clôturée et consultable en lecture seule. Vous ne pourrez plus ajouter de notes.
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            @click="showConfirmTerminer = false">
            Annuler
          </button>
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
            :disabled="terminating"
            @click="doTerminer">
            <Icon v-if="terminating" name="lucide:loader-2" size="14" class="animate-spin" />
            Terminer
          </button>
        </div>
      </template>
    </AppModal>
  </Teleport>
</template>
