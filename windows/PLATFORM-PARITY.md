# Selah macOS and Windows parity

## Canonical source

The repository's [Mac setup guide](../README.md#mac에서-앱처럼-열기) describes Safari's **Add to Dock** web app. Read-only inspection found a separate installed `Selah Mac.app` (`com.delight0517.selah.mac`) and the SwiftUI source checkout on branch `codex/selah-mac-app`, commit `2fccdd7d09077404e631f4ef86ee4c8ed4973c55`. That checkout is 1 commit ahead and 39 behind `origin/main`, with dirty and untracked changes; it is not yet confirmed as the exact source of the installed binary. The committed source defines a 760×620-minimum SwiftUI/WebKit window with back/forward controls, 80–150% page zoom, a focus-reading action, Command+Shift+F / Command+plus-minus-zero shortcuts, and WebKit back/forward gestures. The installed universal x86_64/arm64 app links SwiftUI, AppKit, and WebKit, targets macOS 14+, and embeds the shared Selah URL. Its entitlements enable app sandbox and network client. The installed app and a local Xcode archive have different Mach-O UUIDs; the installed bundle has no version/build keys, so the exact installed source revision and app version remain unconfirmed.

The Mac Safari web app, Mac WebKit wrapper, and Windows Edge app/PWA use the same hosted product source. Scripture reading, reflection behavior, account flows, and data formats run in that shared web app. BlueCloud synchronization is the shared data path after sign-in; unauthenticated browser/WebKit storage remains app-profile-specific. Mac supplies desktop navigation and page zoom in SwiftUI; Windows supplies matching navigation, zoom, and focus controls in [`windows/app-shell.js`](app-shell.js) while preserving the managed Edge launch route. The desktop page-zoom choice stays in each browser profile and is not account data.

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
| Computer reading handoff | `computerReadingRequest`, `computerReadingResult`, `computerReadingSession` |
| Server revision | `_rev` |

`language` is the app interface locale. The optional `bibleContentLanguage` object stores an explicit Scripture text-language choice (`code`, `updatedAt`) separately; if it is absent, the reader follows the interface locale. Greater `updatedAt` wins, and equal timestamps resolve to the lexicographically smaller language code so simultaneous edits converge the same way on both platforms. The selected translation ID and downloaded chapter cache remain profile-local because each browser may have different locally installed translations.

The Japanese default now uses the bundled Japanese Matthew text from the public-domain 1965 Shinkaiyaku New Testament (`matthew-jpn1965.json`, translation ID `jpn_loc`); it no longer falls back to the English World English Bible when Japanese is selected.

The optional computer-reading command identifies the target (`macOS` or `windows`) and includes only request/session IDs, action, and timestamps. The target consumer returns `opened`, `expired`, or `rejected` with the matching request ID. A shared reading session sends a 20-second visible-page heartbeat; pause or tab hiding grants a seven-minute resume window. Passage text, prayer, reflection, and credentials are not part of this handoff. The request/result/session fields are live cloud state and are not added to portable backups.

The complete-Bible download uses the local `selah-bible-library` IndexedDB database. The cache is per browser profile and is excluded from both the BlueCloud cloud-state payload and portable backup; download it separately on Mac and Windows. Default bundled translations are retained, while additional translations unused for 30 days are removed. The selected text language is separate from the UI locale and syncs as `bibleContentLanguage`; a selected non-default translation and its downloaded chapters remain local to each browser profile.

Anonymous records stay in the local storage belonging to that browser app. Safari's Dock app and Edge's PWA have separate local stores; users can move records with the portable backup format in [`selah-portable-backup.schema.json`](../contracts/selah-portable-backup.schema.json). Backup v1 carries user state, draft data, and an explicit Bible text-language preference while excluding the source owner, server revision, and credentials. An authenticated cross-device sync round trip has not been verified in this environment.

## Platform-specific entry and installation

