<script setup>
// Périodes du formulaire chantier (design V4) : frise aux couleurs du plan de charge, puis préparations,
// réalisations (saisies dans le calendrier de période, avec ses numéros de semaine) et week-ends.
// Périodes : [{ date_start, date_end }] en timestamps ; week-ends : [{ debutSemaine, debutAnnee, finSemaine, finAnnee }].
const preparation = defineModel('preparation', { default: () => [] })
const realisation = defineModel('realisation', { default: () => [] })
const weekends = defineModel('weekends', { default: () => [] })
// Une saisie est ouverte : le formulaire attend qu'elle soit validée ou annulée pour enregistrer
const saisie = defineModel('saisie', { default: false })

const props = defineProps({
  // Couleur des barres : celle de l'état du chantier, comme dans le plan de charge
  barre: { type: String, default: 'bg-lime-500 border-lime-700' },
  realisationRequise: { type: Boolean, default: false },
  // Phrase sous le titre (effet des dates sur les tâches H00)
  note: { type: String, default: '' },
  titreId: { type: String, default: undefined }
})

const { getThursdayOfWeek, getWeekNumber } = useCalendrierSemaines()

const JOUR = 86400000
const MOIS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const LABEL = 'text-ink mb-1.5 block text-[13px] font-medium'

// ---------- Dates ----------
const jourCourt = (d, annee) =>
  d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', ...(annee && { year: 'numeric' }) })

const libellePeriode = (p) => {
  const debut = new Date(p.date_start)
  const fin = new Date(p.date_end ?? p.date_start)
  const memeAnnee = debut.getFullYear() === fin.getFullYear()
  return { debut: jourCourt(debut, !memeAnnee), fin: jourCourt(fin, true) }
}
const semainesPeriode = (p) => {
  const s1 = getWeekNumber(p.date_start)
  const s2 = getWeekNumber(p.date_end ?? p.date_start)
  return s1 === s2 ? `S${s1}` : `S${s1} à S${s2}`
}

// Week-end d'une semaine ISO : samedi et dimanche, à la fin de la semaine comme sur le plan de charge
const samediDe = (semaine, annee) => {
  const jeudi = getThursdayOfWeek(semaine, annee)
  return new Date(jeudi.getFullYear(), jeudi.getMonth(), jeudi.getDate() + 2, 12)
}
const joursWeekend = (semaine, annee) => {
  const samedi = samediDe(semaine, annee)
  const dimanche = new Date(samedi.getTime() + JOUR)
  const mois = (d) => d.toLocaleDateString('fr-FR', { month: 'long' })
  return samedi.getMonth() === dimanche.getMonth()
    ? `${samedi.getDate()} et ${dimanche.getDate()} ${mois(dimanche)}`
    : `${samedi.getDate()} ${mois(samedi)} et ${dimanche.getDate()} ${mois(dimanche)}`
}

// Semaine suivante (passage d'année compris) : un week-end court de la semaine N à la N+1
// (l'année ISO d'une semaine est celle de son jeudi)
const semaineSuivante = (semaine, annee) => {
  const j = getThursdayOfWeek(semaine, annee)
  const jeudi = new Date(j.getFullYear(), j.getMonth(), j.getDate() + 7, 12)
  return { semaine: getWeekNumber(jeudi), annee: jeudi.getFullYear() }
}

// Affichage trié par date, en gardant l'index d'origine pour modifier ou supprimer
const trie = (liste) => liste.map((p, i) => ({ p, i })).sort((a, b) => (a.p.date_start ?? 0) - (b.p.date_start ?? 0))

const LIGNES = computed(() => [
  { type: 'preparation', titre: 'Préparation', liste: trie(preparation.value), requise: false },
  { type: 'realisation', titre: 'Réalisation', liste: trie(realisation.value), requise: props.realisationRequise }
])
const modele = (type) => (type === 'preparation' ? preparation : realisation)

