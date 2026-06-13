# BDA Website — Project Architecture & Context

> **Blue Door Architects (BDA)** — luxury architecture & turnkey design firm, Gandhinagar, Gujarat, India.  
> Sub-brand of **The Palm Group**. Secondary brand: **Unikraft** (solid wood furniture, OBLIQUE collection).  
> Owner/admin: **Arpit Santoki** (`arpitsantoki-afk`)

---

## 1. Live URLs

| URL | Purpose |
|-----|---------|
| `https://bluedoorarchitects.com` | Primary live domain |
| `https://www.bluedoorarchitects.com` | www variant (both point to same Worker) |
| `https://bda-website.info-unikraft.workers.dev` | Cloudflare Worker URL (always works) |
| `https://bluedoorarchitects.com/admin` | Decap CMS admin panel |

---

## 2. Repository

- **GitHub org/user:** `arpitsantoki-afk`
- **Repo:** `arpitsantoki-afk/BDA-Website`
- **Branch:** `main` (auto-deploys to Cloudflare on every push)

### Key files

```
/
├── index.html                  ← Entire website (single HTML file, ~74KB)
├── wrangler.jsonc              ← Cloudflare Worker config
├── .assetsignore               ← Excludes .git from Cloudflare asset upload
├── .gitignore
├── _headers                    ← HTTP cache-control headers
├── logo-white.png              ← BDA logo (white, for dark backgrounds)
├── logo-black.png              ← BDA logo (black, for light backgrounds)
├── unikraft_logo.png           ← Unikraft logo
├── admin/
│   └── config.yml              ← Decap CMS configuration
├── _data/
│   ├── settings.json           ← Site-wide settings (phone, email, social URLs etc.)
│   ├── projects-index.json     ← Controls project order on homepage
│   ├── hero.json               ← Hero section content
│   ├── unikraft.json           ← Unikraft section content
│   ├── production.json         ← Manufacturing section content
│   ├── projects/               ← One JSON file per project
│   │   ├── shades-of-white.json
│   │   ├── stillness-in-timber.json
│   │   ├── unity-office.json
│   │   ├── olive-oak.json
│   │   ├── where-stone-breathes.json
│   │   ├── terra-calm.json
│   │   ├── the-cognac-house.json
│   │   └── blush-birch.json
│   ├── publications/           ← Press & publications cards
│   └── testimonials/           ← Client testimonials
├── images/
│   └── uploads/                ← All media uploaded via CMS
└── functions/
    └── api/
        ├── auth.js             ← GitHub OAuth handler for CMS login
        └── projects.js         ← (Legacy) project listing API
```

---

## 3. Infrastructure

### Cloudflare

- **Account email:** `info.unikraft@gmail.com`
- **Account ID:** `e87173c892aeaf3f199a7728857f7c1b`
- **Worker name:** `bda-website`
- **Zone ID (bluedoorarchitects.com):** `45f0e0102f80c61b94fc496d99f2582f`
- **Deploy command:** `npx wrangler deploy`
- **Build trigger:** Every push to `main` branch
- **Asset directory:** `.` (repo root, with `.git` excluded via `.assetsignore`)
- **SPA mode:** `not_found_handling: "single-page-application"` — serves `index.html` for all routes

### CMS OAuth

- **OAuth Worker URL:** `https://cms-oauth.info-unikraft.workers.dev`
- **GitHub OAuth App Client ID:** `Ov23lit8gNRJzxceLwmY`
- **OAuth origin (in `functions/api/auth.js`):** `https://bluedoorarchitects.com`

### DNS (Cloudflare manages bluedoorarchitects.com)

| Record | Type | Content |
|--------|------|---------|
| `bluedoorarchitects.com` | AAAA (Worker) | `100::` (locked, managed by Worker) |
| `www.bluedoorarchitects.com` | AAAA (Worker) | `100::` (locked, managed by Worker) |
| `bluedoorarchitects.com` | MX | `alt1.aspmx.l.google.com` (Google email — do NOT delete) |

**Nameservers:** `algin.ns.cloudflare.com` + `riya.ns.cloudflare.com` (set in Squarespace)

---

## 4. Content Management (Decap CMS)

Access at `https://bluedoorarchitects.com/admin`

### Collections

| Collection | Location | Purpose |
|-----------|---------|---------|
| **Projects Index** | `_data/projects-index.json` | Controls which projects appear and in what order |
| **Projects** | `_data/projects/*.json` | Individual project data |
| **Publications** | `_data/publications/*.json` | Press & publications cards |
| **Testimonials** | `_data/testimonials/*.json` | Client quotes |
| **Site Settings** | `_data/settings.json` | Global settings (contact, social, SEO) |
| **Hero** | `_data/hero.json` | Homepage hero section |
| **Unikraft** | `_data/unikraft.json` | Unikraft brand section |
| **Production** | `_data/production.json` | Manufacturing section |

