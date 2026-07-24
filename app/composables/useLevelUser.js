export const useLevelUser = () => {
  const supabase = useSupabaseClient()
  const user = useAuthUser()

  const isAdmin = computed(() => {
    return user.value?.role === 1
  })

  const isSuperAdmin = computed(() => {
    return user.value?.role === 2
  })

  // Droit d'édition de la logistique : admin/superadmin, profil Logistique (1) ou pré-op.
  // Source de vérité partagée (fiche chantier + accès dashboard logistique).
  const canEditLogistique = computed(() => {
    const u = user.value
    if (!u) return false
    return (u.role ?? 0) >= 1 || Number(u.profils) === 1 || u.pre_op === true
  })

  // Droit d'édition des colonnes Base Arrière (quantité BA + emplacement BA) d'une
  // commande : profil « Base Arrière » (num_profil 2) ou SuperAdmin (role 2).
  const canEditBaseArriere = computed(() => {
    const u = user.value
    if (!u) return false
    return (u.role ?? 0) >= 2 || Number(u.profils) === 2
  })

  // ============================================
  // SITES (attribution du chantier)
  // ============================================
  // Site unique de l'utilisateur : un code d'attribution, ou 'Pôle IT' (= tous les sites).
  // La consultation des calendriers est ouverte à tous les sites ; seuls la création
  // et la modification d'un chantier restent restreintes au site de l'utilisateur.
  const userSite = computed(() => user.value?.site || null)
  const isPoleIT = computed(() => userSite.value === 'Pôle IT')

  const belongsToSite = (code) => isPoleIT.value || userSite.value === code
  // Droit d'édition par site : superadmin, ou admin appartenant au site.
  const canEditSite = (code) => isSuperAdmin.value || (isAdmin.value && belongsToSite(code))
  const canEditChantier = (chantier) => canEditSite(chantier?.attribution)

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

  const isAuthorizedForTacheBis = (chantiers, taches) => {
    if (!Array.isArray(chantiers) || !Array.isArray(taches)) return []

    const userProfil = Number(user.value?.profils)
    if (isNaN(userProfil)) return []

    // Map pour lookup rapide des tâches par id
    const tachesById = new Map(taches.map((t) => [t.id, t]))

    const result = []

    for (const chantier of chantiers) {
      const h00Original = Array.isArray(chantier.h00) ? chantier.h00 : []

      // filtrer les h00 selon le profil de l'utilisateur
      const filteredH00 = h00Original.filter((h) => {
        const tache = tachesById.get(h.tache_id)
        if (!tache || !Array.isArray(tache.tache_profil)) return false

        return tache.tache_profil.some((p) => Number(p) === userProfil)
      })

      if (filteredH00.length > 0) {
        // push une copie du chantier avec ses h00 filtrés
        result.push({
          ...chantier, // clone complet pour éviter référence partagée
          h00: [...filteredH00]
        })
      }
    }

    return result
  }

  return {
    isAuthorizedForTache,
    isAuthorizedForTacheBis,
    isUserIntervenant,
    isAdmin,
    isSuperAdmin,
    canEditLogistique,
    canEditBaseArriere,
    userSite,
    isPoleIT,
    belongsToSite,
    canEditSite,
    canEditChantier
  }
}
