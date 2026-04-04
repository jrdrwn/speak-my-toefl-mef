# Welcome to your Lovable project

TODO: Document your project here

## Progressive Web App setup

This app is now configured as a PWA with:

- A web app manifest at `/public/manifest.webmanifest`
- A basic offline-capable service worker at `/public/sw.js`
- Service worker registration in `/src/main.tsx`
- An in-app install prompt component for supported browsers and iOS guidance

## Custom splash screens (iOS and Android)

1. Use the source icon at `/public/pwa-icon.svg`.
2. Generate platform image assets into `/public/pwa`.
3. Keep file names matching the startup-image links already added in `index.html`.

Recommended commands:

```bash
npx pwa-asset-generator ./public/pwa-icon.svg ./public/pwa --background "#f4f6fb" --theme-color "#0f1f43" --padding "20%" --icon-only --favicon
npx pwa-asset-generator ./public/pwa-icon.svg ./public/pwa --background "#f4f6fb" --theme-color "#0f1f43" --splash-only --path-override "/pwa"
```

The generated assets support:

- Android install icon and splash metadata via `manifest.webmanifest`
- iOS home screen icon and startup images via `<link rel="apple-touch-startup-image">`
