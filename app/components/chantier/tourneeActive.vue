<script setup>
const props = defineProps({
  chantier: { type: Object, required: true },
  tourneeInitiale: { type: Object, default: null }
})

const model = defineModel({ type: Boolean, default: false })

const {
  createTournee,
  updateTourneeTitre,
  deleteTournee,
  deleteTourneePhoto,
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

const isInitiateur = computed(() =>
  !!(tournee.value && user.value && tournee.value.created_by === user.value.email)
)
const notes = ref([])
const photos = ref([])
const titreTmp = ref('')
const editingTitre = ref(false)
const initializing = ref(true)

// Entrée texte
const textInput = ref('')
const savingText = ref(false)
const textareaRef = ref(null)

// Voix
const isListening = ref(false)
const interimText = ref('')
const speechSupported = ref(false)

// Upload photo
const cameraInputRef = ref(null)
const galleryInputRef = ref(null)
const uploadingPhoto = ref(false)
const showPhotoSource = ref(false)
// Terminal tactile : on propose le choix appareil photo / galerie. Sur desktop,
// la notion de « galerie » n'existe pas, on ouvre directement l'explorateur.
const isTouchDevice = ref(false)

// Cache des URLs signées
const photoUrls = ref({})

// Photo affichée en plein écran
const lightboxPhoto = ref(null)

// Fil chronologique fusionné (notes + photos triées par date)
const timeline = computed(() => {
  const items = [
    ...notes.value.map((n) => ({ ...n, _kind: 'note' })),
    ...photos.value.map((p) => ({ ...p, _kind: 'photo' }))
  ]
  return items.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
})

// Regroupement par journée : une tournée peut s'étaler sur plusieurs jours
const groupedTimeline = computed(() => {
  const groups = []
  for (const item of timeline.value) {
    const key = new Date(item.created_at).toDateString()
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.items.push(item)
    else groups.push({ key, date: item.created_at, items: [item] })
  }
  return groups
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
  isTouchDevice.value = window.matchMedia?.('(pointer: coarse)').matches ?? false

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
const autoGrow = () => {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 160) + 'px'
}

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
  savingText.value = false
  nextTick(autoGrow)
}

const onTextKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submitText()
  }
  if (e.key === 'Escape') textInput.value = ''
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
  const { error } = await deleteTourneePhoto(photo)
  if (error) return
  photos.value = photos.value.filter((p) => p.id !== photo.id)
  if (lightboxPhoto.value?.id === photo.id) lightboxPhoto.value = null
}

// --- Speech Recognition ---
// Android Chrome est nettement moins fiable que Safari iOS : il coupe la session
// à chaque blanc, remet `event.resultIndex` à zéro tout en conservant les
// résultats déjà finaux, et re-livre parfois ceux de la session précédente. Trois
// garde-fous ci-dessous, sinon le texte part en double ou en triple.
const SILENCE_MS = 2000

let recognition = null
let silenceTimer = null
let pendingText = ''          // texte en attente d'écriture, conservé d'une session à l'autre
let stopRequested = false
let drainSession = () => {}   // vide les segments de la session courante dans pendingText

const clearSilenceTimer = () => {
  if (silenceTimer) {
    clearTimeout(silenceTimer)
    silenceTimer = null
  }
}

// Écrit la note en attente. pendingText est remis à zéro AVANT le premier await :
// deux déclenchements concurrents (fin de silence + fin de session) ne peuvent
// donc pas enregistrer deux fois le même contenu.
const flushPending = async () => {
  drainSession()
  const content = pendingText.trim()
  pendingText = ''
  if (!content) return
  await saveVoiceNote(content)
}

const armSilenceTimer = () => {
  clearSilenceTimer()
  silenceTimer = setTimeout(async () => {
    silenceTimer = null
    await flushPending()
    interimText.value = ''
  }, SILENCE_MS)
}

