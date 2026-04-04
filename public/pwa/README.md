# PWA image outputs

Generate Android icons and iOS splash screens into this folder.

## Recommended generator command

Use pwa-asset-generator with the source icon at /public/pwa-icon.svg:

npx pwa-asset-generator ./public/pwa-icon.svg ./public/pwa --background "#f4f6fb" --theme-color "#0f1f43" --padding "20%" --icon-only --favicon

Then generate startup images and HTML tags:

npx pwa-asset-generator ./public/pwa-icon.svg ./public/pwa --background "#f4f6fb" --theme-color "#0f1f43" --splash-only --path-override "/pwa"

Expected outputs include files referenced by index.html, such as:
- apple-icon-180.png
- manifest-icon-192.maskable.png
- manifest-icon-512.maskable.png
- apple-splash-1170-2532.jpg
- apple-splash-1290-2796.jpg
- apple-splash-1536-2048.jpg
- apple-splash-1668-2388.jpg
- apple-splash-2048-2732.jpg
