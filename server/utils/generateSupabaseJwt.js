import jwt from 'jsonwebtoken'

/**
 * Génère un JWT Supabase custom pour un utilisateur OIDC
 * @param {string} userUuid - L'UUID de l'utilisateur dans Supabase Auth
 * @param {string} email - L'email de l'utilisateur
 * @param {number} expiresInSeconds - Durée de validité en secondes (défaut: 3600 = 1h)
 * @returns {string} Le JWT signé
 */
export function generateSupabaseJwt(userUuid, email, expiresInSeconds = 3600) {
  const secret = process.env.SUPABASE_JWT_SECRET

  if (!secret) {
    throw new Error('SUPABASE_JWT_SECRET non défini')
  }

  return jwt.sign(
    {
      sub: userUuid,
      email,
      role: 'authenticated',
      aud: 'authenticated',
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
  const { data, error } = await service.auth.admin.listUsers()
  
  if (error) {
    console.error('[findUserByEmail] Erreur:', error)
    return null
  }

  return data?.users?.find(
    (user) => user.email?.toLowerCase() === email.toLowerCase()
  ) || null
}