const initRecognition = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) return null

  const r = new SpeechRecognition()
  r.lang = 'fr-FR'
  r.continuous = true
  r.interimResults = true

  // Garde-fou 1 — les segments finaux sont rangés à LEUR index dans
  // event.results, jamais concaténés. Une re-livraison écrase donc la même case
  // au lieu de s'ajouter à la suite, quel que soit le resultIndex annoncé.
  const finals = []
  let drained = 0

  const drain = () => {
    const chunk = finals.slice(drained).filter(Boolean).join(' ').trim()
    drained = finals.length
    if (chunk) pendingText += (pendingText ? ' ' : '') + chunk
  }
  drainSession = drain

  r.onresult = (event) => {
    let interim = ''
    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i]
      const transcript = (result[0]?.transcript || '').trim()
      if (result.isFinal) {
        finals[i] = transcript
      } else if (transcript) {
        interim += (interim ? ' ' : '') + transcript
      }
    }
    interimText.value = interim
    armSilenceTimer()
  }

  r.onend = () => {
    drain()
    interimText.value = ''

    // Arrêt volontaire (ou reconnaissance perdue) : on écrit ce qui reste.
    if (stopRequested || !isListening.value) {
      clearSilenceTimer()
      flushPending()
      return
    }

    // Garde-fou 2 — on relance sur un objet NEUF. Réutiliser le même peut faire
    // re-livrer les résultats de la session précédente. Le tampon, lui, traverse
    // la relance : pour l'utilisateur la dictée n'est jamais interrompue.
    armSilenceTimer()
    setTimeout(() => {
      if (!isListening.value) return
      recognition = initRecognition()
      if (!recognition) {
        isListening.value = false
        flushPending()
        return
      }
      try {
        recognition.start()
      } catch {
        isListening.value = false
        flushPending()
      }
    }, 150)
  }

  r.onerror = (event) => {
    // « no-speech » tombe en permanence sur Android dès qu'on marque une pause :
    // la session se termine et onend la relance, inutile de couper la dictée.
    // « aborted » est le résultat normal d'un stop() demandé par l'utilisateur.
    if (event.error === 'no-speech' || event.error === 'aborted') return
    console.error('Speech error:', event.error)
    isListening.value = false
    interimText.value = ''
    addToast({ title: 'Micro', message: 'Erreur de reconnaissance vocale', type: 'Error' })
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

  stopRequested = false
  pendingText = ''
  interimText.value = ''
  try {
    recognition.start()
  } catch (err) {
    console.error('Speech start:', err)
    recognition = null
    return
  }
  isListening.value = true
}

const stopListening = () => {
  const current = recognition
  recognition = null
  stopRequested = true
  isListening.value = false
  clearSilenceTimer()
  interimText.value = ''

  if (!current) {
    flushPending()
    return
  }
  // Garde-fou 3 — c'est onend qui écrit le tampon : il récupère au passage le
  // dernier segment finalisé après le stop(). Écrire ici aussi couperait la
  // dernière phrase en deux notes.
  try {
    current.stop()
  } catch {
    flushPending()
  }
}

// --- Photo ---
// Android : un input `multiple` bascule sur le sélecteur photo système, qui
// n'offre pas l'appareil photo. On garde donc deux inputs distincts — `capture`
// pour la prise de vue (jamais combiné à `multiple`), `multiple` pour la galerie.
const onPhotoButton = () => {
  if (uploadingPhoto.value) return
  if (isTouchDevice.value) {
    showPhotoSource.value = true
  } else {
    galleryInputRef.value?.click()
  }
}

const pickFromCamera = () => {
  showPhotoSource.value = false
  cameraInputRef.value?.click()
}

