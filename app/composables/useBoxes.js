export const useBoxes = () => {
  const supabase = useSupabaseClient()
  const { addToast } = useToast()

  const boxes = useState('boxes', () => [])

  const getBoxes = async () => {
    try {
      const { data, error } = await supabase
        .from('boxes')
        .select('id, nom, serie, identification')
        .order('nom', { ascending: true })
      if (error) throw error
      boxes.value = data ?? []
    } catch (err) {
      console.error('Erreur lors du chargement des box:', err)
      boxes.value = []
      addToast({
        title: 'Problème lors du chargement des box',
        message: err.message || "La table boxes n'existe peut-être pas encore.",
        type: 'Error'
      })
    }
  }

  const createBox = async (payload) => {
    try {
      const { data, error } = await supabase.from('boxes').insert(payload).select().single()
      if (error) throw error
      await getBoxes()
      addToast({ title: 'Box ajoutée', message: 'La box a été créée.', type: 'Success' })
      return data
    } catch (err) {
      addToast({ title: 'Erreur', message: err.message || 'Impossible de créer la box', type: 'Error' })
      return null
    }
  }

  const updateBox = async (id, payload) => {
    try {
      const { error } = await supabase
        .from('boxes')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
      await getBoxes()
      addToast({ title: 'Box mise à jour', message: 'Les modifications ont été enregistrées.', type: 'Success' })
      return true
    } catch (err) {
      addToast({ title: 'Erreur', message: err.message || 'Impossible de mettre à jour la box', type: 'Error' })
      return false
    }
  }

  const deleteBox = async (id) => {
    try {
      const { error } = await supabase.from('boxes').delete().eq('id', id)
      if (error) throw error
      await getBoxes()
      addToast({ title: 'Box supprimée', message: 'La box a été supprimée.', type: 'Success' })
      return true
    } catch (err) {
      addToast({ title: 'Erreur', message: err.message || 'Impossible de supprimer la box', type: 'Error' })
      return false
    }
  }

  return { boxes, getBoxes, createBox, updateBox, deleteBox }
}
