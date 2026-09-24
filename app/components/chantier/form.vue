<script setup>
// Formulaire chantier (design V4) : fiche latérale, en création comme en modification. Un seul formulaire
// en trois sections (Identité, Périodes, Intervenants) que le menu du bandeau atteint directement ;
// Annuler et Enregistrer restent visibles en pied. La page garde l'enregistrement (événement `submit`).
const emit = defineEmits(['submit', 'cancel', 'update:modelValue'])

const props = defineProps({
  open: { type: Boolean, default: false },
  // Données du chantier (copiées à chaque ouverture)
  modelValue: { type: Object, required: true },
  isEditMode: { type: Boolean, default: false },
  // Modification : état d'origine du chantier (couleur des barres)
  etat: { type: Number, default: null },
  // Données pour les listes
  usersRltVoie: { type: Array, default: () => [] },
  usersRltSes: { type: Array, default: () => [] },
  usersRltCat: { type: Array, default: () => [] },
  usersLogistique: { type: Array, default: () => [] },
  usersKvVoie: { type: Array, default: () => [] },
  usersKvSes: { type: Array, default: () => [] },
  usersKvCat: { type: Array, default: () => [] },
  usersPreopVoie: { type: Array, default: () => [] },
  usersPreopSes: { type: Array, default: () => [] },
  usersRefRdu: { type: Array, default: () => [] },
  usersCdp: { type: Array, default: () => [] },
  usersMoetx: { type: Array, default: () => [] },
  users: { type: Array, default: () => [] },
  taches: { type: Array, default: () => [] },
  chantiers: { type: Array, default: () => [] },
  // Secteurs issus de la table attributions : [{ id: code, label }]
  attributionOptions: { type: Array, default: () => [] },
  isSubmitting: { type: Boolean, default: false }
})

const { getEtatInfo } = useEtatChantier()

const LABEL = 'text-ink mb-1.5 block text-[13px] font-medium'
const ETATS_PROJET = ['AVP', 'PRO', 'APO', 'REA']

// ---------- Données : copie profonde à chaque ouverture, pour savoir ce qui a changé ----------
const copie = (data) => {
  const c = JSON.parse(JSON.stringify(data))
  // L'ancien formulaire initialisait « autre » avec un tableau vide
  if (Array.isArray(c.autre)) c.autre = ''
  for (const cle of ['preparation', 'realisation', 'weekends']) c[cle] ??= []
  return c
}
const formData = ref(copie(props.modelValue))
const reference = ref(JSON.stringify(formData.value))
const modifie = computed(() => JSON.stringify(formData.value) !== reference.value)

const periodeEnSaisie = ref(false)
const corps = ref(null)
const sectionActive = ref('identite')

watch(
  () => props.open,
  (ouvert) => {
    if (!ouvert) return
    formData.value = copie(props.modelValue)
    reference.value = JSON.stringify(formData.value)
    periodeEnSaisie.value = false
    sectionActive.value = 'identite'
  }
)

watch(formData, (v) => emit('update:modelValue', v), { deep: true })

// ---------- Validation et enregistrement ----------
const compteAlreadyExists = computed(() => {
  const compte = formData.value.compte?.trim()
  if (!compte || props.isEditMode) return false
  return props.chantiers.some((c) => c.compte?.trim().toLowerCase() === compte.toLowerCase())
})

const manquants = computed(() => {
  const m = []
  if (!formData.value.compte?.trim()) m.push('compte')
  if (!formData.value.name?.trim()) m.push('intitulé')
  if (!formData.value.attribution) m.push('secteur')
  if (!props.isEditMode && !formData.value.realisation.length) m.push('réalisation')
  return m
})

const peutEnregistrer = computed(
  () =>
    !manquants.value.length &&
    !compteAlreadyExists.value &&
    !periodeEnSaisie.value &&
    !props.isSubmitting &&
    (!props.isEditMode || modifie.value)
)

// Ligne d'état du pied : ce qui bloque, sinon ce qui va se passer
const statut = computed(() => {
  if (compteAlreadyExists.value) return { point: 'bg-rust-500', texte: 'Ce compte existe déjà' }
  if (periodeEnSaisie.value) return { point: 'bg-ochre-400', texte: "Terminez l'ajout du week-end" }
  if (manquants.value.length) return { point: 'bg-ochre-400', texte: `À compléter : ${manquants.value.join(', ')}` }
  if (props.isEditMode) {
    return modifie.value
      ? { point: 'bg-ochre-400', texte: 'Modifications non enregistrées' }
      : { point: null, texte: 'Aucune modification' }
  }
  return { point: 'bg-secondary-500', texte: 'Prêt à créer' }
})

