<script setup>
definePageMeta({
  requiresAuth: true,
  layout: false
})

useHead({
  title: 'H00 - Le Débrief',
  description: 'Votre retour terrain, notre amélioration continue.'
})

const user = useAuthUser()
const { addToast } = useToast()
const { getChantiers, getChantiersEtat0, getChantiersEtat1 } = useChantiers()

// État machine : 'welcome' | 'form' | 'recap' | 'success'
const phase = ref('welcome')

// Indice de l'étape de formulaire (0..QUESTIONS.length - 1)
const stepIndex = ref(0)

// Réponses
const form = ref({
  chantierId: null,
  encadrant: null,
  date: null,
  mission: null,
  infosRecues: null,
  tempsRegard: null,
  qualiteDocs: null,
  relation: null,
  securite: null,
  securitePrecision: '',
  humeur: null,
  remontee: ''
})

const sending = ref(false)

// Liste chantiers RLT (non pré-op, non terminés → état 0 ou 1)
onMounted(async () => {
  await getChantiers()
})

const chantierOptions = computed(() => {
  const list = [...getChantiersEtat0.value, ...getChantiersEtat1.value]
  return list
    .map((c) => ({
      id: c.id,
      label: `${c.compte || ''}${c.compte ? ' — ' : ''}${c.name || 'Sans nom'}`
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
})

const selectedChantierLabel = computed(() => {
  const c = chantierOptions.value.find((o) => o.id === form.value.chantierId)
  return c?.label || '—'
})

// Définition des questions
const QUESTIONS = [
  { key: 'general', title: 'Informations générales', subtitle: 'Commençons par les infos de base du chantier.' },
  { key: 'encadrant', title: "Présence d'un encadrant", subtitle: 'Y avait-il un RLT ou un KV sur le chantier ?' },
  { key: 'infosRecues', title: 'Réception des infos', subtitle: 'Les informations / docs vous ont été transmis :' },
  {
    key: 'tempsRegard',
    title: 'Avant le chantier',
    subtitle: "Avez-vous eu le temps de regarder les infos avant d'arriver ?"
  },
  { key: 'qualiteDocs', title: 'Qualité des docs', subtitle: 'Les documents / infos étaient :' },
  { key: 'relation', title: 'Sur le terrain', subtitle: "Relation avec l'entreprise et les collègues sur place ?" },
  { key: 'securite', title: 'Sécurité', subtitle: 'Vous êtes-vous senti(e) en sécurité pendant votre mission ?' },
  { key: 'humeur', title: 'Avant de partir', subtitle: "Dans quel état d'esprit quittez-vous le chantier ?" },
  { key: 'remontee', title: 'Un mot pour finir', subtitle: 'Un truc à nous faire remonter ?' }
]

const totalSteps = QUESTIONS.length
const progressPct = computed(() => Math.round(((stepIndex.value + 1) / totalSteps) * 100))

const ENCADRANT_OPTIONS = [
  { value: 'RLT', label: 'RLT', icon: 'lucide:shield-check' },
  { value: 'KV', label: 'KV', icon: 'lucide:eye' },
  { value: 'Aucun', label: 'Aucun', icon: 'lucide:user-x' }
]

const MISSION_OPTIONS = [
  { value: 'TES C', label: 'TES C', icon: 'lucide:shield-check', color: 'emerald' },
  { value: 'TES D', label: 'TES D', icon: 'lucide:camera', color: 'sky' },
  { value: 'RSO', label: 'RSO', icon: 'lucide:lightbulb', color: 'violet' },
  { value: 'ASP', label: 'ASP', icon: 'lucide:user', color: 'amber' },
  { value: 'Autre', label: 'Autre', icon: 'lucide:settings-2', color: 'slate' }
]

const INFOS_RECUES_OPTIONS = [
  'La veille',
  'Le jour même',
  'Juste avant le chantier',
  "Reçues mais j'ai dû relancer",
  'Pas reçues'
]

const OUI_NON_OPTIONS = [
  { value: 'Oui', label: 'Oui', icon: 'lucide:check' },
  { value: 'Non', label: 'Non', icon: 'lucide:x' }
]

const QUALITE_DOCS_OPTIONS = [
  { value: 'Clairs & utiles', tone: 'good' },
  { value: 'Corrects', tone: 'good' },
  { value: 'Incomplets', tone: 'mid' },
  { value: 'Pas clairs', tone: 'bad' },
  { value: 'Faux / Pas à jour', tone: 'bad' }
]

const RELATION_OPTIONS = [
  { value: 'Très bien', tone: 'good' },
  { value: 'Bien', tone: 'good' },
  { value: 'Moyen', tone: 'mid' },
  { value: 'Compliqué', tone: 'bad' },
  { value: 'Mauvaise ambiance', tone: 'bad' }
]

const SECURITE_OPTIONS = [
  { value: 'Oui', label: 'Oui', tone: 'good', icon: 'lucide:shield-check' },
  { value: 'Bof', label: 'Bof', tone: 'mid', icon: 'lucide:shield-alert' },
  { value: 'Non', label: 'Non', tone: 'bad', icon: 'lucide:shield-x' }
]

const HUMEUR_OPTIONS = [
  { value: 'Très mauvais', emoji: '😞' },
  { value: 'Mauvais', emoji: '😕' },
  { value: 'Neutre', emoji: '😐' },
  { value: 'Bien', emoji: '🙂' },
  { value: 'Très bien', emoji: '😄' }
]

// Date formatée pour affichage
const formattedDate = computed(() => {
  if (!form.value.date) return ''
  const d = new Date(form.value.date)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
})

// Validation de l'étape courante
const canGoNext = computed(() => {
  const k = QUESTIONS[stepIndex.value]?.key
  switch (k) {
    case 'general':
      return !!form.value.chantierId && !!form.value.date && !!form.value.mission
    case 'encadrant':
      return !!form.value.encadrant
    case 'infosRecues':
      return !!form.value.infosRecues
    case 'tempsRegard':
      return !!form.value.tempsRegard
    case 'qualiteDocs':
      return !!form.value.qualiteDocs
    case 'relation':
      return !!form.value.relation
    case 'securite':
      if (!form.value.securite) return false
      if (form.value.securite === 'Non' && !form.value.securitePrecision.trim()) return false
      return true
    case 'humeur':
      return !!form.value.humeur
    case 'remontee':
      return true // optionnel
    default:
      return true
  }
})

const start = () => {
  phase.value = 'form'
  stepIndex.value = 0
}

const next = () => {
  if (!canGoNext.value) return
  if (stepIndex.value < totalSteps - 1) {
    stepIndex.value++
  } else {
    phase.value = 'recap'
  }
}

const prev = () => {
  if (phase.value === 'recap') {
    phase.value = 'form'
    stepIndex.value = totalSteps - 1
    return
  }
  if (stepIndex.value > 0) {
    stepIndex.value--
  } else {
    phase.value = 'welcome'
  }
}

const submit = async () => {
  if (sending.value) return
  sending.value = true
  try {
    await $fetch('/api/email/send', {
      method: 'POST',
      body: {
        type: 'debrief',
        chantierId: form.value.chantierId,
        senderName: user.value?.firstname
          ? `${user.value.firstname} ${user.value.lastname || ''}`.trim()
          : user.value?.email || '',
        senderEmail: user.value?.email || '',
        debrief: {
          date: formattedDate.value,
          encadrant: form.value.encadrant,
          mission: form.value.mission,
          infosRecues: form.value.infosRecues,
          tempsRegard: form.value.tempsRegard,
          qualiteDocs: form.value.qualiteDocs,
          relation: form.value.relation,
          securite: form.value.securite,
          securitePrecision: form.value.securitePrecision,
          humeur: form.value.humeur,
          remontee: form.value.remontee
        }
      }
    })
    phase.value = 'success'
  } catch (err) {
    console.error('[debrief] erreur envoi:', err)
    addToast({
      title: 'Erreur',
      message: err?.data?.statusMessage || err?.message || "Impossible d'envoyer le débrief.",
      type: 'Error'
    })
  } finally {
    sending.value = false
  }
}

const resetAndRestart = () => {
  form.value = {
    chantierId: null,
    encadrant: null,
    date: (() => {
      const t = new Date()
      t.setHours(12, 0, 0, 0)
      return t.getTime()
    })(),
    mission: null,
    infosRecues: null,
    tempsRegard: null,
    qualiteDocs: null,
    relation: null,
    securite: null,
    securitePrecision: '',
    humeur: null,
    remontee: ''
  }
  stepIndex.value = 0
  phase.value = 'welcome'
}

const goHome = () => {
  navigateTo('/')
}

// Helpers tone → classes (pour la palette violette)
const toneClasses = (selected, tone) => {
  if (selected) {
    return 'border-violet-600 bg-violet-50 text-violet-900 shadow-sm ring-2 ring-violet-200'
  }
  return 'border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50/50'
}
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-slate-50">
    <div class="mx-auto flex w-full max-w-md flex-1 flex-col">
      <!-- ============ WELCOME ============ -->
      <section v-if="phase === 'welcome'" class="relative flex flex-1 flex-col overflow-hidden bg-white">
        <!-- Background image pleine largeur, remontée, avec fondu vers le blanc du footer -->
        <div
          class="absolute inset-x-0 top-[25%] bottom-25 bg-cover bg-bottom bg-no-repeat"
          :style="{
            backgroundImage: 'url(/images/debrief.png)',
            maskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 70%, transparent 100%)'
          }"></div>

        <!-- Header : icône + titre -->
        <div class="relative z-10 flex flex-col items-center gap-5 px-6 pt-16 text-center">
          <div
            class="flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/30">
            <Icon name="streamline-freehand:task-clipboard-check" size="55" />
          </div>
          <h1 class="text-4xl font-bold tracking-tight">
            <span class="text-slate-900">Mon</span>
            <span class="pl-2 text-violet-600">Débrief</span>
          </h1>
          <p class="max-w-xs text-base leading-relaxed text-slate-600">
            Votre retour terrain,
            <br />
            Notre amélioration continue.
          </p>
        </div>

        <!-- Spacer pour pousser les boutons en bas -->
        <div class="flex-1"></div>

        <!-- Boutons en bas -->
        <div class="relative z-10 flex w-full flex-col items-center gap-3 px-5 pb-8">
          <button
            type="button"
            @click="start"
            class="w-full rounded-2xl bg-violet-600 px-6 py-4 text-base font-semibold text-white shadow-xl shadow-violet-600/40 transition-all hover:bg-violet-700 active:scale-[0.98]">
            Commencer
          </button>
        </div>
      </section>

      <!-- ============ FORM ============ -->
      <section v-else-if="phase === 'form'" class="flex flex-1 flex-col">
        <!-- Header sticky -->
        <header class="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur">
          <div class="flex items-center justify-between gap-4">
            <button
              type="button"
              @click="prev"
              class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100">
              <Icon name="lucide:chevron-left" class="h-5 w-5" />
            </button>
            <div class="flex flex-col items-center">
              <span class="text-sm font-semibold text-slate-800">Nouveau débrief</span>
              <span class="text-xs text-slate-500">{{ stepIndex + 1 }} / {{ totalSteps }}</span>
            </div>
            <div class="h-9 w-9" />
          </div>
          <div class="mt-3 h-1 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              class="h-full rounded-full bg-violet-600 transition-all duration-300"
              :style="{ width: progressPct + '%' }" />
          </div>
        </header>

        <!-- Contenu de l'étape -->
        <div class="flex-1 overflow-y-auto px-5 py-6">
          <div class="mb-6">
            <h2 class="text-xl font-bold text-slate-900">{{ QUESTIONS[stepIndex].title }}</h2>
            <p class="mt-1 text-sm text-slate-600">{{ QUESTIONS[stepIndex].subtitle }}</p>
          </div>

          <!-- Step: general (chantier + date + mission) -->
          <div v-if="QUESTIONS[stepIndex].key === 'general'" class="space-y-5">
            <div class="select-white-bg">
              <AppSelect
                v-model="form.chantierId"
                :options="chantierOptions"
                title="Intitulé du chantier *"
                placeholder="Sélectionner un chantier"
                searchable />
              <p v-if="chantierOptions.length === 0" class="mt-1 text-xs text-slate-500 italic">
                Aucun chantier disponible. Les chantiers en pré-opérationnel ou terminés sont exclus.
              </p>
            </div>

            <AppDatePicker v-model="form.date" title="Date *" placeholder="Choisir une date" />

            <div class="space-y-2">
              <label class="block text-sm">Ma mission *</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="opt in MISSION_OPTIONS"
                  :key="opt.value"
                  type="button"
                  @click="form.mission = opt.value"
                  :class="[
                    'flex items-center gap-2 rounded-xl border-2 px-3 py-3 text-left transition-all',
                    toneClasses(form.mission === opt.value)
                  ]">
                  <div
                    :class="[
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                      form.mission === opt.value ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'
                    ]">
                    <Icon :name="opt.icon" class="h-4 w-4" />
                  </div>
                  <span class="flex-1 text-sm font-medium">{{ opt.label }}</span>
                  <Icon v-if="form.mission === opt.value" name="lucide:check" class="h-4 w-4 text-violet-600" />
                </button>
              </div>
            </div>
          </div>

          <!-- Step: encadrant -->
          <div v-else-if="QUESTIONS[stepIndex].key === 'encadrant'" class="space-y-3">
            <button
              v-for="opt in ENCADRANT_OPTIONS"
              :key="opt.value"
              type="button"
              @click="form.encadrant = opt.value"
              :class="[
                'flex w-full items-center gap-3 rounded-xl border-2 px-4 py-4 text-left transition-all',
                toneClasses(form.encadrant === opt.value)
              ]">
              <div
                :class="[
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                  form.encadrant === opt.value ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'
                ]">
                <Icon :name="opt.icon" class="h-5 w-5" />
              </div>
              <span class="flex-1 font-medium">{{ opt.label }}</span>
              <Icon v-if="form.encadrant === opt.value" name="lucide:check-circle-2" class="h-5 w-5 text-violet-600" />
            </button>
          </div>

          <!-- Step: infosRecues -->
          <div v-else-if="QUESTIONS[stepIndex].key === 'infosRecues'" class="space-y-2">
            <button
              v-for="opt in INFOS_RECUES_OPTIONS"
              :key="opt"
              type="button"
              @click="form.infosRecues = opt"
              :class="[
                'flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all',
                toneClasses(form.infosRecues === opt)
              ]">
              <span class="font-medium">{{ opt }}</span>
              <Icon v-if="form.infosRecues === opt" name="lucide:check-circle-2" class="h-5 w-5 text-violet-600" />
            </button>
          </div>

          <!-- Step: tempsRegard -->
          <div v-else-if="QUESTIONS[stepIndex].key === 'tempsRegard'" class="grid grid-cols-2 gap-3">
            <button
              v-for="opt in OUI_NON_OPTIONS"
              :key="opt.value"
              type="button"
              @click="form.tempsRegard = opt.value"
              :class="[
                'flex flex-col items-center justify-center gap-2 rounded-xl border-2 px-4 py-8 transition-all',
                toneClasses(form.tempsRegard === opt.value)
              ]">
              <div
                :class="[
                  'flex h-12 w-12 items-center justify-center rounded-full',
                  form.tempsRegard === opt.value ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'
                ]">
                <Icon :name="opt.icon" class="h-6 w-6" />
              </div>
              <span class="text-base font-semibold">{{ opt.label }}</span>
            </button>
          </div>

          <!-- Step: qualiteDocs -->
          <div v-else-if="QUESTIONS[stepIndex].key === 'qualiteDocs'" class="space-y-2">
            <button
              v-for="opt in QUALITE_DOCS_OPTIONS"
              :key="opt.value"
              type="button"
              @click="form.qualiteDocs = opt.value"
              :class="[
                'flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all',
                toneClasses(form.qualiteDocs === opt.value)
              ]">
              <div class="flex items-center gap-3">
                <span
                  class="h-2 w-2 shrink-0 rounded-full"
                  :class="
                    opt.tone === 'good' ? 'bg-emerald-500' : opt.tone === 'mid' ? 'bg-amber-500' : 'bg-red-500'
                  " />
                <span class="font-medium">{{ opt.value }}</span>
              </div>
              <Icon
                v-if="form.qualiteDocs === opt.value"
                name="lucide:check-circle-2"
                class="h-5 w-5 text-violet-600" />
            </button>
          </div>

          <!-- Step: relation -->
          <div v-else-if="QUESTIONS[stepIndex].key === 'relation'" class="space-y-2">
            <button
              v-for="opt in RELATION_OPTIONS"
              :key="opt.value"
              type="button"
              @click="form.relation = opt.value"
              :class="[
                'flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all',
                toneClasses(form.relation === opt.value)
              ]">
              <div class="flex items-center gap-3">
                <span
                  class="h-2 w-2 shrink-0 rounded-full"
                  :class="
                    opt.tone === 'good' ? 'bg-emerald-500' : opt.tone === 'mid' ? 'bg-amber-500' : 'bg-red-500'
                  " />
                <span class="font-medium">{{ opt.value }}</span>
              </div>
              <Icon v-if="form.relation === opt.value" name="lucide:check-circle-2" class="h-5 w-5 text-violet-600" />
            </button>
          </div>

          <!-- Step: securite -->
          <div v-else-if="QUESTIONS[stepIndex].key === 'securite'" class="space-y-4">
            <div class="grid grid-cols-3 gap-3">
              <button
                v-for="opt in SECURITE_OPTIONS"
                :key="opt.value"
                type="button"
                @click="form.securite = opt.value"
                :class="[
                  'flex flex-col items-center justify-center gap-2 rounded-xl border-2 px-2 py-5 transition-all',
                  toneClasses(form.securite === opt.value)
                ]">
                <div
                  :class="[
                    'flex h-12 w-12 items-center justify-center rounded-full',
                    form.securite === opt.value ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-600'
                  ]">
                  <Icon :name="opt.icon" class="h-6 w-6" />
                </div>
                <span class="text-sm font-semibold">{{ opt.label }}</span>
              </button>
            </div>
            <div v-if="form.securite === 'Non'" class="space-y-2">
              <label class="block text-sm font-medium text-slate-700">
                Préciser
                <span class="text-violet-600">*</span>
              </label>
              <textarea
                v-model="form.securitePrecision"
                rows="4"
                placeholder="Qu'est-ce qui vous a posé problème ?"
                class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none"></textarea>
            </div>
          </div>

          <!-- Step: humeur -->
          <div v-else-if="QUESTIONS[stepIndex].key === 'humeur'" class="grid grid-cols-5 gap-2">
            <button
              v-for="opt in HUMEUR_OPTIONS"
              :key="opt.value"
              type="button"
              @click="form.humeur = opt.value"
              :class="[
                'flex flex-col items-center justify-center gap-2 rounded-xl border-2 px-1 py-4 transition-all',
                form.humeur === opt.value
                  ? 'border-violet-600 bg-violet-50 ring-2 ring-violet-200'
                  : 'border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/50'
              ]">
              <span class="text-3xl">{{ opt.emoji }}</span>
              <span class="text-[10px] leading-tight font-medium text-slate-600">{{ opt.value }}</span>
            </button>
          </div>

          <!-- Step: remontee -->
          <div v-else-if="QUESTIONS[stepIndex].key === 'remontee'" class="space-y-2">
            <label class="block text-sm font-medium text-slate-700">Remarques / commentaires</label>
            <textarea
              v-model="form.remontee"
              rows="6"
              maxlength="1000"
              placeholder="Décrivez votre ressenti, les points positifs, les difficultés rencontrées, les axes d'amélioration..."
              class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none"></textarea>
            <p class="text-right text-xs text-slate-500">{{ form.remontee.length }} / 1000</p>
          </div>
        </div>

        <!-- Footer boutons -->
        <footer class="sticky bottom-0 border-t border-slate-200 bg-white px-5 py-4">
          <div class="flex items-center justify-between gap-3">
            <button
              type="button"
              @click="prev"
              class="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              Précédent
            </button>
            <button
              type="button"
              @click="next"
              :disabled="!canGoNext"
              :class="[
                'flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all',
                canGoNext
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 hover:bg-violet-700 active:scale-[0.98]'
                  : 'cursor-not-allowed bg-slate-200 text-slate-400'
              ]">
              {{ stepIndex === totalSteps - 1 ? 'Voir le récap' : 'Suivant' }}
              <Icon name="lucide:arrow-right" class="h-4 w-4" />
            </button>
          </div>
        </footer>
      </section>

      <!-- ============ RECAP ============ -->
      <section v-else-if="phase === 'recap'" class="flex flex-1 flex-col">
        <header class="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur">
          <div class="flex items-center justify-between gap-4">
            <button
              type="button"
              @click="prev"
              class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100">
              <Icon name="lucide:chevron-left" class="h-5 w-5" />
            </button>
            <span class="text-sm font-semibold text-slate-800">Récap'</span>
            <div class="h-9 w-9" />
          </div>
        </header>

        <div class="flex-1 overflow-y-auto px-5 py-6">
          <h2 class="text-xl font-bold text-slate-900">Résumé</h2>
          <p class="mt-1 text-sm text-slate-600">Vérifiez les informations avant de valider votre débrief.</p>

          <div class="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex items-start gap-3">
              <Icon name="lucide:hard-hat" class="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
              <div>
                <p class="text-xs tracking-wide text-slate-500 uppercase">Chantier</p>
                <p class="text-sm font-medium text-slate-900">{{ selectedChantierLabel }}</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Icon name="lucide:shield" class="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
              <div>
                <p class="text-xs tracking-wide text-slate-500 uppercase">Encadrant</p>
                <p class="text-sm font-medium text-slate-900">{{ form.encadrant }}</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Icon name="lucide:calendar" class="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
              <div>
                <p class="text-xs tracking-wide text-slate-500 uppercase">Date</p>
                <p class="text-sm font-medium text-slate-900">{{ formattedDate }}</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Icon name="lucide:user-check" class="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
              <div>
                <p class="text-xs tracking-wide text-slate-500 uppercase">Ma mission</p>
                <p class="text-sm font-medium text-slate-900">{{ form.mission }}</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Icon name="lucide:mail" class="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
              <div>
                <p class="text-xs tracking-wide text-slate-500 uppercase">Réception des infos</p>
                <p class="text-sm font-medium text-slate-900">{{ form.infosRecues }}</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Icon name="lucide:clock" class="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
              <div>
                <p class="text-xs tracking-wide text-slate-500 uppercase">Temps de regarder avant</p>
                <p class="text-sm font-medium text-slate-900">{{ form.tempsRegard }}</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Icon name="lucide:file-text" class="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
              <div>
                <p class="text-xs tracking-wide text-slate-500 uppercase">Qualité des docs</p>
                <p class="text-sm font-medium text-slate-900">{{ form.qualiteDocs }}</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Icon name="lucide:users" class="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
              <div>
                <p class="text-xs tracking-wide text-slate-500 uppercase">Relation entreprise</p>
                <p class="text-sm font-medium text-slate-900">{{ form.relation }}</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <Icon name="lucide:shield-check" class="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
              <div>
                <p class="text-xs tracking-wide text-slate-500 uppercase">Sécurité</p>
                <p class="text-sm font-medium text-slate-900">{{ form.securite }}</p>
                <p v-if="form.securitePrecision" class="mt-1 text-xs text-slate-600 italic">
                  « {{ form.securitePrecision }} »
                </p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <span class="mt-0.5 text-xl leading-none">
                {{ HUMEUR_OPTIONS.find((h) => h.value === form.humeur)?.emoji || '😐' }}
              </span>
              <div>
                <p class="text-xs tracking-wide text-slate-500 uppercase">État d'esprit</p>
                <p class="text-sm font-medium text-slate-900">{{ form.humeur }}</p>
              </div>
            </div>
            <div v-if="form.remontee" class="flex items-start gap-3">
              <Icon name="lucide:message-square" class="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
              <div class="min-w-0">
                <p class="text-xs tracking-wide text-slate-500 uppercase">Remontée</p>
                <p class="text-sm wrap-break-word whitespace-pre-wrap text-slate-900">{{ form.remontee }}</p>
              </div>
            </div>
          </div>
        </div>

        <footer class="sticky bottom-0 border-t border-slate-200 bg-white px-5 py-4">
          <div class="flex items-center justify-between gap-3">
            <button
              type="button"
              @click="prev"
              class="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
              Précédent
            </button>
            <button
              type="button"
              @click="submit"
              :disabled="sending"
              :class="[
                'flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all',
                sending
                  ? 'cursor-wait bg-violet-400 text-white'
                  : 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 hover:bg-violet-700 active:scale-[0.98]'
              ]">
              <Icon v-if="sending" name="lucide:loader-2" class="h-4 w-4 animate-spin" />
              <Icon v-else name="lucide:send" class="h-4 w-4" />
              {{ sending ? 'Envoi…' : 'Envoyer le débrief' }}
            </button>
          </div>
        </footer>
      </section>

      <!-- ============ SUCCESS ============ -->
      <section
        v-else-if="phase === 'success'"
        class="flex flex-1 flex-col items-center justify-between px-6 py-10 text-center">
        <div class="flex flex-1 flex-col items-center justify-center gap-6">
          <div class="relative flex h-24 w-24 items-center justify-center rounded-full bg-violet-100">
            <Icon name="lucide:check" class="h-12 w-12 text-violet-600" />
          </div>
          <h1 class="text-2xl font-bold text-slate-900">Débrief envoyé !</h1>
          <p class="max-w-xs text-base text-slate-600">
            Merci pour votre retour.
            <br />
            Votre contribution nous aide à nous améliorer chaque jour.
          </p>
        </div>

        <div class="flex w-full flex-col gap-3">
          <button
            type="button"
            @click="goHome"
            class="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-violet-600/30 transition-all hover:bg-violet-700 active:scale-[0.98]">
            Retour à l'accueil
          </button>
          <button
            type="button"
            @click="resetAndRestart"
            class="w-full px-6 py-3 text-sm font-medium text-violet-700 hover:text-violet-900">
            Créer un autre débrief
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.select-white-bg :deep(.bg-primary-50) {
  background-color: #ffffff;
}
</style>
