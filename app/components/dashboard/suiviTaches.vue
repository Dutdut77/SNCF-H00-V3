<script setup>
// Suivi de tâches H00 sur tous les chantiers (design V4) : page Alertes et page RP1 / RP3.
// Barre latérale : les chantiers concernés (ou tous) ; contenu : leurs tâches, suivi par profil ;
// fiche latérale : drapeaux partagés et MA part (commentaire, clôture). L'impression reprend ce qui est
// affiché, via le slot « impression ».
const props = defineProps({
  // Chantiers regroupés : [{ id, label, compte, etat, taches: [...] }]
  chantiers: { type: Array, default: () => [] },
  titre: { type: String, required: true },
  description: { type: String, default: '' },
  // Nom des tâches suivies, pour les compteurs (« 3 alertes », « 1 tâche RP1 / RP3 »)
  unite: { type: Object, default: () => ({ singulier: 'tâche', pluriel: 'tâches' }) }
})

const { updateH00Entry, updateH00ClotureProfil } = useH00()
const { getAllProfilTache, profilTaches } = useProfilTache()
const { setLoader } = useLoader()
const user = useAuthUser()
const userProfil = computed(() => Number(user.value?.profils))
const profilLabel = (pid) => profilTaches.value.find((p) => p.id === pid)?.label || `Profil ${pid}`

onMounted(() => {
  if (!profilTaches.value?.length) getAllProfilTache()
})

const compter = (n) => `${n} ${n > 1 ? props.unite.pluriel : props.unite.singulier}`

// ============================================
// CHANTIERS (barre latérale) et tâches affichées
// ============================================
const recherche = ref('')
const selectedId = ref(null) // null = tous les chantiers

const chantiersFiltres = computed(() => {
  const q = recherche.value.trim().toLowerCase()
  if (!q) return props.chantiers
  return props.chantiers.filter((c) => c.compte?.toLowerCase().includes(q) || c.label?.toLowerCase().includes(q))
})
const chantierSelectionne = computed(() => props.chantiers.find((c) => c.id === selectedId.value) || null)

// Chantiers affichés (et imprimés) : le chantier choisi, ou tous ceux de la recherche
const chantiersAffiches = computed(() =>
  chantierSelectionne.value ? [chantierSelectionne.value] : chantiersFiltres.value
)
const nbTaches = computed(() => props.chantiers.reduce((n, c) => n + c.taches.length, 0))
const nbTachesAffichees = computed(() => chantiersAffiches.value.reduce((n, c) => n + c.taches.length, 0))

// Le chantier choisi disparaît de la liste (recherche) : retour à « Tous les chantiers »
watch(chantiersFiltres, (liste) => {
  if (selectedId.value && !liste.some((c) => c.id === selectedId.value)) selectedId.value = null
})

const goToChantier = (id) => navigateTo(`/chantiers/${id}`)

// ============================================
// STATUTS PAR PROFIL (couleurs V4, comme la page Tâches)
// ============================================
const STATUTS = {
  0: {
    label: 'À faire',
    classe: 'bg-rust-100 text-rust-700 dark:bg-rust-500/16 dark:text-rust-300',
    point: 'bg-rust-500'
  },
  1: {
    label: 'En cours',
    classe: 'bg-ochre-100 text-ochre-700 dark:bg-ochre-400/14 dark:text-ochre-300',
    point: 'bg-ochre-400'
  },
  2: {
    label: 'Clôturé',
    classe: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/16 dark:text-emerald-300',
    point: 'bg-emerald-500'
  }
}
const statutDe = (tache, pid) => STATUTS[getSlot(tache, pid).status] || STATUTS[0]

const formatMois = (date) => {
  if (!date) return null
  const d = new Date(date)
  if (isNaN(d.getTime())) return null
  const s = d.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}
