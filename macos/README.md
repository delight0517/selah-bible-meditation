# Selah for Mac

This is a separate native SwiftUI macOS app target. It preserves the existing web and iOS apps and adds a Mac toolbar, keyboard commands, and a dedicated focus-reading action.

## Build

```sh
xcodegen generate
xcodebuild -project SelahMac.xcodeproj -scheme Selah -configuration Release -destination 'generic/platform=macOS' -archivePath build/Selah.xcarchive archive CODE_SIGNING_ALLOWED=NO
```

The app loads the published Selah site so sign-in and BlueCloud continue to use the existing service. Network access is required. The App Store review may require more Mac-specific functionality under guideline 4.2; this target is a functional submission candidate, not a guarantee of approval. A developer-team-signed archive and App Store Connect submission are still required.
