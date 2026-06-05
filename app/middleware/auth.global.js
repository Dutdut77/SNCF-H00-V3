export default defineNuxtRouteMiddleware(async (to) => {
  const requiresAuth = to.meta.requiresAuth ?? false
  if (!requiresAuth) return

  const user = useAuthUser()
  const { getOneUser } = useUsers()
  const supabase = useSupabaseClient() // 🆕 Récupérer le client Supabase

  // ✅ Côté client : si l'utilisateur est déjà chargé, vérifier seulement les rôles
  if (import.meta.client && user.value) {
    // 🆕 Vérifier que la session Supabase est toujours valide
    const {
      data: { session }
    } = await supabase.auth.getSession()

    if (!session) {
      console.warn('[auth.global] Session Supabase expirée, refresh...')
      // Forcer un refresh si la session Supabase est expirée
      try {
        const refreshed = await $fetch('/api/auth/refresh', {
          credentials: 'include'
        })

        // ⚠️ /api/auth/refresh renvoie un 200 avec supabaseJwt=null quand le
        // refresh token OIDC est lui aussi expiré : $fetch ne throw donc pas.
        // Sans JWT valide, le client Supabase ne peut plus charger les données
        // → on redirige vers login au lieu d'afficher une page vide.
        if (!refreshed?.supabaseJwt) {
          console.warn('[auth.global] refresh sans JWT valide, redirection login')
          user.value = null
          return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
        }

        // Mettre à jour la session Supabase côté client
        await supabase.auth.setSession({
          access_token: refreshed.supabaseJwt,
          refresh_token: 'dummy' // Le refresh token OIDC est dans les cookies
        })
      } catch (err) {
        console.error('[auth.global] Erreur refresh Supabase:', err)
        user.value = null
        return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
      }
    }
    // Vérifier le rôle requis
    const requiredRole = to.meta.requiredRole
    if (requiredRole && !checkUserRole(user.value, requiredRole)) {
      throw createError({
        statusCode: 403,
        message: "Vous n'avez pas les permissions nécessaires pour accéder à cette page."
      })
    }
    return
  }

  const headers = useRequestHeaders(['cookie'])

  try {
    // 1️⃣ Vérifie la session via /api/auth/me
    let userInfo = null
    const me = await $fetch('/api/auth/me', {
      credentials: 'include',
      headers
    })
    userInfo = me?.user

    // 2️⃣ Si pas de session valide → tentative de refresh
    if (!userInfo) {
      const refreshed = await $fetch('/api/auth/refresh', {
        credentials: 'include',
        headers
      })

      if (!refreshed?.user) {
        console.warn('[auth.global] refresh échoué, redirection login')
        return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
      }
      userInfo = refreshed.user
      // 🆕 Mettre à jour la session Supabase après refresh
      if (import.meta.client && refreshed.supabaseJwt) {
        await supabase.auth.setSession({
          access_token: refreshed.supabaseJwt,
          refresh_token: 'dummy'
        })
      }
    }

    // 3️⃣ Vérifie que le userInfo contient un sub (identifiant OIDC)
    if (!userInfo?.sub) {
      console.warn('[auth.global] userInfo invalide (pas de sub)')
      return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }

    // 4️⃣ Récupère les informations utilisateur depuis la base
    const userData = await getOneUser(userInfo.sub)
    if (!userData) {
      console.warn('[auth.global] utilisateur inconnu en base')
      return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }

    // 5️⃣ Met à jour le state global
    user.value = userData

    // 6️⃣ Vérifie le rôle requis pour la page
    const requiredRole = to.meta.requiredRole
    if (requiredRole && !checkUserRole(userData, requiredRole)) {
      throw createError({
        statusCode: 403,
        message: "Vous n'avez pas les permissions nécessaires pour accéder à cette page."
      })
    }
  } catch (err) {
    // Si c'est une erreur 403 qu'on a créée, la propager
    if (err.statusCode === 403) {
      throw err
    }
    console.error('[auth.global] erreur middleware:', err)
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})

// Fonction utilitaire pour vérifier les rôles
function checkUserRole(user, requiredRole) {
  const userRole = user?.role ?? 0

  switch (requiredRole) {
    case 'admin':
      // Admin (1) ou SuperAdmin (2) peuvent accéder
      return userRole >= 1
    case 'superadmin':
      // Seul SuperAdmin (2) peut accéder
      return userRole === 2
    case 'logistique':
      // Admin/SuperAdmin OU profil Logistique (num_profil === 1) OU utilisateur pré-op
      return userRole >= 1 || Number(user?.profils) === 1 || user?.pre_op === true
    default:
      return true
  }
}
