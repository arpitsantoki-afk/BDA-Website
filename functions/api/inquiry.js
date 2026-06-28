// Cloudflare Pages Function — POST /api/inquiry
const WEB3FORMS_KEY = "072310a8-f9f4-4894-9fdc-dd3072db2002";

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    body = await request.json();
  } else {
    const fd = await request.formData();
    body = Object.fromEntries(fd.entries());
  }

  const name    = (body.name    || "").trim();
  const email   = (body.email   || "").trim();
  const phone   = (body.phone   || "").trim();
  const message = (body.message || "").trim();

  if (!name || !email) {
    return new Response(JSON.stringify({ error: "Name and email are required" }), {
      status: 400, headers: { "Content-Type": "application/json" }
    });
  }

  const created_at = new Date().toISOString();
  const ip = request.headers.get("CF-Connecting-IP") || "";

  // ── Save to D1 (optional — never fails the request) ──
  if (env.DB) {
    try {
      await env.DB.prepare(
        `CREATE TABLE IF NOT EXISTS bda_inquiries (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT, email TEXT, phone TEXT, message TEXT,
          created_at TEXT, ip TEXT, read INTEGER DEFAULT 0
        )`
      ).run();
      await env.DB.prepare(
        `INSERT INTO bda_inquiries (name, email, phone, message, created_at, ip)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(name, email, phone, message, created_at, ip).run();
    } catch (e) {
      console.error("D1 error (non-fatal):", e.message);
    }
  } else {
    console.warn("D1 binding not available — skipping storage");
  }

  // ── Forward to Web3Forms (always) ──
  try {
    const formData = new FormData();
    formData.append("access_key", WEB3FORMS_KEY);
    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("message", message);
    formData.append("subject", `New Inquiry from ${name} — Blue Door Architects`);
    await fetch("https://api.web3forms.com/submit", { method: "POST", body: formData });
  } catch (e) {
    console.error("Web3Forms error:", e.message);
  }

  // Always return success so user never sees an error
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
