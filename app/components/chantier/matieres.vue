<script setup>
// Page « Listes de matières » : réunit les listes (brouillons) et les commandes
// (bordereaux Base Arrière) derrière un seul rail de navigation.
//
// Les deux composants métier restent autonomes : chacun téléporte sa propre
// sidebar dans la section correspondante du rail (cf. prop `railTarget`) et
// n'affiche son détail que lorsqu'il a la main (prop `active`).
//
// Chaque section est une carte distincte, toujours visible : on voit d'un coup
// d'œil les listes et les commandes du chantier. La carte active est mise en
// avant (bordure sarcelle) et prend un peu plus de hauteur que l'autre.
defineProps({
  chantier: { type: Object, required: true }
})

const SECTIONS = [
  {
    key: 'listes',
    label: 'Listes',
    icon: 'lucide:clipboard-list'
  },
  {
    key: 'commandes',
    label: 'Commandes',
    icon: 'lucide:package'
  }
]

// Section dont le détail est affiché à droite
const section = ref('listes')

// Repliage des cartes (on garde toujours au moins une carte ouverte)
const open = ref({ listes: true, commandes: true })
const toggle = (key) => {
  const next = { ...open.value, [key]: !open.value[key] }
  if (!next.listes && !next.commandes) return
  open.value = next
}

// Compteurs remontés par chaque composant
const counts = ref({ listes: 0, commandes: 0 })

// Une sélection dans une carte lui donne la main (et la déplie si besoin)
const activate = (key) => {
  section.value = key
  if (!open.value[key]) open.value = { ...open.value, [key]: true }
}
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden px-4">
    <!-- Titre -->
    <div class="flex-none border-b border-slate-200 py-3 dark:border-slate-700">
      <AppTitleMain title="Listes de matières" description="Brouillons de matières et bordereaux de commande du chantier" />
    </div>

    <div class="flex min-h-0 flex-1 overflow-hidden">
      <!-- ── Rail commun : une carte par section ───────────────────────────── -->
      <aside class="flex w-72 flex-none flex-col gap-2 overflow-hidden border-r border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-900/50">
        <div
          v-for="s in SECTIONS"
          :key="s.key"
          class="flex min-h-0 flex-col overflow-hidden rounded-lg border bg-white transition-[flex-grow,border-color] duration-300 dark:bg-slate-800/50"
          :class="[
            open[s.key] ? (section === s.key ? 'flex-3' : 'flex-2') : 'flex-none',
            section === s.key
              ? 'border-secondary-300 dark:border-secondary-700/60'
              : 'border-slate-200 dark:border-slate-700'
          ]">
          <!-- En-tête de carte : le clic donne la main à la section,
               le chevron se contente de la replier. -->
          <div
            class="flex flex-none cursor-pointer items-center gap-2 px-3 py-2 text-left transition-colors"
            :class="[
              open[s.key] ? 'border-b' : '',
              section === s.key
                ? 'border-secondary-200 bg-secondary-50/60 dark:border-secondary-700/50 dark:bg-secondary-900/20'
                : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800/60'
            ]"
            @click="activate(s.key)">
            <Icon
              :name="s.icon"
              size="15"
              class="flex-none"
              :class="section === s.key ? 'text-secondary-500' : 'text-slate-400'" />
            <span
              class="flex-1 truncate text-xs font-semibold tracking-wide uppercase"
              :class="section === s.key ? 'text-secondary-700 dark:text-secondary-300' : 'text-slate-600 dark:text-slate-300'">
              {{ s.label }}
            </span>
            <span
              class="flex-none text-[11px] font-bold tabular-nums"
              :class="section === s.key ? 'text-secondary-600 dark:text-secondary-400' : 'text-slate-400'">
              {{ counts[s.key] }}
            </span>
            <button
              type="button"
              :title="open[s.key] ? 'Replier' : 'Déplier'"
              class="flex-none cursor-pointer rounded p-0.5 text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              @click.stop="toggle(s.key)">
              <Icon
                name="lucide:chevron-down"
                size="14"
                class="transition-transform duration-200"
                :class="open[s.key] ? '' : '-rotate-90'" />
            </button>
          </div>

          <!-- Cible de téléportation de la sidebar du composant correspondant -->
          <div
            :id="`matieres-rail-${s.key}`"
            class="flex min-h-0 flex-1 flex-col overflow-hidden"
            :style="open[s.key] ? null : { display: 'none' }" />
        </div>
      </aside>

      <!-- ── Détail : le composant actif occupe la zone principale ──────────── -->
      <ChantierCommandesMatieres
        :chantier="chantier"
        rail-target="#matieres-rail-listes"
        :active="section === 'listes'"
        @activate="activate('listes')"
        @count="counts.listes = $event" />

      <ChantierCommandes
        :chantier="chantier"
        rail-target="#matieres-rail-commandes"
        :active="section === 'commandes'"
        @activate="activate('commandes')"
        @count="counts.commandes = $event" />
    </div>
  </div>
</template>
