// Barre latérale V4 (blanche) des pages Tâches, Chantiers et Plan de charge : classes communes.
// Élément sélectionné : fond gris et repère magenta sur le bord gauche. Le repère est une barre droite
// en pleine hauteur, rognée par l'arrondi de l'élément (overflow-hidden) ; au survol d'un autre élément,
// elle glisse depuis la gauche, en plus clair. Cachée, elle est aussi transparente : certains navigateurs
// (Safari) laissent sinon dépasser un filet au bord de l'arrondi. L'élément doit être en `relative`.

// Titre de rubrique (« Secteurs », « Filtres »…)
export const PANNEAU_TITRE = 'text-ink-soft text-xs font-semibold'

const REPERE =
  'overflow-hidden before:absolute before:inset-y-0 before:left-0 before:w-0.75 before:transition-[translate,opacity] before:duration-200 before:ease-out motion-reduce:before:transition-none'

export const panneauItem = (actif) =>
  actif
    ? `${REPERE} text-ink bg-slate-100 before:bg-magenta-500 dark:bg-white/8 dark:before:bg-magenta-400`
    : `${REPERE} text-ink-soft hover:text-ink hover:bg-slate-50 before:bg-magenta-300 before:-translate-x-full before:opacity-0 hover:before:translate-x-0 hover:before:opacity-100 dark:hover:bg-white/5 dark:before:bg-magenta-400/60`

export const panneauIcone = (actif) =>
  actif ? 'text-magenta-600 dark:text-magenta-300' : 'text-slate-400 dark:text-white/45'

export const panneauBadge = (actif) =>
  actif ? 'bg-magenta-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/80'