### Project JSON structure

```json
{
  "name": "Project Display Name",
  "category": "Interior",
  "location": "Gandhinagar",
  "year": "2025",
  "cover_image": "/images/uploads/filename.webp",
  "description": "Optional short description",
  "images": [
    "/images/uploads/image1.webp",
    "/images/uploads/image2.webp"
  ],
  "featured": true,
  "order": 1
}
```

### Project order

Controlled by `_data/projects-index.json` — a list of slugs (filename without `.json`). The JS reads this file first, then fetches each project in that exact sequence. The `order` field in individual project JSONs is **ignored** — only `projects-index.json` controls display order.

### Image paths

- All CMS-uploaded images go to `images/uploads/`
- Path in JSON: `/images/uploads/filename.webp`
- Raw GitHub URL: `https://raw.githubusercontent.com/arpitsantoki-afk/BDA-Website/main/images/uploads/filename.webp`
- The JS in `index.html` handles path resolution automatically using `_RAW` and `_BASE` variables

### Publication logo

Each publication card can optionally show a logo image. Upload via Admin → Publications → Publication Logo field. If no logo is set, the outlet name text is shown instead.

---

## 5. index.html Architecture

The entire website is a **single HTML file** with inline CSS and JS. No build tool, no framework, no Node.js.

### Key JS variables

```js
var _RAW  = 'https://raw.githubusercontent.com/arpitsantoki-afk/BDA-Website/main/images/uploads/';
var _BASE = 'https://raw.githubusercontent.com/arpitsantoki-afk/BDA-Website/main/';
var _DATA = 'https://raw.githubusercontent.com/arpitsantoki-afk/BDA-Website/main/_data/projects/';
```

### Image URL resolution

```js
// For cover images and gallery images:
img.startsWith('/') ? _BASE + img.slice(1) : _RAW + img
```

### Project loading flow

1. Fetch `/_data/projects-index.json` → get ordered slug array
2. For each slug, fetch `/_data/projects/{slug}.json`
3. Attach `d._slug = slug` to each project object
4. Push to `allProjects[]` array
5. Call `renderProjects()` when all loaded

### Key functions

| Function | Purpose |
|----------|---------|
| `renderProjects()` | Builds mosaic grid tiles |
| `openProjModal(slug, title, type, cover, location, year)` | Opens project detail popup |
| `toggleMosaic()` | Show/hide additional projects in grid |
| `openLegalModal(type)` | Opens Privacy Policy or Terms popup |
| `loadJSON(url, callback)` | Generic JSON fetcher with cache-busting |
| `setText(id, val)` | Sets element inner text |
| `setHref(id, href, text)` | Sets element href and optional text |
| `setImg(id, src)` | Sets image src with path resolution |

### Script blocks (4 total)

1. **JSON-LD schema** (`application/ld+json`) — SEO structured data
2. **Small inline script** — loads Decap CMS if on `/admin` path
3. **Main script** (~17KB) — all site logic, data loading, interactions
4. **Legal modal script** — Privacy Policy and Terms of Use content

### CRITICAL: JS injection rules

- Never add backtick template literals inside the main script block (script 3) — it already uses template literals and nesting breaks parsing
- Always use a **separate `<script>` tag** for any new JS that needs template literals
- Use `+` string concatenation, not backticks, when injecting code into existing script blocks

---

## 6. Contact Form

Uses **Web3Forms** (zero-backend form submission service).

- **Access key:** `072310a8-f9f4-4894-9fdc-dd3072db2002`
- **Endpoint:** `https://api.web3forms.com/submit`
- **Sends to:** `info@bluedoorarchitects.com`
- **Subject:** `New Enquiry — Blue Door Architects`
- Includes bot honeypot field (`botcheck` checkbox, `display:none`)
- On success: hides form, shows `#fsuccess` div
- On error: re-enables submit button, shows alert

---

## 7. Settings JSON

Current `_data/settings.json`:

```json
{
  "studio_name": "Blue Door Architects",
  "tagline": "Architecture & Turnkey Design",
  "phone": "+91 74340 06001",
  "email": "info@bluedoorarchitects.com",
  "location": "India",
  "instagram": "https://www.instagram.com/bluedoor_architects/",
  "pinterest": "https://in.pinterest.com/bluedoorarchitects/",
  "palm_group_url": "https://www.thepalm.in/",
  "palm_group_desc": "A diversified organisation...",
  "canonical_url": "https://www.bluedoorarchitects.com/"
}
```

