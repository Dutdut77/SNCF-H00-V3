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
  {
    key: 'a_installer',
    label: 'À installer',
    cls: 'bg-rust-100 text-rust-700 dark:bg-rust-500/16 dark:text-rust-300',
    dot: 'bg-rust-500'
  },
  {
    key: 'installee',
    label: 'En place',
    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/16 dark:text-emerald-300',
    dot: 'bg-emerald-500'
  },
  {
    key: 'retiree',
    label: 'Retrait',
    cls: 'bg-slate-200 text-slate-700 dark:bg-white/12 dark:text-slate-200',
    dot: 'bg-slate-500'
  },
  {
    key: 'pas_besoin',
    label: 'Aucun besoin',
    cls: 'bg-slate-100 text-slate-500 dark:bg-white/6 dark:text-slate-400',
    dot: 'bg-slate-300 dark:bg-white/30'
  },
  {
    key: 'a_definir',
    label: 'À définir',
    cls: 'bg-ochre-100 text-ochre-700 dark:bg-ochre-400/14 dark:text-ochre-300',
    dot: 'bg-ochre-400'
  }
]
const baseVieGroupByKey = Object.fromEntries(BASE_VIE_GROUPS.map((g, i) => [g.key, { ...g, order: i }]))

// Statuts radio : mêmes catégories que la base vie (cycle pose -> dépose)
const RADIO_GROUPS = [
  {
    key: 'a_installer',
    label: 'À installer',
    cls: 'bg-rust-100 text-rust-700 dark:bg-rust-500/16 dark:text-rust-300',
    dot: 'bg-rust-500'
  },
  {
    key: 'installee',
    label: 'En place',
    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/16 dark:text-emerald-300',
    dot: 'bg-emerald-500'
  },
  {
    key: 'retiree',
    label: 'Retirée',
    cls: 'bg-slate-200 text-slate-700 dark:bg-white/12 dark:text-slate-200',
    dot: 'bg-slate-500'
  },
  {
    key: 'pas_besoin',
    label: 'Aucun besoin',
    cls: 'bg-slate-100 text-slate-500 dark:bg-white/6 dark:text-slate-400',
    dot: 'bg-slate-300 dark:bg-white/30'
  },
  {
    key: 'a_definir',
    label: 'À définir',
    cls: 'bg-ochre-100 text-ochre-700 dark:bg-ochre-400/14 dark:text-ochre-300',
    dot: 'bg-ochre-400'
  }
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
//  radio => 8 (… Fourniture, Radios (nombre + station fixe), PK, Commentaire, Date)
const colCount = computed(() => (isRefPoste.value ? 4 : 8))

// Résolution des matériels (imprimante / box) selon la rubrique active
const refItemById = computed(() => (isReseau.value ? boxById.value : imprimanteById.value))
const refItemLabel = (id) => {
  const it = refItemById.value[id]
  if (!it) return `#${id}`
  return isReseau.value
    ? it.nom || it.serie || `Box #${id}`
    : [it.marque, it.model].filter(Boolean).join(' ') || `#${id}`
}
const itemsColLabel = computed(() => (isImprimante.value ? 'Imprimantes' : 'Box'))

// Statuts génériques (imprimante / réseau) : libellés + couleurs + ordre
// Même cycle besoin (null/true/false) que la base vie / radio, avec en plus « À équiper »
// (besoin exprimé mais aucun matériel rattaché).
const REF_GROUPS = [
  {
    key: 'a_installer',
    label: 'À installer',
    cls: 'bg-rust-100 text-rust-700 dark:bg-rust-500/16 dark:text-rust-300',
    dot: 'bg-rust-500'
  },
  {
    key: 'installee',
    label: 'Installée',
    cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/16 dark:text-emerald-300',
    dot: 'bg-emerald-500'
  },
  {
    key: 'retiree',
    label: 'Retirée',
    cls: 'bg-slate-200 text-slate-700 dark:bg-white/12 dark:text-slate-200',
    dot: 'bg-slate-500'
  },
  {
    key: 'a_equiper',
    label: 'À équiper',
    cls: 'bg-ochre-100 text-ochre-700 dark:bg-ochre-400/14 dark:text-ochre-300',
    dot: 'bg-ochre-400'
  },
  {
    key: 'pas_besoin',
    label: 'Aucun besoin',
    cls: 'bg-slate-100 text-slate-500 dark:bg-white/6 dark:text-slate-400',
    dot: 'bg-slate-300 dark:bg-white/30'
  },
  {
    key: 'a_definir',
    label: 'À définir',
    cls: 'bg-ochre-100 text-ochre-700 dark:bg-ochre-400/14 dark:text-ochre-300',
    dot: 'bg-ochre-400'
  }
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
const A_INSTALLER_GRIS = {
  cls: 'bg-slate-100 text-slate-500 dark:bg-white/6 dark:text-slate-400',
  dot: 'bg-slate-300 dark:bg-white/30'
}

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

// Dépli des sections (clé = label de section). Par défaut tout est replié : une section
// qui apparaît (même après un chargement en plusieurs temps) reste repliée tant qu'on ne
// l'a pas explicitement dépliée.
const expanded = reactive({})
const toggleSection = (label) => {
  if (label) expanded[label] = !expanded[label]
}

// Changement de rubrique : on referme tout
watch(activeType, () => {
  Object.keys(expanded).forEach((k) => delete expanded[k])
})

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

// Barre latérale : pour chaque rubrique, les chantiers qui attendent une action (à installer ou à équiper)
const nbAAgir = computed(() =>
  Object.fromEntries(
    types.map((t) => [
      t.key,
      cards.value.filter((c) => {
        const e = c.equipements
        if (t.key === 'base_vie') return baseVieBucket(e) === 'a_installer'
        if (t.key === 'radios') return radioBucket(e.radios) === 'a_installer'
        return ['a_installer', 'a_equiper'].includes(refBucket(e[t.key]))
      }).length
    ])
  )
)
// Légende de la rubrique active : ses statuts, dans l'ordre des sections
const legende = computed(() => (isBaseVie.value ? BASE_VIE_GROUPS : isRefPoste.value ? REF_GROUPS : RADIO_GROUPS))

// --- Impression (rubrique active, une table par section) ---
const printMode = computed(() => (isBaseVie.value ? 'base_vie' : isRefPoste.value ? 'ref' : 'radio'))
const printSections = computed(() =>
  displaySections.value
    // imprimante / réseau : on n'imprime pas la section "Aucun besoin" (chantiers sans besoin)
    .map((s) => ({
      label: s.label,
      items: isRefPoste.value ? s.items.filter((r) => r.bucket !== 'pas_besoin') : s.items
    }))
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
        items: (r.refIds || []).map((id) => ({
          ident: refItemById.value[id]?.identification || null,
          label: refItemLabel(id)
        })),
        fournisseur: r.fournisseur,
        nombre: r.nombre,
        stationFixe: r.stationFixe,
        pk: r.pk,
        comment: r.comment,
        date: r.date
      }))
    }))
)
// Le bloc d'impression est masqué à l'écran : lancerImpression charge d'abord ses polices
const openPrintPage = () => lancerImpression()

