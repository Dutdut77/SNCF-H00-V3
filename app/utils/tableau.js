// Tableaux et formulaires V4 (pages Paramètres) : classes communes, reprises des tableaux du tableau de bord.

// Carte qui porte le tableau : défile dans les deux sens, en-tête figé
export const TABLEAU_CARTE = 'surface-card min-h-0 flex-1 overflow-auto rounded-xl max-lg:max-h-[75vh]'
// En-tête blanc, séparé des lignes par un filet (ombre intérieure : le filet reste visible en défilant)
export const TABLEAU_TETE =
  'bg-table-head table-head-text sticky top-0 z-10 text-[0.8125rem] shadow-[inset_0_-1px_0_var(--color-rule)]'
export const TABLEAU_CORPS = 'divide-y divide-slate-900/[0.07] dark:divide-white/[0.07]'
// Ligne cliquable : survol taupe, comme les autres tableaux
export const TABLEAU_LIGNE = 'cursor-pointer transition-colors hover:bg-taupe-100 dark:hover:bg-taupe-400/8'

// Étiquette taupe des identifiants (comptes, codes, numéros)
export const ETIQUETTE_TAUPE =
  'rounded bg-taupe-100 px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-taupe-700 tabular-nums ring-1 ring-taupe-200 ring-inset dark:bg-taupe-400/15 dark:text-taupe-200 dark:ring-0'

// Boutons d'action d'une ligne (icône seule)
export const BOUTON_ICONE =
  'text-ink-soft hover:text-ink flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-secondary-500 dark:hover:bg-white/8'
export const BOUTON_ICONE_DANGER =
  'text-ink-soft flex size-8 cursor-pointer items-center justify-center rounded-md transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-300'

// Menu d'actions d'une ligne (AppDropdownMenu : panel-class, puis chaque entrée)
export const MENU_PANNEAU =
  'bg-card border-rule rounded-xl border p-1.5 shadow-[0_24px_48px_-20px_rgb(43_4_35/0.35)] dark:shadow-[0_24px_48px_-20px_rgb(0_0_0/0.7)]'
export const MENU_ENTREE =
  'text-ink flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-slate-100 disabled:cursor-default disabled:opacity-45 disabled:hover:bg-transparent dark:hover:bg-white/8'
export const MENU_ENTREE_DANGER =
  'flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-red-700 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10'

// Libellé de champ de formulaire (au-dessus d'un form-control)
export const CHAMP_LIBELLE = 'text-ink mb-1.5 block text-[13px] font-medium'

// Choix segmenté (type d'imprimante, sens d'un délai…) : options côte à côte, la sélection cerclée de magenta
// (pas de fond rose : les sélections restent neutres, la couleur de marque en accent)
export const segmentOption = (actif) =>
  actif
    ? 'border-magenta-500 bg-white text-magenta-700 ring-1 ring-magenta-500 ring-inset dark:border-magenta-400 dark:bg-white/6 dark:text-white dark:ring-magenta-400'
    : 'text-ink-soft hover:text-ink border-slate-300 bg-white hover:border-slate-400 dark:border-white/15 dark:bg-transparent dark:hover:border-white/30'

// Filtre en pastilles de la barre d'outils (origine, état, type…), avec compteur : le filtre actif en dégradé
// magenta → prune, comme les boutons d'action principale (un gris ne se distinguait pas assez)
export const filtrePastille = (actif) =>
  actif
    ? 'from-magenta-500 via-prune-500 to-prune-700 border-transparent bg-linear-90 text-white shadow-[0_6px_14px_-8px_rgb(43_4_35/0.7)]'
    : 'text-ink-soft hover:text-ink border-slate-200 bg-white hover:border-slate-300 dark:border-white/12 dark:bg-white/4 dark:hover:border-white/25'
export const filtreCompteur = (actif) =>
  actif ? 'bg-white/22 text-white' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-white/80'
