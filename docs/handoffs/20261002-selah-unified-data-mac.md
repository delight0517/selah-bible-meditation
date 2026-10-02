# Mac 적용 요청 — Selah 공통 UI·데이터 1.0.7 / 빌드 19

사용자 요청: Windows 앱과 Mac·iOS·웹의 UI 및 데이터가 갈라져 각각 기록을 관리하게 되는 위험을 없애는 통합 시스템.

공통 원본: https://github.com/delight0517/selah-bible-meditation · 작업 브랜치 `codex/selah-unified-data-20261002`. 병합 후 `main`을 원본으로 사용하세요. Windows 쪽은 공통 데이터 코어, 삭제 이력/복구본, 계정별 로컬 보관, 공통 초안, 추가형 백업 가져오기 및 iOS 번들 SHA-256 검사를 구현했습니다. `SHARED_APP_BUILD.json`을 확인하세요. 임의로 Windows/Mac용 데이터 저장소를 따로 만들지 마세요.

1. 기존 dirty 작업과 사용자의 로컬 노트를 보존하고 깨끗한 별도 작업 경로에 공통 main을 준비하세요. 설치된 Mac 앱의 producing source, CFBundleShortVersionString/CFBundleVersion과 canonical hosted URL을 확인하고 버전 정보를 회신하세요. 별도 UI 포크가 있다면 공통 UI를 호스팅하는 얇은 래퍼로 연결하고 플랫폼 기능만 native에 남겨 주세요.
2. iOS는 `pubspec.yaml`/`lib`와 `ios/Runner`, `mobile/capacitor.config.json`/Capacitor 구조를 직접 확인해 실제 앱 스택을 결정하세요. 현재 공통 저장소는 Capacitor `mobile/www` 생성물입니다. `node mobile/scripts/copy-web.mjs`와 `--check`를 실행하고 번들 `SHARED_SOURCE_MANIFEST.json`의 버전 및 해시를 확인하세요.
3. 빌드 겹침을 확인한 다음 자체 리빌더/단일 dispatcher와 Delete Fix 경로를 우선 사용하세요. 여러 빌드/설치 경로를 동시에 실행하거나 다른 세션을 종료하지 마세요. 앱 제거로 기존 WebView 기록을 지우지 말고 업데이트 설치하세요. 설치가 300초 이상 멈추면 로그를 수집하고 원인을 해결한 뒤 한 번만 재시도하세요.
4. 합성 시험: `node --test scripts/test-unified-data.mjs`. 실제 앱 시험에서는 전용 합성 BlueCloud 계정으로 Mac/iOS/Windows 각 1개 노트 추가, 동시에 같은 노트 수정, 삭제 반영, 색상과 mobile/desktop 읽기 크기, 다른 기기 초안 불러오기, 네트워크 복구, 다른 계정 격리를 확인하세요. 개인 묵상·기도 원문과 토큰을 회신하거나 복사하지 마세요.
5. 사용자 기존 로컬 기록은 먼저 해당 앱에서 백업을 내보내고 같은 계정에 연결하거나 통합 앱에서 백업을 가져와 합치세요. 기존 백업 가져오기는 이제 교체가 아닌 추가 병합입니다. 서로 다른 계정의 기록은 자동 결합하지 마세요. 사용자가 사용할 계정을 선택한 후 그 계정에만 명시적 백업 이관을 진행하세요.
6. 수신 시각, 사용한 commit, 공유 빌드 버전, native 앱 버전/빌드, 설치·런타임 로그 결과와 합성 시험의 개수/상태만 Windows 인박스에 회신해 주세요. 설치/생산 서버 왕복 증거가 없으면 전체 기기 통합 완료라고 보고하지 마세요.
