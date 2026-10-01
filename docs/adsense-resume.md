# Selah AdSense 재개 메모

2026-10-01 진행 기록. 다음 작업은 아래 상태 확인부터 시작하고 계정 생성·Publisher/slot 재질문·CMP 초안 재작성은 반복하지 않는다.

## 현재 실제 계정 상태

- Publisher `ca-pub-7874410414327857`, 광고 단위 `9881198711` (Selah Home 320x100).
- 사이트는 프로젝트 경로가 아닌 AdSense 사이트 `delight0517.github.io`로 등록했다.
- HTML 메타 태그 소유 확인 통과. Review requested / Getting ready: Google 정책 검토 대기, 승인 아님.
- `Selah Home European Consent` Google CMP 메시지 Published. Consent, Do not consent, Manage options. 사이트/향후 사이트용 Google CMP 3-choice 선택. Optimize off, header logo off, RTB consent check on, legitimate-interest default off.
- Auto ads off. Google 사이트 화면의 ads.txt 표시는 아직 Not found; ads.txt는 호스트 main에 커밋되어 있으므로 Google 재확인을 기다린다.
- AdSense 관리 화면에 CMP 게시됨이어도 홈 HTML에는 CMP SDK나 광고 renderer가 연결되지 않았다. `AD_CONFIG.enabled`도 false다. 실제 광고 요청/수익은 0으로 유지한다.

## 바로 재개하는 순서

1. Selah clone `/Users/rogan/Documents/Codex/2026-10-01/new-chat-5/work/selah-adsense`에서 `git fetch origin main`; `git status --short`; `git log -1 --oneline origin/main`. 원격 main이 이 메모의 초안 기준 `7346019`보다 앞서면 사용자 변경은 그대로 두고 작업 브랜치만 최신 main 위로 rebase한다. 호스트 원본 `/Users/rogan/appDev/delight0517.github.io`에는 기존 미커밋 변경이 있으니 절대 checkout/reset/stash하지 않는다.
2. AdSense 사이트 상세에서 `delight0517.github.io` 승인 상태와 ads.txt 상태만 확인한다. 승인이 대기 중이면 계정 설정을 반복하지 말고 홈/CMP 통합을 마저 작업한다.
3. 공개 CMP/개인정보 페이지와 Google의 현재 publisher 정책을 확인한 뒤, 인증된 Google CMP consent/TCF 신호를 안전하게 읽는 홈 전용 boot 경로를 구현한다. consent가 불명확하거나 거부면 광고 SDK/요청을 차단한다. CMP 설정만으로 사이트 HTML에 CMP가 설치된 것으로 간주하지 않는다.
4. 승인 전에는 로컬 네트워크 차단 검증만 한다. SDK 요청은 검증/사용자가 명시적으로 원할 때만 수행한다. 슬롯 요청은 남은 일일 quota 확인 뒤에 시작하고, 성공한 실제 표시만 현지 날짜 카운트에 더한다. 홈에서 읽기/묵상 진입 시 광고를 dispose한다. 자동 광고는 켜지 않는다.
5. 한 번의 검증 묶음: `node scripts/check-home.mjs`; `TZ=Asia/Seoul node scripts/check-dashboard-ad.mjs`; `TZ=America/Los_Angeles node scripts/check-dashboard-ad.mjs`. 끝에 `git diff --check`, `git status --short` 및 변경 파일을 보고한다.

## 바뀐 파일/작업 위치

- Selah 구현 초안 브랜치: `codex/adsense-disabled-draft-20261001`. 현재 로컬 HEAD `8da2a0f`; 시작했던 원격 기준은 `7346019`. 다음에는 먼저 최신 origin/main을 확인한다.
- 공개 Selah 변경: 계정 보고서에 기록한 공개 커밋 `a3175f6` (홈/개인정보 안내). 새 로컬 초안 파일 중 `assets/dashboard-ad.mjs`, `docs/adsense-draft.md`, `scripts/check-dashboard-ad.mjs`, `scripts/check-home.mjs`, README 변경은 공개되지 않았다.
- 호스트 별도 브랜치 `codex/adsense-host-verification-20261001`, 공개 커밋 `3fc5fda`: 루트 `index.html` 소유 태그와 `ads.txt`.
- 상세 작업 증거/커밋/검증: `outputs/selah-adsense-account-status.md`; 패치 파일은 같은 outputs 폴더. 계정 암호/토큰은 기록하지 않는다.

## 완료 조건

Google 사이트 승인, 공개 ads.txt 발견, EEA/영국/스위스에서 consent/refusal/manage 및 withdrawal 동작 확인, 다른 지역의 명시적 기본 동의 처리, 홈 외에는 SDK/요청이 없다는 검증, quota 이전엔 request 0·이후 성공 표시만 최대 2인 검증, 사용자에게 공개 상태를 보고해야 종료다. Google 심사는 외부 대기이므로 상태를 확인하고 계속 작업한다.
