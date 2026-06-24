import json, re, glob

idx_data = json.load(open("_data/projects-index.json"))
slugs = idx_data["projects"]

projects = []
for slug in slugs:
    try:
        p = json.load(open(f"_data/projects/{slug}.json"))
        p["slug"] = slug
        projects.append(p)
    except Exception as e:
        print(f"Warning: could not load {slug}: {e}")

def proj_card(p):
    name = p.get("name", "")
    location = p.get("location", "")
    year = str(p.get("year", ""))
    category = p.get("category", "")
    description = p.get("description", "")
    desc_short = description[:150] + "..." if len(description) > 150 else description
    slug = p.get("slug", "")
    return (
        '  <article class="proj-card-static" data-slug="' + slug + '" style="display:none" aria-hidden="true">\n'
        '    <h3>' + name + '</h3>\n'
        '    <p class="proj-meta-static">' + category + ' &middot; ' + location + ' &middot; ' + year + '</p>\n'
        '    <p class="proj-desc-static">' + desc_short + '</p>\n'
        '  </article>'
    )

cards_html = "\n".join(proj_card(p) for p in projects)
static_block = "<!-- PROJ-STATIC-START -->\n" + cards_html + "\n  <!-- PROJ-STATIC-END -->"

with open("index.html", "r") as f:
    content = f.read()

if "<!-- PROJ-STATIC-START -->" in content:
    content = re.sub(
        r"<!-- PROJ-STATIC-START -->.*?<!-- PROJ-STATIC-END -->",
        static_block, content, flags=re.DOTALL
    )
else:
    import sys; print("ERROR: PROJ-STATIC markers not found"); sys.exit(1)

with open("index.html", "w") as f:
    f.write(content)

print(f"Built {len(projects)} project cards into index.html")
