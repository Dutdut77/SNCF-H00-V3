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

  return [
    {
      value: null,
      label: 'Tous les chantiers',
      icon: 'lucide-folder',
      badge: allTaches.length
    },
    ...Object.values(grouped).map((group) => ({
      value: group.chantier.id,
      compte: group.chantier.compte,
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

// Ouvrir la sidebar avec les détails de la tâche
const showSlide = (row) => {
  if (row) {
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
    open.value = true
  } else {
    open.value = !open.value
  }
}

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
  <AppPageLayout class="taches" petrol>
    <!-- Barre latérale pétrole : mois, puis chantiers -->
    <template #sidebar>
      <div class="flex flex-col gap-5 pb-6 lg:pt-2">
        <div class="period">
          <button
            type="button"
            class="period__nav"
            :disabled="monthOffset === 0"
            :aria-label="monthOffset > 0 ? `Mois précédent (${monthNavLabel(monthOffset - 1)})` : 'Mois précédent'"
            :title="monthOffset > 0 ? monthNavLabel(monthOffset - 1) : undefined"
            @click="monthOffset--">
            <Icon name="lucide:chevron-left" size="18" />
          </button>
          <div class="period__center" aria-live="polite">
            <p class="period__month">{{ monthLabel(monthOffset) }}</p>
            <p class="period__meta">{{ monthSummary.text }}</p>
            <p v-if="monthSummary.late" class="period__late">{{ monthSummary.late }} en retard</p>
          </div>
          <button
            type="button"
            class="period__nav"
            :disabled="monthOffset >= maxMonthOffset"
            :aria-label="
              monthOffset < maxMonthOffset ? `Mois suivant (${monthNavLabel(monthOffset + 1)})` : 'Mois suivant'
            "
            :title="monthOffset < maxMonthOffset ? monthNavLabel(monthOffset + 1) : undefined"
            @click="monthOffset++">
            <Icon name="lucide:chevron-right" size="18" />
          </button>
        </div>

        <AppInputSearch v-model="globalFilterChantier" boxed dense placeholder="Rechercher un chantier…" />

        <nav class="flex flex-col gap-1" aria-label="Filtrer par chantier">
          <button
            v-for="item in filteredItemsLeftNavBar"
            :key="item.value ?? 'tous'"
            type="button"
            class="site"
            :class="{ 'is-active': selectedChantier === item.value }"
            :aria-pressed="selectedChantier === item.value"
            @click="selectedChantier = item.value">
            <Icon v-if="item.value === null" name="lucide:layers" size="18" class="site__icon" />
            <span class="site__text">
              <span v-if="item.compte" class="site__compte">{{ item.compte }}</span>
              <span class="site__name">{{ item.label }}</span>
            </span>
            <span v-if="item.badge !== undefined" class="site__badge">{{ item.badge }}</span>
          </button>

          <p v-if="filteredItemsLeftNavBar.length === 0" class="site__empty">
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
          @click="goToChantier" />

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
              <AppButtonValidated
                theme="petrol"
                type="button"
                :validated="selectedRows.length > 0"
                @click="printTaches">
                <template #default>
                  <span class="flex items-center gap-2">
                    <Icon name="lucide:printer" size="16" />
                    Imprimer
                    <span v-if="selectedRows.length > 0" class="print-count">{{ selectedRows.length }}</span>
                  </span>
                </template>
              </AppButtonValidated>
            </div>
          </div>
        </div>

        <div class="taches-card flex w-full flex-1 flex-col overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="taches-thead">
              <tr>
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

            <tbody>
              <tr v-for="t in filteredlistTachesSelected" :key="t.id" class="taches-row" @click="showSlide(t)">
                <td class="hidden py-3.5 pl-4 lg:table-cell" @click.stop>
                  <AppCheckbox v-model="selectedRows" :value="t" />
                </td>
                <td class="hidden px-3 py-3.5 lg:table-cell">
                  <span v-if="t.chantiers?.compte" class="compte">{{ t.chantiers.compte }}</span>
                </td>
                <td class="py-3.5 pr-3 pl-4 font-semibold lg:pl-3">{{ t.chantiers?.name }}</td>
                <td class="px-3 py-3.5">{{ t.taches?.tache }}</td>
                <td class="px-3 py-3.5 text-center whitespace-nowrap" :class="{ 'is-late': isLate(t) }">
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
                      class="statut"
                      :class="`statut--${getRealisationStatus(t).type}`">
                      {{ getRealisationStatus(t).label }}
                    </span>
                    <span v-else class="text-slate-400">–</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="filteredlistTachesSelected.length === 0" class="taches-empty">
            <Icon name="lucide:circle-check-big" size="28" class="text-secondary-500" />
            <p v-if="globalFilterTache">Aucune tâche ne correspond à « {{ globalFilterTache }} ».</p>
            <p v-else>Aucune tâche à traiter pour cette sélection.</p>
          </div>
        </div>
      </div>

      <!-- SlideOver pour édition : hors de la colonne, sinon sa <section> vide reçoit le gap-5 et décolle le tableau du pied de page -->
      <AppSlideOver :sideModal="open" :closeSideModal="showSlide">
        <template #default>
          <AppSlideOverContent v-if="open" :closeSideModal="showSlide">
            <template #header>
              <div class="text-center">
                <div class="slide-icon mx-auto mb-4">
                  <Icon name="lucide:clipboard-edit" size="26" />
                </div>
                <h2 class="text-petrol-900 text-xl font-semibold dark:text-white">
                  {{ selectedTache.chantiers?.name }}
                </h2>
                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {{ selectedTache.taches?.tache }}
                </p>
              </div>
            </template>

            <template #default>
              <div class="flex h-full flex-col gap-6">
                <h3 class="slide-section">Informations</h3>
                <div class="flex items-center justify-between gap-2">
                  <AppSwitch v-model="important" label="Important" class="full" />
                  <AppSwitch v-model="alerte" label="Alerte" class="full" />
                </div>

                <h3 class="slide-section">Commentaires</h3>
                <div class="flex h-full flex-col gap-1.5">
                  <textarea
                    v-model="commentaire"
                    class="slide-textarea h-full w-full resize-y"
                    name="commentaire"
                    cols="50"
                    rows="5"
                    aria-label="Commentaire"
                    placeholder="Ajoutez un commentaire…"></textarea>
                </div>

                <AppDatePicker
                  v-model="dateCloture"
                  title="Date de clôture"
                  placeholder="Sélectionnez une date"
                  clearable />
              </div>
            </template>

            <template #footer>
              <div class="flex flex-col items-center justify-end gap-2 lg:flex-row">
                <AppButtonValidated
                  type="button"
                  theme="petrol"
                  :validated="!!dateCloture"
                  @click="cloturerTache()"
                  class="w-full lg:w-auto">
                  <template #default>
                    <span class="flex items-center gap-2">
                      <Icon name="lucide:circle-check" size="16" />
                      Clôturer
                    </span>
                  </template>
                </AppButtonValidated>
                <AppButtonValidated
                  type="button"
                  theme="outline-danger"
                  @click="nonConcerne()"
                  class="w-full lg:w-auto">
                  <template #default>
                    <span class="flex items-center gap-2">
                      <Icon name="lucide:x" size="16" />
                      Non concerné
                    </span>
                  </template>
                </AppButtonValidated>
                <AppButtonValidated type="button" theme="outline" @click="enregistrer()" class="w-full lg:w-auto">
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
    </template>
  </AppPageLayout>
</template>

<style scoped>
/* ===== Tokens de la page (design V4, repris de la page de connexion) ===== */
.taches {
  --ink: var(--color-petrol-900);
  --ink-soft: #4a5d63;
  --rule: rgb(10 38 48 / 0.09);
  --card: #ffffff;
  --card-edge: rgb(10 38 48 / 0.06);
  --card-shadow: 0 1px 2px rgb(10 38 48 / 0.06), 0 12px 28px -14px rgb(10 38 48 / 0.2);
  /* En-tête du tableau : vert d'eau des cartes de la page de connexion */
  --thead: #c5e3dc;
  --thead-ink: var(--color-petrol-900);
  --row-hover: var(--color-petrol-50);
  --tag-bg: var(--color-petrol-50);
  --tag-ink: var(--color-petrol-700);
  /* Vieux rose du logo UO pour le retard, ambre pour l'en-cours, sarcelle pour le fait */
  --rust: #a8483f;
  --rust-soft: #f7e2df;
  --amber: #8a5a07;
  --amber-soft: #fbefd5;
  --teal: var(--color-secondary-700);
  --teal-soft: var(--color-secondary-100);
}
.dark .taches {
  --ink: #e6eef0;
  --ink-soft: #9fb0b6;
  --rule: rgb(203 213 225 / 0.09);
  --card: var(--color-night-800);
  --card-edge: rgb(255 255 255 / 0.07);
  --card-shadow: 0 1px 2px rgb(0 0 0 / 0.3), 0 16px 32px -14px rgb(0 0 0 / 0.6);
  --thead: #1f5a52;
  --thead-ink: rgb(255 255 255 / 0.92);
  --row-hover: rgb(255 255 255 / 0.03);
  --tag-bg: rgb(85 171 150 / 0.14);
  --tag-ink: var(--color-secondary-300);
  --rust: #f0a39c;
  --rust-soft: rgb(201 102 94 / 0.16);
  --amber: #f3c969;
  --amber-soft: rgb(245 180 60 / 0.14);
  --teal: var(--color-secondary-300);
  --teal-soft: rgb(85 171 150 / 0.16);
}

/* ===== Barre latérale pétrole ===== */
/* Navigateur de période en carte translucide : un outil, distinct de la marque au-dessus */
.period {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.75rem 0.625rem;
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 0.75rem;
  background: rgb(255 255 255 / 0.06);
}
.period__nav {
  display: flex;
  width: 2.1rem;
  height: 2.1rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(255 255 255 / 0.18);
  border-radius: 9999px;
  color: #fff;
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}
.period__nav:hover:not(:disabled) {
  border-color: rgb(255 255 255 / 0.35);
  background: rgb(255 255 255 / 0.08);
}
.period__nav:disabled {
  opacity: 0.3;
  cursor: default;
}
.period__center {
  min-width: 0;
  flex: 1;
  text-align: center;
}
.period__month {
  font-family: 'Traverse', sans-serif;
  font-size: 1.3rem;
  line-height: 1.1;
  letter-spacing: 0.03em;
  color: #fff;
}
.period__meta {
  margin-top: 0.4rem;
  font-size: 0.78rem;
  color: rgb(255 255 255 / 0.65);
}
.period__late {
  margin-top: 0.15rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: #f0a39c;
}

.site {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.6rem 0.75rem;
  border-radius: 0.5rem;
  text-align: left;
  color: rgb(255 255 255 / 0.8);
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}
.site:hover {
  color: #fff;
  background: rgb(255 255 255 / 0.06);
}
.site.is-active {
  color: #fff;
  background: rgb(255 255 255 / 0.1);
}
/* Repère sarcelle du chantier sélectionné, comme la barre active de AppLeftNavBar */
.site.is-active::before {
  content: '';
  position: absolute;
  top: 0.5rem;
  bottom: 0.5rem;
  left: 0;
  width: 3px;
  border-radius: 3px;
  background: var(--color-secondary-400);
}
.site__icon {
  flex-shrink: 0;
  color: var(--color-secondary-300);
}
.site__text {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}
.site__compte {
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  color: rgb(255 255 255 / 0.5);
}
.site.is-active .site__compte {
  color: var(--color-secondary-300);
}
.site__name {
  overflow: hidden;
  font-size: 0.875rem;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.site__badge {
  display: inline-flex;
  min-width: 1.6rem;
  height: 1.35rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  padding: 0 0.4rem;
  border-radius: 9999px;
  font-size: 0.72rem;
  font-weight: 700;
  color: rgb(255 255 255 / 0.85);
  background: rgb(255 255 255 / 0.1);
}
.site.is-active .site__badge {
  color: var(--color-petrol-950);
  background: var(--color-secondary-400);
}
.site__empty {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 0.75rem;
  font-size: 0.8125rem;
  color: rgb(255 255 255 / 0.6);
}
.period__nav:focus-visible,
.site:focus-visible {
  outline: 2px solid var(--color-secondary-400);
  outline-offset: 2px;
}

.print-count {
  min-width: 1.25rem;
  padding: 0 0.35rem;
  border-radius: 9999px;
  font-size: 0.72rem;
  background: rgb(255 255 255 / 0.2);
}

/* ===== Tableau ===== */
.taches-card {
  border-radius: 0.75rem;
  background: var(--card);
  box-shadow: var(--card-shadow);
  outline: 1px solid var(--card-edge);
  outline-offset: -1px;
}
.taches-thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  color: var(--thead-ink);
  background: var(--thead);
}
.taches-row {
  cursor: pointer;
  transition: background-color 0.15s ease;
}
.taches-row:hover {
  background: var(--row-hover);
}
.taches-row td {
  color: var(--ink);
  border-top: 1px solid var(--rule);
}
.taches-row:first-child td {
  border-top: 0;
}
.taches-row td.is-late {
  font-weight: 600;
  color: var(--rust);
}

.compte {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 0.3rem;
  font-size: 0.75rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--tag-ink);
  background: var(--tag-bg);
}

.statut {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}
.statut::before {
  content: '';
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 9999px;
  background: currentColor;
}
.statut--a_faire {
  color: var(--rust);
  background: var(--rust-soft);
}
.statut--en_cours {
  color: var(--amber);
  background: var(--amber-soft);
}
.statut--fait {
  color: var(--teal);
  background: var(--teal-soft);
}

.taches-empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 3rem 1rem;
  font-size: 0.875rem;
  color: var(--ink-soft);
}

/* ===== Panneau d'édition (téléporté : pas d'accès aux tokens de .taches) ===== */
.slide-icon {
  display: flex;
  width: 3.5rem;
  height: 3.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  color: var(--color-petrol-700);
  background: var(--color-petrol-50);
}
.dark .slide-icon {
  color: var(--color-secondary-300);
  background: rgb(85 171 150 / 0.14);
}
.slide-section {
  padding-bottom: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #4a5d63;
  border-bottom: 1px solid rgb(10 38 48 / 0.1);
}
.dark .slide-section {
  color: #9fb0b6;
  border-color: rgb(203 213 225 / 0.12);
}
.slide-textarea {
  min-height: 8rem;
  padding: 0.85rem 1rem;
  border: 1px solid #cbd5e1;
  border-radius: 0.6rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-petrol-900);
  background: #fff;
}
.slide-textarea:focus {
  outline: none;
  border-color: var(--color-secondary-500);
  box-shadow: 0 0 0 3px rgb(63 141 125 / 0.18);
}
.dark .slide-textarea {
  color: #e6eef0;
  background: transparent;
  border-color: rgb(203 213 225 / 0.18);
}
</style>
