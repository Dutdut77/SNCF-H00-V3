// Source unique de vérité pour l'état d'un chantier (colonne `chantiers.etat`).
// Le mapping était dupliqué dans chantiers/index.vue et dashboard/epm.vue.
export const useEtatChantier = () => {
  // Codes stockés en base : 0 = RLT, 1 = Externe, 2 = Pré-op, -1 = Terminé
  const ETATS = {
    0: {
      label: 'RLT',
      color: 'bg-sky-500',
      textColor: 'text-sky-700',
      bgLight: 'bg-sky-100',
      border: 'border-sky-500'
    },
    1: {
      label: 'Externe',
      color: 'bg-purple-500',
      textColor: 'text-purple-700',
      bgLight: 'bg-purple-100',
      border: 'border-purple-500'
    },
    2: {
      label: 'Pré-op',
      color: 'bg-lime-500',
      textColor: 'text-lime-700',
      bgLight: 'bg-lime-100',
      border: 'border-lime-500'
    },
    '-1': {
      label: 'Terminé',
      color: 'bg-slate-500',
      textColor: 'text-slate-700',
      bgLight: 'bg-slate-100',
      border: 'border-slate-500'
    }
  }

  const ETAT_INCONNU = {
    label: 'Inconnu',
    color: 'bg-gray-500',
    textColor: 'text-gray-700',
    bgLight: 'bg-gray-100',
    border: 'border-gray-500'
  }

  const getEtatInfo = (etat) => ETATS[etat] ?? ETAT_INCONNU

  // Filtres de la liste : ids textuels ↔ prédicat sur `etat`.
  // `all` = tous les chantiers non terminés.
  const etatOptions = [
    {
      id: 'all',
      label: 'Chantiers en cours',
      icon: 'lucide:layers',
      color: 'bg-linear-to-br from-secondary-400 to-secondary-600 text-white border-secondary-400',
      dot: 'bg-secondary-500',
      match: (c) => c.etat > -1
    },
    {
      id: 'rlt',
      label: 'RLT',
      icon: 'lucide:zap',
      color: 'bg-sky-100 text-sky-700 border-sky-300',
      dot: 'bg-sky-500',
      match: (c) => c.etat === 0
    },
    {
      id: 'preop',
      label: 'Pré-op',
      icon: 'lucide:clipboard-check',
      color: 'bg-lime-100 text-lime-700 border-lime-300',
      dot: 'bg-lime-500',
      match: (c) => c.etat === 2
    },
    {
      id: 'externe',
      label: 'Externe',
      icon: 'lucide:external-link',
      color: 'bg-purple-100 text-purple-700 border-purple-300',
      dot: 'bg-purple-500',
      match: (c) => c.etat === 1
    },
    {
      id: 'termine',
      label: 'Terminé',
      icon: 'lucide:check-circle',
      color: 'bg-slate-100 text-slate-700 border-slate-300',
      dot: 'bg-slate-500',
      match: (c) => c.etat === -1
    }
  ]

  const getEtatOption = (id) => etatOptions.find((o) => o.id === id) || etatOptions[0]

  // Compte les chantiers par filtre : { all, rlt, preop, externe, termine }
  const countByEtat = (chantiers) => {
    const list = Array.isArray(chantiers) ? chantiers : []
    return etatOptions.reduce((acc, option) => {
      acc[option.id] = list.filter(option.match).length
      return acc
    }, {})
  }

  // Applique le filtre courant à une liste de chantiers.
  const filterByEtat = (chantiers, etatId) => {
    const list = Array.isArray(chantiers) ? chantiers : []
    return list.filter(getEtatOption(etatId).match)
  }

  return { getEtatInfo, etatOptions, getEtatOption, countByEtat, filterByEtat }
}
