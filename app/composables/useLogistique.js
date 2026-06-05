export const useLogistique = () => {
  const supabase = useSupabaseClient()
  const { addToast } = useToast()

  // Map chantier_id -> equipements (jsonb)
  const logistiqueByChantier = useState('logistiqueByChantier', () => ({}))

  // Récupère le suivi logistique pour une liste de chantiers et alimente le state local.
  const getLogistiqueByChantierIds = async (chantierIds) => {
    try {
      if (!Array.isArray(chantierIds) || chantierIds.length === 0) {
        logistiqueByChantier.value = {}
        return
      }

      const { data, error } = await supabase
        .from('chantier_logistique')
        .select('chantier_id, equipements')
        .in('chantier_id', chantierIds)

      if (error) throw error

      const map = {}
      ;(data ?? []).forEach((row) => {
        map[row.chantier_id] = row.equipements || {}
      })
      logistiqueByChantier.value = map
    } catch (err) {
      console.error('Erreur lors du chargement de la logistique:', err)
      logistiqueByChantier.value = {}
      addToast({
        title: 'Problème lors du chargement de la logistique',
        message: err.message || "La table chantier_logistique n'existe peut-être pas encore.",
        type: 'Error'
      })
    }
  }

  // Récupère le suivi logistique d'UN chantier (renvoie l'objet equipements, {} si absent).
  const getLogistiqueByChantier = async (chantierId) => {
    try {
      const { data, error } = await supabase
        .from('chantier_logistique')
        .select('equipements')
        .eq('chantier_id', chantierId)
        .maybeSingle()

      if (error) throw error
      return data?.equipements || {}
    } catch (err) {
      console.error('Erreur lors du chargement de la logistique:', err)
      addToast({
        title: 'Problème lors du chargement de la logistique',
        message: err.message || "La table chantier_logistique n'existe peut-être pas encore.",
        type: 'Error'
      })
      return {}
    }
  }

  // Crée/met à jour la ligne logistique d'un chantier (upsert sur la PK chantier_id).
  const upsertLogistique = async (chantierId, equipements) => {
    try {
      const { data, error } = await supabase
        .from('chantier_logistique')
        .upsert(
          { chantier_id: chantierId, equipements, updated_at: new Date().toISOString() },
          { onConflict: 'chantier_id' }
        )
        .select('chantier_id, equipements')
        .single()

      if (error) throw error

      // Maj du state local (immutabilité pour la réactivité)
      logistiqueByChantier.value = {
        ...logistiqueByChantier.value,
        [chantierId]: data?.equipements || equipements
      }

      addToast({
        title: 'Logistique enregistrée',
        message: 'Le suivi logistique a été mis à jour.',
        type: 'Success'
      })

      return { data, error: null }
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de la logistique:", err)
      addToast({
        title: 'Erreur',
        message: err.message || "Impossible d'enregistrer la logistique",
        type: 'Error'
      })
      return { data: null, error: err }
    }
  }

  return {
    logistiqueByChantier,
    getLogistiqueByChantierIds,
    getLogistiqueByChantier,
    upsertLogistique
  }
}
