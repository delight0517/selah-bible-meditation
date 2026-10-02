# Selah macOS and Windows parity

## Canonical source

The repository's [Mac setup guide](../README.md#mac에서-앱처럼-열기) describes the macOS app as the hosted Selah site added to the Dock from Safari, not a separate native implementation. GitHub Pages serves the root `index.html` from `main`; the Windows Edge PWA uses that same hosted UI and application logic.

This keeps scripture reading, reflection behavior, account flows, and data formats in one source. The Mac handoff request remains open for confirmation from the Mac operator; this document records what the checked-in source currently establishes.

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

| macOS | Windows |
| --- | --- |
| Open the hosted site in Safari and choose **File → Add to Dock** (macOS Sonoma 14+). | Install the hosted site as an Edge PWA; the manifest includes standalone display, app icons, and reading/meditation shortcuts. |
| Launch from Dock or Spotlight. | Launch from Edge Apps, a desktop/Start shortcut, or `Launch-Selah.cmd`. |
| Uses the Safari web app's local browser storage. | Uses the Edge app's local browser storage. |
| Full Scripture offline cache | The shared app stores downloaded chapters in local IndexedDB; extra translations expire after 30 days without use. | The same shared feature and retention policy run in Edge. |

The installer, app menu, shortcuts, and local browser profile are platform-specific. Scripture, reading progress, reflection data, account sync, and backup formats come from the shared web source. Website changes update both platforms; there are no separate Mac and Windows app binaries in this architecture.

## Current evidence and open verification

- Source basis: root `README.md`, root `index.html`, the manifest, and the two contracts linked above.
- Parity change set: PR [#46](https://github.com/delight0517/selah-bible-meditation/pull/46), merged at `b7b70a0`; it adds an explicit shared Scripture text-language preference and keeps translation downloads profile-local. GitHub Pages deployment completed for the merge commit.
- Windows Edge app-window source and macOS Safari web-app source are the same hosted page at `b7b70a0`. Live readback returns HTTP 200 and includes the Bible-language selector, deterministic timestamp-tie resolution, Japanese bundled-text mapping, and standalone manifest. This proves deployment, not that Edge installed the PWA.
- Mac's source/behavior handoff request `2026-10-01T210800_windows-selah-desktop-parity` is still open and unreceived. The repository README describes Mac as Safari's Add to Dock web app, so the checked-in web source remains the current evidence for its UI and behavior.
- An October 2 BlueCloud state snapshot in the handoff repository contains the opaque top-level fields `computerReadingRequest` and `computerReadingResult`, both null in that snapshot. Their source-defined structures and lifecycle remain unconfirmed; Windows preserves them as opaque extension fields.
- The live Edge installation dialog, Mac-side runtime readback, authenticated synthetic BlueCloud sync round trip, and cross-device preference convergence remain unverified.
