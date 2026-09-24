<script setup>
definePageMeta({
  requiresAuth: true,
  requiredRole: ''
})
useHead({
  title: 'H00 - Planning des tâches',
  description: 'Planning annuel des tâches, mois par mois'
})

const { setLoader } = useLoader()
const { taches, getTaches } = useTaches()
const { getChantiersUserNonTermines, allChantiersUserNonTermines } = useChantiers()
const { isAuthorizedForTacheBis } = useLevelUser()
const user = useAuthUser()
const userProfil = computed(() => Number(user.value?.profils))

const MOIS = ['Janv.', 'Févr.', 'Mars', 'Avril', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.']
const aujourdhui = new Date()
const moisCourant = aujourdhui.getMonth() + 1
const anneeCourante = aujourdhui.getFullYear()

const year = ref(anneeCourante)
const userH00Entries = ref([])

// Une entrée par tâche H00 prévue : mois de prévision, tâche, chantier et statut de MON profil
const transformAuthorizedChantiers = (authorizedChantiers) => {
  if (!Array.isArray(authorizedChantiers)) return []

  return authorizedChantiers.flatMap((chantier) =>
    (chantier.h00 ?? [])
      .filter((h) => h.prevision)
      .map((h) => {
        const date = new Date(h.prevision)
        return {
          id: h.id,
          month: date.getMonth() + 1, // 1 → 12
          year: date.getFullYear(),
          tache_id: h.tache_id,
          // statut du point de vue de MON profil (comme l'accueil / les alertes)
          tache_status: getSlot(h, userProfil.value).status,
          chantier_id: chantier.id,
          chantier_name: chantier.name,
          chantier_compte: chantier.compte
        }
      })
  )
}

const loadAllData = async () => {
  setLoader(true)
  try {
    await getTaches()
    await getChantiersUserNonTermines()
    const authorizedChantiers = isAuthorizedForTacheBis(allChantiersUserNonTermines.value, taches.value)
    userH00Entries.value = transformAuthorizedChantiers(authorizedChantiers)
  } finally {
    setLoader(false)
  }
}

const occurrencesAnnee = computed(() => userH00Entries.value.filter((e) => e.year === year.value))

// ============================================
// TÂCHES SUIVIES (choisies dans la barre latérale)
// ============================================
// Mémorisées dans le navigateur : chacun retrouve sa sélection à la visite suivante
const CLE_SUIVI = 'h00-planning-taches'
const tachesSuivies = ref([])
watch(tachesSuivies, (ids) => {
  try {
    localStorage.setItem(CLE_SUIVI, JSON.stringify(ids))
  } catch {
    // stockage indisponible (navigation privée…) : la sélection vaut pour la visite
  }
})

const estSuivie = (id) => tachesSuivies.value.includes(id)
const basculer = (id) => {
  tachesSuivies.value = estSuivie(id) ? tachesSuivies.value.filter((x) => x !== id) : [...tachesSuivies.value, id]
}

// Catalogue du panneau : tâches prévues dans l'année (et tâches déjà suivies), groupées par catégorie
const rechercheTache = ref('')
const tacheParId = computed(() => new Map((taches.value || []).map((t) => [t.id, t])))
const catalogue = computed(() => {
  const nb = new Map()
  for (const e of occurrencesAnnee.value) nb.set(e.tache_id, (nb.get(e.tache_id) || 0) + 1)
  const ids = new Set([...nb.keys(), ...tachesSuivies.value])
  const q = rechercheTache.value.trim().toLowerCase()

  const liste = [...ids]
    .map((id) => tacheParId.value.get(id))
    .filter((t) => t && (!q || t.tache?.toLowerCase().includes(q) || t.categorie?.toLowerCase().includes(q)))
    .map((t) => ({ id: t.id, nom: t.tache, categorie: t.categorie || 'Sans catégorie', nb: nb.get(t.id) || 0 }))
    .sort((a, b) => a.categorie.localeCompare(b.categorie) || a.nom.localeCompare(b.nom))

  const groupes = []
  for (const t of liste) {
    let g = groupes.at(-1)
    if (!g || g.categorie !== t.categorie) groupes.push((g = { categorie: t.categorie, taches: [] }))
    g.taches.push(t)
  }
  return groupes
})
const idsCatalogue = computed(() => catalogue.value.flatMap((g) => g.taches.map((t) => t.id)))
const toutSuivre = () => {
  tachesSuivies.value = [...new Set([...tachesSuivies.value, ...idsCatalogue.value])]
}
const toutRetirer = () => {
  tachesSuivies.value = []
}

// Mobile : liste des tâches repliable, ouverte tant qu'aucune n'est suivie
const listeOuverte = ref(false)

// Catégories repliables. Pendant une recherche, toutes s'ouvrent pour montrer les résultats
const categoriesOuvertes = ref([])
const estOuverte = (categorie) => !!rechercheTache.value.trim() || categoriesOuvertes.value.includes(categorie)
const basculerCategorie = (categorie) => {
  categoriesOuvertes.value = categoriesOuvertes.value.includes(categorie)
    ? categoriesOuvertes.value.filter((c) => c !== categorie)
    : [...categoriesOuvertes.value, categorie]
}
const nbSuiviesDans = (groupe) => groupe.taches.filter((t) => estSuivie(t.id)).length
// À l'ouverture : les catégories qui contiennent des tâches suivies, ou toutes à la première visite
const ouvrirCategoriesInitiales = () => {
  const groupes = catalogue.value
  const avecSuivies = groupes.filter((g) => nbSuiviesDans(g) > 0)
  categoriesOuvertes.value = (avecSuivies.length ? avecSuivies : groupes).map((g) => g.categorie)
}

// ============================================
// PLANNING : une ligne par tâche suivie, une colonne par mois
// ============================================
// Statut d'une tâche sur un chantier, du point de vue de mon profil (mêmes libellés et couleurs que la
// page Tâches). « À faire » à partir du mois prévu ; avant, la tâche est seulement « prévue ».
const statutDe = (e) => {
  if (e.tache_status === 2) return 'fait'
  if (e.tache_status === 1) return 'en_cours'
  const echue = e.year < anneeCourante || (e.year === anneeCourante && e.month <= moisCourant)
  return echue ? 'a_faire' : 'prevue'
}
const enRetard = (e) =>
  e.tache_status !== 2 && (e.year < anneeCourante || (e.year === anneeCourante && e.month < moisCourant))

const STATUTS = {
  prevue: { label: 'Prévue', classe: 'bg-slate-100 text-slate-600 dark:bg-white/8 dark:text-slate-300' },
  a_faire: { label: 'À faire', classe: 'bg-rust-100 text-rust-700 dark:bg-rust-500/16 dark:text-rust-300' },
  en_cours: { label: 'En cours', classe: 'bg-ochre-100 text-ochre-700 dark:bg-ochre-400/14 dark:text-ochre-300' },
  fait: { label: 'Fait', classe: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/16 dark:text-emerald-300' }
}

const infobulle = (o) =>
  `${o.chantier_compte} · ${o.chantier_name} · ${STATUTS[o.statut].label}${enRetard(o) ? ' (en retard)' : ''}`

// Recherche d'un chantier : ne garde que ses comptes dans le planning
const recherche = ref('')
const lignes = computed(() => {
  const q = recherche.value.trim().toLowerCase()
  const parTache = new Map(tachesSuivies.value.map((id) => [id, Array.from({ length: 12 }, () => [])]))

  for (const e of occurrencesAnnee.value) {
    const mois = parTache.get(e.tache_id)
    if (!mois) continue
    if (q && !e.chantier_compte?.toLowerCase().includes(q) && !e.chantier_name?.toLowerCase().includes(q)) continue
    mois[e.month - 1].push({ ...e, statut: statutDe(e) })
  }

  return tachesSuivies.value
    .map((id) => {
      const t = tacheParId.value.get(id)
      const mois = parTache.get(id)
      for (const m of mois) m.sort((a, b) => (a.chantier_compte || '').localeCompare(b.chantier_compte || ''))
      return { id, nom: t?.tache ?? 'Tâche supprimée', categorie: t?.categorie || '', mois }
    })
    .sort((a, b) => a.categorie.localeCompare(b.categorie) || a.nom.localeCompare(b.nom))
})

// Résumé sous l'année : tâches suivies et avancement
const resume = computed(() => {
  const n = tachesSuivies.value.length
  const suivies = new Set(tachesSuivies.value)
  const occ = occurrencesAnnee.value.filter((e) => suivies.has(e.tache_id))
  const faites = occ.filter((e) => e.tache_status === 2).length
  return {
    suivies: n ? `${n} tâche${n > 1 ? 's' : ''} suivie${n > 1 ? 's' : ''}` : 'Aucune tâche suivie',
    avancement: occ.length ? `${faites} sur ${occ.length} faite${faites > 1 ? 's' : ''}` : 'Rien de prévu'
  }
})

// Mois en cours : colonne teintée ; le planning (plus large que l'écran) s'ouvre sur le mois précédent
const isMoisCourant = (mois) => mois === moisCourant && year.value === anneeCourante

const scrollRef = ref(null)
const cornerRef = ref(null)
const scrollToCurrentMonth = () => {
  const el = scrollRef.value
  if (!el || !cornerRef.value) return
  const cible = year.value === anneeCourante ? el.querySelector(`[data-mois="${Math.max(1, moisCourant - 1)}"]`) : null
  el.scrollLeft = cible
    ? el.scrollLeft + cible.getBoundingClientRect().left - el.getBoundingClientRect().left - cornerRef.value.offsetWidth
    : 0
}
watch([year, () => tachesSuivies.value.length > 0], scrollToCurrentMonth, { flush: 'post' })

const dateImpression = aujourdhui.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

onMounted(async () => {
  try {
    const ids = JSON.parse(localStorage.getItem(CLE_SUIVI) || '[]')
    if (Array.isArray(ids)) tachesSuivies.value = ids.filter((x) => Number.isFinite(x))
  } catch {
    // sélection mémorisée illisible : on repart de zéro
  }
  listeOuverte.value = tachesSuivies.value.length === 0
  await loadAllData()
  ouvrirCategoriesInitiales()
  await nextTick()
  scrollToCurrentMonth()
})
</script>

<template>
  <AppPageLayout v4 sidebar-class="print:hidden!" class="print:block!">
    <!-- Bandeau : en tête de page sur mobile, avant le panneau -->
    <template #entete>
      <AppPageHero
        title="Planning des tâches"
        description="Mois par mois, les chantiers concernés par les tâches que vous suivez"
        illustration="taches" />
    </template>

    <!-- ============ Barre latérale : année, tâches suivies, légende ============ -->
    <template #sidebar>
      <div class="flex flex-col gap-5 pb-6 lg:pt-2">
        <AppPeriodNav
          :label="String(year)"
          prev-label="Année précédente"
          next-label="Année suivante"
          :prev-title="String(year - 1)"
          :next-title="String(year + 1)"
          @prev="year--"
          @next="year++">
          <p class="mt-1.5 text-xs text-white/80">{{ resume.suivies }}</p>
          <p class="mt-0.5 text-xs text-white/80">{{ resume.avancement }}</p>
        </AppPeriodNav>

        <!-- Tâches à suivre, groupées par catégorie ; repliable sur mobile -->
        <section class="flex flex-col gap-2" aria-labelledby="planning-taches-titre">
          <button
            type="button"
            class="flex w-full cursor-pointer items-center justify-between px-3 lg:hidden"
            :aria-expanded="listeOuverte"
            aria-controls="planning-catalogue"
            @click="listeOuverte = !listeOuverte">
            <span :class="PANNEAU_TITRE">Tâches suivies · {{ tachesSuivies.length }}</span>
            <Icon
              name="lucide:chevron-down"
              size="16"
              class="text-slate-400 transition-transform"
              :class="{ 'rotate-180': listeOuverte }" />
          </button>
          <p id="planning-taches-titre" class="hidden px-3 lg:block" :class="PANNEAU_TITRE">
            Tâches suivies · {{ tachesSuivies.length }}
          </p>

          <div id="planning-catalogue" class="flex flex-col gap-2" :class="{ 'max-lg:hidden': !listeOuverte }">
            <AppInputSearch v-model="rechercheTache" boxed dense placeholder="Rechercher une tâche…" />
            <div v-if="idsCatalogue.length" class="flex gap-4 px-3 text-xs font-semibold">
              <button
                type="button"
                class="text-secondary-700 dark:text-secondary-300 cursor-pointer hover:underline"
                @click="toutSuivre">
                Tout suivre
              </button>
              <button
                v-if="tachesSuivies.length"
                type="button"
                class="text-ink-soft hover:text-ink cursor-pointer hover:underline"
                @click="toutRetirer">
                Tout retirer
              </button>
            </div>

            <div v-for="(g, gIdx) in catalogue" :key="g.categorie" class="flex flex-col gap-0.5">
              <!-- En-tête de catégorie : ouvre ou replie sa liste ; tâches suivies sur le total -->
              <button
                type="button"
                class="focus-visible:outline-secondary-500 flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-left transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:bg-white/5"
                :aria-expanded="estOuverte(g.categorie)"
                :aria-controls="`planning-categorie-${gIdx}`"
                @click="basculerCategorie(g.categorie)">
                <Icon
                  name="lucide:chevron-right"
                  size="14"
                  class="shrink-0 text-slate-400 transition-transform"
                  :class="{ 'rotate-90': estOuverte(g.categorie) }" />
                <span class="text-ink min-w-0 flex-1 truncate text-[13px] font-semibold">{{ g.categorie }}</span>
                <span
                  class="shrink-0 text-xs tabular-nums"
                  :class="
                    nbSuiviesDans(g) ? 'text-secondary-700 dark:text-secondary-300 font-semibold' : 'text-ink-soft'
                  "
                  :title="`${nbSuiviesDans(g)} suivie(s) sur ${g.taches.length}`">
                  {{ nbSuiviesDans(g) }}/{{ g.taches.length }}
                </span>
              </button>
              <div v-show="estOuverte(g.categorie)" :id="`planning-categorie-${gIdx}`" :class="PANNEAU_GROUPE">
                <button
                  v-for="t in g.taches"
                  :key="t.id"
                  type="button"
                  role="checkbox"
                  :aria-checked="estSuivie(t.id)"
                  class="focus-visible:outline-secondary-500 -ml-px flex w-full cursor-pointer items-start gap-2.5 rounded-l-none rounded-r-lg px-3 py-2 text-left transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:bg-white/5"
                  @click="basculer(t.id)">
                  <span
                    class="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors"
                    :class="
                      estSuivie(t.id)
                        ? 'border-magenta-600 bg-magenta-600 text-white'
                        : 'border-slate-300 dark:border-white/25'
                    ">
                    <Icon v-if="estSuivie(t.id)" name="lucide:check" size="12" />
                  </span>
                  <span
                    class="min-w-0 flex-1 text-sm leading-snug"
                    :class="estSuivie(t.id) ? 'text-ink font-medium' : 'text-ink-soft'">
                    {{ t.nom }}
                  </span>
                  <span
                    class="inline-flex h-5 min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold"
                    :class="panneauBadge(false)"
                    :title="`${t.nb} prévue${t.nb > 1 ? 's' : ''} en ${year}`">
                    {{ t.nb }}
                  </span>
                </button>
              </div>
            </div>

            <p v-if="catalogue.length === 0" class="text-ink-soft px-3 text-[13px]">
              {{ rechercheTache ? 'Aucune tâche ne correspond à la recherche.' : `Aucune tâche prévue en ${year}.` }}
            </p>
          </div>
        </section>

        <!-- Légende : statut de la tâche sur chaque chantier, pour votre profil -->
        <section class="border-rule border-t px-3 pt-4" aria-label="Légende">
          <p class="pb-2.5" :class="PANNEAU_TITRE">Légende</p>
          <ul class="text-ink-soft grid grid-cols-2 gap-x-3 gap-y-2 text-[13px]" :class="PANNEAU_RETRAIT">
            <li v-for="(s, cle) in STATUTS" :key="cle" class="flex items-center gap-2">
              <span class="h-3 w-5 shrink-0 rounded-sm" :class="s.classe" />
              {{ s.label }}
            </li>
          </ul>
        </section>
      </div>
    </template>

    <!-- ============ Contenu principal ============ -->
    <template #default>
      <div class="flex min-h-0 flex-1 flex-col gap-4 p-4 lg:px-8 lg:pt-4 lg:pb-4">
        <!-- Impression : date et légende (la barre latérale n'est pas imprimée) -->
        <div class="text-ink-soft hidden items-center gap-5 text-sm print:flex">
          <span>Planning des tâches {{ year }}, imprimé le {{ dateImpression }}</span>
          <span v-for="(s, cle) in STATUTS" :key="cle" class="flex items-center gap-1.5">
            <span class="h-3 w-5 rounded-sm" :class="s.classe" />
            {{ s.label }}
          </span>
        </div>

        <div v-if="tachesSuivies.length" class="flex flex-col gap-3 lg:flex-row lg:items-center print:hidden">
          <AppInputSearch
            v-model="recherche"
            boxed
            dense
            class="w-full lg:max-w-sm"
            placeholder="Rechercher un chantier…" />
          <AppButtonValidated
            type="button"
            theme="outline"
            class="max-lg:hidden lg:ml-auto"
            @click="lancerImpression()">
            <template #default>
              <span class="flex items-center gap-2">
                <Icon name="lucide:printer" size="16" />
                Imprimer
              </span>
            </template>
          </AppButtonValidated>
        </div>

        <!-- Aucune tâche suivie : on explique quoi faire -->
        <div
          v-if="!tachesSuivies.length"
          class="surface-card flex flex-1 flex-col items-center justify-center gap-3 rounded-xl px-6 py-16 text-center">
          <span
            class="bg-magenta-50 text-magenta-600 flex size-12 items-center justify-center rounded-full dark:bg-white/8">
            <Icon name="lucide:list-checks" size="24" />
          </span>
          <p class="text-ink text-lg font-semibold">Choisissez les tâches à suivre</p>
          <p class="text-ink-soft max-w-md text-sm leading-relaxed">
            Cochez-les dans le panneau : le planning montre, mois par mois, les chantiers où elles sont prévues et où
            elles en sont. Votre sélection est gardée pour vos prochaines visites.
          </p>
          <AppButtonValidated v-if="idsCatalogue.length" type="button" theme="brand" class="mt-2" @click="toutSuivre">
            <template #default>
              Suivre les {{ idsCatalogue.length }} tâche{{ idsCatalogue.length > 1 ? 's' : '' }} prévue{{
                idsCatalogue.length > 1 ? 's' : ''
              }}
              en {{ year }}
            </template>
          </AppButtonValidated>
        </div>

        <!-- Planning : la carte défile dans les deux sens, en-tête et colonne des tâches restent figés -->
        <div
          v-else
          ref="scrollRef"
          class="surface-card min-h-0 flex-1 overflow-auto scroll-smooth rounded-xl max-lg:max-h-[75vh] print:max-h-none print:overflow-visible print:shadow-none">
          <div
            class="grid min-w-[calc(var(--col-tache)+12*var(--col-mois))] grid-cols-[var(--col-tache)_repeat(12,minmax(var(--col-mois),1fr))] [--col-mois:10.5rem] [--col-tache:9rem] md:[--col-tache:14rem] print:min-w-0 print:[--col-mois:0px] print:[print-color-adjust:exact]">
            <!-- En-tête -->
            <div
              ref="cornerRef"
              class="bg-table-head table-head-text border-rule sticky top-0 left-0 z-30 flex items-center border-r border-b px-2.5 py-2.5 text-[0.8125rem] md:px-4">
              Tâche
            </div>
            <div
              v-for="(nom, i) in MOIS"
              :key="nom"
              :data-mois="i + 1"
              class="bg-table-head table-head-text border-rule sticky top-0 z-20 flex items-center justify-center border-b px-1 py-2.5 text-xs"
              :class="{ 'border-l': i > 0 }">
              <span
                v-if="isMoisCourant(i + 1)"
                class="bg-secondary-600 rounded-full px-2 py-0.5 text-white"
                title="Mois en cours">
                {{ nom }}
              </span>
              <template v-else>{{ nom }}</template>
            </div>

            <!-- Une ligne par tâche suivie -->
            <template v-for="l in lignes" :key="l.id">
              <div
                class="bg-card border-rule sticky left-0 z-10 flex items-start gap-2 border-t border-r px-2.5 py-2.5 md:px-4">
                <div class="min-w-0 flex-1">
                  <p v-if="l.categorie" class="text-ink-soft truncate text-[11px] max-md:hidden print:block!">
                    {{ l.categorie }}
                  </p>
                  <p class="text-ink line-clamp-2 text-sm font-semibold" :title="l.nom">{{ l.nom }}</p>
                </div>
                <button
                  type="button"
                  class="text-ink-soft hover:text-ink flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-slate-100 dark:hover:bg-white/8 print:hidden"
                  title="Ne plus suivre"
                  :aria-label="`Ne plus suivre ${l.nom}`"
                  @click="basculer(l.id)">
                  <Icon name="lucide:x" size="14" />
                </button>
              </div>
              <div
                v-for="(occurrences, i) in l.mois"
                :key="i"
                class="border-rule flex flex-col gap-1.5 border-t p-1.5"
                :class="[i > 0 && 'border-l', isMoisCourant(i + 1) && 'bg-secondary-50 dark:bg-secondary-400/10']">
                <NuxtLink
                  v-for="o in occurrences"
                  :key="o.id"
                  :to="`/chantiers/${o.chantier_id}`"
                  class="block rounded-md px-2 py-1.5 ring-1 ring-current/15 transition-shadow ring-inset hover:ring-2 hover:ring-current/30"
                  :class="STATUTS[o.statut].classe"
                  :title="infobulle(o)">
                  <!-- Compte dans la couleur du statut, titre du chantier en dessous -->
                  <span class="block text-[11px] leading-tight font-bold tabular-nums">{{ o.chantier_compte }}</span>
                  <span class="text-ink mt-0.5 line-clamp-2 text-xs leading-snug print:text-[10px]">
                    {{ o.chantier_name }}
                  </span>
                </NuxtLink>
              </div>
            </template>
          </div>
        </div>
      </div>
    </template>
  </AppPageLayout>
</template>

<style scoped>
/* Impression : le planning tient en largeur sur une page A3 à l'italienne */
@media print {
  @page {
    size: A3 landscape;
    margin: 8mm;
  }
}
</style>
