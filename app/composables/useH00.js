import sound from '@/assets/sounds/idee.mp3'
import sound2 from '@/assets/sounds/pet.mp3'
import sound3 from '@/assets/sounds/batterie.mp3'
export const useH00 = () => {
  const supabase = useSupabaseClient()
  const { addToast } = useToast()
  const user = useAuthUser()
  const allH00Taches = useState('allH00Taches', () => [])

  // Fonction pour créer plusieurs entrées h00 en une seule fois
  const createH00Entries = async (entries) => {
    try {
      if (!entries || entries.length === 0) {
        return { data: [], error: null }
      }

      const { data, error } = await supabase.from('h00').insert(entries).select()

      if (error) throw error

      return { data, error: null }
    } catch (err) {
      console.error('Erreur lors de la création des entrées h00:', err)
      addToast({
        title: 'Problème lors de la création des entrées h00',
        message: err.message,
        type: 'Error'
      })
      return { data: null, error: err }
    }
  }

  // Fonction pour récupérer les entrées h00 d'un chantier
  const getH00ByChantier = async (chantierId) => {
    try {
      const { data, error } = await supabase
        .from('h00')
        .select('*, taches(*), categories(*), chantiers(*)')
        .eq('chantier_id', chantierId)
        .order('prevision', { ascending: true })
        .order('id', { ascending: true })

      if (error) throw error
      allH00Taches.value = data
      return { data, error: null }
    } catch (err) {
      console.error('Erreur lors de la récupération des entrées h00:', err)
      addToast({
        title: 'Problème lors de la récupération des entrées h00',
        message: err.message,
        type: 'Error'
      })
      return { data: null, error: err }
    }
  }

  const getFirstDayOfMonthPlus2 = () => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth() + 2, 1).toISOString().split('T')[0] // YYYY-MM-DD
  }

  // Fonction pour récupérer les entrées h00 de plusieurs chantiers non cloturées et avant la date limite
  const getH00ByChantierArray = async (chantierIds) => {
    const limitDate = getFirstDayOfMonthPlus2()

    try {
      const { data, error } = await supabase
        .from('h00')
        .select('*, taches(*), categories(*), chantiers(*)')
        .in('chantier_id', chantierIds)
        .lt('status', 2)
        .lt('prevision', limitDate)

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      console.error('Erreur lors de la récupération des entrées h00:', err)
      addToast({
        title: 'Problème lors de la récupération des entrées h00',
        message: err.message,
        type: 'Error'
      })
      return { data: null, error: err }
    }
  }

  // Fonction pour récupérer les entrées h00 de plusieurs chantiers non cloturées et avant la date limite
  const getH00AlertesByChantierArray = async (chantierIds) => {
    try {
      const { data, error } = await supabase
        .from('h00')
        .select('*, taches(*), categories(*), chantiers(*)')
        .in('chantier_id', chantierIds)
        .eq('alerte', true)

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      console.error('Erreur lors de la récupération des entrées h00:', err)
      addToast({
        title: 'Problème lors de la récupération des entrées h00',
        message: err.message,
        type: 'Error'
      })
      return { data: null, error: err }
    }
  }

  // Fonction pour récupérer les entrées h00 de plusieurs chantiers non cloturées et avant la date limite
  const getH00Rp1ByChantierArray = async (chantierIds, tachesIds) => {
    try {
      const { data, error } = await supabase
        .from('h00')
        .select('*, taches(*), categories(*), chantiers(*)')
        .in('chantier_id', chantierIds)
        .in('tache_id', tachesIds)

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      console.error('Erreur lors de la récupération des entrées h00:', err)
      addToast({
        title: 'Problème lors de la récupération des entrées h00',
        message: err.message,
        type: 'Error'
      })
      return { data: null, error: err }
    }
  }

  // Fonction pour récupérer toutes les entrées h00 de plusieurs chantiers
  const getAllH00ByChantierArray = async (chantierIds) => {
    try {
      const { data, error } = await supabase
        .from('h00')
        .select('*, taches(*), categories(*), chantiers(*)')
        .in('chantier_id', chantierIds)

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      console.error('Erreur lors de la récupération des entrées h00:', err)
      addToast({
        title: 'Problème lors de la récupération des entrées h00',
        message: err.message,
        type: 'Error'
      })
      return { data: null, error: err }
    }
  }

  // Fonction pour mettre à jour une entrée h00
  // silent: si true, n'affiche pas de toast (utile pour les mises à jour en masse)
  const updateH00Entry = async (id, updates, silent = false) => {
    try {
      const { data, error } = await supabase.from('h00').update(updates).eq('id', id).select().single()

      if (error) throw error

      if (!silent) {
        addToast({
          title: 'Entrée mise à jour',
          message: 'La tâche a été mise à jour avec succès.',
          type: 'Success'
        })
        if (updates.status === 2 && user.value.email === 'denis.chabassier@reseau.sncf.fr') {
          const audio = new Audio(sound3)
          audio.play()
        } else if (updates.status === 2) {
          const audio = new Audio(sound)
          audio.play()
        }
      }

      return { data, error: null }
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'entrée h00:", err)
      if (!silent) {
        addToast({
          title: 'Problème lors de la mise à jour',
          message: err.message,
          type: 'Error'
        })
      }
      return { data: null, error: err }
    }
  }

  // Mise à jour de la clôture d'un SEUL profil (cloture_profil) + recalcul de l'agrégat global.
  // h00Row : la ligne h00 courante (doit contenir cloture_profil) ; tacheProfil : taches.tache_profil.
  // slotPatch : ex. { status:2, realisation, commentaire } ou { non_concerne:true }.
  const updateH00ClotureProfil = async (h00Row, profilId, slotPatch, tacheProfil, { silent = false, shared = null } = {}) => {
    try {
      const newCloture = mergeSlot(h00Row?.cloture_profil, profilId, slotPatch)
      const agg = computeAggregate(newCloture, tacheProfil)
      const becameDone = agg.status === 2 && h00Row?.status !== 2

      const payload = { cloture_profil: newCloture, status: agg.status, realisation: agg.realisation }
      // Champs PARTAGÉS (important/alerte) éventuellement mis à jour dans le même appel
      if (shared && typeof shared === 'object') Object.assign(payload, shared)

      const { data, error } = await supabase
        .from('h00')
        .update(payload)
        .eq('id', h00Row.id)
        .select()
        .single()

      if (error) throw error

      // Synchronise l'état partagé (badge navbar, autres vues)
      const idx = allH00Taches.value.findIndex((t) => t.id === h00Row.id)
      if (idx !== -1) allH00Taches.value[idx] = { ...allH00Taches.value[idx], ...data }

      if (!silent) {
        addToast({
          title: 'Clôture mise à jour',
          message: 'Votre part a été enregistrée.',
          type: 'Success'
        })
        if (becameDone && user.value?.email === 'denis.chabassier@reseau.sncf.fr') {
          const audio = new Audio(sound3)
          audio.play()
        } else if (becameDone) {
          const audio = new Audio(sound)
          audio.play()
        }
      }

      return { data, error: null }
    } catch (err) {
      console.error('Erreur lors de la mise à jour de la clôture par profil:', err)
      if (!silent) {
        addToast({
          title: 'Problème lors de la mise à jour',
          message: err.message,
          type: 'Error'
        })
      }
      return { data: null, error: err }
    }
  }

  // Fonction pour supprimer une entrée h00
  const deleteH00Entry = async (id, { silent = false } = {}) => {
    try {
      const { error } = await supabase.from('h00').delete().eq('id', id)

      if (error) throw error

      // Synchronise l'état partagé (badge navbar, autres vues)
      allH00Taches.value = allH00Taches.value.filter((t) => t.id !== id)

      if (!silent) {
        addToast({
          title: 'Entrée supprimée',
          message: "L'entrée h00 a été supprimée avec succès.",
          type: 'Success'
        })
      }

      return { error: null }
    } catch (err) {
      console.error("Erreur lors de la suppression de l'entrée h00:", err)
      if (!silent) {
        addToast({
          title: 'Problème lors de la suppression',
          message: err.message,
          type: 'Error'
        })
      }
      return { error: err }
    }
  }

  // Fonction pour recalculer les prévisions H00 d'un chantier à partir des dates de réalisation et préparation
  const recalculateH00Previsions = async (chantierId, dateRea, allTaches, datePrepa = []) => {
    try {
      if ((!dateRea || dateRea.length === 0) && (!datePrepa || datePrepa.length === 0)) {
        return { error: null, updated: 0 }
      }

      // Trouver la première date de début (réalisation + préparation)
      const startDates = [
        ...(dateRea || []).filter((p) => p.date_start_travaux).map((p) => new Date(p.date_start_travaux)),
        ...(datePrepa || []).filter((p) => p.date_start_prepa).map((p) => new Date(p.date_start_prepa))
      ].sort((a, b) => a - b)

      // Trouver la dernière date de fin (réalisation + préparation)
      const endDates = [
        ...(dateRea || []).filter((p) => p.date_end_travaux).map((p) => new Date(p.date_end_travaux)),
        ...(datePrepa || []).filter((p) => p.date_end_prepa).map((p) => new Date(p.date_end_prepa))
      ].sort((a, b) => b - a)

      if (startDates.length === 0) {
        return { error: null, updated: 0 }
      }

      const earliestDate = startDates[0]
      const latestEndDate = endDates.length > 0 ? endDates[0] : earliestDate

      // Récupérer toutes les entrées H00 existantes pour ce chantier
      const { data: existingH00, error: fetchError } = await supabase
        .from('h00')
        .select('id, tache_id')
        .eq('chantier_id', chantierId)

      if (fetchError) throw fetchError

      // Mettre à jour chaque entrée avec la nouvelle prévision
      let updatedCount = 0
      for (const h00Entry of existingH00 || []) {
        const tache = allTaches.find((t) => t.id === h00Entry.tache_id)
        if (!tache) continue

        const delais = tache.delais || 0
        const optDelais = tache.opt_delais || 0

        // Calculer la date de prévision
        let baseDate
        if (optDelais === 1 && latestEndDate) {
          baseDate = new Date(latestEndDate)
        } else {
          baseDate = new Date(earliestDate)
        }
        baseDate.setDate(baseDate.getDate() - delais)
        const newPrevision = baseDate.toISOString().split('T')[0]

        // Mettre à jour l'entrée
        await supabase.from('h00').update({ prevision: newPrevision }).eq('id', h00Entry.id)

        updatedCount++
      }

      return { error: null, updated: updatedCount }
    } catch (err) {
      console.error('Erreur lors du recalcul des prévisions H00:', err)
      return { error: err, updated: 0 }
    }
  }

  return {
    allH00Taches,
    createH00Entries,
    getH00ByChantier,
    getH00ByChantierArray,
    getAllH00ByChantierArray,
    getH00AlertesByChantierArray,
    getH00Rp1ByChantierArray,
    updateH00Entry,
    updateH00ClotureProfil,
    deleteH00Entry,
    recalculateH00Previsions
  }
}
