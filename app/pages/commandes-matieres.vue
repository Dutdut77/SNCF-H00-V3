<script setup>
definePageMeta({ requiresAuth: true })
useHead({ title: 'H00 - Commandes matières', description: 'Gestion des commandes de matières symbolisées' })

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

// ─── État global ─────────────────────────────────────────────────────────────
const commandes = ref([])
const loadingCommandes = ref(false)
const selectedCommande = ref(null)
const lignes = ref([])
const loadingLignes = ref(false)

// ─── Modales ──────────────────────────────────────────────────────────────────
const showFormCommande = ref(false)
const editingCommande = ref(null)
const showDeleteCommande = ref(false)
const commandeToDelete = ref(null)
const showDeleteLigne = ref(false)
const ligneToDelete = ref(null)

// ─── Sidebar catalogue ────────────────────────────────────────────────────────
const showCatalogue = ref(false)

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
  const payload = { nom: formNom.value.trim(), description: formDescription.value.trim() }

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
  loadingLignes.value = true
  lignes.value = await getLignes(commande.id)
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
    }
  }
  showDeleteCommande.value = false
  commandeToDelete.value = null
}

// ─── Articles de la commande ───────────────────────────────────────────────────
const existingSymboles = computed(() => lignes.value.map((l) => l.numero_symbole))

