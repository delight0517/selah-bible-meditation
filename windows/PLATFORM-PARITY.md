# Selah macOS and Windows parity

## Canonical source

The repository's [Mac setup guide](../README.md#mac에서-앱처럼-열기) describes Safari's **Add to Dock** web app. Read-only inspection found a separate installed `Selah Mac.app` (`com.delight0517.selah.mac`) and the SwiftUI source checkout on branch `codex/selah-mac-app`, commit `2fccdd7d09077404e631f4ef86ee4c8ed4973c55`. That checkout is 1 commit ahead and 39 behind `origin/main`, with dirty and untracked changes; it is not yet confirmed as the exact source of the installed binary. The committed source defines a 760×620-minimum SwiftUI/WebKit window with back/forward controls, 80–150% page zoom, a focus-reading action, Command+Shift+F / Command+plus-minus-zero shortcuts, and WebKit back/forward gestures. The installed universal x86_64/arm64 app links SwiftUI, AppKit, and WebKit, targets macOS 14+, and embeds the shared Selah URL. Its entitlements enable app sandbox and network client. The installed app and a local Xcode archive have different Mach-O UUIDs; the installed bundle has no version/build keys, so the exact installed source revision and app version remain unconfirmed.

The Mac Safari web app, Mac WebKit wrapper, and Windows Edge PWA use the same hosted product source. Scripture reading, reflection behavior, account flows, and data formats run in that shared web app. BlueCloud synchronization is the shared data path after sign-in; unauthenticated browser/WebKit storage remains app-profile-specific. The native wrapper adds desktop navigation, page zoom, and keyboard commands; Windows currently relies on Edge app-window controls and the shared in-page reader controls, so the native toolbar parity gap remains open.

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
| Desktop shell controls | Back/forward buttons, 80–150% page zoom, focus-reading button, keyboard commands, and back/forward gestures. | Edge app-window navigation/zoom behavior plus the shared in-page focus-reading and reader font controls; custom matching toolbar remains to be implemented. |
| Local records | Safari web app and WebKit wrapper have platform-owned storage; exact wrapper sharing behavior remains unconfirmed. | Edge app's local browser storage. |
| Offline Scripture | Downloaded chapters use local IndexedDB; extra translations expire after 30 days without use. | Same shared feature and retention policy in Edge; cache remains profile-local. |

The shell, installer, app menu, shortcuts, and local browser profile are platform-specific. Mac has an installed native SwiftUI/WebKit wrapper; Windows currently has an Edge PWA/app-window launcher rather than a native Windows binary. The shared reader/meditation data contract is common, while the Mac wrapper's toolbar is a known Windows shell gap. Website changes update both platforms without maintaining separate copies of the product UI.

## Current evidence and open verification

- Source basis: root `README.md`, root `index.html`, the manifest, and the two contracts linked above.
- Parity change set: PR [#46](https://github.com/delight0517/selah-bible-meditation/pull/46), merged at `b7b70a0`; it adds an explicit shared Scripture text-language preference and keeps translation downloads profile-local. GitHub Pages deployment completed for the merge commit.
- Current source readback is `origin/main` at `06415368896fa66777159b49b01eed68af3a37a8` (root `index.html` last changed at `f197164`; manifest shortcut entries at `404fd53`). Live readback returns HTTP 200 for both page and manifest. The page includes the Bible-language selector; manifest has `display=standalone`, three icons, and two shortcuts (`말씀 읽기`, `시간 묵상`). This confirms the website endpoint currently serves an installable Edge app definition, not that Edge PWA installation or the Mac wrapper's loaded webview was behaviorally tested.
- Mac's source/behavior handoff request `2026-10-01T210800_windows-selah-desktop-parity` remains open. A Mac checkout provided the SwiftUI source and `macos/README.md` build command. Its current dirty changes add a `selah://read` URL handler that maps to `homeAction=read&requestId=...`, but the hosted page currently only handles `homeAction=read` and does not consume `requestId`; the uncommitted URL scheme is absent from the installed bundle. The app source checkout has a local archive, but its Mach-O UUID differs from the installed app, so exact build provenance/version and storage sharing still need Mac confirmation.
- An October 2 BlueCloud state snapshot in the handoff repository contains the opaque top-level fields `computerReadingRequest` and `computerReadingResult`, both null in that snapshot. Their source-defined structures and lifecycle remain unconfirmed; Windows preserves them as opaque extension fields.
- The live Edge installation dialog, Mac wrapper UI/runtime behavior, authenticated synthetic BlueCloud sync round trip, and cross-device preference convergence remain unverified.
