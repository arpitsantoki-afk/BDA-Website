// Cloudflare Pages Function — GET /api/inquiries
// Returns stored inquiries — protected by GitHub token validation

export async function onRequestGet(context) {
  const { request, env } = context;

  // Validate GitHub token from Authorization header
  const authHeader = request.headers.get("Authorization") || "";
  const ghToken = authHeader.replace("Bearer ", "").trim();

  if (!ghToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Verify token against GitHub API — must be member of arpitsantoki-afk
  try {
    const ghRes = await fetch("https://api.github.com/user", {
      headers: {
        "Authorization": `Bearer ${ghToken}`,
        "User-Agent": "BlueDoorArchitects-Website"
      }
    });
    if (!ghRes.ok) throw new Error("Invalid token");
    const ghUser = await ghRes.json();
    // Only allow arpitsantoki-afk
    if (ghUser.login !== "arpitsantoki-afk") {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" }
      });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  // Fetch inquiries from D1
  const url = new URL(request.url);
  const limit  = parseInt(url.searchParams.get("limit")  || "50");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  try {
    const result = await env.DB.prepare(
      `SELECT id, name, email, phone, message, created_at, read
       FROM bda_inquiries
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();

    const count = await env.DB.prepare(
      `SELECT COUNT(*) as total FROM bda_inquiries`
    ).first();

    return new Response(JSON.stringify({
      inquiries: result.results,
      total: count.total
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "DB error", detail: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// Mark inquiry as read
export async function onRequestPatch(context) {
  const { request, env } = context;
  const authHeader = request.headers.get("Authorization") || "";
  const ghToken = authHeader.replace("Bearer ", "").trim();

  if (!ghToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  try {
    const ghRes = await fetch("https://api.github.com/user", {
      headers: { "Authorization": `Bearer ${ghToken}`, "User-Agent": "BlueDoorArchitects-Website" }
    });
    if (!ghRes.ok) throw new Error("Invalid token");
    const ghUser = await ghRes.json();
    if (ghUser.login !== "arpitsantoki-afk") {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { id, read } = await request.json();
  await env.DB.prepare(`UPDATE bda_inquiries SET read = ? WHERE id = ?`).bind(read ? 1 : 0, id).run();
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  });
}
