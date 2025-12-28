// import { getUserFromSession } from '@@/server/utils/getUserFromSession'
import { getCookie } from 'h3'


export default defineEventHandler(async (event) => {
  // const user = await getUserFromSession(event)
  const config = useRuntimeConfig()
  const accessToken = getCookie(event, 'access_token')

  if (!accessToken) return { user: null }

  try {
    // Appel au endpoint userinfo OIDC SNCF
    const response = await $fetch(config.oidc.userinfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })

    // Si l'appel réussit → token valide → renvoie les infos utilisateur
    if (response?.sub) {

    
      return { user: response }
    }

    return { user: null }
  } catch (err) {
    // Erreur souvent liée à un token expiré → on laisse null
    console.warn('[getUserFromSession] access token invalide ou expiré')
    return { user: null }
  }


})