The settings are loaded dynamically via `loadJSON('/_data/settings.json', ...)` and applied to DOM elements by ID.

---

## 8. Current Projects (in display order)

| Slug | Name | Category |
|------|------|----------|
| `shades-of-white` | Shades of White | Interior |
| `stillness-in-timber` | Stillness in Timber | Interior |
| `unity-office` | Unity Office | Commercial |
| `olive-oak` | Olive & Oak | Interior |
| `where-stone-breathes` | Where Stone Breathes | Interior |
| `terra-calm` | Terra Calm | Interior |
| `the-cognac-house` | The Cognac House | Interior |
| `blush-birch` | Blush & Birch | Interior |

To add a new project: Admin → Projects → New → fill fields → Publish → then Admin → Projects Index → add slug → Publish.

---

## 9. How to Make Code Changes

### Via GitHub API (preferred — no Node.js needed)

```python
import urllib.request, json, base64

TOKEN = "ghp_..."  # GitHub Personal Access Token (repo scope)
REPO = "arpitsantoki-afk/BDA-Website"

# Fetch a file
url = f"https://api.github.com/repos/{REPO}/contents/index.html"
req = urllib.request.Request(url, headers={"Authorization": f"token {TOKEN}"})
with urllib.request.urlopen(req) as r:
    data = json.load(r)
sha = data['sha']
content = base64.b64decode(data['content']).decode()

# Commit a file
payload = json.dumps({
    "message": "commit message",
    "content": base64.b64encode(content.encode()).decode(),
    "sha": sha
}).encode()
req = urllib.request.Request(url, data=payload,
    headers={"Authorization": f"token {TOKEN}", "Content-Type": "application/json"},
    method='PUT')
```

### Via CMS

Go to `https://bluedoorarchitects.com/admin` → log in with GitHub → edit content → Publish.

### Deployment

Every commit to `main` triggers an automatic Cloudflare build + deploy (~25 seconds). If a build fails, go to Cloudflare → Workers & Pages → bda-website → Deployments → click the failed build → Retry build.

---

## 10. Known Constraints & Gotchas

1. **Single HTML file** — everything lives in `index.html`. Be careful with large edits.
2. **No local Node.js** — Arpit doesn't have Node installed locally. All changes via GitHub API or CMS.
3. **Image paths** — CMS always writes `/images/uploads/filename`. The `startsWith('/')` check in JS handles URL building. Never hardcode `_RAW +` without this check.
4. **Project slug** — not stored in JSON. Derived at load time from filename: `d._slug = slug`. Use `p._slug` not `p.slug` in the tile builder.
5. **Field names** — project JSON uses `name` (not `title`) and `category` (not `type`).
6. **Backticks in JS** — the main script block uses template literals. Never inject additional backticks into it. Use a separate `<script>` tag instead.
7. **Logo files** — `logo-white.png`, `logo-black.png`, `unikraft_logo.png` must never be processed or modified. Copy completely unmodified only.
8. **`.assetsignore`** — critical file. Excludes `.git` folder from Cloudflare uploads. Without it, builds fail with "asset too large" (40.8MB `.git` pack file error).
9. **`wrangler.jsonc`** — must NOT have `"binding": "ASSETS"` — causes "Cannot use assets with a binding in an assets-only Worker" error.
10. **CMS OAuth origin** — `functions/api/auth.js` must have `ORIGIN = "https://bluedoorarchitects.com"` for admin login to work.

---

## 11. Related Cloudflare Resources

| Resource | Detail |
|----------|--------|
| Workers & Pages → bda-website | Main worker deployment |
| bluedoorarchitects.com zone | DNS for the custom domain |
| cms-oauth.info-unikraft.workers.dev | Separate OAuth worker for CMS GitHub login |
| KV namespace | Not currently used in bda-website |

---

## 12. Brand & Design Notes

- **Primary colour:** `#c9a96e` (gold / `--gold`)
- **Background:** `#f5f0e8` (warm cream / `--warm`)
- **Text:** `#1a1a16` (near black / `--ink`)
- **Fonts:** Cormorant Garant (serif, headings) + Jost (sans, body)
- **Design language:** Luxury editorial — minimal, high whitespace, typographic
- **Sections (in order):** Hero → Intro/Philosophy → Selected Work → Services → Unikraft → Studio/Philosophy → Manufacturing → Press → Testimonials → Contact → Footer

---

*Last updated: June 2026. For questions, refer to session history in this project.*
