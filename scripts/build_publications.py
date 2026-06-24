import json, re, glob

pub_files = sorted(glob.glob("_data/publications/*.json"))
pubs = []
for f in pub_files:
    with open(f) as fp:
        data = json.load(fp)
    if data.get("active", True):
        pubs.append(data)

pubs.sort(key=lambda x: x.get("order", 99))

def pub_card(p):
    url = p.get("url", "#")
    title = p.get("title", "")
    outlet = p.get("outlet", "")
    date = p.get("date", "")
    logo = p.get("logo", "")
    logo_html = (
        '<img src="' + logo + '" alt="' + outlet + ' logo" class="pub-logo" loading="lazy"/>'
        if logo else
        '<span class="pub-logo-placeholder">' + outlet + '</span>'
    )
    lines = [
        '    <a href="' + url + '" target="_blank" rel="noopener" class="pub-card rv d1">',
        '      <div class="pub-card-top">',
        '        <span class="pub-outlet">' + outlet + '</span>',
        '        ' + logo_html,
        '      </div>',
        '      <p class="pub-title">' + title + '</p>',
        '      <p class="pub-meta">' + date + '</p>',
        '    </a>',
    ]
    return "\n".join(lines)

cards_html = "\n".join(pub_card(p) for p in pubs)
static_block = "<!-- PUB-STATIC-START -->\n" + cards_html + "\n    <!-- PUB-STATIC-END -->"

with open("index.html", "r") as f:
    content = f.read()

if "<!-- PUB-STATIC-START -->" in content:
    content = re.sub(
        r"<!-- PUB-STATIC-START -->.*?<!-- PUB-STATIC-END -->",
        static_block, content, flags=re.DOTALL
    )
else:
    OLD = '<!-- Injected dynamically from _data/publications/*.json -->\n    <div class="pub-grid rv d1" id="pub-grid"></div>'
    NEW = '<!-- Injected dynamically from _data/publications/*.json -->\n    <div class="pub-grid rv d1" id="pub-grid">\n    ' + static_block + '\n    </div>'
    if OLD not in content:
        print("ERROR: pub-grid marker not found")
        exit(1)
    content = content.replace(OLD, NEW, 1)

with open("index.html", "w") as f:
    f.write(content)

print("Built " + str(len(pubs)) + " publication(s) into index.html")
