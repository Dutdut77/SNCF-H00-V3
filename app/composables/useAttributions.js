// Attributions des chantiers = sites (UO Travaux, UTM, ...) — table de référence extensible.
export const useAttributions = () => {
  const client = useSupabaseClient()
  const { addToast } = useToast()

  const allAttributions = useState('allAttributions', () => [])

  const getAttributions = async () => {
    try {
      const { data, error } = await client
        .from('attributions')
        .select('code, label, ordre')
        .order('ordre', { ascending: true })

      if (error) throw error
      allAttributions.value = data || []
    } catch (err) {
      console.error('Erreur lors du chargement des attributions:', err)
      allAttributions.value = []
      addToast({
        title: 'Problème lors du chargement des attributions',
        message: err.message || "La table attributions n'existe peut-être pas encore.",
        type: 'Error'
      })
    }
  }

  // Toutes les attributions sont des sites : [{ id: code, label }]
  const attributionOptions = computed(() => allAttributions.value.map((a) => ({ id: a.code, label: a.label })))
  // Alias sémantique pour l'affectation d'un utilisateur à un site.
  const siteOptions = attributionOptions

  const getAttribution = (code) => allAttributions.value.find((a) => a.code === code) || null

  // Secteur par défaut : le premier configuré (ordre croissant), aucun si la liste est vide.
  // Pas de secteur codé en dur : chaque infrapôle définit les siens (Paramètres → Application → Secteurs).
  const defaultAttributionCode = computed(() => allAttributions.value[0]?.code ?? null)

  // Créer un site / une attribution.
  const createAttribution = async (attribution) => {
    try {
      const { data, error } = await client
        .from('attributions')
        .insert({
          code: attribution.code,
          label: attribution.label,
          ordre: attribution.ordre ?? 0
        })
        .select()
        .single()

      if (error) throw error
      await getAttributions()
      addToast({
        title: 'Secteur créé',
        message: `Le secteur « ${attribution.label} » a été créé avec succès.`,
        type: 'Success'
      })
      return data
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: err.message || 'Impossible de créer le secteur.',
        type: 'Error'
      })
      return null
    }
  }

  // Modifier un site / une attribution (le code, clé primaire, n'est pas modifiable).
  const updateAttribution = async (attribution) => {
    try {
      const { error } = await client
        .from('attributions')
        .update({
          label: attribution.label,
          ordre: attribution.ordre ?? 0
        })
        .eq('code', attribution.code)

      if (error) throw error
      await getAttributions()
      addToast({
        title: 'Secteur modifié',
        message: 'Les modifications ont été enregistrées avec succès.',
        type: 'Success'
      })
      return true
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: err.message || 'Impossible de modifier le secteur.',
        type: 'Error'
      })
      return false
    }
  }

  // Supprimer un site / une attribution. Échoue si des chantiers y sont rattachés (FK).
  const deleteAttribution = async (code) => {
    try {
      const { error } = await client.from('attributions').delete().eq('code', code)

      if (error) throw error
      await getAttributions()
      addToast({
        title: 'Secteur supprimé',
        message: 'Le secteur a été supprimé avec succès.',
        type: 'Success'
      })
      return true
    } catch (err) {
      addToast({
        title: 'Erreur',
        message:
          err.message || 'Impossible de supprimer le secteur (il est peut-être utilisé par des chantiers).',
        type: 'Error'
      })
      return false
    }
  }

  return {
    allAttributions,
    getAttributions,
    attributionOptions,
    siteOptions,
    getAttribution,
    defaultAttributionCode,
    createAttribution,
    updateAttribution,
    deleteAttribution
  }
}