// ---------- Préparations et réalisations : calendrier de période ----------
const calendrier = ref(null) // { type, index } : index -1 = ajout
const calendrierTitre = computed(() => {
  const c = calendrier.value
  if (!c) return ''
  const quoi = c.type === 'preparation' ? 'préparation' : 'réalisation'
  return c.index >= 0 ? `Modifier la période de ${quoi}` : `Période de ${quoi}`
})
const calendrierPeriode = computed(() =>
  calendrier.value?.index >= 0 ? modele(calendrier.value.type).value[calendrier.value.index] : null
)
const ouvrirPeriode = (type, index = -1) => {
  calendrier.value = { type, index }
}
const validerPeriode = (range) => {
  const { type, index } = calendrier.value
  const m = modele(type)
  const liste = [...m.value]
  const periode = { date_start: range.date_start, date_end: range.date_end }
  if (index >= 0) liste[index] = periode
  else liste.push(periode)
  m.value = liste
  calendrier.value = null
}
const supprimerPeriode = (type, index) => {
  modele(type).value = modele(type).value.filter((_, i) => i !== index)
}

// ---------- Week-ends : saisie dans la fiche ----------
const editeur = ref(null)
watch(
  editeur,
  (e) => {
    saisie.value = !!e
  },
  { immediate: true }
)

const anneeCourante = new Date().getFullYear()
const ANNEES = Array.from({ length: 5 }, (_, i) => ({
  id: anneeCourante - 2 + i,
  label: String(anneeCourante - 2 + i)
}))
const ouvrirWeekend = () => {
  editeur.value = { type: 'weekend', semaine: null, annee: anneeCourante }
}
const semainesOptions = computed(() => {
  const annee = editeur.value?.annee ?? anneeCourante
  // 53e semaine seulement si l'année en compte une
  const nb = getWeekNumber(new Date(annee, 11, 28)) === 53 ? 53 : 52
  return Array.from({ length: nb }, (_, i) => ({ id: i + 1, label: `S${i + 1} – ${joursWeekend(i + 1, annee)}` }))
})
const weekendDoublon = computed(() => {
  const e = editeur.value
  return (
    e?.type === 'weekend' &&
    !!e.semaine &&
    weekends.value.some((w) => w.debutSemaine === e.semaine && w.debutAnnee === e.annee)
  )
})
const validerWeekend = () => {
  const { semaine, annee } = editeur.value
  if (!semaine || weekendDoublon.value) return
  const suivante = semaineSuivante(semaine, annee)
  weekends.value = [
    ...weekends.value,
    { debutSemaine: semaine, debutAnnee: annee, finSemaine: suivante.semaine, finAnnee: suivante.annee }
  ]
  editeur.value = null
}
const weekendsTries = computed(() =>
  weekends.value
    .map((w, i) => ({ w, i }))
    .sort((a, b) => a.w.debutAnnee - b.w.debutAnnee || a.w.debutSemaine - b.w.debutSemaine)
)
const supprimerWeekend = (index) => {
  weekends.value = weekends.value.filter((_, i) => i !== index)
}

// ---------- Frise : années couvertes par les périodes (l'année en cours à défaut) ----------
const frise = computed(() => {
  const avecDates = (l) => l.filter((p) => p.date_start)
  const prepa = avecDates(preparation.value)
  const rea = avecDates(realisation.value)
  const samedis = weekends.value.map((w) => samediDe(w.debutSemaine, w.debutAnnee).getTime())

  const dates = [...prepa, ...rea].flatMap((p) => [p.date_start, p.date_end ?? p.date_start]).concat(samedis)
  const annees = dates.map((t) => new Date(t).getFullYear())
  const a0 = annees.length ? Math.min(...annees) : anneeCourante
  const a1 = annees.length ? Math.max(...annees) : anneeCourante
  const debut = new Date(a0, 0, 1).getTime()
  const fin = new Date(a1 + 1, 0, 1).getTime()
  const pct = (t) => ((t - debut) / (fin - debut)) * 100
  const place = (p) => {
    const g = pct(p.date_start)
    return { left: `${g}%`, width: `${Math.max(pct((p.date_end ?? p.date_start) + JOUR) - g, 0.6)}%` }
  }
  const maintenant = Date.now()
  return {
    annees: Array.from({ length: a1 - a0 + 1 }, (_, i) => a0 + i),
    colonnes: `repeat(${(a1 - a0 + 1) * 12}, minmax(0, 1fr))`,
    prepa: prepa.map(place),
    rea: rea.map(place),
    weekends: samedis.map((t) => `${pct(t)}%`),
    aujourdhui: maintenant >= debut && maintenant < fin ? `${pct(maintenant)}%` : null
  }
})

