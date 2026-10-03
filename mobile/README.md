# Selah Mobile

Capacitor hosts the published Selah app on iOS and Android. The app bundles `index.html` and a compact translation catalog. The reader can access all 66 books for Korean (Korean Bible 1910), English (World English Bible), and Chinese (Union Version) defaults; the Japanese interface uses the complete World English Bible because the available Japanese API translation contains only the New Testament. The selected translation downloads automatically in the background when the native app or installed PWA opens online. Saved translation metadata and book chapters are read from the app’s private IndexedDB before any network request, and chapters in the selected book are retained in memory for quick navigation. Downloaded translations, including the default, expire 30 days after download starts. Chapters are committed separately and skipped on resume. Reading uses saved chapters first and the server for missing chapters; it never waits for the full download. Interrupted tasks resume when the app is reopened or connectivity returns. The OS may suspend a closed app; this WebView implementation does not claim a native background URLSession transfer. Initial complete download still needs a connection; the bundled Matthew text can be read immediately. The “Download complete translation” action can retry a failed initial download. Reflection data stays in private WebView storage and can sync through BlueCloud after sign-in. The source website and its working-tree changes are left separate.

## Build or refresh iOS

```sh
git fetch origin main
npm install
npm run sync:ios
npx cap open ios
```

## Android later

```sh
npx cap add android
npm run sync:android
npx cap open android
```

The bundle does not contain account/API tokens. Sign in inside Selah to connect an account. Safari's local data does not automatically move into the app; sign in to BlueCloud or import a backup to move existing reflections.
