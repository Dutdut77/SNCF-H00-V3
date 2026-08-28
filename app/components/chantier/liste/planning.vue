<script setup>
// Vue Planning : diagramme de Gantt sur une timeline continue, défilable à l'horizontale.
// Une barre par période (réalisation et préparation) — `date_rea` et `date_prepa`
// sont des tableaux, un chantier peut donc en avoir plusieurs.
const props = defineProps({
  chantiers: { type: Array, default: () => [] },
  canEdit: { type: Boolean, default: false }
})

const emit = defineEmits(['edit', 'open'])

const { getEtatInfo } = useEtatChantier()
const { formatDate, getFirstReaDate, getLastReaDate } = useChantierDates()
const { getLundiDeSemaine, semaineISODe, decalerSemaine, genererFenetre, grouperParMois } = useCalendrierSemaines()
const { allWeekends } = useTimeline()

const MS_SEMAINE = 7 * 86400000
const LARGEUR_CHANTIER = 280
const LARGEUR_STATUT = 112
const LARGEUR_GAUCHE = LARGEUR_CHANTIER + LARGEUR_STATUT // colonnes figées
const MARGE_SEMAINES = 6 // respiration de part et d'autre de la plage réelle
const MAX_SEMAINES = 400 // garde-fou contre une plage aberrante

// Niveau de zoom : nombre de semaines qui tiennent dans la largeur visible
const zooms = [
  { id: 5, label: '1 mois' },
  { id: 13, label: '3 mois' },
  { id: 26, label: '6 mois' },
  { id: 53, label: 'Année' }
]
const zoom = ref(13)

// ---------------------------------------------------------------------------
// Mesure du conteneur → largeur de colonne en pixels ENTIERS.
// Des largeurs fractionnaires feraient tomber chaque limite de colonne ailleurs
// dans la grille de pixels, et les marqueurs de week-end s'antialiaseraient
// différemment de l'un à l'autre.
// ---------------------------------------------------------------------------
const conteneur = ref(null)
const largeurDispo = ref(0)
const defilement = ref(0)
let observateur = null

const largeurTimeline = computed(() => Math.max(0, largeurDispo.value - LARGEUR_GAUCHE))
const compact = computed(() => zoom.value > 26)
const largeurColonne = computed(() => {
  const mini = compact.value ? 22 : 58
  if (!largeurTimeline.value) return mini
  return Math.max(mini, Math.floor(largeurTimeline.value / zoom.value))
})

// ---------------------------------------------------------------------------
// Plage couverte : toutes les périodes des chantiers affichés, plus aujourd'hui
// ---------------------------------------------------------------------------
const idsAffiches = computed(() => new Set(props.chantiers.map((c) => c.id)))

const plage = computed(() => {
  let min = null
  let max = null
  const prendre = (valeur) => {
    if (!valeur) return
    const d = new Date(valeur)
    if (Number.isNaN(d.getTime())) return
    if (!min || d < min) min = d
    if (!max || d > max) max = d
  }

  for (const c of props.chantiers) {
    for (const p of c.date_rea || []) {
      prendre(p.date_start_travaux)
      prendre(p.date_end_travaux)
    }
    for (const p of c.date_prepa || []) {
      prendre(p.date_start_prepa)
      prendre(p.date_end_prepa)
    }
  }
  for (const w of allWeekends.value || []) {
    if (idsAffiches.value.has(w.chantier_id)) prendre(getLundiDeSemaine(w.semaine_debut, w.annee_debut))
  }

  // Aujourd'hui doit toujours être atteignable
  const aujourdhui = new Date()
  if (!min || aujourdhui < min) min = aujourdhui
  if (!max || aujourdhui > max) max = aujourdhui

  const sMin = semaineISODe(min)
  const sMax = semaineISODe(max)
  const debut = decalerSemaine(sMin.annee, sMin.semaine, -MARGE_SEMAINES)
  const fin = decalerSemaine(sMax.annee, sMax.semaine, MARGE_SEMAINES)

  const nb = Math.round((getLundiDeSemaine(fin.semaine, fin.annee) - getLundiDeSemaine(debut.semaine, debut.annee)) / MS_SEMAINE) + 1
  return genererFenetre(debut.annee, debut.semaine, Math.min(MAX_SEMAINES, Math.max(zoom.value, nb)))
})

const nbSemaines = computed(() => plage.value.length)
const debutPlage = computed(() => plage.value[0].lundi)

const gridTemplateColumns = computed(
  () => `${LARGEUR_CHANTIER}px ${LARGEUR_STATUT}px repeat(${nbSemaines.value}, ${largeurColonne.value}px)`
)

