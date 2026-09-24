<script setup>
const { allAttributions, getAttributions, createAttribution, updateAttribution, deleteAttribution } = useAttributions()
const { users } = useUsers()
const { setLoader } = useLoader()

const globalFilter = ref('')
const open = ref(false)
const isNewSite = ref(false)
const site = ref({})
const siteInitial = ref('')
const saving = ref(false)

// État du modal de confirmation de suppression
const showDeleteModal = ref(false)
const siteToDelete = ref(null)
const isDeleting = ref(false)

// Filtrer les sites en fonction de la recherche
const filteredSites = computed(() => {
  if (!globalFilter.value) return allAttributions.value
  const search = globalFilter.value.toLowerCase()
  return allAttributions.value.filter((s) => [s.code, s.label].join(' ').toLowerCase().includes(search))
})

// Utilisateurs rattachés à chaque secteur (les utilisateurs sont chargés par la page)
const nbUtilisateurs = computed(() => {
  const compte = {}
  for (const u of users.value || []) if (u.site) compte[u.site] = (compte[u.site] ?? 0) + 1
  return compte
})

// Validation : libellé obligatoire (+ code obligatoire à la création).
const validatedFields = computed(() => {
  const labelOk = site.value.label && site.value.label.trim().length > 0
  if (isNewSite.value) {
    return labelOk && site.value.code && site.value.code.trim().length > 0
  }
  return labelOk
})
const dirty = computed(() => open.value && JSON.stringify(site.value) !== siteInitial.value)

// Ouvrir la fiche pour éditer un site
const openSlide = (row) => {
  if (!row) return
  site.value = {
    code: row.code,
    label: row.label,
    ordre: row.ordre ?? 0
  }
  siteInitial.value = JSON.stringify(site.value)
  isNewSite.value = false
  open.value = true
}

// Ouvrir la fiche pour créer un nouveau site
const openSlideNew = () => {
  site.value = {
    code: '',
    label: '',
    ordre: (allAttributions.value.length || 0) + 1
  }
  siteInitial.value = JSON.stringify(site.value)
  isNewSite.value = true
  open.value = true
}

// Fermer la fiche
const closeSlide = () => {
  open.value = false
  site.value = {}
  isNewSite.value = false
}

// Enregistrer (créer ou modifier)
const enregistrer = async () => {
  if (!validatedFields.value) return

  const payload = {
    code: site.value.code.trim(),
    label: site.value.label.trim(),
    ordre: Number(site.value.ordre) || 0
  }

  saving.value = true
  setLoader(true)
  try {
    const result = isNewSite.value ? await createAttribution(payload) : await updateAttribution(payload)
    if (result) closeSlide()
  } finally {
    saving.value = false
    setLoader(false)
  }
}

// Ouvrir le modal de confirmation de suppression
const openDeleteModal = (s) => {
  if (!s?.code) return
  siteToDelete.value = s
  showDeleteModal.value = true
}

// Confirmer la suppression
const confirmDelete = async () => {
  if (!siteToDelete.value?.code) return

  isDeleting.value = true
  try {
    const ok = await deleteAttribution(siteToDelete.value.code)
    if (ok) {
      showDeleteModal.value = false
      siteToDelete.value = null
    }
  } finally {
    isDeleting.value = false
  }
}

