export const useProfilTache = () => {
  const client = useSupabaseClient();
  const { addToast } = useToast();

  const profilTaches = useState('profilTaches', () => [])

  const getAllProfilTache = async () => {
    try {
      const { data: response, error } = await client
      .from("profil")
      .select('*')
      .order('num_profil', { ascending: true })
      if (error) throw error;
      else {
        profilTaches.value = response.map((item) => ({
          id: item.num_profil,
          label: item.name_profil,
        }))
      }
    } catch (err) {
      addToast({
        title: "Problème lors du chargement des profils",
        message: err.message,
        type: "Error"
      });
    }
  }






    return { getAllProfilTache,  profilTaches }
    
}