<script setup>
const props = defineProps({
  chantier: { type: Object, required: true }
})

const {
  getCommandes,
  createCommande,
  updateCommande,
  deleteCommande,
  getLignes,
  addLigne,
  updateLigne,
  deleteLigne,
} = useCommandesMatieres()

const {
  getEnsemblesCommande,
  addEnsembleToCommande,
  updateEnsembleCommande,
  removeEnsembleFromCommande,
} = useEnsemblesMatieres()

// ─── État global ─────────────────────────────────────────────────────────────
const commandes = ref([])
const loadingCommandes = ref(false)
const selectedCommande = ref(null)
const lignes = ref([])
const ensemblesCommande = ref([])
const loadingLignes = ref(false)

// ─── Modales ──────────────────────────────────────────────────────────────────
const showFormCommande = ref(false)
const editingCommande = ref(null)
const showDeleteCommande = ref(false)
const commandeToDelete = ref(null)
const showDeleteLigne = ref(false)
const ligneToDelete = ref(null)
const showDeleteEnsemble = ref(false)
const ensembleCommandeToDelete = ref(null)

// ─── Sidebar catalogue ────────────────────────────────────────────────────────
const showCatalogue = ref(false)

// ─── Ensembles dépliés ────────────────────────────────────────────────────────
const openEnsembles = ref(new Set())
const toggleEnsemble = (id) => {
  const s = new Set(openEnsembles.value)
  s.has(id) ? s.delete(id) : s.add(id)
  openEnsembles.value = s
}

// ─── Formulaire commande ──────────────────────────────────────────────────────
const formNom = ref('')
const formDescription = ref('')
const savingCommande = ref(false)

const openCreateCommande = () => {
  editingCommande.value = null
  formNom.value = ''
  formDescription.value = ''
  showFormCommande.value = true
}

const openEditCommande = (commande) => {
  editingCommande.value = commande
  formNom.value = commande.nom
  formDescription.value = commande.description || ''
  showFormCommande.value = true
}

const submitCommande = async () => {
  if (!formNom.value.trim()) return
  savingCommande.value = true
  const payload = {
    nom: formNom.value.trim(),
    description: formDescription.value.trim(),
    chantier_id: props.chantier.id,
  }

  if (editingCommande.value) {
    const updated = await updateCommande(editingCommande.value.id, payload)
    if (updated) {
      const idx = commandes.value.findIndex((c) => c.id === updated.id)
      if (idx !== -1) commandes.value[idx] = updated
      if (selectedCommande.value?.id === updated.id) selectedCommande.value = updated
    }
  } else {
    const created = await createCommande(payload)
    if (created) {
      commandes.value.unshift(created)
      await selectCommande(created)
    }
  }
  savingCommande.value = false
  showFormCommande.value = false
}

// ─── Sélection commande ───────────────────────────────────────────────────────
const selectCommande = async (commande) => {
  selectedCommande.value = commande
  showCatalogue.value = false
  openEnsembles.value = new Set()
  loadingLignes.value = true
  ;[lignes.value, ensemblesCommande.value] = await Promise.all([
    getLignes(commande.id),
    getEnsemblesCommande(commande.id),
  ])
  loadingLignes.value = false
}

// ─── Suppression commande ─────────────────────────────────────────────────────
const askDeleteCommande = (commande) => {
  commandeToDelete.value = commande
  showDeleteCommande.value = true
}

const confirmDeleteCommande = async () => {
  if (!commandeToDelete.value) return
  const ok = await deleteCommande(commandeToDelete.value.id)
  if (ok) {
    commandes.value = commandes.value.filter((c) => c.id !== commandeToDelete.value.id)
    if (selectedCommande.value?.id === commandeToDelete.value.id) {
      selectedCommande.value = null
      lignes.value = []
      ensemblesCommande.value = []
    }
  }
  showDeleteCommande.value = false
  commandeToDelete.value = null
}

// ─── Articles directs ─────────────────────────────────────────────────────────
const existingSymboles = computed(() => lignes.value.map((l) => l.numero_symbole))
const existingEnsembleIds = computed(() => ensemblesCommande.value.map((e) => e.ensemble_id))

