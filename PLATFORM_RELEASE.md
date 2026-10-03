# 공통 기능과 플랫폼 배포 규칙

## 한 번 구현하는 원본

기능은 저장소 루트의 웹 원본에서 한 번 구현한다. `mobile/www`는 생성 결과이며 직접 기능을 수정하지 않는다. iOS와 iPhone 앱은 같은 Capacitor 대상이다.

| 대상 | 기능 코드 경로 | 업데이트 완료 조건 |
| --- | --- | --- |
| 웹 | GitHub main → Pages | Pages 성공 + 공개 URL 실제 기능 확인 |
| Windows Edge 앱/PWA/런처 | 같은 Pages URL | 웹 배포 + Windows 앱 재실행 후 기능 확인 |
| Microsoft Store | 같은 URL을 사용하는 PWA 패키지 계획 | 현재 미제출. 실제 등록·패키지 설치·실행 증거 필요 |
| iOS / iPhone | 원본 → `copy:web` → `mobile/www` → `sync:ios` | Mac Xcode 빌드·설치/배포 + 해당 기기 기능 확인 |

웹 배포로 기존 iPhone 설치 바이너리가 자동 갱신되지는 않는다. 소스 일치, 패키징, 배포, 설치, 실행 확인은 서로 다른 단계다. 플랫폼별로 필요한 네이티브 브리지와 권한도 별도로 확인한다.

## 매 작업의 공통 절차

1. 최신 `origin/main`에서 격리 작업 브랜치를 만들고 TODO에 요청과 담당 범위를 기록한다. 다른 채팅의 작업 파일은 덮어쓰지 않는다.
2. 공통 기능은 루트에서 구현하고 `SHARED_APP_BUILD.json`의 공유 빌드를 올린다. Windows 런처 패키지 번호는 런처 자체를 바꿀 때 별도로 올린다.
3. `npm --prefix mobile run copy:web`로 모바일 파일과 iOS 버전을 생성한다. 새 HTML 연결 스크립트·스타일·이미지와 CSS/JS 의존성도 자동으로 포함한다. 동적 fetch 데이터 등 정적 참조로 발견할 수 없는 파일은 복사 목록에 명시한다.
4. `node scripts/check-platform-source.mjs`를 실행한다. 원본 URL, 모바일 설정, 전체 파일 해시, iOS 버전을 검사한다. PR의 필수 `contract` 검사가 실패하면 병합할 수 없다.
5. 최신 main의 다른 작업을 통합하고 공통 검사를 다시 실행한 뒤 PR로 병합한다.
6. 웹/Windows와 iPhone 배포 증거를 각각 TODO에 기록한다. 설치된 iPhone 앱을 확인하지 못했다면 '모바일 소스 일치 / 설치 확인 대기'라고 보고한다. 동일 기능을 iOS에 다시 구현하지 않고 같은 커밋을 패키징한다.

## 2026-10-03 확인한 상태

- 공유 앱: 1.0.10 / build 29. 방문자 설명 JS를 포함한 48개 원본 파일과 모바일 파일 일치.
- Windows 런처는 공유 웹 URL을 사용한다. 런처 패키지 자체는 1.0.9 / build 23으로, 공유 UI 번호와 목적이 다르다.
- iOS 프로젝트 버전은 공유 빌드 29와 일치한다. 이번 Windows 작업에서 iPhone 설치·실행은 확인하지 않았다.
- Microsoft Store 목록은 `draft_not_submitted`이고 상품명 예약도 완료되지 않았다. Store 앱 배포 완료로 보고하지 않는다.