const handleAddArticle = async (article) => {
  if (!selectedCommande.value) return
  const ligne = await addLigne(selectedCommande.value.id, article.numero_symbole, lignes.value.length)
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

// ─── Formatage ────────────────────────────────────────────────────────────────
const fmtPrix = (v) => {
  if (v == null) return '—'
  return Number(v).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
}

const totalEstime = computed(() =>
  lignes.value.reduce((acc, l) => {
    const prix = l.catalogue_matieres?.prix_ud ?? 0
    return acc + prix * (l.quantite || 0)
  }, 0),
)

// ─── Chargement initial ───────────────────────────────────────────────────────
onMounted(async () => {
  loadingCommandes.value = true
  commandes.value = await getCommandes()
  loadingCommandes.value = false
})
</script>

<template>
  <div class="flex h-[calc(100vh-4rem)] overflow-hidden">

    <!-- ── Colonne gauche : liste des commandes ─────────────────────────────── -->
    <aside class="flex w-72 flex-none flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-gray-200 px-4 py-4 dark:border-gray-700">
        <div class="flex items-center gap-2">
          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <Icon name="lucide:shopping-cart" size="18" class="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 class="text-sm font-semibold text-gray-800 dark:text-white">Commandes</h1>
            <p class="text-xs text-gray-400">{{ commandes.length }} liste{{ commandes.length > 1 ? 's' : '' }}</p>
          </div>
        </div>
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white transition hover:bg-blue-700"
          title="Nouvelle commande"
          @click="openCreateCommande"
        >
          <Icon name="lucide:plus" size="16" />
        </button>
      </div>

      <!-- Loader -->
      <div v-if="loadingCommandes" class="flex items-center justify-center py-10">
        <div class="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
      </div>

      <!-- Empty -->
      <div
        v-else-if="commandes.length === 0"
        class="flex flex-col items-center gap-2 py-12 text-center text-sm text-gray-400 px-4"
      >
        <Icon name="lucide:clipboard-list" size="36" class="opacity-40" />
        <p>Aucune commande<br />Créez votre première liste</p>
      </div>

      <!-- Liste -->
      <ul v-else class="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/50">
        <li
          v-for="commande in commandes"
          :key="commande.id"
          class="group relative cursor-pointer px-4 py-3 transition"
          :class="
            selectedCommande?.id === commande.id
              ? 'bg-blue-50 dark:bg-blue-900/20'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
          "
          @click="selectCommande(commande)"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0 flex-1">
              <p
                class="truncate text-sm font-medium"
                :class="
                  selectedCommande?.id === commande.id
                    ? 'text-blue-700 dark:text-blue-300'
                    : 'text-gray-800 dark:text-gray-100'
                "
              >
                {{ commande.nom }}
              </p>
              <p v-if="commande.description" class="mt-0.5 truncate text-xs text-gray-400">
                {{ commande.description }}
              </p>
            </div>
            <!-- Actions (visibles au hover ou si sélectionnée) -->
            <div
              class="flex flex-none gap-0.5 opacity-0 transition group-hover:opacity-100"
              :class="selectedCommande?.id === commande.id ? 'opacity-100' : ''"
              @click.stop
            >
              <button
                type="button"
                class="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                title="Modifier"
                @click="openEditCommande(commande)"
              >
                <Icon name="lucide:pencil" size="13" />
              </button>
              <button
                type="button"
                class="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                title="Supprimer"
                @click="askDeleteCommande(commande)"
              >
                <Icon name="lucide:trash-2" size="13" />
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
        <p class="text-sm">Sélectionnez une commande ou créez-en une nouvelle</p>
        <button
          type="button"
          class="mt-2 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          @click="openCreateCommande"
        >
          <Icon name="lucide:plus" size="16" />
          Nouvelle commande
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
            <!-- Bouton ajouter article -->
            <button
              type="button"
              class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              @click="showCatalogue = true"
            >
              <Icon name="lucide:package-plus" size="16" />
              Ajouter un article
            </button>
          </div>
        </div>

        <!-- Loader lignes -->
        <div v-if="loadingLignes" class="flex items-center justify-center py-16">
          <div class="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        </div>

        <!-- Table des articles -->
        <div v-else class="flex-1 overflow-auto px-6 py-4">

          <!-- Empty -->
          <div
            v-if="lignes.length === 0"
            class="flex flex-col items-center gap-3 py-16 text-center text-gray-400"
          >
            <Icon name="lucide:package-open" size="48" class="opacity-30" />
            <p class="text-sm">Aucun article dans cette commande</p>
            <button
              type="button"
              class="mt-1 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
              @click="showCatalogue = true"
            >
              <Icon name="lucide:package-search" size="16" />
              Parcourir le catalogue
            </button>
          </div>

          <!-- Tableau -->
          <div v-else class="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60">
                  <th class="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400">
                    N° Symbole
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400">
                    Désignation
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400">
                    UD
                  </th>
                  <th class="w-28 px-4 py-3 text-center text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400">
                    Quantité
                  </th>
                  <th class="px-4 py-3 text-right text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400">
                    Prix unit.
                  </th>
                  <th class="px-4 py-3 text-right text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400">
                    Total
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400">
                    Notes
                  </th>
                  <th class="w-12 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                <tr
                  v-for="ligne in lignes"
                  :key="ligne.id"
                  class="bg-white transition hover:bg-gray-50/50 dark:bg-gray-900 dark:hover:bg-gray-800/30"
                >
                  <!-- N° symbole -->
                  <td class="px-4 py-3">
                    <span class="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {{ ligne.numero_symbole }}
                    </span>
                  </td>

                  <!-- Description -->
                  <td class="px-4 py-3">
                    <p class="text-xs text-gray-700 dark:text-gray-200">
                      {{ ligne.catalogue_matieres?.description || '—' }}
                    </p>
                    <p v-if="ligne.catalogue_matieres?.famille" class="mt-0.5 text-xs text-gray-400">
                      {{ ligne.catalogue_matieres.famille }}
                    </p>
                  </td>

                  <!-- UD -->
                  <td class="px-4 py-3 text-center">
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      {{ ligne.catalogue_matieres?.unite_distribution || '—' }}
                    </span>
                  </td>

                  <!-- Quantité -->
                  <td class="px-4 py-3 text-center">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      :value="ligne.quantite"
                      class="w-24 rounded-lg border border-gray-200 bg-white px-2 py-1 text-center text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      @change="handleUpdateQuantite(ligne, $event.target.value)"
                    />
                  </td>

                  <!-- Prix unitaire -->
                  <td class="px-4 py-3 text-right text-xs text-gray-600 dark:text-gray-300">
                    {{ fmtPrix(ligne.catalogue_matieres?.prix_ud) }}
                  </td>

                  <!-- Total ligne -->
                  <td class="px-4 py-3 text-right text-xs font-medium text-gray-800 dark:text-gray-100">
                    {{ fmtPrix((ligne.catalogue_matieres?.prix_ud ?? 0) * (ligne.quantite || 0)) }}
                  </td>

                  <!-- Notes -->
                  <td class="px-4 py-3">
                    <input
                      type="text"
                      :value="ligne.notes"
                      placeholder="Note…"
                      class="w-full min-w-24 rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 outline-none transition focus:border-blue-400 focus:ring-1 focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
                      @change="handleUpdateNotes(ligne, $event.target.value)"
                    />
                  </td>

                  <!-- Action -->
                  <td class="px-4 py-3 text-right">
                    <button
                      type="button"
                      class="rounded p-1 text-gray-300 transition hover:bg-red-50 hover:text-red-500 dark:text-gray-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      title="Supprimer l'article"
                      @click="askDeleteLigne(ligne)"
                    >
                      <Icon name="lucide:trash-2" size="14" />
                    </button>
                  </td>
                </tr>
              </tbody>

              <!-- Footer total -->
              <tfoot>
                <tr class="border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60">
                  <td colspan="5" class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                    Total estimé
                  </td>
                  <td class="px-4 py-3 text-right text-sm font-bold text-gray-800 dark:text-white">
                    {{ fmtPrix(totalEstime) }}
                  </td>
                  <td colspan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </template>
    </main>

    <!-- ── Sidebar catalogue ─────────────────────────────────────────────────── -->
    <CommandesMatieresCatalogueSidebar
      :open="showCatalogue"
      :existing-symboles="existingSymboles"
      @close="showCatalogue = false"
      @add="handleAddArticle"
    />

    <!-- ── Modal : créer / modifier une commande ─────────────────────────────── -->
    <AppModal v-model="showFormCommande" size="md">
      <template #header>
        <h3 class="text-base font-semibold text-gray-800 dark:text-white">
          {{ editingCommande ? 'Modifier la commande' : 'Nouvelle commande' }}
        </h3>
      </template>

      <form class="space-y-4" @submit.prevent="submitCommande">
        <div>
          <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nom *</label>
          <input
            v-model="formNom"
            type="text"
            placeholder="Ex : Chantier Gare du Nord – Phase 1"
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
          >
            Annuler
          </button>
          <button
            type="button"
            :disabled="!formNom.trim() || savingCommande"
            class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
            @click="submitCommande"
          >
            <div v-if="savingCommande" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            {{ editingCommande ? 'Enregistrer' : 'Créer' }}
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ── Modal : confirmer suppression commande ────────────────────────────── -->
    <AppModal v-model="showDeleteCommande" size="sm">
      <template #header>
        <h3 class="text-base font-semibold text-gray-800 dark:text-white">Supprimer la commande</h3>
      </template>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Êtes-vous sûr de vouloir supprimer
        <strong>« {{ commandeToDelete?.nom }} »</strong> et tous ses articles ? Cette action est irréversible.
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            @click="showDeleteCommande = false"
          >
            Annuler
          </button>
          <button
            type="button"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            @click="confirmDeleteCommande"
          >
            Supprimer
          </button>
        </div>
      </template>
    </AppModal>

    <!-- ── Modal : confirmer suppression article ─────────────────────────────── -->
    <AppModal v-model="showDeleteLigne" size="sm">
      <template #header>
        <h3 class="text-base font-semibold text-gray-800 dark:text-white">Retirer l'article</h3>
      </template>
      <p class="text-sm text-gray-600 dark:text-gray-300">
        Retirer l'article
        <strong class="font-mono">{{ ligneToDelete?.numero_symbole }}</strong>
        de cette commande ?
      </p>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            @click="showDeleteLigne = false"
          >
            Annuler
          </button>
          <button
            type="button"
            class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            @click="confirmDeleteLigne"
          >
            Retirer
          </button>
        </div>
      </template>
    </AppModal>
  </div>
</template>