const handleAddArticle = async ({ article, quantite }) => {
  if (!selectedCommande.value) return
  const ligne = await addLigne(selectedCommande.value.id, article.numero_symbole, quantite)
  if (ligne) lignes.value.push(ligne)
}

const handleUpdateQuantite = async (ligne, value) => {
  const qty = value === '' || value == null ? 0 : Number(value)
  const idx = lignes.value.findIndex((l) => l.id === ligne.id)
  if (idx !== -1) lignes.value[idx] = { ...lignes.value[idx], quantite: qty }
  await updateLigne(ligne.id, { quantite: qty })
}

const handleUpdateNotes = async (ligne, value) => {
  const idx = lignes.value.findIndex((l) => l.id === ligne.id)
  if (idx !== -1) lignes.value[idx] = { ...lignes.value[idx], notes: value }
  await updateLigne(ligne.id, { notes: value })
}

const askDeleteLigne = (ligne) => {
  ligneToDelete.value = ligne
  showDeleteLigne.value = true
}

const confirmDeleteLigne = async () => {
  if (!ligneToDelete.value) return
  const ok = await deleteLigne(ligneToDelete.value.id)
  if (ok) lignes.value = lignes.value.filter((l) => l.id !== ligneToDelete.value.id)
  showDeleteLigne.value = false
  ligneToDelete.value = null
}

// ─── Ensembles ────────────────────────────────────────────────────────────────
const handleAddEnsemble = async ({ ensemble }) => {
  if (!selectedCommande.value) return
  const item = await addEnsembleToCommande(selectedCommande.value.id, ensemble.id)
  if (item) ensemblesCommande.value.push(item)
}

const handleUpdateEnsembleQuantite = async (item, value) => {
  const qty = value === '' || value == null ? 1 : Number(value)
  const idx = ensemblesCommande.value.findIndex((e) => e.id === item.id)
  if (idx !== -1) ensemblesCommande.value[idx] = { ...ensemblesCommande.value[idx], quantite: qty }
  await updateEnsembleCommande(item.id, { quantite: qty })
}

const askDeleteEnsembleCommande = (item) => {
  ensembleCommandeToDelete.value = item
  showDeleteEnsemble.value = true
}

const confirmDeleteEnsembleCommande = async () => {
  if (!ensembleCommandeToDelete.value) return
  const ok = await removeEnsembleFromCommande(ensembleCommandeToDelete.value.id)
  if (ok) ensemblesCommande.value = ensemblesCommande.value.filter((e) => e.id !== ensembleCommandeToDelete.value.id)
  showDeleteEnsemble.value = false
  ensembleCommandeToDelete.value = null
}

// ─── Liste affichée : ensembles en tête, puis articles triés par n° symbole ───
const itemsAffiches = computed(() => {
  const ensembles = ensemblesCommande.value.map((e) => ({ type: 'ensemble', data: e }))
  const articles = [...lignes.value]
    .sort((a, b) => a.numero_symbole.localeCompare(b.numero_symbole))
    .map((l) => ({ type: 'article', data: l }))
  return [...ensembles, ...articles]
})

const hasItems = computed(() => lignes.value.length > 0 || ensemblesCommande.value.length > 0)

