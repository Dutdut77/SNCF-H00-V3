export const useTimeline = () => {
  const supabase = useSupabaseClient()
  const { addToast } = useToast()

  // State partagé pour tous les weekends
  const allWeekends = useState('allWeekends', () => [])

  // Charger tous les weekends de tous les chantiers
  const getAllWeekends = async () => {
    try {
      const { data, error } = await supabase
        .from('timeline')
        .select('*')
        .eq('type', 'weekend')
        .order('annee_debut', { ascending: true })
        .order('semaine_debut', { ascending: true })

      if (error) throw error
      allWeekends.value = data || []
      return data || []
    } catch (err) {
      console.error('Erreur lors du chargement des weekends:', err)
      allWeekends.value = []
      return []
    }
  }

  // Vérifier si une semaine est le DÉBUT d'un weekend pour un chantier donné
  // (la barre s'affiche sur la bordure droite de la semaine de début)
  const isWeekendForChantier = (weekNumber, year, chantierId) => {
    return allWeekends.value.some((weekend) => {
      if (weekend.chantier_id !== chantierId) return false

      const debutSemaine = weekend.semaine_debut
      const debutAnnee = weekend.annee_debut

      // On affiche la barre uniquement sur la semaine de début du weekend
      return weekNumber === debutSemaine && year === debutAnnee
    })
  }

  // Récupérer tous les éléments de timeline d'un chantier
  const getTimelineByChantier = async (chantierId) => {
    try {
      const { data, error } = await supabase
        .from('timeline')
        .select('*')
        .eq('chantier_id', chantierId)
        .order('annee_debut', { ascending: true })
        .order('semaine_debut', { ascending: true })

      if (error) {
        console.error('Erreur Supabase:', error)
        throw error
      }

      return data || []
    } catch (err) {
      console.error('Erreur lors du chargement de la timeline:', err)
      addToast({
        title: 'Erreur',
        message: err.message || 'Impossible de charger la timeline',
        type: 'Error'
      })
      return []
    }
  }

  // Récupérer les week-ends d'un chantier
  const getWeekendsByChantier = async (chantierId) => {
    try {
      const { data, error } = await supabase
        .from('timeline')
        .select('*')
        .eq('chantier_id', chantierId)
        .eq('type', 'weekend')
        .order('annee_debut', { ascending: true })
        .order('semaine_debut', { ascending: true })

      if (error) {
        console.error('Erreur Supabase:', error)
        throw error
      }

      return data || []
    } catch (err) {
      console.error('Erreur lors du chargement des week-ends:', err)
      addToast({
        title: 'Erreur',
        message: err.message || 'Impossible de charger les week-ends',
        type: 'Error'
      })
      return []
    }
  }

  // Ajouter un élément à la timeline
  const addTimelineItem = async (chantierId, type, semaineDebut, anneeDebut, semaineFin, anneeFin, contenu) => {
    try {
      const { data, error } = await supabase
        .from('timeline')
        .insert({
          chantier_id: chantierId,
          type: type,
          semaine_debut: semaineDebut,
          annee_debut: anneeDebut,
          semaine_fin: semaineFin || null,
          annee_fin: anneeFin || null,
          contenu: contenu
        })
        .select()
        .single()

      if (error) throw error

      addToast({
        title: 'Élément ajouté',
        message: `${type === 'weekend' ? 'Week-end' : 'Élément'} ajouté avec succès`,
        type: 'Success'
      })

      return data
    } catch (err) {
      console.error("Erreur lors de l'ajout:", err)
      addToast({
        title: 'Erreur',
        message: err.message || "Impossible d'ajouter l'élément",
        type: 'Error'
      })
      return null
    }
  }

  // Ajouter un week-end (raccourci)
  const addWeekend = async (chantierId, semaineDebut, anneeDebut, semaineFin, anneeFin) => {
    const contenu = `Week-end S${semaineDebut}/${anneeDebut} - S${semaineFin}/${anneeFin}`
    return addTimelineItem(chantierId, 'weekend', semaineDebut, anneeDebut, semaineFin, anneeFin, contenu)
  }

  // Mettre à jour un élément de timeline
  const updateTimelineItem = async (id, updates) => {
    try {
      const { data, error } = await supabase.from('timeline').update(updates).eq('id', id).select().single()

      if (error) throw error

      addToast({
        title: 'Élément modifié',
        message: 'Modifications enregistrées avec succès',
        type: 'Success'
      })

      return data
    } catch (err) {
      console.error('Erreur lors de la modification:', err)
      addToast({
        title: 'Erreur',
        message: err.message || "Impossible de modifier l'élément",
        type: 'Error'
      })
      return null
    }
  }

  // Supprimer un élément de timeline
  const deleteTimelineItem = async (id) => {
    try {
      const { error } = await supabase.from('timeline').delete().eq('id', id)

      if (error) throw error

      addToast({
        title: 'Élément supprimé',
        message: "L'élément a été supprimé avec succès",
        type: 'Success'
      })

      return true
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      addToast({
        title: 'Erreur',
        message: err.message || "Impossible de supprimer l'élément",
        type: 'Error'
      })
      return false
    }
  }

  // Calculer la position d'une semaine sur la timeline (en pourcentage)
  const getWeekPosition = (semaine, annee, dateStart, dateEnd) => {
    if (!dateStart || !dateEnd) return 50

    const startDate = new Date(dateStart)
    const endDate = new Date(dateEnd)

    // Convertir semaine/année en date (premier jour de la semaine)
    const weekDate = getDateFromWeek(semaine, annee)

    if (weekDate < startDate) return 0
    if (weekDate > endDate) return 100

    const totalDuration = endDate - startDate
    const currentPosition = weekDate - startDate

    return Math.round((currentPosition / totalDuration) * 100)
  }

  // Obtenir la date du premier jour d'une semaine ISO
  const getDateFromWeek = (semaine, annee) => {
    const simple = new Date(annee, 0, 1 + (semaine - 1) * 7)
    const dow = simple.getDay()
    const ISOweekStart = simple
    if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1)
    else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay())
    return ISOweekStart
  }

  // Types de timeline disponibles
  const timelineTypes = [
    { id: 'weekend', label: 'Week-end', icon: 'lucide:calendar-days', color: 'orange' },
    { id: 'jalon', label: 'Jalon', icon: 'lucide:flag', color: 'blue' },
    { id: 'reunion', label: 'Réunion', icon: 'lucide:users', color: 'purple' },
    { id: 'livraison', label: 'Livraison', icon: 'lucide:truck', color: 'green' },
    { id: 'autre', label: 'Autre', icon: 'lucide:circle', color: 'gray' }
  ]

  // Obtenir les infos d'un type
  const getTypeInfo = (type) => {
    return timelineTypes.find((t) => t.id === type) || timelineTypes.find((t) => t.id === 'autre')
  }

  // Remplacer tous les weekends d'un chantier (supprime puis recrée)
  const replaceWeekendsForChantier = async (chantierId, weekends) => {
    try {
      // 1. Supprimer tous les weekends existants pour ce chantier
      const { error: deleteError } = await supabase
        .from('timeline')
        .delete()
        .eq('chantier_id', chantierId)
        .eq('type', 'weekend')

      if (deleteError) throw deleteError

      // 2. Créer les nouveaux weekends
      if (weekends && weekends.length > 0) {
        const entries = weekends.map((w) => ({
          chantier_id: chantierId,
          type: 'weekend',
          semaine_debut: w.debutSemaine,
          annee_debut: w.debutAnnee,
          semaine_fin: w.finSemaine,
          annee_fin: w.finAnnee,
          contenu: `Week-end S${w.debutSemaine}/${w.debutAnnee} - S${w.finSemaine}/${w.finAnnee}`
        }))

        const { error: insertError } = await supabase.from('timeline').insert(entries)

        if (insertError) throw insertError
      }

      // 3. Recharger tous les weekends
      await getAllWeekends()

      return { error: null }
    } catch (err) {
      console.error('Erreur lors du remplacement des weekends:', err)
      addToast({
        title: 'Erreur',
        message: err.message || 'Impossible de mettre à jour les week-ends',
        type: 'Error'
      })
      return { error: err }
    }
  }

  return {
    allWeekends,
    getAllWeekends,
    isWeekendForChantier,
    getTimelineByChantier,
    getWeekendsByChantier,
    addTimelineItem,
    addWeekend,
    updateTimelineItem,
    deleteTimelineItem,
    replaceWeekendsForChantier,
    getWeekPosition,
    getDateFromWeek,
    timelineTypes,
    getTypeInfo
  }
}
