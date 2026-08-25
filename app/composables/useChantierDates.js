// Helpers de dates sur `chantiers.date_rea` (jsonb : [{ date_start_travaux, date_end_travaux }]).
// Extraits de chantiers/index.vue pour être partagés avec les vues tableau et cartes.
export const useChantierDates = () => {
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // Première date de réalisation (la plus ancienne).
  const getFirstReaDate = (chantier) => {
    if (!chantier?.date_rea || chantier.date_rea.length === 0) return null
    const dates = chantier.date_rea
      .map((r) => r.date_start_travaux)
      .filter((d) => d)
      .sort((a, b) => new Date(a) - new Date(b))
    return dates.length > 0 ? dates[0] : null
  }

  // Dernière date de réalisation (la plus récente).
  const getLastReaDate = (chantier) => {
    if (!chantier?.date_rea || chantier.date_rea.length === 0) return null
    const dates = chantier.date_rea
      .map((r) => r.date_end_travaux || r.date_start_travaux)
      .filter((d) => d)
      .sort((a, b) => new Date(b) - new Date(a))
    return dates.length > 0 ? dates[0] : null
  }

  // Week-ends de tous les chantiers (même state partagé que useTimeline)
  const allWeekends = useState('allWeekends', () => [])

  // Une période [start, end] chevauche-t-elle l'année donnée ?
  const isPeriodInYear = (startDateStr, endDateStr, year) => {
    if (!startDateStr) return false
    const startDate = new Date(startDateStr)
    const endDate = endDateStr ? new Date(endDateStr) : startDate
    return startDate.getFullYear() <= year && endDate.getFullYear() >= year
  }

  // Le chantier a-t-il quelque chose à montrer sur cette année ?
  // (réalisation, préparation ou week-end) — extrait de plan-de-charge-general.vue.
  const isChantierVisibleForYear = (chantier, year) => {
    const hasReaInYear = chantier.date_rea?.some((p) =>
      isPeriodInYear(p.date_start_travaux, p.date_end_travaux, year)
    )
    if (hasReaInYear) return true

    const hasPrepaInYear = chantier.date_prepa?.some((p) =>
      isPeriodInYear(p.date_start_prepa, p.date_end_prepa, year)
    )
    if (hasPrepaInYear) return true

    // Les week-ends sont stockés par semaine/année
    const weekendsForChantier = allWeekends.value?.filter((w) => w.chantier_id === chantier.id) || []
    return weekendsForChantier.some((w) => w.annee_debut === year || w.annee_fin === year)
  }

  return { formatDate, getFirstReaDate, getLastReaDate, isPeriodInYear, isChantierVisibleForYear }
}