const formatJour = (date) => {
  if (!date) return null
  const d = new Date(date)
  return isNaN(d.getTime()) ? null : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Date au format YYYY-MM-DD (sélecteur de date et enregistrement)
const formatDateForInput = (dateString) => {
  if (!dateString) return null
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// ============================================
// FICHE LATÉRALE : drapeaux partagés et MA part
// ============================================
const open = ref(false)
const selectedTache = ref({})
const chantierDeLaTache = ref(null)
const commentaire = ref('')
const important = ref(false)
const alerte = ref(false)
const dateCloture = ref(null)

// L'utilisateur connecté est-il concerné par la tâche sélectionnée ?
const isConcerned = computed(() => (selectedTache.value?.tache_profil || []).includes(userProfil.value))

// Saisie en cours : la fermeture demande confirmation
const etatInitial = ref('')
const etatFiche = () => JSON.stringify([commentaire.value, important.value, alerte.value, dateCloture.value])
const ficheModifiee = computed(() => open.value && etatFiche() !== etatInitial.value)

const ouvrir = (chantier, tache) => {
  chantierDeLaTache.value = chantier
  selectedTache.value = tache
  important.value = tache.important || false
  alerte.value = tache.alerte || false
  // Préremplir depuis MA part (profil connecté)
  const slot = getSlot(tache, userProfil.value)
  commentaire.value = slot.commentaire || ''
  dateCloture.value = slot.status === 2 && slot.realisation ? formatDateForInput(slot.realisation) : null
  etatInitial.value = etatFiche()
  open.value = true
}

// Réinjecte la ligne mise à jour dans l'état local
const applyLocal = (data) => {
  const taches = chantierDeLaTache.value?.taches
  const index = taches?.findIndex((t) => t.id === selectedTache.value.id) ?? -1
  if (index !== -1) {
    taches[index] = {
      ...taches[index],
      important: important.value,
      alerte: alerte.value,
      ...(data ? { cloture_profil: data.cloture_profil, status: data.status, realisation: data.realisation } : {})
    }
  }
}

// Enregistrer : MA part si concerné (sinon seulement les drapeaux partagés)
const enregistrer = async () => {
  setLoader(true)
  try {
    if (isConcerned.value) {
      const newStatus = commentaire.value.trim() !== '' ? 1 : 0
      const { data, error } = await updateH00ClotureProfil(
        selectedTache.value,
        userProfil.value,
        { status: newStatus, commentaire: commentaire.value },
        selectedTache.value.tache_profil || [],
        { shared: { important: important.value, alerte: alerte.value } }
      )
      if (error) throw error
      applyLocal(data)
    } else {
      const { error } = await updateH00Entry(selectedTache.value.id, {
        important: important.value,
        alerte: alerte.value
      })
      if (error) throw error
      applyLocal(null)
    }
    open.value = false
  } catch (err) {
    console.error("Erreur lors de l'enregistrement:", err)
  } finally {
    setLoader(false)
  }
}

// Clôturer MA part (si concerné)
const cloturerTache = async () => {
  if (!isConcerned.value) return
  setLoader(true)
  try {
    const { data, error } = await updateH00ClotureProfil(
      selectedTache.value,
      userProfil.value,
      {
        status: 2,
        realisation: formatDateForInput(dateCloture.value),
        commentaire: commentaire.value,
        non_concerne: false
      },
      selectedTache.value.tache_profil || [],
      { shared: { important: important.value, alerte: alerte.value } }
    )
    if (error) throw error
    applyLocal(data)
    open.value = false
  } catch (err) {
    console.error('Erreur lors de la clôture:', err)
  } finally {
    setLoader(false)
  }
}
</script>

<template>
  <AppPageLayout v4 class="print:hidden">
    <!-- Bandeau : le chantier choisi (compte en grand, cliquable), sinon le titre de la page -->
    <template #entete>
      <AppPageHero
        :title="props.titre"
        :description="props.description"
        illustration="taches"
        :clickable="!!chantierSelectionne"
        @click="chantierSelectionne && goToChantier(chantierSelectionne.id)">
        <template v-if="chantierSelectionne" #default="{ ui }">
          <p
            :class="ui.titre"
            class="font-traverse text-[clamp(1.9rem,1.3rem+1.5vw,2.6rem)] leading-none tracking-[0.03em] tabular-nums">
            {{ chantierSelectionne.compte }}
          </p>
          <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1 class="text-ink text-lg leading-snug font-semibold">{{ chantierSelectionne.label }}</h1>
            <span class="rounded-full px-2.5 py-1 text-[13px] font-medium" :class="ui.pastille">
              {{ compter(chantierSelectionne.taches.length) }}
            </span>
          </div>
        </template>
      </AppPageHero>
    </template>

    <!-- ============ Barre latérale : synthèse, recherche, chantiers ============ -->
    <template #sidebar>
      <div class="flex flex-col gap-5 pb-6 lg:pt-2">
        <!-- Synthèse : même carte d'accent que le mois ou l'année des autres pages -->
        <div class="bg-bandeau rounded-xl px-4 py-3.5 text-center shadow-[0_10px_24px_-12px_rgb(43_4_35/0.45)]">
          <p class="font-traverse text-[1.3rem] leading-tight tracking-[0.03em] text-white">{{ compter(nbTaches) }}</p>
          <p class="mt-1 text-xs text-white/80">
            sur {{ props.chantiers.length }} chantier{{ props.chantiers.length > 1 ? 's' : '' }} en cours
          </p>
        </div>

        <!-- Chantiers : titre, recherche, puis la liste en retrait le long du trait (utils/panneau.js) -->
        <nav class="flex flex-col gap-1.5" aria-label="Filtrer par chantier">
          <p class="px-3" :class="PANNEAU_TITRE">Chantiers</p>
          <AppInputSearch v-model="recherche" boxed dense placeholder="Rechercher un chantier…" class="mb-1" />
          <div :class="PANNEAU_GROUPE">
            <button
              type="button"
              class="py-2.5"
              :class="[PANNEAU_ENTREE, panneauItem(selectedId === null)]"
              :aria-pressed="selectedId === null"
              @click="selectedId = null">
              <Icon name="lucide:layers" size="18" class="shrink-0" :class="panneauIcone(selectedId === null)" />
              <span class="flex min-w-0 flex-1 flex-col">
                <span
                  class="text-xs tracking-wide"
                  :class="
                    selectedId === null ? 'text-magenta-600 dark:text-magenta-300' : 'text-slate-500 dark:text-white/50'
                  ">
                  {{ chantiersFiltres.length }} chantier{{ chantiersFiltres.length > 1 ? 's' : '' }}
                </span>
                <span class="text-sm font-medium">Tous les chantiers</span>
              </span>
              <span
                class="inline-flex h-5.5 min-w-6.5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold"
                :class="panneauBadge(selectedId === null)">
                {{ chantiersFiltres.reduce((n, c) => n + c.taches.length, 0) }}
              </span>
            </button>

            <button
              v-for="c in chantiersFiltres"
              :key="c.id"
              type="button"
              class="py-2.5"
              :class="[PANNEAU_ENTREE, panneauItem(selectedId === c.id)]"
              :aria-pressed="selectedId === c.id"
              @click="selectedId = c.id">
              <Icon
                :name="selectedId === c.id ? 'lucide:folder-open' : 'lucide:folder'"
                size="18"
                class="shrink-0"
                :class="panneauIcone(selectedId === c.id)" />
              <span class="flex min-w-0 flex-1 flex-col">
                <span
                  class="text-xs tracking-wide tabular-nums"
                  :class="
                    selectedId === c.id ? 'text-magenta-600 dark:text-magenta-300' : 'text-slate-500 dark:text-white/50'
                  ">
                  {{ c.compte }}
                </span>
                <span class="line-clamp-2 text-sm font-medium" :title="c.label">{{ c.label }}</span>
              </span>
              <span
                class="inline-flex h-5.5 min-w-6.5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold"
                :class="panneauBadge(selectedId === c.id)">
                {{ c.taches.length }}
              </span>
            </button>

            <p v-if="chantiersFiltres.length === 0" class="text-ink-soft flex items-center gap-2 px-3 py-4 text-[13px]">
              <Icon name="lucide:search-x" size="18" />
              Aucun chantier ne correspond à la recherche.
            </p>
          </div>
        </nav>
      </div>
    </template>

    <!-- ============ Contenu : tâches des chantiers affichés ============ -->
    <template #default>
      <div class="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 lg:px-8 lg:pt-4 lg:pb-6">
        <div class="flex flex-wrap items-center gap-2">
          <p class="text-ink-soft text-sm">
            {{ compter(nbTachesAffichees) }}
            <template v-if="!chantierSelectionne">
              · {{ chantiersAffiches.length }} chantier{{ chantiersAffiches.length > 1 ? 's' : '' }}
            </template>
          </p>
          <div class="ml-auto flex gap-2">
            <AppButtonValidated
              v-if="chantierSelectionne"
              type="button"
              theme="outline"
              @click="goToChantier(chantierSelectionne.id)">
              <template #default>
                <span class="flex items-center gap-2">
                  <Icon name="lucide:external-link" size="16" />
                  Voir le chantier
                </span>
              </template>
            </AppButtonValidated>
            <!-- Imprime ce qui est affiché : le chantier choisi, ou tous ceux de la recherche -->
            <AppButtonValidated
              type="button"
              theme="outline"
              class="max-lg:hidden"
              :validated="nbTachesAffichees > 0"
              @click="lancerImpression()">
              <template #default>
                <span class="flex items-center gap-2">
                  <Icon name="lucide:printer" size="16" />
                  Imprimer
                </span>
              </template>
            </AppButtonValidated>
          </div>
        </div>

        <!-- Aucune tâche -->
        <div
          v-if="chantiersAffiches.length === 0"
          class="surface-card text-ink-soft flex flex-col items-center gap-3 rounded-xl px-6 py-16 text-center">
          <Icon name="lucide:circle-check" size="32" class="text-emerald-500" />
          <p class="text-ink font-semibold">Rien à signaler</p>
          <p class="text-sm">
            {{
              recherche ? 'Aucun chantier ne correspond à la recherche.' : `Aucune ${props.unite.singulier} en cours.`
            }}
          </p>
        </div>

        <!-- Un bloc par chantier ; en-tête du chantier seulement quand ils sont tous affichés -->
        <section
          v-for="c in chantiersAffiches"
          :key="c.id"
          class="flex flex-col gap-2.5"
          :aria-label="`${c.compte} ${c.label}`">
          <header v-if="!chantierSelectionne" class="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              class="group flex min-w-0 cursor-pointer items-center gap-2.5 text-left"
              title="Voir le chantier"
              @click="goToChantier(c.id)">
              <span
                class="shrink-0 rounded bg-taupe-100 px-2 py-0.5 text-xs font-semibold text-taupe-700 tabular-nums ring-1 ring-taupe-200 ring-inset dark:bg-taupe-400/15 dark:text-taupe-200 dark:ring-0">
                {{ c.compte }}
              </span>
              <span
                class="text-ink group-hover:text-secondary-700 dark:group-hover:text-secondary-300 truncate font-semibold transition-colors">
                {{ c.label }}
              </span>
            </button>
            <span class="text-ink-soft shrink-0 text-xs">{{ compter(c.taches.length) }}</span>
          </header>

          <article
            v-for="tache in c.taches"
            :key="tache.id"
            class="surface-card hover:surface-raised cursor-pointer rounded-xl p-4 transition-shadow sm:px-5"
            role="button"
            tabindex="0"
            @click="ouvrir(c, tache)"
            @keydown.enter="ouvrir(c, tache)">
            <div class="flex items-start gap-3">
              <div class="min-w-0 flex-1">
                <p class="text-ink-soft text-xs">
                  {{ tache.categorie }}
                  <template v-if="formatMois(tache.prevision)">
                    · prévue en {{ formatMois(tache.prevision).toLowerCase() }}
                  </template>
                </p>
                <h3 class="text-ink mt-0.5 font-semibold">{{ tache.libelle }}</h3>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <span v-if="tache.important" class="flex" title="Important">
                  <Icon name="lucide:triangle-alert" size="18" class="text-amber-500" />
                </span>
                <span v-if="tache.alerte" class="flex" title="Alerte">
                  <Icon name="lucide:siren" size="18" class="text-red-600 dark:text-red-400" />
                </span>
              </div>
            </div>

            <!-- Statut de chaque profil concerné -->
            <div class="mt-3 flex flex-wrap items-center gap-1.5">
              <span
                v-for="pid in concernedProfils(tache.tache_profil, tache)"
                :key="pid"
                class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="statutDe(tache, pid).classe"
                :title="`${profilLabel(pid)} : ${statutDe(tache, pid).label}`">
                <span class="size-1.5 rounded-full" :class="statutDe(tache, pid).point" />
                {{ profilLabel(pid) }}
              </span>
            </div>

            <!-- Commentaires des profils -->
            <div
              v-for="pid in concernedProfils(tache.tache_profil, tache).filter((p) => getSlot(tache, p).commentaire)"
              :key="`com-${pid}`"
              class="text-ink mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm whitespace-pre-line dark:bg-white/5">
              <span class="font-semibold">{{ profilLabel(pid) }} :</span>
              {{ getSlot(tache, pid).commentaire }}
            </div>
          </article>
        </section>
      </div>

      <!-- ============ Fiche : drapeaux partagés et suivi par profil ============ -->
      <AppSidePanel
        v-slot="{ fermer }"
        :open="open"
        size="md"
        :label="selectedTache.libelle || ''"
        :dirty="ficheModifiee"
        @close="open = false">
        <header class="panel-brand shrink-0 px-5 py-5 sm:px-7">
          <div class="flex items-center justify-between gap-3">
            <p class="text-xs font-medium text-white/60">{{ selectedTache.categorie }}</p>
            <button
              type="button"
              class="flex size-8.5 cursor-pointer items-center justify-center rounded-full border border-white/18 text-white transition-colors hover:border-white/35 hover:bg-white/8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="Fermer"
              @click="fermer">
              <Icon name="lucide:x" size="18" />
            </button>
          </div>
          <p class="font-traverse mt-2 text-[2.1rem] leading-none tracking-[0.03em] text-white tabular-nums">
            {{ chantierDeLaTache?.compte || '—' }}
          </p>
          <p class="mt-1 truncate text-sm text-white/70">{{ chantierDeLaTache?.label }}</p>
          <h2 class="mt-3 text-lg leading-snug font-semibold text-white">{{ selectedTache.libelle }}</h2>
          <div
            v-if="formatMois(selectedTache.prevision)"
            class="mt-3 flex flex-wrap gap-2 text-xs font-medium text-white/85">
            <span class="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1">
              <Icon name="lucide:calendar-clock" size="13" />
              Prévue en {{ formatMois(selectedTache.prevision).toLowerCase() }}
            </span>
          </div>
        </header>

        <div class="dark:bg-night-900 flex min-h-0 flex-1 flex-col bg-slate-100 pt-5 sm:pt-6">
          <div class="flex-1 space-y-5 overflow-y-auto px-4 pb-5 sm:px-7 sm:pb-6">
            <section class="surface-card rounded-xl p-5" aria-labelledby="suivi-signalements">
              <h3 id="suivi-signalements" class="text-ink font-semibold">Signalements</h3>
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

            <section class="surface-card rounded-xl p-5" aria-labelledby="suivi-profils">
              <h3 id="suivi-profils" class="text-ink font-semibold">Suivi par profil</h3>
              <p class="text-ink-soft mt-0.5 mb-4 text-xs">Chaque profil tient sa part : vous modifiez la vôtre.</p>

              <div class="space-y-3">
                <div
                  v-for="pid in concernedProfils(selectedTache.tache_profil, selectedTache)"
                  :key="pid"
                  class="rounded-lg border p-4"
                  :class="
                    pid === userProfil
                      ? 'border-magenta-300 bg-magenta-50/40 dark:border-magenta-400/40 dark:bg-magenta-500/5'
                      : 'border-slate-200 dark:border-white/10'
                  ">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-ink flex items-center gap-2 text-sm font-semibold">
                      <Icon name="lucide:user-round" size="16" class="text-slate-400" />
                      {{ profilLabel(pid) }}
                      <span v-if="pid === userProfil" class="text-ink-soft text-xs font-normal">(vous)</span>
                    </span>
                    <span class="flex items-center gap-2">
                      <span
                        v-if="getSlot(selectedTache, pid).status === 2"
                        class="text-ink-soft text-xs whitespace-nowrap">
                        {{ formatJour(getSlot(selectedTache, pid).realisation) }}
                      </span>
                      <span
                        class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                        :class="statutDe(selectedTache, pid).classe">
                        {{ statutDe(selectedTache, pid).label }}
                      </span>
                    </span>
                  </div>

                  <!-- Ma part : éditable ; les autres : lecture seule -->
                  <div class="mt-3">
                    <template v-if="pid === userProfil && isConcerned">
                      <label for="suivi-commentaire" class="text-ink mb-1.5 block text-[13px] font-medium">
                        Mon commentaire
                      </label>
                      <textarea
                        id="suivi-commentaire"
                        v-model="commentaire"
                        rows="4"
                        placeholder="Ajoutez un commentaire…"
                        class="form-control resize-y py-2.5" />
                      <p class="text-ink-soft mt-1 text-xs">Un commentaire fait passer votre part « En cours ».</p>
                      <p class="text-ink mt-4 mb-1.5 text-[13px] font-medium">Date de clôture</p>
                      <AppDatePicker v-model="dateCloture" placeholder="Choisir une date" clearable v4 />
                    </template>
                    <p v-else class="text-ink-soft text-sm whitespace-pre-line">
                      {{ getSlot(selectedTache, pid).commentaire || 'Aucun commentaire' }}
                    </p>
                  </div>
                </div>
              </div>

              <p
                v-if="!isConcerned"
                class="mt-4 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">
                <Icon name="lucide:lock" size="16" class="mt-0.5 shrink-0" />
                Votre profil n'est pas concerné par cette tâche : vous pouvez seulement modifier les signalements.
              </p>
            </section>
          </div>
        </div>

        <footer class="border-rule bg-card flex shrink-0 items-center justify-end gap-2 border-t px-5 py-4 sm:px-7">
          <AppButtonValidated type="button" theme="outline" :validated="ficheModifiee" @click="enregistrer()">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:save" size="16" />
                Enregistrer
              </span>
            </template>
          </AppButtonValidated>
          <AppButtonValidated
            v-if="isConcerned"
            type="button"
            theme="brand"
            :validated="!!dateCloture"
            @click="cloturerTache()">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:circle-check" size="16" />
                Clôturer ma part
              </span>
            </template>
          </AppButtonValidated>
        </footer>
      </AppSidePanel>
    </template>
  </AppPageLayout>

  <!-- Impression : les chantiers affichés -->
  <div class="hidden print:block">
    <slot name="impression" :chantiers="chantiersAffiches" />
  </div>
</template>
