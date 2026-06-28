// BDA Website Worker — handles /api/* routes alongside static assets
const WEB3FORMS_KEY = "072310a8-f9f4-4894-9fdc-dd3072db2002";

async function handleInquiry(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body;
  const ct = request.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) {
      body = await request.json();
    } else {
      const fd = await request.formData();
      body = Object.fromEntries(fd.entries());
    }
  } catch(e) {
    return json({ error: "Invalid body" }, 400);
  }

  const name    = (body.name    || "").trim();
  const email   = (body.email   || "").trim();
  const phone   = (body.phone   || "").trim();
  const message = (body.message || "").trim();

  if (!name || !email) return json({ error: "Name and email required" }, 400);

  const created_at = new Date().toISOString();
  const ip = request.headers.get("CF-Connecting-IP") || "";

  // Save to D1
  if (env.DB) {
    try {
      await env.DB.prepare(`CREATE TABLE IF NOT EXISTS bda_inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT, email TEXT, phone TEXT, message TEXT,
        created_at TEXT, ip TEXT, read INTEGER DEFAULT 0
      )`).run();
      await env.DB.prepare(
        `INSERT INTO bda_inquiries (name,email,phone,message,created_at,ip) VALUES (?,?,?,?,?,?)`
      ).bind(name, email, phone, message, created_at, ip).run();
    } catch(e) { console.error("D1:", e.message); }
  }

  // Forward to Web3Forms
  try {
    const fd = new FormData();
    fd.append("access_key", WEB3FORMS_KEY);
    fd.append("name", name);
    fd.append("email", email);
    fd.append("phone", phone);
    fd.append("message", message);
    fd.append("subject", `New Inquiry from ${name} — Blue Door Architects`);
    await fetch("https://api.web3forms.com/submit", { method: "POST", body: fd });
  } catch(e) { console.error("Web3Forms:", e.message); }

  return json({ success: true });
}

async function handleInquiries(request, env) {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders() });

  const ghToken = (request.headers.get("Authorization") || "").replace("Bearer ", "").trim();
  if (!ghToken) return json({ error: "Unauthorized" }, 401);

  try {
    const r = await fetch("https://api.github.com/user", {
      headers: { "Authorization": `Bearer ${ghToken}`, "User-Agent": "BDA-Website" }
    });
    if (!r.ok) return json({ error: "Unauthorized" }, 401);
    const u = await r.json();
    if (u.login !== "arpitsantoki-afk") return json({ error: "Forbidden" }, 403);
  } catch(e) { return json({ error: "Unauthorized" }, 401); }

  if (!env.DB) return json({ inquiries: [], total: 0 });

  if (request.method === "GET") {
    try {
      const url = new URL(request.url);
      const limit  = parseInt(url.searchParams.get("limit")  || "50");
      const offset = parseInt(url.searchParams.get("offset") || "0");
      const rows = await env.DB.prepare(
        `SELECT id,name,email,phone,message,created_at,read FROM bda_inquiries ORDER BY created_at DESC LIMIT ? OFFSET ?`
      ).bind(limit, offset).all();
      const count = await env.DB.prepare(`SELECT COUNT(*) as total FROM bda_inquiries`).first();
      return json({ inquiries: rows.results, total: count.total });
    } catch(e) { return json({ inquiries: [], total: 0, error: e.message }); }
  }

  if (request.method === "PATCH") {
    try {
      const { id, read } = await request.json();
      await env.DB.prepare(`UPDATE bda_inquiries SET read=? WHERE id=?`).bind(read?1:0, id).run();
      return json({ success: true });
    } catch(e) { return json({ error: e.message }, 500); }
  }

  return json({ error: "Method not allowed" }, 405);
}

function json(data, status=200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle API routes first
    if (path === "/api/inquiry")   return handleInquiry(request, env);
    if (path === "/api/inquiries") return handleInquiries(request, env);

    // Pass everything else to static assets
    if (env.ASSETS) return env.ASSETS.fetch(request);

    // Fallback: fetch from origin
    return fetch(request);
  }
};