// Lignes verticales dessinées en fond plutôt qu'une cellule par semaine et par ligne :
// à 150 semaines × 60 chantiers, cela ferait des milliers de nœuds inutiles.
const fondSemaines = computed(() => ({
  backgroundImage: 'linear-gradient(to right, rgba(100, 116, 139, 0.18) 0 1px, transparent 1px)',
  backgroundSize: `${largeurColonne.value}px 100%`
}))

// ---------------------------------------------------------------------------
// Position et défilement
// ---------------------------------------------------------------------------
const indexDe = (date) => {
  const { annee, semaine } = semaineISODe(date)
  return Math.round((getLundiDeSemaine(semaine, annee) - debutPlage.value) / MS_SEMAINE)
}

const colAujourdhui = computed(() => {
  const i = indexDe(new Date())
  return i >= 0 && i < nbSemaines.value ? i : -1
})

// Position du jour dans sa colonne (0 % = lundi). Le trait et le badge s'y alignent.
const positionAujourdhui = computed(() => {
  const maintenant = new Date()
  const { annee, semaine } = semaineISODe(maintenant)
  const fraction = (maintenant - getLundiDeSemaine(semaine, annee)) / MS_SEMAINE
  return `${Math.min(100, Math.max(0, fraction * 100))}%`
})

// Première semaine visible : les colonnes figées masquent les LARGEUR_GAUCHE premiers pixels
const premiereVisible = computed(() => Math.floor(defilement.value / largeurColonne.value))
const nbVisibles = computed(() => Math.max(1, Math.round(largeurTimeline.value / largeurColonne.value)))

const moisPlage = computed(() => grouperParMois(plage.value))

const moisVisibles = computed(() =>
  grouperParMois(plage.value.slice(premiereVisible.value, premiereVisible.value + nbVisibles.value))
)

const libelleFenetre = computed(() => {
  const m = moisVisibles.value
  if (m.length === 0) return ''
  return m.length === 1 ? m[0].label : `${m[0].labelCourt} — ${m[m.length - 1].label}`
})

// Semaine sur le bord gauche, mémorisée avec la largeur de colonne en vigueur
// au moment du défilement : un changement de zoom pourra s'y raccrocher.
const ancre = ref(0)

const surDefilement = (e) => {
  defilement.value = e.target.scrollLeft
  ancre.value = Math.floor(e.target.scrollLeft / largeurColonne.value)
}

const allerA = (index, doux = true) => {
  if (!conteneur.value) return
  const left = Math.max(0, index * largeurColonne.value)
  conteneur.value.scrollTo({ left, behavior: doux ? 'smooth' : 'auto' })
}

const allerAAujourdhui = (doux = true) => {
  const i = colAujourdhui.value >= 0 ? colAujourdhui.value : indexDe(new Date())
  allerA(Math.max(0, i - 2), doux)
}

const defiler = (sens) => {
  if (!conteneur.value) return
  conteneur.value.scrollBy({ left: sens * largeurTimeline.value, behavior: 'smooth' })
}

onMounted(() => {
  if (!conteneur.value) return
  largeurDispo.value = conteneur.value.clientWidth
  observateur = new ResizeObserver(([entree]) => {
    largeurDispo.value = entree.contentRect.width
  })
  observateur.observe(conteneur.value)
  nextTick(() => allerAAujourdhui(false))
})

onBeforeUnmount(() => observateur?.disconnect())

// Changement de zoom : on garde la même semaine sur le bord gauche.
// `premiereVisible` est capturée avant que la nouvelle largeur de colonne s'applique.
watch(zoom, () => {
  const cible = ancre.value
  nextTick(() => allerA(cible, false))
})

// ---------------------------------------------------------------------------
// Barres et marqueurs
// ---------------------------------------------------------------------------
const barresDe = (chantier) => {
  const barres = []
  const ajouter = (dateDebut, dateFin, type) => {
    if (!dateDebut) return
    const d = new Date(dateDebut)
    const f = dateFin ? new Date(dateFin) : new Date(dateDebut)
    if (Number.isNaN(d.getTime()) || Number.isNaN(f.getTime())) return
    const i0 = Math.max(0, indexDe(d))
    const i1 = Math.min(nbSemaines.value - 1, indexDe(f))
    if (i1 < i0) return
    barres.push({ type, col: i0, span: i1 - i0 + 1 })
  }
  for (const p of chantier.date_prepa || []) ajouter(p.date_start_prepa, p.date_end_prepa, 'prepa')
  for (const p of chantier.date_rea || []) ajouter(p.date_start_travaux, p.date_end_travaux, 'rea')
  return barres
}

const weekendsDe = (chantier) => {
  const colonnes = new Set()
  for (const w of allWeekends.value || []) {
    if (w.chantier_id !== chantier.id) continue
    const col = Math.round((getLundiDeSemaine(w.semaine_debut, w.annee_debut) - debutPlage.value) / MS_SEMAINE)
    // Set : deux week-ends sur la même semaine ne doivent donner qu'un marqueur
    if (col >= 0 && col < nbSemaines.value) colonnes.add(col)
  }
  return [...colonnes].sort((a, b) => a - b).map((col) => ({ col }))
}

