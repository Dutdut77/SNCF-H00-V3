import { f as useSupabaseClient, a as useToast } from './server.mjs';

const useEtudes = () => {
  const supabase = useSupabaseClient();
  const { addToast } = useToast();
  const getDexByChantier = async (chantierId) => {
    try {
      const { data, error } = await supabase.from("chantier_dex").select("*").eq("id_chantier", chantierId).order("indice", { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Erreur lors du chargement des DEX:", err);
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de charger les documents d'exécution",
        type: "Error"
      });
      return [];
    }
  };
  const addDex = async (chantierId, dexData) => {
    try {
      const { data, error } = await supabase.from("chantier_dex").insert({
        id_chantier: chantierId,
        indice: dexData.indice,
        titre: dexData.titre || null,
        date_prevu: dexData.date_prevu || [],
        date_mes: dexData.date_mes || null,
        date_demande: dexData.date_demande || null,
        date_recu: dexData.date_recu || null,
        observation: dexData.observation || null
      }).select().single();
      if (error) throw error;
      addToast({
        title: "Document ajouté",
        message: "Document d'exécution ajouté avec succès",
        type: "Success"
      });
      return data;
    } catch (err) {
      console.error("Erreur lors de l'ajout du DEX:", err);
      addToast({
        title: "Erreur",
        message: err.message || "Impossible d'ajouter le document",
        type: "Error"
      });
      return null;
    }
  };
  const updateDex = async (id, updates) => {
    try {
      const { data, error } = await supabase.from("chantier_dex").update({
        ...updates,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", id).select().single();
      if (error) throw error;
      addToast({
        title: "Document modifié",
        message: "Modifications enregistrées avec succès",
        type: "Success"
      });
      return data;
    } catch (err) {
      console.error("Erreur lors de la modification du DEX:", err);
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de modifier le document",
        type: "Error"
      });
      return null;
    }
  };
  const deleteDex = async (id) => {
    try {
      const { error } = await supabase.from("chantier_dex").delete().eq("id", id);
      if (error) throw error;
      addToast({
        title: "Document supprimé",
        message: "Le document a été supprimé avec succès",
        type: "Success"
      });
      return true;
    } catch (err) {
      console.error("Erreur lors de la suppression du DEX:", err);
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de supprimer le document",
        type: "Error"
      });
      return false;
    }
  };
  const getPtByChantier = async (chantierId) => {
    try {
      const { data, error } = await supabase.from("chantier_pt").select("*").eq("id_chantier", chantierId).order("indice", { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Erreur lors du chargement des PT:", err);
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de charger les plans techniques",
        type: "Error"
      });
      return [];
    }
  };
  const addPt = async (chantierId, ptData) => {
    try {
      const { data, error } = await supabase.from("chantier_pt").insert({
        id_chantier: chantierId,
        indice: ptData.indice,
        titre: ptData.titre || null,
        date_prevu: ptData.date_prevu || [],
        date_mes: ptData.date_mes || null,
        date_recu: ptData.date_recu || null,
        observation: ptData.observation || null
      }).select().single();
      if (error) throw error;
      addToast({
        title: "Plan ajouté",
        message: "Plan technique ajouté avec succès",
        type: "Success"
      });
      return data;
    } catch (err) {
      console.error("Erreur lors de l'ajout du PT:", err);
      addToast({
        title: "Erreur",
        message: err.message || "Impossible d'ajouter le plan",
        type: "Error"
      });
      return null;
    }
  };
  const updatePt = async (id, updates) => {
    try {
      const { data, error } = await supabase.from("chantier_pt").update({
        ...updates,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", id).select().single();
      if (error) throw error;
      addToast({
        title: "Plan modifié",
        message: "Modifications enregistrées avec succès",
        type: "Success"
      });
      return data;
    } catch (err) {
      console.error("Erreur lors de la modification du PT:", err);
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de modifier le plan",
        type: "Error"
      });
      return null;
    }
  };
  const deletePt = async (id) => {
    try {
      const { error } = await supabase.from("chantier_pt").delete().eq("id", id);
      if (error) throw error;
      addToast({
        title: "Plan supprimé",
        message: "Le plan a été supprimé avec succès",
        type: "Success"
      });
      return true;
    } catch (err) {
      console.error("Erreur lors de la suppression du PT:", err);
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de supprimer le plan",
        type: "Error"
      });
      return false;
    }
  };
  const getDocumentStatus = (doc, isDex = false) => {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    let dateRc = null;
    if (doc.date_mes) {
      dateRc = new Date(doc.date_mes);
      dateRc.setMonth(dateRc.getMonth() - 2);
      dateRc.setHours(0, 0, 0, 0);
    }
    let lastDatePrevu = null;
    if (doc.date_prevu && doc.date_prevu.length > 0) {
      const sortedDates = [...doc.date_prevu].sort((a, b) => new Date(b) - new Date(a));
      lastDatePrevu = new Date(sortedDates[0]);
      lastDatePrevu.setHours(0, 0, 0, 0);
    }
    const calculateRawStatus = (referenceDate) => {
      const refDate = new Date(referenceDate);
      refDate.setHours(0, 0, 0, 0);
      if (isDex && dateRc && refDate >= dateRc) {
        return {
          status: "overdue",
          label: "En retard",
          color: "red",
          icon: "lucide:alert-circle",
          priority: 3
        };
      }
      if (lastDatePrevu && refDate > lastDatePrevu) {
        return {
          status: "attention",
          label: "Attention",
          color: "amber",
          icon: "lucide:alert-triangle",
          priority: 2
        };
      }
      return {
        status: "pending",
        label: "En attente",
        color: "gray",
        icon: "lucide:clock",
        priority: 1
      };
    };
    if (doc.date_recu) {
      const statusAtReception = calculateRawStatus(doc.date_recu);
      return {
        status: "received",
        label: "Reçu",
        color: "emerald",
        icon: "lucide:check-circle-2",
        priority: 0,
        previousStatus: statusAtReception
      };
    }
    return calculateRawStatus(today);
  };
  const getPtStatus = (doc) => {
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    let lastDatePrevu = null;
    if (doc.date_prevu && doc.date_prevu.length > 0) {
      const sortedDates = [...doc.date_prevu].sort((a, b) => new Date(b) - new Date(a));
      lastDatePrevu = new Date(sortedDates[0]);
      lastDatePrevu.setHours(0, 0, 0, 0);
    }
    if (doc.date_recu) {
      const receptionDate = new Date(doc.date_recu);
      receptionDate.setHours(0, 0, 0, 0);
      let previousStatus = {
        status: "pending",
        label: "En attente",
        color: "gray",
        icon: "lucide:clock"
      };
      if (lastDatePrevu && receptionDate > lastDatePrevu) {
        previousStatus = {
          status: "overdue",
          label: "En retard",
          color: "red",
          icon: "lucide:alert-circle"
        };
      }
      return {
        status: "received",
        label: "Reçu",
        color: "emerald",
        icon: "lucide:check-circle-2",
        priority: 0,
        previousStatus
      };
    }
    if (doc.date_mes) {
      const dateMes = new Date(doc.date_mes);
      dateMes.setHours(0, 0, 0, 0);
      if (today > dateMes) {
        return {
          status: "overdue",
          label: "En retard",
          color: "red",
          icon: "lucide:alert-circle",
          priority: 3
        };
      }
    }
    if (lastDatePrevu && today > lastDatePrevu) {
      return {
        status: "attention",
        label: "Attention",
        color: "amber",
        icon: "lucide:alert-triangle",
        priority: 2
      };
    }
    return {
      status: "pending",
      label: "En attente",
      color: "gray",
      icon: "lucide:clock",
      priority: 1
    };
  };
  const getDateRc = (dateMes) => {
    if (!dateMes) return null;
    const date = new Date(dateMes);
    date.setMonth(date.getMonth() - 2);
    return date;
  };
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit"
    });
  };
  const formatDateFull = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };
  const getDaysRemaining = (dateStr) => {
    if (!dateStr) return null;
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);
    return Math.ceil((targetDate - today) / (1e3 * 60 * 60 * 24));
  };
  return {
    // DEX
    getDexByChantier,
    addDex,
    updateDex,
    deleteDex,
    // PT
    getPtByChantier,
    addPt,
    updatePt,
    deletePt,
    // Utilitaires
    getDocumentStatus,
    getPtStatus,
    getDateRc,
    formatDate,
    formatDateFull,
    getDaysRemaining
  };
};
const useCommentaires = () => {
  const client = useSupabaseClient();
  const { addToast } = useToast();
  const getCommentaire = async (chantierId, type) => {
    try {
      const { data, error } = await client.from("commentaires").select("*").eq("chantier_id", chantierId).eq("type", type).single();
      if (error) {
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }
      return data;
    } catch (err) {
      console.error("Erreur lors de la récupération du commentaire:", err);
      if (err.code !== "PGRST116") {
        addToast({
          title: "Erreur",
          message: err.message || "Impossible de récupérer le commentaire",
          type: "Error"
        });
      }
      return null;
    }
  };
  const saveCommentaire = async (chantierId, type, content) => {
    try {
      const existing = await getCommentaire(chantierId, type);
      let result;
      if (existing) {
        result = await client.from("commentaires").update({
          content,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }).eq("id", existing.id).select().single();
      } else {
        result = await client.from("commentaires").insert({
          chantier_id: chantierId,
          type,
          content
        }).select().single();
      }
      if (result.error) throw result.error;
      return result.data;
    } catch (err) {
      console.error("Erreur lors de la sauvegarde du commentaire:", err);
      addToast({
        title: "Erreur",
        message: err.message || "Impossible de sauvegarder le commentaire",
        type: "Error"
      });
      throw err;
    }
  };
  return {
    getCommentaire,
    saveCommentaire
  };
};

export { useCommentaires as a, useEtudes as u };
//# sourceMappingURL=useCommentaires-BS9ADy-v.mjs.map
