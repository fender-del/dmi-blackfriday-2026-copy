"""Build site/index.html from the live DMI Website Design V3 page.

Keeps V3's own header, hero wall, Standard, Premium, Reviews and footer (CSS + JS untouched),
drops Before/After, Custom, Simulators, CRM, and swaps the end CTA/FAQ for the Black Friday quote form.
Re-run after any V3 change:  python 4-tools/build_from_v3.py
"""
import re, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
V3 = Path(r"C:\Users\ASUS\Downloads\DMI- Service Website-Design\2-preview-v3")
SITE = ROOT / "site"
PARTS = ROOT / "4-tools" / "parts"

src = (V3 / "index.html").read_text(encoding="utf-8")


def section(name):
    m = re.search(r"<!-- SECTION:%s -->.*?<!-- /SECTION:%s -->" % (re.escape(name), re.escape(name)), src, re.S)
    assert m, name
    return m


def must_replace(s, a, b, count=1):
    assert a in s, a[:80]
    return s.replace(a, b, count)


html = src

# 1. drop blocks we don't sell on this page
for name in ["work", "custom", "simulators", "crm"]:
    m = re.search(r"\n?<!-- SECTION:%s -->.*?<!-- /SECTION:%s -->\n?" % (name, name), html, re.S)
    if m:
        html = html[: m.start()] + "\n" + html[m.end():]

# 2. head: title, description, BF styles
html = re.sub(r"<title>.*?</title>", "<title>Black Friday Website Sale 2026 | Detailers Movement</title>", html, 1, re.S)
html = re.sub(r'<meta name="description" content="[^"]*">',
              '<meta name="description" content="50% off website design for detailing, ceramic coating, PPF and tint businesses. Reserve your Standard or Premium website with a $99 deposit.">',
              html, 1)
html = must_replace(html, "</head>", '<link rel="stylesheet" href="assets/bf-v3.css">\n</head>')

# 3. header: one Black Friday CTA instead of Book a call + Login
for cta in re.findall(r'<div class="(?:hd-cta|dr-cta)">.*?</div>', html, re.S):
    cls = "hd-cta" if "hd-cta" in cta else "dr-cta"
    html = html.replace(cta, f'<div class="{cls}"><a class="hb hb-primary" href="#claim"><span>Get the Black Friday deal</span></a></div>')

# 4. hero: keep the wall, replace the copy with headline + lead form
hero_copy = re.search(r' <div class="wrap copy">.*?\n </div>\n', html, re.S)
assert hero_copy
html = html[: hero_copy.start()] + (PARTS / "hero-copy.html").read_text(encoding="utf-8") + html[hero_copy.end():]
# the wall's click-through must ignore the form
html = must_replace(html, "over.closest('.copy a,.copy button,.dmx-hd')", "over.closest('.copy a,.copy button,.bf-form,.dmx-hd')")
html = must_replace(html, "if(e.target.closest('a,button')&&!e.target.closest('.tile'))return;",
                    "if(e.target.closest('.bf-form'))return;if(e.target.closest('a,button')&&!e.target.closest('.tile'))return;")

# 5. end: BF quote form + FAQ (no Custom) instead of the old CTA/FAQ
end = re.search(r"<!-- SECTION:faq-cta -->.*?<!-- /SECTION:faq-cta -->", html, re.S)
html = html[: end.start()] + (PARTS / "end.html").read_text(encoding="utf-8") + html[end.end():]

# 5b. Black Friday offer (Ed, 09/11): 50% off model, Standard normally $1,000 -> $500 (up to 20 pages),
#     Premium normally $2,000 -> $990 (up to 30 pages, 3 months local SEO valued $897, free 5-year ceramic 50ml),
#     hosting keeps both $25 and $50. Bottle photo is a temporary Apeax one until the DMI bottle arrives.
html = must_replace(html, 'Standard. <span class="tpx">$500</span><small>+ hosting from $25/month</small>',
                    'Standard. <s class="bf-was">$1,000</s> <span class="tpx">$500</span><small><em class="bf-pct">50% OFF</em> + hosting from $25/month</small>')
