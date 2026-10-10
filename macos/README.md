# Selah for Mac

This is a separate native SwiftUI macOS app target. It preserves the existing web and iOS apps and adds a Mac toolbar, keyboard commands, and a dedicated focus-reading action.

## Build

```sh
xcodegen generate
xcodebuild -project SelahMac.xcodeproj -scheme Selah -configuration Release -destination 'generic/platform=macOS' -archivePath build/Selah.xcarchive archive CODE_SIGNING_ALLOWED=NO
```

The app loads the published Selah site so sign-in and BlueCloud continue to use the existing service. Network access is required. The App Store review may require more Mac-specific functionality under guideline 4.2; this target is a functional submission candidate, not a guarantee of approval. A developer-team-signed archive and App Store Connect submission are still required.

## Foreground presence
Native NSApplication active/resigned events and a 20-second heartbeat signal the shared reader. Web input/toolbar focus never replaces native app activity. The hosted reader publishes the per-surface cloud presence; matching website and Pomodoro receiver deployment is required.

## Chapter navigation
Toolbar arrows and unmodified left/right arrow keys use the existing chapter navigation, including book boundaries. Horizontal two-finger trackpad gestures over Scripture turn one chapter per gesture; vertical scrolling, pinch zoom, editable controls, selected text and dialogs retain their normal behavior. WebKit browser-history swipes are disabled in this native reader. The script is packaged and injected locally; no public website deployment is required.