const pickFromGallery = () => {
  showPhotoSource.value = false
  galleryInputRef.value?.click()
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
          if (blob && blob.size < 1024 * 1024) {
            // WebP bien compressé (< 1 Mo) → on garde
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', { type: 'image/webp' }))
          } else {
            // Fallback JPEG : WebP non supporté (Safari < 16) ou mal compressé (Safari iOS)
            canvas.toBlob(
              (jpegBlob) => {
                if (jpegBlob) resolve(new File([jpegBlob], file.name.replace(/\.[^/.]+$/, '') + '.jpg', { type: 'image/jpeg' }))
                else resolve(file) // dernier recours : fichier original
              },
              'image/jpeg',
              0.82
            )
          }
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

const close = () => {
  if (isListening.value) stopListening()
  model.value = false
}

const showDeleteModal = ref(false)
const deleting = ref(false)

const handleDeleteTournee = () => {
  showDeleteModal.value = true
}

const confirmDeleteTournee = async () => {
  if (!tournee.value) return
  deleting.value = true
  await deleteTournee(tournee.value.id)
  deleting.value = false
  showDeleteModal.value = false
  close()
}

// Heure formatée
const formatTime = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const formatDate = (iso) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const formatDayLabel = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui"
  if (d.toDateString() === yesterday.toDateString()) return 'Hier'
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-full sm:translate-y-4"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-full sm:translate-y-4">
      <div
        v-if="model"
        class="fixed inset-0 z-50 flex h-[100dvh] sm:h-full sm:items-center sm:justify-center sm:bg-gray-900/50 sm:p-6 sm:backdrop-blur-sm"
        @click.self="close">

        <!-- Panneau : plein écran sur mobile, fenêtre centrée sur desktop -->
        <div class="relative flex w-full flex-col overflow-hidden bg-gray-50 dark:bg-gray-900 sm:h-full sm:max-h-[880px] sm:max-w-3xl sm:rounded-2xl sm:shadow-2xl">

          <!-- Chargement initial -->
          <div v-if="initializing" class="flex flex-1 items-center justify-center">
            <Icon name="lucide:loader-2" size="32" class="animate-spin text-secondary-500" />
          </div>

          <template v-else>
            <!-- Header -->
            <div class="flex shrink-0 items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800 sm:px-6 sm:py-4">
              <div class="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-50 text-secondary-600 sm:flex dark:bg-secondary-900/30 dark:text-secondary-300">
                <Icon name="lucide:map-pin" size="18" />
              </div>

              <!-- Titre -->
              <div class="min-w-0 flex-1">
                <template v-if="isInitiateur">
                  <input
                    v-if="editingTitre"
                    v-model="titreTmp"
                    type="text"
                    placeholder="Titre de la tournée…"
                    class="w-full rounded-md border border-secondary-400 bg-transparent px-2 py-1 text-base font-semibold text-gray-800 outline-none dark:text-white"
                    autofocus
                    @blur="saveTitre"
                    @keydown.enter="saveTitre"
                    @keydown.escape="editingTitre = false" />
                  <button
                    v-else
                    type="button"
                    class="group/titre flex max-w-full items-center gap-1.5 text-left"
                    @click="editingTitre = true">
                    <span class="truncate text-base font-semibold text-gray-800 dark:text-white">
                      {{ titreTmp || 'Tournée en cours' }}
                    </span>
                    <Icon name="lucide:pencil" size="13" class="shrink-0 text-gray-400 transition group-hover/titre:text-secondary-500" />
                  </button>
                  <p class="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                    {{ formatDate(tournee?.created_at) }} · {{ timeline.length }} élément{{ timeline.length > 1 ? 's' : '' }}
                  </p>
                </template>
                <template v-else>
                  <p class="truncate text-base font-semibold text-gray-800 dark:text-white">
                    {{ tournee?.titre || 'Tournée du ' + formatDate(tournee?.created_at) }}
                  </p>
                  <p class="truncate text-xs text-gray-500 dark:text-gray-400">
                    {{ formatDate(tournee?.created_at) }} · {{ tournee?.created_by }}
                  </p>
                </template>
              </div>

              <!-- Badge lecture seule -->
              <span
                v-if="!isInitiateur"
                class="hidden shrink-0 items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500 sm:inline-flex dark:bg-gray-700 dark:text-gray-400">
                <Icon name="lucide:eye" size="12" />
                Lecture seule
              </span>

              <button
                v-if="isInitiateur"
                type="button"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                title="Supprimer la tournée"
                @click="handleDeleteTournee">
                <Icon name="lucide:trash-2" size="18" />
              </button>
              <button
                type="button"
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-700"
                title="Fermer"
                @click="close">
                <Icon name="lucide:x" size="20" />
              </button>
            </div>

            <!-- Fil chronologique -->
            <div ref="feedRef" class="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              <!-- Vide -->
              <div v-if="timeline.length === 0 && !isListening" class="flex flex-col items-center justify-center py-16 text-center">
                <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm dark:bg-gray-800">
                  <Icon name="lucide:notebook-pen" size="28" class="text-secondary-500" />
                </div>
                <p class="text-sm font-medium text-gray-600 dark:text-gray-300">Carnet vide</p>
                <p class="mt-1 max-w-[15rem] text-xs text-gray-400 dark:text-gray-500">
                  {{ isInitiateur ? 'Dictez, écrivez ou photographiez : tout s\'ajoute ici dans l\'ordre.' : 'Cette tournée ne contient encore rien.' }}
                </p>
              </div>

              <!-- Journées -->
              <div v-for="groupe in groupedTimeline" :key="groupe.key" class="mb-2">
                <!-- Séparateur de jour -->
                <div class="sticky top-0 z-20 -mx-4 mb-4 flex justify-center px-4 py-1 sm:-mx-6 sm:px-6">
                  <span class="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-500 shadow-sm ring-1 ring-gray-200 backdrop-blur first-letter:uppercase dark:bg-gray-800/90 dark:text-gray-400 dark:ring-gray-700">
                    {{ formatDayLabel(groupe.date) }}
                  </span>
                </div>

                <!-- Rail vertical du carnet -->
                <div class="relative">
                  <span class="absolute top-2 bottom-2 left-[15px] w-px bg-gray-200 dark:bg-gray-700" />

                  <div class="space-y-4">
                    <div v-for="item in groupe.items" :key="item._kind + item.id" class="group/row relative flex gap-3">
                      <!-- Pastille sur le rail -->
                      <span
                        class="relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-gray-50 dark:ring-gray-900"
                        :class="item._kind === 'photo'
                          ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400'
                          : item.type === 'voix'
                            ? 'bg-secondary-100 text-secondary-600 dark:bg-secondary-900/40 dark:text-secondary-300'
                            : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'">
                        <Icon
                          :name="item._kind === 'photo' ? 'lucide:camera' : item.type === 'voix' ? 'lucide:mic' : 'lucide:pen-line'"
                          size="14" />
                      </span>

                      <!-- Note -->
                      <div v-if="item._kind === 'note'" class="min-w-0 flex-1">
                        <!-- En-tête de l'entrée -->
                        <div class="mb-1 flex items-center gap-2">
                          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">
                            {{ item.type === 'voix' ? 'Dictée' : 'Note' }}
                          </span>
                          <span class="text-xs text-gray-400 dark:text-gray-500">{{ formatTime(item.created_at) }}</span>
                          <button
                            v-if="isInitiateur && editingNoteId !== item.id"
                            type="button"
                            class="ml-auto flex h-6 w-6 items-center justify-center rounded text-gray-400 transition hover:bg-red-50 hover:text-red-500 sm:opacity-0 sm:group-hover/row:opacity-100 dark:hover:bg-red-900/20"
                            title="Supprimer la note"
                            @click="onDeleteNote(item.id)">
                            <Icon name="lucide:trash-2" size="13" />
                          </button>
                        </div>

                        <!-- Mode édition -->
                        <div v-if="editingNoteId === item.id" class="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-secondary-300 dark:bg-gray-800 dark:ring-secondary-700">
                          <textarea
                            v-model="editingNoteContent"
                            rows="3"
                            class="w-full resize-none bg-transparent px-3.5 pt-3 text-sm leading-relaxed text-gray-800 outline-none dark:text-white"
                            autofocus
                            @keydown="onEditKeydown($event, item.id)" />
                          <div class="flex items-center justify-end gap-2 border-t border-gray-100 px-2 py-1.5 dark:border-gray-700">
                            <span class="mr-auto pl-2 text-[11px] text-gray-400">Entrée pour valider</span>
                            <button
                              type="button"
                              class="rounded px-2 py-1 text-xs text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-300"
                              @click="cancelEditNote">
                              Annuler
                            </button>
                            <button
                              type="button"
                              class="rounded-md bg-secondary-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-secondary-700"
                              @click="saveEditNote(item.id)">
                              Enregistrer
                            </button>
                          </div>
                        </div>

                        <!-- Mode lecture -->
                        <div
                          v-else
                          class="relative rounded-xl border border-l-2 bg-white px-3.5 py-3 shadow-sm dark:bg-gray-800"
                          :class="[
                            item.type === 'voix'
                              ? 'border-gray-100 border-l-secondary-400 dark:border-gray-700 dark:border-l-secondary-500'
                              : 'border-gray-100 border-l-gray-300 dark:border-gray-700 dark:border-l-gray-600',
                            isInitiateur ? 'group/note cursor-text transition hover:border-l-secondary-500 hover:shadow' : ''
                          ]"
                          @click="isInitiateur && startEditNote(item)">
                          <p class="text-sm leading-relaxed whitespace-pre-wrap text-gray-700 dark:text-gray-100">{{ item.content }}</p>
                          <Icon
                            v-if="isInitiateur"
                            name="lucide:pencil"
                            size="12"
                            class="absolute top-2.5 right-3 text-gray-300 opacity-0 transition group-hover/note:opacity-100 dark:text-gray-600" />
                        </div>
                      </div>

                      <!-- Photo -->
                      <div v-else class="min-w-0 flex-1">
                        <div class="mb-1 flex items-center gap-2">
                          <span class="text-xs font-medium text-gray-500 dark:text-gray-400">Photo</span>
                          <span class="text-xs text-gray-400 dark:text-gray-500">{{ formatTime(item.created_at) }}</span>
                          <button
                            v-if="isInitiateur"
                            type="button"
                            class="ml-auto flex h-6 w-6 items-center justify-center rounded text-gray-400 transition hover:bg-red-50 hover:text-red-500 sm:opacity-0 sm:group-hover/row:opacity-100 dark:hover:bg-red-900/20"
                            title="Supprimer la photo"
                            @click="onDeletePhoto(item)">
                            <Icon name="lucide:trash-2" size="13" />
                          </button>
                        </div>
                        <button
                          type="button"
                          class="group/photo relative block w-full max-w-[22rem] overflow-hidden rounded-xl bg-gray-200 shadow-sm transition hover:shadow-md dark:bg-gray-700"
                          title="Agrandir"
                          @click="lightboxPhoto = item">
                          <img
                            :src="photoUrls[item.id]"
                            :alt="item.nom_fichier"
                            loading="lazy"
                            class="block h-auto w-full object-cover" />
                          <span class="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover/photo:bg-black/25">
                            <Icon name="lucide:maximize-2" size="18" class="text-white opacity-0 transition group-hover/photo:opacity-100" />
                          </span>
                        </button>
                      </div>
                    </div>

                    <!-- Texte intermédiaire de la dictée en cours -->
                    <div v-if="isListening && interimText && groupe === groupedTimeline[groupedTimeline.length - 1]" class="relative flex gap-3">
                      <span class="relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 ring-4 ring-gray-50 dark:bg-red-900/40 dark:text-red-400 dark:ring-gray-900">
                        <Icon name="lucide:mic" size="14" />
                      </span>
                      <div class="min-w-0 flex-1">
                        <p class="mb-1 text-xs font-medium text-red-500">En cours…</p>
                        <div class="rounded-xl border border-dashed border-red-300 bg-white px-3.5 py-3 dark:border-red-800 dark:bg-gray-800">
                          <p class="text-sm leading-relaxed text-gray-400 italic dark:text-gray-500">{{ interimText }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Dictée démarrée alors que le carnet est encore vide -->
              <div v-if="isListening && groupedTimeline.length === 0" class="flex gap-3">
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400">
                  <Icon name="lucide:mic" size="14" />
                </span>
                <div class="min-w-0 flex-1">
                  <p class="mb-1 text-xs font-medium text-red-500">En cours…</p>
                  <div class="rounded-xl border border-dashed border-red-300 bg-white px-3.5 py-3 dark:border-red-800 dark:bg-gray-800">
                    <p class="text-sm leading-relaxed text-gray-400 italic dark:text-gray-500">
                      {{ interimText || 'Parlez, la note s\'enregistre après un blanc de 2 secondes.' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bandeau d'écoute -->
            <Transition
              enter-active-class="duration-200 ease-out"
              enter-from-class="opacity-0 translate-y-2"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="duration-150 ease-in"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0">
              <div
                v-if="isListening"
                class="flex shrink-0 items-center justify-center gap-2 bg-red-500 px-4 py-2 text-xs font-medium text-white sm:text-sm">
                <span class="flex h-2 w-2 animate-pulse rounded-full bg-white" />
                Dictée en cours — la note part après 2 s de silence
              </div>
            </Transition>

            <!-- Composer (initiateur uniquement) -->
            <div v-if="isInitiateur" class="shrink-0 border-t border-gray-200 bg-white px-3 py-3 sm:px-6 sm:py-4 dark:border-gray-700 dark:bg-gray-800">
              <div class="flex items-end gap-2 sm:gap-3">
                <!-- Champ de saisie + photo -->
                <div class="flex min-w-0 flex-1 items-end gap-1 rounded-2xl border border-gray-300 bg-gray-50 px-1.5 py-1 transition focus-within:border-secondary-400 focus-within:ring-1 focus-within:ring-secondary-400 dark:border-gray-600 dark:bg-gray-700">
                  <button
                    type="button"
                    class="relative mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-200 hover:text-amber-600 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-600"
                    :disabled="uploadingPhoto"
                    title="Ajouter une photo"
                    @click="onPhotoButton">
                    <Icon v-if="uploadingPhoto" name="lucide:loader-2" size="19" class="animate-spin" />
                    <Icon v-else name="lucide:camera" size="19" />
                    <span
                      v-if="uploadingPhoto && uploadTotal > 1"
                      class="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                      {{ uploadCount }}/{{ uploadTotal }}
                    </span>
                  </button>
                  <textarea
                    ref="textareaRef"
                    v-model="textInput"
                    rows="1"
                    placeholder="Écrire une note…"
                    class="max-h-40 min-w-0 flex-1 resize-none bg-transparent py-2 text-sm text-gray-800 outline-none placeholder:text-gray-400 dark:text-white"
                    @input="autoGrow"
                    @keydown="onTextKeydown" />
                  <button
                    v-if="textInput.trim() || savingText"
                    type="button"
                    class="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary-600 text-white transition hover:bg-secondary-700 disabled:opacity-50"
                    :disabled="savingText"
                    title="Enregistrer la note"
                    @click="submitText">
                    <Icon v-if="savingText" name="lucide:loader-2" size="17" class="animate-spin" />
                    <Icon v-else name="lucide:arrow-up" size="17" />
                  </button>
                </div>

                <!-- Dictée : action principale, dimensionnée pour le terrain -->
                <button
                  type="button"
                  class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white shadow-lg transition-all sm:h-11 sm:w-11"
                  :class="isListening
                    ? 'animate-pulse bg-red-500 ring-4 ring-red-200 hover:bg-red-600 dark:ring-red-900/50'
                    : 'bg-secondary-600 hover:bg-secondary-700'"
                  :title="isListening ? 'Arrêter la dictée' : 'Dicter une note'"
                  @click="toggleListening">
                  <Icon :name="isListening ? 'lucide:square' : 'lucide:mic'" size="21" />
                </button>
              </div>

              <p class="mt-2 hidden px-1 text-[11px] text-gray-400 sm:block dark:text-gray-500">
                Entrée pour enregistrer la note, Maj+Entrée pour un retour à la ligne.
              </p>

              <!-- Inputs fichier : séparés pour qu'Android propose bien l'appareil photo -->
              <input
                ref="cameraInputRef"
                type="file"
                accept="image/*"
                capture="environment"
                class="hidden"
                @change="onPhotoSelected" />
              <input
                ref="galleryInputRef"
                type="file"
                accept="image/*"
                multiple
                class="hidden"
                @change="onPhotoSelected" />
            </div>
          </template>

          <!-- Choix de la source photo (terminaux tactiles) -->
          <Transition
            enter-active-class="duration-200 ease-out"
            enter-from-class="opacity-0"
            enter-to-class="opacity-100"
            leave-active-class="duration-150 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0">
            <div
              v-if="showPhotoSource"
              class="absolute inset-0 z-10 flex items-end bg-black/40 sm:items-center sm:justify-center"
              @click.self="showPhotoSource = false">
              <div class="w-full space-y-2 rounded-t-2xl bg-white p-4 shadow-xl dark:bg-gray-800 sm:max-w-xs sm:rounded-2xl">
                <button
                  type="button"
                  class="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left transition hover:bg-gray-50 dark:hover:bg-gray-700"
                  @click="pickFromCamera">
                  <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400">
                    <Icon name="lucide:camera" size="20" />
                  </span>
                  <span class="min-w-0">
                    <span class="block text-sm font-medium text-gray-800 dark:text-white">Prendre une photo</span>
                    <span class="block text-xs text-gray-500 dark:text-gray-400">Ouvre l'appareil photo</span>
                  </span>
                </button>
                <button
                  type="button"
                  class="flex w-full items-center gap-3 rounded-xl px-3 py-3.5 text-left transition hover:bg-gray-50 dark:hover:bg-gray-700"
                  @click="pickFromGallery">
                  <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-100 text-secondary-600 dark:bg-secondary-900/40 dark:text-secondary-300">
                    <Icon name="lucide:images" size="20" />
                  </span>
                  <span class="min-w-0">
                    <span class="block text-sm font-medium text-gray-800 dark:text-white">Choisir dans la galerie</span>
                    <span class="block text-xs text-gray-500 dark:text-gray-400">Sélection multiple possible</span>
                  </span>
                </button>
                <button
                  type="button"
                  class="w-full rounded-xl py-2.5 text-sm font-medium text-gray-500 transition hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
                  @click="showPhotoSource = false">
                  Annuler
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>

    <!-- Lightbox photo -->
    <Transition
      enter-active-class="duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0">
      <div
        v-if="lightboxPhoto"
        class="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
        @click="lightboxPhoto = null">
        <button
          type="button"
          class="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          title="Fermer"
          @click="lightboxPhoto = null">
          <Icon name="lucide:x" size="20" />
        </button>
        <img
          :src="photoUrls[lightboxPhoto.id]"
          :alt="lightboxPhoto.nom_fichier"
          class="max-h-full max-w-full rounded-lg object-contain"
          @click.stop />
      </div>
    </Transition>
  </Teleport>

  <!-- Modal confirmation suppression -->
  <AppModal v-model="showDeleteModal" size="sm" :close-on-backdrop="!deleting" :close-on-escape="!deleting" :show-close-button="!deleting">
    <template #header>
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <Icon name="lucide:trash-2" size="18" class="text-red-600 dark:text-red-400" />
        </div>
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">Supprimer la tournée</h3>
      </div>
    </template>
    <p class="text-sm text-gray-600 dark:text-gray-400">
      Toutes les notes et photos de cette tournée seront définitivement supprimées. Cette action est irréversible.
    </p>
    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          :disabled="deleting"
          @click="showDeleteModal = false">
          Annuler
        </button>
        <button
          type="button"
          class="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
          :disabled="deleting"
          @click="confirmDeleteTournee">
          <Icon v-if="deleting" name="lucide:loader-2" size="14" class="animate-spin" />
          <Icon v-else name="lucide:trash-2" size="14" />
          Supprimer
        </button>
      </div>
    </template>
  </AppModal>
</template>
