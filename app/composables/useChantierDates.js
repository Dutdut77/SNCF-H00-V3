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

  return { formatDate, getFirstReaDate, getLastReaDate }
}
