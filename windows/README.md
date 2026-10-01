# Selah for Windows

## 한국어 빠른 안내

- [빠른 실행](Launch-Selah.cmd): Edge 앱 창으로 Selah를 엽니다. Edge가 표준 설치 위치에 없으면 기본 브라우저로 엽니다.
- [바탕 화면·시작 메뉴 바로가기 만들기](Create-Selah-Desktop-Shortcut.vbs): 실행하면 두 위치에 `Selah.lnk`를 만듭니다. Edge 앱 모드로 앱 창을 여는 바로가기이며, Edge의 설치 앱 목록에 등록하는 정식 PWA 설치와는 다릅니다.
- 정식 PWA 설치: Edge에서 Selah 사이트를 연 다음 `설정 및 기타 (…) > 기타 도구 > 앱 > 이 사이트를 앱으로 설치`를 선택하세요. 정식 설치를 마치면 Edge 앱 목록에서 시작 메뉴·작업 표시줄에 고정할 수 있습니다.
- Mac과 Windows에서 같은 BlueCloud 계정으로 로그인하면 지원되는 기록이 동기화됩니다. 로그인 전 기록은 각 기기의 브라우저 앱 저장 공간에 남으므로 기기 간 이동 전 백업을 내보내고 가져오세요.

Selah's macOS desktop distribution is the same hosted web app opened as a Safari web app. The Windows counterpart uses the same hosted app and data contract in Microsoft Edge's app window; it does not fork scripture, reflection, or account-sync behavior.

## Quick launch

Run [`Launch-Selah.cmd`](Launch-Selah.cmd). It opens the official Selah HTTPS site in Edge app mode when Edge is installed in a standard or per-user installation location, and falls back to the default browser otherwise.

To create persistent desktop and Start menu shortcuts without using Edge menus, run [`Create-Selah-Desktop-Shortcut.vbs`](Create-Selah-Desktop-Shortcut.vbs). Both open the official site in Edge app mode. This is a convenient app window, not an Edge-managed PWA registration; use the official Edge install flow below for Edge app management and taskbar integration.

## Install and create a Windows shortcut

1. Open the official Selah site: <https://delight0517.github.io/selah-bible-meditation/>.
2. In Microsoft Edge, choose **Settings and more (…) > More tools > Apps > Install this site as an app**. This enables Edge-managed app details and app-specific pinning.
3. Open `edge://apps` to launch/manage Selah. From the app's details, Edge can create a desktop shortcut or pin Selah to Start/taskbar.

The exact Edge menu wording may vary by version. Microsoft documents the current flow in [Install, manage, or uninstall apps in Microsoft Edge](https://support.microsoft.com/en-US/edge/install-manage-or-uninstall-apps-in-microsoft-edge). The UI installation remains unverified on this Windows session because Computer Use was stopped with the physical Escape key.

## Shared data behavior

- Sign in to the same BlueCloud account on Mac and Windows to sync supported account data.
- Anonymous/local records remain in that specific browser app's storage. Safari web apps and Edge apps have separate local storage; export a backup on the source device and import it on the destination device when not using account sync.
- The shared source-derived payload contract is [`../contracts/selah-cloud-state.schema.json`](../contracts/selah-cloud-state.schema.json) and corresponds to `GET/PUT /api/cloud-state/selah` (the client request helper adds `/api`). It models known reflection, quiz, QT, experience, Bible-chat, and desktop/mobile reader preference fields from current writers/normalizers. The hosted client carries unknown top-level fields from the remote state for the signed-in account into its next write and retains extension fields through the nested record normalizers. Brainwire `origin/main` implements `PUT /api/cloud-state/:appId` as a full-document write (`{ ...incoming }`), preserving arbitrary properties in its source implementation. The live route responds with 401 without authentication, so an authenticated Selah GET → PUT → GET round trip remains unverified. Local account owner and unfinished draft fields are deliberately not part of the sync payload.
- The token is stored by the app separately from the sync payload and must never be copied in a backup or handoff.

## Current build basis

Source revision inspected for this Windows wrapper: `918ba3e` (`main`). No separate native Windows build number is defined because both desktop wrappers run the hosted web application.
