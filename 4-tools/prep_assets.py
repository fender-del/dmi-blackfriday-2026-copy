"""Copy + optimise assets from the DMI Website Design V3 project into site/assets."""
import json, shutil
from pathlib import Path
from PIL import Image

SRC = Path(r"C:\Users\ASUS\Downloads\DMI- Service Website-Design")
V3 = SRC / "2-preview-v3" / "assets"
OUT = Path(__file__).resolve().parent.parent / "site" / "assets"
OUT.mkdir(parents=True, exist_ok=True)

def save(im, name, q=82):
    im.save(OUT / name, "WEBP", quality=q, method=6)

# logo, device frames
for f in ["logo-dmi-dark-header.webp", "logo-dmi-light-header.webp", "mock-imac-frame.webp", "mock-iphone-frame.webp"]:
    shutil.copy(V3 / f, OUT / f)

# Standard examples: top 16:10 crop of the full-page captures
STD = ["first-choice-detailing", "daniels-detailing", "diwal-auto-pros", "atd-detailing", "slim-s-detailing-studio"]
for s in STD:
    im = Image.open(V3 / "v3" / "std" / f"{s}.webp").convert("RGB")
    im = im.crop((0, 0, 760, 475))
    save(im, f"std-{s}.webp")

# Premium designs 1-5: desktop shots + phone shots
for i in range(1, 6):
    im = Image.open(V3 / f"theme-{i}-d.webp").convert("RGB")
    im.thumbnail((1200, 750)); save(im, f"prm-{i}-d.webp")
    im = Image.open(V3 / f"theme-{i}-m.webp").convert("RGB")
    im.thumbnail((400, 866)); save(im, f"prm-{i}-m.webp")

# Reviews (real, from detailersmovement.com/reviews)
revs = json.loads((SRC / "4-tools" / "v3" / "reviews" / "reviews.json").read_text(encoding="utf-8"))
for r in revs:
    shutil.copy(V3 / f"rev-{r['id']}.webp", OUT / f"rev-{r['id']}.webp")
(OUT.parent / "reviews.json").write_text(json.dumps(revs, ensure_ascii=False, indent=1), encoding="utf-8")
print("ok", len(list(OUT.iterdir())), "files")
