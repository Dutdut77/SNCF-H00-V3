<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: ''
})

useHead({
  title: 'H00 - Mes taches',
  description: 'Liste de mes taches H00'
})

const { setLoader } = useLoader()

const { getChantiersUserNonTermines, allChantiersUserNonTermines } = useChantiers()
const { taches, getTaches } = useTaches()

const { updateH00ClotureProfil } = useH00()
const { isAuthorizedForTacheBis } = useLevelUser()
const user = useAuthUser()
// Profil de l'utilisateur connecté (clé du suivi par profil)
const profil = computed(() => Number(user.value?.profils))

// États pour les chantiers et tâches
const userChantiers = ref([])
const allTaches = ref([])
const selectedChantier = ref(null)
const globalFilterChantier = ref('')
const globalFilterTache = ref('')
const selectedTache = ref({})
const commentaire = ref('')
const important = ref(false)
const alerte = ref(false)
const dateCloture = ref(null)
const open = ref(false)

const selectedRows = ref([])
// Formatage du mois (month est 1-indexé : 1-12)
function formatMonthYear(year, month) {
  const date = new Date(year, month - 1, 1)

  const longName = date.toLocaleDateString('fr-FR', { month: 'long' })
  const monthName = longName.charAt(0).toUpperCase() + longName.slice(1) // « Septembre »

  return {
    month: monthName,
    year: date.getFullYear()
  }
}

// Mois affiché, en décalage depuis le mois en cours (0 = mois en cours, retards inclus)
const monthOffset = ref(0)

// Premier et dernier instant du mois situé à `offset` mois du mois en cours
const monthBounds = (offset) => {
  const now = new Date()
  return {
    start: new Date(now.getFullYear(), now.getMonth() + offset, 1),
    end: new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59)
  }
}

const monthLabel = (offset) => {
  const { start } = monthBounds(offset)
  const { month, year } = formatMonthYear(start.getFullYear(), start.getMonth() + 1)
  return `${month} ${year}`
}

// Tâches d'un mois : le mois en cours reprend aussi les retards, les suivants uniquement leur mois
const tachesOfMonth = (offset) => {
  const { start, end } = monthBounds(offset)
  return allTaches.value.filter((tache) => {
    if (!tache.prevision) return false
    const previsionDate = new Date(tache.prevision)
    return (offset === 0 || previsionDate >= start) && previsionDate <= end
  })
}

// Dernier mois navigable : celui de la prévision la plus lointaine, au moins le mois suivant
const maxMonthOffset = computed(() => {
  const now = new Date()
  return allTaches.value.reduce((max, tache) => {
    if (!tache.prevision) return max
    const previsionDate = new Date(tache.prevision)
    const offset = (previsionDate.getFullYear() - now.getFullYear()) * 12 + previsionDate.getMonth() - now.getMonth()
    return Math.max(max, offset)
  }, 1)
})

const listTachesMonth = computed(() => tachesOfMonth(monthOffset.value))

// Le chantier sélectionné n'a plus de tâche dans le mois affiché (changement de mois, dernière
// tâche clôturée…) : retour à « Tous les chantiers » plutôt qu'une liste vide
watch(listTachesMonth, (list) => {
  if (selectedChantier.value && !list.some((t) => t.chantier_id === selectedChantier.value)) {
    selectedChantier.value = null
  }
})

// Ligne sous le nom du mois : volume de tâches (et retards pour le mois en cours)
const monthSummary = computed(() => {
  const total = listTachesMonth.value.length
  if (monthOffset.value === 0) {
    const text = total === 0 ? 'Aucune tâche à traiter' : `${total} ${total > 1 ? 'tâches' : 'tâche'} à traiter`
    return { text, late: listTachesMonth.value.filter((t) => isLate(t)).length }
  }
  const text = total === 0 ? 'Aucune tâche prévue' : `${total} ${total > 1 ? 'tâches prévues' : 'tâche prévue'}`
  return { text, late: 0 }
})

// Libellé des flèches : mois voisin et son nombre de tâches
const monthNavLabel = (offset) => {
  const total = tachesOfMonth(offset).length
  return `${monthLabel(offset)} : ${total} ${total > 1 ? 'tâches' : 'tâche'}`
}

