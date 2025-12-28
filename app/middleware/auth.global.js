export default defineNuxtRouteMiddleware(async (to) => {
  const requiresAuth = to.meta.requiresAuth ?? false
  if (!requiresAuth) return

  const user = useAuthUser()
  const { getOneUser } = useUsers()

  // ✅ Côté client : si l'utilisateur est déjà chargé, vérifier seulement les rôles
  if (import.meta.client && user.value) {
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
    }

    // 3️⃣ Vérifie que le userInfo contient un sub (identifiant OIDC)
    if (!userInfo?.sub) {
      console.warn('[auth.global] userInfo invalide (pas de sub)')
      return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }

    // 4️⃣ Récupère les informations utilisateur depuis la base
    // const userData = await getOneUser(userInfo.sub)
    // if (!userData) {
    //   console.warn('[auth.global] utilisateur inconnu en base')
    //   return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    // }
    const userData = await $fetch('/api/auth/user', {
      credentials: 'include',
      headers,
      query: { sub: userInfo.sub } // ✅ on passe le sub OIDC au serveur
    })

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
    default:
      return true
  }
}
