// plugins/supabase-sync.client.js
// Maintient la session Supabase d'une page restée ouverte : vérification toutes les
// 5 minutes et au retour sur l'onglet. Si la session ne peut pas être rétablie, on
// renvoie vers login plutôt que de laisser des pages vides (RLS en anon).
export default defineNuxtPlugin(() => {
  const user = useAuthUser()
  const router = useRouter()
  const { ensureSession } = useSessionGuard()

  const checkSession = async () => {
    // Pas connecté (page login, avant le premier chargement) : rien à maintenir
    if (!user.value) return

    if (await ensureSession()) return

    console.warn('[supabase-sync] Session non rétablie, redirection login')
    user.value = null
    const current = router.currentRoute.value
    if (current.meta.requiresAuth) {
      await navigateTo(`/login?redirect=${encodeURIComponent(current.fullPath)}`)
    }
  }

  const syncInterval = setInterval(checkSession, 5 * 60 * 1000)

  // Au retour sur un onglet laissé ouvert (veille, autre application…)
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') checkSession()
  }
  document.addEventListener('visibilitychange', onVisibilityChange)

  window.addEventListener('beforeunload', () => {
    clearInterval(syncInterval)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })
})
