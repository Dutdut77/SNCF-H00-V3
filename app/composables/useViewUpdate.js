export const useUpdate = () => {
  const client = useSupabaseClient()

  const hasViewedUpdate = useState('hasViewedUpdate', () => false)

  /**
   * Vérifie si l'utilisateur a déjà vu la mise à jour
   * @param {string} email - Email de l'utilisateur
   * @returns {Promise<boolean>} - true si l'utilisateur a vu la mise à jour, false sinon
   */
  const checkUserViewedUpdate = async (email) => {
    try {
      const { data, error } = await client.from('viewupdate').select('user_email').eq('user_email', email).single()

      if (error && error.code !== 'PGRST116') throw error

      hasViewedUpdate.value = !!data
      return !!data
    } catch (err) {
      console.error('Erreur lors de la vérification:', err.message)
      return false
    }
  }

  /**
   * Marque la mise à jour comme vue pour l'utilisateur
   * @param {string} email - Email de l'utilisateur
   */
  const markUpdateAsViewed = async (email) => {
    // Si ouvert manuellement, pas besoin de réécrire en BDD (déjà enregistré)
    if (manuallyOpened.value) {
      manuallyOpened.value = false
      hasViewedUpdate.value = true
      return
    }

    try {
      const { error } = await client.from('viewupdate').upsert({ user_email: email }, { onConflict: 'user_email' })

      if (error) throw error

      hasViewedUpdate.value = true
    } catch (err) {
      console.error("Erreur lors de l'enregistrement:", err.message)
    }
  }

  // Indique si le modal a été ouvert manuellement (l'utilisateur a déjà validé en BDD)
  const manuallyOpened = useState('updateManuallyOpened', () => false)

  const showUpdateModal = () => {
    manuallyOpened.value = true
    hasViewedUpdate.value = false
  }

  return {
    checkUserViewedUpdate,
    markUpdateAsViewed,
    showUpdateModal,
    hasViewedUpdate
  }
}
