// Identité de l'installation : nom de l'infrapôle et logo (table `application`, ligne unique).
// H00 Travaux est déployée une fois par infrapôle ; un SuperAdmin règle ces valeurs dans
// Paramètres → Application → Identité. Chargée au démarrage par plugins/application.js.
const BUCKET = 'application'
const LOGO_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg' }
const LOGO_MAX_BYTES = 1024 * 1024

export const useApplication = () => {
  const client = useSupabaseClient()
  const { addToast } = useToast()

  const application = useState('application', () => ({ nomEntite: '', logoPath: null, loaded: false }))

  const nomEntite = computed(() => application.value.nomEntite)
  // Fichiers nommés logo-<horodatage> : une nouvelle URL à chaque envoi, pas de cache périmé.
  const logoUrl = computed(() =>
    application.value.logoPath
      ? client.storage.from(BUCKET).getPublicUrl(application.value.logoPath).data.publicUrl
      : null
  )

  const loadApplication = async ({ force = false } = {}) => {
    if (application.value.loaded && !force) return
    const { data, error } = await client.from('application').select('nom_entite, logo_path').eq('id', 1).maybeSingle()

    // Table absente (migration non appliquée) : l'application reste utilisable, sans nom ni logo.
    if (error) console.warn("[useApplication] Identité de l'application indisponible :", error.message)
    application.value = { nomEntite: data?.nom_entite ?? '', logoPath: data?.logo_path ?? null, loaded: true }
  }

  const updateApplication = async (fields) => {
    const { data, error } = await client
      .from('application')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select('nom_entite, logo_path')
      .single()
    if (error) throw error
    application.value = { nomEntite: data.nom_entite, logoPath: data.logo_path, loaded: true }
  }

  const saveNomEntite = async (nom) => {
    try {
      await updateApplication({ nom_entite: nom.trim() })
      addToast({
        title: 'Nom enregistré',
        message: `L'application affiche désormais « ${nom.trim()} ».`,
        type: 'Success'
      })
      return true
    } catch (err) {
      addToast({ title: "Le nom n'a pas été enregistré", message: err.message, type: 'Error' })
      return false
    }
  }

  // Contrôle côté navigateur, en miroir des limites du bucket (type et taille)
  const checkLogoFile = (file) => {
    if (!LOGO_TYPES[file?.type]) return 'Le logo doit être une image PNG ou JPEG.'
    if (file.size > LOGO_MAX_BYTES) return 'Le logo ne doit pas dépasser 1 Mo.'
    return null
  }

  const uploadLogo = async (file) => {
    const invalid = checkLogoFile(file)
    if (invalid) {
      addToast({ title: "Le logo n'a pas été envoyé", message: invalid, type: 'Error' })
      return false
    }
    const previousPath = application.value.logoPath
    const path = `logo-${Date.now()}.${LOGO_TYPES[file.type]}`
    try {
      const { error } = await client.storage
        .from(BUCKET)
        .upload(path, file, { contentType: file.type, cacheControl: '31536000' })
      if (error) throw error
      await updateApplication({ logo_path: path })
      // L'ancien fichier n'est plus référencé : suppression sans bloquer si elle échoue
      if (previousPath) await client.storage.from(BUCKET).remove([previousPath])
      addToast({
        title: 'Logo enregistré',
        message: "Le nouveau logo s'affiche dans toute l'application.",
        type: 'Success'
      })
      return true
    } catch (err) {
      addToast({ title: "Le logo n'a pas été envoyé", message: err.message, type: 'Error' })
      return false
    }
  }

  const removeLogo = async () => {
    const previousPath = application.value.logoPath
    if (!previousPath) return true
    try {
      await updateApplication({ logo_path: null })
      await client.storage.from(BUCKET).remove([previousPath])
      addToast({ title: 'Logo retiré', message: "L'application s'affiche désormais sans logo.", type: 'Success' })
      return true
    } catch (err) {
      addToast({ title: "Le logo n'a pas été retiré", message: err.message, type: 'Error' })
      return false
    }
  }

  return { application, nomEntite, logoUrl, loadApplication, saveNomEntite, uploadLogo, removeLogo }
}
