# Selah Mobile

Capacitor hosts the published Selah app on iOS and Android. The app bundles `index.html` and one Matthew translation for each supported interface language (Korean, English, and Japanese) plus a compact catalog of translations available for download, so the language default is available offline. Additional translations are downloaded only when selected and stored in the app's private WebView IndexedDB; each download includes Matthew only. Reflection data stays in private WebView storage and can sync through BlueCloud after sign-in. The source website and its working-tree changes are left separate.

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
