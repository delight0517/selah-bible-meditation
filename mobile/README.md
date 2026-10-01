# Selah Mobile

Capacitor hosts the published Selah app on iOS and Android. The app bundles `index.html` and a compact translation catalog. The reader can access all 66 books for Korean (Korean Bible 1910), English (World English Bible), and Chinese (Union Version) defaults; the Japanese interface uses the complete World English Bible because the available Japanese API translation contains only the New Testament. Chapters load on first access and are cached in the app's private WebView IndexedDB for offline rereading. Reflection data stays in private WebView storage and can sync through BlueCloud after sign-in. The source website and its working-tree changes are left separate.

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