// Toutes les rubriques affichent un calendrier (large) → impression en paysage.
const printPageCss =
  '@media print { @page { size: A4 landscape; margin: 8mm } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important } }'
useHead({ style: [{ key: 'logistique-print', innerHTML: printPageCss }] })

// --- Édition (uniquement le poste actif ; les autres postes restent inchangés) ---
const etatInitial = ref('')
const openEditor = (card) => {
  selectedChantier.value = card
  editEquip.value = normalizeEquipements(card.equipements) // copie de travail isolée (objet neuf)
  etatInitial.value = JSON.stringify(editEquip.value)
  open.value = true
}
// Saisie en cours : la fermeture demande confirmation
const ficheModifiee = computed(
  () => open.value && !!editEquip.value && JSON.stringify(editEquip.value) !== etatInitial.value
)
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
    return boxes.value.map((b) => ({
      id: b.id,
      identification: b.identification,
      name: b.nom || b.serie || `Box #${b.id}`
    }))
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
  <AppPageLayout v4 class="print:hidden">
    <template #entete>
      <AppPageHero title="Logistique" :description="`${activeMeta.label} : ${summary}`" illustration="chantiers" />
    </template>

    <!-- ============ Barre latérale : équipements, légende ============ -->
    <template #sidebar>
      <div class="flex flex-col gap-5 pb-6 lg:pt-2">
        <!-- Synthèse : même carte d'accent que les autres pages -->
        <div class="bg-bandeau rounded-xl px-4 py-3.5 text-center shadow-[0_10px_24px_-12px_rgb(43_4_35/0.45)]">
          <p class="font-traverse text-[1.3rem] leading-tight tracking-[0.03em] text-white">
            {{ cards.length }} chantier{{ cards.length > 1 ? 's' : '' }}
          </p>
          <p class="mt-1 text-xs text-white/80">en cours, hors externes</p>
        </div>

        <nav class="flex flex-col gap-1" aria-label="Équipements">
          <p class="px-3 pb-1" :class="PANNEAU_TITRE">Équipements</p>
          <button
            v-for="t in types"
            :key="t.key"
            type="button"
            class="focus-visible:outline-secondary-500 relative flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            :class="panneauItem(activeType === t.key)"
            :aria-pressed="activeType === t.key"
            @click="activeType = t.key">
            <Icon :name="t.icon" size="18" class="shrink-0" :class="panneauIcone(activeType === t.key)" />
            <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ t.label }}</span>
            <span
              v-if="nbAAgir[t.key]"
              class="inline-flex h-5.5 min-w-6.5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold"
              :class="panneauBadge(activeType === t.key)"
              :title="`${nbAAgir[t.key]} chantier(s) à installer ou à équiper`">
              {{ nbAAgir[t.key] }}
            </span>
          </button>
        </nav>

        <section class="border-rule border-t px-3 pt-4" aria-label="Légende">
          <p class="pb-2.5" :class="PANNEAU_TITRE">Statuts</p>
          <ul class="text-ink-soft grid grid-cols-2 gap-x-3 gap-y-2 text-[13px]">
            <li v-for="g in legende" :key="g.key" class="flex items-center gap-2">
              <span class="size-2 shrink-0 rounded-full" :class="g.dot" />
              {{ g.label }}
            </li>
          </ul>
          <p v-if="isBaseVie" class="text-ink-soft mt-3 text-xs">
            « À installer » reste gris tant que le chantier démarre dans plus d'un mois.
          </p>
        </section>
      </div>
    </template>

    <!-- ============ Contenu : calendrier et tableau de la rubrique active ============ -->
    <template #default>
      <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 lg:px-8 lg:pt-4 lg:pb-6">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
          <AppInputSearch
            v-model="search"
            boxed
            dense
            class="w-full lg:max-w-sm"
            placeholder="Rechercher un chantier…" />
          <AppButtonValidated
            type="button"
            theme="outline"
            class="max-lg:hidden lg:ml-auto"
            :title="`Imprimer : ${activeMeta.label}`"
            @click="openPrintPage">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:printer" size="16" />
                Imprimer
              </span>
            </template>
          </AppButtonValidated>
        </div>

        <!-- Calendrier des matériels (imprimante / réseau, façon plan de charge) -->
        <LogistiquePosteCalendrier
          v-if="isRefPoste"
          :items="calendarItems"
          :chantiers="cards"
          :poste-key="activeType"
          :title="isImprimante ? 'Calendrier des imprimantes' : 'Calendrier des box réseau'"
          @assign="assignPoste"
          @remove="removePoste"
          @edit="openEditor" />

        <!-- Calendrier des chantiers à installer ou en place (base vie / radio) -->
        <LogistiqueChantierCalendrier
          v-if="isBaseVie || isRadio"
          :chantiers="cards"
          :poste-key="activeType"
          :title="isBaseVie ? 'Calendrier des bases vie' : 'Calendrier des radios'"
          @edit="openEditor" />

        <!-- Tableau des chantiers, par sections repliables -->
        <div class="surface-card overflow-hidden rounded-xl">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-table-head table-head-text shadow-[inset_0_-1px_0_var(--color-rule)]">
                <tr class="text-left text-[0.8125rem]">
                  <th class="px-3 py-2.5">Chantier</th>
                  <th class="px-3 py-2.5 whitespace-nowrap">Début</th>
                  <th class="px-3 py-2.5">Statut</th>
                  <th v-if="isBaseVie" class="px-3 py-2.5">VAC</th>
                  <th v-if="isBaseVie" class="px-3 py-2.5">ALGECO</th>
                  <th v-if="isBaseVie" class="px-3 py-2.5 whitespace-nowrap" title="Groupe électrogène">Groupe</th>
                  <th v-if="isRefPoste" class="px-3 py-2.5">{{ itemsColLabel }}</th>
                  <th v-if="isRadio" class="px-3 py-2.5">Fourniture</th>
                  <th v-if="isRadio" class="px-3 py-2.5" title="Nombre de radios, et station fixe">Radios</th>
                  <th v-if="isRadio" class="px-3 py-2.5 whitespace-nowrap" title="PK de couverture radio">PK</th>
                  <th v-if="!isRefPoste" class="px-3 py-2.5">Commentaire</th>
                  <th v-if="!isRefPoste" class="px-3 py-2.5">Date</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="section in displaySections" :key="section.label || 'all'">
                  <!-- En-tête de section : replier / déplier -->
                  <tr
                    v-if="section.label"
                    class="border-rule cursor-pointer border-t bg-slate-50 transition-colors select-none hover:bg-slate-100 dark:bg-white/4 dark:hover:bg-white/6"
                    :aria-expanded="!!expanded[section.label]"
                    @click="toggleSection(section.label)">
                    <td :colspan="colCount" class="px-3 py-2.5">
                      <div class="flex items-center gap-2">
                        <Icon
                          name="lucide:chevron-right"
                          size="16"
                          class="text-slate-400 transition-transform duration-200"
                          :class="{ 'rotate-90': expanded[section.label] }" />
                        <span class="text-ink text-sm font-semibold">{{ section.label }}</span>
                        <span
                          class="rounded-full bg-slate-200 px-1.5 text-[11px] font-bold text-slate-600 dark:bg-white/10 dark:text-white/80">
                          {{ section.items.length }}
                        </span>
                      </div>
                    </td>
                  </tr>

                  <tr
                    v-for="r in section.items"
                    v-show="!section.label || expanded[section.label]"
                    :key="r.card.id"
                    class="border-rule cursor-pointer border-t transition-colors hover:bg-taupe-100 dark:hover:bg-taupe-400/8"
                    @click="openEditor(r.card)">
                    <td class="px-3 py-3">
                      <div class="flex items-center gap-2.5">
                        <span class="size-2 shrink-0 rounded-full" :class="r.dot" />
                        <span
                          class="shrink-0 rounded bg-taupe-100 px-2 py-0.5 text-xs font-semibold text-taupe-700 tabular-nums ring-1 ring-taupe-200 ring-inset dark:bg-taupe-400/15 dark:text-taupe-200 dark:ring-0">
                          {{ r.card.compte }}
                        </span>
                        <span class="text-ink line-clamp-2 min-w-44 font-medium">{{ r.card.name }}</span>
                      </div>
                    </td>
                    <td class="text-ink-soft px-3 py-3 whitespace-nowrap tabular-nums">{{ r.start || '—' }}</td>
                    <td class="px-3 py-3">
                      <span class="rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap" :class="r.cls">
                        {{ r.label }}
                      </span>
                    </td>
                    <td v-if="isBaseVie" class="px-3 py-3 whitespace-nowrap">
                      <span
                        v-if="r.vac"
                        class="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-white/10 dark:text-slate-200">
                        {{ r.vac }}
                      </span>
                      <span v-else class="text-slate-300 dark:text-white/25">—</span>
                    </td>
                    <td v-if="isBaseVie" class="text-ink-soft px-3 py-3 whitespace-nowrap">
                      <span v-if="r.algeco">{{ r.algeco }}&nbsp;mod.</span>
                      <span v-else class="text-slate-300 dark:text-white/25">—</span>
                    </td>
                    <td v-if="isBaseVie" class="px-3 py-3 whitespace-nowrap">
                      <span v-if="r.ge" class="flex" title="Groupe électrogène">
                        <Icon name="lucide:fuel" size="18" class="text-amber-600 dark:text-amber-400" />
                      </span>
                      <span v-else class="text-slate-300 dark:text-white/25">—</span>
                    </td>
                    <td v-if="isRefPoste" class="px-3 py-3">
                      <div v-if="r.refIds.length" class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <span v-for="id in r.refIds" :key="id" class="inline-flex items-center gap-1.5">
                          <span
                            v-if="refItemById[id]?.identification"
                            class="rounded bg-teal-600 px-1.5 py-0.5 font-mono text-xs font-semibold text-white">
                            {{ refItemById[id].identification }}
                          </span>
                          <span class="text-ink-soft text-xs">{{ refItemLabel(id) }}</span>
                        </span>
                      </div>
                      <span v-else class="text-slate-300 dark:text-white/25">—</span>
                    </td>
                    <td v-if="isRadio" class="px-3 py-3 whitespace-nowrap">
                      <span
                        v-if="r.fournisseur"
                        class="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-white/10 dark:text-slate-200">
                        {{ r.fournisseur }}
                      </span>
                      <span v-else class="text-slate-300 dark:text-white/25">—</span>
                    </td>
                    <!-- Nombre de radios, antenne si une station fixe est prévue -->
                    <td v-if="isRadio" class="text-ink-soft px-3 py-3 whitespace-nowrap">
                      <span v-if="r.nombre || r.stationFixe" class="inline-flex items-center gap-1.5">
                        {{ r.nombre || '' }}
                        <span v-if="r.stationFixe" class="flex" title="Station fixe">
                          <Icon
                            name="lucide:radio-tower"
                            size="16"
                            class="text-secondary-600 dark:text-secondary-300" />
                        </span>
                      </span>
                      <span v-else class="text-slate-300 dark:text-white/25">—</span>
                    </td>
                    <td v-if="isRadio" class="text-ink-soft px-3 py-3">
                      <span v-if="r.pk" class="block max-w-40 truncate" :title="r.pk">{{ r.pk }}</span>
                      <span v-else class="text-slate-300 dark:text-white/25">—</span>
                    </td>
                    <td v-if="!isRefPoste" class="px-3 py-3">
                      <span class="text-ink-soft block max-w-40 truncate xl:max-w-48" :title="r.comment">
                        {{ r.comment || '—' }}
                      </span>
                    </td>
                    <td v-if="!isRefPoste" class="text-ink-soft px-3 py-3 whitespace-nowrap tabular-nums">
                      {{ r.date || '—' }}
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <p v-if="!rows.length" class="text-ink-soft p-8 text-center text-sm">Aucun chantier</p>
        </div>
      </div>

      <!-- ============ Fiche : le poste actif du chantier ============ -->
      <AppSidePanel
        v-slot="{ fermer }"
        :open="open && !!editEquip"
        size="md"
        :label="`${activeMeta.label} ${selectedChantier?.compte ?? ''}`"
        :dirty="ficheModifiee"
        @close="closeEditor">
        <header class="panel-brand shrink-0 px-5 py-5 sm:px-7">
          <div class="flex items-center justify-between gap-3">
            <p class="flex items-center gap-1.5 text-xs font-medium text-white/60">
              <Icon :name="activeMeta.icon" size="14" />
              {{ activeMeta.label }}
            </p>
            <button
              type="button"
              class="flex size-8.5 cursor-pointer items-center justify-center rounded-full border border-white/18 text-white transition-colors hover:border-white/35 hover:bg-white/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="Fermer"
              @click="fermer">
              <Icon name="lucide:x" size="18" />
            </button>
          </div>
          <p class="font-traverse mt-2 text-[2.1rem] leading-none tracking-[0.03em] text-white tabular-nums">
            {{ selectedChantier?.compte || '—' }}
          </p>
          <h2 class="mt-1.5 text-lg leading-snug font-semibold text-white">{{ selectedChantier?.name }}</h2>
        </header>

        <div class="dark:bg-night-900 flex min-h-0 flex-1 flex-col bg-slate-100 pt-5 sm:pt-6">
          <div v-if="editEquip" class="flex-1 space-y-5 overflow-y-auto px-4 pb-5 sm:px-7 sm:pb-6">
            <!-- BASE VIE -->
            <template v-if="activeType === 'base_vie'">
              <section class="surface-card rounded-xl p-5" aria-labelledby="bv-besoin">
                <h3 id="bv-besoin" class="text-ink font-semibold">Besoin</h3>
                <p class="text-ink-soft mt-0.5 mb-3 text-xs">Une base vie est-elle nécessaire sur ce chantier ?</p>
                <div
                  class="dark:bg-night-900 grid grid-cols-3 gap-1 rounded-lg border border-slate-300 bg-white p-1 dark:border-white/15"
                  role="radiogroup"
                  aria-labelledby="bv-besoin">
                  <button
                    v-for="opt in besoinOptions"
                    :key="String(opt.value)"
                    type="button"
                    role="radio"
                    :aria-checked="editEquip.base_vie.besoin === opt.value"
                    class="cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                    :class="
                      editEquip.base_vie.besoin === opt.value
                        ? 'bg-magenta-700 dark:bg-secondary-600 text-white'
                        : 'text-ink-soft hover:bg-magenta-50 hover:text-ink dark:hover:bg-white/6'
                    "
                    @click="editEquip.base_vie.besoin = opt.value">
                    {{ opt.label }}
                  </button>
                </div>
              </section>

              <template v-if="editEquip.base_vie.besoin === true">
                <section class="surface-card space-y-4 rounded-xl p-5" aria-labelledby="bv-pose">
                  <h3 id="bv-pose" class="text-ink font-semibold">Pose</h3>
                  <AppSwitchRow
                    v-model="posee"
                    label="Base vie posée"
                    description="Elle est installée sur le chantier."
                    icon="lucide:circle-check"
                    icon-class="text-emerald-600" />
                  <AppDatePicker
                    v-model="editEquip.base_vie.pose.date"
                    v4
                    title="Date de pose"
                    placeholder="Choisir une date"
                    clearable />
                  <div class="grid grid-cols-2 gap-3">
                    <AppSelect
                      v-model="editEquip.base_vie.modules.vac"
                      v4
                      title="VAC"
                      :options="vacOptions"
                      placeholder="Aucun"
                      nullable />
                    <div>
                      <label for="bv-algeco" class="text-ink mb-1.5 block text-[13px] font-medium">
                        ALGECO (modules)
                      </label>
                      <input
                        id="bv-algeco"
                        v-model.number="editEquip.base_vie.modules.algeco"
                        type="number"
                        min="0"
                        class="form-control h-10 tabular-nums" />
                    </div>
                  </div>
                  <AppSwitchRow
                    v-model="editEquip.base_vie.modules.groupe_electrogene"
                    label="Groupe électrogène"
                    description="La base vie est alimentée par un groupe."
                    icon="lucide:fuel"
                    icon-class="text-amber-600" />
                  <div>
                    <label for="bv-pose-com" class="text-ink mb-1.5 block text-[13px] font-medium">Commentaire</label>
                    <textarea
                      id="bv-pose-com"
                      v-model="editEquip.base_vie.pose.commentaire"
                      rows="3"
                      class="form-control resize-y py-2.5"
                      placeholder="Remarque…" />
                  </div>
                </section>

                <section class="surface-card space-y-4 rounded-xl p-5" aria-labelledby="bv-depose">
                  <h3 id="bv-depose" class="text-ink font-semibold">Dépose</h3>
                  <AppSwitchRow
                    v-model="deposee"
                    label="Base vie déposée"
                    description="Elle a été retirée du chantier."
                    icon="lucide:circle-check"
                    icon-class="text-slate-500" />
                  <AppDatePicker
                    v-model="editEquip.base_vie.depose.date"
                    v4
                    title="Date de dépose"
                    placeholder="Choisir une date"
                    clearable />
                  <div>
                    <label for="bv-depose-com" class="text-ink mb-1.5 block text-[13px] font-medium">Commentaire</label>
                    <textarea
                      id="bv-depose-com"
                      v-model="editEquip.base_vie.depose.commentaire"
                      rows="3"
                      class="form-control resize-y py-2.5"
                      placeholder="Remarque…" />
                  </div>
                </section>
              </template>
              <p
                v-else-if="editEquip.base_vie.besoin === false"
                class="text-ink-soft rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm dark:border-white/15">
                Pas de base vie sur ce chantier.
              </p>
              <p
                v-else
                class="bg-ochre-100 text-ochre-700 dark:bg-ochre-400/14 dark:text-ochre-300 flex items-center gap-2 rounded-xl p-3 text-sm">
                <Icon name="lucide:info" size="16" class="shrink-0" />
                Indiquez si une base vie est nécessaire sur ce chantier.
              </p>
            </template>

            <!-- IMPRIMANTE / RÉSEAU / RADIO : éditeurs dédiés -->
            <section v-else class="surface-card rounded-xl p-5">
              <LogistiqueImprimanteSelector v-if="activeType === 'imprimante'" v-model="editEquip.imprimante" />
              <LogistiqueBoxSelector v-else-if="activeType === 'wifi'" v-model="editEquip.wifi" />
              <LogistiqueRadioEditor v-else v-model="editEquip.radios" />
            </section>
          </div>
        </div>

        <footer class="border-rule bg-card flex shrink-0 items-center justify-end gap-2 border-t px-5 py-4 sm:px-7">
          <AppButtonValidated type="button" theme="outline" @click="fermer">
            <template #default>Annuler</template>
          </AppButtonValidated>
          <AppButtonValidated type="button" theme="brand" :validated="ficheModifiee" @click="enregistrer">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:save" size="16" />
                Enregistrer
              </span>
            </template>
          </AppButtonValidated>
        </footer>
      </AppSidePanel>
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
