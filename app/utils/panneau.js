// Barre latérale V4 (blanche) des pages Tâches, Chantiers, Plan de charge, Dashboard et Paramètres : classes communes.
// Rubrique : titre en gras, puis ses éléments en retrait le long d'un trait vertical (PANNEAU_GROUPE), qui part
// sous la première lettre du titre. Élément sélectionné : fond gris et repère magenta posé sur ce trait (éléments
// à bords gauches droits, collés au trait : PANNEAU_ENTREE). Le repère est une barre pleine hauteur ; au survol
// d'un autre élément, elle glisse depuis la gauche, en plus clair. Cachée, elle est aussi transparente : certains
// navigateurs (Safari) laissent sinon dépasser un filet au bord. L'élément doit être en `relative`.

// Titre de rubrique (« Secteurs », « Légende »…)
export const PANNEAU_TITRE = 'text-ink text-sm font-bold'

// Éléments d'une rubrique, en retrait le long du trait vertical (le titre au-dessus porte `px-3`)
export const PANNEAU_GROUPE = 'ml-3 flex flex-col gap-0.5 border-l border-slate-200 dark:border-white/12'
// Contenu non cliquable d'une rubrique (légende) : même trait, texte décalé
export const PANNEAU_RETRAIT = 'border-l border-slate-200 pl-3 dark:border-white/12'

// Élément cliquable d'une rubrique (hauteur au choix : py-2, py-2.5…), avec panneauItem pour son état
export const PANNEAU_ENTREE =
  'focus-visible:outline-secondary-500 relative -ml-px flex w-full cursor-pointer items-center gap-3 rounded-l-none rounded-r-lg px-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2'

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
