# Selah AdSense 재개 메모

2026-10-02 진행 기록. 계정 생성·Publisher/slot 재질문·CMP 초안 재작성은 반복하지 않는다.

## 현재 실제 계정 상태

- Publisher `ca-pub-7874410414327857`, 광고 단위 `9881198711` (Selah Home 320x100).
- 사이트는 프로젝트 경로가 아닌 AdSense 사이트 `delight0517.github.io`로 등록했다.
- HTML 메타 태그 소유 확인 통과. 2026-10-01 확인 당시 Review requested / Getting ready였으며, 오늘 Google 상태는 브라우저 연결이 없어 재확인하지 않았다.
- `Selah Home European Consent` Google CMP 메시지 Published. Consent, Do not consent, Manage options. 사이트/향후 사이트용 Google CMP 3-choice 선택. Optimize off, header logo off, RTB consent check on, legitimate-interest default off.
- Auto ads off. Google 사이트 화면의 ads.txt 표시는 아직 Not found; ads.txt는 호스트 main에 커밋되어 있으므로 Google 재확인을 기다린다.
- `home.html`에만 AdSense 메시지 tag와 홈 전용 consent/renderer 모듈을 연결했다. `AD_CONFIG.enabled`는 false라 슬롯 request와 수익화는 꺼져 있다. TCF 신호가 불명확하면 차단한다. `index.html`과 다른 언어 읽기 화면에는 SDK가 없다.

## 바로 재개하는 순서

1. Selah clone `/Users/rogan/Documents/Codex/2026-10-01/new-chat-5/work/selah-adsense`에서 `git fetch origin main`; `git status --short`; `git log -1 --oneline origin/main`. 원격 main이 현재 작업 기준보다 앞서면 새 커밋과 파일 차이를 확인하고 작업 브랜치만 최신 main 위로 rebase한다. 2026-10-02 재개 때 `9971628`까지 기존 변경을 보존해 rebase 완료했다. 호스트 원본 `/Users/rogan/appDev/delight0517.github.io`에는 기존 미커밋 변경이 있으니 절대 checkout/reset/stash하지 않는다.
2. AdSense 사이트 상세에서 `delight0517.github.io` 승인 상태와 ads.txt 상태만 확인한다. 오늘 계정 UI 연결이 없어 확인은 남아 있다. 승인이 대기 중이면 계정 설정을 반복하지 않는다.
3. 게시된 Google CMP와 privacy 페이지는 홈 전용으로 연결했다. 미동의/불명확 상태에 광고 슬롯 요청을 하지 않는다. 승인 후 실제 메시지 표시와 철회 흐름을 browser에서 확인한다.
4. 승인 전에는 로컬 네트워크 차단 검증만 한다. SDK 요청은 검증/사용자가 명시적으로 원할 때만 수행한다. 슬롯 요청은 남은 일일 quota 확인 뒤에 시작하고, 성공한 실제 표시만 현지 날짜 카운트에 더한다. 홈에서 읽기/묵상 진입 시 광고를 dispose한다. 자동 광고는 켜지 않는다.
5. 한 번의 검증 묶음: `node scripts/check-home.mjs`; `TZ=Asia/Seoul node scripts/check-dashboard-ad.mjs`; `TZ=America/Los_Angeles node scripts/check-dashboard-ad.mjs`. 끝에 `git diff --check`, `git status --short` 및 변경 파일을 보고한다.

## 바뀐 파일/작업 위치

- Selah 구현 초안 브랜치: `codex/adsense-disabled-draft-20261001`. 최신 확인한 `origin/main`은 `9971628`; 브랜치 HEAD는 `7755eff`이며 해당 main 위에 있다.
- 공개 Selah 변경: 계정 보고서에 기록한 공개 커밋 `a3175f6` (홈/개인정보 안내). AdSense CMP/renderer 연결 초안은 `7755eff` 로컬 커밋으로 추가했으며 원격 push는 `delight0517-art` 계정의 403 권한 거부로 완료되지 않았다.
- 호스트 별도 브랜치 `codex/adsense-host-verification-20261001`, 공개 커밋 `3fc5fda`: 루트 `index.html` 소유 태그와 `ads.txt`.
- 상세 작업 증거/커밋/검증: `/Users/rogan/Documents/Codex/2026-10-01/new-chat-5/outputs/selah-adsense-account-status.md`; 최신 `origin/main` 기준 patch도 같은 outputs 폴더에 있다. 계정 암호/토큰/device code는 기록하지 않는다.

## 완료 조건

Google 사이트 승인, 공개 ads.txt 발견, EEA/영국/스위스에서 consent/refusal/manage 및 withdrawal 동작 확인, 다른 지역의 명시적 기본 동의 처리, 홈 외에는 SDK/요청이 없다는 검증, quota 이전엔 request 0·이후 성공 표시만 최대 2인 검증, 사용자에게 공개 상태를 보고해야 종료다. Google 심사는 외부 대기이므로 상태를 확인하고 계속 작업한다.
