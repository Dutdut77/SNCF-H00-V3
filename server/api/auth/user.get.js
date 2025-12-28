import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const oidcId = query.sub

  if (!oidcId) {
    throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })
  }

  const service = serverSupabaseServiceRole(event)
  const { data, error } = await service.from('users').select('*').eq('oidc_id', oidcId).single()

  if (error) {
    console.error('[api/auth/user] supabase error', error)
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  return data
})
