import { refreshOidcToken } from '@@/server/utils/refreshOidcToken'
import { serverSupabaseServiceRole, serverSupabaseClient } from '#supabase/server'
import { setCookie } from 'h3'
import { generateSupabaseJwt, findUserByEmail } from '@@/server/utils/generateSupabaseJwt'

export default defineEventHandler(async (event) => {
  const service = serverSupabaseServiceRole(event)
  const supabase = await serverSupabaseClient(event)
  const data = await refreshOidcToken(event)

  if (!data) {
    console.warn('[refresh] Aucun token retourné par refreshOidcToken')
    return { user: null, supabaseJwt: null }
  }

  const { access_token, expires_in, id_token, refresh_token, userInfo } = data

  // Retrouver l'uuid Supabase Auth : d'abord via public.users.auth_uuid (rempli au
  // callback), sinon en parcourant les comptes Auth — lent, puis on mémorise l'uuid
  const { data: appUser } = await service
    .from('users')
    .select('id, auth_uuid')
    .eq('oidc_id', userInfo.sub)
    .maybeSingle()

  let userUuid = appUser?.auth_uuid

  if (!userUuid) {
    const userFound = await findUserByEmail(service, userInfo.email)

    if (!userFound) {
      console.warn('[refresh] Utilisateur non trouvé dans Supabase Auth')
      return { user: null, supabaseJwt: null }
    }

    userUuid = userFound.id

    if (appUser) {
      await service.from('users').update({ auth_uuid: userUuid }).eq('id', appUser.id)
    }
  }

  // 🔹 Générer un JWT Supabase custom pour cet utilisateur
  const supabaseJwt = generateSupabaseJwt(userUuid, userInfo.email, userInfo.sub)

  // Mettre à jour la session Supabase. Le refresh token OIDC n'y est pas mis : le
  // cookie de session Supabase est lisible en JS, et Supabase ne saurait pas l'utiliser
  await supabase.auth.setSession({
    access_token: supabaseJwt,
    refresh_token: 'dummy'
  })

  // Met à jour les cookies sécurisés
  setCookie(event, 'access_token', access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: expires_in || 3600
  })

  // L'IdP invalide l'ancien refresh token : on enregistre le nouveau
  if (refresh_token) {
    setCookie(event, 'refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 jours
    })
  }

  setCookie(event, 'id_token', id_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/'
  })
  // 🆕 Ajouter le JWT Supabase dans un cookie accessible côté client
  setCookie(event, 'supabase_jwt', supabaseJwt, {
    httpOnly: false, // Accessible côté client
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 // 24h
  })

  return { user: userInfo, supabaseJwt: supabaseJwt }
})
