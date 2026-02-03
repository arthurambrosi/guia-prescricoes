function renderBody(status, content) {
  const body = `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8"/>
        <title>Autorizacao</title>
      </head>
      <body>
        <script>
          function recieveMessage(message) {
            if (!message.origin || message.origin !== '${new URL(
              content.site
            ).origin}') {
              return
            }
            window.opener.postMessage(
              'authorization:github:' + JSON.stringify(${JSON.stringify(
                content
              )}),
              message.origin
            )
          }
          window.addEventListener('message', recieveMessage, false)
          window.opener.postMessage('authorizing:github', '*')
        </script>
      </body>
    </html>
  `

  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Access-Control-Allow-Origin': '*'
    }
  })
}

export async function onRequest(context) {
  const { request, env } = context

  try {
    const clientId = env.GITHUB_CLIENT_ID
    const clientSecret = env.GITHUB_CLIENT_SECRET
    const url = new URL(request.url)
    const code = url.searchParams.get('code')

    const tokenResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: code
        })
      }
    )

    const tokenResult = await tokenResponse.json()

    if (!tokenResult.access_token) {
      return renderBody(401, {
        status: 'error',
        content: 'Authorization failed'
      })
    }

    return renderBody(200, {
      token: tokenResult.access_token,
      provider: 'github',
      site: url.origin
    })
  } catch (error) {
    return renderBody(500, {
      status: 'error',
      content: error.message
    })
  }
}
