# Selah iOS and Mac release preparation

Fresh source: `3c42697d2e0822ff95b834be11cea567480edbab` (main, PR #115). Shared version: 1.0.9 / 21.

ASC API access is ready. Neither Selah bundle is present in the current account app list. No app was submitted or published.

## Native packages

- iOS: Capacitor target, team V3J8MR637G. Fresh checkout requires `npm ci` and `npm run sync:ios` before archive because native web resources are generated and ignored by Git.
- Mac: SwiftUI/WKWebView target copied from existing macOS working files without changing their source checkout. Snapshot is not yet merged into canonical main. Mac native UI currently uses English and needs localization and an App Store icon. Mac network client sandbox is enabled.
- Mac version plist now uses shared marketing/build settings rather than the older hardcoded 1.0 / 1.

## Remaining release gates

Use release-manifest.json for outstanding gates. Draft listing copy is saved in listing-drafts.json; it has not been uploaded. No screenshot was represented as native runtime proof. Existing THIRD_PARTY_NOTICES.md explicitly leaves worldwide redistribution rights for bundled Korean Revised Version 1961 unverified. Confirm rights or replace that bundled edition with a verified permitted edition before distribution. Preserve personal reflection data during any device update.

Shared backlog 474637700f55 (Selah/Pomodoro/RiseSync correlation ID instrumentation and real journey) remains pending; Windows cannot be validated today.