// ─── Formatage ────────────────────────────────────────────────────────────────
const fmtPrix = (v) => {
  if (v == null) return '—'
  return Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

const totalEnsemble = (item) => {
  const articlesTotal = (item.ensembles_matieres?.ensembles_matieres_lignes ?? []).reduce((acc, l) => {
    return acc + (l.catalogue_matieres?.prix_ud ?? 0) * (l.quantite || 0)
  }, 0)
  const sousEnsemblesTotal = (item.ensembles_matieres?.ensembles_matieres_sous_ensembles ?? []).reduce((acc, se) => {
    const seTotal = (se.sous_ensemble?.ensembles_matieres_lignes ?? []).reduce((a, l) => {
      return a + (l.catalogue_matieres?.prix_ud ?? 0) * (l.quantite || 0)
    }, 0)
    return acc + seTotal * (se.quantite || 1)
  }, 0)
  return (articlesTotal + sousEnsemblesTotal) * (item.quantite || 1)
}

const totalEstime = computed(() => {
  const articlesTotal = lignes.value.reduce((acc, l) => {
    return acc + (l.catalogue_matieres?.prix_ud ?? 0) * (l.quantite || 0)
  }, 0)
  const ensemblesTotal = ensemblesCommande.value.reduce((acc, e) => acc + totalEnsemble(e), 0)
  return articlesTotal + ensemblesTotal
})

// ─── Chargement initial ───────────────────────────────────────────────────────
onMounted(async () => {
  loadingCommandes.value = true
  commandes.value = await getCommandes(props.chantier.id)
  loadingCommandes.value = false
})
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <!-- Titre -->
    <div class="flex-none border-b border-gray-200 px-4 py-3 dark:border-gray-700">
      <AppTitleMain title="Commandes matières" description="Gestion des listes de commandes par chantier" />
    </div>

    <div class="flex min-h-0 flex-1 overflow-hidden">

    <!-- ── Colonne gauche : liste des commandes ─────────────────────────────── -->
    <aside class="flex w-68 flex-none flex-col border-r border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-gray-200 px-3 py-3 dark:border-gray-700">
        <span class="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Listes
          <span class="ml-1.5 inline-flex items-center justify-center rounded-full bg-gray-200 px-1.5 py-0.5 text-xs font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
            {{ commandes.length }}
          </span>
        </span>
        <button
          type="button"
          class="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white transition hover:bg-blue-700 active:scale-95"
          title="Nouvelle liste"
          @click="openCreateCommande"
        >
          <Icon name="lucide:plus" size="14" />
        </button>
      </div>

      <!-- Loader -->
      <div v-if="loadingCommandes" class="flex items-center justify-center py-10">
        <div class="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>

      <!-- Empty -->
      <div
        v-else-if="commandes.length === 0"
        class="flex flex-col items-center gap-3 px-4 py-12 text-center"
      >
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
          <Icon name="lucide:clipboard-list" size="22" class="text-gray-400" />
        </div>
        <div class="space-y-1">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-300">Aucune liste</p>
          <p class="text-xs text-gray-400">Créez votre première liste</p>
        </div>
        <button
          type="button"
          class="mt-1 flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          @click="openCreateCommande"
        >
          <Icon name="lucide:plus" size="12" />
          Nouvelle liste
        </button>
      </div>

      <!-- Liste -->
      <ul v-else class="flex-1 overflow-y-auto space-y-0.5 p-2">
        <li
          v-for="commande in commandes"
          :key="commande.id"
          class="group relative cursor-pointer rounded-lg px-3 py-2.5 transition-all"
          :class="
            selectedCommande?.id === commande.id
              ? 'bg-white shadow-sm ring-1 ring-blue-200 dark:bg-gray-800 dark:ring-blue-700/50'
              : 'hover:bg-white/80 dark:hover:bg-gray-800/60'
          "
          @click="selectCommande(commande)"
        >
          <!-- Barre de sélection gauche -->
          <span
            v-if="selectedCommande?.id === commande.id"
            class="absolute inset-y-0 left-0 w-0.5 rounded-l-lg bg-blue-500"
          />
          <div class="flex items-center justify-between gap-2">
            <div class="min-w-0 flex-1">
              <p
                class="truncate text-sm font-medium leading-snug"
                :class="
                  selectedCommande?.id === commande.id
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-200'
                "
              >
                {{ commande.nom }}
              </p>
              <p v-if="commande.description" class="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">
                {{ commande.description }}
              </p>
            </div>
            <!-- Actions -->
            <div
              class="flex flex-none items-center gap-0.5 transition-opacity"
              :class="selectedCommande?.id === commande.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
              @click.stop
            >
              <button
                type="button"
                class="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                title="Modifier"
                @click="openEditCommande(commande)"
              >
                <Icon name="lucide:pencil" size="12" />
              </button>
              <button
                type="button"
                class="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                title="Supprimer"
                @click="askDeleteCommande(commande)"
              >
                <Icon name="lucide:trash-2" size="12" />
              </button>
            </div>
          </div>
        </li>
      </ul>
    </aside>

    <!-- ── Zone principale : détail de la commande ──────────────────────────── -->
    <main class="flex min-w-0 flex-1 flex-col overflow-hidden">

      <!-- Aucune commande sélectionnée -->
      <div
        v-if="!selectedCommande"
        class="flex h-full flex-col items-center justify-center gap-3 text-gray-400"
      >
        <Icon name="lucide:mouse-pointer-click" size="48" class="opacity-30" />
        <p class="text-sm">Sélectionnez une liste ou créez-en une nouvelle</p>
        <button
          type="button"
          class="mt-2 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          @click="openCreateCommande"
        >
          <Icon name="lucide:plus" size="16" />
          Nouvelle liste
        </button>
      </div>

      <template v-else>
        <!-- Header de la commande -->
        <div class="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
          <div>
            <h2 class="text-lg font-semibold text-gray-800 dark:text-white">{{ selectedCommande.nom }}</h2>
            <p v-if="selectedCommande.description" class="text-sm text-gray-400">{{ selectedCommande.description }}</p>
          </div>
          <div class="flex items-center gap-2">
            <!-- Total estimé -->
            <div class="hidden rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 sm:block">
              <span class="text-gray-500 dark:text-gray-400">Total estimé : </span>
              <span class="font-semibold text-gray-800 dark:text-white">
                {{ fmtPrix(totalEstime) }}
              </span>
            </div>
            <!-- Bouton toggle catalogue -->
            <button
              type="button"
              :title="showCatalogue ? 'Fermer le catalogue' : 'Ouvrir le catalogue articles'"
              class="flex h-9 w-9 items-center justify-center rounded-lg border transition"
              :class="showCatalogue
                ? 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 dark:border-blue-700/50 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30'
                : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'"
              @click="showCatalogue = !showCatalogue"
            >
              <Icon :name="showCatalogue ? 'lucide:panel-right-close' : 'lucide:plus'" size="16" />
            </button>
          </div>
        </div>

        <!-- Loader lignes -->
        <div v-if="loadingLignes" class="flex items-center justify-center py-16">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>

        <!-- Table des articles -->
        <div v-else class="flex-1 overflow-auto">

          <!-- Empty -->
          <div
            v-if="!hasItems"
            class="flex flex-col items-center gap-3 px-6 py-16 text-center text-gray-400"
          >
            <Icon name="lucide:package-open" size="48" class="opacity-30" />
            <p class="text-sm">Aucun article dans cette liste</p>
            <button
              type="button"
              class="mt-1 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
              @click="showCatalogue = true"
            >
              <Icon name="lucide:package-search" size="16" />
              Parcourir le catalogue
            </button>
          </div>

          <!-- Tableau mixte articles + ensembles -->
          <div v-else>
            <table class="w-full text-sm">
              <thead class="sticky top-0 z-10">
                <tr class="border-y border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/90 backdrop-blur-sm">
                  <th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">N° Symbole</th>
                  <th class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Désignation</th>
                  <th class="px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">UD</th>
                  <th class="w-32 px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Quantité</th>
                  <th class="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Prix unit.</th>
                  <th class="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Total</th>
                  <th class="w-48 px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Notes</th>
                  <th class="w-10 px-2 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(item, i) in itemsAffiches" :key="item.data.id">

                  <!-- ── Ligne article direct ─────────────────────────────── -->
                  <tr
                    v-if="item.type === 'article'"
                    class="group border-t border-gray-100 transition dark:border-gray-700/50"
                    :class="i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'"
                  >
                    <td class="px-4 py-2.5">
                      <span class="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 font-mono text-xs font-semibold text-blue-700 ring-1 ring-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:ring-blue-800/40">
                        {{ item.data.numero_symbole }}
                      </span>
                    </td>
                    <td class="px-4 py-2.5">
                      <p class="text-xs font-medium text-gray-700 dark:text-gray-200">{{ item.data.catalogue_matieres?.description || '—' }}</p>
                      <p v-if="item.data.catalogue_matieres?.famille" class="mt-0.5 text-xs text-gray-400">{{ item.data.catalogue_matieres.famille }}</p>
                    </td>
                    <td class="px-4 py-2.5 text-center">
                      <span class="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                        {{ item.data.catalogue_matieres?.unite_distribution || '—' }}
                      </span>
                    </td>
                    <td class="px-4 py-2.5 text-center">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        :value="item.data.quantite"
                        class="w-24 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-center text-sm font-medium text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        @change="handleUpdateQuantite(item.data, $event.target.value)"
                      />
                    </td>
                    <td class="whitespace-nowrap px-4 py-2.5 text-right text-xs text-gray-500 dark:text-gray-400">{{ fmtPrix(item.data.catalogue_matieres?.prix_ud) }}</td>
                    <td class="whitespace-nowrap px-4 py-2.5 text-right">
                      <span class="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {{ fmtPrix((item.data.catalogue_matieres?.prix_ud ?? 0) * (item.data.quantite || 0)) }}
                      </span>
                    </td>
                    <td class="px-4 py-2.5">
                      <input
                        type="text"
                        :value="item.data.notes"
                        placeholder="Ajouter une note…"
                        class="w-full rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs text-gray-600 outline-none transition placeholder:text-gray-300 hover:border-gray-200 hover:bg-white focus:border-blue-300 focus:bg-white focus:ring-1 focus:ring-blue-100 dark:text-gray-300 dark:placeholder-gray-600 dark:hover:border-gray-600 dark:hover:bg-gray-800 dark:focus:border-blue-600 dark:focus:bg-gray-800"
                        @change="handleUpdateNotes(item.data, $event.target.value)"
                      />
                    </td>
                    <td class="px-2 py-2.5 text-center">
                      <button
                        type="button"
                        class="rounded-md p-1.5 text-gray-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:text-gray-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        title="Supprimer l'article"
                        @click="askDeleteLigne(item.data)"
                      >
                        <Icon name="lucide:trash-2" size="13" />
                      </button>
                    </td>
                  </tr>

                  <!-- ── Ligne header ensemble ────────────────────────────── -->
                  <template v-else>
                    <tr
                      class="group border-t border-gray-200 bg-indigo-50/60 dark:border-gray-600 dark:bg-indigo-900/10"
                    >
                      <!-- Info ensemble (N° Symbole + Désignation + UD) -->
                      <td colspan="3" class="px-4 py-2.5">
                        <div class="flex items-center gap-2">
                          <button
                            type="button"
                            class="flex h-5 w-5 flex-none items-center justify-center rounded text-indigo-500 transition hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                            @click="toggleEnsemble(item.data.id)"
                          >
                            <Icon
                              :name="openEnsembles.has(item.data.id) ? 'lucide:chevron-down' : 'lucide:chevron-right'"
                              size="14"
                            />
                          </button>
                          <Icon name="lucide:layers" size="14" class="flex-none text-indigo-500 dark:text-indigo-400" />
                          <span class="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                            {{ item.data.ensembles_matieres?.nom }}
                          </span>
                          <span class="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                            {{ item.data.ensembles_matieres?.ensembles_matieres_lignes?.length ?? 0 }} article{{ (item.data.ensembles_matieres?.ensembles_matieres_lignes?.length ?? 0) > 1 ? 's' : '' }}
                          </span>
                          <p v-if="item.data.ensembles_matieres?.description" class="ml-1 truncate text-xs text-indigo-400">
                            {{ item.data.ensembles_matieres.description }}
                          </p>
                        </div>
                      </td>
                      <!-- Quantité (nb d'ensembles commandés) -->
                      <td class="px-4 py-2.5 text-center">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          :value="item.data.quantite ?? 1"
                          class="w-24 rounded-lg border border-indigo-200 bg-white px-2 py-1.5 text-center text-sm font-medium text-indigo-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-indigo-700/50 dark:bg-gray-800 dark:text-indigo-300"
                          @change="handleUpdateEnsembleQuantite(item.data, $event.target.value)"
                        />
                      </td>
                      <!-- Prix unit vide -->
                      <td class="px-4 py-2.5"></td>
                      <!-- Total ensemble -->
                      <td class="whitespace-nowrap px-4 py-2.5 text-right">
                        <span class="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                          {{ fmtPrix(totalEnsemble(item.data)) }}
                        </span>
                      </td>
                      <td class="px-4 py-2.5"></td>
                      <td class="px-2 py-2.5 text-center">
                        <button
                          type="button"
                          class="rounded-md p-1.5 text-gray-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:text-gray-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                          title="Retirer l'ensemble"
                          @click="askDeleteEnsembleCommande(item.data)"
                        >
                          <Icon name="lucide:trash-2" size="13" />
                        </button>
                      </td>
                    </tr>

                    <!-- Contenu de l'ensemble (dépliable) -->
                    <template v-if="openEnsembles.has(item.data.id)">

                      <!-- Sous-ensembles -->
                      <template v-for="se in item.data.ensembles_matieres?.ensembles_matieres_sous_ensembles ?? []" :key="'se-' + se.id">
                        <!-- En-tête sous-ensemble -->
                        <tr class="border-t border-indigo-100 bg-indigo-50/70 dark:border-indigo-800/30 dark:bg-indigo-900/15">
                          <td colspan="7" class="py-2 pl-10 pr-4">
                            <div class="flex items-center gap-2">
                              <Icon name="lucide:layers" size="13" class="flex-none text-indigo-400 dark:text-indigo-500" />
                              <span class="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{{ se.sous_ensemble?.nom }}</span>
                              <span class="rounded-full bg-indigo-100 px-1.5 py-0.5 text-xs text-indigo-500 dark:bg-indigo-900/30 dark:text-indigo-400">
                                × {{ se.quantite ?? 1 }} · {{ se.sous_ensemble?.ensembles_matieres_lignes?.length ?? 0 }} art.
                              </span>
                            </div>
                          </td>
                        </tr>
                        <!-- Articles du sous-ensemble -->
                        <tr
                          v-for="sousligne in se.sous_ensemble?.ensembles_matieres_lignes ?? []"
                          :key="'se-art-' + sousligne.id"
                          class="border-t border-indigo-50/80 bg-indigo-50/20 dark:border-indigo-900/20 dark:bg-indigo-900/5"
                        >
                          <td class="py-2 pl-14 pr-4">
                            <span class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-xs font-semibold text-indigo-600 ring-1 ring-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:ring-indigo-800/40">
                              {{ sousligne.numero_symbole }}
                            </span>
                          </td>
                          <td class="px-4 py-2">
                            <p class="text-xs font-medium text-gray-700 dark:text-gray-200">{{ sousligne.catalogue_matieres?.description || '—' }}</p>
                            <p v-if="sousligne.catalogue_matieres?.famille" class="mt-0.5 text-xs text-gray-400">{{ sousligne.catalogue_matieres.famille }}</p>
                          </td>
                          <td class="px-4 py-2 text-center">
                            <span class="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                              {{ sousligne.catalogue_matieres?.unite_distribution || '—' }}
                            </span>
                          </td>
                          <td class="px-4 py-2 text-center text-xs text-gray-500 dark:text-gray-400">{{ sousligne.quantite }}</td>
                          <td class="whitespace-nowrap px-4 py-2 text-right text-xs text-gray-500 dark:text-gray-400">{{ fmtPrix(sousligne.catalogue_matieres?.prix_ud) }}</td>
                          <td class="whitespace-nowrap px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                            {{ fmtPrix((sousligne.catalogue_matieres?.prix_ud ?? 0) * (sousligne.quantite || 0)) }}
                          </td>
                          <td></td>
                        </tr>
                      </template>

                      <!-- Articles directs de l'ensemble -->
                      <tr
                        v-for="(sousligne, j) in item.data.ensembles_matieres?.ensembles_matieres_lignes ?? []"
                        :key="sousligne.id"
                        class="border-t border-indigo-100/60 dark:border-indigo-800/20"
                        :class="j % 2 === 0 ? 'bg-indigo-50/30 dark:bg-indigo-900/5' : 'bg-white dark:bg-gray-900'"
                      >
                        <td class="py-2 pl-10 pr-4">
                          <span class="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-xs font-semibold text-indigo-600 ring-1 ring-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:ring-indigo-800/40">
                            {{ sousligne.numero_symbole }}
                          </span>
                        </td>
                        <td class="px-4 py-2">
                          <p class="text-xs font-medium text-gray-700 dark:text-gray-200">{{ sousligne.catalogue_matieres?.description || '—' }}</p>
                          <p v-if="sousligne.catalogue_matieres?.famille" class="mt-0.5 text-xs text-gray-400">{{ sousligne.catalogue_matieres.famille }}</p>
                        </td>
                        <td class="px-4 py-2 text-center">
                          <span class="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                            {{ sousligne.catalogue_matieres?.unite_distribution || '—' }}
                          </span>
                        </td>
                        <td class="px-4 py-2 text-center text-xs text-gray-500 dark:text-gray-400">{{ sousligne.quantite }}</td>
                        <td class="whitespace-nowrap px-4 py-2 text-right text-xs text-gray-500 dark:text-gray-400">{{ fmtPrix(sousligne.catalogue_matieres?.prix_ud) }}</td>
                        <td class="whitespace-nowrap px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                          {{ fmtPrix((sousligne.catalogue_matieres?.prix_ud ?? 0) * (sousligne.quantite || 0)) }}
                        </td>
                        <td></td>
                      </tr>
                    </template>
                  </template>

                </template>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </main>

    <!-- ── Panneau catalogue inline ──────────────────────────────────────────── -->
    <Transition name="catalogue-panel">
      <CommandesMatieresCatalogueSidebar
        v-if="showCatalogue && selectedCommande"
        :existing-symboles="existingSymboles"
        :existing-ensemble-ids="existingEnsembleIds"
        @add="handleAddArticle"
        @add-ensemble="handleAddEnsemble"
      />
    </Transition>

    <!-- ── Modal : créer / modifier une commande ─────────────────────────────── -->
    <AppModal v-model="showFormCommande" size="md">
      <template #header>
        <h3 class="text-base font-semibold text-gray-800 dark:text-white">
          {{ editingCommande ? 'Modifier la liste' : 'Nouvelle liste' }}
        </h3>
      </template>
      <form class="space-y-4" @submit.prevent="submitCommande">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nom *</label>
          <input
            v-model="formNom"
            type="text"
            placeholder="Ex : Phase 1 – Rails"
            required
            class="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            v-model="formDescription"
            rows="3"
            placeholder="Description optionnelle…"
            class="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          ></textarea>
        </div>
      </form>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            @click="showFormCommande = false"
          >Annuler</button>
          <button
            type="button"
            :disabled="!formNom.trim() || savingCommande"
            class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            @click="submitCommande"
          >
            <div v-if="savingCommande" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            {{ editingCommande ? 'Enregistrer' : 'Créer la liste' }}
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ── Modal : confirmer suppression commande ────────────────────────────── -->
    <AppModal v-model="showDeleteCommande" size="sm">
      <template #header>
        <h3 class="text-base font-semibold text-gray-800 dark:text-white">Supprimer la liste</h3>
      </template>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Êtes-vous sûr de vouloir supprimer la liste <strong>« {{ commandeToDelete?.nom }} »</strong> et tous ses articles ? Cette action est irréversible.
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            @click="showDeleteCommande = false"
          >Annuler</button>
          <button
            type="button"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            @click="confirmDeleteCommande"
          >Supprimer</button>
        </div>
      </template>
    </AppModal>

    <!-- ── Modal : confirmer suppression article ─────────────────────────────── -->
    <AppModal v-model="showDeleteLigne" size="sm">
      <template #header>
        <h3 class="text-base font-semibold text-gray-800 dark:text-white">Retirer l'article</h3>
      </template>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Retirer l'article <strong class="font-mono">{{ ligneToDelete?.numero_symbole }}</strong> de cette liste ?
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            @click="showDeleteLigne = false"
          >Annuler</button>
          <button
            type="button"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            @click="confirmDeleteLigne"
          >Retirer</button>
        </div>
      </template>
    </AppModal>

    <!-- ── Modal : confirmer retrait ensemble ────────────────────────────────── -->
    <AppModal v-model="showDeleteEnsemble" size="sm">
      <template #header>
        <h3 class="text-base font-semibold text-gray-800 dark:text-white">Retirer l'ensemble</h3>
      </template>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Retirer l'ensemble <strong>« {{ ensembleCommandeToDelete?.ensembles_matieres?.nom }} »</strong> de cette liste ?
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            @click="showDeleteEnsemble = false"
          >Annuler</button>
          <button
            type="button"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            @click="confirmDeleteEnsembleCommande"
          >Retirer</button>
        </div>
      </template>
    </AppModal>
    </div>
  </div>
</template>

<style scoped>
.catalogue-panel-enter-active,
.catalogue-panel-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.catalogue-panel-enter-from,
.catalogue-panel-leave-to {
  width: 0;
  opacity: 0;
}
.catalogue-panel-enter-to,
.catalogue-panel-leave-from {
  width: 20rem;
  opacity: 1;
}
</style>
