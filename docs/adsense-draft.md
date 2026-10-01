# Selah AdSense 준비 초안 — 비활성

## 현재 상태와 설정 경로

- 기준: GitHub `origin/main`의 `e0c1f1653eeebee7a32665cfa9b201ddde3b4dca`.
- `assets/dashboard-ad.mjs`의 `AD_CONFIG`: `enabled: false`, `publisherId: ''`, `slotId: ''`.
- 임의 ID, 광고 SDK/로더, 광고 요청, Auto ads, 계정 생성/로그인, 약관 동의, 수익화 활성화, 배포는 포함하지 않았다.
- 어떤 HTML에도 이 모듈을 연결하지 않았다. ID만 채워도 요청할 수 없다. 실제 provider renderer도 미구현이다.
- 현재 `index.html`은 대시보드와 성경 본문을 함께 표시한다. 여기에 광고를 붙이지 않는다. `fil/` 읽기 및 각 언어 안내 페이지도 그대로 보존한다.

## 최소 구현 계약

1. 추후 **성경 본문이 없는 독립 홈/대시보드**에서만 `mountDashboardAd(host, { getView, consentGranted, render })`를 연결한다. 읽기/묵상으로 전환하기 **전에** 반환된 `dispose()`를 호출한다. 기존 혼합 화면은 DOM 검사에서도 거부한다.
2. 광고는 본문 흐름 안의 최대 너비 320px, 높이 100px 슬롯이다. 광고 표기와 접근 가능한 44px 닫기 버튼을 포함한다. 화면 덮기/고정 광고 및 Auto ads는 사용하지 않는다.
3. `createDailyAdGate`는 현지 달력 날짜(`toLocaleDateString('sv-SE')`)로 `localStorage`의 `selah.ads.displayed.v1`에 성공 표시 수만 저장한다. 계정/BlueCloud 동기화에 포함하지 않는다. 같은 origin과 브라우저 프로필의 탭은 공유하고 다른 브라우저/기기는 각각 집계한다. 저장소 삭제/시크릿 모드까지 추적하는 기기 식별은 하지 않는다.
4. 하루 2회 뒤에는 renderer를 호출하지 않아 광고 요청을 막는다. Web Locks로 같은 브라우저 여러 탭의 요청~성공 집계를 직렬화한다. Web Locks 미지원, 저장소 읽기/쓰기 실패, 손상된 카운터, 동의 없음은 광고를 차단한다.
5. 요청, 슬롯 생성, 닫기, no-fill, 차단, 오류는 성공으로 세지 않는다. renderer는 **filled 광고가 실제로 화면에 표시된 뒤**에만 `true`를 반환해야 한다. `eligible()`와 AbortSignal을 지키고 취소 시 콘텐츠를 즉시 제거해야 한다. 로더 완료나 AdSense의 filled 속성만으로 가시성을 판정하면 안 된다. 실제 AdSense 성공/가시성 판정 및 제한 시간은 후속 통합에서 검증해야 한다.
6. 닫기는 해당 마운트의 남은 요청을 취소하며 집계를 올리지 않는다. 이미 성공 표시된 광고를 닫으면 기존 성공 수는 유지된다. 재마운트/새로고침도 저장된 일일 집계를 읽는다. 자정을 넘겨 표시되면 표시 시점의 날짜에 센다.

## CMP 및 추후 설정

EEA/영국/스위스 사용자를 대상으로 광고를 제공할 때 Google 인증 CMP와 IAB TCF 통합 요건을 충족해야 한다. 단순 쿠키 배너나 자체 boolean은 CMP를 대신하지 않는다. 이 초안의 `consentGranted()`는 인증 CMP가 제공하는 적법한 광고 허용 결과를 연결할 자리이며, 현재 CMP를 설치하거나 동의를 수집하지 않는다. 동의/지역 판단이 없거나 불명확하면 SDK 로드와 광고 요청을 모두 차단한다. 비개인화 광고라고 동의 요건을 자동으로 면제하지 않는다.

- Google 공식 요건: https://support.google.com/adsense/answer/13554116?hl=en
- 인증 CMP와 TCF 설명: https://support.google.com/adsense/answer/13554020?hl=en-GB
- EU 사용자 동의 정책 안내: https://www.google.com/about/company/user-consent-policy-help/

후속 작업에서 사용자가 전달한 실제 Publisher ID/광고 단위 ID, 사이트 승인 상태, 인증 CMP·지역/동의 처리, 독립 홈 화면, 광고 표시 판정/취소 처리, `ads.txt` 및 개인정보 안내를 확인한 뒤에만 별도 승인 범위로 실제 통합을 진행한다. 계정·약관·광고 요청·배포는 이번 작업 범위 밖이다.

## 검증과 한계

`node scripts/check-dashboard-ad.mjs`는 네트워크 없는 가짜 renderer로 기본 비활성, 빈 ID, 페이지 미연결, 허용 화면, 동의, 실패/no-fill, 닫기/화면 전환, 일일 한도, 탭 간 직렬화, 재로딩, 현지 자정 및 별도 브라우저 저장소를 확인한다. `TZ=Asia/Seoul`과 `TZ=America/Los_Angeles`로 각각 실행할 수 있다.

실제 광고 표시, AdSense 승인/수익, 인증 CMP 동작, 물리 기기 UI는 검증하지 않았다. 비활성 상태를 유지한 최소 초안이다. 저장소가 광고 표시 후 갑자기 실패한 경우에는 현재 마운트를 차단하지만, 영속 집계까지 보장할 수는 없다. 브라우저 데이터 삭제/기기 시각·시간대 변경은 로컬 집계의 한계다.
