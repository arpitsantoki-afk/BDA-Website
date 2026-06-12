// Cloudflare Pages Function — GitHub OAuth for Decap CMS
// Handles /api/auth (initial) and /api/auth/callback

const CLIENT_ID = "Ov23lit8gNRJzxceLwmY";
const CLIENT_SECRET = "211802d026a4a620779939b840d151f8270e28a8";
const ORIGIN = "https://bluedoorarchitects.com";

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const isCallback = url.searchParams.has("code");

  // ── STEP 1: Initial auth request → redirect to GitHub ──
  if (!isCallback) {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: `${ORIGIN}/api/auth`,
      scope: "repo,user",
      state: crypto.randomUUID(),
    });
    return Response.redirect(
      `https://github.com/login/oauth/authorize?${params}`, 302
    );
  }

  // ── STEP 2: Callback with code → exchange for token ──
  const code = url.searchParams.get("code");

  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: `${ORIGIN}/api/auth`,
    }),
  });

  const data = await tokenRes.json();

  if (data.error) {
    return new Response(`Auth error: ${data.error_description}`, { status: 400 });
  }

  const token = data.access_token;

  // ── STEP 3: Post token back to Decap CMS opener window ──
  const html = `<!DOCTYPE html>
<html>
<head><title>Authenticating...</title></head>
<body>
<script>
(function() {
  function receiveMessage(e) {
    window.opener.postMessage(
      'authorization:github:success:' + JSON.stringify({
        token: "${token}",
        provider: "github"
      }),
      e.origin
    );
  }
  window.addEventListener("message", receiveMessage, false);
  window.opener.postMessage("authorizing:github", "*");
})();
</script>
<p style="font-family:sans-serif;text-align:center;margin-top:40px">
  Authenticating with GitHub...<br>You can close this window.
</p>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}