// Un chantier sans aucune période ni week-end n'aurait qu'une ligne vide
const lignes = computed(() =>
  props.chantiers
    .map((chantier) => ({ chantier, barres: barresDe(chantier), weekends: weekendsDe(chantier) }))
    .filter((l) => l.barres.length > 0 || l.weekends.length > 0)
)

const nbSansDates = computed(() => props.chantiers.length - lignes.value.length)

const dateCourte = (d) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

const periodeTexte = (chantier) => {
  const d = getFirstReaDate(chantier)
  if (!d) return null
  const f = getLastReaDate(chantier)
  return f && f !== d ? `${formatDate(d)} → ${formatDate(f)}` : formatDate(d)
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col gap-3">
    <!-- ===== Barre d'outils ===== -->
    <div class="flex flex-none flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="border-primary-200 bg-primary-50 text-primary-600 hover:border-primary-300 hover:text-primary-800 cursor-pointer rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors"
          @click="allerAAujourdhui()">
          Aujourd'hui
        </button>
        <div class="border-primary-200 bg-primary-50 flex items-center rounded-lg border">
          <button
            type="button"
            class="text-primary-600 hover:bg-primary-200 cursor-pointer rounded-l-lg px-2 py-1.5 transition-colors"
            title="Reculer"
            @click="defiler(-1)">
            <Icon name="lucide:chevron-left" size="18" />
          </button>
          <button
            type="button"
            class="text-primary-600 hover:bg-primary-200 cursor-pointer rounded-r-lg px-2 py-1.5 transition-colors"
            title="Avancer"
            @click="defiler(1)">
            <Icon name="lucide:chevron-right" size="18" />
          </button>
        </div>
        <span class="text-primary-700 text-sm font-semibold">{{ libelleFenetre }}</span>
      </div>

      <div class="flex items-center gap-3">
        <div class="text-primary-500 hidden items-center gap-3 text-xs xl:flex">
          <span class="flex items-center gap-1.5">
            <span class="bg-primary-300 h-2.5 w-4 rounded-xs opacity-60" />
            Préparation
          </span>
          <span class="flex items-center gap-1.5">
            <span class="bg-primary-400 h-2.5 w-4 rounded-xs" />
            Réalisation
          </span>
          <span class="flex items-center gap-1.5">
            <span class="h-3 w-[4px] bg-orange-500" />
            Week-end
          </span>
        </div>
        <div class="w-32">
          <AppSelect v-model="zoom" :options="zooms" name="zoom" />
        </div>
      </div>
    </div>

    <!-- ===== Timeline défilable ===== -->
    <div
      ref="conteneur"
      class="border-primary-200 min-h-0 flex-1 overflow-auto rounded-xl border bg-white dark:bg-slate-900"
      @scroll.passive="surDefilement">
      <div class="grid" :style="{ gridTemplateColumns }">
        <!-- Entête collant, sur 2 lignes -->
        <div
          class="col-span-full grid grid-cols-subgrid sticky top-0 z-30 bg-white dark:bg-slate-900"
          style="grid-row: span 2">
          <div
            class="border-primary-200 text-primary-500 sticky left-0 z-40 row-span-2 flex items-center border-r border-b bg-white px-4 text-xs font-medium uppercase dark:bg-slate-900">
            Chantier
          </div>
          <div
            class="border-primary-200 text-primary-500 sticky left-[280px] z-40 row-span-2 flex items-center justify-center border-r border-b bg-white px-3 text-xs font-medium uppercase dark:bg-slate-900">
            Statut
          </div>

          <!-- Ligne 1 : mois -->
          <div
            v-for="m in moisPlage"
            :key="m.cle"
            :style="{ gridColumn: `span ${m.colspan}` }"
            class="border-primary-200 bg-primary-100 text-primary-700 truncate border-l border-b px-2 py-1 text-center text-xs font-semibold">
            {{ m.colspan === 1 ? m.labelCourt : m.label }}
          </div>

          <!-- Ligne 2 : semaines -->
          <div
            v-for="(s, i) in plage"
            :key="`${s.annee}-${s.numero}`"
            class="border-primary-100 relative flex flex-col items-center justify-center border-l px-0.5 pt-1 pb-4"
            :class="i === colAujourdhui ? 'bg-secondary-50' : ''">
            <span class="text-xs font-medium" :class="i === colAujourdhui ? 'text-secondary-700' : 'text-primary-700'">
              S{{ s.numero }}
            </span>
            <span v-if="!compact" class="text-primary-400 text-[10px] whitespace-nowrap">
              {{ dateCourte(s.lundi) }}
            </span>
            <span
              v-if="i === colAujourdhui"
              :style="{ left: positionAujourdhui }"
              class="bg-secondary-600 absolute bottom-0.5 z-10 -translate-x-1/2 rounded-full px-1.5 py-px text-[9px] font-semibold whitespace-nowrap text-white">
              Auj.
            </span>
          </div>
        </div>

        <!-- ===== Lignes chantiers ===== -->
        <div
          v-for="ligne in lignes"
          :key="ligne.chantier.id"
          class="group border-primary-100 col-span-full grid grid-cols-subgrid items-center border-b">
          <!-- Chantier (figé à gauche) -->
          <div
            class="border-primary-200 group-hover:bg-primary-100 sticky left-0 z-[25] flex flex-col justify-center self-stretch border-r bg-white px-4 py-1.5 transition-colors dark:bg-slate-900">
            <div class="flex items-center gap-2">
              <span class="bg-primary-100 text-primary-700 shrink-0 rounded px-1.5 py-0.5 font-mono text-[11px] font-bold">
                {{ ligne.chantier.compte || '—' }}
              </span>
              <button
                type="button"
                class="text-primary-800 hover:text-secondary-600 truncate text-left text-sm font-medium transition-colors hover:underline"
                :title="ligne.chantier.name"
                @click="emit('open', ligne.chantier.id)">
                {{ ligne.chantier.name }}
              </button>
            </div>
            <span v-if="periodeTexte(ligne.chantier)" class="text-primary-400 text-[11px]">
              {{ periodeTexte(ligne.chantier) }}
            </span>
          </div>

          <!-- Statut (figé à gauche) -->
          <div
            class="border-primary-200 group-hover:bg-primary-100 sticky left-[280px] z-[25] flex items-center justify-center self-stretch border-r bg-white px-3 transition-colors dark:bg-slate-900">
            <span
              class="inline-flex w-[84px] justify-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap"
              :class="[getEtatInfo(ligne.chantier.etat).bgLight, getEtatInfo(ligne.chantier.etat).textColor]">
              {{ getEtatInfo(ligne.chantier.etat).label }}
            </span>
          </div>

          <!-- Fond : lignes de semaines en dégradé répété, un seul nœud par ligne -->
          <div style="grid-column: 3 / -1; grid-row: 1" class="h-full self-stretch" :style="fondSemaines" />

          <!-- Barres de périodes -->
          <div
            v-for="(b, i) in ligne.barres"
            :key="`barre-${i}`"
            :style="{ gridColumn: `${3 + b.col} / span ${b.span}`, gridRow: 1 }"
            class="mx-px flex h-6 items-center overflow-hidden rounded-md border px-2"
            :class="[
              getEtatInfo(ligne.chantier.etat).bgLight,
              getEtatInfo(ligne.chantier.etat).border,
              b.type === 'prepa' ? 'z-0 border-dashed opacity-60' : 'z-10',
              props.canEdit ? 'cursor-pointer' : ''
            ]"
            :title="b.type === 'prepa' ? `Préparation — ${ligne.chantier.name}` : ligne.chantier.name"
            @click="props.canEdit && emit('edit', ligne.chantier)">
            <span
              v-if="b.type === 'rea' && b.span > 1"
              class="truncate text-[11px] font-medium"
              :class="getEtatInfo(ligne.chantier.etat).textColor">
              {{ ligne.chantier.name }}
            </span>
          </div>

          <!-- Marqueurs de week-end -->
          <div
            v-for="(w, i) in ligne.weekends"
            :key="`we-${i}`"
            :style="{ gridColumn: 3 + w.col, gridRow: 1 }"
            class="pointer-events-none relative z-20 h-full self-stretch">
            <span class="absolute inset-y-0.5 -right-[2px] w-[4px] bg-orange-500" title="Week-end" />
          </div>

          <!-- Trait du jour -->
          <div
            v-if="colAujourdhui >= 0"
            :style="{ gridColumn: 3 + colAujourdhui, gridRow: 1 }"
            class="pointer-events-none relative z-20 h-full self-stretch">
            <span
              :style="{ left: positionAujourdhui }"
              class="border-secondary-400 absolute inset-y-0 border-l-2 border-dashed" />
          </div>
        </div>

        <!-- Aucun chantier à afficher -->
        <div v-if="lignes.length === 0" class="col-span-full px-6 py-12 text-center">
          <Icon name="lucide:calendar-x" size="40" class="text-primary-300 mx-auto mb-3" />
          <p class="text-primary-500 text-sm font-medium">Aucun chantier planifié dans la sélection</p>
        </div>
      </div>
    </div>

    <p v-if="lignes.length > 0 && nbSansDates > 0" class="text-primary-400 flex-none text-xs">
      {{ nbSansDates }} chantier{{ nbSansDates > 1 ? 's' : '' }} de la sélection sans période planifiée.
    </p>
  </div>
</template>
