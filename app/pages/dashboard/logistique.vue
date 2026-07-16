<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: 'logistique'
})

useHead({
  title: 'H00 - Logistique',
  description: 'Suivi logistique des chantiers'
})

const { setLoader } = useLoader()
const { getChantiers, getChantiersNonTermines } = useChantiers()
const { logistiqueByChantier, getLogistiqueByChantierIds, upsertLogistique } = useLogistique()
const { imprimantes, getImprimantes } = useImprimantes()
const { boxes, getBoxes } = useBoxes()
const { getAllWeekends } = useTimeline()

// Inventaires (résolution des ids -> détails)
const imprimanteById = computed(() => Object.fromEntries(imprimantes.value.map((p) => [p.id, p])))
const boxById = computed(() => Object.fromEntries(boxes.value.map((b) => [b.id, b])))

// --- Rubriques (navigation gauche) ---
const types = EQUIPEMENTS // [{ key, label, icon, ... }]
const activeType = ref('base_vie')
const equipMeta = Object.fromEntries(EQUIPEMENTS.map((e) => [e.key, e]))
const activeMeta = computed(() => equipMeta[activeType.value])

// --- Filtres / édition ---
const search = ref('')
const open = ref(false)
const selectedChantier = ref(null)
const editEquip = ref(null)

// --- Constantes ---
const besoinOptions = [
  { value: null, label: 'À définir' },
  { value: true, label: 'Besoin' },
  { value: false, label: 'Aucun besoin' }
]
// Modules de base vie : VAC (type au choix) + ALGECO (nombre de modules)
const vacOptions = [
  { id: 'bb8', label: 'BB8' },
  { id: 'bb10', label: 'BB10' },
  { id: 'base12d', label: 'Base 12D' }
]
const vacByKey = Object.fromEntries(vacOptions.map((v) => [v.id, v]))

// Switch "posée" <-> statut de pose (0 / 2)
const posee = computed({
  get: () => editEquip.value?.base_vie?.pose?.status === 2,
  set: (v) => {
    if (editEquip.value) editEquip.value.base_vie.pose.status = v ? 2 : 0
  }
})

// Switch "déposée" <-> statut de dépose (0 / 2)
const deposee = computed({
  get: () => editEquip.value?.base_vie?.depose?.status === 2,
  set: (v) => {
    if (editEquip.value) editEquip.value.base_vie.depose.status = v ? 2 : 0
  }
})

