export async function onRequest(context) {
  const { request, env } = context
  const clientId = env.GITHUB_CLIENT_ID

  try {
    const url = new URL(request.url)
    const origin = `https://${url.host}`
    const redirectUrl = new URL('https://github.com/login/oauth/authorize')
    const state = crypto.getRandomValues(new Uint8Array(12)).join('')

    redirectUrl.searchParams.set('client_id', clientId)
    redirectUrl.searchParams.set('redirect_uri', `${origin}/api/callback`)
    redirectUrl.searchParams.set('scope', 'repo user')
    redirectUrl.searchParams.set('state', state)

    return Response.redirect(redirectUrl.href, 302)
  } catch (error) {
    return new Response(error.message, { status: 500 })
  }
}
