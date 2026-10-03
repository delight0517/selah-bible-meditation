# Selah 플랫폼 기능 동등성 작업 시스템

## 사용자가 요구한 원칙

웹 원본이나 UI 기술을 같게 만드는 것이 목적이 아니다. Windows·macOS·iOS·웹이 별도 구현이어도 같은 앱의 기능·데이터 의미·사용자 결과를 맞춘다. iOS와 iPhone은 한 플랫폼이다. 기존 네이티브 앱을 웹 래퍼로 교체하라는 지시가 아니다.

공통 요구사항과 데이터/API 계약은 한 번 정하고, 플랫폼 구현은 각 담당자가 필요한 만큼 적용한다. 다른 플랫폼에 이미 있는 구현·시험·명세를 먼저 찾아 활용하며 같은 요청을 새로 발행하지 않는다.

## 기능 하나당 공유 기록 하나

`contracts/feature-parity.json`이 기능 반영의 공유 원장이다. 각 기능에는 ID, revision, 동작 합격 기준, 변경 파일 범위와 모든 플랫폼의 담당·상태·반영 revision·실제 소스·빌드·검증 증거가 있다.

- 기능이나 동작을 바꾸면 revision을 올리고 모든 플랫폼을 다시 평가한다. 예전 revision 확인 결과를 최신 완료로 재사용하지 않는다.
- 상태: pending → acknowledged → implementing → implemented → verified. implemented는 소스 반영이며 설치·실행 확인이 아니다.
- 해당 없는 플랫폼은 not_applicable과 구체적 이유를 기록한다. 임의 제외하지 않는다.
- 한쪽만 끝나도 부분 배포는 가능하다. 나머지는 담당과 이유가 있는 대기 작업으로 남긴다. 전체 통합 완료는 모든 대상 verified 또는 사유가 있는 not_applicable일 때만 선언한다.
- PR에서 앱 기능 코드를 바꿨는데 해당 파일을 다루는 원장 갱신이 없으면 필수 contract 검사가 실패한다. 코드 일치와 기능 동등성을 구분한다.

## 역할과 충돌 방지

1. 최신 origin/main에서 기능별 격리 브랜치를 만든다. 다른 채팅의 dirty 파일을 수정·정리하지 않는다.
2. 기능 ID와 합격 기준을 원장에 등록한다. 담당은 수신 후 owner를 실제 담당 이름/태스크로 바꾸고 acknowledged로 표시한다. 같은 ID/revision 작업이 있으면 기존 작업을 이어간다.
3. Windows 담당은 Windows 구현·설치·시험, Mac 담당은 macOS 및 iOS 소스 확인·구현·빌드·설치·시험, 웹 담당은 웹 배포·시험을 기록한다. 파일 범위가 겹치면 담당 하나가 통합한다.
4. 데이터/API 변경은 버전, 필드 의미, 병합·삭제·호환성 규칙과 합성 시험을 먼저 정한다. 각 구현이 같은 시험 결과를 내는지 비교한다. 사용자 기록·토큰을 handoff에 넣지 않는다.
5. Mac 요청과 회신에는 기능 ID/revision, 합격 기준, 소스 repo/commit, 플랫폼 버전/빌드, 시험 결과를 넣는다. 전송·수신·구현·설치 확인을 따로 기록한다. 전송만으로 완료 처리하지 않는다.
6. 부분 배포 후 미완료 플랫폼은 TODO와 원장에 남긴다. `node scripts/check-feature-parity.mjs --release`가 실패하면 통합 완료를 선언하지 않는다.

## 현재 기술 구조와 검사

현재 웹과 Windows 런처는 hosted URL을 사용하며 Capacitor iOS는 생성된 mobile/www를 사용한다. 이는 현재 확인한 구현이고 모든 플랫폼에 강제할 미래 설계가 아니다. 별도 native 구현의 실제 소스는 해당 플랫폼 담당이 확인해 원장에 등록한다.

- `npm --prefix mobile run copy:web`: 현재 Capacitor 구현에 필요한 원본 복사.
- `node scripts/check-platform-source.mjs`: 현재 hosted/Capacitor 구성의 소스·번들·버전 검사. 네이티브 기능 동등성의 증명이 아니다.
- `node scripts/check-feature-parity.mjs`: 명세와 반영 상태 검사. CI에서 변경 파일과 원장 갱신 확인.
- `node scripts/check-feature-parity.mjs --release`: 미완료 플랫폼이 있으면 통합 완료 차단.

방문자 설명과 계정 데이터 계약을 등록했다. Mac 설치 소스 확인, iPhone 설치·실행, 계정 왕복 시험은 남아 있다. Microsoft Store는 Windows 배포 채널이며 현재 미제출이다. 플랫폼 빌드 번호가 달라도 같은 기능 revision으로 동등성을 관리한다.
