export default defineEventHandler( async (event) => {
    const idToken = getCookie(event, 'id_token')
    const config = useRuntimeConfig();

// Vérifie que le token est présent
if (!idToken) {
  throw createError({ statusCode: 400, statusMessage: 'Token manquant' })
}

// URL de déconnexion avec `id_token_hint` (ou `access_token` selon ce qui est demandé par l'API)
const endSessionUrl = `${config.oidc.endSessionUrl}?id_token_hint=${idToken}`

try {
  // Envoie la requête à l'API pour mettre fin à la session
  await $fetch(endSessionUrl, {
    method: 'GET'
  })


} catch (error) {
  console.error("Erreur lors de la fermeture de la session :", error)
  throw createError({ statusCode: 400, message: 'Erreur de déconnexion' })
}


  setCookie(event, 'access_token', '', { maxAge: -1 })
  setCookie(event, 'id_token', '', { maxAge: -1 })
  setCookie(event, 'refresh_token', '', { maxAge: -1 })
  setCookie(event, 'supabase_jwt', '', { maxAge: -1 })
  setCookie(event, 'sb-127-auth-token', '', { maxAge: -1 })


  // Répondre avec un statut ou rediriger
  return { message: 'Déconnexion réussie' }
})