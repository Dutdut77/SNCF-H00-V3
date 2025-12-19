export const useLigne = () => {
  const client = useSupabaseClient()
  const { addToast } = useToast()

  const allLignes = useState('allLignes', () => [])

  const getAllLignes = async () => {
    try {
      const { data: response, error } = await client.from('lignes').select('*').order('id', { ascending: true })
      if (error) throw error
      else {
        allLignes.value = response.map((item) => ({
          id: item.id,
          label: item.name
        }))
      }
    } catch (err) {
      addToast({
        title: 'Problème lors du chargement des lignes',
        message: err.message,
        type: 'Error'
      })
    }
  }

  return { getAllLignes, allLignes }
}
