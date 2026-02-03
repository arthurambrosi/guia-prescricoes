function renderBody(status, content, origin) {
  const safeOrigin = origin || '*'
  const body = `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8"/>
        <title>Autorizacao</title>
      </head>
      <body>
        <script>
          const content = ${JSON.stringify(content)}
          const targetOrigin = ${JSON.stringify(safeOrigin)}
          const payload = 'authorization:github:' + JSON.stringify(content)

          function sendAuthMessage(origin) {
            if (!window.opener) {
              return
            }
            window.opener.postMessage(payload, origin || '*')
          }

          function receiveMessage(message) {
            if (!message.origin || (targetOrigin !== '*' && message.origin !== targetOrigin)) {
              return
            }
            sendAuthMessage(message.origin)
            window.close()
          }

          window.addEventListener('message', receiveMessage, false)

          if (window.opener) {
            window.opener.postMessage('authorizing:github', '*')
          }

          setTimeout(() => {
            sendAuthMessage(targetOrigin)
            window.close()
          }, 1500)
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
      }, url.origin)
    }

    return renderBody(200, {
      token: tokenResult.access_token,
      provider: 'github'
    }, url.origin)
  } catch (error) {
    const url = new URL(request.url)
    return renderBody(500, {
      status: 'error',
      content: error.message
    }, url.origin)
  }
}
