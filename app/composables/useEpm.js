export const useEpm = () => {
  const client = useSupabaseClient()
  const { addToast } = useToast()

  // Map chantier_id -> { VOIE: row|undefined, SES: row|undefined }
  const epmByChantier = useState('epmByChantier', () => ({}))

  // Upsert « merge » : ne met à jour QUE les champs fournis.
  // Généralités n'envoie que les dates/liens EPM & EPTx, le dashboard EPM
  // n'envoie que les champs EPM + réserves → pas d'écrasement mutuel.
  const EPM_FIELDS = [
    'epm_date',
    'epm_lien',
    'eptx_date',
    'eptx_lien',
    'reserves_total',
    'reserves_realisees',
    'reserves_documents'
  ]

  const getEpmByChantier = async (chantierId) => {
    try {
      const { data, error } = await client.from('chantier_epm').select('*').eq('chantier_id', chantierId)
      if (error) throw error

      const result = { VOIE: null, SES: null }
      for (const row of data || []) {
        result[row.metier] = row
      }
      return result
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: 'Impossible de charger les données EPM',
        type: 'Error'
      })
      return { VOIE: null, SES: null }
    }
  }

  const getEpmForChantiers = async (chantierIds) => {
    try {
      const { data, error } = await client.from('chantier_epm').select('*').in('chantier_id', chantierIds)
      if (error) throw error

      const map = {}
      for (const row of data || []) {
        if (!map[row.chantier_id]) map[row.chantier_id] = {}
        map[row.chantier_id][row.metier] = row
      }
      epmByChantier.value = map
      return map
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: 'Impossible de charger les données EPM',
        type: 'Error'
      })
      return {}
    }
  }

  const upsertEpm = async (chantierId, metier, fields, { silent = false } = {}) => {
    try {
      const payload = { chantier_id: chantierId, metier, updated_at: new Date().toISOString() }
      for (const key of EPM_FIELDS) {
        if (key in fields) payload[key] = fields[key] ?? null
      }

      const { data, error } = await client
        .from('chantier_epm')
        .upsert(payload, { onConflict: 'chantier_id,metier' })
        .select()
        .single()

      if (error) throw error

      epmByChantier.value = {
        ...epmByChantier.value,
        [chantierId]: { ...(epmByChantier.value[chantierId] || {}), [metier]: data }
      }

      if (!silent) {
        addToast({
          title: 'Succès',
          message: 'Données EPM mises à jour',
          type: 'Success'
        })
      }

      return data
    } catch (err) {
      addToast({
        title: 'Erreur',
        message: err.message,
        type: 'Error'
      })
      return null
    }
  }

  return {
    epmByChantier,
    getEpmByChantier,
    getEpmForChantiers,
    upsertEpm
  }
}