| Area | macOS | Windows |
| --- | --- | --- |
| Entry/install | Safari **File → Add to Dock** (macOS Sonoma 14+) or installed `Selah Mac.app` WebKit wrapper. | Install the hosted site as an Edge PWA; the manifest includes standalone display, app icons, and reading/meditation shortcuts. |
| Launch | Safari web app or `Selah Mac.app` from Applications/Dock/Spotlight. | Edge Apps, desktop/Start shortcut, or `Launch-Selah.cmd`. |
| Desktop shell controls | Back/forward buttons, 80–150% page zoom, focus-reading button, keyboard commands, and back/forward gestures. | Matching back/forward, 80–150% page zoom, focus-reading toolbar, Alt+Left/Right and Ctrl+Shift+F/Ctrl+Alt zoom shortcuts in the Edge app/PWA shell. |
| Local records | Safari web app and WebKit wrapper have platform-owned storage; exact wrapper sharing behavior remains unconfirmed. | Edge app's local browser storage. |
| Offline Scripture | Downloaded chapters use local IndexedDB; extra translations expire after 30 days without use. | Same shared feature and retention policy in Edge; cache remains profile-local. |

The shell, installer, app menu, shortcuts, and local browser profile are platform-specific. Mac has an installed native SwiftUI/WebKit wrapper; Windows uses Edge's app/PWA window and the same controls are drawn by the shared site when `windowsShell=1`. Both use the same hosted product source and BlueCloud contract; page zoom remains device-profile state. Website changes update both platforms without maintaining separate copies of scripture/reflection UI.

## Current evidence and open verification

- Source basis: root `README.md`, root `index.html`, the manifest, and the two contracts linked above.
- Parity change set: PR [#46](https://github.com/delight0517/selah-bible-meditation/pull/46), merged at `b7b70a0`; it adds an explicit shared Scripture text-language preference and keeps translation downloads profile-local. GitHub Pages deployment completed for the merge commit.
- Current source readback is `origin/main` at `7fb0523489cdc991f16501710c3426a6adaedf4c`, which contains Selah handoff merge `c644db8c510990061499ef816fd478d0961f87b8`. GitHub Pages deployment run `36977780538` succeeded. Live HTTP readback returned 200 for the page, handoff JS, cloud schema, and Windows build metadata (1.0.6/build 10). The manifest remains `display=standalone` with the reading and meditation shortcuts. This confirms the hosted source and app definition, not Edge PWA registration or native Mac-wrapper provenance.
- Mac source/behavior handoff request `2026-10-01T210800_windows-selah-desktop-parity` and its local follow-up remain open. The located checkout provides committed SwiftUI source and `macos/README.md`; dirty changes add `selah://read` handling and a URL scheme not present in the installed bundle. Archive and installed Mach-O UUIDs differ, so installed-build provenance/version and any wrapper-specific storage behavior still need Mac confirmation.
- An October 2 BlueCloud state snapshot contained null values for `computerReadingRequest` and `computerReadingResult`. Later read-only inspection of the dirty Mac web source and Windows Pomodoro consumer confirmed their structures and lifecycle; authenticated request/response and runtime launch behavior remain unverified.
- Read-only Mac checkout review on October 2 confirmed an uncommitted Mac web implementation of the request, result, and focus-session lifecycle. The Windows canonical page now carries the same handoff UI, merge/serialization path, deep-link entry, and mobile asset copy. Mac and Windows source checkouts remain dirty/uncommitted; authenticated request/response and app launch behavior are not live-verified.
- Hidden-browser runtime readback with `windowsShell=1` rendered the Windows navigation/zoom/focus toolbar and computer-reading target selector. Synthetic `homeAction=read` and `openReading=1` URLs both opened the focus-reading view. This verifies shared-page routing and rendering, not PWA installation, authenticated BlueCloud exchange, or native Mac URL-scheme dispatch.
- Current Windows installation readback (October 2): `Get-StartApps` returns `Selah App Window`, but its Start menu/Desktop shortcuts target `wscript.exe` with `%LOCALAPPDATA%\Programs\Selah\Launch-Selah-App.vbs`; it is the managed Edge app-window launcher. The `Default\Web Applications` directory and matching shortcut target do not show an Edge-installed Selah PWA. This is a read-only profile check; the live Edge installation dialog has not been opened.
- The Mac follow-up request `20261002T_WINDOWS_SELAH_MAC_FOLLOWUP_REQUEST` was delivered to the Mac local inbox on October 2; no Mac response is present in `windows_inbox` or `windows_inbox_done` yet.
- The live Edge installation dialog, Mac wrapper UI/runtime behavior, authenticated synthetic BlueCloud sync round trip, and cross-device preference convergence remain unverified.