const PASTILLE =
  'inline-flex max-w-full items-center rounded-lg border border-slate-200 bg-white text-sm dark:border-white/10 dark:bg-white/4'
const AJOUTER =
  'text-secondary-700 hover:bg-secondary-50 dark:text-secondary-300 inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors dark:hover:bg-white/6'
const RETIRER =
  'text-ink-soft hover:text-rust-700 dark:hover:text-rust-300 mr-1 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md'
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h3 :id="props.titreId" class="text-ink font-semibold">Périodes</h3>
      <p v-if="props.note" class="text-ink-soft text-xs">{{ props.note }}</p>
    </div>

    <!-- Frise (décorative : les listes ci-dessous portent l'information) -->
    <div aria-hidden="true">
      <div
        class="text-ink-soft grid text-center text-[10px] font-semibold"
        :style="{ gridTemplateColumns: frise.colonnes }">
        <template v-if="frise.annees.length === 1">
          <span v-for="(m, i) in MOIS" :key="i">{{ m }}</span>
        </template>
        <template v-else>
          <span v-for="a in frise.annees" :key="a" class="col-span-12">{{ a }}</span>
        </template>
      </div>
      <div class="bg-magenta-50 dark:bg-night-900 relative mt-1 h-8 overflow-hidden rounded-md">
        <div class="absolute inset-0 grid" :style="{ gridTemplateColumns: frise.colonnes }">
          <span
            v-for="i in frise.annees.length * 12"
            :key="i"
            class="border-l first:border-l-0"
            :class="
              (i - 1) % 12 === 0 ? 'border-magenta-300/70 dark:border-white/20' : 'border-white dark:border-white/5'
            " />
        </div>
        <span
          v-for="(b, i) in frise.prepa"
          :key="`p${i}`"
          class="absolute top-2.5 h-3 rounded-xs border opacity-50"
          :class="props.barre"
          :style="b" />
        <span
          v-for="(b, i) in frise.rea"
          :key="`r${i}`"
          class="absolute top-2.5 h-3 rounded-xs border"
          :class="props.barre"
          :style="b" />
        <span
          v-for="(left, i) in frise.weekends"
          :key="`w${i}`"
          class="absolute top-1.5 h-5 w-1 bg-orange-500"
          :style="{ left }" />
        <span
          v-if="frise.aujourdhui"
          class="border-secondary-400 absolute inset-y-0 border-l-2 border-dashed"
          :style="{ left: frise.aujourdhui }" />
      </div>
    </div>

    <div class="divide-rule mt-3 divide-y">
      <!-- Préparation et réalisation -->
      <div
        v-for="ligne in LIGNES"
        :key="ligne.type"
        class="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:gap-4">
        <p class="text-ink w-28 shrink-0 text-sm font-semibold sm:pt-1.5">
          {{ ligne.titre }}
          <span v-if="ligne.requise" class="text-rust-500">*</span>
        </p>
        <div class="flex min-w-0 flex-1 flex-col gap-2.5">
          <div class="flex flex-wrap items-center gap-2">
            <span
              v-for="{ p, i } in ligne.liste"
              :key="i"
              :class="[
                PASTILLE,
                calendrier?.type === ligne.type && calendrier.index === i && 'ring-secondary-500/40 ring-2'
              ]">
              <button
                type="button"
                class="text-ink flex min-w-0 cursor-pointer items-center gap-2 py-1.5 pr-1 pl-3"
                :aria-label="`Modifier la période du ${libellePeriode(p).debut} au ${libellePeriode(p).fin}`"
                @click="ouvrirPeriode(ligne.type, i)">
                <span
                  class="h-2.5 w-4 shrink-0 rounded-xs border"
                  :class="[props.barre, ligne.type === 'preparation' && 'opacity-50']" />
                <span class="truncate">
                  {{ libellePeriode(p).debut }}
                  <Icon name="lucide:arrow-right" size="13" class="text-ink-soft mx-0.5 inline" />
                  {{ libellePeriode(p).fin }}
                </span>
                <span class="text-ink-soft shrink-0 text-xs">{{ semainesPeriode(p) }}</span>
                <Icon name="lucide:pencil" size="13" class="text-ink-soft shrink-0" />
              </button>
              <button
                type="button"
                :class="RETIRER"
                aria-label="Supprimer la période"
                @click="supprimerPeriode(ligne.type, i)">
                <Icon name="lucide:x" size="14" />
              </button>
            </span>
            <span
              v-if="!ligne.liste.length"
              class="text-sm"
              :class="ligne.requise ? 'text-rust-700 dark:text-rust-300' : 'text-ink-soft'">
              {{ ligne.requise ? 'Au moins une période est nécessaire.' : 'Aucune.' }}
            </span>
            <button type="button" :class="AJOUTER" @click="ouvrirPeriode(ligne.type)">
              <Icon name="lucide:plus" size="15" />
              Ajouter
            </button>
          </div>
        </div>
      </div>

      <!-- Week-ends travaillés -->
      <div class="flex flex-col gap-2 pt-3 sm:flex-row sm:items-start sm:gap-4">
        <p class="text-ink w-28 shrink-0 text-sm font-semibold sm:pt-1.5">Week-ends</p>
        <div class="flex min-w-0 flex-1 flex-col gap-2.5">
          <div class="flex flex-wrap items-center gap-2">
            <span v-for="{ w, i } in weekendsTries" :key="i" :class="PASTILLE">
              <span class="text-ink flex items-center gap-2 py-1.5 pr-1 pl-3">
                <span class="h-3.5 w-1 shrink-0 bg-orange-500" />
                <span class="font-semibold">S{{ w.debutSemaine }}</span>
                <span class="text-ink-soft">
                  {{ joursWeekend(w.debutSemaine, w.debutAnnee) }}
                  <template v-if="w.debutAnnee !== anneeCourante">{{ w.debutAnnee }}</template>
                </span>
              </span>
              <button
                type="button"
                :class="RETIRER"
                :aria-label="`Supprimer le week-end de la semaine ${w.debutSemaine}`"
                @click="supprimerWeekend(i)">
                <Icon name="lucide:x" size="14" />
              </button>
            </span>
            <span v-if="!weekends.length && editeur?.type !== 'weekend'" class="text-ink-soft text-sm">Aucun.</span>
            <button v-if="editeur?.type !== 'weekend'" type="button" :class="AJOUTER" @click="ouvrirWeekend">
              <Icon name="lucide:plus" size="15" />
              Ajouter
            </button>
          </div>

          <div
            v-if="editeur?.type === 'weekend'"
            class="bg-magenta-50/70 flex flex-wrap items-end gap-3 rounded-xl p-3 dark:bg-white/5">
            <div class="w-60">
              <p :class="LABEL">Semaine</p>
              <AppSelect
                v-model="editeur.semaine"
                :options="semainesOptions"
                placeholder="Choisir une semaine"
                searchable
                search-placeholder="S14, avril…"
                v4 />
            </div>
            <div class="w-28">
              <p :class="LABEL">Année</p>
              <AppSelect v-model="editeur.annee" :options="ANNEES" v4 />
            </div>
            <div class="flex items-center gap-1">
              <AppButtonValidated
                theme="outline"
                type="button"
                :validated="!!editeur.semaine && !weekendDoublon"
                @click="validerWeekend">
                <template #default>Ajouter</template>
              </AppButtonValidated>
              <button
                type="button"
                class="text-ink-soft hover:text-ink h-10 cursor-pointer px-2 text-sm"
                @click="editeur = null">
                Annuler
              </button>
            </div>
            <p v-if="weekendDoublon" class="text-rust-700 dark:text-rust-300 w-full text-xs">
              Ce week-end est déjà programmé.
            </p>
          </div>
        </div>
      </div>
    </div>

    <AppDatePickerRange
      :is-open="!!calendrier"
      :title="calendrierTitre"
      :initial-start-date="calendrierPeriode?.date_start ?? null"
      :initial-end-date="calendrierPeriode?.date_end ?? null"
      @select="validerPeriode"
      @close="calendrier = null" />
  </div>
</template>
