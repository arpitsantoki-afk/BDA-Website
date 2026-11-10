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

// Search engine + social crawler user agents
const SOCIAL_CRAWLERS = ['whatsapp', 'facebookexternalhit', 'twitterbot', 'linkedinbot', 'telegrambot', 'slackbot', 'discordbot', 'googlebot', 'bingbot', 'baiduspider', 'yandexbot', 'duckduckbot', 'applebot', 'ahrefsbot', 'semrushbot', 'msnbot'];

function isSocialCrawler(ua) {
  if (!ua) return false;
  const lower = ua.toLowerCase();
  return SOCIAL_CRAWLERS.some(bot => lower.includes(bot));
}

async function handleProjectPage(slug, isCrawler) {
  try {
    const r = await fetch(`https://raw.githubusercontent.com/arpitsantoki-afk/BDA-Website/main/_data/projects/${slug}.json`);
    if (!r.ok) return null;
    const p = await r.json();

    const title = (p.name || 'Project') + ' — Blue Door Architects';
    const desc  = p.description
      ? p.description.slice(0, 160).replace(/"/g, '&quot;')
      : `${p.name} — ${p.category || 'Architecture'} project by Blue Door Architects in ${p.location || 'India'}.`;
    const img   = p.cover_image
      ? (p.cover_image.startsWith('/') ? 'https://www.bluedoorarchitects.com' + p.cover_image : p.cover_image)
      : 'https://www.bluedoorarchitects.com/og-image.jpg';
    const canonicalUrl = `https://www.bluedoorarchitects.com/projects/${slug}`;
    const spaUrl       = `https://www.bluedoorarchitects.com/?project=${slug}`;

    // All images for the gallery (use images or gallery field)
    const galleryImages = (p.gallery || p.images || []).map(src =>
      src.startsWith('/') ? 'https://www.bluedoorarchitects.com' + src : src
    );

    // JSON-LD structured data
    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "name": p.name,
      "description": p.description || desc,
      "url": canonicalUrl,
      "image": galleryImages.length ? galleryImages : [img],
      "dateCreated": p.year ? p.year + '-01-01' : undefined,
      "locationCreated": p.location ? { "@type": "Place", "name": p.location + ', India' } : undefined,
      "creator": {
        "@type": "Organization",
        "name": "Blue Door Architects",
        "url": "https://www.bluedoorarchitects.com"
      },
      "genre": p.category || "Architecture"
    });

    // For crawlers: full pre-rendered HTML with gallery thumbnails
    // For regular users hitting /projects/slug directly: redirect to SPA with hash
    if (!isCrawler) {
      return new Response(null, {
        status: 302,
        headers: {
          'Location': 'https://www.bluedoorarchitects.com/?project=' + slug,
          'Cache-Control': 'no-store'
        }
      });
    }

    // Build a simple gallery HTML for crawlers to index
    const galleryHtml = galleryImages.slice(0, 8).map(src =>
      `<img src="${src}" alt="${p.name} — Blue Door Architects" loading="lazy" style="max-width:100%;height:auto;display:block;margin:8px 0;">`
    ).join('\n');

    return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<meta name="description" content="${desc}"/>
<link rel="canonical" href="${canonicalUrl}"/>
<meta property="og:title" content="${title}"/>
<meta property="og:description" content="${desc}"/>
<meta property="og:image" content="${img}"/>
<meta property="og:url" content="${canonicalUrl}"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="Blue Door Architects"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${title}"/>
<meta name="twitter:description" content="${desc}"/>
<meta name="twitter:image" content="${img}"/>
<script type="application/ld+json">${jsonLd}</script>
</head>
<body>
<header><a href="https://www.bluedoorarchitects.com">Blue Door Architects</a></header>
<main>
<h1>${p.name}</h1>
${p.location ? '<p><strong>Location:</strong> ' + p.location + '</p>' : ''}
${p.year     ? '<p><strong>Year:</strong> '     + p.year     + '</p>' : ''}
${p.category ? '<p><strong>Category:</strong> ' + p.category + '</p>' : ''}
${p.description ? '<p>' + p.description.replace(/</g,'&lt;').replace(/>/g,'&gt;') + '</p>' : ''}
${galleryHtml}
<p><a href="${spaUrl}">View full project on Blue Door Architects</a></p>
</main>
</body>
</html>`, {
      headers: {
        'Content-Type': 'text/html;charset=utf-8',
        'Cache-Control': 'public,max-age=3600'
      }
    });
  } catch(e) { return null; }
}

async function handlePostOG(slug) {
  try {
    const r = await fetch(`https://raw.githubusercontent.com/arpitsantoki-afk/BDA-Website/main/_data/insights/${slug}.json`);
    if (!r.ok) return null;
    const post = await r.json();

    const title = (post.title || 'Insights') + ' — Blue Door Architects';
    const desc  = post.excerpt || post.title || 'Design thinking and project stories from Blue Door Architects.';
    const img   = post.cover_image
      ? (post.cover_image.startsWith('/') ? 'https://www.bluedoorarchitects.com' + post.cover_image : post.cover_image)
      : 'https://www.bluedoorarchitects.com/og-image.jpg';
    const url   = `https://www.bluedoorarchitects.com/insights/post#${slug}`;

    return new Response(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>${title}</title>
<meta name="description" content="${desc}"/>
<meta property="og:title" content="${title}"/>
<meta property="og:description" content="${desc}"/>
<meta property="og:image" content="${img}"/>
<meta property="og:url" content="${url}"/>
<meta property="og:type" content="article"/>
<meta property="og:site_name" content="Blue Door Architects"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${title}"/>
<meta name="twitter:description" content="${desc}"/>
<meta name="twitter:image" content="${img}"/>
<meta http-equiv="refresh" content="0; url=${url}"/>
<link rel="canonical" href="${url}"/>
</head>
<body><a href="${url}">${title}</a></body>
</html>`, {
      headers: { 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'public,max-age=3600' }
    });
  } catch(e) { return null; }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle API routes first
    if (path === "/api/test") return json({ ok: true, path, method: request.method, assets: !!env.ASSETS, db: !!env.DB });
    if (path === "/api/inquiry")   return handleInquiry(request, env);
    if (path === "/api/inquiries") return handleInquiries(request, env);

    // Project pages — /projects/[slug]
    // Crawlers get pre-rendered HTML; regular users get redirected to SPA
    const projectMatch = path.match(/^\/projects\/([a-z0-9-]+)\/?$/);
    if (projectMatch) {
      const slug = projectMatch[1];
      const ua = request.headers.get('user-agent') || '';
      const crawler = isSocialCrawler(ua);
      const response = await handleProjectPage(slug, crawler);
      if (response) return response;
      // slug not found — fall through to SPA
    }

    // Social crawler OG handler for insight posts
    if (path === '/insights/post' || path === '/insights/post.html') {
      const ua = request.headers.get('user-agent') || '';
      if (isSocialCrawler(ua)) {
        const slug = url.searchParams.get('s') || url.searchParams.get('slug') || '';
        if (slug) {
          const ogResponse = await handlePostOG(slug);
          if (ogResponse) return ogResponse;
        }
      }
    }

    // Pass everything else to static assets
    if (env.ASSETS) return env.ASSETS.fetch(request);

    // Fallback: fetch from origin
    return fetch(request);
  }
};