const itemsLeftNavBar = computed(() => {
  const grouped = listTachesMonth.value.reduce((acc, item) => {
    const id = item.chantier_id
    if (!acc[id]) {
      acc[id] = {
        chantier: item.chantiers,
        taches: []
      }
    }
    acc[id].taches.push(item)
    return acc
  }, {})

  // Petite ligne au-dessus du nom (surtitre) : le compte d'un chantier, le nombre de chantiers pour
  // « Tous » ; les cartes ont ainsi la même structure, donc la même hauteur
  const nbChantiers = Object.keys(grouped).length
  return [
    {
      value: null,
      surtitre: `${nbChantiers} chantier${nbChantiers > 1 ? 's' : ''}`,
      label: 'Tous les chantiers',
      icon: 'lucide-folder',
      badge: listTachesMonth.value.length
    },
    ...Object.values(grouped).map((group) => ({
      value: group.chantier.id,
      compte: group.chantier.compte,
      surtitre: group.chantier.compte,
      label: group.chantier.name,
      icon: 'lucide-folder',
      badge: group.taches.length
    }))
  ]
})
// Fonction pour formater une date en "Oct 2025" (mois court)
const formatDateMonthYear = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const monthYear = date.toLocaleDateString('fr-FR', {
    month: 'short',
    year: 'numeric'
  })
  // Mettre la première lettre en majuscule
  return monthYear.charAt(0).toUpperCase() + monthYear.slice(1)
}

