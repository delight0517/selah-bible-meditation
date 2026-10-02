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
| Reading preferences and language | `readerPrefs`, `customFontData`, `language` |
| Server revision | `_rev` |

Anonymous records stay in the local storage belonging to that browser app. Safari's Dock app and Edge's PWA have separate local stores; users can move records with the portable backup format in [`selah-portable-backup.schema.json`](../contracts/selah-portable-backup.schema.json). Backup v1 carries user state and draft data while excluding the source owner, server revision, and credentials. An authenticated cross-device sync round trip has not been verified in this environment.

## Platform-specific entry and installation

| macOS | Windows |
| --- | --- |
| Open the hosted site in Safari and choose **File → Add to Dock** (macOS Sonoma 14+). | Install the hosted site as an Edge PWA; the manifest includes standalone display, app icons, and reading/meditation shortcuts. |
| Launch from Dock or Spotlight. | Launch from Edge Apps, a desktop/Start shortcut, or `Launch-Selah.cmd`. |
| Uses the Safari web app's local browser storage. | Uses the Edge app's local browser storage. |

The installer, app menu, shortcuts, and local browser profile are platform-specific. Scripture, reading progress, reflection data, account sync, and backup formats come from the shared web source. Website changes update both platforms; there are no separate Mac and Windows app binaries in this architecture.

## Current evidence and open verification

- Source basis: root `README.md`, root `index.html`, the manifest, and the two contracts linked above.
- Windows PWA source current at commit `831225c`; GitHub Pages returned HTTP 200 and the published HTML included the localized install button and `beforeinstallprompt` handler.
- The live Edge installation dialog, a Mac-side runtime readback, and authenticated synthetic BlueCloud sync remain unverified.