// Charger les sites au montage
setLoader(true)
try {
  await getAttributions()
} finally {
  setLoader(false)
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:px-8 lg:pt-4 lg:pb-4">
    <!-- Barre d'outils -->
    <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
      <AppInputSearch
        v-model="globalFilter"
        boxed
        dense
        class="w-full sm:max-w-sm"
        placeholder="Rechercher un secteur…" />
      <AppButtonValidated theme="brand" type="button" class="sm:ml-auto" @click="openSlideNew">
        <template #default>
          <span class="flex items-center gap-2">
            <Icon name="lucide:plus" size="16" />
            Nouveau secteur
          </span>
        </template>
      </AppButtonValidated>
    </div>

    <!-- Tableau des secteurs -->
    <div :class="TABLEAU_CARTE">
      <table class="w-full text-sm">
        <thead :class="TABLEAU_TETE">
          <tr>
            <th class="px-4 py-2.5 text-left">Secteur</th>
            <th class="px-4 py-2.5 text-left">Code</th>
            <th class="px-4 py-2.5 text-center">Utilisateurs</th>
            <th class="w-24 px-4 py-2.5"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody :class="TABLEAU_CORPS">
          <tr v-for="s in filteredSites" :key="s.code" :class="TABLEAU_LIGNE" @click="openSlide(s)">
            <td class="px-4 py-3">
              <span class="text-ink flex items-center gap-2.5 font-medium">
                <Icon name="lucide:map-pin" size="16" class="text-magenta-600 dark:text-magenta-300 shrink-0" />
                {{ s.label || '—' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <span :class="ETIQUETTE_TAUPE">{{ s.code }}</span>
            </td>
            <td class="text-ink-soft px-4 py-3 text-center tabular-nums">{{ nbUtilisateurs[s.code] ?? 0 }}</td>
            <td class="px-4 py-2">
              <div class="flex items-center justify-end gap-1">
                <button type="button" :class="BOUTON_ICONE" title="Modifier" @click.stop="openSlide(s)">
                  <Icon name="lucide:pencil" size="16" />
                </button>
                <button type="button" :class="BOUTON_ICONE_DANGER" title="Supprimer" @click.stop="openDeleteModal(s)">
                  <Icon name="lucide:trash-2" size="16" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="filteredSites.length === 0" class="text-ink-soft flex flex-col items-center gap-2 p-10 text-sm">
        <Icon name="lucide:map-pin-off" size="28" class="opacity-40" />
        Aucun secteur trouvé
      </div>
    </div>

    <!-- Fiche : création / modification -->
    <AppSidePanelForm
      :open="open"
      surtitre="Secteur"
      :titre="site.label?.trim() || (isNewSite ? 'Nouveau secteur' : '—')"
      :sous-titre="!isNewSite ? site.code : ''"
      :valid="!!validatedFields"
      :dirty="dirty"
      :locked="saving"
      :submit-label="isNewSite ? 'Créer le secteur' : 'Enregistrer'"
      @close="closeSlide"
      @submit="enregistrer">
      <section class="surface-card space-y-4 rounded-xl p-5" aria-labelledby="site-identite">
        <h3 id="site-identite" class="text-ink font-semibold">Identification</h3>
        <div>
          <label for="site-code" :class="CHAMP_LIBELLE">Code</label>
          <input
            id="site-code"
            v-model="site.code"
            type="text"
            autocomplete="off"
            class="form-control h-10 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="Ex. : UTM L1000"
            :disabled="!isNewSite" />
          <p class="text-ink-soft mt-1.5 text-xs">
            {{
              isNewSite
                ? 'Identifie le secteur : il ne pourra plus être modifié.'
                : "Le code identifie le secteur et n'est pas modifiable."
            }}
          </p>
        </div>
        <div>
          <label for="site-label" :class="CHAMP_LIBELLE">Libellé</label>
          <input
            id="site-label"
            v-model="site.label"
            type="text"
            autocomplete="off"
            class="form-control h-10"
            placeholder="Nom affiché du secteur" />
        </div>
      </section>
    </AppSidePanelForm>

    <!-- Confirmation de suppression -->
    <AppConfirmModal
      v-model="showDeleteModal"
      title="Supprimer le secteur"
      :loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="siteToDelete = null">
      Le secteur
      <strong class="text-ink">« {{ siteToDelete?.label || '' }} »</strong>
      sera supprimé définitivement.
      <span v-if="nbUtilisateurs[siteToDelete?.code]">
        {{ nbUtilisateurs[siteToDelete?.code] }} utilisateur{{
          nbUtilisateurs[siteToDelete?.code] > 1 ? 's y sont' : ' y est'
        }}
        rattaché{{ nbUtilisateurs[siteToDelete?.code] > 1 ? 's' : '' }}.
      </span>
      La suppression est impossible si des chantiers y sont rattachés.
    </AppConfirmModal>
  </div>
</template>
