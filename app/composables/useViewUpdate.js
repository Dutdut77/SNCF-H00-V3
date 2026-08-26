import { APP_VERSION, releasesSince } from '~/utils/changelog'

// Cache local : évite le flash du modal au chargement (avant la réponse Supabase)
// et évite de re-solliciter l'utilisateur si l'écriture en base a échoué.
const STORAGE_KEY = 'h00:lastSeenVersion'

const readLocalVersion = () => {
  if (!import.meta.client) return null
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

const writeLocalVersion = (version) => {
  if (!import.meta.client) return
  try {
    window.localStorage.setItem(STORAGE_KEY, version)
  } catch {
    /* mode privé / quota : le cache est optionnel, la BDD fait foi */
  }
}

/** Des deux versions, celle qui laisse le moins de nouveautés en attente. */
const mostAdvanced = (a, b) => (releasesSince(a).length <= releasesSince(b).length ? a : b)

export const useUpdate = () => {
  const client = useSupabaseClient()

  // Dernière version validée par l'utilisateur (null = jamais vue)
  const lastSeenVersion = useState('updateLastSeenVersion', () => null)
  // La vérification en base a-t-elle abouti ? (on n'affiche rien avant)
  const updateChecked = useState('updateChecked', () => false)
  // Modal ouvert volontairement depuis le lien « Quoi de neuf ? » du footer
  const manuallyOpened = useState('updateManuallyOpened', () => false)

  /** Nouveautés que l'utilisateur n'a pas encore validées. */
  const pendingReleases = computed(() => releasesSince(lastSeenVersion.value))

  /** Le modal doit-il s'ouvrir tout seul ? */
  const shouldShowUpdate = computed(() => updateChecked.value && pendingReleases.value.length > 0)

  /** Visibilité effective du modal (automatique ou ouverture manuelle). */
  const isUpdateVisible = computed(() => manuallyOpened.value || shouldShowUpdate.value)

  /**
   * Récupère la version validée par l'utilisateur.
   * @param {string} email - Email de l'utilisateur
   */
  const checkUserViewedUpdate = async (email) => {
    // 1. Cache local d'abord : affichage immédiat et cohérent, sans attente réseau.
    const cached = readLocalVersion()
    if (cached) lastSeenVersion.value = cached

    if (!email) {
      updateChecked.value = true
      return
    }

    try {
      const { data, error } = await client
        .from('viewupdate')
        .select('last_seen_version')
        .eq('user_email', email)
        .maybeSingle()

      if (error) throw error

      // On retient la plus avancée des deux versions (BDD / cache local) : si une
      // écriture précédente a échoué, la BDD est en retard sur ce que
      // l'utilisateur a réellement lu — inutile de lui ré-afficher le modal.
      lastSeenVersion.value = mostAdvanced(data?.last_seen_version ?? null, cached)
    } catch (err) {
      console.error('[useUpdate] Erreur lors de la vérification:', err.message)
      // En cas d'échec réseau on s'en tient au cache local : pas de modal parasite.
    } finally {
      updateChecked.value = true
    }
  }

  /**
   * Marque la version courante comme vue pour l'utilisateur.
   * @param {string} email - Email de l'utilisateur
   */
  const markUpdateAsViewed = async (email) => {
    const wasManualOnly = manuallyOpened.value && pendingReleases.value.length === 0

    // Fermeture optimiste : l'utilisateur a cliqué, le modal se ferme tout de suite.
    manuallyOpened.value = false

    // Consultation manuelle d'une version déjà validée → rien à réécrire.
    if (wasManualOnly) return

    lastSeenVersion.value = APP_VERSION
    writeLocalVersion(APP_VERSION)

    if (!email) return

    try {
      const { error } = await client
        .from('viewupdate')
        .upsert({ user_email: email, last_seen_version: APP_VERSION, viewed_at: new Date().toISOString() }, { onConflict: 'user_email' })

      if (error) throw error
    } catch (err) {
      console.error("[useUpdate] Erreur lors de l'enregistrement:", err.message)
      // Le cache local prend le relais : le modal ne réapparaîtra pas en boucle.
    }
  }

  /** Ouvre le modal à la demande (lien « Quoi de neuf ? » du footer). */
  const showUpdateModal = () => {
    manuallyOpened.value = true
  }

  return {
    checkUserViewedUpdate,
    markUpdateAsViewed,
    showUpdateModal,
    isUpdateVisible,
    pendingReleases,
    lastSeenVersion
  }
}
