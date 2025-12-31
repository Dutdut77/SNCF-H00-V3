export const useLevelUser = () => {
  const supabase = useSupabaseClient()
  const user = useAuthUser()

  const isAdmin = computed(() => {
    return user.value?.role === 1
  })

  const isSuperAdmin = computed(() => {
    return user.value?.role === 2
  })

  const isUserIntervenant = async (chantierId) => {
    const { data, error } = await supabase
      .from('chantier_contacts_travaux')
      .select(
        `rlt_voie_principale,
         rlt_voie_secondaire,
         rlt_ses_principale,
         rlt_ses_secondaire,
         rlt_cat_principale,
         rlt_cat_secondaire,
         preop_voie,
         preop_ses,
         logistique,
         supervisor`
      )
      .eq('chantier_id', chantierId)
      .maybeSingle()

    if (error) throw error
    if (!data) return false

    // Récupérer tous les emails uniques
    const allEmailsUnique = [
      ...new Set(
        Object.values(data)
          .flat()
          .filter((v) => typeof v === 'string' && v.length > 0)
          .map((email) => email.toLowerCase())
      )
    ]

    return allEmailsUnique.includes(user.value.email.toLowerCase())
  }

  const isAuthorizedForTache = async (chantier, tache) => {
    if (chantier.etat === 2 && user.value.pre_op && tache.includes(user.value.profils)) {
      const isIntervenant = await isUserIntervenant(chantier.id)
      if (isIntervenant) {
        return true
      }
    }
    if (chantier.etat < 2 && tache.includes(user.value.profils)) {
      const isIntervenant = await isUserIntervenant(chantier.id)
      if (isIntervenant) {
        return true
      }
    }
    return false
  }

  return {
    isAuthorizedForTache,
    isUserIntervenant,
    isAdmin,
    isSuperAdmin
  }
}
