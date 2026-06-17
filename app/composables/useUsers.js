export const useUsers = () => {
  const client = useSupabaseClient()
  const { addToast } = useToast()

  const users = useState('users', () => [])

  const getAllUsers = async () => {
    try {
      // Jointure directe avec la table profil via la foreign key
      const { data, error } = await client
        .from('users')
        .select('*, profil:profils(name_profil)')
        .order('email', { ascending: true })

      if (error) throw error

      users.value = data.map((user) => ({
        ...user,
        role: user.role ?? 0,
        profils: user.profils || null,
        profil_name: user.profil?.name_profil || null,
        pre_op: user.pre_op ?? false,
        ref_du_rdu: user.ref_du_rdu ?? false,
        en_formation: user.en_formation ?? false
      }))
    } catch (err) {
      addToast({
        title: 'Problème lors du chargement des utilisateurs',
        message: err.message,
        type: 'Error'
      })
    }
  }

  const getOneUser = async (id) => {
    try {
      const { data, error } = await client.from('users').select('*').eq('oidc_id', id).single()

      if (error) throw error

      return {
        ...data,
        role: data.role ?? 0, // 0 = aucun, 1 = admin, 2 = superadmin
        profils: data.profils || null
      }
    } catch (err) {
      addToast({
        title: "Problème lors de la récupération de l'utilisateur",
        message: err.message,
        type: 'Error'
      })
      return null
    }
  }

  const updateUser = async (userData) => {
    try {
      const { data, error } = await client
        .from('users')
        .update({
          nom: userData.nom || null,
          prenom: userData.prenom || null,
          profils: userData.profils || null,
          role: userData.role ?? 0, // 0 = aucun, 1 = admin, 2 = superadmin
          pre_op: userData.pre_op ?? false,
          ref_du_rdu: userData.ref_du_rdu ?? false,
          en_formation: userData.en_formation ?? false,
          site: userData.site ?? null
        })
        .eq('id', userData.id)
        .select()
        .single()

      if (error) throw error

      addToast({
        title: 'Utilisateur mis à jour',
        message: 'Les modifications ont été enregistrées avec succès',
        type: 'Success'
      })

      await getAllUsers()
      return data
    } catch (err) {
      addToast({
        title: 'Problème lors de la mise à jour',
        message: err.message,
        type: 'Error'
      })
      throw err
    }
  }

  // Créer un utilisateur manuellement (avant sa première connexion OIDC)
  const createUser = async (userData) => {
    try {
      // Vérifier si l'email existe déjà
      const { data: existingUser } = await client.from('users').select('id').eq('email', userData.email).maybeSingle()

      if (existingUser) {
        addToast({
          title: 'Utilisateur déjà existant',
          message: 'Un utilisateur avec cet email existe déjà',
          type: 'Warning'
        })
        return null
      }

      const email = userData.email.toLowerCase()

      const { data, error } = await client
        .from('users')
        .insert({
          email: email,
          nom: userData.nom || null,
          prenom: userData.prenom || null,
          profils: userData.profils ?? -1, // -1 = visiteur par défaut
          role: userData.role ?? 0,
          pre_op: userData.pre_op ?? false,
          ref_du_rdu: userData.ref_du_rdu ?? false,
          en_formation: userData.en_formation ?? false,
          site: userData.site ?? null
          // auth_uuid et oidc_id seront remplis lors de la première connexion
        })
        .select()
        .single()

      if (error) throw error

      addToast({
        title: 'Utilisateur créé',
        message: "L'utilisateur pourra se connecter avec son compte SNCF",
        type: 'Success'
      })

      await getAllUsers()
      return data
    } catch (err) {
      addToast({
        title: 'Problème lors de la création',
        message: err.message,
        type: 'Error'
      })
      throw err
    }
  }

  // Supprimer un utilisateur
  const deleteUser = async (userId) => {
    try {
      const { error } = await client.from('users').delete().eq('id', userId)

      if (error) throw error

      addToast({
        title: 'Utilisateur supprimé',
        message: "L'utilisateur a été supprimé avec succès",
        type: 'Success'
      })

      await getAllUsers()
      return true
    } catch (err) {
      addToast({
        title: 'Problème lors de la suppression',
        message: err.message,
        type: 'Error'
      })
      return false
    }
  }

  const getUsersRltVoie = computed(() => {
    return users.value.filter((user) => user.profils === 10)
  })
  const getUsersRltSes = computed(() => {
    return users.value.filter((user) => user.profils === 20)
  })
  const getUsersRltCat = computed(() => {
    return users.value.filter((user) => user.profils === 30)
  })
  const getUsersLogistique = computed(() => {
    return users.value.filter((user) => user.profils === 1)
  })
  const getUsersKvVoie = computed(() => {
    return users.value.filter((user) => user.profils === 11)
  })
  const getUsersKvSes = computed(() => {
    return users.value.filter((user) => user.profils === 21)
  })
  const getUsersKvCat = computed(() => {
    return users.value.filter((user) => user.profils === 31)
  })
  const getUsersPreopVoie = computed(() => {
    return users.value.filter((user) => user.profils === 10 && user.pre_op === true)
  })
  const getUsersPreopSes = computed(() => {
    return users.value.filter((user) => user.profils === 20 && user.pre_op === true)
  })
  const getUsersRefRdu = computed(() => {
    return users.value.filter((user) => user.ref_du_rdu === true)
  })
  // Chefs de projet (profil 42) — sélectionnables quel que soit le site, comme les RLT.
  const getUsersCdp = computed(() => {
    return users.value.filter((user) => user.profils === 42)
  })
  // Moetx Amont (profil 41) — agents Pôle IT, sélectionnables quel que soit le site.
  const getUsersMoetx = computed(() => {
    return users.value.filter((user) => user.profils === 41)
  })

  return {
    getAllUsers,
    getOneUser,
    updateUser,
    createUser,
    deleteUser,
    users,
    getUsersRltVoie,
    getUsersRltSes,
    getUsersRltCat,
    getUsersLogistique,
    getUsersKvVoie,
    getUsersKvSes,
    getUsersKvCat,
    getUsersPreopVoie,
    getUsersPreopSes,
    getUsersRefRdu,
    getUsersCdp,
    getUsersMoetx
  }
}
