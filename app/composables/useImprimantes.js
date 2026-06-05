export const useImprimantes = () => {
  const supabase = useSupabaseClient()
  const { addToast } = useToast()

  const imprimantes = useState('imprimantes', () => [])

  const getImprimantes = async () => {
    try {
      const { data, error } = await supabase
        .from('imprimantes')
        .select('id, marque, model, serie, identification, type')
        .order('marque', { ascending: true })
      if (error) throw error
      imprimantes.value = data ?? []
    } catch (err) {
      console.error('Erreur lors du chargement des imprimantes:', err)
      imprimantes.value = []
      addToast({
        title: 'Problème lors du chargement des imprimantes',
        message: err.message || "La table imprimantes n'existe peut-être pas encore.",
        type: 'Error'
      })
    }
  }

  const createImprimante = async (payload) => {
    try {
      const { data, error } = await supabase.from('imprimantes').insert(payload).select().single()
      if (error) throw error
      await getImprimantes()
      addToast({ title: 'Imprimante ajoutée', message: 'L’imprimante a été créée.', type: 'Success' })
      return data
    } catch (err) {
      addToast({ title: 'Erreur', message: err.message || "Impossible de créer l'imprimante", type: 'Error' })
      return null
    }
  }

  const updateImprimante = async (id, payload) => {
    try {
      const { error } = await supabase
        .from('imprimantes')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      await getImprimantes()
      addToast({ title: 'Imprimante mise à jour', message: 'Les modifications ont été enregistrées.', type: 'Success' })
      return true
    } catch (err) {
      addToast({ title: 'Erreur', message: err.message || "Impossible de mettre à jour l'imprimante", type: 'Error' })
      return false
    }
  }

  const deleteImprimante = async (id) => {
    try {
      const { error } = await supabase.from('imprimantes').delete().eq('id', id)
      if (error) throw error
      await getImprimantes()
      addToast({ title: 'Imprimante supprimée', message: 'L’imprimante a été supprimée.', type: 'Success' })
      return true
    } catch (err) {
      addToast({ title: 'Erreur', message: err.message || "Impossible de supprimer l'imprimante", type: 'Error' })
      return false
    }
  }

  return { imprimantes, getImprimantes, createImprimante, updateImprimante, deleteImprimante }
}
