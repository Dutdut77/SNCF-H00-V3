// plugins/supabase-sync.client.js
export default defineNuxtPlugin(() => {
  const supabase = useSupabaseClient()

  // Vérifier et synchroniser la session toutes les 5 minutes
  const syncInterval = setInterval(
    async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session) {
        console.log('[supabase-sync] Session expirée, tentative de refresh...')
        try {
          const refreshed = await $fetch('/api/auth/refresh', {
            credentials: 'include'
          })

          if (refreshed?.supabaseJwt) {
            await supabase.auth.setSession({
              access_token: refreshed.supabaseJwt,
              refresh_token: 'dummy'
            })
            console.log('[supabase-sync] Session Supabase rafraîchie avec succès')
          }
        } catch (err) {
          console.error('[supabase-sync] Erreur refresh:', err)
        }
      }
    },
    5 * 60 * 1000
  ) // Toutes les 5 minutes

  // Nettoyer l'intervalle à la destruction
  if (import.meta.client) {
    window.addEventListener('beforeunload', () => {
      clearInterval(syncInterval)
    })
  }
})
