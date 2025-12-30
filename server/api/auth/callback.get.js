import { serverSupabaseServiceRole, serverSupabaseClient } from '#supabase/server'
import { v4 as uuidv4 } from 'uuid'
import { generateSupabaseJwt, findUserByEmail } from '@@/server/utils/generateSupabaseJwt'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const service = serverSupabaseServiceRole(event)
  const supabase = await serverSupabaseClient(event)

  const code = query.code
  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Missing OIDC code' })
  }

  // try {

  // 1️⃣ Échanger le code contre des tokens OIDC
  const tokenResponse = await $fetch(config.oidc.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + Buffer.from(`${config.oidc.clientId}:${config.oidc.clientSecret}`).toString('base64')
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${config.public.baseUrl}/api/auth/callback`
    })
  })

  if (!tokenResponse.access_token) {
    throw createError({ statusCode: 401, statusMessage: 'Failed to obtain access token' })
  }

  // 2️⃣ On récupère les infos utilisateur (OIDC userinfo)
  const userInfo = await $fetch(config.oidc.userinfoUrl, {
    headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
  })

  // Vérifier si l'utilisateur existe déjà dans Supabase Auth
  const userFound = await findUserByEmail(service, userInfo.email)

  let userUuid
  let isNewUser = false

  if (userFound) {
    userUuid = userFound.id
  } else {
    isNewUser = true
    userUuid = uuidv4()

    const { data: newUser, error: createUserError } = await service.auth.admin.createUser({
      id: userUuid,
      email: userInfo.email,
      email_confirm: true,
      user_metadata: {
        oidc_id: userInfo.sub,
        displayName: userInfo.name,
        prenom: userInfo.given_name,
        nom: userInfo.family_name
      }
    })

    if (createUserError) {
      console.error('[callback] Erreur création utilisateur auth.users:', createUserError)
      throw createError({ statusCode: 500, statusMessage: 'Failed to create user in auth' })
    }
  }

  // 5️⃣ Vérifier et mettre à jour/créer l'utilisateur dans la table publique users
  // Le trigger handle_new_user gère maintenant la logique de merge si l'email existe déjà
  try {
    // Attendre un peu pour que le trigger s'exécute (seulement pour les nouveaux utilisateurs auth)
    if (isNewUser) {
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    // Vérifier si l'utilisateur existe dans la table users (par email car peut avoir été pré-créé)
    const { data: existingUser, error: checkError } = await service
      .from('users')
      .select('*')
      .eq('email', userInfo.email)
      .maybeSingle()

    if (existingUser) {
      // L'utilisateur existe → s'assurer que auth_uuid et oidc_id sont renseignés
      if (!existingUser.email) {
        const { error: updateError } = await service
          .from('users')
          .update({
            // auth_uuid: userUuid,
            id: userUuid,
            oidc_id: userInfo.sub,
            name: userInfo.name || null,
            nom: userInfo.family_name || null,
            prenom: userInfo.given_name || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id)

        if (updateError) {
          console.warn("[callback] Erreur lors de la mise à jour de l'utilisateur:", updateError)
        }
      }
    } else if (checkError?.code !== 'PGRST116') {
      // L'utilisateur n'existe pas et pas d'erreur "not found" → le créer manuellement
      // (au cas où le trigger n'a pas fonctionné)
      const { error: insertUserError } = await service.from('users').insert({
        id: userUuid,
        email: userInfo.email,
        oidc_id: userInfo.sub,
        // auth_uuid: userUuid,
        name: userInfo.name || null,
        prenom: userInfo.given_name || null,
        nom: userInfo.family_name || null,
        profils: -1, // profil visiteur
        role: 0 // 0 = aucun, 1 = admin, 2 = superadmin
      })

      if (insertUserError) {
        console.warn("[callback] Erreur lors de la création de l'utilisateur dans users:", insertUserError)
      }
    }
  } catch (userCreationError) {
    // Log l'erreur mais ne bloque pas l'authentification
    console.warn("[callback] Erreur lors de la vérification/création de l'utilisateur dans users:", userCreationError)
  }

  // 🔹 Générer un JWT Supabase custom pour cet utilisateur
  const supabaseJwt = generateSupabaseJwt(userUuid, userInfo.email)

  await supabase.auth.setSession({
    access_token: supabaseJwt,
    refresh_token: tokenResponse.refresh_token
  })

  // 3️⃣ On stocke les tokens dans des cookies HttpOnly
  setCookie(event, 'access_token', tokenResponse.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: tokenResponse.expires_in || 3600
  })

  setCookie(event, 'refresh_token', tokenResponse.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30 // 30 jours
  })

  setCookie(event, 'id_token', tokenResponse.id_token, {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production'
  })

  // 4️⃣ Redirection vers le front après login
  const redirect = query.redirect || '/'
  return sendRedirect(event, redirect)
})
