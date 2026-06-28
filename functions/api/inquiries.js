// Cloudflare Pages Function — /api/inquiries
// GET: returns stored inquiries (GitHub token protected)
// PATCH: marks inquiry as read/unread

async function verifyGithubToken(token) {
  const res = await fetch("https://api.github.com/user", {
    headers: { "Authorization": `Bearer ${token}`, "User-Agent": "BlueDoorArchitects-Website" }
  });
  if (!res.ok) return false;
  const user = await res.json();
  return user.login === "arpitsantoki-afk";
}

export async function onRequest(context) {
  const { request, env } = context;

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization"
      }
    });
  }

  // Auth check
  const authHeader = request.headers.get("Authorization") || "";
  const ghToken = authHeader.replace("Bearer ", "").trim();
  if (!ghToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" }
    });
  }

  const valid = await verifyGithubToken(ghToken);
  if (!valid) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403, headers: { "Content-Type": "application/json" }
    });
  }

  // GET — fetch inquiries
  if (request.method === "GET") {
    if (!env.DB) {
      return new Response(JSON.stringify({ inquiries: [], total: 0, error: "DB not bound" }), {
        headers: { "Content-Type": "application/json" }
      });
    }
    const url = new URL(request.url);
    const limit  = parseInt(url.searchParams.get("limit")  || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    try {
      const result = await env.DB.prepare(
        `SELECT id, name, email, phone, message, created_at, read
         FROM bda_inquiries ORDER BY created_at DESC LIMIT ? OFFSET ?`
      ).bind(limit, offset).all();
      const count = await env.DB.prepare(
        `SELECT COUNT(*) as total FROM bda_inquiries`
      ).first();
      return new Response(JSON.stringify({ inquiries: result.results, total: count.total }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ inquiries: [], total: 0, error: e.message }), {
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // PATCH — mark read/unread
  if (request.method === "PATCH") {
    if (!env.DB) {
      return new Response(JSON.stringify({ error: "DB not bound" }), {
        status: 500, headers: { "Content-Type": "application/json" }
      });
    }
    const { id, read } = await request.json();
    await env.DB.prepare(
      `UPDATE bda_inquiries SET read = ? WHERE id = ?`
    ).bind(read ? 1 : 0, id).run();
    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405, headers: { "Content-Type": "application/json" }
  });
}
