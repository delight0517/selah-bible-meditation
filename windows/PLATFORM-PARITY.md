# Selah macOS and Windows parity

## Canonical source

The repository's [Mac setup guide](../README.md#mac에서-앱처럼-열기) describes Safari's **Add to Dock** web app. Read-only inspection of the Mac also found a separate installed `Selah Mac.app` (`com.delight0517.selah.mac`). Its universal x86_64/arm64 binary links SwiftUI, AppKit, and WebKit, targets macOS 14+, and contains the same hosted Selah URL. Its signed entitlements include app sandbox and network-client access; no version/build plist keys or other permission usage descriptions were found. The native shell's source project was not found in the checked Mac Selah checkout or in the searched `~/Documents/Codex` and `~/appDev` Swift/Xcode sources; its exact UI, storage behavior, version, and build workflow remain unconfirmed. GitHub Pages serves root `index.html` from `main`; Windows Edge PWA uses that same hosted UI and application logic.

The Mac Safari web app, Mac WebKit wrapper, and Windows Edge PWA use the same hosted product source. The entry shells differ, but scripture reading, reflection behavior, account flows, and data formats run in that shared web app. BlueCloud synchronization is the shared data path after sign-in; unauthenticated browser/WebKit storage remains app-profile-specific. The Mac source handoff request remains open, so this document separates installed-binary evidence from source-level details that still need Mac confirmation.

## Shared user data

Both desktop entry points use the same BlueCloud contract at `GET/PUT /api/cloud-state/selah` when the user signs in. The checked-in [`selah-cloud-state.schema.json`](../contracts/selah-cloud-state.schema.json) defines these top-level fields:

| Data area | Contract fields |
| --- | --- |
| Reflection records and study cards | `reflections`, `cards` |
| QT library and selection | `qtLibrary`, `selectedQt` |
| Passage and reading position | `passage`, `customPassage`, `customPassageActive`, `readingState` |
| Meditation history and feedback | `meditationFeedback`, `attendanceDays`, `meditationPlaces`, `meditationSession` |
| Prompts and AI conversation context | `feedbackPrompt`, `gptContext`, `bibleChats` |
| Reading preferences and language | `readerPrefs`, `customFontData`, `language`, `bibleContentLanguage` |
| Server revision | `_rev` |

`language` is the app interface locale. The optional `bibleContentLanguage` object stores an explicit Scripture text-language choice (`code`, `updatedAt`) separately; if it is absent, the reader follows the interface locale. Greater `updatedAt` wins, and equal timestamps resolve to the lexicographically smaller language code so simultaneous edits converge the same way on both platforms. The selected translation ID and downloaded chapter cache remain profile-local because each browser may have different locally installed translations.

The Japanese default now uses the bundled Japanese Matthew text from the public-domain 1965 Shinkaiyaku New Testament (`matthew-jpn1965.json`, translation ID `jpn_loc`); it no longer falls back to the English World English Bible when Japanese is selected.

The complete-Bible download uses the local `selah-bible-library` IndexedDB database. The cache is per browser profile and is excluded from both the BlueCloud cloud-state payload and portable backup; download it separately on Mac and Windows. Default bundled translations are retained, while additional translations unused for 30 days are removed. The selected text language is separate from the UI locale and syncs as `bibleContentLanguage`; a selected non-default translation and its downloaded chapters remain local to each browser profile.

Anonymous records stay in the local storage belonging to that browser app. Safari's Dock app and Edge's PWA have separate local stores; users can move records with the portable backup format in [`selah-portable-backup.schema.json`](../contracts/selah-portable-backup.schema.json). Backup v1 carries user state, draft data, and an explicit Bible text-language preference while excluding the source owner, server revision, and credentials. An authenticated cross-device sync round trip has not been verified in this environment.

## Platform-specific entry and installation

| Area | macOS | Windows |
| --- | --- | --- |
| Entry/install | Safari **File → Add to Dock** (macOS Sonoma 14+) or installed `Selah Mac.app` WebKit wrapper. | Install the hosted site as an Edge PWA; the manifest includes standalone display, app icons, and reading/meditation shortcuts. |
| Launch | Safari web app or `Selah Mac.app` from Applications/Dock/Spotlight. | Edge Apps, desktop/Start shortcut, or `Launch-Selah.cmd`. |
| Local records | Safari web app and WebKit wrapper have platform-owned storage; exact wrapper sharing behavior remains unconfirmed. | Edge app's local browser storage. |
| Offline Scripture | Downloaded chapters use local IndexedDB; extra translations expire after 30 days without use. | Same shared feature and retention policy in Edge; cache remains profile-local. |

The shell, installer, app menu, shortcuts, and local browser profile are platform-specific. Mac has an installed native SwiftUI/WebKit wrapper; Windows currently has an Edge PWA/app-window launcher rather than a native Windows binary. Scripture, reading progress, reflection data, account sync, and backup formats come from the shared web source. Website changes update both platforms without maintaining separate copies of the product UI.

## Current evidence and open verification

- Source basis: root `README.md`, root `index.html`, the manifest, and the two contracts linked above.
- Parity change set: PR [#46](https://github.com/delight0517/selah-bible-meditation/pull/46), merged at `b7b70a0`; it adds an explicit shared Scripture text-language preference and keeps translation downloads profile-local. GitHub Pages deployment completed for the merge commit.
- Current source readback is `origin/main` at `06415368896fa66777159b49b01eed68af3a37a8` (root `index.html` last changed at `f197164`; manifest shortcut entries at `404fd53`). Live readback returns HTTP 200 for both page and manifest. The page includes the Bible-language selector; manifest has `display=standalone`, three icons, and two shortcuts (`말씀 읽기`, `시간 묵상`). This confirms the website endpoint currently serves an installable Edge app definition, not that Edge PWA installation or the Mac wrapper's loaded webview was behaviorally tested.
- Mac's source/behavior handoff request `2026-10-01T210800_windows-selah-desktop-parity` is still open. The installed `Selah Mac.app` was inspected without launch or UI interaction: bundle ID `com.delight0517.selah.mac`, universal x86_64/arm64, minimum macOS 14, SwiftUI/AppKit/WebKit links, the public Selah URL embedded in the executable, and sandbox/network-client entitlements. `CFBundleShortVersionString` and `CFBundleVersion` are absent. No Swift/Xcode wrapper source was found in the searched Mac checkouts, so source path, screen behavior beyond the shared hosted page, storage details, and build workflow remain pending.
- An October 2 BlueCloud state snapshot in the handoff repository contains the opaque top-level fields `computerReadingRequest` and `computerReadingResult`, both null in that snapshot. Their source-defined structures and lifecycle remain unconfirmed; Windows preserves them as opaque extension fields.
- The live Edge installation dialog, Mac wrapper UI/runtime behavior, authenticated synthetic BlueCloud sync round trip, and cross-device preference convergence remain unverified.
