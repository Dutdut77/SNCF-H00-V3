export const useCategories = () => {
  const supabase = useSupabaseClient();
  const { addToast } = useToast();
  const allCategories = useState('categories_list', () => []);

  // Fonction principale pour récupérer toutes les catégories
  const getCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('idcategories, name')
        .order('name', { ascending: true });
      
      if (error) {
        console.error("Erreur Supabase:", error);
        throw error;
      }
      
      if (data && Array.isArray(data)) {
        allCategories.value = data.map(cat => ({
          id: cat.idcategories,
          name: cat.name
        }));
      } else {
        allCategories.value = [];
      }
    } catch (err) {
      console.error("Erreur lors du chargement des catégories:", err);
      allCategories.value = [];
      addToast({
        title: "Problème lors du chargement des catégories",
        message: err.message || "La table categories n'existe peut-être pas encore.",
        type: "Error"
      });
    }
  };

  // Fonction pour créer une catégorie
  const createCategory = async (name) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({ name })
        .select()
        .single();
      
      if (error) throw error;
      
      await getCategories();
      
      addToast({
        title: "Catégorie créée",
        message: `La catégorie "${name}" a été créée avec succès.`,
        type: "Success"
      });
      
      return data;
    } catch (err) {
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de créer la catégorie",
        type: "Error"
      });
      return null;
    }
  };

  // Fonction pour modifier une catégorie
  const updateCategory = async (categoryId, name) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ name })
        .eq('idcategories', categoryId);
      
      if (error) throw error;
      
      await getCategories();
      
      addToast({
        title: "Catégorie modifiée",
        message: `La catégorie a été modifiée avec succès.`,
        type: "Success"
      });
      
      return true;
    } catch (err) {
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de modifier la catégorie",
        type: "Error"
      });
      return false;
    }
  };

  // Fonction pour supprimer une catégorie
  const deleteCategory = async (categoryId) => {
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('idcategories', categoryId);
      
      if (error) throw error;
      
      await getCategories();
      
      addToast({
        title: "Catégorie supprimée",
        message: "La catégorie a été supprimée avec succès.",
        type: "Success"
      });
      
      return true;
    } catch (err) {
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de supprimer la catégorie",
        type: "Error"
      });
      return false;
    }
  };

  // Computed pour obtenir les catégories triées
  const categoriesSorted = computed(() => {
    return [...allCategories.value].sort((a, b) => a.name.localeCompare(b.name));
  });

  return {
    categories: allCategories,
    categoriesSorted,
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
  };
};

