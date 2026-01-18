export const useAbsences = () => {
  const supabase = useSupabaseClient()
  const { addToast } = useToast()

  // State partagé pour toutes les absences
  const allAbsences = useState('allAbsences', () => [])

  // Types d'absences disponibles
  const absenceTypes = [
    { id: 'conges', label: 'Congés', icon: 'lucide:palm-tree', color: 'emerald' },
    { id: 'formation', label: 'Formation', icon: 'lucide:graduation-cap', color: 'amber' }
  ]

  // Obtenir les infos d'un type d'absence
  const getAbsenceTypeInfo = (type) => {
    return absenceTypes.find((t) => t.id === type) || absenceTypes[0]
  }

  // Charger toutes les absences
  const getAllAbsences = async () => {
    try {
      const { data, error } = await supabase
        .from('absences')
        .select('*')
        .order('annee_debut', { ascending: true })
        .order('semaine_debut', { ascending: true })

      if (error) throw error
      allAbsences.value = data || []
      return data || []
    } catch (err) {
      console.error('Erreur lors du chargement des absences:', err)
      allAbsences.value = []
      return []
    }
  }

  // Récupérer les absences d'un utilisateur
  const getAbsencesByUser = (userEmail) => {
    if (!allAbsences.value || !userEmail) return []
    return allAbsences.value.filter(
      (a) => a.user_email?.toLowerCase() === userEmail.toLowerCase()
    )
  }

  // Récupérer les absences d'un utilisateur pour une année donnée
  const getAbsencesByUserAndYear = (userEmail, year) => {
    if (!allAbsences.value || !userEmail) return []
    return allAbsences.value.filter((a) => {
      const emailMatch = a.user_email?.toLowerCase() === userEmail.toLowerCase()
      const yearMatch = a.annee_debut === year || a.annee_fin === year
      return emailMatch && yearMatch
    })
  }

  // Vérifier si une semaine est concernée par une absence
  const isWeekInAbsence = (weekNumber, year, userEmail, absenceType = null) => {
    const absences = getAbsencesByUser(userEmail)
    
    return absences.some((absence) => {
      // Filtrer par type si spécifié
      if (absenceType && absence.type !== absenceType) return false

      // Créer une date de référence pour la semaine/année
      const weekStart = getWeekStartDate(weekNumber, year)
      const absenceStart = getWeekStartDate(absence.semaine_debut, absence.annee_debut)
      const absenceEnd = getWeekEndDate(absence.semaine_fin, absence.annee_fin)

      return weekStart >= absenceStart && weekStart <= absenceEnd
    })
  }

  // Obtenir l'absence pour une semaine donnée
  const getAbsenceForWeek = (weekNumber, year, userEmail) => {
    const absences = getAbsencesByUser(userEmail)
    
    return absences.find((absence) => {
      const weekStart = getWeekStartDate(weekNumber, year)
      const absenceStart = getWeekStartDate(absence.semaine_debut, absence.annee_debut)
      const absenceEnd = getWeekEndDate(absence.semaine_fin, absence.annee_fin)

      return weekStart >= absenceStart && weekStart <= absenceEnd
    })
  }

  // Utilitaire : obtenir la date de début d'une semaine ISO
  const getWeekStartDate = (week, year) => {
    const jan4 = new Date(year, 0, 4)
    const jan4Day = jan4.getDay() || 7
    const mondayWeek1 = new Date(jan4)
    mondayWeek1.setDate(jan4.getDate() - (jan4Day - 1))

    const monday = new Date(mondayWeek1)
    monday.setDate(mondayWeek1.getDate() + (week - 1) * 7)
    monday.setHours(0, 0, 0, 0)

    return monday
  }

  // Utilitaire : obtenir la date de fin d'une semaine ISO (dimanche)
  const getWeekEndDate = (week, year) => {
    const monday = getWeekStartDate(week, year)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    sunday.setHours(23, 59, 59, 999)
    return sunday
  }

  // Ajouter une absence
  const addAbsence = async (userEmail, type, semaineDebut, anneeDebut, semaineFin, anneeFin, commentaire = null) => {
    try {
      const { data, error } = await supabase
        .from('absences')
        .insert({
          user_email: userEmail.toLowerCase(),
          type: type,
          semaine_debut: semaineDebut,
          annee_debut: anneeDebut,
          semaine_fin: semaineFin,
          annee_fin: anneeFin,
          commentaire: commentaire
        })
        .select()
        .single()

      if (error) throw error

      const typeInfo = getAbsenceTypeInfo(type)
      addToast({
        title: `${typeInfo.label} ajouté${type === 'formation' ? 'e' : 's'}`,
        message: `S${semaineDebut}/${anneeDebut} - S${semaineFin}/${anneeFin}`,
        type: 'Success'
      })

      // Recharger les absences
      await getAllAbsences()

      return data
    } catch (err) {
      console.error("Erreur lors de l'ajout de l'absence:", err)
      addToast({
        title: 'Erreur',
        message: err.message || "Impossible d'ajouter l'absence",
        type: 'Error'
      })
      return null
    }
  }

  // Mettre à jour une absence
  const updateAbsence = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('absences')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      addToast({
        title: 'Absence modifiée',
        message: 'Les modifications ont été enregistrées',
        type: 'Success'
      })

      await getAllAbsences()

      return data
    } catch (err) {
      console.error("Erreur lors de la modification de l'absence:", err)
      addToast({
        title: 'Erreur',
        message: err.message || "Impossible de modifier l'absence",
        type: 'Error'
      })
      return null
    }
  }

  // Supprimer une absence
  const deleteAbsence = async (id) => {
    try {
      const { error } = await supabase
        .from('absences')
        .delete()
        .eq('id', id)

      if (error) throw error

      addToast({
        title: 'Absence supprimée',
        message: "L'absence a été supprimée avec succès",
        type: 'Success'
      })

      await getAllAbsences()

      return true
    } catch (err) {
      console.error("Erreur lors de la suppression de l'absence:", err)
      addToast({
        title: 'Erreur',
        message: err.message || "Impossible de supprimer l'absence",
        type: 'Error'
      })
      return false
    }
  }

  return {
    allAbsences,
    absenceTypes,
    getAllAbsences,
    getAbsencesByUser,
    getAbsencesByUserAndYear,
    isWeekInAbsence,
    getAbsenceForWeek,
    getAbsenceTypeInfo,
    addAbsence,
    updateAbsence,
    deleteAbsence,
    getWeekStartDate,
    getWeekEndDate
  }
}