const enregistrer = () => {
  if (!peutEnregistrer.value) return
  emit('submit', copie(formData.value))
}

// ---------- En-tête ----------
// État qu'aura le chantier : la page bascule externe (1) / interne (2) si la case change, sinon garde l'état
const etatEffectif = computed(() => {
  const externe = !!formData.value.externe
  if (!props.isEditMode || props.etat === null) return externe ? 1 : 2
  return (props.etat === 1) !== externe ? (externe ? 1 : 2) : props.etat
})
// Mêmes classes que les barres du plan de charge (useTimelineRowLogic)
const BARRES = {
  0: 'bg-sky-500 border-sky-700',
  1: 'bg-purple-500 border-purple-700',
  2: 'bg-lime-500 border-lime-700',
  '-1': 'bg-slate-500 border-slate-700'
}

const secteurLabel = computed(() => {
  const opt = props.attributionOptions.find((o) => o.id === formData.value.attribution)
  return opt?.label || formData.value.attribution || null
})

const noteTaches = computed(() => {
  if (formData.value.externe) return 'Aucune tâche H00 ne sera ajoutée.'
  return props.isEditMode
    ? 'Les tâches H00 sont suivies pour ce chantier.'
    : props.taches.length
      ? `Les ${props.taches.length} tâches H00 seront ajoutées à la création.`
      : 'Les tâches H00 seront ajoutées à la création.'
})
const notePeriodes = computed(() => {
  if (formData.value.externe) return ''
  return props.isEditMode
    ? 'Si les dates de réalisation changent, les prévisions H00 sont recalculées.'
    : 'Les prévisions H00 partent de la première date de réalisation.'
})

// ---------- Intervenants ----------
const userOptions = (users) =>
  (users || []).map((u) => ({ id: u.email, label: u.prenom && u.nom ? `${u.prenom} ${u.nom}` : u.email }))

// Couleurs des avatars du plan de charge (timelineGridRow)
const TONS = {
  voie: 'bg-purple-200 text-purple-600',
  ses: 'bg-primary-200 text-primary-600',
  cat: 'bg-blue-200 text-blue-600',
  preop: 'bg-emerald-200 text-emerald-600',
  cdp: 'bg-amber-200 text-amber-700',
  autre: 'bg-slate-200 text-slate-600'
}

const RLT = computed(() =>
  [
    {
      label: 'RLT Voie',
      point: 'bg-purple-400',
      ton: TONS.voie,
      cle: 'voie',
      rlt: props.usersRltVoie,
      kv: props.usersKvVoie
    },
    {
      label: 'RLT SES',
      point: 'bg-slate-400',
      ton: TONS.ses,
      cle: 'ses',
      rlt: props.usersRltSes,
      kv: props.usersKvSes
    },
    { label: 'RLT CAT', point: 'bg-blue-400', ton: TONS.cat, cle: 'cat', rlt: props.usersRltCat, kv: props.usersKvCat }
  ].map((r) => ({
    ...r,
    cellules: [
      { champ: `rlt_${r.cle}_principale`, titre: 'Principal', options: userOptions(r.rlt), multiple: false },
      { champ: `rlt_${r.cle}_secondaire`, titre: 'Secondaires', options: userOptions(r.rlt), multiple: true },
      { champ: `kv_${r.cle}`, titre: 'Contrôleurs', options: userOptions(r.kv), multiple: true }
    ]
  }))
)

const AUTRES = computed(() => [
  { champ: 'preop_voie', label: 'Pré-op Voie', ton: TONS.preop, options: userOptions(props.usersPreopVoie) },
  { champ: 'preop_ses', label: 'Pré-op SES', ton: TONS.preop, options: userOptions(props.usersPreopSes) },
  { champ: 'logistique', label: 'Logistique', ton: TONS.preop, options: userOptions(props.usersLogistique) },
  {
    champ: 'supervisor',
    label: 'Superviseurs',
    ton: TONS.autre,
    options: userOptions(props.usersRefRdu),
    multiple: true
  },
  { champ: 'chef_projet_email', label: 'Chef de projet', ton: TONS.cdp, options: userOptions(props.usersCdp) },
  { champ: 'moetx_amont_email', label: 'Moetx amont', ton: TONS.cdp, options: userOptions(props.usersMoetx) }
])

