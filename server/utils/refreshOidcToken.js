
import { getCookie, setCookie, deleteCookie } from 'h3'

export async function refreshOidcToken(event) {
  const config = useRuntimeConfig()
  const refreshToken = getCookie(event, 'refresh_token')
 const BASE_URL = process.env.NUXT_PUBLIC_BASE_URL 

  
  if (!refreshToken) {
    console.warn('[refreshOidcToken] Aucun refresh_token trouvé')
    return null
  }

  try {

    const response = await $fetch(config.oidc.tokenUrl, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${config.oidc.clientId}:${config.oidc.clientSecret}`).toString('base64'),
        },
        body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        redirect_uri: `${BASE_URL}/api/auth/callback`,
        }),
    })   
  
  if (!response.access_token) {
      console.error('[refreshOidcToken] échec refresh:', response)
      return null
    }


    // Récupère les infos utilisateur avec le nouveau access_token
    const userInfo = await $fetch(config.oidc.userinfoUrl, {
      headers: { Authorization: `Bearer ${response.access_token}` }
    })


    return {
      access_token: response.access_token,
      id_token: response.id_token,
      expires_in: response.expires_in,
      userInfo,
    }
  } catch (err) {
    console.error('[refreshOidcToken] erreur:', err)
    // On nettoie les cookies en cas d’erreur pour éviter les boucles infinies
    deleteCookie(event, 'access_token')
    deleteCookie(event, 'refresh_token')
    deleteCookie(event, 'id_token')
    return null
  }
}
