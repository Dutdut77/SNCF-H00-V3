// Refresh en cours, partagé entre le middleware, le plugin supabase-sync et le
// retour sur l'onglet : l'IdP SNCF fait tourner le refresh token, deux refresh
// simultanés utiliseraient le même token et le second effacerait les cookies.
// Usage client uniquement.
let pendingRefresh = null

export const useSessionGuard = () => {
  const supabase = useSupabaseClient()

  const refreshSession = async () => {
    try {
      const refreshed = await $fetch('/api/auth/refresh', { credentials: 'include' })

      // /api/auth/refresh répond 200 avec supabaseJwt=null quand le refresh token
      // OIDC est expiré : $fetch ne throw pas
      if (!refreshed?.supabaseJwt) return false

      const { error } = await supabase.auth.setSession({
        access_token: refreshed.supabaseJwt,
        refresh_token: 'dummy' // Le refresh token OIDC est dans un cookie HttpOnly
      })
      if (error) {
        console.error('[sessionGuard] setSession échoué:', error)
        return false
      }
      return true
    } catch (err) {
      console.error('[sessionGuard] Erreur refresh:', err)
      return false
    }
  }

  /**
   * Garantit une session Supabase valide côté client.
   * Sans session, le client interroge la base en `anon` : le RLS renvoie des
   * listes vides au lieu d'erreurs, et les pages s'affichent sans données.
   * @returns {Promise<boolean>} false si la session n'a pas pu être rétablie
   */
  const ensureSession = async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession()
    if (session) return true

    if (!pendingRefresh) {
      pendingRefresh = refreshSession().finally(() => {
        pendingRefresh = null
      })
    }
    return pendingRefresh
  }

  return { ensureSession }
}
