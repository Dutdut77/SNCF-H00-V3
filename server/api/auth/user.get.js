export default defineEventHandler(async (event) => {
  const service = serverSupabaseServiceRole(event)
  const supabase = await serverSupabaseClient(event)
  // 🔐 Récupère la session OIDC depuis les cookies
  const session = await serverSupabaseSession(event)
  console.warn('[api/auth/user] session :', session)
  if (!session?.user?.sub) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Not authenticated'
    })
  }

  const { data, error } = await service.from('users').select('*').eq('oidc_id', session.user.sub).single()
  console.warn('[api/auth/user] data :', data)
  if (error) {
    console.error('[api/auth/user] supabase error', error)
    throw createError({ statusCode: 500 })
  }

  return data
})
