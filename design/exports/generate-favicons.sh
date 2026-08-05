#!/bin/bash
set -euo pipefail

SVG="design/favicon.svg"
OUTDIR="design/exports"
mkdir -p "$OUTDIR"

sizes=(512 180 64 48 32 16)
for s in "${sizes[@]}"; do
  echo "Rendering ${s}x${s}..."
  cairosvg "$SVG" -o "$OUTDIR/favicon-${s}.png" -w "$s" -h "$s"
done

# Create ICO containing common sizes (16/32/48/64)
if command -v magick >/dev/null 2>&1; then
  magick convert "$OUTDIR/favicon-16.png" "$OUTDIR/favicon-32.png" "$OUTDIR/favicon-48.png" "$OUTDIR/favicon-64.png" "$OUTDIR/favicon.ico"
  echo "Created $OUTDIR/favicon.ico"
else
  echo "ImageMagick (magick) not found; skipping ICO creation. Install ImageMagick to enable ICO generation."
fi

echo "Done. Generated files are in $OUTDIR"