html = must_replace(html, 'Premium. <span class="tpx">$990</span><small>+ hosting from $25/month</small>',
                    'Premium. <s class="bf-was">$2,000</s> <span class="tpx">$990</span><small><em class="bf-pct">50% OFF</em> + hosting from $25/month</small>')
m = re.search(r'<li>(<svg[^>]*><path[^>]*/></svg>)Standard design &amp; build</li>', html)
assert m
chk = m.group(1)
std_inc = ["Up to 20 pages", "Mobile &amp; tablet optimised", "Lead forms &amp; contact integration",
           "SEO-friendly setup", "Google Analytics &amp; Search Console"]
html = html[: m.start()] + "".join(f"<li>{chk}{t}</li>" for t in std_inc) + html[m.end():]
# Premium is the best value (mock); Standard gets its own reserve button (mock: "Get the Standard Website")
html = must_replace(html, '<em class="bf-pct">50% OFF</em> + hosting from $25/month</small></h2>\n    <p class="tsub">Pick a design.',
                    '<em class="bf-pct">50% OFF</em> Best value · + hosting from $25/month</small></h2>\n    <p class="tsub">Pick a design.')
m = re.search(r'(<li class="ho">Hosting, 12-month commitment.*?</li>\n  </ul>)', html)
assert m
html = html[: m.end()] + '\n  <a class="btn btn-primary bf-std-go" href="checkout/?pkg=standard">Get the Standard website for $500</a>' + html[m.end():]
html = must_replace(html, '<p class="pr"><b>$500</b>+ hosting from $25/month</p>',
                    '<p class="pr"><s class="bf-was">$1,000</s> <b>$500</b>+ hosting from $25/month</p>')
html = must_replace(html, '<li>Website design &amp; build<b>$2,000</b></li>\n     <li>Local SEO, 3 months<b>$897</b></li>',
                    '<li>Premium design &amp; build, up to 30 pages<b>$2,000</b></li>\n'
                    '     <li>Everything in Standard<b>Included</b></li>\n'
                    '     <li>Local SEO, 3 months, valued at $897<b>Included</b></li>\n'
                    '     <li class="bf-gift"><img src="assets/bf-bottle-dmi.webp" alt="DMI Atomic G5 ceramic coating, 50ml bottle" width="213" height="360" loading="lazy">'
                    '<span>DMI Atomic G5 ceramic coating<small>5-year graphene coating, 50ml bottle</small></span><b>Free</b></li>')
html = must_replace(html, 'Normally<b data-v="2897">$2,897</b>', 'Normally<b data-v="2000">$2,000</b>')
html = must_replace(html, '<p class="p3-now">With Premium<strong>$990</strong></p>', '<p class="p3-now">Black Friday, 50% off<strong>$990</strong></p>')
html = must_replace(html, '<small>$2,897 value</small>', '<small>Normally $2,000</small>')

# 6. BF scripts: lead form + route "I want one like this" / "Choose this design" to the $99 checkout
html = must_replace(html, "</body>", '<script src="assets/bf.js"></script>\n<script src="assets/bf-v3.js"></script>\n</body>')

(SITE / "index.html").write_text(html, encoding="utf-8")

# 7. assets V3 needs (skip blocks we dropped)
SKIP = re.compile(r"^(ba4x3-|sim-|crm-|mock-ipad|demo-4-.*-v24)|^v3[\\/](mir|insp|paul)")
n = 0
for f in (V3 / "assets").rglob("*"):
    if f.is_dir():
        continue
    rel = f.relative_to(V3 / "assets")
    if SKIP.search(str(rel)):
        continue
    dst = SITE / "assets" / rel
    if not dst.exists() or dst.stat().st_mtime < f.stat().st_mtime:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(f, dst)
        n += 1
print("built site/index.html,", len(html) // 1024, "KB; copied", n, "asset files")
