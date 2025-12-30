#!/bin/bash

# Build script pour l'extension A KI PRI SA YÉ
# Prépare l'extension pour la distribution

set -e

echo "🚀 Building A KI PRI SA YÉ Extension..."

# Dossiers
EXTENSION_DIR="extension"
BUILD_DIR="extension/build"
DIST_DIR="extension/dist"

# Nettoyer les anciens builds
echo "🧹 Cleaning previous builds..."
rm -rf "$BUILD_DIR"
rm -rf "$DIST_DIR"

# Créer les dossiers de build
mkdir -p "$BUILD_DIR"
mkdir -p "$DIST_DIR"

# Copier les fichiers nécessaires
echo "📦 Copying files..."

# Manifest
cp "$EXTENSION_DIR/manifest.json" "$BUILD_DIR/"

# Source files
cp -r "$EXTENSION_DIR/src" "$BUILD_DIR/"

# Icons (à créer à partir des assets)
echo "🎨 Preparing icons..."
mkdir -p "$BUILD_DIR/icons"

# Vérifier si les icônes existent, sinon créer des placeholders
if [ -f "Assets/icon_128.webp" ]; then
  # Convertir les WebP en PNG si imagemagick est disponible
  if command -v convert &> /dev/null; then
    echo "Converting icons to PNG..."
    convert "Assets/icon_64.webp" -resize 16x16 "$BUILD_DIR/icons/icon-16.png"
    convert "Assets/icon_64.webp" -resize 32x32 "$BUILD_DIR/icons/icon-32.png"
    convert "Assets/icon_64.webp" -resize 48x48 "$BUILD_DIR/icons/icon-48.png"
    convert "Assets/icon_128.webp" "$BUILD_DIR/icons/icon-128.png"
  else
    echo "⚠️  ImageMagick not found. Please manually convert icons."
    echo "   Required: icon-16.png, icon-32.png, icon-48.png, icon-128.png"
    touch "$BUILD_DIR/icons/.placeholder"
  fi
else
  echo "⚠️  Source icons not found in Assets/. Creating placeholders."
  touch "$BUILD_DIR/icons/.placeholder"
fi

# Documentation
echo "📝 Copying documentation..."
cp "$EXTENSION_DIR/README.md" "$BUILD_DIR/"
cp "$EXTENSION_DIR/PRIVACY.md" "$BUILD_DIR/"

# Vérifier la structure
echo "✅ Verifying build structure..."
if [ -f "$BUILD_DIR/manifest.json" ] && \
   [ -d "$BUILD_DIR/src" ] && \
   [ -d "$BUILD_DIR/icons" ]; then
  echo "✅ Build structure is valid"
else
  echo "❌ Build structure is invalid"
  exit 1
fi

# Créer l'archive pour Chrome Web Store
echo "📦 Creating Chrome extension package..."
cd "$BUILD_DIR"
zip -r "../dist/akiprisaye-extension-chrome.zip" ./* -x "*.DS_Store"
cd - > /dev/null

# Pour Firefox, créer une version avec manifest adapté si nécessaire
echo "📦 Creating Firefox extension package..."
cd "$BUILD_DIR"
# Note: Firefox peut nécessiter des adaptations du manifest
zip -r "../dist/akiprisaye-extension-firefox.zip" ./* -x "*.DS_Store"
cd - > /dev/null

echo "✅ Build complete!"
echo ""
echo "📦 Packages created:"
echo "   - $DIST_DIR/akiprisaye-extension-chrome.zip"
echo "   - $DIST_DIR/akiprisaye-extension-firefox.zip"
echo ""
echo "📁 Unpacked extension: $BUILD_DIR"
echo ""
echo "🚀 Next steps:"
echo "   1. Test the extension from $BUILD_DIR"
echo "   2. Submit to Chrome Web Store: $DIST_DIR/akiprisaye-extension-chrome.zip"
echo "   3. Submit to Firefox Add-ons: $DIST_DIR/akiprisaye-extension-firefox.zip"
echo ""

# Afficher les statistiques
echo "📊 Build statistics:"
echo "   Total files: $(find "$BUILD_DIR" -type f | wc -l)"
echo "   Total size: $(du -sh "$BUILD_DIR" | cut -f1)"
echo "   Chrome package: $(du -sh "$DIST_DIR/akiprisaye-extension-chrome.zip" | cut -f1)"
echo "   Firefox package: $(du -sh "$DIST_DIR/akiprisaye-extension-firefox.zip" | cut -f1)"
