import { refreshOidcToken } from '@@/server/utils/refreshOidcToken'
import { serverSupabaseServiceRole, serverSupabaseClient } from '#supabase/server'
import { setCookie, getCookie } from 'h3'
import { generateSupabaseJwt, findUserByEmail } from '@@/server/utils/generateSupabaseJwt'

export default defineEventHandler(async (event) => {
  const service = serverSupabaseServiceRole(event)
  const supabase = await serverSupabaseClient(event)
  const data = await refreshOidcToken(event)
  const refreshToken = getCookie(event, 'refresh_token')

  if (!data) {
    console.warn('[refresh] Aucun token retourné par refreshOidcToken')
    return { user: null }
  }

  const { access_token, expires_in, id_token, userInfo } = data

  // Trouver l'utilisateur dans Supabase Auth
  const userFound = await findUserByEmail(service, userInfo.email)

  if (!userFound) {
    console.warn('[refresh] Utilisateur non trouvé dans Supabase Auth')
    return { user: null }
  }

  const userUuid = userFound.id

  // 🔹 Générer un JWT Supabase custom pour cet utilisateur
  const supabaseJwt = generateSupabaseJwt(userUuid, userInfo.email)

  // Mettre à jour la session Supabase
  await supabase.auth.setSession({
    access_token: supabaseJwt,
    refresh_token: refreshToken
  })

  // Met à jour les cookies sécurisés
  setCookie(event, 'access_token', access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: expires_in || 3600
  })

  setCookie(event, 'id_token', id_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  })

  setCookie(event, 'sb-access-token', supabaseJwt, {
    httpOnly: false, // important : non HttpOnly pour que le client JS puisse lire le token
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30 // 30 jours
  })

  setCookie(event, 'sb-refresh-token', refreshToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  })

  return { user: userInfo }
})
