# Selah for Mac

This is a separate native SwiftUI macOS app target. It preserves the existing web and iOS apps and adds a Mac toolbar, keyboard commands, and a dedicated focus-reading action.

## Local verification

Build from the repository root with a task-specific derived-data folder under the repository's ignored `work/` directory. Reuse that folder for incremental builds; do not create a new derived-data folder for each edit.

```sh
mkdir -p work/selah-macos-derived
xcodebuild -project macos/SelahMac.xcodeproj -scheme Selah -configuration Debug -destination 'platform=macOS' -derivedDataPath work/selah-macos-derived build
```

Before opening the app, verify the exact built bundle with the repository's `workflow-control verify-mac` and `codesign --verify --deep --strict`. If verification blocks launch, stop; do not relaunch an unsigned or rejected artifact. Do not use `CODE_SIGNING_ALLOWED=NO` as a local runtime shortcut. Local builds do not need notarization, but a valid local signing identity/profile must pass the verification gate.

Keep one reusable DerivedData directory. Remove it only after builds are stopped and its output is no longer needed. Do not archive for routine UI checks.

## External distribution

A developer-team-signed archive is a separate release artifact. Create one only for an authorized distribution workflow, use a stable archive path, and remove superseded archives after the verified delivery checkpoint. App Store Connect submission is separate. The App Store review may require more Mac-specific functionality under guideline 4.2; this target is a functional submission candidate, not a guarantee of approval.

The app loads the published Selah site so sign-in and BlueCloud continue to use the existing service. Network access is required.

## Foreground presence

Native NSApplication active/resigned events and a 20-second heartbeat signal the shared reader. Web input/toolbar focus never replaces native app activity. The hosted reader publishes the per-surface cloud presence; matching website and Pomodoro receiver deployment is required.

## Chapter navigation

Toolbar arrows and unmodified left/right arrow keys use the existing chapter navigation, including book boundaries. Horizontal two-finger trackpad gestures over Scripture turn one chapter per gesture; vertical scrolling, pinch zoom, editable controls, selected text and dialogs retain their normal behavior. WebKit browser-history swipes are disabled in this native reader. The script is packaged and injected locally; no public website deployment is required.
