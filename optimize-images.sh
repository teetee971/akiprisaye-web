#!/bin/bash

# Image optimization script
# Converts large images to WebP format for better performance

echo "🖼️ Starting image optimization..."

cd "$(dirname "$0")/public"

# Check if we have any large images to optimize
for img in *.jpg *.jpeg *.png; do
  if [ -f "$img" ]; then
    file_size=$(stat -c%s "$img" 2>/dev/null || stat -f%z "$img" 2>/dev/null || echo "0")
    
    if [ "$file_size" -gt 500000 ]; then  # 500KB threshold
      echo "📦 Large image found: $img ($(echo "$file_size" | numfmt --to=iec))"
      
      # Get base name without extension
      base_name="${img%.*}"
      webp_name="${base_name}.webp"
      
      # Check if WebP version already exists
      if [ ! -f "$webp_name" ]; then
        echo "💡 WebP version recommended: $webp_name"
        echo "   Original: $img ($(echo "$file_size" | numfmt --to=iec))"
        echo "   Suggested compression: Use online tools or ImageMagick"
        echo "   Command: convert '$img' -quality 85 '$webp_name'"
      else
        echo "✅ WebP version already exists: $webp_name"
      fi
    fi
  fi
done

echo "✅ Image optimization analysis complete!"
echo ""
echo "📋 Next steps for manual optimization:"
echo "• Use online tools like squoosh.app for WebP conversion"
echo "• Or install ImageMagick: apt-get install imagemagick"
echo "• Target 85% quality for good balance of size/quality"
echo "• Update HTML to prefer WebP with fallback to original format"