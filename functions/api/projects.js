// Cloudflare Pages Function — returns list of all project JSON files
// Called by the website JS to auto-discover projects without a manifest

export async function onRequest(context) {
  // Fetch the GitHub API to list files in _data/projects/
  const res = await fetch(
    'https://api.github.com/repos/arpitsantoki-afk/BDA-Website/contents/_data/projects',
    {
      headers: {
        'User-Agent': 'BlueDoorArchitects-Website',
        'Accept': 'application/vnd.github.v3+json',
      }
    }
  );

  if (!res.ok) {
    return new Response(JSON.stringify({ projects: [] }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const files = await res.json();

  // Extract slugs from .json files only
  const slugs = files
    .filter(f => f.name.endsWith('.json'))
    .map(f => f.name.replace('.json', ''));

  return new Response(JSON.stringify({ projects: slugs }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    }
  });
}
