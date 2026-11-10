// Cloudflare Pages Function — handles /projects/[slug]
// Crawlers get pre-rendered HTML; regular users get redirected to SPA

const SOCIAL_CRAWLERS = ['googlebot','bingbot','baiduspider','yandexbot','duckduckbot','applebot','ahrefsbot','semrushbot','msnbot','whatsapp','facebookexternalhit','twitterbot','linkedinbot','telegrambot','slackbot','discordbot'];

function isCrawler(ua) {
  if (!ua) return false;
  const lower = ua.toLowerCase();
  return SOCIAL_CRAWLERS.some(bot => lower.includes(bot));
}

export async function onRequest(context) {
  const { params, request } = context;
  const slug = params.slug;
  const ua = request.headers.get('user-agent') || '';

  // Regular users — instant redirect to SPA with ?project= param
  if (!isCrawler(ua)) {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': 'https://www.bluedoorarchitects.com/?project=' + slug,
        'Cache-Control': 'no-store'
      }
    });
  }

  // Crawlers — fetch project data and serve pre-rendered HTML
  try {
    const r = await fetch(`https://raw.githubusercontent.com/arpitsantoki-afk/BDA-Website/main/_data/projects/${slug}.json`);
    if (!r.ok) throw new Error('not found');
    const p = await r.json();

    const title = (p.name || 'Project') + ' — Blue Door Architects';
    const desc = (p.description || `${p.name} — ${p.category || 'Architecture'} project by Blue Door Architects in ${p.location || 'India'}.`).slice(0, 160).replace(/"/g, '&quot;');
    const img = p.cover_image
      ? (p.cover_image.startsWith('/') ? 'https://www.bluedoorarchitects.com' + p.cover_image : p.cover_image)
      : 'https://www.bluedoorarchitects.com/og-image.jpg';
    const canonicalUrl = `https://www.bluedoorarchitects.com/projects/${slug}`;
    const spaUrl = `https://www.bluedoorarchitects.com/?project=${slug}`;

    const allImages = (p.gallery || p.images || []).map(src =>
      src.startsWith('/') ? 'https://www.bluedoorarchitects.com' + src : src
    );

    const jsonLd = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      "name": p.name,
      "description": p.description || desc,
      "url": canonicalUrl,
      "image": allImages.length ? allImages : [img],
      "dateCreated": p.year ? p.year + '-01-01' : undefined,
      "locationCreated": p.location ? { "@type": "Place", "name": p.location + ', India' } : undefined,
      "creator": { "@type": "Organization", "name": "Blue Door Architects", "url": "https://www.bluedoorarchitects.com" },
      "genre": p.category || "Architecture"
    });

    const galleryHtml = allImages.slice(0, 8).map(src =>
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
      headers: { 'Content-Type': 'text/html;charset=utf-8', 'Cache-Control': 'public,max-age=3600' }
    });
  } catch(e) {
    // Project not found — redirect to homepage
    return new Response(null, {
      status: 302,
      headers: { 'Location': 'https://www.bluedoorarchitects.com/', 'Cache-Control': 'no-store' }
    });
  }
}
