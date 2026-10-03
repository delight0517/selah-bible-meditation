# Selah for Windows

## 한국어 빠른 안내

- [빠른 실행](Launch-Selah.cmd): `Launch-Selah-App.vbs`를 통해 Selah를 Edge 앱 창으로 엽니다. Mac 네이티브 래퍼와 동일한 뒤로/앞으로, 80–150% 페이지 확대·축소, 집중 읽기 도구막대와 키보드 명령을 공유 웹 앱 안에서 제공합니다. SixVPNBlocker의 관리형 Edge 설정이 있으면 해당 확장과 PAC 프록시를 유지하며, 설정 파일이 불완전하면 보호되지 않은 Edge로 대체 실행하지 않습니다.
- [바탕 화면·시작 메뉴 바로가기 만들기](Create-Selah-Desktop-Shortcut.vbs): 런처를 `%LOCALAPPDATA%\Programs\Selah`에 설치하고 두 위치에 `Selah App Window.lnk`를 추가합니다. Windows Script Host를 대상으로 하므로 브라우저 바로가기와 구분되며 기존 Selah 바로가기는 변경하지 않습니다. Edge의 설치 앱 목록에 등록하는 정식 PWA 설치와는 다릅니다.
- 정식 PWA 설치: Edge에서 Selah 사이트를 연 다음 `설정 및 기타 (…) > 기타 도구 > 앱 > 이 사이트를 앱으로 설치`를 선택하세요. 정식 설치를 마치면 Edge 앱 목록에서 시작 메뉴·작업 표시줄에 고정할 수 있습니다.
- Edge가 설치 프롬프트를 지원하고 Selah를 아직 설치하지 않은 경우, 사이트 상단에 앱 설치 버튼이 나타납니다. 버튼이 안 보이면 위 Edge 메뉴에서 수동 설치를 진행하세요.
- The published PWA manifest supplies dedicated 192×192 and 512×512 PNG icons, which Edge requires for promoted PWA installability.
- After Edge installation, the Selah app's context menu provides direct **말씀 읽기** and **시간 묵상** shortcuts.
- Mac과 Windows에서 같은 BlueCloud 계정으로 로그인하면 지원되는 기록이 동기화됩니다. 로그인 전 기록은 각 기기의 브라우저 앱 저장 공간에 남으므로 기기 간 이동 전 백업을 내보내고 가져오세요.

macOS currently has both Safari's Add to Dock web app and an installed `Selah Mac.app` SwiftUI/WebKit shell. Windows keeps the managed Edge app window and provides the matching desktop controls in the shared hosted web app. Both use the same scripture, reflection, account-sync code, and BlueCloud data contract; only the shell's page-zoom preference stays local to its browser profile.

## Quick launch

Run [`Launch-Selah.cmd`](Launch-Selah.cmd). It starts [`Launch-Selah-App.vbs`](Launch-Selah-App.vbs), which opens the official Selah HTTPS site in an Edge app window. If the local SixVPNBlocker Edge launcher is present, the script reads its browser, extension, and PAC settings and carries them into the Selah app window. If that managed configuration is incomplete, the launcher stops and explains the problem instead of opening an unprotected browser.

To create persistent desktop and Start menu shortcuts without using Edge menus, run [`Create-Selah-Desktop-Shortcut.vbs`](Create-Selah-Desktop-Shortcut.vbs). It copies the self-contained launcher to `%LOCALAPPDATA%\Programs\Selah` and adds `Selah App Window.lnk` in both locations. The shortcuts target Windows Script Host rather than Edge directly so managed browser launchers do not erase the app URL. Existing shortcuts are left unchanged. This is an app window, not an Edge-managed PWA registration; use the official Edge install flow below for Edge app management and taskbar integration.

## Install and create a Windows shortcut

1. Open the official Selah site: <https://delight0517.github.io/selah-bible-meditation/>.
2. In Microsoft Edge, choose **Settings and more (…) > More tools > Apps > Install this site as an app**. This enables Edge-managed app details and app-specific pinning.
3. Open `edge://apps` to launch/manage Selah. From the app's details, Edge can create a desktop shortcut or pin Selah to Start/taskbar.

