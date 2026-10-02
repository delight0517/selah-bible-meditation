# Selah Windows launcher

This ZIP contains the open-source Windows launcher, not a Microsoft Store/MSIX package. It opens the live Selah app in an Edge app window and needs an internet connection for its first launch. Existing notes remain in the browser profile used to open the app.

## 한국어

1. ZIP을 폴더에 압축 해제하세요.
2. `Launch-Selah.cmd`를 실행하면 Selah가 열립니다.
3. 바탕 화면·시작 메뉴 바로가기를 만들려면 `Create-Selah-Desktop-Shortcut.vbs`를 실행하세요. `%LOCALAPPDATA%\Programs\Selah`에 런처를 복사하고 `Selah App Window` 바로가기를 만듭니다.
4. Edge에 정식 PWA로 설치하려면 아래 공식 사이트에서 Edge의 앱 설치 메뉴를 사용하세요.

Microsoft Edge와 Windows Script Host가 필요합니다. Script Host가 조직 정책으로 차단된 PC에서는 공식 사이트를 브라우저로 열어 사용하세요. SixVPNBlocker가 이미 설치된 PC에서는 기존 관리형 Edge 확장과 PAC 설정을 사용하며, 불완전한 설정이면 실행을 중단합니다. SixVPNBlocker가 없는 PC에서는 일반 Edge 앱 창으로 실행합니다.

## English

Extract the ZIP and run `Launch-Selah.cmd`. Optionally run `Create-Selah-Desktop-Shortcut.vbs` to copy the launcher into your per-user Programs folder and create desktop/Start menu shortcuts. Use Edge's app-install menu at the official site for an Edge-managed PWA installation. This package does not include Scripture datasets, third-party assets, or user data. The launcher uses an existing SixVPNBlocker managed Edge route if present and stops if its configuration is incomplete.

Application: <https://delight0517.github.io/selah-bible-meditation/>

Source: <https://github.com/delight0517/selah-bible-meditation>

Original launcher code is MIT licensed; see `LICENSE`. Other material retains its own terms; see `THIRD_PARTY_NOTICES.md`. This package does not delete existing notes or install a separate browser engine.

Build 16 opens the shared hosted Selah app, whose Mac and Windows readers now correlate a matching deep-link request to its existing shared session ID.


Build 19 only adopts the linked session when the matching BlueCloud request targets this platform and has not expired.
