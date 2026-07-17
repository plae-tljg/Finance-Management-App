#!/usr/bin/env bash
# Bundle the Expo web app into ./dist and copy it into the Android assets folder
# so the embedded HTTP server can serve the SPA at runtime.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "→ Exporting Expo web bundle..."
npx expo export --platform web

echo "→ Copying dist/ into android/app/src/main/assets/web/..."
rm -rf android/app/src/main/assets/web
mkdir -p android/app/src/main/assets/web
cp -R dist/. android/app/src/main/assets/web/

echo "✓ Web bundle ready at android/app/src/main/assets/web/"
echo "  Next: npm run android (or ./gradlew assembleRelease) to build the APK."