The exact Edge menu wording may vary by version. Microsoft documents the current flow in [Install, manage, or uninstall apps in Microsoft Edge](https://support.microsoft.com/en-US/edge/install-manage-or-uninstall-apps-in-microsoft-edge). The current Windows profile has not registered Selah as an Edge-managed PWA: the Start menu `Selah App Window` shortcut points to the local VBS launcher, and the default Edge profile has no Selah app entry in its Web Applications store. The managed Edge app-mode launcher and shortcuts are present. Install from Edge's Apps menu to add the PWA entry; the published manifest launches with the Windows toolbar flag, so the PWA and managed app window share the same navigation, page zoom, and focus-reading controls.

## Shared data behavior

See [the macOS and Windows parity matrix](PLATFORM-PARITY.md) for the canonical source, feature/data contract, and verified platform differences.

- Sign in to the same BlueCloud account on Mac and Windows to sync supported account data.
- Full-Bible downloads are stored per browser profile in local IndexedDB, not in BlueCloud sync or portable backups. Download the translation separately on each device; additional translations unused for 30 days are removed automatically.
- Anonymous/local records remain in that specific browser app's storage. Safari web apps and Edge apps have separate local storage; export a backup on the source device and import it on the destination device when not using account sync.
- New backup files use a versioned portable envelope: user state and draft are retained while the source account owner and BlueCloud `_rev` are removed, so import on another device/account does not inherit the old account binding. Existing flat JSON backups remain importable. See [`../contracts/selah-portable-backup.schema.json`](../contracts/selah-portable-backup.schema.json).
- The shared source-derived payload contract is [`../contracts/selah-cloud-state.schema.json`](../contracts/selah-cloud-state.schema.json) and corresponds to `GET/PUT /api/cloud-state/selah` (the client request helper adds `/api`). It models known reflection, quiz, QT, experience, Bible-chat, and desktop/mobile reader preference fields from current writers/normalizers. The hosted client carries unknown top-level fields from the remote state for the signed-in account into its next write and retains extension fields through the nested record normalizers. Brainwire `origin/main` implements `PUT /api/cloud-state/:appId` as a full-document write (`{ ...incoming }`), preserving arbitrary properties in its source implementation. The live route responds with 401 without authentication, so an authenticated Selah GET → PUT → GET round trip remains unverified. Local account owner and unfinished draft fields are deliberately not part of the sync payload.
- The token is stored by the app separately from the sync payload and must never be copied in a backup or handoff.

## Current build basis

Canonical hosted web source: `origin/main`; Windows desktop shell source milestone is version **1.0.9 / build 23**. The Windows Edge app window and Mac Safari web app use the shared hosted Selah source. An installed Mac WebKit wrapper was found in prior read-only inspection, but its installed URL-scheme registration, build provenance, and authenticated handoff convergence still need current Mac-side verification. Windows app controls are provided by the hosted `windows/app-shell.js`; there is no separate Windows browser engine or copy of the scripture/reflection application. The Windows app is a hosted PWA and this repository does not currently contain a native Windows executable or Store package. A Store release can use Microsoft's PWA packaging route after reserving the product identity in Partner Center. Current Store blockers and the open-source licensing boundary are tracked in [`STORE-AND-OPEN-SOURCE-RELEASE.md`](STORE-AND-OPEN-SOURCE-RELEASE.md).

Generate the public launcher ZIP with `./windows/Build-Selah-Release.ps1` from the repository root. The ZIP includes a standalone download guide, the MIT license, third-party licensing boundary, build metadata, and a file-hash manifest. The script uses an explicit file allowlist and does not include Bible datasets, credentials, user notes, browser extensions, PAC files, or image/font assets. Output goes to the ignored `windows/dist` directory. It preserves existing packages and requires a new build number instead of overwriting an existing ZIP.