// Statuts base vie : libellés + couleurs + ordre d'affichage
const BASE_VIE_GROUPS = [
  { key: 'a_installer', label: 'À installer', cls: 'bg-red-100 text-red-700', dot: 'bg-red-400' },
  { key: 'installee', label: 'En place', cls: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  { key: 'retiree', label: 'Retrait', cls: 'bg-slate-200 text-slate-700', dot: 'bg-slate-500' },
  { key: 'pas_besoin', label: 'Aucun besoin', cls: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
  { key: 'a_definir', label: 'À définir', cls: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' }
]
const baseVieGroupByKey = Object.fromEntries(BASE_VIE_GROUPS.map((g, i) => [g.key, { ...g, order: i }]))

// Statuts radio : mêmes catégories que la base vie (cycle pose -> dépose)
const RADIO_GROUPS = [
  { key: 'a_installer', label: 'À installer', cls: 'bg-red-100 text-red-700', dot: 'bg-red-400' },
  { key: 'installee', label: 'En place', cls: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  { key: 'retiree', label: 'Retirée', cls: 'bg-slate-200 text-slate-700', dot: 'bg-slate-500' },
  { key: 'pas_besoin', label: 'Aucun besoin', cls: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
  { key: 'a_definir', label: 'À définir', cls: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' }
]
const radioGroupByKey = Object.fromEntries(RADIO_GROUPS.map((g, i) => [g.key, { ...g, order: i }]))
const radioFournisseurByKey = Object.fromEntries(RADIO_FOURNISSEURS.map((f) => [f.id, f]))

// --- Dates ---
const formatDateForInput = (d) => {
  if (!d) return null
  const date = new Date(d)
  if (isNaN(date.getTime())) return null
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
const shortDate = (d) => {
  if (!d) return null
  const date = new Date(d)
  if (isNaN(date.getTime())) return null
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })
}

// Date de début du chantier : la plus précoce des starts rea (date_start_travaux) / prepa (date_start_prepa)
const chantierStart = (c) => {
  const starts = [
    ...(c.date_rea || []).map((r) => r.date_start_travaux),
    ...(c.date_prepa || []).map((p) => p.date_start_prepa)
  ]
    .filter(Boolean)
    .map((d) => new Date(d))
    .filter((d) => !isNaN(d.getTime()))
  return starts.length ? new Date(Math.min(...starts)) : null
}

// --- Données : chantiers non terminés (hors Externe, etat === 1) + leur logistique ---
const cards = computed(() =>
  getChantiersNonTermines.value
    .filter((c) => c.etat !== 1)
    .map((c) => ({
      ...c,
      equipements: normalizeEquipements(logistiqueByChantier.value[c.id])
    }))
)

const filteredCards = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return cards.value
  return cards.value.filter((c) => c.compte?.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q))
})

// Catégorie d'un chantier pour la base vie
const baseVieBucket = (e) => {
  const bv = e.base_vie
  if (bv.besoin === false) return 'pas_besoin'
  if (bv.besoin !== true) return 'a_definir'
  if (bv.depose.status === 2) return 'retiree'
  if (bv.pose.status === 2) return 'installee'
  return 'a_installer'
}

// Catégorie d'un chantier pour la radio (même cycle que la base vie)
const radioBucket = (r) => {
  if (r.besoin === false) return 'pas_besoin'
  if (r.besoin !== true) return 'a_definir'
  if (r.depose.status === 2) return 'retiree'
  if (r.pose.status === 2) return 'installee'
  return 'a_installer'
}

const isBaseVie = computed(() => activeType.value === 'base_vie')
const isImprimante = computed(() => activeType.value === 'imprimante')
const isReseau = computed(() => activeType.value === 'wifi')
// Postes "à inventaire" (imprimante / réseau) : même logique
const isRefPoste = computed(() => isImprimante.value || isReseau.value)
const isRadio = computed(() => activeType.value === 'radios')

// Nombre de colonnes du tableau selon la rubrique (pour le colspan des en-têtes) :
//  imprimante/réseau => 4 (Chantier, Début, Statut, Matériels)
//  base vie => 8 (… VAC, ALGECO, Groupe élec., Commentaire, Date)
//  radio => 9 (… Fourniture, Nombre, Station fixe, PK, Commentaire, Date)
const colCount = computed(() => (isRefPoste.value ? 4 : isBaseVie.value ? 8 : 9))

// Résolution des matériels (imprimante / box) selon la rubrique active
const refItemById = computed(() => (isReseau.value ? boxById.value : imprimanteById.value))
const refItemLabel = (id) => {
  const it = refItemById.value[id]
  if (!it) return `#${id}`
  return isReseau.value ? it.nom || it.serie || `Box #${id}` : [it.marque, it.model].filter(Boolean).join(' ') || `#${id}`
}
const itemsColLabel = computed(() => (isImprimante.value ? 'Imprimantes' : 'Box'))

// Statuts génériques (imprimante / réseau) : libellés + couleurs + ordre
// Même cycle besoin (null/true/false) que la base vie / radio, avec en plus « À équiper »
// (besoin exprimé mais aucun matériel rattaché).
const REF_GROUPS = [
  { key: 'a_installer', label: 'À installer', cls: 'bg-red-100 text-red-700', dot: 'bg-red-400' },
  { key: 'installee', label: 'Installée', cls: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  { key: 'retiree', label: 'Retirée', cls: 'bg-slate-200 text-slate-700', dot: 'bg-slate-500' },
  { key: 'a_equiper', label: 'À équiper', cls: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' },
  { key: 'pas_besoin', label: 'Aucun besoin', cls: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
  { key: 'a_definir', label: 'À définir', cls: 'bg-amber-100 text-amber-700', dot: 'bg-amber-400' }
]
const refGroupByKey = Object.fromEntries(REF_GROUPS.map((g, i) => [g.key, { ...g, order: i }]))
const refBucket = (poste) => {
  if (poste.besoin === false) return 'pas_besoin'
  if (poste.besoin !== true) return 'a_definir'
  if (!poste.ids.length) return 'a_equiper'
  if (poste.depose.status === 2) return 'retiree'
  if (poste.pose.status === 2) return 'installee'
  return 'a_installer'
}
// Badge "À installer" base vie : gris si le chantier démarre dans plus d'un mois, rouge si l'échéance est proche
const horizonInstall = (() => {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  return d
})()
const A_INSTALLER_GRIS = { cls: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' }

// Lignes du tableau : un chantier par ligne, trié par statut puis par compte
const rows = computed(() => {
  const out = filteredCards.value.map((c) => {
    const e = c.equipements
    const startDate = chantierStart(c)
    let info,
      date,
      order,
      bucket = null,
      vac = null,
      algeco = 0,
      ge = false,
      comment = '',
      refIds = [],
      fournisseur = null,
      nombre = 0,
      stationFixe = false,
      pk = ''
    if (activeType.value === 'base_vie') {
      bucket = baseVieBucket(e)
      const g = baseVieGroupByKey[bucket]
      info = g
      order = g.order
      date = bucket === 'retiree' ? e.base_vie.depose.date : bucket === 'installee' ? e.base_vie.pose.date : null
      comment = bucket === 'retiree' ? e.base_vie.depose.commentaire : e.base_vie.pose.commentaire
      vac = vacByKey[e.base_vie.modules.vac]?.label || null
      algeco = e.base_vie.modules.algeco || 0
      ge = e.base_vie.modules.groupe_electrogene === true
    } else if (isRefPoste.value) {
      const poste = e[activeType.value]
      bucket = refBucket(poste)
      const g = refGroupByKey[bucket]
      info = g
      order = g.order
      refIds = poste.ids
    } else {
      // radios : cycle besoin -> pose -> dépose, + fourniture + PK de couverture
      const r = e.radios
      bucket = radioBucket(r)
      const g = radioGroupByKey[bucket]
      info = g
      order = g.order
      date = bucket === 'retiree' ? r.depose.date : bucket === 'installee' ? r.pose.date : null
      comment = bucket === 'retiree' ? r.depose.commentaire : r.pose.commentaire
      fournisseur = radioFournisseurByKey[r.fournisseur]?.label || null
      nombre = r.nombre || 0
      stationFixe = r.station_fixe === true
      pk = r.pk
    }
    // Base vie « À installer » : gris si le chantier démarre dans + d'un mois (ou date inconnue), rouge sinon
    let cls = info.cls
    let dot = info.dot
    if (activeType.value === 'base_vie' && bucket === 'a_installer' && !(startDate && startDate <= horizonInstall)) {
      cls = A_INSTALLER_GRIS.cls
      dot = A_INSTALLER_GRIS.dot
    }
    return {
      card: c,
      label: info.label,
      cls,
      dot,
      date: shortDate(date),
      start: shortDate(startDate),
      startTs: startDate ? +startDate : null,
      comment,
      order,
      bucket,
      vac,
      algeco,
      ge,
      refIds,
      fournisseur,
      nombre,
      stationFixe,
      pk
    }
  })
  // Tri par date de début de chantier (plus tôt d'abord), chantiers sans date en fin.
  // Les sections filtrent en conservant cet ordre → chaque table est triée par début de chantier.
  return out.sort((a, b) => {
    if (a.startTs == null && b.startTs == null) return (a.card.compte || '').localeCompare(b.card.compte || '')
    if (a.startTs == null) return 1
    if (b.startTs == null) return -1
    return a.startTs - b.startTs || (a.card.compte || '').localeCompare(b.card.compte || '')
  })
})

// Sections d'en-tête pour la base vie (regroupements de statuts)
const BASE_VIE_SECTIONS = [
  { label: 'À installer ou en place', buckets: ['a_installer', 'installee'] },
  { label: 'Base vie démontée', buckets: ['retiree'] },
  { label: 'À définir', buckets: ['a_definir'] },
  { label: 'Aucun besoin', buckets: ['pas_besoin'] }
]

// Sections d'en-tête pour l'imprimante / réseau
const REF_SECTIONS = [
  { label: 'À installer ou installée', buckets: ['a_installer', 'installee'] },
  { label: 'Retirée', buckets: ['retiree'] },
  { label: 'À équiper', buckets: ['a_equiper'] },
  { label: 'À définir', buckets: ['a_definir'] },
  { label: 'Aucun besoin', buckets: ['pas_besoin'] }
]

// Sections d'en-tête pour la radio (regroupements de statuts)
const RADIO_SECTIONS = [
  { label: 'À installer ou en place', buckets: ['a_installer', 'installee'] },
  { label: 'Radios déposées', buckets: ['retiree'] },
  { label: 'À définir', buckets: ['a_definir'] },
  { label: 'Aucun besoin', buckets: ['pas_besoin'] }
]

// Sections affichées : base vie / imprimante / réseau / radio => en-têtes ; sinon => une seule section sans en-tête
const displaySections = computed(() => {
  const conf =
    activeType.value === 'base_vie'
      ? BASE_VIE_SECTIONS
      : isRefPoste.value
        ? REF_SECTIONS
        : isRadio.value
          ? RADIO_SECTIONS
          : null
  if (conf) {
    return conf
      .map((s) => ({ label: s.label, items: rows.value.filter((r) => s.buckets.includes(r.bucket)) }))
      .filter((s) => s.items.length)
  }
  return [{ label: null, items: rows.value }]
})

// Repli/dépli des sections (clé = label de section)
const collapsed = reactive({})
const toggleSection = (label) => {
  if (label) collapsed[label] = !collapsed[label]
}

// À l'entrée dans une rubrique à sections : toutes les sections sont repliées
const initedSections = ref(null)
watch(
  displaySections,
  (sections) => {
    if (!sections.some((s) => s.label)) return // rubrique sans sections
    if (initedSections.value === activeType.value) return // déjà initialisée (on préserve l'état)
    initedSections.value = activeType.value
    sections.forEach((s) => {
      if (s.label) collapsed[s.label] = true
    })
  },
  { immediate: true }
)

// Résumé du type actif
const summary = computed(() => {
  const list = filteredCards.value
  if (activeType.value === 'base_vie') {
    const count = (k) => list.filter((c) => baseVieBucket(c.equipements) === k).length
    return `${count('a_installer')} à installer · ${count('installee')} en place · ${count('retiree')} en retrait`
  }
  if (isRefPoste.value) {
    const count = (k) => list.filter((c) => refBucket(c.equipements[activeType.value]) === k).length
    return `${count('installee')} installée(s) · ${count('a_installer')} à installer · ${count('retiree')} retirée(s)`
  }
  // radio
  const count = (k) => list.filter((c) => radioBucket(c.equipements.radios) === k).length
  return `${count('a_installer')} à installer · ${count('installee')} en place · ${count('retiree')} en retrait`
})

// --- Impression (rubrique active, une table par section) ---
const printMode = computed(() => (isBaseVie.value ? 'base_vie' : isRefPoste.value ? 'ref' : 'radio'))
const printSections = computed(() =>
  displaySections.value
    // imprimante / réseau : on n'imprime pas la section "Aucun besoin" (chantiers sans besoin)
    .map((s) => ({ label: s.label, items: isRefPoste.value ? s.items.filter((r) => r.bucket !== 'pas_besoin') : s.items }))
    .filter((s) => s.items.length)
    .map((s) => ({
      label: s.label,
      rows: s.items.map((r) => ({
        compte: r.card.compte,
        name: r.card.name,
        start: r.start,
        statut: r.label,
        vac: r.vac,
        algeco: r.algeco,
        ge: r.ge,
        items: (r.refIds || []).map((id) => ({ ident: refItemById.value[id]?.identification || null, label: refItemLabel(id) })),
        fournisseur: r.fournisseur,
        nombre: r.nombre,
        stationFixe: r.stationFixe,
        pk: r.pk,
        comment: r.comment,
        date: r.date
      }))
    }))
)
// Au 1er clic, la police Bangers (titres) n'est pas encore chargée car le bloc d'impression
// est en display:none. On la précharge explicitement avant de lancer l'impression.
const openPrintPage = async () => {
  try {
    if (document?.fonts) {
      await document.fonts.load('1em "Bangers"')
      await document.fonts.ready
    }
  } catch (e) {
    console.error(e)
  }
  window.print()
}

// Toutes les rubriques affichent un calendrier (large) → impression en paysage.
const printPageCss =
  '@media print { @page { size: A4 landscape; margin: 8mm } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important } }'
useHead({ style: [{ key: 'logistique-print', innerHTML: printPageCss }] })

// --- Édition (uniquement le poste actif ; les autres postes restent inchangés) ---
const openEditor = (card) => {
  selectedChantier.value = card
  editEquip.value = normalizeEquipements(card.equipements) // copie de travail isolée (objet neuf)
  open.value = true
}
const closeEditor = () => {
  open.value = false
}

const serializeDates = (e) => ({
  base_vie: {
    besoin: e.base_vie.besoin,
    modules: e.base_vie.modules,
    pose: { ...e.base_vie.pose, date: formatDateForInput(e.base_vie.pose.date) },
    depose: { ...e.base_vie.depose, date: formatDateForInput(e.base_vie.depose.date) }
  },
  imprimante: {
    besoin: e.imprimante.besoin,
    ids: e.imprimante.ids,
    pose: { ...e.imprimante.pose, date: formatDateForInput(e.imprimante.pose.date) },
    depose: { ...e.imprimante.depose, date: formatDateForInput(e.imprimante.depose.date) }
  },
  wifi: {
    besoin: e.wifi.besoin,
    ids: e.wifi.ids,
    pose: { ...e.wifi.pose, date: formatDateForInput(e.wifi.pose.date) },
    depose: { ...e.wifi.depose, date: formatDateForInput(e.wifi.depose.date) }
  },
  radios: {
    besoin: e.radios.besoin,
    pk: e.radios.pk,
    fournisseur: e.radios.fournisseur,
    nombre: e.radios.nombre,
    station_fixe: e.radios.station_fixe,
    pose: { ...e.radios.pose, date: formatDateForInput(e.radios.pose.date) },
    depose: { ...e.radios.depose, date: formatDateForInput(e.radios.depose.date) }
  }
})

const enregistrer = async () => {
  if (!selectedChantier.value || !editEquip.value) return
  setLoader(true)
  try {
    const { error } = await upsertLogistique(selectedChantier.value.id, serializeDates(editEquip.value))
    if (!error) open.value = false
  } finally {
    setLoader(false)
  }
}

const DEFAULT_REF_SLOT = { status: 0, date: null, commentaire: '' }

// Matériels (imprimante / box) à afficher dans le calendrier du poste actif
const calendarItems = computed(() => {
  if (isReseau.value) {
    return boxes.value.map((b) => ({ id: b.id, identification: b.identification, name: b.nom || b.serie || `Box #${b.id}` }))
  }
  return imprimantes.value.map((p) => ({
    id: p.id,
    identification: p.identification,
    name: [p.marque, p.model].filter(Boolean).join(' ') || `Imprimante #${p.id}`
  }))
})

// Assigner un matériel à un chantier (depuis le calendrier)
const assignPoste = async ({ itemId, chantierId }) => {
  const key = activeType.value // 'imprimante' | 'wifi'
  const card = cards.value.find((c) => c.id === chantierId)
  if (!card) return
  const e = normalizeEquipements(card.equipements)
  // Nouveau matériel => on repart d'un état "à installer"
  e[key] = { besoin: true, ids: [itemId], pose: { ...DEFAULT_REF_SLOT }, depose: { ...DEFAULT_REF_SLOT } }
  setLoader(true)
  try {
    await upsertLogistique(chantierId, serializeDates(e))
  } finally {
    setLoader(false)
  }
}

// Retirer un matériel d'un chantier (depuis le calendrier)
const removePoste = async ({ itemId, chantierId }) => {
  const key = activeType.value
  const card = cards.value.find((c) => c.id === chantierId)
  if (!card) return
  const e = normalizeEquipements(card.equipements)
  e[key] = {
    besoin: e[key].besoin,
    ids: e[key].ids.filter((id) => id !== itemId),
    pose: { ...DEFAULT_REF_SLOT },
    depose: { ...DEFAULT_REF_SLOT }
  }
  setLoader(true)
  try {
    await upsertLogistique(chantierId, serializeDates(e))
  } finally {
    setLoader(false)
  }
}

const loadData = async () => {
  setLoader(true)
  try {
    await Promise.all([getChantiers(), getImprimantes(), getBoxes(), getAllWeekends()])
    const ids = getChantiersNonTermines.value.map((c) => c.id)
    await getLogistiqueByChantierIds(ids)
  } finally {
    setLoader(false)
  }
}

onMounted(loadData)
</script>

<template>
  <AppPageLayout class="print:hidden">
    <!-- Sidebar : rubriques par équipement -->
    <template #sidebar>
      <div class="space-y-4">
        <div class="flex flex-col">
          <div class="text-primary-800 text-center font-[Bangers] text-3xl font-bold tracking-wider dark:text-white">
            Logistique
          </div>
          <span class="text-primary-600 text-center text-sm">Par équipement</span>
        </div>

        <div class="flex flex-col gap-1.5 overflow-y-auto pr-1 pb-8">
          <div
            v-for="t in types"
            :key="t.key"
            @click="activeType = t.key"
            class="group relative cursor-pointer overflow-hidden rounded-lg border p-3 transition-all duration-200"
            :class="
              activeType === t.key
                ? 'border-primary-700/30 bg-linear-to-br from-slate-700 to-slate-900 shadow-lg'
                : 'hover:border-primary-700/30 border-primary-200 bg-white hover:shadow-lg dark:bg-slate-900'
            ">
            <div
              class="from-secondary-400 to-secondary-500 absolute top-0 left-0 h-full w-1 bg-linear-to-t transition-all duration-200"
              :class="activeType === t.key ? '' : 'scale-y-0 group-hover:scale-y-100'"></div>

            <div class="flex items-center gap-3">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200"
                :class="
                  activeType === t.key
                    ? 'bg-primary-500/20 text-secondary-300'
                    : 'bg-primary-700/10 text-primary-600 group-hover:bg-primary-700/20'
                ">
                <Icon :name="t.icon" size="18" />
              </div>

              <div class="min-w-0 flex-1">
                <div
                  class="text-sm font-medium transition-colors duration-200"
                  :class="activeType === t.key ? 'text-white' : 'text-primary-700 dark:text-gray-200'">
                  {{ t.label }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Contenu : chantiers de la rubrique active -->
    <template #default>
      <div class="h-full overflow-auto p-4">
        <!-- En-tête -->
        <div class="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <AppTitleMain :title="activeMeta.label" :description="summary" />
          <div class="flex w-full items-center gap-2 lg:w-auto">
            <AppInputSearch v-model="search" class="w-full lg:max-w-xs" placeholder="Rechercher un chantier ..." />
            <button
              type="button"
              @click="openPrintPage"
              class="group flex shrink-0 items-center justify-center gap-2 rounded-lg bg-linear-to-r from-slate-700 to-gray-800 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all duration-300 hover:from-slate-600 hover:to-gray-700 dark:from-slate-600 dark:to-gray-700 dark:hover:from-slate-500 dark:hover:to-gray-600"
              :title="`Imprimer : ${activeMeta.label}`">
              <Icon name="lucide:printer" size="18" class="transition-transform duration-300 group-hover:scale-110" />
              <span class="hidden sm:inline">Imprimer</span>
            </button>
          </div>
        </div>

        <!-- Calendrier des matériels (imprimante / réseau, façon plan de charge RLT) -->
        <LogistiquePosteCalendrier
          v-if="isRefPoste"
          :items="calendarItems"
          :chantiers="cards"
          :poste-key="activeType"
          :title="isImprimante ? 'Calendrier des imprimantes' : 'Calendrier des box réseau'"
          class="mb-6"
          @assign="assignPoste"
          @remove="removePoste"
          @edit="openEditor" />

        <!-- Calendrier des chantiers à installer ou en place (base vie / radio) -->
        <LogistiqueChantierCalendrier
          v-if="isBaseVie || isRadio"
          :chantiers="cards"
          :poste-key="activeType"
          :title="isBaseVie ? 'Calendrier des bases vie' : 'Calendrier des radios'"
          class="mb-6"
          @edit="openEditor" />

        <!-- Tableau dense des chantiers -->
        <div class="border-primary-200 overflow-hidden rounded-xl border bg-white dark:bg-slate-900">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr
                  class="text-primary-500 border-primary-200 border-b text-left text-xs uppercase dark:border-slate-700">
                  <th class="px-4 py-3 font-medium">Chantier</th>
                  <th class="px-4 py-3 font-medium whitespace-nowrap">Début du chantier</th>
                  <th class="px-4 py-3 font-medium">Statut</th>
                  <th v-if="isBaseVie" class="px-4 py-3 font-medium">VAC</th>
                  <th v-if="isBaseVie" class="px-4 py-3 font-medium">ALGECO</th>
                  <th v-if="isBaseVie" class="px-4 py-3 font-medium whitespace-nowrap">Groupe élec.</th>
                  <th v-if="isRefPoste" class="px-4 py-3 font-medium">{{ itemsColLabel }}</th>
                  <th v-if="isRadio" class="px-4 py-3 font-medium">Fourniture</th>
                  <th v-if="isRadio" class="px-4 py-3 font-medium">Nombre</th>
                  <th v-if="isRadio" class="px-4 py-3 font-medium whitespace-nowrap">Station fixe</th>
                  <th v-if="isRadio" class="px-4 py-3 font-medium whitespace-nowrap">PK couverture</th>
                  <th v-if="!isRefPoste" class="px-4 py-3 font-medium">Commentaire</th>
                  <th v-if="!isRefPoste" class="px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="section in displaySections" :key="section.label || 'all'">
                  <!-- En-tête de section (base vie) — cliquable pour replier/déplier -->
                  <tr
                    v-if="section.label"
                    @click="toggleSection(section.label)"
                    class="bg-primary-100 hover:bg-primary-200/70 border-primary-200 cursor-pointer border-y transition-colors select-none dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
                    <td :colspan="colCount" class="px-4 py-2.5">
                      <div class="flex items-center gap-2">
                        <Icon
                          name="lucide:chevron-down"
                          size="16"
                          class="text-primary-500 transition-transform duration-200"
                          :class="collapsed[section.label] ? '-rotate-90' : ''" />
                        <span class="text-primary-700 text-sm font-semibold tracking-wide uppercase dark:text-gray-200">
                          {{ section.label }}
                        </span>
                        <span
                          class="bg-primary-700/10 text-primary-600 ml-1 rounded-full px-2 py-0.5 text-xs font-bold dark:bg-slate-700 dark:text-gray-300">
                          {{ section.items.length }}
                        </span>
                      </div>
                    </td>
                  </tr>

                  <!-- Lignes de la section -->
                  <tr
                    v-for="r in section.items"
                    v-show="!collapsed[section.label]"
                    :key="r.card.id"
                    @click="openEditor(r.card)"
                    class="border-primary-100 hover:bg-primary-50 cursor-pointer border-b transition-colors dark:border-slate-800 dark:hover:bg-slate-800">
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2.5">
                        <span class="h-2 w-2 shrink-0 rounded-full" :class="r.dot"></span>
                        <span class="text-primary-400 text-xs">{{ r.card.compte }}</span>
                        <span class="text-primary-800 font-medium dark:text-gray-100">{{ r.card.name }}</span>
                      </div>
                    </td>
                    <td class="text-primary-500 px-4 py-3 whitespace-nowrap">{{ r.start || '—' }}</td>
                    <td class="px-4 py-3">
                      <span class="rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap" :class="r.cls">
                        {{ r.label }}
                      </span>
                    </td>
                    <td v-if="isBaseVie" class="px-4 py-3 whitespace-nowrap">
                      <span
                        v-if="r.vac"
                        class="bg-primary-100 text-primary-700 rounded-md px-2 py-0.5 text-xs font-medium dark:bg-slate-700 dark:text-gray-200">
                        {{ r.vac }}
                      </span>
                      <span v-else class="text-primary-300">—</span>
                    </td>
                    <td v-if="isBaseVie" class="text-primary-600 px-4 py-3 whitespace-nowrap dark:text-gray-300">
                      <span v-if="r.algeco">{{ r.algeco }}&nbsp;mod.</span>
                      <span v-else class="text-primary-300">—</span>
                    </td>
                    <td v-if="isBaseVie" class="px-4 py-3 whitespace-nowrap">
                      <Icon
                        v-if="r.ge"
                        name="lucide:fuel"
                        size="18"
                        class="text-amber-600 dark:text-amber-400"
                        title="Groupe électrogène" />
                      <span v-else class="text-primary-300">—</span>
                    </td>
                    <td v-if="isRefPoste" class="px-4 py-3">
                      <div v-if="r.refIds.length" class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <span v-for="id in r.refIds" :key="id" class="inline-flex items-center gap-1.5">
                          <span
                            v-if="refItemById[id]?.identification"
                            class="rounded bg-teal-600 px-1.5 py-0.5 font-mono text-xs font-semibold text-white">
                            {{ refItemById[id].identification }}
                          </span>
                          <span class="text-primary-600 text-xs dark:text-gray-300">{{ refItemLabel(id) }}</span>
                        </span>
                      </div>
                      <span v-else class="text-primary-300">—</span>
                    </td>
                    <td v-if="isRadio" class="px-4 py-3 whitespace-nowrap">
                      <span
                        v-if="r.fournisseur"
                        class="bg-primary-100 text-primary-700 rounded-md px-2 py-0.5 text-xs font-medium dark:bg-slate-700 dark:text-gray-200">
                        {{ r.fournisseur }}
                      </span>
                      <span v-else class="text-primary-300">—</span>
                    </td>
                    <td v-if="isRadio" class="text-primary-600 px-4 py-3 whitespace-nowrap dark:text-gray-300">
                      <span v-if="r.nombre">{{ r.nombre }}</span>
                      <span v-else class="text-primary-300">—</span>
                    </td>
                    <td v-if="isRadio" class="px-4 py-3 whitespace-nowrap">
                      <Icon
                        v-if="r.stationFixe"
                        name="lucide:radio-tower"
                        size="18"
                        class="text-secondary-600 dark:text-secondary-400"
                        title="Station fixe" />
                      <span v-else class="text-primary-300">—</span>
                    </td>
                    <td v-if="isRadio" class="text-primary-600 px-4 py-3 dark:text-gray-300">
                      <span v-if="r.pk" class="block max-w-56 truncate" :title="r.pk">{{ r.pk }}</span>
                      <span v-else class="text-primary-300">—</span>
                    </td>
                    <td v-if="!isRefPoste" class="px-4 py-3">
                      <span class="text-primary-600 block max-w-[16rem] truncate dark:text-gray-300" :title="r.comment">
                        {{ r.comment || '—' }}
                      </span>
                    </td>
                    <td v-if="!isRefPoste" class="text-primary-500 px-4 py-3 whitespace-nowrap">{{ r.date || '—' }}</td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <div v-if="!rows.length" class="text-primary-400 p-8 text-center text-sm">Aucun chantier</div>
        </div>

        <!-- Slide-over d'édition : uniquement le poste actif -->
        <AppSlideOver :sideModal="open" :closeSideModal="closeEditor">
          <template #default>
            <AppSlideOverContent v-if="open && editEquip" :closeSideModal="closeEditor">
              <template #header>
                <div class="text-center">
                  <div
                    class="bg-primary-500/20 dark:bg-primary-900/30 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
                    <Icon :name="activeMeta.icon" size="28" class="text-primary-700" />
                  </div>
                  <h2 class="text-xl font-semibold text-gray-900 dark:text-white">{{ selectedChantier?.name }}</h2>
                  <p class="text-primary-500 text-sm">{{ selectedChantier?.compte }} · {{ activeMeta.label }}</p>
                </div>
              </template>

              <template #default>
                <div class="flex flex-col gap-6">
                  <!-- BASE VIE -->
                  <template v-if="activeType === 'base_vie'">
                    <div class="grid grid-cols-3 gap-2">
                      <button
                        v-for="opt in besoinOptions"
                        :key="String(opt.value)"
                        type="button"
                        @click="editEquip.base_vie.besoin = opt.value"
                        class="rounded-lg border px-3 py-2 text-sm font-medium transition-colors"
                        :class="
                          editEquip.base_vie.besoin === opt.value
                            ? 'border-primary-500 bg-primary-600 text-white'
                            : 'border-primary-200 text-primary-600 hover:bg-primary-100 dark:hover:bg-slate-800'
                        ">
                        {{ opt.label }}
                      </button>
                    </div>

                    <template v-if="editEquip.base_vie.besoin === true">
                      <!-- POSE -->
                      <div class="border-primary-200 space-y-3 rounded-lg border p-4 dark:border-slate-700">
                        <div class="flex items-center justify-between">
                          <span class="font-medium">Pose</span>
                          <AppSwitch v-model="posee" label="Posée" />
                        </div>
                        <AppDatePicker
                          v-model="editEquip.base_vie.pose.date"
                          title="Date de pose"
                          placeholder="Sélectionnez une date"
                          clearable />
                        <div class="grid grid-cols-3 gap-3">
                          <div>
                            <label
                              class="text-primary-700 mb-1 flex items-center gap-1.5 text-xs font-medium dark:text-gray-300">
                              <Icon name="lucide:container" size="14" class="text-primary-500" />
                              VAC
                            </label>
                            <AppSelect
                              v-model="editEquip.base_vie.modules.vac"
                              :options="vacOptions"
                              placeholder="Aucun"
                              nullable />
                          </div>
                          <div>
                            <label
                              class="text-primary-700 mb-1 flex items-center gap-1.5 text-xs font-medium dark:text-gray-300">
                              <Icon name="lucide:boxes" size="14" class="text-primary-500" />
                              ALGECO
                            </label>
                            <input
                              v-model.number="editEquip.base_vie.modules.algeco"
                              type="number"
                              min="0"
                              class="border-primary-300 text-primary-700 focus:border-primary-500 focus:ring-primary-500 w-full rounded-md border bg-white px-3 py-1.5 text-sm focus:ring-1 focus:outline-none dark:bg-slate-900" />
                          </div>
                          <div>
                            <label
                              class="text-primary-700 mb-1 flex items-center gap-1.5 text-xs font-medium dark:text-gray-300">
                              <Icon name="lucide:fuel" size="14" class="text-primary-500" />
                              Groupe élec.
                            </label>
                            <div class="flex h-[34px] items-center">
                              <AppSwitch v-model="editEquip.base_vie.modules.groupe_electrogene" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label class="text-primary-700 mb-1 block text-xs font-medium dark:text-gray-300">
                            Commentaire
                          </label>
                          <textarea
                            v-model="editEquip.base_vie.pose.commentaire"
                            class="border-primary-300 text-primary-700 focus:border-primary-500 focus:ring-primary-500 h-20 w-full resize-y rounded-lg border bg-white p-3 text-sm focus:ring-1 focus:outline-none dark:bg-slate-900"
                            placeholder="Remarque..."></textarea>
                        </div>
                      </div>

                      <!-- DÉPOSE -->
                      <div class="border-primary-200 space-y-3 rounded-lg border p-4 dark:border-slate-700">
                        <div class="flex items-center justify-between">
                          <span class="font-medium">Dépose</span>
                          <AppSwitch v-model="deposee" label="Déposée" />
                        </div>
                        <AppDatePicker
                          v-model="editEquip.base_vie.depose.date"
                          title="Date de dépose"
                          placeholder="Sélectionnez une date"
                          clearable />
                        <div>
                          <label class="text-primary-700 mb-1 block text-xs font-medium dark:text-gray-300">
                            Commentaire
                          </label>
                          <textarea
                            v-model="editEquip.base_vie.depose.commentaire"
                            class="border-primary-300 text-primary-700 focus:border-primary-500 focus:ring-primary-500 h-20 w-full resize-y rounded-lg border bg-white p-3 text-sm focus:ring-1 focus:outline-none dark:bg-slate-900"
                            placeholder="Remarque..."></textarea>
                        </div>
                      </div>
                    </template>
                    <div
                      v-else-if="editEquip.base_vie.besoin === false"
                      class="rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
                      Pas de base vie sur ce chantier.
                    </div>
                    <div
                      v-else
                      class="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                      <Icon name="lucide:info" size="16" />
                      Indiquez si une base vie est nécessaire sur ce chantier.
                    </div>
                  </template>

                  <!-- IMPRIMANTE : rattachement depuis l'inventaire -->
                  <template v-else-if="activeType === 'imprimante'">
                    <LogistiqueImprimanteSelector v-model="editEquip.imprimante" />
                  </template>

                  <!-- RÉSEAU : rattachement d'une box depuis l'inventaire -->
                  <template v-else-if="activeType === 'wifi'">
                    <LogistiqueBoxSelector v-model="editEquip.wifi" />
                  </template>

                  <!-- RADIO -->
                  <template v-else>
                    <LogistiqueRadioEditor v-model="editEquip.radios" />
                  </template>
                </div>
              </template>

              <template #footer>
                <div class="flex flex-col items-center justify-end gap-2 lg:flex-row">
                  <AppButtonValidated type="button" theme="cancel" @click="closeEditor" class="w-full lg:w-auto">
                    <template #default>
                      <span class="flex items-center gap-2">
                        <Icon name="lucide:x" size="16" />
                        Annuler
                      </span>
                    </template>
                  </AppButtonValidated>
                  <AppButtonValidated type="button" theme="primary" @click="enregistrer" class="w-full lg:w-auto">
                    <template #default>
                      <span class="flex items-center gap-2">
                        <Icon name="lucide:save" size="16" />
                        Enregistrer
                      </span>
                    </template>
                  </AppButtonValidated>
                </div>
              </template>
            </AppSlideOverContent>
          </template>
        </AppSlideOver>
      </div>
    </template>
  </AppPageLayout>

  <!-- Vue d'impression : rubrique active, une table par section -->
  <div class="hidden print:block">
    <DashboardPrintLogistique
      :title="activeMeta.label"
      :subtitle="summary"
      :mode="printMode"
      :items-label="itemsColLabel"
      :sections="printSections" />

    <!-- Imprimante / réseau : calendrier des matériels -->
    <LogistiquePosteCalendrier
      v-if="isRefPoste"
      :items="calendarItems"
      :chantiers="cards"
      :poste-key="activeType"
      :title="isImprimante ? 'Calendrier des imprimantes' : 'Calendrier des box réseau'"
      print
      class="mt-6" />

    <!-- Base vie / radio : calendrier des chantiers à installer ou en place -->
    <LogistiqueChantierCalendrier
      v-if="isBaseVie || isRadio"
      :chantiers="cards"
      :poste-key="activeType"
      :title="isBaseVie ? 'Calendrier des bases vie' : 'Calendrier des radios'"
      print
      class="mt-6" />
  </div>
</template>
