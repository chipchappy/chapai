"""
Generate a Google-compliant favicon set from the Clarity C logo.

Outputs to apps/web/public/:
  favicon.ico    (multi-size: 16, 32, 48)
  favicon-32.png
  favicon-48.png
  favicon-96.png
  favicon-192.png
  favicon-512.png
  apple-touch-icon.png  (180 px)

Also writes to apps/web/src/app/icon.png (Next App-Router favicon)
and apps/web/src/app/apple-icon.png.

Source: public/brand/clarity-c-logo.jpg (251x242, not square).
Strategy: paint onto a square sand-tinted canvas with a small inset so
the C glyph reads cleanly at 16x16.
"""

from PIL import Image, ImageFilter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "brand" / "clarity-c-logo.jpg"
PUBLIC = ROOT / "public"
APP = ROOT / "src" / "app"

# Warm sand background so the C reads on light browser chrome too
BG = (248, 239, 217, 255)  # matches --c-bg-elevated

def make_square(src_path: Path, size: int) -> Image.Image:
    src = Image.open(src_path).convert("RGBA")

    # Pad the non-square source to a square at the larger dimension
    side = max(src.width, src.height)
    sq = Image.new("RGBA", (side, side), BG)
    sq.paste(src, ((side - src.width) // 2, (side - src.height) // 2), src)

    # Upscale the working canvas then downscale to target size for sharper edges
    work_size = max(size * 2, 512)
    sq = sq.resize((work_size, work_size), Image.LANCZOS)

    # Compose with a small inset so the glyph isn't kissing the edges at small sizes
    inset_ratio = 0.06
    inset = int(work_size * inset_ratio)
    canvas = Image.new("RGBA", (work_size, work_size), BG)
    fit = sq.resize((work_size - 2 * inset, work_size - 2 * inset), Image.LANCZOS)
    canvas.paste(fit, (inset, inset), fit)

    return canvas.resize((size, size), Image.LANCZOS)

def main():
    print(f"Source: {SRC}")
    assert SRC.exists(), f"Logo source not found: {SRC}"

    # PNG sizes Google + browsers look for
    sizes = [32, 48, 96, 144, 192, 512]
    for s in sizes:
        out = PUBLIC / f"favicon-{s}.png"
        make_square(SRC, s).save(out, "PNG", optimize=True)
        print(f"  wrote {out.name}")

    # Apple touch icon
    apple = make_square(SRC, 180)
    apple.save(PUBLIC / "apple-touch-icon.png", "PNG", optimize=True)
    print("  wrote apple-touch-icon.png")

    # Multi-size ICO (Windows + crawler fallback)
    ico_sizes = [(16, 16), (32, 32), (48, 48)]
    base = make_square(SRC, 256)
    base.save(PUBLIC / "favicon.ico", format="ICO", sizes=ico_sizes)
    print("  wrote favicon.ico (16/32/48)")

    # Next App-Router favicon files (replace existing JPEGs)
    make_square(SRC, 512).save(APP / "icon.png", "PNG", optimize=True)
    apple.save(APP / "apple-icon.png", "PNG", optimize=True)
    print("  wrote src/app/icon.png + apple-icon.png")

    print("Done.")

if __name__ == "__main__":
    main()
