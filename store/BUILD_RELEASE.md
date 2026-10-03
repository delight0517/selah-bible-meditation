# Selah store build gate

Use the release checkout and its shared version descriptor.

1. Run `npm run sync:ios` from `mobile/`. Copying root files to `mobile/www` alone does not update Capacitor `ios/App/App/public`.
2. Build the native candidate.
3. Run `node mobile/scripts/check-native-web.mjs /absolute/App.app/public` against the built iOS app, including the archive app before export. The command rejects stale manifests or any mismatching resource hash. For the Mac app, pass its `Contents/Resources/www` directory.
4. Record exact version/build, source commit, artifact hash, visible runtime verification, export, upload and provider readback separately.

Build 22 packages are retained historical preparation; they are not the latest release candidate after main reconciliation and must not be uploaded. The current candidate is 1.0.10 / 25.
