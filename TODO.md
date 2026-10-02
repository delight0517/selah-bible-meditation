# TODO — Selah Windows/macOS parity

## 2026-10-02 · Shared Bible text-language preference
- Add a Bible text-language selector to the Scripture library, independent of the interface locale. The selected language follows the UI locale until the user makes an explicit choice.
- Save explicit choices as optional `bibleContentLanguage: { code, updatedAt }` in BlueCloud state. Newer timestamps win; local wins ties. Keep selected translation IDs and the `selah-bible-library` chapter cache local because each browser profile may have different downloads.
- Include the explicit preference in portable backup v1; omit account owner, revision, and credentials as before.
- Change `mobile/scripts/copy-web.mjs` to copy source files from the current checkout instead of `origin/main`, preventing generated mobile assets from silently discarding local source edits.
- Current branch: `codex/selah-bible-language-sync`, based on `origin/main` at `9971628`. Original Windows checkout remains separate and dirty; no edits or merges were made there.
- Validation completed: inline JavaScript syntax parse, copy script `node --check`, JSON parsing for both schemas and manifest, `git diff --check`, and SHA-256 equality between root `index.html` and generated `mobile/www/index.html`.
- Contract audit: all 20 explicit fields in the current BlueCloud PUT serializer are declared by `selah-cloud-state.schema.json`; the client also preserves unknown remote top-level fields when writing.
- Conflict-resolution follow-up: equal `bibleContentLanguage.updatedAt` values now use a deterministic lexical code tie-breaker, avoiding each device repeatedly reasserting its own value after simultaneous edits.
- Follow-up review corrected the Japanese default: the language selector now opens the bundled Japanese Matthew text (`matthew-jpn1965.json`, `jpn_loc`) instead of English. eBible.org identifies this 1965 Japanese New Testament as public domain; the asset already existed in the repository and mobile asset-copy list.
- Not verified: browser interaction, signed-in BlueCloud GET/PUT/GET, cross-device timestamp convergence, Edge PWA installation, or Mac runtime. Nothing is merged or deployed.
- Mac source/data request `2026-10-01T210800_windows-selah-desktop-parity` remains `open`, `received=false` in `origin/main`.
- Source milestone version/build: **1.0.4 / build 5** (tracking label only; not released and no native desktop binary built).
- Review artifact: draft PR [#46](https://github.com/delight0517/selah-bible-meditation/pull/46), commit `a085e5f`; not merged/deployed, with no CI checks reported.

## Remaining parity work
- Read Mac operator's reply and reconcile the source/contract description with actual Mac runtime evidence.
- Use a synthetic test account/fixture to verify preference sync without exposing personal reflections or credentials.
- Install/launch the PWA in Edge and verify Windows app-window behavior; verify the same hosted source from Safari Add to Dock on Mac.
- Resolve whether anonymous local data should remain profile-local or needs a safer migration UX beyond the existing portable backup.