// ---------- Menu des sections : ancres qui suivent le défilement ----------
const sIdentite = ref(null)
const sPeriodes = ref(null)
const sIntervenants = ref(null)
const SECTIONS = { identite: sIdentite, periodes: sPeriodes, intervenants: sIntervenants }

// Onglet actif : couleur du corps (--onglet), raccordé par deux coins rentrants comme un onglet de navigateur
const ONGLET_ACTIF =
  'text-ink bg-(--onglet) before:absolute before:bottom-0 before:-left-2 before:size-2 before:bg-[radial-gradient(circle_at_0_0,transparent_7.5px,var(--onglet)_8px)] after:absolute after:-right-2 after:bottom-0 after:size-2 after:bg-[radial-gradient(circle_at_100%_0,transparent_7.5px,var(--onglet)_8px)]'

const ONGLETS = [
  { id: 'identite', label: 'Identité', icon: 'lucide:id-card' },
  { id: 'periodes', label: 'Périodes', icon: 'lucide:calendar-range' },
  { id: 'intervenants', label: 'Intervenants', icon: 'lucide:users' }
]

const suivreDefilement = () => {
  const c = corps.value
  if (!c) return
  if (c.scrollTop + c.clientHeight >= c.scrollHeight - 4) {
    sectionActive.value = 'intervenants'
    return
  }
  let active = 'identite'
  for (const [id, el] of Object.entries(SECTIONS)) {
    if (el.value && el.value.offsetTop - c.scrollTop <= 96) active = id
  }
  sectionActive.value = active
}

const allerA = (id) => {
  const el = SECTIONS[id].value
  if (!el || !corps.value) return
  const reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  corps.value.scrollTo({ top: el.offsetTop, behavior: reduit ? 'auto' : 'smooth' })
  sectionActive.value = id
}
</script>

