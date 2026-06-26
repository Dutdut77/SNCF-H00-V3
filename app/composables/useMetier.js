// Référentiel métier partagé pour la commande de matière.
// Les ensembles, logiques métier et commandes sont rattachés à un métier ;
// le catalogue d'articles reste commun. Codes alignés sur les profils
// utilisateur (cf. useUsers : 10/11 = Voie, 20/21 = SE/SM, 30/31 = Caténaire).
export const useMetier = () => {
  const user = useAuthUser()

  const METIERS = [
    { code: 'VOIE', label: 'Voie' },
    { code: 'SES', label: 'SE/SM' },
    { code: 'CAT', label: 'Caténaire' },
  ]

  // num_profil → métier ; null pour les profils transverses
  // (SuperAdmin, Logistique, MOEtx, CdP) qui doivent choisir explicitement.
  const metierFromProfil = (numProfil) => {
    switch (Number(numProfil)) {
      case 10:
      case 11:
        return 'VOIE'
      case 20:
      case 21:
        return 'SES'
      case 30:
      case 31:
        return 'CAT'
      default:
        return null
    }
  }

  const metierLabel = (code) =>
    METIERS.find((m) => m.code === code)?.label ?? code ?? ''

  const currentUserMetier = computed(() => metierFromProfil(user.value?.profils))

  return { METIERS, metierFromProfil, metierLabel, currentUserMetier }
}
