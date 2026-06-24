#!/usr/bin/env python3
"""Auto-generates 800px mobile WebP versions of all images in images/uploads/.
Runs via GitHub Actions on every push that touches images/uploads/.
Skips images that already have a mobile version or are already <= 800px wide.
Safe to run multiple times -- idempotent.
"""
import os, glob
from PIL import Image

UPLOADS = "images/uploads"
MOBILE_WIDTH = 800
QUALITY = 82

def make_mobile(src_path):
    mobile_path = src_path.replace(".webp", "-mobile.webp")
    if os.path.exists(mobile_path):
        return False
    try:
        img = Image.open(src_path).convert("RGB")
    except Exception as e:
        print(f"  SKIP: {os.path.basename(src_path)}: {e}")
        return False
    if img.width <= MOBILE_WIDTH:
        return False
    ratio = MOBILE_WIDTH / img.width
    new_h = int(img.height * ratio)
    mobile = img.resize((MOBILE_WIDTH, new_h), Image.LANCZOS)
    mobile.save(mobile_path, "WEBP", quality=QUALITY, method=6)
    orig_kb = os.path.getsize(src_path) // 1024
    mob_kb = os.path.getsize(mobile_path) // 1024
    saving = round((1 - mob_kb / max(orig_kb, 1)) * 100)
    print(f"  Created: {os.path.basename(mobile_path)} ({orig_kb}KB -> {mob_kb}KB, {saving}% smaller)")
    return True

originals = [
    f for f in glob.glob(f"{UPLOADS}/*.webp")
    if "-mobile." not in f
]

print(f"Found {len(originals)} original images to check...")
created = 0
for src in sorted(originals):
    if make_mobile(src):
        created += 1

print(f"Done. Created {created} new mobile image(s).")
