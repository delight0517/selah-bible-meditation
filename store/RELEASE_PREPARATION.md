# Selah iOS and Mac release preparation

Fresh source: `3c42697d2e0822ff95b834be11cea567480edbab` (main, PR #115). Shared version: 1.0.10 / 22. See release-manifest.json for the current source base and implementation commit.

ASC API access is ready. Neither Selah bundle is present in the current account app list. No app was submitted or published.

## Native packages

- iOS: Capacitor target, team V3J8MR637G. Fresh checkout requires `npm ci` and `npm run sync:ios` before archive because native web resources are generated and ignored by Git.
- Mac: SwiftUI/WKWebView target copied from existing macOS working files without changing their source checkout. Snapshot is not yet merged into canonical main. Mac native strings now have eight locale resources and an App Store icon using the existing iOS artwork. These new resources require a fresh signed Mac archive; the exported build 22 does not include them. The shared reader is now packaged in the Mac bundle, with local assets served via WKURLSchemeHandler. Mac network client sandbox is enabled.
- Mac version plist now uses shared marketing/build settings rather than the older hardcoded 1.0 / 1.

## Bible storage

See BIBLE_DOWNLOAD_POLICY.md for 30-day expiry, chapter resume, cache-first reading and OS background limits.

## Remaining release gates

Use release-manifest.json for outstanding gates. Draft listing copy is saved in listing-drafts.json; it has not been uploaded. No screenshot was represented as native runtime proof. Existing THIRD_PARTY_NOTICES.md explicitly leaves worldwide redistribution rights for bundled Korean Revised Version 1961 unverified. Confirm rights or replace that bundled edition with a verified permitted edition before distribution. Preserve personal reflection data during any device update.

Shared backlog 474637700f55 (Selah/Pomodoro/RiseSync correlation ID instrumentation and real journey) remains pending; Windows cannot be validated today.

## Authorized ad-free first release

The user authorized iOS and Mac release without advertisements on 2026-10-03. PR #121 remains deferred; this release contains no AdMob SDK. The ASC New App form is unfinished. Native menu automation returned invalid element IDs/noWindowsAvailable, so no app creation is claimed. Official Korean Bible Society copyright notice was checked; worldwide redistribution permission remains unverified.
