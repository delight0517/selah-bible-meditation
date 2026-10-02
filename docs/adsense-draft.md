# Selah AdSense — 승인 대기, 광고 비활성

## 현재 상태와 설정 경로

- 코드 기준: 최신 원격 `main` 위의 `codex/adsense-disabled-draft-20261001`.
- 실제 설정: `assets/dashboard-ad.mjs`의 `AD_CONFIG`는 Publisher `ca-pub-7874410414327857`, slot `9881198711`, `enabled: false`.
- AdSense 호스트 `delight0517.github.io`는 소유 확인 완료, 심사 요청 후 상태 `Getting ready`. 승인 전이며 Auto ads는 Off.
- Google European regulations CMP는 `Consent`, `Do not consent`, `Manage options`로 게시됐다. EEA/UK/CH는 Google TCF 신호에서 목적 1/3/4와 Google vendor 755 동의가 확인될 때만 요청을 허용한다. 다른 지역은 `gdprApplies === false`가 확인되어야 한다. API 부재·시간 초과·불명확한 값은 차단한다.
- AdSense tag는 홈에서만 로드해 CMP 메시지와 철회 API를 사용할 수 있게 한다. 실제 슬롯 `push()`는 기능 활성, 동의, 남은 일일 횟수가 모두 확인된 때만 한다. 현재 `enabled: false`이므로 광고 슬롯 요청은 발생하지 않는다.
- `home.html`에 본문 없는 독립 홈/대시보드를 추가했다. 기록 요약만 읽고 기존 저장소를 변경하지 않는다. 읽기/묵상은 `index.html`로 이동한다. `index.html` 및 `fil/`에는 광고를 붙이지 않는다. 기존 공유 주소와 각 언어 안내 페이지는 보존했다.
- 홈 전용 `#dashboardAdHost`에만 연결 초안을 둔다. `index.html`과 다국어 읽기 페이지에는 광고 SDK나 요청 코드를 넣지 않았다.

## 최소 구현 계약

1. 추후 **`home.html`의 독립 홈/대시보드**에서만 `mountDashboardAd(host, { getView, consentGranted, render })`를 연결한다. 읽기/묵상으로 전환하기 **전에** 반환된 `dispose()`를 호출한다. 기존 혼합 화면은 DOM 검사에서도 거부한다.
2. 광고는 본문 흐름 안의 최대 너비 320px, 높이 100px 슬롯이다. 광고 표기와 접근 가능한 44px 닫기 버튼을 포함한다. 화면 덮기/고정 광고 및 Auto ads는 사용하지 않는다.
3. `createDailyAdGate`는 현지 달력 날짜(`toLocaleDateString('sv-SE')`)로 `localStorage`의 `selah.ads.displayed.v1`에 성공 표시 수만 저장한다. 계정/BlueCloud 동기화에 포함하지 않는다. 같은 origin과 브라우저 프로필의 탭은 공유하고 다른 브라우저/기기는 각각 집계한다. 저장소 삭제/시크릿 모드까지 추적하는 기기 식별은 하지 않는다.
4. 하루 2회 뒤에는 renderer를 호출하지 않아 광고 요청을 막는다. Web Locks로 같은 브라우저 여러 탭의 요청~성공 집계를 직렬화한다. Web Locks 미지원, 저장소 읽기/쓰기 실패, 손상된 카운터, 동의 없음은 광고를 차단한다.
5. 요청, 슬롯 생성, 닫기, no-fill, 차단, 오류는 성공으로 세지 않는다. renderer는 filled status와 화면 교차가 확인된 뒤에만 `true`를 반환한다. `eligible()`와 AbortSignal을 확인하고 취소 시 슬롯을 제거한다. 15초 timeout과 화면 가시성 판정이 연결되어 있다. 실제 승인된 광고 응답을 이용한 동작은 아직 확인하지 않았다.
6. 닫기는 해당 마운트의 남은 요청을 취소하며 집계를 올리지 않는다. 이미 성공 표시된 광고를 닫으면 기존 성공 수는 유지된다. 재마운트/새로고침도 저장된 일일 집계를 읽는다. 자정을 넘겨 표시되면 표시 시점의 날짜에 센다.

## CMP 및 추후 설정

EEA/영국/스위스 사용자를 대상으로 광고를 제공할 때 Google 인증 CMP와 IAB TCF 통합 요건을 충족해야 한다. 단순 쿠키 배너나 자체 boolean은 CMP를 대신하지 않는다. 홈 모듈은 Google TCF API 응답의 목적/Google vendor 동의를 읽으며 광고 스크립트가 차단되거나 상태가 불명확하면 fail closed한다. 읽기·묵상 화면에는 SDK가 없다.

- Google 공식 요건: https://support.google.com/adsense/answer/13554116?hl=en
- 인증 CMP와 TCF 설명: https://support.google.com/adsense/answer/13554020?hl=en-GB
- EU 사용자 동의 정책 안내: https://www.google.com/about/company/user-consent-policy-help/

사이트 승인 대기와 공개 ads.txt 발견을 재확인하고, 실제 지역 동의/철회 UI와 approved filled 광고를 대상으로 요청 상한을 검증하기 전까지 `enabled`는 false로 유지한다.

## 검증과 한계

`node scripts/check-dashboard-ad.mjs`는 네트워크 없는 가짜 renderer로 기본 비활성, 빈 ID, 페이지 미연결, 허용 화면, 동의, 실패/no-fill, 닫기/화면 전환, 일일 한도, 탭 간 직렬화, 재로딩, 현지 자정 및 별도 브라우저 저장소를 확인한다. `TZ=Asia/Seoul`과 `TZ=America/Los_Angeles`로 각각 실행할 수 있다.

실제 광고 표시, AdSense 승인/수익, 인증 CMP 동작, 물리 기기 UI는 검증하지 않았다. 비활성 상태를 유지한 최소 초안이다. 저장소가 광고 표시 후 갑자기 실패한 경우에는 현재 마운트를 차단하지만, 영속 집계까지 보장할 수는 없다. 브라우저 데이터 삭제/기기 시각·시간대 변경은 로컬 집계의 한계다.

홈 분리 검증: `node scripts/check-home.mjs`. 로컬 Chrome에서 홈→집중 읽기→홈, 홈→시간 선택→묵상→홈, 일본어 전환, 기존 노트 보존, 모바일 390px·PC 1280px·다크 모드, 저장 데이터 손상 시 홈의 안내 표시를 확인했다. 외부 요청을 전부 차단하고 테스트했으며 실제 AdSense/CMP/계정 서버에 요청하지 않았다. 모바일 검증은 데스크톱 브라우저의 뷰포트 검사이며 물리 iPhone 검증은 아니다.

## 2026-10-01 계정 등록 진행

사용자의 후속 등록·활성화·배포 요청에 따라 실제 계정에서 Publisher `ca-pub-7874410414327857`, 광고 단위 `9881198711`(Selah Home 320x100)을 확인했다. 설정에 실제 ID를 넣었지만 `enabled: false`를 유지한다. 이전의 빈 ID·계정 작업 제외 설명은 최초 초안 범위를 기록한 것이다. 현재는 소유 확인 메타 태그·ads.txt, 별도 홈·스크립트 없는 개인정보 안내를 공개했다. EEA/영국/스위스용 Google CMP 메시지를 게시했으나 실제 홈 CMP/동의 철회 및 광고 renderer는 아직 연결되지 않았다. Google 사이트 승인과 실환경 동의/표시 검증 후에만 광고를 켜야 한다. Auto ads는 읽기/묵상 제외 및 하루 한도 계약을 깨므로 사용하지 않는다.
