// Cloudflare Pages Function — GitHub OAuth handler for Decap CMS
// Handles both /api/auth and /api/auth/callback

const CLIENT_ID = "Ov23lit8gNRJzxceLwmY";
const CLIENT_SECRET = "211802d026a4a620779939b840d151f8270e28a8";

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // Step 1: Redirect to GitHub OAuth
  if (!path.includes("callback")) {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: `${url.origin}/api/auth/callback`,
      scope: "repo,user",
      state: Math.random().toString(36).substring(7),
    });
    return Response.redirect(
      `https://github.com/login/oauth/authorize?${params}`,
      302
    );
  }

  // Step 2: Handle callback — exchange code for token
  const code = url.searchParams.get("code");
  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: `${url.origin}/api/auth/callback`,
    }),
  });

  const tokenData = await tokenRes.json();

  if (tokenData.error) {
    return new Response(`OAuth error: ${tokenData.error_description}`, { status: 400 });
  }

  const token = tokenData.access_token;
  const provider = "github";

  // Return HTML that passes token back to Decap CMS
  const html = `<!DOCTYPE html>
<html>
<head><title>Authorizing...</title></head>
<body>
<script>
  (function() {
    function receiveMessage(e) {
      console.log("receiveMessage", e);
      window.opener.postMessage(
        'authorization:${provider}:success:${JSON.stringify({ token, provider })}',
        e.origin
      );
    }
    window.addEventListener("message", receiveMessage, false);
    window.opener.postMessage("authorizing:${provider}", "*");
  })();
</script>
<p>Authorizing... You can close this window.</p>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}