// Fonction pour déterminer le statut de réalisation (du POINT DE VUE de mon profil)
const getRealisationStatus = (tache) => {
  const status = getSlot(tache, profil.value).status
  const prevision = tache.prevision

  // Si status = 2, la tâche est clôturée
  if (status === 2) {
    return { type: 'fait', label: 'Fait' }
  }

  // Si status = 1, la tâche est en cours
  if (status === 1) {
    return { type: 'en_cours', label: 'En cours' }
  }

  // Si status = 0, vérifier si la tâche est prévue dans le mois en cours ou avant
  if (status === 0 && prevision) {
    const now = new Date()
    const previsionDate = new Date(prevision)
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const previsionMonth = new Date(previsionDate.getFullYear(), previsionDate.getMonth(), 1)

    // Si la prévision est dans le mois en cours ou avant
    if (previsionMonth <= currentMonth) {
      return { type: 'a_faire', label: 'À faire' }
    }
  }

  // Aucun cas ne correspond
  return null
}
// Pastilles de statut : vieux rose (à faire), ocre (en cours), émeraude (fait)
const STATUT_CLASSES = {
  a_faire: 'bg-rust-100 text-rust-700 dark:bg-rust-500/16 dark:text-rust-300',
  en_cours: 'bg-ochre-100 text-ochre-700 dark:bg-ochre-400/14 dark:text-ochre-300',
  fait: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/16 dark:text-emerald-300'
}
// Prévision antérieure au mois en cours alors que ma part n'est pas clôturée : date mise en évidence
const isLate = (tache) => {
  if (!tache.prevision || getSlot(tache, profil.value).status === 2) return false
  const now = new Date()
  return new Date(tache.prevision) < new Date(now.getFullYear(), now.getMonth(), 1)
}
// Fonction pour convertir une date au format YYYY-MM-DD pour l'input date
const formatDateForInput = (dateString) => {
  if (!dateString) return null
  const date = new Date(dateString)
  // Vérifier que la date est valide
  if (isNaN(date.getTime())) return null
  // Retourner au format YYYY-MM-DD
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
// Computed : vrai si tout est coché
const isAllSelected = computed(() => {
  return (
    selectedRows.value.length === filteredlistTachesSelected.value.length && filteredlistTachesSelected.value.length > 0
  )
})
// Master checkbox
const toggleSelectAll = (checked) => {
  if (checked) {
    selectedRows.value = filteredlistTachesSelected.value.map((r) => r)
  } else {
    selectedRows.value = []
  }
}

// Fiche d'une tâche : état à l'ouverture, pour confirmer avant de perdre une saisie
const tacheInitiale = ref('')
const etatTache = () => JSON.stringify([commentaire.value, important.value, alerte.value, dateCloture.value])
const tacheModifiee = computed(() => open.value && etatTache() !== tacheInitiale.value)

// Ouvrir la fiche latérale d'une tâche
const showSlide = (row) => {
  selectedTache.value = row
  const slot = getSlot(row, profil.value)
  commentaire.value = slot.commentaire || ''
  important.value = row.important || false
  alerte.value = row.alerte || false
  // Préremplir la date de clôture si MA part est clôturée (status === 2)
  if (slot.status === 2 && slot.realisation) {
    dateCloture.value = formatDateForInput(slot.realisation)
  } else {
    dateCloture.value = null
  }
  tacheInitiale.value = etatTache()
  open.value = true
}

// Pastille de statut sur l'en-tête de la fiche : point de couleur
const STATUT_POINT = { a_faire: 'bg-rust-300', en_cours: 'bg-ochre-300', fait: 'bg-emerald-300' }

const listTachesSelected = computed(() => {
  // 1. Liste du mois affiché
  const list = listTachesMonth.value

  // 2. Si aucun chantier sélectionné → retourner toute la liste
  if (!selectedChantier.value) {
    return list
  }

  // 3. Sinon filtrer par chantier_id
  return list.filter((t) => t.chantier_id === selectedChantier.value)
})

const filteredlistTachesSelected = computed(() => {
  const search = globalFilterTache.value?.toLowerCase() ?? ''

  let result = listTachesSelected.value

  // Filtre texte
  if (search) {
    result = result.filter(
      (t) =>
        t.categories?.name?.toLowerCase().includes(search) ||
        t.taches?.tache?.toLowerCase().includes(search) ||
        t.chantiers?.compte?.toLowerCase().includes(search) ||
        t.chantiers?.name?.toLowerCase().includes(search)
    )
  }

  return result
})

const filteredItemsLeftNavBar = computed(() => {
  const search = globalFilterChantier.value?.toLowerCase() ?? ''

  let result = itemsLeftNavBar.value

  // Filtre texte
  if (search) {
    result = result.filter((t) => t.compte?.toLowerCase().includes(search) || t.label?.toLowerCase().includes(search))
  }

  return result
})

const transformFlattenedTaches = (authorizedChantiers) => {
  if (!Array.isArray(authorizedChantiers)) return []

  // Map pour lookup rapide des infos de taches
  const tachesMap = new Map(taches.value.map((t) => [t.id, t]))

  return (
    authorizedChantiers
      .flatMap((chantier) => {
        return (chantier.h00 ?? []).map((h) => {
          return {
            ...h,
            taches: tachesMap.get(h.tache_id) ?? null,
            chantiers: {
              id: chantier.id,
              name: chantier.name,
              compte: chantier.compte,
              etat: chantier.etat
            }
          }
        })
      })
      // Tri par prevision
      .sort((a, b) => new Date(a.prevision) - new Date(b.prevision))
  )
}

const loadAllData = async () => {
  setLoader(true)
  try {
    await getTaches()
    await getChantiersUserNonTermines()

    const authorizedChantiers = isAuthorizedForTacheBis(allChantiersUserNonTermines.value, taches.value)
    authorizedChantiers.forEach((chantier) => {
      if (Array.isArray(chantier.h00)) {
        // Masquer les tâches que MON profil a clôturées ou pour lesquelles il n'est pas concerné
        chantier.h00 = chantier.h00.filter((h) => {
          const slot = getSlot(h, profil.value)
          return slot.status !== 2 && !slot.non_concerne
        })
      }
    })
    const flattenedTaches = transformFlattenedTaches(authorizedChantiers)

    allTaches.value = flattenedTaches
  } finally {
    setLoader(false)
  }
}
// Clôture de MA part (profil courant)
const cloturerTache = async () => {
  setLoader(true)
  try {
    const tacheProfil = selectedTache.value.taches?.tache_profil || []
    const { error } = await updateH00ClotureProfil(
      selectedTache.value,
      profil.value,
      {
        status: 2,
        realisation: formatDateForInput(dateCloture.value),
        commentaire: commentaire.value,
        non_concerne: false
      },
      tacheProfil,
      { shared: { important: important.value, alerte: alerte.value } }
    )
    if (error) throw error

    // Ma part est clôturée → la tâche disparaît de MA liste
    const index = allTaches.value.findIndex((t) => t.id === selectedTache.value.id)
    if (index !== -1) {
      allTaches.value.splice(index, 1)
    }

    open.value = false
  } catch (err) {
    console.error('Erreur lors de la clôture:', err)
  } finally {
    setLoader(false)
  }
}

// Enregistrer MA part (commentaire / en cours)
const enregistrer = async () => {
  setLoader(true)
  try {
    const tacheProfil = selectedTache.value.taches?.tache_profil || []
    const newStatus = commentaire.value.trim() !== '' ? 1 : 0
    const { data, error } = await updateH00ClotureProfil(
      selectedTache.value,
      profil.value,
      { status: newStatus, commentaire: commentaire.value },
      tacheProfil,
      { shared: { important: important.value, alerte: alerte.value } }
    )
    if (error) throw error

    // Mise à jour locale (la tâche reste visible tant que ma part n'est pas clôturée)
    const index = allTaches.value.findIndex((t) => t.id === selectedTache.value.id)
    if (index !== -1 && data) {
      allTaches.value[index] = {
        ...allTaches.value[index],
        cloture_profil: data.cloture_profil,
        status: data.status,
        realisation: data.realisation,
        important: data.important,
        alerte: data.alerte
      }
    }

    open.value = false
  } catch (err) {
    console.error("Erreur lors de l'enregistrement:", err)
  } finally {
    setLoader(false)
  }
}

// Marquer « Non concerné » UNIQUEMENT pour mon profil (la tâche reste pour les autres)
const nonConcerne = async () => {
  setLoader(true)
  try {
    const tacheProfil = selectedTache.value.taches?.tache_profil || []
    const { error } = await updateH00ClotureProfil(
      selectedTache.value,
      profil.value,
      { non_concerne: true },
      tacheProfil
    )
    if (error) throw error

    // Mon profil n'est plus concerné → la tâche disparaît de MA liste
    const index = allTaches.value.findIndex((t) => t.id === selectedTache.value.id)
    if (index !== -1) {
      allTaches.value.splice(index, 1)
    }

    open.value = false
  } catch (err) {
    console.error('Erreur lors de la mise à jour:', err)
  } finally {
    setLoader(false)
  }
}

// Navigation vers le chantier sélectionné
const goToChantier = () => {
  if (selectedChantier.value) {
    navigateTo(`/chantiers/${selectedChantier.value}`)
  }
}

// Fonction pour imprimer les tâches sélectionnées
const printTaches = () => {
  if (selectedRows.value.length === 0) return
  // Stocker les tâches dans sessionStorage pour la page d'impression
  sessionStorage.setItem('printTaches', JSON.stringify(selectedRows.value))
  // Ouvrir la page d'impression dans un nouvel onglet
  window.open('/print/taches', '_blank')
}

// Périodes de réalisation du chantier sélectionné, dans l'ordre chronologique (bandeau d'en-tête)
const { formatDate } = useChantierDates()
const chantierSelectionne = computed(
  () => allChantiersUserNonTermines.value.find((c) => Number(c.id) === Number(selectedChantier.value)) || null
)
const periodesRealisation = computed(() =>
  (chantierSelectionne.value?.date_rea || [])
    .filter((p) => p.date_start_travaux)
    .sort((a, b) => new Date(a.date_start_travaux) - new Date(b.date_start_travaux))
    .map((p) => ({
      debut: formatDate(p.date_start_travaux),
      // Période d'un seul jour : pas de date de fin répétée
      fin: p.date_end_travaux && p.date_end_travaux !== p.date_start_travaux ? formatDate(p.date_end_travaux) : null
    }))
)

const getCompteEtNomById = (id) => {
  const chantier = allChantiersUserNonTermines.value.find((c) => Number(c.id) === Number(id))

  return chantier
    ? { compte: chantier.compte, name: chantier.name }
    : { compte: 'Toutes les tâches en cours pour le mois sélectionné', name: 'Liste des tâches' }
}

onMounted(async () => {
  await loadAllData()
})
</script>

<template>
  <AppPageLayout v4>
    <!-- Barre latérale : mois, puis chantiers -->
    <template #sidebar>
      <div class="flex flex-col gap-5 pb-6 lg:pt-2">
        <AppPeriodNav
          :label="monthLabel(monthOffset)"
          :prev-disabled="monthOffset === 0"
          :prev-label="monthOffset > 0 ? `Mois précédent (${monthNavLabel(monthOffset - 1)})` : 'Mois précédent'"
          :prev-title="monthOffset > 0 ? monthNavLabel(monthOffset - 1) : undefined"
          :next-disabled="monthOffset >= maxMonthOffset"
          :next-label="
            monthOffset < maxMonthOffset ? `Mois suivant (${monthNavLabel(monthOffset + 1)})` : 'Mois suivant'
          "
          :next-title="monthOffset < maxMonthOffset ? monthNavLabel(monthOffset + 1) : undefined"
          @prev="monthOffset--"
          @next="monthOffset++">
          <p class="mt-1.5 text-xs text-white/80">{{ monthSummary.text }}</p>
          <!-- Retards : pastille blanche à texte pourpre, dans les tons de la carte -->
          <p
            v-if="monthSummary.late"
            class="text-magenta-800 mt-1.5 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-semibold">
            <Icon name="lucide:clock-alert" size="13" class="shrink-0" />
            {{ monthSummary.late }} en retard
          </p>
        </AppPeriodNav>

        <AppInputSearch v-model="globalFilterChantier" boxed dense placeholder="Rechercher un chantier…" />

        <nav class="flex flex-col gap-1" aria-label="Filtrer par chantier">
          <!-- Chantier sélectionné : fond gris + repère magenta (utils/panneau.js) ; dossier ouvert -->
          <button
            v-for="item in filteredItemsLeftNavBar"
            :key="item.value ?? 'tous'"
            type="button"
            class="focus-visible:outline-secondary-500 relative flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            :class="panneauItem(selectedChantier === item.value)"
            :aria-pressed="selectedChantier === item.value"
            @click="selectedChantier = item.value">
            <Icon
              :name="
                item.value === null
                  ? 'lucide:layers'
                  : selectedChantier === item.value
                    ? 'lucide:folder-open'
                    : 'lucide:folder'
              "
              size="18"
              class="shrink-0"
              :class="panneauIcone(selectedChantier === item.value)" />
            <span class="flex min-w-0 flex-1 flex-col">
              <span
                v-if="item.surtitre"
                class="text-sm tracking-wide tabular-nums"
                :class="
                  selectedChantier === item.value
                    ? 'text-magenta-600 dark:text-magenta-300 font-bold'
                    : 'font-bold text-taupe-500 dark:text-white/50'
                ">
                {{ item.surtitre }}
              </span>
              <!-- Deux lignes plutôt qu'une coupure : l'icône de dossier réduit la place du nom -->
              <span class="line-clamp-2 text-sm font-medium text-taupe-700" :title="item.label">{{ item.label }}</span>
            </span>
            <span
              v-if="item.badge !== undefined"
              class="inline-flex h-5.5 min-w-6.5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold"
              :class="panneauBadge(selectedChantier === item.value)">
              {{ item.badge }}
            </span>
          </button>

          <p
            v-if="filteredItemsLeftNavBar.length === 0"
            class="text-ink-soft flex items-center gap-2 px-3 py-4 text-[13px]">
            <Icon name="lucide:search-x" size="18" />
            Aucun chantier ne correspond à la recherche.
          </p>
        </nav>
      </div>
    </template>

    <!-- Contenu principal -->
    <template #default>
      <div class="flex h-full w-full flex-col gap-5 overflow-auto p-4 lg:px-8 lg:pt-7 lg:pb-6">
        <AppPageHero
          :title="getCompteEtNomById(selectedChantier).name"
          :description="getCompteEtNomById(selectedChantier).compte"
          illustration="taches"
          :clickable="!!selectedChantier"
          @click="goToChantier">
          <!-- Chantier sélectionné : compte en grand, nom, puis périodes de réalisation -->
          <template v-if="chantierSelectionne" #default="{ ui }">
            <p
              :class="ui.titre"
              class="font-traverse text-[clamp(1.9rem,1.3rem+1.5vw,2.6rem)] leading-none tracking-[0.03em] tabular-nums">
              {{ chantierSelectionne.compte }}
            </p>
            <!-- Nom et périodes sur une ligne (retour à la ligne si le nom est long) : bandeau plus bas -->
            <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <h1 class="text-ink text-lg leading-snug font-semibold">{{ chantierSelectionne.name }}</h1>
              <ul v-if="periodesRealisation.length" class="flex flex-wrap gap-1.5" aria-label="Périodes de réalisation">
                <li
                  v-for="(p, i) in periodesRealisation"
                  :key="i"
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-medium whitespace-nowrap"
                  :class="ui.pastille">
                  <Icon name="lucide:calendar-range" size="14" class="shrink-0" />
                  {{ p.debut }}
                  <template v-if="p.fin">
                    <Icon name="lucide:arrow-right" size="12" class="shrink-0 opacity-60" />
                    {{ p.fin }}
                  </template>
                </li>
              </ul>
              <p v-else class="flex items-center gap-1.5 text-[13px] italic" :class="ui.texte">
                <Icon name="lucide:calendar-x" size="14" />
                Aucune période de réalisation
              </p>
            </div>
          </template>
        </AppPageHero>

        <div class="flex flex-col gap-3 lg:flex-row lg:items-center">
          <AppInputSearch
            v-model="globalFilterTache"
            boxed
            dense
            class="w-full lg:max-w-sm"
            placeholder="Rechercher une tâche…" />
          <div class="flex w-full items-center gap-2 lg:ml-auto lg:w-auto">
            <AppButtonValidated
              v-if="selectedChantier"
              theme="outline"
              type="button"
              class="w-full lg:w-auto"
              @click="goToChantier">
              <template #default>
                <span class="flex items-center gap-2">
                  <Icon name="lucide:external-link" size="16" />
                  Voir le chantier
                </span>
              </template>
            </AppButtonValidated>

            <div
              class="hidden lg:flex"
              :title="selectedRows.length === 0 ? 'Cochez des tâches pour les imprimer' : undefined">
              <AppButtonValidated theme="brand" type="button" :validated="selectedRows.length > 0" @click="printTaches">
                <template #default>
                  <span class="flex items-center gap-2">
                    <Icon name="lucide:printer" size="16" />
                    Imprimer
                    <span v-if="selectedRows.length > 0" class="min-w-5 rounded-full bg-white/20 px-1.5 text-xs">
                      {{ selectedRows.length }}
                    </span>
                  </span>
                </template>
              </AppButtonValidated>
            </div>
          </div>
        </div>

        <div class="surface-card flex w-full flex-1 flex-col overflow-x-auto rounded-xl">
          <table class="w-full text-sm">
            <!-- En-tête blanc collant (token table-head), filet dessous -->
            <thead>
              <tr
                class="*:bg-table-head *:table-head-text *:sticky *:top-0 *:z-1 *:text-[0.8125rem] *:whitespace-nowrap *:shadow-[inset_0_-1px_0_var(--color-rule)]">
                <th class="hidden w-10 py-3 pl-4 lg:table-cell">
                  <AppCheckbox :model-value="isAllSelected" @update:model-value="toggleSelectAll" />
                </th>
                <th class="hidden px-3 py-3 text-left lg:table-cell">Compte</th>
                <th class="py-3 pr-3 pl-4 text-left lg:pl-3">Chantier</th>
                <th class="px-3 py-3 text-left">Tâche</th>
                <th class="px-3 py-3 text-center">Prévision</th>
                <th class="px-3 py-3 text-center">Signalements</th>
                <th class="py-3 pr-4 pl-3 text-center">Statut</th>
              </tr>
            </thead>

            <tbody class="divide-rule text-ink divide-y">
              <tr
                v-for="t in filteredlistTachesSelected"
                :key="t.id"
                class="cursor-pointer transition-colors hover:bg-taupe-100 dark:hover:bg-taupe-400/8"
                @click="showSlide(t)">
                <td class="hidden py-3.5 pl-4 lg:table-cell" @click.stop>
                  <AppCheckbox v-model="selectedRows" :value="t" />
                </td>
                <td class="hidden px-3 py-3.5 lg:table-cell">
                  <span
                    v-if="t.chantiers?.compte"
                    class="inline-block rounded bg-taupe-100 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-taupe-700 tabular-nums ring-1 ring-taupe-200 ring-inset dark:bg-taupe-400/15 dark:text-taupe-200 dark:ring-0">
                    {{ t.chantiers.compte }}
                  </span>
                </td>
                <td class="py-3.5 pr-3 pl-4 font-semibold lg:pl-3">{{ t.chantiers?.name }}</td>
                <td class="px-3 py-3.5">{{ t.taches?.tache }}</td>
                <td class="px-3 py-3.5 text-center whitespace-nowrap">
                  {{ formatDateMonthYear(t.prevision) }}
                </td>
                <td class="px-3 py-3.5">
                  <div class="flex items-center justify-center gap-2.5">
                    <span class="flex" :title="t.important ? 'Important' : 'Non marquée importante'">
                      <Icon
                        name="lucide:triangle-alert"
                        size="16"
                        :class="t.important ? 'text-amber-500' : 'text-slate-300 dark:text-slate-600'" />
                    </span>
                    <span class="flex" :title="t.alerte ? 'Alerte' : 'Aucune alerte'">
                      <Icon
                        name="lucide:siren"
                        size="17"
                        :class="t.alerte ? 'text-red-600 dark:text-red-400' : 'text-slate-300 dark:text-slate-600'" />
                    </span>
                  </div>
                </td>
                <td class="py-3.5 pr-4 pl-3">
                  <div class="flex justify-center">
                    <span
                      v-if="getRealisationStatus(t)"
                      class="inline-flex min-w-22 items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap before:size-1.5 before:rounded-full before:bg-current"
                      :class="STATUT_CLASSES[getRealisationStatus(t).type]">
                      {{ getRealisationStatus(t).label }}
                    </span>
                    <span v-else class="text-slate-400">–</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div
            v-if="filteredlistTachesSelected.length === 0"
            class="text-ink-soft flex flex-1 flex-col items-center justify-center gap-2 px-4 py-12 text-sm">
            <Icon name="lucide:circle-check-big" size="28" class="text-secondary-500" />
            <p v-if="globalFilterTache">Aucune tâche ne correspond à « {{ globalFilterTache }} ».</p>
            <p v-else>Aucune tâche à traiter pour cette sélection.</p>
          </div>
        </div>
      </div>

      <!-- SlideOver pour édition : hors de la colonne, sinon sa <section> vide reçoit le gap-5 et décolle le tableau du pied de page -->
      <!-- Fiche d'une tâche : même panneau que la fiche chantier, en taille moyenne -->
      <AppSidePanel
        v-slot="{ fermer }"
        :open="open"
        size="md"
        :label="`Tâche ${selectedTache.taches?.tache ?? ''}`"
        :dirty="tacheModifiee"
        @close="open = false">
        <header class="panel-brand shrink-0 px-5 py-5 sm:px-7">
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs font-medium text-white/60">Tâche H00</p>
            <button
              type="button"
              class="focus-visible:outline-secondary-400 flex size-8.5 cursor-pointer items-center justify-center rounded-full border border-white/18 text-white transition-colors hover:border-white/35 hover:bg-white/8 focus-visible:outline-2 focus-visible:outline-offset-2"
              aria-label="Fermer"
              @click="fermer">
              <Icon name="lucide:x" size="18" />
            </button>
          </div>
          <p class="font-traverse mt-2 text-[2.1rem] leading-none tracking-[0.03em] text-white tabular-nums">
            {{ selectedTache.chantiers?.compte || '—' }}
          </p>
          <p class="mt-1 truncate text-sm text-white/70">{{ selectedTache.chantiers?.name }}</p>
          <h2 class="mt-3 text-lg leading-snug font-semibold text-white">{{ selectedTache.taches?.tache }}</h2>
          <div class="mt-3 flex flex-wrap gap-2 text-xs font-medium text-white/85">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
              <Icon name="lucide:calendar-clock" size="13" />
              {{
                selectedTache.prevision
                  ? `Prévue en ${formatDateMonthYear(selectedTache.prevision).toLowerCase()}`
                  : 'Sans prévision'
              }}
            </span>
            <span
              v-if="isLate(selectedTache)"
              class="bg-rust-500/35 inline-flex items-center rounded-full px-2.5 py-1 text-white">
              En retard
            </span>
            <span
              v-if="getRealisationStatus(selectedTache)"
              class="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
              <span class="size-1.5 rounded-full" :class="STATUT_POINT[getRealisationStatus(selectedTache).type]" />
              {{ getRealisationStatus(selectedTache).label }}
            </span>
          </div>
        </header>

        <!-- Le fond déborde au-dessus de la zone défilante : le contenu ne vient pas buter contre le bandeau -->
        <div class="dark:bg-night-900 flex min-h-0 flex-1 flex-col bg-slate-100 pt-5 sm:pt-6">
          <div class="flex-1 space-y-5 overflow-y-auto px-4 pb-5 sm:px-7 sm:pb-6">
            <section class="surface-card rounded-xl p-5" aria-labelledby="tache-signalements">
              <h3 id="tache-signalements" class="text-ink font-semibold">Signalements</h3>
              <p class="text-ink-soft mt-0.5 mb-4 text-xs">Communs à tous les profils.</p>
              <div class="space-y-2">
                <AppSwitchRow
                  v-model="important"
                  label="Important"
                  description="Signalée par un triangle dans la liste."
                  icon="lucide:triangle-alert"
                  icon-class="text-amber-500" />
                <AppSwitchRow
                  v-model="alerte"
                  label="Alerte"
                  description="Signalée par un gyrophare dans la liste."
                  icon="lucide:siren"
                  icon-class="text-red-600 dark:text-red-400" />
              </div>
            </section>

            <section class="surface-card rounded-xl p-5" aria-labelledby="tache-suivi">
              <h3 id="tache-suivi" class="text-ink font-semibold">Votre suivi</h3>
              <p class="text-ink-soft mt-0.5 mb-4 text-xs">Propre à votre profil : les autres gardent le leur.</p>
              <label for="tache-commentaire" class="text-ink mb-1.5 block text-[13px] font-medium">Commentaire</label>
              <textarea
                id="tache-commentaire"
                v-model="commentaire"
                rows="5"
                placeholder="Ajoutez un commentaire…"
                class="form-control resize-y py-2.5" />
              <p class="text-ink-soft mt-1 text-xs">Un commentaire fait passer la tâche « En cours ».</p>

              <p class="text-ink mt-5 mb-1.5 text-[13px] font-medium">Date de clôture</p>
              <AppDatePicker v-model="dateCloture" placeholder="Choisir une date" clearable v4 />
              <p class="text-ink-soft mt-1 text-xs">Nécessaire pour clôturer votre part de la tâche.</p>
            </section>
          </div>
        </div>

        <footer
          class="border-rule bg-card flex shrink-0 flex-wrap items-center justify-between gap-2 border-t px-5 py-4 sm:px-7">
          <AppButtonValidated type="button" theme="outline-danger" @click="nonConcerne()">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:x" size="16" />
                Non concerné
              </span>
            </template>
          </AppButtonValidated>
          <div class="flex gap-2">
            <AppButtonValidated type="button" theme="outline" :validated="tacheModifiee" @click="enregistrer()">
              <template #default>
                <span class="flex items-center gap-2">
                  <Icon name="lucide:save" size="16" />
                  Enregistrer
                </span>
              </template>
            </AppButtonValidated>
            <AppButtonValidated type="button" theme="brand" :validated="!!dateCloture" @click="cloturerTache()">
              <template #default>
                <span class="flex items-center gap-2">
                  <Icon name="lucide:circle-check" size="16" />
                  Clôturer
                </span>
              </template>
            </AppButtonValidated>
          </div>
        </footer>
      </AppSidePanel>
    </template>
  </AppPageLayout>
</template>
