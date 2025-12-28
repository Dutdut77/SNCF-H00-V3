export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  
  const redirectTo = query.redirect || '/' 

  
  // URL de callback locale
  const redirectUri = `${config.public.baseUrl}/api/auth/callback`

  // Scope minimal compatible DEV SNCF
  const scope = 'openid caiman'

  // Construction de l'URL d'authorization
  const authUrl = `${config.oidc.authUrl}?response_type=code&client_id=${config.oidc.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(redirectTo)}`

  // Redirection vers SNCF
  return sendRedirect(event, authUrl)
})
