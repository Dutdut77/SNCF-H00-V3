export default defineNuxtRouteMiddleware(async (to) => {
  const requiresAuth = to.meta.requiresAuth ?? false
  if (!requiresAuth) return

  const user = useAuthUser()
  const { getOneUser } = useUsers()

  // ✅ Côté client : si l'utilisateur est déjà chargé, pas besoin de refaire les appels
  if (import.meta.client && user.value) {
    return
  }

  const headers = useRequestHeaders(['cookie'])

  try {
    // 1️⃣ Vérifie la session via /api/auth/me
    let userInfo = null
    const me = await $fetch('/api/auth/me', {
      credentials: 'include',
      headers,
    })
    userInfo = me?.user

    // 2️⃣ Si pas de session valide → tentative de refresh
    if (!userInfo) {
      const refreshed = await $fetch('/api/auth/refresh', {
        credentials: 'include',
        headers,
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
    const userData = await getOneUser(userInfo.sub)
    if (!userData) {
      console.warn('[auth.global] utilisateur inconnu en base')
      return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
    }

    // 5️⃣ Met à jour le state global
    user.value = userData

  } catch (err) {
    console.error('[auth.global] erreur middleware:', err)
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})








