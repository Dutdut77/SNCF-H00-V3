import jwt from 'jsonwebtoken'

/**
 * Génère un JWT Supabase custom pour un utilisateur OIDC
 *
 * La claim `oidc_id` porte le `sub` OIDC : c'est la clé d'identité utilisée par
 * l'application pour relier une session à une ligne `public.users`
 * (useUsers.getOneUser fait `.eq('oidc_id', sub)`). Les policies RLS s'appuient
 * dessus via public.is_superadmin(). Ni `sub` (uuid Supabase Auth) ni `email` ne
 * sont fiables pour cela : `public.users.id` n'est pas resynchronisé (l'UPDATE du
 * callback est rejeté par les FK qui référencent la ligne) et l'email de l'IdP
 * peut différer de celui stocké en base.
 *
 * @param {string} userUuid - L'UUID de l'utilisateur dans Supabase Auth
 * @param {string} email - L'email de l'utilisateur
 * @param {string} oidcSub - Le `sub` OIDC (= public.users.oidc_id)
 * @param {number} expiresInSeconds - Durée de validité en secondes (défaut: 3600 = 1h)
 * @returns {string} Le JWT signé
 */
export function generateSupabaseJwt(userUuid, email, oidcSub = null, expiresInSeconds = 3600) {
  const secret = process.env.SUPABASE_JWT_SECRET

  if (!secret) {
    throw new Error('SUPABASE_JWT_SECRET non défini')
  }

  return jwt.sign(
    {
      sub: userUuid,
      email,
      oidc_id: oidcSub,
      role: 'authenticated',
      aud: 'authenticated'
    },
    secret,
    { algorithm: 'HS256', expiresIn: expiresInSeconds }
  )
}

/**
 * Recherche un utilisateur par email dans Supabase Auth
 * @param {Object} service - Le client Supabase Service Role
 * @param {string} email - L'email à rechercher
 * @returns {Object|null} L'utilisateur trouvé ou null
 */
export async function findUserByEmail(service, email) {
  const perPage = 1000
  let page = 1

  while (true) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage })

    if (error) {
      console.error('[findUserByEmail] Erreur:', error)
      return null
    }

    const found = data?.users?.find((user) => user.email?.toLowerCase() === email.toLowerCase())
    if (found) return found

    // Plus de pages à parcourir
    if (!data?.users?.length || data.users.length < perPage) {
      return null
    }

    page++
  }
}