<template>
  <!-- Fermeture (voile, Échap, × ou Annuler) : le panneau confirme si la saisie serait perdue -->
  <AppSidePanel
    v-slot="{ fermer }"
    :open="props.open"
    :label="props.isEditMode ? `Modifier le chantier ${formData.compte}` : 'Nouveau chantier'"
    :dirty="modifie"
    :locked="props.isSubmitting"
    :confirm-title="props.isEditMode ? 'Abandonner les modifications ?' : 'Abandonner ce chantier ?'"
    :confirm-text="
      props.isEditMode
        ? 'Les changements apportés au chantier ne seront pas enregistrés.'
        : 'Les informations saisies seront perdues.'
    "
    @close="emit('cancel')">
    <!-- ============ En-tête aux couleurs de la marque ============ -->
    <header class="panel-brand shrink-0 px-5 pt-5 sm:px-7">
      <div class="flex items-center justify-between gap-3">
        <p class="text-xs font-medium text-white/60">
          {{ props.isEditMode ? 'Modifier le chantier' : 'Ajout au plan de charge' }}
        </p>
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            class="focus-visible:outline-secondary-400 flex size-8.5 cursor-pointer items-center justify-center rounded-full border border-white/18 text-white transition-colors hover:border-white/35 hover:bg-white/8 focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label="Fermer"
            @click="fermer">
            <Icon name="lucide:x" size="18" />
          </button>
        </div>
      </div>

      <template v-if="props.isEditMode">
        <p class="font-traverse mt-2 text-[2.1rem] leading-none tracking-[0.03em] text-white tabular-nums">
          {{ formData.compte || '—' }}
        </p>
        <h2 class="mt-1.5 truncate text-lg font-semibold text-white">{{ formData.name || 'Sans intitulé' }}</h2>
      </template>
      <template v-else>
        <h2 class="font-traverse mt-2 text-[2.1rem] leading-none tracking-[0.03em] text-white">Nouveau chantier</h2>
        <p class="mt-1.5 truncate text-sm text-white/70">
          {{
            formData.compte || formData.name
              ? [formData.compte, formData.name].filter(Boolean).join(' ')
              : 'Compte, intitulé, secteur et une réalisation suffisent pour le créer.'
          }}
        </p>
      </template>

      <div class="mt-3 flex flex-wrap gap-2 text-xs font-medium text-white/85">
        <span v-if="secteurLabel" class="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
          <Icon name="lucide:map-pin" size="13" />
          {{ secteurLabel }}
        </span>
        <span class="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
          <span class="h-2 w-3.5 rounded-xs border" :class="BARRES[etatEffectif]" />
          {{ getEtatInfo(etatEffectif).label }}
        </span>
        <span v-if="formData.etat_pit" class="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1">
          Projet en {{ formData.etat_pit }}
        </span>
      </div>

      <!-- Onglets des sections, posés sur le bord du bandeau : mènent à la section et suivent le défilement -->
      <nav
        class="mt-5 flex gap-1 text-sm font-medium [--onglet:var(--color-slate-100)] dark:[--onglet:var(--color-night-900)]"
        aria-label="Sections du formulaire">
        <button
          v-for="o in ONGLETS"
          :key="o.id"
          type="button"
          class="focus-visible:outline-secondary-400 relative flex shrink-0 cursor-pointer items-center gap-2 rounded-t-lg px-4 py-2.5 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2"
          :class="sectionActive === o.id ? ONGLET_ACTIF : 'text-white/75 hover:bg-white/8 hover:text-white'"
          :aria-current="sectionActive === o.id ? 'true' : undefined"
          @click="allerA(o.id)">
          <Icon :name="o.icon" size="16" class="shrink-0" />
          {{ o.label }}
        </button>
      </nav>
    </header>

    <!-- ============ Corps défilant ============ -->
    <!-- Le fond déborde au-dessus de la zone défilante : le contenu ne vient pas buter contre les onglets -->
    <div class="dark:bg-night-900 flex min-h-0 flex-1 flex-col bg-slate-100 pt-5 sm:pt-6">
      <div
        ref="corps"
        class="relative flex-1 space-y-5 overflow-y-auto px-4 pb-5 sm:px-7 sm:pb-6"
        @scroll.passive="suivreDefilement">
        <!-- Identité -->
        <section ref="sIdentite" aria-labelledby="chantier-section-identite" class="surface-card rounded-xl p-5">
          <h3 id="chantier-section-identite" class="text-ink mb-4 font-semibold">Identité</h3>
          <div class="grid gap-4 sm:grid-cols-[150px_1fr]">
            <div>
              <label for="chantier-compte" :class="LABEL">
                Compte
                <span class="text-rust-500">*</span>
              </label>
              <input
                id="chantier-compte"
                v-model="formData.compte"
                type="text"
                autocomplete="off"
                placeholder="Ex. 24-1187"
                class="form-control h-10 tabular-nums"
                :class="{ 'border-rust-500!': compteAlreadyExists }"
                :aria-invalid="compteAlreadyExists"
                :aria-describedby="compteAlreadyExists ? 'chantier-compte-erreur' : undefined" />
              <p
                v-if="compteAlreadyExists"
                id="chantier-compte-erreur"
                class="text-rust-700 dark:text-rust-300 mt-1 text-xs">
                Ce compte existe déjà.
              </p>
            </div>
            <div>
              <label for="chantier-nom" :class="LABEL">
                Intitulé
                <span class="text-rust-500">*</span>
              </label>
              <input
                id="chantier-nom"
                v-model="formData.name"
                type="text"
                autocomplete="off"
                placeholder="Nom du chantier"
                class="form-control h-10" />
            </div>
          </div>

          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p :class="LABEL">
                Secteur
                <span class="text-rust-500">*</span>
              </p>
              <AppSelect
                v-model="formData.attribution"
                :options="props.attributionOptions"
                name="chantier-secteur"
                placeholder="Choisir un secteur"
                v4 />
            </div>
            <div>
              <p id="chantier-etat-projet" :class="LABEL">État du projet</p>
              <!-- Cliquer sur l'état choisi l'efface -->
              <div
                role="radiogroup"
                aria-labelledby="chantier-etat-projet"
                class="dark:bg-night-900 grid h-10 grid-cols-4 gap-1 rounded-lg border border-slate-300 bg-white p-1 dark:border-white/15">
                <button
                  v-for="e in ETATS_PROJET"
                  :key="e"
                  type="button"
                  role="radio"
                  :aria-checked="formData.etat_pit === e"
                  class="cursor-pointer rounded-md text-[13px] font-semibold transition-colors"
                  :class="
                    formData.etat_pit === e
                      ? 'bg-magenta-700 dark:bg-secondary-600 text-white'
                      : 'text-ink-soft hover:bg-magenta-50 hover:text-ink dark:hover:bg-white/6'
                  "
                  @click="formData.etat_pit = formData.etat_pit === e ? null : e">
                  {{ e }}
                </button>
              </div>
            </div>
          </div>

          <AppSwitchRow v-model="formData.externe" label="Chantier externe" :description="noteTaches" class="mt-4" />

          <div class="mt-4">
            <label for="chantier-autre" :class="LABEL">Informations complémentaires</label>
            <textarea
              id="chantier-autre"
              v-model="formData.autre"
              rows="3"
              placeholder="Notes, remarques…"
              class="form-control resize-y py-2.5" />
          </div>
        </section>

        <!-- Périodes -->
        <section ref="sPeriodes" aria-labelledby="chantier-section-periodes" class="surface-card rounded-xl p-5">
          <ChantierFormPeriodes
            v-model:preparation="formData.preparation"
            v-model:realisation="formData.realisation"
            v-model:weekends="formData.weekends"
            v-model:saisie="periodeEnSaisie"
            :barre="BARRES[etatEffectif]"
            :realisation-requise="!props.isEditMode"
            :note="notePeriodes"
            titre-id="chantier-section-periodes" />
        </section>

        <!-- Intervenants : RLT en grille (mêmes colonnes 1er / 2nd / Kv que le plan de charge), puis les autres -->
        <section
          ref="sIntervenants"
          aria-labelledby="chantier-section-intervenants"
          class="surface-card overflow-hidden rounded-xl">
          <div class="px-5 pt-5 pb-4">
            <h3 id="chantier-section-intervenants" class="text-ink font-semibold">Intervenants</h3>
            <p class="text-ink-soft mt-0.5 text-xs">Facultatifs : ils peuvent être ajoutés plus tard.</p>
          </div>
          <div
            class="bg-table-head table-head-text hidden grid-cols-[120px_repeat(3,minmax(0,1fr))] text-xs sm:grid">
            <span class="px-5 py-2.5">Discipline</span>
            <span class="px-2 py-2.5">Principal</span>
            <span class="px-2 py-2.5">Secondaires</span>
            <span class="px-2 py-2.5">Contrôleurs</span>
          </div>
          <div
            v-for="r in RLT"
            :key="r.cle"
            class="border-rule grid gap-2 border-t px-5 py-3 sm:grid-cols-[120px_repeat(3,minmax(0,1fr))] sm:items-center sm:gap-0 sm:p-0">
            <span class="text-ink flex items-center gap-2 text-sm font-semibold whitespace-nowrap sm:px-5 sm:py-3.5">
              <span class="size-2 rounded-full" :class="r.point" />
              {{ r.label }}
            </span>
            <div v-for="c in r.cellules" :key="c.champ" class="flex min-w-0 items-center gap-2 sm:px-2 sm:py-2.5">
              <span class="text-ink-soft w-24 shrink-0 text-xs sm:hidden">{{ c.titre }}</span>
              <ChantierFormPersonnes
                v-model="formData[c.champ]"
                :options="c.options"
                :multiple="c.multiple"
                :tone="r.ton"
                variant="cell"
                :label="`${r.label}, ${c.titre.toLowerCase()}`"
                class="min-w-0 flex-1" />
            </div>
          </div>
          <div class="border-rule grid gap-4 border-t p-5 sm:grid-cols-2">
            <div v-for="a in AUTRES" :key="a.champ">
              <p :class="LABEL">{{ a.label }}</p>
              <ChantierFormPersonnes
                v-model="formData[a.champ]"
                :options="a.options"
                :multiple="a.multiple"
                :tone="a.ton"
                :label="a.label" />
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- ============ Pied fixe ============ -->
    <footer
      class="border-rule bg-card flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t px-5 py-4 sm:px-7">
      <p class="text-ink-soft flex min-w-0 items-center gap-2 text-sm" aria-live="polite">
        <span v-if="statut.point" class="size-2 shrink-0 rounded-full" :class="statut.point" />
        <span class="truncate">{{ statut.texte }}</span>
      </p>
      <div class="ml-auto flex gap-2">
        <AppButtonValidated theme="outline" type="button" @click="fermer">
          <template #default>Annuler</template>
        </AppButtonValidated>
        <AppButtonValidated theme="brand" type="button" :validated="peutEnregistrer" @click="enregistrer">
          <template #default>
            <span class="flex items-center gap-2">
              <Icon
                :name="props.isSubmitting ? 'lucide:loader-circle' : 'lucide:check'"
                size="16"
                :class="{ 'animate-spin': props.isSubmitting }" />
              {{ props.isEditMode ? 'Enregistrer' : 'Créer le chantier' }}
            </span>
          </template>
        </AppButtonValidated>
      </div>
    </footer>
  </AppSidePanel>
</template>
