import { f as useSupabaseClient, a as useToast, g as useState } from './server.mjs';
import { computed } from 'vue';

const useTaches = () => {
  const supabase = useSupabaseClient();
  const { addToast } = useToast();
  const allTaches = useState("taches_list", () => []);
  const getTaches = async () => {
    try {
      const { data, error } = await supabase.from("taches").select("idtaches, id_categories, tache, delais, tache_profil, opt_delais, rp1, categories(idcategories, name)").order("delais", { ascending: false });
      if (error) {
        console.error("Erreur Supabase:", error);
        throw error;
      }
      if (data && Array.isArray(data)) {
        allTaches.value = data.map((t) => ({
          id: t.idtaches,
          id_categories: t.id_categories,
          tache: t.tache,
          delais: t.delais,
          tache_profil: t.tache_profil || [],
          opt_delais: t.opt_delais,
          rp1: t.rp1,
          categorie: t.categories?.name || null
        }));
      } else {
        allTaches.value = [];
      }
    } catch (err) {
      console.error("Erreur lors du chargement des tâches:", err);
      allTaches.value = [];
      addToast({
        title: "Problème lors du chargement des tâches",
        message: err.message || "La table taches n'existe peut-être pas encore.",
        type: "Error"
      });
    }
  };
  const createTache = async (tacheData) => {
    try {
      const { data, error } = await supabase.from("taches").insert({
        id_categories: tacheData.id_categories,
        tache: tacheData.tache,
        delais: tacheData.delais,
        tache_profil: tacheData.tache_profil || [],
        opt_delais: tacheData.opt_delais || 0,
        rp1: tacheData.rp1 || 0
      }).select().single();
      if (error) throw error;
      await getTaches();
      addToast({
        title: "Tâche créée",
        message: `La tâche a été créée avec succès.`,
        type: "Success"
      });
      return data;
    } catch (err) {
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de créer la tâche",
        type: "Error"
      });
      return null;
    }
  };
  const updateTache = async (tacheId, tacheData, oldTache = null) => {
    try {
      const { error } = await supabase.from("taches").update({
        id_categories: tacheData.id_categories,
        tache: tacheData.tache,
        delais: tacheData.delais,
        tache_profil: tacheData.tache_profil || [],
        opt_delais: tacheData.opt_delais,
        rp1: tacheData.rp1
      }).eq("idtaches", tacheId);
      if (error) throw error;
      const delaisChanged = oldTache && (oldTache.delais !== tacheData.delais || oldTache.opt_delais !== tacheData.opt_delais);
      if (delaisChanged) {
        await updateH00Previsions(tacheId, tacheData.delais, tacheData.opt_delais);
      }
      await getTaches();
      addToast({
        title: "Tâche modifiée",
        message: delaisChanged ? "La tâche et les prévisions associées ont été mises à jour." : "La tâche a été modifiée avec succès.",
        type: "Success"
      });
      return true;
    } catch (err) {
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de modifier la tâche",
        type: "Error"
      });
      return false;
    }
  };
  const updateH00Previsions = async (tacheId, delais, optDelais) => {
    try {
      const { data: h00Rows, error: fetchError } = await supabase.from("h00").select("id, chantier_id, chantiers(date_start_travaux, date_end_travaux)").eq("tache_id", tacheId);
      if (fetchError) throw fetchError;
      if (!h00Rows || h00Rows.length === 0) return;
      const updates = h00Rows.map((row) => {
        const chantier = row.chantiers;
        if (!chantier) return null;
        let dateReference;
        if (optDelais === 1) {
          dateReference = chantier.date_end_travaux;
        } else {
          dateReference = chantier.date_start_travaux;
        }
        if (!dateReference) return null;
        const refDate = new Date(dateReference);
        refDate.setDate(refDate.getDate() - delais);
        const newPrevision = refDate.toISOString().split("T")[0];
        return {
          id: row.id,
          prevision: newPrevision
        };
      }).filter(Boolean);
      for (const update of updates) {
        await supabase.from("h00").update({ prevision: update.prevision }).eq("id", update.id);
      }
      console.log(`${updates.length} prévisions mises à jour dans h00`);
    } catch (err) {
      console.error("Erreur lors de la mise à jour des prévisions h00:", err);
      throw err;
    }
  };
  const deleteTache = async (tacheId) => {
    try {
      const { error } = await supabase.from("taches").delete().eq("idtaches", tacheId);
      if (error) throw error;
      await getTaches();
      addToast({
        title: "Tâche supprimée",
        message: "La tâche a été supprimée avec succès.",
        type: "Success"
      });
      return true;
    } catch (err) {
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de supprimer la tâche",
        type: "Error"
      });
      return false;
    }
  };
  const tachesSorted = computed(() => {
    return [...allTaches.value].sort((a, b) => a.tache.localeCompare(b.tache));
  });
  const tachesByCategorie = computed(() => {
    const grouped = {};
    allTaches.value.forEach((t) => {
      const cat = t.categorie || "Sans catégorie";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(t);
    });
    return grouped;
  });
  return {
    taches: allTaches,
    tachesSorted,
    tachesByCategorie,
    getTaches,
    createTache,
    updateTache,
    deleteTache,
    updateH00Previsions
  };
};

export { useTaches as u };
//# sourceMappingURL=useTaches-FqFKMoCT.mjs.map
