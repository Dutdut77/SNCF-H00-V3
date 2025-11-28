export const useChantiers = () => {
  const supabase = useSupabaseClient();
  const { addToast } = useToast();
  const allChantiers = useState('chantiers_list', () => []);

  // Fonction principale pour récupérer tous les chantiers
  const getChantiers = async () => {
    try {
      const { data, error } = await supabase
        .from('chantiers')
        .select('id, compte, name, ligne_id, date_start_travaux, date_end_travaux, etat, lignes(id, name)')
        .order('date_start_travaux', { ascending: false });
      
      if (error) {
        console.error("Erreur Supabase:", error);
        throw error;
      }
      
      if (data && Array.isArray(data)) {
        allChantiers.value = data.map(chantier => ({
          ...chantier,
          ligne: chantier.lignes?.name || null
        }));
      } else {
        allChantiers.value = [];
      }
    } catch (err) {
      console.error("Erreur lors du chargement des chantiers:", err);
      allChantiers.value = [];
      addToast({
        title: "Problème lors du chargement des chantiers",
        message: err.message || "La table chantiers n'existe peut-être pas encore.",
        type: "Error"
      });
    }
  };

  // Computed pour obtenir les chantiers par état
  const getChantiersEtat2 = computed(() => {
    return allChantiers.value.filter(chantier => chantier.etat === 2);
  });

  const getChantiersEtat1 = computed(() => {
    return allChantiers.value.filter(chantier => chantier.etat === 1);
  });

  const getChantiersEtat0 = computed(() => {
    return allChantiers.value.filter(chantier => chantier.etat === 0);
  });

  const getChantiersTermines = computed(() => {
    return allChantiers.value.filter(chantier => chantier.etat === -1);
  });

  // Fonction pour passer un chantier (état 2 → 0)
  const passerChantier = async (chantierId) => {
    try {
      const { error } = await supabase
        .from('chantiers')
        .update({ etat: 0 })
        .eq('id', chantierId);
      
      if (error) throw error;
      
      await getChantiers();
      
      addToast({
        title: "Chantier passé",
        message: "Le chantier a été passé au RLT avec succès.",
        type: "Success"
      });
      
      return true;
    } catch (err) {
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de passer le chantier",
        type: "Error"
      });
      return false;
    }
  };

  // Fonction pour terminer un chantier (état 0 ou 1 → -1)
  const terminerChantier = async (chantierId) => {
    try {
      const { error } = await supabase
        .from('chantiers')
        .update({ etat: -1 })
        .eq('id', chantierId);
      
      if (error) throw error;
      
      await getChantiers();
      
      addToast({
        title: "Chantier terminé",
        message: "Le chantier a été terminé avec succès.",
        type: "Success"
      });
      
      return true;
    } catch (err) {
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de terminer le chantier",
        type: "Error"
      });
      return false;
    }
  };

  // Fonction pour supprimer un chantier
  const supprimerChantier = async (chantierId) => {
    try {
      const { error } = await supabase
        .from('chantiers')
        .delete()
        .eq('id', chantierId);
      
      if (error) throw error;
      
      await getChantiers();
      
      addToast({
        title: "Chantier supprimé",
        message: "Le chantier a été supprimé avec succès.",
        type: "Success"
      });
      
      return true;
    } catch (err) {
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de supprimer le chantier",
        type: "Error"
      });
      return false;
    }
  };

  return {
    getChantiers,
    getChantiersEtat2,
    getChantiersEtat1,
    getChantiersEtat0,
    getChantiersTermines,
    passerChantier,
    terminerChantier,
    supprimerChantier
  };
};
