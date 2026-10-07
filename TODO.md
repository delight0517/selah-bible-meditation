## 2026-10-07 · Selah 웹 실시간 YouTube 성경 오디오 연결
- [x] YouTube 정책 검토 후 공개 주간 집계형 카탈로그 대신, 현재 장에서 언어별 5개 이상 오디오 역본을 한 번에 검색해 역본별로 자동 분류하는 웹 우선 구조를 구현했다. 한국어 선택지는 여섯 개로 확대 중이다. API 키는 브라우저로 보내지 않고 Worker secret에서만 읽으며, Pacific 자정 기준 하루 70회 검색 한도로 다른 API 호출용 30회 여유를 둔다.
- [x] 읽기 화면에서 본문 언어의 설정된 오디오 역본을 한 번에 검색·분류한다. 첫 검색에서 역본별 결과가 5개 미만이면 부족한 역본만 묶어 한 번 더 검색하며, 두 요청 모두 최대 50개 결과를 확인하고 역본별 상위 5개를 임시 표시한다.
- [x] `selah-together.imdisablebutgodisable.workers.dev`에 Worker를 배포하고 기존 YouTube 전용 API 키를 Worker secret으로 연결했다. Cloudflare deployment version `de63f7cc-d4cd-481c-be28-7cc11534853a`; 웹 origin OPTIONS 응답 HTTP 204 및 allowlist readback을 확인했다.
- [x] PR #283 병합 commit `24c3b965046d2c0eb1bbbc7014db07a06350ff39`, GitHub Pages 배포 run `37508204180` 성공. 공개 Selah 페이지 HTTP 200에서 새 Worker 주소와 검색 문구를 읽어 확인했다.
- [x] 실제 Worker→YouTube API 검색 1회가 HTTP 200으로 응답했다. 한국어 마태복음 1장에서 개역한글·개역개정·새번역·우리말성경은 각각 5개 후보, 공동번역은 0개였다. 반환된 20개 후보는 설명란에서 절/장 시점을 찾지 못했다.
- [x] Worker fallback 분류 수정을 PR #285로 병합하고 Pages에 배포했다. 한국어 검색에서 오분류된 개역개정 결과가 공동번역 그룹에 섞이지 않게 막았다.
- [ ] 쉬운성경을 여섯 번째 한국어 오디오 선택지로 추가했다. 실제 API 검색에서 후보 수와 정합성을 확인하고 부족한 판본을 계속 보완한다.
- [x] Google Cloud Monitoring에서 직전 24시간 YouTube search.list 성공 100회와 HTTP 429 3회를 확인했다. Worker 한도를 70회로 낮추고 상류 429를 받으면 Pacific 자정까지 검색을 막았다. Google 공식 오류 문서는 일일 quota 초과를 `403 quotaExceeded`로도 정의한다. Worker가 이 응답도 같은 방식으로 막고 일반 403은 차단 사유로 취급하지 않게 보강했다. 합성 계약 테스트는 두 경우를 구분해 통과했다.
- [x] PR #287을 merge commit `e753692864bedb1fb3e7518faf037e78e550f800`으로 병합하고, quotaExceeded 처리 코드를 Worker version `330e4231-c5fa-4518-a681-b20af6ab3130`으로 배포했다. Cloudflare deployment list에서 100% 적용을 확인했고, 웹 origin OPTIONS preflight는 HTTP 204를 반환했다. 일일 한도 리셋 전에는 실제 YouTube 검색을 더 호출하지 않았다.
- [ ] 일일 quota reset 이후 새 한도에서 쉬운성경 실제 후보를 확인한다. reset 전에는 YouTube API를 다시 호출하지 않는다.
- [x] 재확인 결과 Cloudflare가 권한 DNS 응답으로 `selah-together.imdisablebutgoddisable.workers.dev`와 계정 하위 도메인 모두에 NXDOMAIN을 반환했다. Wrangler에서도 Worker 배포는 100% 활성 상태지만 공개 요청은 DNS 단계에서 막혔다.
- [x] `selah-youtube-api-gateway.pages.dev`에 Pages Function을 배포하고 기존 `selah-together` Worker에 내부 Service Binding을 연결했다. 공개 GET은 Worker까지 도달해 현재 카탈로그 없음(`catalog_not_found`)을 반환했고, Selah Origin CORS·OPTIONS preflight 통과, 타 Origin은 403, 잘못된 검색 입력은 Worker 400으로 확인했다. 배포 `8737132e-efa0-40ff-b69f-bca7bb9129e0`; 기존 API 키와 Durable Object는 Worker 안에 유지한다.
- [x] 공개 GitHub Pages의 현재 HTML이 `https://selah-youtube-api-gateway.pages.dev`를 YouTube 오디오 API로 사용한다. `GET /youtube/audio-catalog?locale=en`은 Pages 게이트웨이와 Worker를 거쳐 HTTP 404 `catalog_not_found`를 반환했다. 첫 playlist 전용 Cron 전이라 아직 카탈로그가 없는 상태다.
- [ ] 첫 Cron 이후 언어별 오디오 목록과 playlist 커버리지·chapter/verse cue를 확인하고, 웹에서 YouTube 재생 및 본문 따라가기를 검증한다.
- [ ] 웹에서 후보 저장→YouTube 재생→절 시점 저장→본문 따라가기까지 확인한다. 실제 재생/follow 및 언어별 5개 완전 오디오 역본은 아직 검증되지 않았다.

## 2026-10-07 · 하루 3회 언어별 YouTube 오디오 카탈로그 회전
- [x] 예약 Cron을 00:20·08:20·16:20 UTC, 하루 3회로 분리해 언어별 카탈로그 순환을 10일에서 약 4일로 단축한다. 세 번 모두 Pacific 일일 quota reset 뒤 실행된다.
- [x] 기존 일일 검증 30회 안에서 각 locale run은 최대 10개 후보를 확인한다. 5개 역본 locale은 역본당 최대 2개, 한국어는 6개 역본에 10개 검증을 공평하게 배분하고 Durable Object cycle마다 남은 4개 슬롯을 회전한다.
- [x] 회귀 검사에서 영어·한국어 모두 run당 10회 상한, 한국어 추가 슬롯 회전, 3개 예약과 10개 언어 순환을 확인한다. `search.list` 일일 한도와 coverage quota는 늘리지 않는다.
- [x] 기능 parity revision 53, PR #309 필수 CI를 확인해 merge commit `a2a8710bbdce742f7b37258240ce86d0d1324520`으로 병합했다. Cloudflare Worker version `7dce34b9-9403-4729-9cf4-8473b0f600e5`가 100% 적용됐고 Cron `20 0`, `20 8`, `20 16` UTC를 읽어 확인했다.
- [x] 배포 직후 공개 카탈로그 GET은 HTTP 404 `catalog_not_found`였다. 이는 다음 Cron 전 빈 상태로 확인됐으며, 아직 자동 수집 성공 증거는 아니다.
- [ ] 실제 10개 언어 카탈로그에서 완전판 5개씩, 공개 웹 YouTube 재생과 본문 따라가기를 확인한다. 실제 화면 검증은 Aside에 대한 Terminal 접근성 권한 허용 후 Resume가 필요하다.

## 2026-10-07 · YouTube 카탈로그 검색·후보 순환
- [x] locale별 YouTube broad search `nextPageToken`, fallback query별 별도 cursor, 역본별 후보 scan offset을 Durable Object에 저장하고 다음 예약 회차에서 재개한다. 커서는 30일 뒤 함께 만료시킨다.
- [x] 새 결과가 기존 검증 결과보다 약하면 기존 역본의 playlist와 커버리지를 유지한다.
- [x] 검색·카탈로그 회귀 테스트, `check-feature-parity`, `check-platform-source`, `git diff --check`를 통과했다.
- [ ] PR 병합과 Worker 배포 뒤 다음 Cron의 실제 카탈로그 readback 및 웹 재생·본문 따라가기를 확인한다. 화면 QA는 기존 Aside 접근성 알림을 완료하고 Resume해야 한다.

## 2026-10-06 · 미국 영어권 묵상 기록 진입 실험
- [x] 공개 영어 검색 결과에서 “Bible journal에 무엇을 쓸까?”라는 초보자 질문을 확인했다. 최근 안내 페이지와 저널링 서비스가 이미 경쟁 중이다. 이는 검색 의도와 경쟁 콘텐츠의 증거이지 월 검색량이나 Selah 수요의 증거가 아니다.
- [x] 미국/영어권 `global-funnel-v1` 최근 30일 기준을 확인했다: 노출 이벤트 2, CTA·읽기·저장·가입·재방문 0. 두 이벤트는 사람 수가 아니며 모두 `unattributed` 경로다.
- [x] Selah English에 한 항목만 쓰는 성경 기록 안내 `/en/guide/`를 추가하고, 기존 English 페이지 링크·자체 canonical·OG/Twitter 카드·sitemap·direct Matthew 1 CTA·기존 익명 `guide` 퍼널 추적을 연결했다. Google/검색량 플러그인 Semrush, Ahrefs, GSC Wizard는 모두 현재 관리자 설정상 비활성이다.
- [x] PR #274 merged commit `7b3075191836aaaad3ad15090507d157d1c6d82d`; Pages run `37422692218` succeeded. Public English guide, English-home link, analytics script, sitemap and robots all returned HTTP 200; title/description/canonical/H1/reader CTA parsed as expected; sitemap contains 17 URLs including the guide.
- [ ] Search Console URL inspection/indexing request remains pending because GSC Wizard is currently disabled by administrator policy and no signed-in Search Console browser tool is available here. Immediate first-party 30-day readback returned no `guide`/English events; this is not proof nobody visited. Exact search volume, Google indexing, conversion winner, and verified new unique users remain unknown/0.

## 2026-10-06 · 최근 7일 이용 지도와 쉬운 방문 집계 문구
- [x] 방문 지도 데이터를 날짜별 방문 합계에서 최근 7일 익명 브라우저 중복 제거로 바꾸고, 기간 내 여러 지역에서 이용한 브라우저는 가장 최근 지역에만 표시하도록 웹/서버 원본을 수정했다. 완전한 7일 데이터가 쌓이기 전에는 지도 집계를 준비 중으로 표시한다.
- [x] “오늘/이번 달 이 앱을 이용한 사람”으로 제목을 쉽게 바꾸고, 익명 브라우저 기준 추정치라 실제 사람 수와 다를 수 있음을 함께 설명한다.
- [x] ReleasePilot analytics worker PR #15를 병합하고 2026-10-06 Cloudflare Worker `cloud-account-storage` 버전 `4b3b14af-5b41-4f94-99f2-6419c8f0e30f`으로 배포했다. 공개 API는 HTTP 200이며 호환 가능한 데이터가 완전한 7일치 쌓이지 않아 주간 값은 null, coverage는 false다.
- [x] Selah UI PR #269를 `ada6f7f`로 병합하고 Pages 배포(run `37412549429`)와 공개 화면 HTTP 200을 확인했다. API 주간 coverage는 아직 false이며 값은 null이라 완전한 최근 7일 이벤트가 쌓이기 전에는 활성 브라우저 수를 표시하지 않는다. Capacitor 66개 공유 파일 패리티는 통과했으며 iOS 재패키징·실행 확인은 별도다.

## 2026-10-06 · 성경 듣기 축소 화면과 다국어 설정 문구
- [x] iOS 26.4 Selah QA Simulator에 1.0.13/build 62를 설치했다. World English Bible 선택과 한국어 앱 안내, 번역본 일치 확인 안내, 공식 YouTube에서 Premium을 사용한다는 설명을 확인했다.
- [x] WEB 마태복음 1장 테스트 소스를 열어 임베드 영상과 축소 플레이어를 확인했다. 축소 카드 너비는 240 CSS px이고 YouTube 컨트롤 영역은 최소 200 CSS px다. 테스트 전용으로 저장했던 `WEB Matthew 1 reading test` 소스는 확인 뒤 삭제했다.
- [x] 오디오는 선택한 성경 언어·번역본·책·장으로 검색하고 저장한 소스는 번역본 ID에 귀속된다. 설정 문구는 앱 UI 언어를 따른다. 버전 간 교차 노출을 피하고 결과 영상의 판본명은 저장 전에 확인하도록 안내한다.
- [ ] 일본어 등 별도 번역본의 실제 검색 결과, 오디오 출력, 재생목록의 다음 장 연속 재생, 외부 YouTube 계정의 광고/Premium 동작, 실제 iPhone, 웹 Pages 배포를 각각 검증한다. 시뮬레이터 빌드 61에서 영상의 본문 화면 진행을 확인했으나 소리 자체나 Premium 상태는 확인하지 않았다.

## 2026-10-05 · 국가별 국기와 광역 지역 자동 표시
- [x] 익명 방문 집계에 이미 포함된 ISO 국가가 새로 생기면 현지화 국가 이름과 국기를 자동 렌더링하고, 실제 방문이 있는 1단계 시·도/주/도(province)만 ISO-3166-2 이름표로 표시하도록 웹과 Capacitor 원본을 갱신했다. 한국·미국 지도를 유지한다.
- [x] 도시·구 단위 위치를 새로 수집하지 않고 기존 `country`/`regionCode` 집계만 사용한다. UI 안내를 한국어·영어·일본어·중국어 간체/번체·필리핀어·스페인어·브라질 포르투갈어로 추가했다.
- [ ] PR 병합, Pages 배포 후 새 국가와 지역 집계의 공개 readback 대기. 현재 데이터가 있는 국가는 한국·미국뿐이라 다른 나라의 실제 방문 카드는 방문이 집계된 뒤 나타난다. 설치된 iPhone 패키지는 build 50 재포장 전까지 이전 번들이다.

## 2026-10-05 · 성경 본문 초기 렌더링 복구
- [x] 실제 공개 페이지에서 성경 데이터는 로드됐지만 본문이 계속 '불러오는 중'에 머무는 문제를 재현했다. 렌더러는 `window.SelahScriptureHighlights`로 내보내는 모듈을 존재하지 않는 `ScriptureHighlights` 이름으로 호출해 예외가 났다.
- [x] 실제 export 이름을 사용하고, 선택적 하이라이트 모듈이 없어도 HTML 이스케이프된 본문을 표시하도록 수정했다. 회귀 테스트에서 모듈이 있을 때와 없을 때를 모두 확인했다.
- [x] 로컬 브라우저 미리보기에서 마태복음 1장과 3장 본문 표시를 확인했다. shared UI build 45, Capacitor bundle 동기화 및 source/parity 검사 통과.
- [ ] PR 병합과 GitHub Pages 배포, 공개 웹앱·Windows Store 빌드에서의 실기기 확인 대기. 이 수정이 배포되기 전까지 공개 페이지의 본문 오류는 해결되지 않았다.

## 2026-10-05 · 이전 성경 읽기 위치 복원
- [x] 새로고침/재진입 시 저장된 책·장 복원 경로는 있었지만, 본문 로드가 끝난 뒤 저장된 절 위치와 스크롤 위치를 적용하지 않아 장의 처음부터 보일 수 있는 문제를 수정했다.
- [x] 선택한 장과 절 데이터 로드 완료 뒤 위치 복원을 실행하며, 시작 회귀 테스트에서 책·장 로드 다음 복원 호출 순서를 확인했다.
- [x] build 40 source/mobile bundle parity 통과, PR #241 병합 (`7b733ee92ce2cedd0648e4443c5519468046948c`), Pages 배포 run `37254637422` 성공. 공개 index와 build JSON HTTP 200, 복원 호출과 build 40 확인.
- [ ] 설치된 iPhone 앱과 별도 macOS 앱 런타임 검증은 미실시.

## 2026-10-05 · YouTube 성경 낭독 절 따라가기
- [x] Selah 내부 YouTube 영상/재생목록에 현재 보이는 절의 재생 시점을 저장하고, 재생 시간에 따라 해당 절을 강조하도록 했다. 재생목록은 현재 재생 영상 ID별로 시점을 구분한다.
- [x] 저장된 다음 장 시점에 맞춰 본문을 자동으로 장 전환하고 절을 화면에 따라오게 한다. 영상마다 절 시작 시점은 최초 1회 수동 저장이 필요하다.
- [x] 시점 데이터는 로컬/BlueCloud 동기화에 포함되며 절 단위 동시 편집 병합과 입력 검증을 추가했다.
- [x] Build 39 공용 iOS 웹 번들 검사 통과, PR #239가 `d884ad29e6360b3a6ca162cfb6a0dc04188c17de`로 병합되고 Pages 배포 run `37253786972` 성공. 공개 index·build JSON·동기화 JS HTTP 200 및 절 따라가기 UI/build39 readback 확인.
- [ ] 실제 iPhone 앱 설치/재생과 별도 macOS 앱 런타임, YouTube 계정의 영상별 타임코드 설정은 기기에서 확인되지 않음.

## 2026-10-05 · 즐겨찾기 성경 듣기 출처와 번역본별 기본 선택
- [x] 기존 번역본별 단일 링크를 즐겨찾기 목록으로 확장해 YouTube 채널·영상·재생목록과 성경 낭독 사이트를 여러 개 저장할 수 있게 한다.
- [x] 기본 출처를 읽기 화면 본문 위에 바로 노출하고, 번역본별 선택과 링크 목록은 BlueCloud 동기화 컬렉션으로 분리 저장한다. 실제 YouTube 구독과는 구분한다.
- [x] PR #237의 필수 검사 통과 후 병합. GitHub Pages 배포 37252365953 성공, 공개 사이트 HTTP 200에서 기본 출처 UI와 build 38 확인.
- [ ] 실제 기기에서 영상 재생과 iOS 앱 내부 동작 확인.

## 2026-10-05 · 번역본별 성경 YouTube 듣기 설정
- [x] 선택한 성경 번역본에 맞는 YouTube 영상/재생목록을 이름과 함께 저장하고, 번역본별로 분리해 재생·외부 열기·삭제할 수 있도록 공용 읽기 화면에 추가했다.
- [x] 저장 항목은 기존 통합 데이터 동기화에 포함하고 Cloud state 스키마에도 옵션 필드로 등록했다. iframe은 요청 후 `youtube-nocookie.com`에서 클릭 후 로드한다. shared UI 버전을 build 37로 올렸다.
- [x] YouTube Premium은 공식 YouTube 앱/사이트에서 사용자의 로그인 세션을 사용하도록 안내한다. Selah 내부 YouTube/Google OAuth, 비밀번호 수집은 구현하지 않는다.
- [x] 공용 소스 동기화, 데이터 병합 회귀, 기능 계약 검사가 통과했다.
- [x] PR #235 검사 통과 및 merge commit `6e9ee44`; GitHub Pages 배포 run `37250576063` 성공. 공개 페이지 HTTP 200과 build 37의 YouTube 설정·저장 필드·privacy-enhanced player 텍스트 readback을 확인했다.
- [ ] 실제 브라우저 재생, iPhone 설치·런타임, 별도 macOS 앱은 아직 검증되지 않았다.

## 2026-10-05 · 언어별 무료 큐티 바로가기 카탈로그
- [x] 지원하는 8개 앱 언어별로 공식 YouVersion 묵상 계획 링크를 보여주고, 한국어 오늘의 양식 링크는 유지한다.
- [x] 공식 제공처 아이콘, 언어명, 도메인, 현지어 소개, 무료 계획 열기와 개인 QT 라이브러리 저장을 한 카드에 표시한다. 원문은 복사하지 않으며 일부 계획에 제공처 계정/앱이 필요할 수 있다고 안내한다.
- [x] PR #233 검사 통과 및 merge commit `3ebb0e5`; Pages run `37248413539` 성공. 공개 index에서 8개 언어 카탈로그, 필리핀어 계획 URL, 한국어 오늘의 양식 이미지, 언어 선택 UI를 확인했다. 각 외부 계획 페이지와 ODB 이미지 HEAD 요청은 HTTP 200이다.
- [ ] 실제 웹 화면 클릭·이미지 렌더링 및 설치된 iPhone 런타임은 시각 기기 증거가 필요해 미확인이다.

## 2026-10-05 · 비로그인 컴퓨터 읽기 숨김과 대비 보정 테마
- [x] Mac/Windows 컴퓨터 읽기 선택 UI는 BlueCloud `token`과 검증된 `accountId`가 있을 때만 표시한다. 로그아웃·인증 만료 때 선택·요청 상태를 숨기고, 일반 성경 읽기와 시간 묵상은 게스트에게 유지한다.
- [x] 다크/시스템 색상 체계를 의미 역할 토큰으로 정리하고 각 표면에서 전경색 대비를 계산한다. 대비가 4.5:1보다 낮은 사용자 지정 글자색은 읽을 수 있는 색으로 보정한다. 브라우저 native form 색상도 테마를 따른다.
- [x] Selah 1.0.11/build36 공유 iOS 웹 소스를 재생성하고 `check-platform-source` 및 feature parity 검사를 통과했다. Node VM 상태 점검에서 게스트/로그인 표시와 저대비 색상 보정을 확인했다.
- [x] PR #226 merged as `602850a9fcbf050eadd614c5b0a108ca096f2080`; GitHub Pages deploy run `37228235251` succeeded. Public index, handoff JS, semantic-theme JS/CSS returned HTTP 200 and contained the expected auth/contrast logic.
- [ ] 실제 브라우저 렌더링과 설치된 iPhone/macOS 앱, Windows 셸의 개별 실행 확인은 별도 기기 증거가 필요하다.

## 2026-10-05 · 드래그 구절 개인 색상 하이라이트
- 성경 본문에서 드래그한 문자 범위에 여섯 가지 색을 적용하고, 다시 선택해 해당 범위를 지울 수 있도록 공용 읽기 화면을 수정했다.
- 색상과 UTF-16 본문 오프셋을 계정별 `readerMarks`에 저장한다. 로그인하면 기존 BlueCloud 동기화 경로를 사용하고, 비로그인 기록은 해당 브라우저에만 남는다. 친구 초대·함께 읽기 데이터에는 포함하지 않는다.
- 웹·Windows 공유 화면과 Capacitor iPhone 소스를 반영했다. macOS 별도 읽기 구현은 기존 Apple 기능 동등성 작업에 남겨 둔다.
- [x] PR #220은 2026-10-04에 `6233a66`으로 병합됐고 Pages 배포 run `37213106265`가 성공했다. 공개 index, 하이라이트 모듈, build 35 메타데이터 모두 HTTP 200으로 확인했다.
- iPhone Safari에서 실제 드래그 조작과 BlueCloud 인증 계정 왕복 저장은 이번 turn에 검증하지 못했다. Mac 화면이 잠겨 있어 기기 UI 검증은 pending.

## 2026-10-03 · 사용자가 정정한 실시간 함께 읽기 — 1.0.10/build30
- 말씀 읽기 내부 함께 읽기에서 URL 생성, 상대가 같은 페이지로 입장, 상대 읽는 위치를 옅게 표시, 시간 묵상 종료 시각 공유를 요청.
- 독립 실시간 Worker + 방별 상태, 24시간 만료, 서버 시각 타이머, 진행자 본문 변경, 익명 절/위치 표시 구현. 플랫폼 공통 기능 ID SELAH-LIVE-TOGETHER-READING revision1.
- Mac/iPhone 실제 반영·설치 확인은 별도 담당 대기. 합성 backend 검사와 실제 두 참가자 HTTP 검사는 통과; 브라우저 UI 시험 진행.

## 2026-10-03 · 사용자 요청: 작업 시스템 실제 시험
- 피드백: 완성된 플랫폼 작업 시스템이 실제로 작동하는지 테스트 요청.
- PR #167에서 원장 누락을 재현해 contract 실패와 ready PR mergeState=BLOCKED 확인 후 미병합 종료. 로컬 fixture로 오래된 revision, pending 전체 완료, 모바일 누락, 중복 작업 차단 검증.
- 전체 결과는 docs/PLATFORM_SYSTEM_TEST_20261003.md. Mac 요청은 조회 가능하지만 수신·완료 false이므로 기기 전체 반영 완료는 미검증. 앱 UI build29 유지.

## 2026-10-03 · 플랫폼별 구현의 기능 동등성 관리로 요구 정정
- 사용자 피드백: 같은 웹 원본을 강제하려는 것이 아니라 Windows 변경이 macOS/iOS/웹에서 누락되지 않는 작업 시스템을 요구함.
- 공통 기능 ID/revision·합격 기준·플랫폼별 담당·반영 상태·소스/빌드/검증 증거 원장과 CI 검사 추가. 미반영 플랫폼은 pending으로 보존하며 통합 완료 검사에서 차단.
- 이전 얇은 웹 래퍼로 통일하라는 handoff는 이번 요구사항으로 정정. Mac 요구는 기존 큐로 전달하며 수신/완료는 별도 확인.
- 앱 UI 빌드 1.0.10/29 유지. 이번 변경은 작업 시스템이며 iPhone 실제 반영 완료를 의미하지 않음.

## 2026-10-03 · 플랫폼 공통 기능 중복 방지
- 사용자 피드백: 새 기능이 iOS·웹·Microsoft 앱·iPhone에 동일하게 반영되고 같은 구현을 반복하지 않도록 시스템 확인 요청.
- 루트 원본 1회 구현 → 모바일 생성, 정적 의존성 자동 발견, 플랫폼 URL/번들/iOS 버전 검사와 필수 CI를 추가. PLATFORM_RELEASE.md에 플랫폼별 완료 조건을 기록.
- 공유 UI 1.0.10/build 29 유지(개발 도구·운영 규칙 변경). iPhone 설치 확인 대기, Microsoft Store 미제출.

## 2026-10-03 · 월간 고유 방문자 숫자 설명 — 1.0.10 / build 29
- 사용자 피드백: “이번 달 고유 방문자 34”의 뜻을 이해하기 어렵고 누르면 상세 설명을 볼 수 있게 요청함.
- 월간 숫자 전체를 키보드로도 누를 수 있는 버튼으로 바꾸고 현재 숫자의 의미, 브라우저 중복 제거 예시, 기기/공유 브라우저/저장 데이터 삭제에 따른 오차, UTC 달력 월 기간, 회원·실시간 방문자와의 차이를 설명하는 패널을 추가. 5개 UI 언어를 지원.

## 2026-10-03 · 성장 시장을 한국만으로 제한하지 않기
- 사용자 정정 반영: 한국어 전용 build 28은 해당 통제 실험 한 건의 범위이며 전체 시장 우선순위가 아니다. 앱의 8개 언어 경로에서 국가별 검색 의도, 접속 가능성, 성경판 적합성, 유입 후 읽기·기록 행동을 병행 조사한다.
- `MARKET_PLAYBOOK.md`와 `GROWTH_RESEARCH.md`에 시장 탐색 절차와 언어별 메시지 초안을 정리했다. 언어를 국가로 추정하지 않고, 확인된 국가×언어×시안별로 성과를 분리한다.
- 현재 확인된 55 page-view 이벤트는 KR 45 / US 10이며 사람 수가 아니다. 필리핀어 경로는 필리핀 국가 방문 증거가 아니고 GSC 자료에는 Selah 검색 행이 없다. 비한국어 문구는 초안이며 실제 썸네일 제작·현지 검토·게시/노출 전이다.
- 개인 Instagram 제외와 유료 집행 금지를 유지한다. 현지 본문/표현 적합성, 검색 결과의 약속과 도착 화면 일치, 행동 데이터가 확인된 시장부터 판단하며 작은 표본에서 승자를 고르지 않는다.

## 2026-10-03 · 하나님을 알아가도록 초대하는 한국어 썸네일 실험
- 사용자 요청의 핵심을 기존 A/B 시안 실험에 반영: “하나님을 알고 싶으신가요?”라는 호기심을 존중하고, 말씀을 읽으며 알아가도록 부담 없이 초대한다. 죄책감·긴급성·신앙 수준 압박은 사용하지 않는다.
- 1200×630 A/B 썸네일과 게시 캡션 초안은 `GROWTH_RESEARCH.md`의 `KR-GOD-CURIOSITY-THUMBNAIL-20261003-01`에 기록했다. 동일 목적지/CTA로 비교하고 도달→태그 유입→120초 읽기→묵상 저장→가입을 별도 집계한다. Google 검색 썸네일은 통제할 수 없어 GSC 검색 결과와 혼합하지 않는다.
- 상태: 시안과 설계 준비 완료, 외부 노출 미시작. 연결된 Metricool Instagram이 개인 계정인지 Selah 전용 계정인지 확인되지 않아 게시·예약하지 않는다. 개인 계정은 실험에서 제외하며 광고비도 쓰지 않는다.

## 2026-10-03 · Selah 다운로드 페이지 익명 방문 통계 및 개인정보 안내 — 1.0.10 / build 24
- 사용자 승인에 따라 한국어·영어 다운로드 허브와 Windows 설치 안내에 기존 first-party page-view analytics를 추가. `?selah_qa=1`이면 페이지 분석 전송을 건너뜀.
- 한국어·영어 개인정보 안내에 페이지 경로, 언어, referrer 호스트, 검증된 UTM 태그, Cloudflare 국가·광역 지역·넓은 기기 범주, 브라우저 로컬 일·월 무작위 방문 ID 및 데이터 제한을 명시.
- 현재 원격 main 기준 SHARED_APP_BUILD는 1.0.10/build 24이며 이 변경은 웹 추적·안내 변경으로 앱 바이너리 번호는 올리지 않음. PR #136은 2026-10-03 병합됐고 Pages 배포 run 37115414331이 성공. 공개 다운로드 3페이지, 공용 분석 스크립트, 웹/모바일 개인정보 문서는 모두 HTTP 200으로 반영 확인.
- 격리 런타임 확인: 각 다운로드 경로는 `page:view` POST 1건, `?selah_qa=1`은 0건을 보냄. payload에는 경로/언어/referrer 호스트만 포함됐고 검색어·쿼리 문자열은 전송되지 않음. GSC 색인 추적기에 다운로드 URL 3개를 추가(총 추적 15개); 시간별 크론의 후속 색인 결과를 확인할 것.
- GSC 정착 데이터는 2026-09-29까지 Selah 클릭 0/노출 0이므로 CTR 산출 불가. GA4 읽기 권한(scope)은 GSC Wizard 계정에서 여전히 연결되지 않아 표준 GA4 보고서와 측정 ID 적용은 보류.
- 배포 후 GSC 원페이지 감사에서 다운로드 허브 로고의 빈 대체 텍스트 경고 2건을 확인해 의미 있는 한국어·영어 앱 아이콘 설명으로 수정. 설치 페이지의 낮은 단어 수 경고는 의미를 바꾸는 문장 채우기를 피하고 그대로 기록.
- 한국어 허브가 오래된 build 19 ZIP을 가리키는 링크 불일치를 발견. 현재 상세 안내 및 영어 허브와 맞춰 build 23 파일로 변경; 로컬 ZIP SHA-256 `98418d311fdfe17ebdfa2aa1306c3a94fd3d173967b4aa095a6d30331d2abb57`가 공개된 체크섬 sidecar와 일치함을 확인.
- 후속 PR #139 및 #140 병합 후 Pages runs 37115934577 / 37116060574 성공. GSC 원페이지 감사에서 모든 3페이지 indexable/self-canonical, alt 누락 0건(한국어 상세 허브의 thin-content low 경고 1건 유지). 공개 한국어 허브가 build 23을 표시하고 build 19 참조가 없으며, build 23 ZIP/sidecar는 HTTP 200; 공개 ZIP의 실제 SHA-256과 sidecar가 일치함.
- 다운로드 안내 페이지에는 reader/note 기능 카드가 없으므로, 공용 분석 스크립트의 지역별 기능 강조 GET도 그런 카드가 있는 읽기 화면에서만 실행하도록 제한해 불필요한 지역 판별 요청을 줄임.
- 분석 이벤트 중복 표식은 localStorage 접근이 거부될 때 sessionStorage로 대체해, 기존 방문 ID fallback과 함께 작동하도록 보완. 두 저장소 모두 막힌 경우에도 한 번의 페이지 로드 요청은 계속 시도하며 중복 제어가 불가능할 수 있음.
- PR #142/Pages run 37116611517, PR #144/Pages run 37116945119 병합·성공. 공개 `fil/analytics.js` HTTP 200에서 reader-target 가드와 storage fallback 확인; localStorage 차단 + sessionStorage 허용 시 최초 1회 전송/새로고침 0회, 둘 다 차단 시 첫 로드 전송 시도.
- 2026-10-03 13:25 UTC GSC 재조회: Selah 28일 Web 클릭 0·노출 0, CTR 산출 불가(정착 through 2026-09-29). 국가·기기 행도 0. 부모 속성의 추적기 15 URL 중 indexed 8 / not indexed 4 / pending 3, errors/warnings 0; Korean 다운로드는 `URL is unknown to Google`, 영문·Windows 페이지는 pending. Selah sitemap은 pending이지만 경고/오류 0이며 Googlebot 요청에 XML 200, sitemap URL 14개 응답.
- 2026-10-03 13:23 UTC first-party rolling-month readback: 55 page-view events, 34 approximate random browser IDs; country KR 45 / US 10, device desktop 38 / mobile 17 (both dimensions sum to 55). Download paths still have no recorded page views; sources/referrers/campaign attribution remain sparse. These are browser/request aggregates, not verified people or Google-search CTR.
- GA4 연결 상태 재확인: GSC Wizard `rogan2534@gmail.com`에 Google Analytics scope 없음. Measurement ID를 추측하거나 태그를 임의 추가하지 말고, 계정 소유자의 OAuth 승인 후 GA4 property 연결부터 확인할 것.

## 2026-10-03 · Selah 화면 브랜드 아이콘 통일 — 1.0.9 / build 23
- 배포 앱을 직접 열어 보니 본문 화면 상단에는 기존 별표 표식이 남아 있어 새 앱 아이콘과 브랜드가 달랐음. 본문/홈 상단에 동일한 Selah 성경책·십자가 SVG를 적용.
- 웹/PWA와 모바일 공유 번들을 다시 생성하고 Windows 배포판 버전을 1.0.9/build 23으로 올림. 배포 후 실제 화면의 아이콘 및 동작을 확인할 것.

## 2026-10-03 · Country/device analytics live check and Selah GSC filter — 1.0.9 / build 22
- Current first-party `/analytics/summary?appId=selah&period=month` readback: 49 page-view events over 3 UTC dates, 31 approximate anonymous browser IDs, country KR 39 / US 10, page-view device classes desktop 36 / mobile 13. Referrers, source, medium and campaign are empty; this is not confirmed human traffic or campaign attribution.
- The 30-day Korea hero-copy experiment currently has 7 exposures (A=3, B=4), 5 CTA clicks, 2 reading starts, 0 30-second focused reads, 0 reflection saves, and 0 signups. The observed CTA ratio is 5/7 (71%), but this sample is tiny and may include QA; do not select a variant or call it a stable conversion rate.
- Verified GSC Wizard supports country/device clicks, impressions, CTR and average position. Direct Selah property reports remain 0 rows through 2026-09-29; first incomplete date is 2026-09-30. The Selah sitemap remains pending with 0 warnings and 0 errors. The existing tracker has 1/4 URLs indexed (home page); three download pages are still unknown to Google. Do not repeat accepted indexing requests or spend another inspection quota now.
- The parent `https://delight0517.github.io/` GSC property includes unrelated GitHub Pages projects. Filtering its pages by `/selah-bible-meditation/` over 2026-07-01–2026-10-01 returned 0 rows. Created and read back the saved filter `Selah | selah-bible-meditation only` (page contains `/selah-bible-meditation/`) so future parent-property reports can isolate this app without counting sibling projects.
- GA4 remains not configured for the connected GSC Wizard account (`rogan2534@gmail.com` lacks the Google Analytics scope), and no site GA4 measurement tag was found in tracked source. Existing first-party country/device analytics work without GA4. To add standard GA4 property reports, the account owner must connect Google Analytics in GSC Wizard; then verify/link the property before considering a measurement ID change.## 2026-10-03 · Selah 앱 아이콘 및 Windows 런처 — 1.0.9 / build 22
- 사용자 피드백: Windows 무료 성경 앱의 화면 디자인을 세련되게 정리하고 앱 아이콘도 제대로 만들어 달라고 요청함.
- 공통 앱 아이콘을 새 Selah 성경책과 십자가 디자인으로 적용하고 웹/PWA, iOS 앱 아이콘 카탈로그, Windows 다중 크기 바로가기 아이콘을 맞춤. Windows 런처 ZIP에도 전용 아이콘을 포함하고 바탕 화면/시작 메뉴 바로가기가 이 아이콘을 사용하도록 연결.
- 버전 메타데이터를 1.0.9/build 22로 갱신. Windows 런처 패키지 생성 성공; SHA-256 49ce8408127ded3b2f10f553dd5b928f91a5ed60cf6c1a55e23d1483dcbcfa85. ZIP 내부 아이콘/체크섬과 공개 배포 readback 결과를 계속 기록할 것. iPhone 실기기 및 Xcode 빌드는 이 작업에서 수행하지 않음.

## 2026-10-03 · CTR / 국가별 분석 연결 점검 — 1.0.9 / build 21
- Search Console query를 country, device, country+device, query+country, page+country dimensions로 조회했지만 모두 0행이었다. CTR/국가별 검색 리포트는 API 차원에서 지원되며, Selah 검색 노출 데이터가 아직 없어 수치를 표시할 수 없다. 기존 색인/노출 점검은 계속한다.
- 기존 first-party 이벤트 요약(10/01–10/03)은 page_view 46건, 익명 브라우저 ID 31개, 국가 KR/US를 기록했다. 이 값은 Search Console 클릭/CTR이나 검증된 인간 방문자 수와 구분한다.
- GSC Wizard 연결 계정 `rogan2534@gmail.com`에는 Google Analytics 권한(scope)이 없어 GA4 속성 조회 불가. 저장소 소스에서 GA4 `G-...`/gtag 측정 태그를 찾지 못했다. GA4 국가·기기 보고를 활성화하려면 사이트 소유 계정으로 Google Analytics 권한을 GSC Wizard에 연결하고 측정 ID를 사이트에 설정해야 한다. 비밀 키나 소유자 계정 권한은 추측하지 않는다.
- 사용자 요청: CTR 및 국가별 조회까지 작동시킬 것. 진행 다음 단계는 GSC Wizard에서 동일 소유 계정으로 Google Analytics 연결 승인 후 GA4 속성 연결 여부 확인; 그 후 적절하면 측정 ID 추가, 배포, GA4 실시간 이벤트 및 국가/기기 리포트 readback. GSC 검색 CTR은 Google 검색 노출이 발생한 뒤 재조회한다.## 2026-10-03 · Search acquisition baseline and visible signup CTA — 1.0.9 / build 21
- Google can crawl and has indexed the Selah root and Filipino page, but the latest settled Selah-only Search Console window (2026-09-03–2026-09-30; data through 2026-09-29) has zero page/query rows and zero sitemap-URL impressions. The parent GitHub Pages property has other projects; do not count its 88 impressions / 3 clicks as Selah traffic.
- Live first-party summary for 2026-10-01–03 reports 46 page-view events / 31 anonymous browser IDs (KR and US); source, medium and campaign are empty. This is not verified human count or attributable acquisition. Current Korean copy test: 7 exposures (A=3/B=4), 4 CTA clicks, 2 reading starts, 0 30-second reads, 0 saved reflections, 0 recorded signup events; sample is too small and may include QA.
- Corrected an accidental `.signup-cta { display:none }` in the shared root reader/landing CSS; the free account button had no visible signup path. Shared source is 1.0.9/build 21 and mobile bundle is generated from the root.
- Paid ad decision: hold the authorized ₩20,000 for now. Search Console has not yet measured post-Oct-2 crawl visibility, and acquisition source attribution is empty. Reassess after post-crawl query/page data and a clean tagged campaign path exist; do not buy unmeasurable visits.
- [x] Open PR #115, merge through the canonical `main` workflow, and verify Pages run `37096278336` plus the live visible-CTA stylesheet; readback is recorded below.
- [ ] After Google’s settled-through date passes the Oct-2 crawl, compare Selah-only page/query/country impressions and clicks with tagged first-party arrivals, signup, focused reading and reflection saves. Keep the existing 28-day / minimum-sample rules; no copy winner selected.
- Long-range owner-stated outcomes, not forecasts: 100,000 simultaneous users; 1,000,000 cumulative users; 300,000 registrations; 10,000 premium customers. Keep the active 1,000 verified-active-user goal as the first proof milestone. Count each stage separately and only from auditable measurements.

## 2026-10-03 · iOS reader startup and source identity — 1.0.8 / build 20
- Remove unrelated Matthew snippets during startup. Bundle actual book metadata for each default translation, restore the selected book without network-first catalog fallback, serialize book selection, and preserve verse DOM/scroll on unchanged renders.
- Root HTML remains authoritative; mobile runtime is copied/hashed. Native iOS bundle version now follows SHARED_APP_BUILD.json. Regression checks and device build/install evidence recorded in the PR; physical UI proof remains separate if Mirroring cannot connect.

## 2026-10-03 · Chapter keyboard shortcuts
- Reader uses Ctrl/Command+Z for the previous chapter and Ctrl/Command+Shift+Z for the next chapter, through existing cross-book navigation. Editable controls, open dialogs, IME composition and held-key repeats are guarded. Shared mobile source mirrored.
- Syntax/whitespace checks only; installed-app keypress behavior remains unverified.

## 2026-10-03 · App offline Scripture and local-first navigation
- Automatically download the selected translation in native/installed apps, reuse complete saved metadata and chapters before network access, hydrate a book into memory, deduplicate downloads, and retain saved Scripture. Added manual download/retry control.
- Web/mobile source mirrored; first complete download needs internet. Native rebuild/install and physical-device offline behavior remain separate verification stages.

## 2026-10-03 · Friend add entry and invitation links
- Added friend entry buttons in the header and shared-reading dialog, localized search by username/invitation URL, and personal invite-link sharing. Existing BlueCloud follow API is reused; no automatic follow or messaging.
- Root and mobile runtime mirrored. Syntax/whitespace checks passed; authenticated friend mutation and native installation have not been exercised. Deployment recorded in the pull request.

# TODO — Selah Windows/macOS parity

## 2026-10-03 · Scheduled GSC indexing checkpoint — 1.0.6 / build 19
- The GSC Wizard tracker ran at `2026-10-03T07:39:22Z`: 1/4 tracked URLs indexed (home page); the Korean download hub, English download hub, and Windows install page still report “URL is unknown to Google,” with no crawl time. All four inspections completed with zero warnings/errors.
- Search Analytics now reports settled data through 2026-09-29 (first incomplete date 2026-09-30), but still returns no query or page rows. No Google impressions or ranking positions are available yet.
- Sitemap report still shows the submitted sitemap pending with 0 warnings and 0 errors. The published 14-URL sitemap is live and valid; do not resubmit it repeatedly or claim the other pages are indexed. Continue at the next hourly checkpoint.

## 2026-10-02 · 모든 기기의 공통 UI와 데이터 계약 — 공유 앱 1.0.7 / 빌드 19
- 사용자 피드백: “이 앱이 만들어졌잖아 근데 이 성경 앱의 방식 ui 부터 시작해서 모든게 맥의 ios 웹사이트와 간극이 벌어져서 따로따로 서로 다른 데이터를 관리해야 하는 위험으로부터 이 데이터를 통합으로ㅓ 만들수 있는 그러한 시스템 만어줄래 ?”
- 공통 데이터 코어에 기록별 결정적 병합, 삭제 이력과 복구본, 필드별 변경 시계, 계정별 오프라인 보관, 기기/작성창별 공유 초안과 추가형 백업 가져오기를 구현했다. 전체 기록을 자동 갱신하고 무변경 PUT 루프를 막으며 인증/계정 병합 오류에는 로컬 기록을 보존한다.
- iOS 번들은 원본 index/스타일/이미지/스크립트에서 생성하고 SHA-256 검사로 오래된 UI 복사본을 차단한다. CI와 mobile sync 명령에 같은 검사를 연결했다.
- 공통 코어 13개 및 합성 Windows/Mac/iOS 브라우저 동기화 시험, 기존 폰트/출석 검사를 통과했다. 사용자 실제 계정 토큰/노트를 읽거나 쓰지 않았다.
- [x] PR #91 병합 및 Pages 배포 성공. 공개 공유 버전 1.0.7/19, 원본 6개 SHA-256 일치 및 새 익명 Windows/모바일 공통 계정 화면(오류 0)을 확인했다. 최신 main의 peer 변경을 모두 보존했다.
- [ ] 생산 BlueCloud 인증 왕복과 설치된 Mac/iOS 업데이트 후 실제 기기간 동기화·로컬 기록 유지 확인. Mac 요청은 releasepilot-hub main의 `20261002T111052Z_windows_selah_unified_build19`로 전달했으나 수신 회신은 없다. SSH는 신뢰한 Mac 탐색에 실패했다.
- 설계·증거: docs/UNIFIED_DATA.md; Mac 지시서: docs/handoffs/20261002-selah-unified-data-mac.md.

## 2026-10-02 · First exact-property Google index readback — 1.0.6 / build 18
- GSC Wizard's URL Inspection API checked the four tracked pages (4 of 2,000 daily inspections used): the Selah root is **Submitted and indexed**; `/download/`, `/en/download/`, and `/windows/download.html` are still **URL is unknown to Google** with no crawl time. The hub requests were already accepted earlier; don't repeat them. Let the pending sitemap and hourly tracker progress, then inspect on the next scheduled checkpoint.
- Search Analytics for 2026-09-02 through 2026-09-29 still returns no query or page rows, and Google gave no settled-through boundary. Treat this as “no data returned,” not as impressions, rankings, or a confirmed indexing cause.
- Re-audited all 14 sitemap pages after the favicon deployment: 14/14 HTTP 200, indexable, and favicon present; Windows guide remains at zero on-page issues. The remaining three medium flags are CJK word-count heuristics on substantive Japanese and Chinese pages.
- General web search also surfaced a separate App Store product named “SELAH Bible Meditation.” Keep Selah's Windows/Mac/iPhone distribution clear in search and social metadata so users can distinguish the web app; do not imply association with that publisher.

## 2026-10-02 · Localized page favicon coverage after 14-page audit — 1.0.6 / build 18
- PR #90 merged. GitHub Pages run `36998929617` succeeded; live `sitemap.xml` returns HTTP 200, parses as XML, and contains 14 URLs including `/windows/download.html`.
- Audited all 14 sitemap URLs through GSC Wizard: all returned HTTP 200 and were indexable; no critical or high issues. Its three medium “thin content” flags are on Japanese and Chinese pages whose substantive CJK paragraphs/lists are tokenized as only 21–29 space-delimited words. Do not pad those pages just to satisfy this word-count heuristic.
- The audit found the shared favicon was missing from 10 locale/guide pages. Added the existing Selah SVG favicon with correct relative paths; verify GSC Wizard's favicon results after deployment.
- GSC Wizard's CrUX report is not configured because no Chrome UX Report API key is available; no key or billing setup was attempted. Selah-specific Search Analytics still returns no rows and cannot establish a settled-through date.

## 2026-10-02 · Windows guide sitemap coverage and post-deploy evidence — 1.0.6 / build 18
- PR #88 merged and GitHub Pages deployment `36998459124` succeeded. Live readback confirmed the Edge install steps, checksum command, launcher ZIP, and checksum sidecar return successfully; the public SHA-256 sidecar matches the build 18 ZIP digest.
- Post-deploy GSC Wizard audit of `/windows/download.html`: HTTP 200, self-canonical, indexable, title 38 characters, 390 words, valid WebPage/WebSite structured data, and zero reported issues.
- Registered the home page, Korean and English download hubs, and Windows guide in the GSC Wizard indexing tracker for its scheduled checks. The exact Selah property still returns no Search Analytics rows and no settled-through boundary; do not infer indexing or rankings.
- Found the Windows install guide was missing from the published 13-URL sitemap despite being linked from both download hubs. Added its canonical URL to `sitemap.xml`; after deployment, verify the live XML contains 14 valid same-property URLs. The sitemap itself is already submitted and pending, so don't submit it again.

## 2026-10-02 · Windows install guide clarity after live GSC audit — 1.0.6 / build 18
- Rechecked the deployed Korean/English hub, Windows install page, and root with GSC Wizard: all 4 returned HTTP 200 and were indexable, with zero critical/high/medium findings. Remaining flags are low-severity heuristics: short Windows title/content and empty alt on decorative brand marks.
- Expanded the Windows guide with Edge's built-in install route, Windows Script Host fallback, accurate account/local storage and Bible-download behavior, plus a PowerShell SHA-256 verification command. Lengthened the Korean title consistently in title/Open Graph/JSON-LD.
- The page still describes the artifact as a hosted Edge launcher, not a native EXE/MSIX or Store release. App binary/version unchanged at 1.0.6/build 18. Validate links, checksum command examples, and deployed readback after publishing; do not repeatedly resubmit the pending sitemap or request indexing.

## 2026-10-02 · GSC Wizard audit and current release alignment — 1.0.6 / build 18
- The connected Selah URL-prefix property returned no query rows for 2026-09-02 through 2026-09-29; Search Console did not provide a settled-through boundary. Its sitemap is submitted and pending with zero reported warnings/errors. Google Search Console has not yet produced the first Selah-specific performance data.
- GSC Wizard audited the root, both download pages, and Windows install guide: 4/4 are HTTP 200 and indexable; 0 critical/high issues, 1 medium, 9 low. The Windows guide's missing canonical was the medium issue; added its canonical, longer description, social metadata, icon, and WebPage JSON-LD. Shortened the English download-page title from 64 characters.
- The hub's empty-alt logo is decorative next to visible “Selah” text, so it remains correctly ignored by assistive technology rather than receiving redundant alt text.
- GSC Wizard was connected and the exact Selah property was added to it. No unrelated property was hidden or removed.
- The Windows launcher advanced to build 18 during this work. The hub download links already target build 18; updated the Windows guide's meta description, Open Graph summary, and WebPage description to match it.

## 2026-10-02 · Search-intent copy for the download hub — 1.0.6 / build 17
- Google result samples for Korean Bible-meditation queries were weighted toward mobile app-store pages. Added concise, verifiable Selah feature copy for Matthew reading, timed meditation, reflection/prayer notes, and review quizzes to clarify the web app's usefulness before platform install steps.
- Added direct reading and meditation links on both language landing pages, and aligned the English/Korean descriptions with those visible features. Kept store and native-installer claims explicit.
- Selah-specific Search Console performance is still processing after property verification; evaluate impressions and queries after Google reports data before changing keyword strategy.

## 2026-10-02 · Search Console and current Windows release alignment — 1.0.6 / build 17
- Registered the exact Selah URL-prefix property `https://delight0517.github.io/selah-bible-meditation/`; Google verified it through the already verified parent property. Performance and indexing reports are still processing for the new property.
- Submitted the Korean and English download URLs for indexing; Google added both to its priority crawl queue. The live Google URL test says the English page is available to Google. This does not yet mean either URL is indexed or ranking.
- Submitted `sitemap.xml` to the parent property; the GSC dialog accepted it, while the list still shows its initial “Couldn't fetch” state. Direct Googlebot-UA HTTP reads returned 200 for robots, sitemap, and both landing pages; sitemap XML is valid.
- Live content extraction found the dedicated Windows download page now serves launcher build 17 (`d9e3951e1992315579416d2141b4fa0fcca2c718ecd644b73b0a029dbb1a01a0`). Updated both download-hub buttons to point at build 17; the prior build-15 link was stale relative to current main.
- Search-result evidence for broad Korean Bible meditation queries is dominated by mobile-app store listings; prioritize truthful Windows/Mac/iPhone web-app availability and platform-specific long-tail intent. GSC Wizard was found and suggested as the one useful plugin, but is not installed/connected yet; current Selah-specific query data is not available until Google finishes processing.

## 2026-10-02 · Cross-platform Selah download and install hub — web content / build 15
- User requested a promotional page that gathers Selah install/download options for Mac, iPhone/iOS, and Windows and can be discovered through Google Search.
- Added Korean and English `/download/` landing pages, platform-specific install steps, responsive shared styling, home-page entry links in all five supported UI locales, canonical/language metadata, WebPage structured data, and sitemap entries.
- Public release evidence at task start: Windows launcher build 15 is downloadable. Mac and iPhone instructions use the hosted web app (Safari Add to Dock / Add to Home Screen); no separate signed Mac installer, App Store listing, or IPA was observed. Do not claim those binaries exist.
- Next: validate the routes and links, publish the page changes, read back the deployed assets, then register/verify the Search Console property and submit the sitemap if account access permits. Google indexing is a request, not a guaranteed appearance/ranking.

## 2026-10-02 · Desktop zoom reset parity — source milestone 1.0.6 / build 13
- Compared Mac `SelahApp.swift` commands with the Windows Edge app-shell toolbar. Windows already had Ctrl+Alt+0, but lacked a visible reset action corresponding to Mac's **Reset Text Size** menu command.
- Made the zoom percentage button reset to 100% and labeled it with the same keyboard shortcut. The existing 80–150% zoom bounds and per-profile saved zoom remain unchanged.
- Mac checkout is still dirty and 63 commits behind `origin/main`; its local `selah://` Info.plist changes are not in the installed bundle. Native deep-link runtime remains open work.
- Windows build 12 deployed in PR #65; build 13 deployed in PR #66, merge commit `ecf477ca0be952c04e431aff7e4e8ca0abb7f394`, Pages run `36983685451`. Public readback confirmed `windows/BUILD_INFO.json` reports 1.0.6/build 13 and `windows/app-shell.js` contains the reset control and click handler. A hidden in-app-browser runtime snapshot of the deployed `?windowsShell=1` URL rendered the toolbar, reset button, and computer-reading target selector. This is shared-page rendering evidence, not verification of the active managed Edge app window.
- The earlier Mac relay item remains unreceived. Sent an updated urgent item `20261002T082415Z_windows_16467cb4`, which supersedes the older handoff and asks Mac to compare installed app registration, source provenance, and computer-reading fields while preserving dirty files. Receipt is still pending.
- Do not call the cross-platform goal complete until Mac receipt/source alignment, a visible Windows app launch, authenticated BlueCloud round trip, and Mac wrapper deep-link result are verified.

## 2026-10-02 · Managed Edge launch correction — source milestone 1.0.6 / build 12
- Diagnosed the Selah app window title `We couldn't load that extension.`: the installed launcher passed a Claude extension ID as an extra `--disable-extensions-except` item, although Chromium defines this switch as a comma-separated list of extension paths. The SixVPN unpacked extension path itself and PAC route were present.
- Removed the ID entry from the Selah launcher. It now permits only `%LOCALAPPDATA%\SixVPNBlocker\chrome_blocker` and retains the PAC URL and `--load-extension` protection path. Updated the installed per-user Selah launcher for future launches; left the currently running Edge window and processes untouched.
- Version/build tracking advanced to **1.0.6 / build 12**. Dry-run verification should confirm one permitted extension path and the existing PAC URL. Visible Edge UI/runtime confirmation remains pending.
- Mac handoff `SELAH-WINDOWS-DESKTOP-PARITY-20261002` was rechecked against GitHub `origin/main`: `status=open`, `received=false`, `completed=false`. Mac queue receiver files/runtime are absent; no reply is available yet.

## 2026-10-02 · Edge PWA registration and Mac follow-up (source milestone 1.0.6 / build 11)
- Read-only Windows registration check: `Selah App Window` Start/Desktop shortcuts target the installed VBS launcher, and no Selah PWA entry was found in the current default Edge profile. The existing managed Edge app-window launcher remains usable; official PWA installation through Edge is still pending.
- Sent Mac relay request `20261002T_WINDOWS_SELAH_MAC_FOLLOWUP_REQUEST` asking for receipt, review of the 1.0.30 deep-link scheme guard, safe dirty-checkout/build assessment, and authenticated target-side evidence. No Mac reply has arrived in `windows_inbox` or `windows_inbox_done`.
- Open verification: Edge PWA install/readback, Mac wrapper dispatch, authenticated two-device BlueCloud GET/PUT/GET, and preference convergence. No account data was changed.

## 2026-10-02 · Shared Bible text-language preference
- Add a Bible text-language selector to the Scripture library, independent of the interface locale. The selected language follows the UI locale until the user makes an explicit choice.
- Save explicit choices as optional `bibleContentLanguage: { code, updatedAt }` in BlueCloud state. Newer timestamps win; local wins ties. Keep selected translation IDs and the `selah-bible-library` chapter cache local because each browser profile may have different downloads.
- Include the explicit preference in portable backup v1; omit account owner, revision, and credentials as before.
- Change `mobile/scripts/copy-web.mjs` to copy source files from the current checkout instead of `origin/main`, preventing generated mobile assets from silently discarding local source edits.
- Current branch: `codex/selah-bible-language-sync`, based on `origin/main` at `9971628`. Original Windows checkout remains separate and dirty; no edits or merges were made there.
- Validation completed: inline JavaScript syntax parse, copy script `node --check`, JSON parsing for both schemas and manifest, `git diff --check`, and SHA-256 equality between root `index.html` and generated `mobile/www/index.html`.
- Contract audit: all 20 explicit fields in the current BlueCloud PUT serializer are declared by `selah-cloud-state.schema.json`; the client also preserves unknown remote top-level fields when writing.
- Mac snapshot audit: a new October 2 `cloudstate_*_selah.json` was found in the handoff repository. Without reading private record values, its top-level inventory showed `computerReadingRequest` and `computerReadingResult` (both null) that were not yet named in the schema; added them as opaque JSON extensions pending Mac source handoff. No `bibleContentLanguage` was present in that snapshot.
- Conflict-resolution follow-up: equal `bibleContentLanguage.updatedAt` values now use a deterministic lexical code tie-breaker, avoiding each device repeatedly reasserting its own value after simultaneous edits.
- Follow-up review corrected the Japanese default: the language selector now opens the bundled Japanese Matthew text (`matthew-jpn1965.json`, `jpn_loc`) instead of English. eBible.org identifies this 1965 Japanese New Testament as public domain; the asset already existed in the repository and mobile asset-copy list.
- Not yet verified: real browser interaction, authenticated BlueCloud GET/PUT/GET, cross-device timestamp convergence, Edge-managed PWA installation, Safari Add to Dock, and Mac runtime. PR #46 is merged and the GitHub Pages deployment for its merge commit succeeded.
- Mac source/data request `2026-10-01T210800_windows-selah-desktop-parity` remains `open`, `received=false` in `origin/main`.
- Source milestone version/build: **1.0.6 / build 7** (tracking label only; Windows protected Edge launcher updated; no native desktop binary built).
- Review artifact: PR [#46](https://github.com/delight0517/selah-bible-meditation/pull/46) merged at `b7b70a01a7200f8f3f905772c08f03a7c02c392a` (`2026-10-02T01:58:39Z`). No PR checks were reported; the Pages deployment run succeeded for the merge commit.
- Live deploy readback after merge (2026-10-02): public root and `manifest.webmanifest` both return HTTP 200. Manifest content type is `application/manifest+json`, `display` is `standalone`, and published HTML contains `bibleLanguageSelect`, the deterministic equal-timestamp code tie-break, and the Japanese default mapping (`matthew-jpn1965.json`, `jpn_loc`). This confirms the merged change is deployed; it does not verify signed-in sync or Mac runtime.
## Remaining parity work
- Read Mac operator's reply and reconcile the source/contract description with actual Mac runtime evidence.
- Use a synthetic test account/fixture to verify preference sync without exposing personal reflections or credentials.
- Install/launch the PWA in Edge and verify Windows app-window behavior; verify the same hosted source from Safari Add to Dock on Mac.
- On the current Windows PC, Selah shortcuts were being retargeted to the managed Edge wrapper, which cleared their URL arguments. Added a Selah-specific Windows Script Host launcher that carries the installed browser protection extension and PAC settings into app mode; real Edge rendering still needs a UI-capable verification session.
- Resolve whether anonymous local data should remain profile-local or needs a safer migration UX beyond the existing portable backup.

## 2026-10-02 · Authentication recovery and downloadable release — 1.0.6 / build 15
- User instructed continuing the public release and actively restoring GitHub authentication. Checked GitHub CLI and both standard/installed Windows Git Credential Manager paths without exposing credentials; no valid reusable credential was found. Started the official GitHub CLI OAuth device login and opened the approval page; the owner must complete browser authentication. Computer Use guidance forbids automated authentication-dialog interaction.
- The public open-source request provides authorization to license original Selah code. Added the standard MIT license and `THIRD_PARTY_NOTICES.md`, preserving Scripture/third-party rights and calling out unverified worldwide rights in the bundled Korean edition.
- Added a Korean/English Store listing draft with public app/privacy URLs. Publisher identity, product reservation, screenshots, actual age-rating answers, package validation, and certification remain pending.
- Added a Windows launcher release script using an explicit allowlist, SHA-256 file inventory and archive checksum. It excludes Scripture datasets, credentials, user records, browser extensions, proxy configuration and image/font assets. Output is ignored by Git; existing ZIPs are preserved.
- Source milestone advanced to **1.0.6 / build 15**. These are prepared local licensing/release changes, not proof of GitHub publication, Store approval, Edge PWA installation, or Mac/Windows authenticated sync.
- Built `Selah-Windows-Launcher-v1.0.6-build15.zip`. Verified exactly eight expected archive entries, all seven manifest file hashes, the archive checksum, packaging-script syntax, and the launcher dry-run command with the existing managed extension/PAC route. SHA-256: `e39e509e0f6bfec0ec26ae23108379e4217e2c0dd0d07ad08f1486dfe6a5f9c6`. No browser was launched by these checks; current runtime and Store-build behavior remain unverified.

## 2026-10-02 · Public Windows distribution request — 1.0.6 / build 14
- User requested Microsoft Store distribution and an open-source release so anyone can download Selah.
- Confirmed Windows is a hosted Edge PWA/app window; there is no `.msixbundle`, `.appxbundle`, `.exe`, or Store listing in this checkout. Microsoft documents publishing a PWA through Partner Center product reservation, PWABuilder packaging, and Store certification.
- Current checkout is clean before this documentation update; current GitHub CLI credential is rejected, so remote publication/push cannot be completed until GitHub authentication is restored.
- No repository-wide open-source license is present. The repository contains bundled Bible translations and third-party assets with distinct attribution/license terms; do not place one blanket license over those data/assets. Release brief records a code-only licensing boundary for the owner to approve.
- Store submission remains blocked on Partner Center account access, reserved product name/Package ID/Publisher ID, package generation, and required listing metadata/screenshots/age-rating answers. Public privacy policy URL is already available at `https://delight0517.github.io/selah-bible-meditation/privacy.html`.
- Updated the Windows release-readiness documentation and build tracker to **1.0.6 / build 14**. This is documentation/readiness tracking only; no app binary was built or installed and no public listing/source license was published.

## 2026-10-02 · Installed Mac native shell evidence and queue access
- User asked to continue the Selah Mac-to-Windows desktop parity work and avoid all UI/mouse interaction. Inspected over SSH only; no Mac app was launched.
- Mac has a `Selah Mac.app` installed in addition to Safari's `Selah.app` web app. Bundle ID `com.delight0517.selah.mac`; universal x86_64/arm64; minimum macOS 14; SwiftUI/AppKit/WebKit; executable embeds the shared Selah URL; signed entitlements include app sandbox and network-client access. Source found in the Mac checkout's `macos/Sources/SelahApp.swift`, repository `delight0517/selah-bible-meditation`, branch `codex/selah-mac-app`, commit `2fccdd7d09077404e631f4ef86ee4c8ed4973c55`. The checkout is 1 ahead/39 behind `origin/main` and contains dirty/untracked changes. Source documents a 760×620 minimum window, back/forward controls, 80–150% page zoom, focus-reading action, keyboard commands, and navigation gestures.
- Installed app and the local Xcode archive have different Mach-O UUIDs, and installed/archive Info.plist files lack version/build keys. A separate untracked `Selah-Info.plist` in the dirty Mac checkout declares version 1.0/build 1 and `selah://`, but these values are not in the installed bundle. Uncommitted `selah://read` handling maps to `homeAction=read&requestId=...`; the website handles `homeAction` but does not read `requestId`. Exact installed-source provenance and status of this local deep-link change remain open.
- The Mac Hub checkout's local inbox was stale. Left its existing branch and dirty Hermes file untouched, and delivered a separate local copy of the sanitized handoff into its `mac_inbox` over SSH. Upstream response synchronization is still pending.
- The Mac Hub checkout's local inbox was stale. Left its existing branch and dirty Hermes file untouched, and delivered a separate local copy of the sanitized handoff into its `mac_inbox` over SSH. Upstream response synchronization is still pending. Windows docs now describe the located Mac wrapper source and separate confirmed behavior from dirty/unbuilt changes.
- Rechecked Windows launch registration without opening a window: the stable Selah VBS launcher exists, and both the Desktop and Start Menu `Selah App Window` shortcuts invoke it through `wscript.exe`. This confirms local launch wiring, not visible Edge rendering or account-sync behavior.
- No app source/build version changed. Existing Windows source tracking milestone remains **1.0.6 / build 7**; no native Windows binary was built.
- Sent a separate Mac follow-up request at `/Users/rogan/appDev/releasepilot-hub/apps/_shared/cross_queue/mac_inbox/20261002T_WINDOWS_SELAH_SOURCE_HANDOFF_FOLLOWUP.md` with newly discovered Swift source provenance, dirty deep-link caveats, and targeted questions. SHA-256: `0c548fb36c3bc89bfddd8f5d2827553a6927f137a40d7977db7bac0193c08780`. Mac Hub checkout still cannot sync upstream because its GitHub authentication is unavailable; follow-up remains local/open.

## 2026-10-02 · Windows Selah desktop shell parity — 1.0.6 / build 8
- Mac source checkout confirmed the SwiftUI shell controls: back/forward, 80–150% page zoom, focus reading, shortcuts and navigation gestures. Exact installed binary provenance remains open because its Mach-O UUID differs from the local archive; Mac's inbox handoff is still unanswered.
- Implemented `windows/app-shell.js` for the managed Edge app/PWA: matching back/forward controls, 80–150% page zoom, focus-reading action, Alt+Left/Right, Ctrl+Shift+F, and Ctrl+Alt zoom shortcuts. It activates only for `windowsShell=1` and stores only the zoom preference in the local browser profile.
- Updated the protected Edge app launcher and PWA manifest start/shortcut URLs to include `windowsShell=1`. Both platforms continue to load the same hosted Selah application and BlueCloud contract; no cloud-state or portable-backup fields were added. Windows remains on the managed Edge route so the existing extension/PAC behavior is retained.
- Version/build tracking advanced from 1.0.6/build 7 to **1.0.6/build 8**. This is a source milestone; web deployment and visible Edge interaction are not yet verified. No window or mouse was used.
- Remaining: validate keyboard/focus/zoom in Edge app mode, confirm install via Edge PWA manifest, run authenticated synthetic BlueCloud round-trip and preference convergence, and verify matching behavior in the installed Mac wrapper. Keep the Mac handoff request open for installed-build provenance and wrapper storage details.

## 2026-10-02 · Selah computer-reading handoff parity — 1.0.6 / build 10
- Read-only Mac checkout source review confirmed an uncommitted `computerReadingRequest` / `computerReadingResult` / `computerReadingSession` implementation in its `index.html`; the Mac inbox handoff itself still has no reply. The Windows Pomodoro consumer in `timer1/lib/services/selah_computer_reading_service.dart` confirms UUID request IDs, `open-reading`, `targetPlatform=windows`, a two-minute request age, result fields `id/status/reason/openedWith/completedAt`, and a seven-minute session grace period.
- Added the matching Mac/Windows target selector, request/status UI, BlueCloud synchronization bridge, result polling, focus-reading deep-link activation, session heartbeat/pause lifecycle, and request/session merge behavior to the canonical Windows-hosted page. The handoff includes no Scripture, prayer, reflection, or credential content.
- Defined the three optional cloud fields in `contracts/selah-cloud-state.schema.json`. Updated `mobile/scripts/copy-web.mjs` to copy the shared handoff JS/CSS and Windows shell script into the mobile web bundle. Live command/session fields remain outside portable backup payloads.
- Advanced source tracking from 1.0.6/build 8 to **1.0.6/build 10**. The result poll also adopts the server revision before the next queued write. This is a source milestone, not a native Windows binary build. Authenticated BlueCloud convergence, actual Mac/Windows consumer launch, Edge PWA behavior, and installed Mac wrapper behavior remain unverified.
- No UI/mouse interaction. The Mac checkout remains dirty and the Windows Pomodoro checkout remains dirty; neither was reset or committed as part of this Selah change.
- Deployment readback: PR #58 merged as `c644db8`; GitHub Pages run `36977780538` succeeded for a later `main` commit containing it. Public page, handoff script, schema, and build metadata returned HTTP 200. A hidden browser rendered the Windows toolbar/target selector and both synthetic focus-reading deep-link forms. Authenticated BlueCloud convergence, actual Edge PWA registration, installed Mac wrapper dispatch, and live Pomodoro consumer handling remain unverified; a sanitized follow-up was written to the Mac local relay and has no acknowledgment yet.

## 2026-10-02 · Mac response reconciled into Selah parity record — 1.0.6 / build 15
- Read the Mac local relay reply at 18:20 KST. Corrected the evidence: `codex/selah-mac-app` no longer points at the previously cited `2fccdd7` source, its current remote tip is reported as `1a3b846`, and that branch is mobile iOS code. No canonical native SwiftUI wrapper source or installed bundle provenance is available yet.
- Installed Mac bundle facts remain: `com.delight0517.selah.mac`, universal x86_64/arm64, minimum macOS 14, embedded hosted URL, no version/build metadata, and no `selah://` registration. The wrapper's local storage/auth behavior is unverified.
- Mac confirmed the shared reading handoff source contract: `computerReadingRequest`, `computerReadingResult`, `computerReadingSession`; `homeAction=read` opens reader focus and `sessionId` associates/resumes the session. `requestId` in a URL is not consumed by the page. The Pomodoro consumer correlates its cloud result independently and has a Mac-target guard.
- Mac's source checks (`npm run check`, `node scripts/selah-computer-reading-smoke.js`, `node scripts/lock-safety-smoke.js`) passed. No Mac app build/open, authenticated cross-device BlueCloud exchange, or installed wrapper dispatch was verified. No credentials or personal reflections were accessed.
- Completed after that note: inspected the Windows target consumer; its targeted Flutter test passes 7/7, and the build-15 ZIP manifest/checksum validate. A clean-profile Edge launch was not run. Remaining: reconcile Mac local-vs-remote source and installed-app provenance, obtain authenticated synthetic BlueCloud GET/PUT/GET and cross-device convergence evidence, and verify the managed Edge app window without disturbing the existing browser session.
## 2026-10-02 · Fresh Mac source and live build reconciliation — 1.0.6 / build 15
- A direct read-only SSH recheck found the local Mac Selah checkout at HEAD `2fccdd7d09077404e631f4ef86ee4c8ed4973c55`, branch `codex/selah-mac-app`, 1 ahead / 71 behind origin/main. The committed tree contains `macos/Sources/SelahApp.swift`, an Xcode project/target, and `macos/README.md`; the Swift source and project have dirty changes. This is a real source snapshot, but installed app provenance remains unproven and the remote branch tip may differ. Sent `20261002T_WINDOWS_SELAH_SOURCE_RECONCILE_REQUEST.md` to Mac `mac_inbox`; no reconciliation reply observed yet. Mac checkout remains untouched.
- Fresh public HTTP readback: hosted `windows/BUILD_INFO.json` is still 1.0.6/build 13. Public `app-shell.js` includes the visible 100% zoom-reset button and click handler. Local commit `639ddb1` prepares build 15 licensing/launcher files but is not on origin/main; do not report build 15 as publicly deployed.
- Local launcher dry-run emits the managed Edge route with the SixVPN extension path, PAC URL, and `?windowsShell=1`; current running Edge process still has the older launch arguments/error title, so the corrected managed Edge app window has not been runtime-verified. No browser was terminated or restarted.
- Node syntax checks passed for `windows/app-shell.js` and `scripts/computer-reading-handoff.js`; JSON parsing passed for build metadata, both schemas, and Store listing; release ZIP's seven payload hashes and archive checksum match. These checks do not prove live app launch or authenticated two-device sync.
- GitHub public fetch works; saved GitHub CLI credential remains invalid and its web login has not completed. Local release commit and follow-up docs are prepared; no push/deploy yet. Authenticated BlueCloud round trip and Mac wrapper provenance/runtime remain open.
## 2026-10-02 · Windows Selah target-consumer tests — 1.0.6 / build 15
- Ran `flutter test test/services/selah_computer_reading_service_test.dart` in `C:\Users\delig\Desktop\app dev\timer1`; **7/7 tests passed**. Coverage: accept a fresh Windows-target request; reject malformed/wrong-platform/expired/future-dated requests; keep running heartbeat active until seven minutes; enforce the paused-session grace deadline; ignore ended/malformed sessions.
- No Pomodoro source/test files were edited by this Selah task. The test is source-level validation; it does not exercise the currently installed Pomodoro runtime, launch Selah, make authenticated BlueCloud writes, or prove Mac/Windows convergence.
## 2026-10-02 · Public Windows launcher download route prepared — 1.0.6 / build 15
- Added `windows/download.html` with Korean/English install steps, exact app limitations, live app/privacy/source links, direct ZIP link, and SHA-256. Added the verified 8 KB launcher ZIP and checksum under `windows/downloads/`; its seven packaged file hashes and archive checksum match, and it includes no Scripture dataset or user settings.
- Root README now links the Windows download page. Intended post-deploy URL: `https://delight0517.github.io/selah-bible-meditation/windows/download.html`. It is **not public yet**: local source branch includes release commit `639ddb1` plus uncommitted delivery/evidence docs; GitHub Pages still serves build 13, and GitHub CLI auth is awaiting owner approval.
- Direct Mac reconciliation request `20261002T_WINDOWS_SELAH_SOURCE_RECONCILE_REQUEST.md` was written to the Mac `mac_inbox` over the confirmed SSH connection at 18:27 KST. At the last read it had no Mac response yet. The Mac checkout remained untouched.
## Current state at 2026-10-02 — awaiting GitHub owner authentication
- Local branch `codex/selah-public-release-20261002` now has commits `639ddb1` (MIT scope, Store draft, packaging script, build 15 metadata) and `e73358e` (public Windows download page and ZIP). Working tree was clean after these commits; branch is ahead of public `origin/main` by two commits.
- `gh auth status` still says the saved `delight0517` token is invalid, and no `gh auth login` process is running. Public read-only fetch works, but push/PR/Pages deployment cannot be completed until the repository owner reauthenticates.
- Public HTTP remains build 13; build 15 download page and ZIP exist only in the local branch until push and Pages readback.
- Mac source reconciliation request is in the Mac local inbox; latest check found no response. Mac native wrapper checkout remains dirty and was not changed or built.
## 2026-10-02 · Installed Windows Selah launcher runtime readback — 1.0.6 / build 15 candidate
- Confirmed installed `%LOCALAPPDATA%\Programs\Selah\Launch-Selah-App.vbs` SHA-256 equals the repository launcher (`5586025B2EED8A498D72147559D247EB21E7C629C823F7676889ADB8F6391FBA`). Its dry-run contains the managed extension folder, existing PAC URL, and hosted `?windowsShell=1` app URL.
- The first launch was forwarded to the existing Edge singleton and kept the old extension-error title. I requested graceful close only for that Selah error window; Edge PID 38508 remained alive. A later launch through the installed launcher changed its main-window title to `무료 성경 묵상 앱 셀라 | 마태복음 읽기와 기도 기록`; the process reported responsive. No Edge process was forcibly terminated.
- This verifies the installed launcher opens the hosted Selah page in Edge. It does not prove the forwarded app URL's live query state, visible toolbar interactions, extension runtime state, PWA registration, or authenticated BlueCloud synchronization. The process retains its original startup command line, so treat toolbar state as unverified in this live Edge instance.
## Latest continuation checkpoint — 2026-10-02
- Local branch now contains four reviewable commits ahead of public main; latest is `48bc0bc`. The verified Windows launcher ZIP and public download page are committed but remain unpublished until authentication is restored.
- Installed Edge launch now shows the live Selah page after a graceful close of the stale error window and a relaunch through the installed VBS. No Edge process was force-killed. The current Edge process kept its old startup arguments, so treat the Windows toolbar query and controls as not yet proven in that process.
- The Mac reconciliation request remains unacknowledged in the local Mac relay. The live Mac checkout provides a dirty, 71-commits-behind SwiftUI source snapshot, but installed app provenance is unknown.
- Remaining proof for the full objective: publish/read back build 15 and the Windows download; resolve the Mac source/installed provenance; verify actual Edge toolbar interactions; and perform a synthetic authenticated BlueCloud round trip/convergence test. Existing source tests and release-package integrity checks passed; they do not substitute for these runtime checks.

## 2026-10-02 · GitHub login succeeded; repository write permission pending
- User confirmed completing GitHub device approval. The official CLI flow exited successfully, and `gh api user` identified the active account as `delight0517-art`.
- `gh repo view delight0517/selah-bible-meditation` confirmed `visibility=PUBLIC`, default branch `main`, and `viewerPermission=READ`. This account cannot publish the prepared branch, merge it, or create a release in the canonical repository. The inactive original owner's stored token is still invalid.
- Public Git fetch succeeded and the prepared branch was clean before this evidence note. Started a fresh official device login and asked the user to approve it using the `delight0517` owner account, or report if that account is unavailable. No credential/token contents are recorded here.
- Prepared Windows source/download milestone remains **1.0.6 / build 15**; no app code, ZIP, runtime installation, or public deployment changed in this authentication check.

## 2026-10-02 · Public Selah source and Windows launcher release — 1.0.6 / build 15
- Owner GitHub login succeeded as `delight0517`; the canonical repository reports `ADMIN`. PR [#71](https://github.com/delight0517/selah-bible-meditation/pull/71) merged as `a30a72d10746b0ff3e2da7f194eb78af98501462`.
- GitHub Pages workflow [36993348281](https://github.com/delight0517/selah-bible-meditation/actions/runs/36993348281) completed successfully. Public readback returned HTTP 200 for build 15 metadata, the bilingual Windows download page, MIT license, launcher ZIP, and checksum sidecar. GitHub's license API identifies root source license as MIT.
- Created public GitHub Release [`v1.0.6-build15`](https://github.com/delight0517/selah-bible-meditation/releases/tag/v1.0.6-build15) with the launcher ZIP and checksum. Downloaded the public ZIP and verified its 8,106-byte SHA-256 matches the published page and sidecar: `e39e509e0f6bfec0ec26ae23108379e4217e2c0dd0d07ad08f1486dfe6a5f9c6`.
- Store submission remains open. No Partner Center product reservation, package/publisher identity, Windows `.msixbundle`, `.classic.appxbundle`, actual Store screenshots/age-rating questionnaire, or certified listing has been created. The Store listing draft is `windows/store-listing.json`; worldwide rights for every bundled Bible edition, especially Korean translation data, still need confirmation before Store distribution.
- Existing Windows launcher target tests passed 7/7 and the downloaded package member/checksum checks passed. This does not prove a Store installation, a fresh-profile PWA interaction test, or authenticated Mac/Windows BlueCloud convergence.

## 2026-10-02 · Mac deep-link reading-session continuity — 1.0.6 / build 16
- Compared the live Mac checkout's dirty SwiftUI URL handler with the canonical shared-page consumer. The wrapper maps `request` to `requestId`; the page previously ignored that ID and could assign a different reading `sessionId` from the BlueCloud request.
- Updated `scripts/computer-reading-handoff.js` to match the request ID, require a matching target platform and unexpired request, and use its existing shared session ID. If BlueCloud delivers the request after reading opens, the active session is reconciled on merge. Personal reflection content is not involved.
- Mac's installed app still lacks a registered `selah://` scheme. Sent Mac a separate request to register/install the receiving handler and provide version/build/source provenance plus a synthetic request readback.
- PR #71 merged as `a30a72d10746b0ff3e2da7f194eb78af98501462`; Pages deployment run `36993348281` succeeded. Public `windows/BUILD_INFO.json` reads back 1.0.6/build 15, the download page is HTTP 200, and the build-15 ZIP is HTTP 200 with the locally verified SHA-256. The prior build-15 deployment is confirmed.
- Source milestone advanced to **1.0.6 / build 16** for the session-correlation update. Windows build-16 ZIP was created and its eight-entry archive manifest verifies all seven payload hashes; SHA-256 is `ef21c18608c98f16998e330d945f8ced9c8a1913627db65798c50c495538fb8c`. Authenticated two-device BlueCloud convergence and Mac URL-scheme launch remain pending.
## 2026-10-02 · BlueCloud / Google login recovery — 1.0.6 build 17
- User feedback: Retry BlueCloud/Google login, diagnose the error, and fix it.
- Live retry rendered the Google button. Clicking it produced `[GSI_LOGGER]: The given origin is not allowed for the given client ID.`
- Confirmed production `/api/auth/google-client-id` matches `brainwire-web` in Google Cloud project `rogan-youtube`. Its only authorized JavaScript origin was `https://brainwire-f2gf.onrender.com`; Selah runs on `https://delight0517.github.io`.
- User approved saving the Selah origin on 2026-10-02. Saved `https://delight0517.github.io` in the matching Google Cloud OAuth client and reopened its settings to confirm persistent readback. No secrets, redirect URIs, or scopes changed.
- App fix: Dedicated Google status and retry UI; concurrent-load deduplication; request and script timeouts; Retry-After cooldown on HTTP 429; reload after failed script/config requests. Google load errors no longer overwrite password-login errors. Mobile web asset copying includes the recovery helper.
- Five regression scenarios passed: concurrent initialization, rate-limit cooldown/retry, failed script/retry, aborted request/retry, missing server configuration. Actual Google account authorization and cloud synchronization remain unverified.
## 2026-10-02 · Windows Selah desktop polish and parallel worktrees — 1.0.6 / build 17
- [x] Refined the desktop title, Bible reading card, meditation journal, prayer field, and saved-note cards with a calm forest/ivory visual system in `styles/desktop-polish.css`; styles apply above 760 px and keep the existing mobile presentation.
- [x] Added `docs/WORKTREE_WORKFLOW.md` and `scripts/Start-WorktreeTask.ps1` so each concurrent chat can start from a clean `origin/main` worktree, own a separate branch, and share code through pull requests with explicit status/evidence. Complements the open repository governance PR #63.
- Version/build: hosted Selah source 1.0.6 / build 17. The Windows launcher package version is governed separately by its build archive.
- Initial browser check after build 16 exposed an existing one-child `.layout` grid that left unused blank space and narrowed the main panel. The desktop stylesheet now makes that wrapper a full-width block and uses the app's live theme variables so dark mode and user colors continue to apply.
- Follow-up desktop viewport inspection found the Bible reader wrapper also had only one visible child while its notebook was intentionally moved to the focus-mode drawer. Center the reader card at a readable 920 px maximum instead of leaving an empty second column.
- Added `?v=17` to the desktop stylesheet URL after confirming GitHub Pages serves CSS with a 600-second cache lifetime; this avoids keeping a previously cached design after publish. Browser verification remains pending.

## 2026-10-02 · Google OAuth provider correction and account-login handoff — build 17
- User feedback: Proceed with all required steps; user will handle account login and verification.
- Saved the missing Selah JavaScript origin in Google Cloud, then navigated back to the client detail screen and confirmed it persisted alongside the existing BlueCloud server origin.
- The live Selah app renders the Google button without the prior rate-limit message. After a test click, no unauthorized-origin error was captured; an account chooser/new tab was not observable through the automated browser, so this is not proof of completed account sign-in.
- Displayed the live Selah login screen and requested that the user complete Google account selection/login. Authenticated BlueCloud connection and data synchronization remain pending user login.
- Prior build 17 deployment and recovery regression checks remain valid. Provider settings take effect separately from the deployed application build; Google console notes a propagation delay of 5 minutes to several hours.
## 2026-10-02 · Authenticated login and missing-guide-button correction — build 18
- User completed Google login in the visible live Selah page. Readback confirmed the Account control and signed-in account panel.
- Follow-up readback showed `Sync failed`; the hidden auth error contained `Cannot set properties of null (setting 'hidden')`. DOM inspection confirmed the removed `guideStart` control is absent.
- Root cause: sync finished its cloud request/merge and then attempted to update the absent optional guide button. The resulting local TypeError was reported as a cloud sync failure. Guide completion had the same missing-element assumption.
- Guard both optional guide-button updates and hide the Google sign-in section once the account is connected. Provider authorization and Google login were verified; final Synced UI readback remains unverified after deployment.
- Changed the stylesheet cache token to `?v=17-9b9913c` after the follow-up UI check showed the `?v=17` response was still cached after confirming GitHub Pages serves CSS with a 600-second cache lifetime; this avoids keeping a previously cached design after publish. Browser verification remains pending.

## 2026-10-02 · Windows desktop polish deployed and interaction checked — hosted source 1.0.6 / build 18
- GitHub Pages deployment for `main` commit `dfc49056eb71d126b6e6c5542fadb80eac276c09` succeeded (run `36997319087`). Cache-busted public HTML and desktop CSS both returned HTTP 200; CSS link is `?v=17-9b9913c`.
- At a 1440 px browser width, live DOM readback showed the Bible reader centered at 920 px. Clicked through Matthew 2 and restored Matthew 1; Korean Bible rendering and light theme were confirmed. Tested timed meditation, opened its notebook, entered reflection and prayer drafts, confirmed the entered values in both fields while the on-device save notice was visible, then cleared both test strings and ended the session without creating a saved test note. Browser console had no errors.
- The parallel-work setup is live on `main`: `docs/WORKTREE_WORKFLOW.md` and `scripts/Start-WorktreeTask.ps1` create isolated `origin/main` task branches/worktrees and share changes through PRs with ownership and evidence in `TODO.md`/task notes. Each chat must preserve existing dirty trees and inspect new `main` commits before integration. Root governance PR #63 remains open for repository instruction/workflow files. GitHub branch protection was enabled separately: PR required, zero approvals required for solo work, admins included, force pushes and deletion disabled; no required status check is configured yet.
- Scope/evidence limit: this is a hosted web-source style change, not a new Windows launcher binary. BlueCloud cloud sync and final saved-note creation were not exercised.

## 2026-10-02 · Reject invalid Selah handoff session URLs — 1.0.6 / build 19
- Read the Windows Pomodoro consumer's actual handoff URL, which includes `requestId` and `sessionId`. Build 16 allowed an unmatched URL session ID to bypass the target and expiration guard.
- Build 19 only uses a bare URL session ID when no request ID is present. If a request ID exists, require the cloud request to match it, target this platform, and have an age from zero through 120 seconds before adopting its session ID.
- PR #81 had already published launcher build 18 for Google-login recovery, so the target-validation change was rebased and assigned build 19. The Korean/English download hubs and detail page now point to build 19. Regression coverage includes matching request, missing request, wrong platform, expired/future/missing timestamp, and legacy no-request session URL. Actual authenticated cross-device sync and installed Mac URL dispatch remain pending.

## 2026-10-02 · Selah build 19 handoff validation and Mac follow-up
- Build 19 was generated with `windows/Build-Selah-Release.ps1` after PR #81 assigned build 18 to Google-login recovery. Launcher ZIP SHA-256: `a74960674a975ff3e49c5e834355af58489b623dadae8a60b4b22b49132da1ae`; release manifest reports version 1.0.6/build 19 and all 7 payload hashes verify.
- Added `scripts/test-computer-reading-handoff.cjs`; Node syntax and six request/session scenarios pass. A matching Windows request uses its shared session ID; missing, wrong-target, expired, future-dated, or timestamp-less requests do not use the URL session fallback; legacy session-only links remain compatible.
- Sent Mac follow-up `20261002T105406Z_windows_94ea382b` through releasepilot-hub `origin/main`: verify current Mac source and installed bundle URI registration, align the request/session contract, preserve dirty work, then safely build/install and synthetic-readback if build policy and live process state allow. Official queue readback at 2026-10-02 20:06 KST: status `open`, `received=false`, `completed=false`; Mac receipt and response are still pending.
- GitHub PR #83 merged as `e9e62f65f5bda563492d841f113ae18e90d182ea`; Pages run `36998929617` succeeded. Deployment and public ZIP readback are recorded below. Authenticated Mac/Windows round-trip and Mac installed `selah://` launch remain unverified.

## 2026-10-02 · Build 19 deployment and Windows public artifact readback
- PR #83 merged to `main` as `e9e62f65f5bda563492d841f113ae18e90d182ea`; Pages workflow `36998929617` completed successfully.
- Public `windows/BUILD_INFO.json` reads version 1.0.6/build 19. Public JS contains the 0–120 second request-age guard; Korean/English download hubs and the detail guide resolve to the build-19 ZIP and matching checksum.
- Downloaded the public ZIP in memory; SHA-256 matches `a74960674a975ff3e49c5e834355af58489b623dadae8a60b4b22b49132da1ae`. GitHub Release `v1.0.6-build19` contains the ZIP and sidecar checksum.
- This Windows package remains an Edge app-window launcher, not a standalone EXE/MSIX. Mac installed scheme/provenance and authenticated cross-device data convergence remain open.

## 2026-10-03 · Growth baseline and free-signup CTA deployment
- [x] Fixed the hidden free BlueCloud signup CTA on the normal homepage; it wraps at narrow widths and remains hidden in immersive reading mode.
- [x] PR #115 merged as `3c42697d2e0822ff95b834be11cea567480edbab`; Pages run `37096278336` succeeded for that commit.
- [x] Live HTTP readback confirms the CTA CSS and shared app version 1.0.9/build 21. The signup flow itself was not completed or verified.
- [ ] Wait until Search Console's settled-through date passes the Oct 2 crawls; compare Selah-only impressions/clicks and queries with tagged first-party visits, reading/reflection events and verified signups. No current data identifies 100,000 concurrent users, 1,000,000 cumulative users, 300,000 registrations or 10,000 premium customers; those remain owner-stated aspirations, not forecasts.
- [ ] Keep the ₩20,000 ad allowance unspent until campaign attribution can connect an acquired visit to reading/reflection and verified signup. Continue excluding personal Instagram.

## 2026-10-03 · Configure free change notification for supported search engines
- [x] Publish `selah-indexnow-key.txt` under the Selah URL prefix, compare its live content to the generated project key without echoing the key, and submit only the changed Korean homepage through the IndexNow protocol.
- [x] Record protocol acceptance separately from search indexing. PR #118 / Pages run `37097961779` published the key file; live byte comparison passed; the global IndexNow endpoint returned HTTP 200 for the Korean homepage only.
- [ ] Check later Bing/Naver result and crawl status; Google Search Console still has zero settled Selah impressions through Sep 29 and some locale guides report `Crawled - currently not indexed`. IndexNow does not notify Google or guarantee indexing.

## 2026-10-03 · Localized SERP and preview checkpoint
- [x] Reviewed current GSC page/query evidence, direct mobile inspections of the Tagalog and Brazilian Portuguese guides, and on-page SEO for the Korean and English landing pages. The sample remains pre-change for the main CTA and contains no settled Selah search row.
- [x] Visually checked the configured Korean, Tagalog, and Brazilian Portuguese preview cards. Their content matches the local Bible-reading promise; the actual Google-rendered title, description, and image are still unknown.
- [ ] Wait for the post-Oct-2 crawl dates to settle in GSC; decide whether to improve the two crawled-but-not-indexed guide pages only after comparing actual search queries and downstream local-market activity. Do not infer the cause from low-severity audit heuristics.

## 2026-10-03 · North Star growth plan and execution gates
- [x] Recorded the owner's four long-range aspirations separately from current performance and retained 1,000 verified active users as the first evidence milestone.
- [x] Wrote a staged plan covering metric definitions, Korea-first validation, locale selection, search-result/landing promise match, one-variable experiments, the ₩20,000 spend cap, premium evidence and concurrent-load readiness: `docs/GROWTH_PLAN_NORTHSTAR.md`.
- [x] Gate 0 instrumentation deployed: source-preserving attribution and successful username/password signup events are live; PR #190 merged as `063a8da`, Pages run `37145789565` succeeded, and localized public routes/script returned HTTP 200 with funnel handlers present. Static exposure, primary reading CTA, successful reader open, first eligible reflection, shared short-lived duplicate reservation, native Capacitor exclusion, and no note/visitor IDs are confirmed in deployed source.
- [ ] Complete Gate 0: verify non-QA live aggregate readback connects tagged arrivals through focused reading, saved reflection, and signup across real localized entry routes. Current GSC Selah impressions/clicks are still zero, and the existing global funnel has no recorded rows. Search Console and app metrics can only be compared at aggregate market/date level, not joined to individual visitors.
- [ ] Hold spend at ₩0 until Gate 0 and the Korean need/intent check pass; then cap the first high-intent paid probe at ₩5,000 and keep ₩15,000 reserved pending activation evidence.
- [ ] Keep weekly research checkpoints; if sample is below the stated floor, continue observing rather than forcing a country, variant or “winner.”
- [x] Prepared the Korea-only `kr-gentle-invitation-v1` first-screen image experiment with two non-coercive Scripture invitation designs and existing aggregate funnel events; added its observation rules to `GROWTH_RESEARCH.md`.
- [x] Publish the invitation assets and Worker allowlist before counting exposure. PR #146 merged as `85279317bcd88f3e61e100c2c10f7af127744489`; Pages run `37118904585` succeeded; live homepage and both assets returned HTTP 200. Worker `b6e21128-e734-4016-80ee-4788b2b85258` returned the expected CORS-enabled summary response.
- [ ] Observe at least 28 days and 50 eligible exposures per variant. At initial live readback the new experiment had no rows; this means no recorded exposure yet, not zero visitors. Keep Google SERP image selection/CTR separate from the on-page creative test; no paid campaign or search-preview claim is implied.

## 2026-10-03 · Korean low-pressure God-curiosity creative test v2
- [x] Added a new Korea-only A/B creative assignment `kr-spiritual-curiosity-v2` to distinguish a direct “하나님을 더 알고 싶으신가요?” invitation from a quieter “하나님이 궁금해진 날…” invitation. The earlier `kr-gentle-invitation-v1` remains a separate historical ID.
- [x] Reused the existing anonymous funnel events and Korean-market gate; synced the web source and creative assets into the mobile bundle. No new analytics service, account, or data field was added.
- [x] Published PR #148 as `db7e10ab132320adb569f2047e98e9e0007b425e`; Pages run `37120362878` succeeded, homepage and both assets returned HTTP 200, Worker `00282dc2-2277-443a-baea-9863a58cd7f6` is active, and the summary endpoint returned HTTP 200. No v2 rows were present yet; no production test event was inserted.
- [ ] Observe at least 28 days and 50 eligible exposures per variant in South Korea; wait for enough data and compare focused reading, reflection saves, and confirmed signups before choosing any winner.

## 2026-10-03 · 한국어 부담 없는 말씀 초대 썸네일 실험 준비
- [x] A/B 썸네일 시안 2종을 1200×630 JPG로 제작하고 `marketing/experiments/`에 저장. 하나님을 알고 싶은 마음/궁금함을 말씀 읽기 초대로 연결하되, 영적 부족감·긴급성·보장 표현은 사용하지 않음. 모바일 앱 런타임에는 복사하지 않음.
- [x] `GROWTH_RESEARCH.md`에 가설, 측정 지표, 개인정보 한계, Google 이미지 노출 실험의 한계, 기존 한국어 문구 실험 후 순차 진행 규칙을 기록.
- [ ] 현재 `kr-spiritual-curiosity-v2`의 관측이 끝난 뒤, 노출·링크 클릭을 제공하는 소유/허가 채널을 확정하고 같은 이벤트 파이프라인으로 별도 실험 ID를 등록. 개인 Instagram 및 유료 집행은 제외.
- [ ] 28일 및 시안별 적격 노출 50회 이후 읽기·묵상 저장·가입까지 검토. 지금은 배포·게시·노출을 시작하지 않음.

## 2026-10-03 · 검색 유입과 first-party 지역 분석 재대조
- [x] Selah 경로 필터를 적용한 Search Console page/query 및 country/page 보고를 새로 확인: 2026-09-03–09-30 0행, 확정은 09-29까지.
- [x] 10월 1–3일 기존 집계 API 최신 readback을 기록: 55 page:view 이벤트, 브라우저 월 ID 34, KR 45 / US 10 이벤트. 경로·기기·국가 값은 사람 수나 유입 채널로 해석하지 않음.
- [x] API가 hostname/origin을 반환하지 않고 일부 locale/path/device 교차 합계가 총합과 불일치함을 기록. `GROWTH_RESEARCH.md`의 `GATE0-SEARCH-ANALYTICS-20261003-02` 참조.
- [x] “오늘 방문” 카운터가 월간 합계를 읽던 오류를 수정해 UTC 오늘 행의 익명 고유 브라우저 수를 사용하게 함. 공통 웹·모바일 원본을 동기화하고 버전을 1.0.10/build 25로 갱신.
- [x] 배포 소스를 `delight0517/releasepilot-reports`에서 확인하고 기존 `cloud-account-storage` 요약 API에 Selah 전용 Origin 호스트·국가·언어·경로 페이지 열기 합계를 추가. PR #14 병합 후 Worker 배포 `adef387f-d44d-47d2-a1ca-829ec2c5d4e3`; 요약 응답 필드는 확인했으며 새 방문 행은 아직 없음. 과거 행은 출처를 소급 분리하지 않음.


## 2026-10-03 · 개발자 통계에 사이트 호스트·페이지 경로 연결
- [x] 같은 `cloud-account-storage` 요약 API의 새 `pageViewsByOriginCountryLocalePath` 필드를 개발자 통계에 표시하도록 적용. 브라우저가 보낸 Origin 호스트, 국가, 인터페이스 언어, 페이지 경로별 **페이지 열기 횟수**이며 사람 수나 검색 유입으로 계산하지 않음.
- [x] 공통 웹·모바일 파일을 47개 기준으로 동기화하고 앱 버전을 1.0.10/build 26으로 갱신. JavaScript 구문 검사와 source parity 검사를 통과.
- [x] GitHub Pages build 26 배포 확인: PR #152, Pages run `37125069069`, live `SHARED_APP_BUILD.json` 1.0.10/build 26, host/path panel present in public HTML.
- [ ] 다음 실제 페이지 열기부터 새 호스트별 집계가 나타나는지 확인. 기존 데이터의 배포판/호스트 분리는 미확인으로 유지.


## 2026-10-03 · Search and campaign measurement checkpoint
- [x] Rechecked Selah-filtered GSC web pages/queries and Image pages for 2026-09-03–09-30: 0 rows, settled through 2026-09-29. Google Web-result thumbnail choice remains unobserved.
- [x] Compared Metricool's one published 2026-10-02 Instagram post (84 reach, 186 views, 3 likes/interactions) with first-party Selah campaign totals. No Instagram UTM campaign row is recorded; cause may be no click or missing event attribution, so do not credit the post with site visits.
- [x] Rechecked the 30-day product experiment: `kr-home-copy-v1` has 7 exposures / 5 CTA clicks / 2 reading starts / 0 focused readers / 0 saved reflections / 0 signups / 4 return events; `kr-spiritual-curiosity-v2` has no rows. Do not infer people or winners from these counts.
- [ ] Confirm that the connected Instagram profile is the separate Selah marketing profile before using it for the queued thumbnail comparison; if it is personal, keep it excluded and choose a public channel with clickable links and usable analytics.
- [ ] Wait for additional settled GSC data and genuine, attributable product events before changing the Korean market promise or calling a creative variant successful.

## 2026-10-03 · Windows Store release continuation
- [x] Continue from a clean task worktree based on fetched `origin/main` (`ba286351`); leave older parallel Selah worktrees and their changes untouched.
- [x] Confirm version split: hosted Selah 1.0.10/build 26; latest Windows launcher ZIP 1.0.9/build 23. The launcher is still not a Store package.
- [x] Read back HTTP 200 for the live app, PWA manifest, privacy page, and 192/512 PNG icons; confirm public MIT license and third-party notice paths.
- [x] Manually verify Bible navigation Matthew 1 → 2 → 1 and open/dismiss the timed-meditation introduction without saving test content.
- [ ] PWABuilder assessment could not start: after entering the public app URL, its Start control remained disabled. Retry only after diagnosing the builder form; do not record a pass without a report card.
- [ ] Continue with live PWABuilder findings, reserved Partner Center product identity, Windows package generation/validation, real listing assets and age rating, certification, and installed Store build verification.
- [ ] Verify worldwide distribution rights for every bundled Bible edition before packaging any Scripture dataset.

## 2026-10-03 — Narrow-window invitation layout (build 27)
- User feedback: current UI text stretches into excessive vertical lines.
- Confirmed at 644px viewport: invitation copy shrank to 15.9px while action group reserved 558.5px; card height reached 612.6px.
- Fix: preserve a readable copy width, wrap controls, and stack invitation/actions through 760px. Keep existing font preferences and other chats' thumbnail changes.
- Verification: responsive browser checks and published Pages readback tracked with this release.

## 2026-10-03 사용자 피드백 — 유입 문구 범위 (1.0.10 / build 28)
- [x] “하나님을 알고 싶은가요” 전체 적용 중단, 기존 디자인 보존.
- [x] 전용 캠페인 진입에서 기존 화면 A / 초대 추가 B 실험으로 분리.
- [x] v2와 측정 분리 및 QA 통계 제외.
- [ ] 28일 이상 실사용 데이터로 읽기·저장·가입 전환 관찰; 실제 유입 증가 여부는 아직 미확인.

- [ ] 새 측정 Worker 배포: 현재 Wrangler 계정이 Selah 소유 계정과 달라 인증 필요. 서버 준비 응답 전에는 실제 캠페인 실험을 활성화하지 않음.
## 2026-10-03 · Windows Selah desktop link parity — launcher 1.0.10/build 25

- [x] Added a per-user `selah://read?request=<id>` handler to the packaged Edge app-window launcher. It rejects unsupported/ambiguous URLs and keeps the managed SixVPN Edge route.
- [x] Packaged and locally installed Windows launcher build 25; verified Start menu app entry, registry handler, valid deep-link request forwarding, invalid-link rejection, handler removal, and reinstall recovery.
- [x] Fixed the shared-source manifest check to normalize CRLF/LF; verified the Windows check with a CRLF manifest.
- [ ] Obtain Mac response to the open source/handoff request and verify authenticated Mac↔Windows BlueCloud request/result/session round trip. The inspected Mac checkout is dirty and the installed Mac app still lacks URL-scheme registration.

## 2026-10-03 · Selah Mac·Windows 공용 작업 허브
- [x] 기존 worktree note에는 작업 소유자/브랜치 정보만 있고 중복 범위 claim 차단은 없음을 확인. GitHub `main`은 현재 `branch-current`만 필수로 보호됨.
- [x] 단일 `docs/work-hub.json`에 Mac/Windows 작업 claim, controlled scope IDs, 상태, feedback, analytics 데이터 원본·정의·coverage·제한을 통합.
- [x] `scripts/work-hub.mjs`에 `list/check/claim/set/feedback` 흐름 추가. 열린/대기/리뷰 상태의 동일 scope claim을 거부하도록 구성.
- [x] PR #163에서 `validate`·`contract`·`branch-current` CI 통과; protected-main required contexts에 `validate`를 추가하고 API readback으로 확인.
- [x] PR #163 merge commit `c2a93354`; Pages run `37129017878` 성공. GitHub raw의 공개 `docs/work-hub.json` HTTP 200에서 3개 task/4개 data source ledger readback.

- 플랫폼 동등성 Mac 요구 전송 근거: releasepilot-hub commit d0eb1304a32d2271916c174172d81e9989778278, request_id selah-apple-feature-parity-20261003. Git push 경쟁으로 기존 스크립트 전송이 실패해 같은 요청을 GitHub Contents API로 1건 게시했고 읽기 확인을 진행함. Mac 수신·구현 완료는 아직 증거 없음.

## 2026-10-03 · Mac/Windows 중복 방지 허브 강화
- [x] Mac GPT에 GA4 작업 중복 및 현재 파일 변경 여부 확인 요청. 직접 dispatch 응답 아티팩트 SHA-256 `d6eb5b99005b42c2759921b1c58a0914ec614c40afb1a4cbe194310e84771ac2`를 검증하고 GA4 task handoff에 회신·수신 근거 기록.
- [x] Mac 확인 범위: 검사한 Mac checkout에서 GA4 구현 겹침 없음. 인증·GA4 property/measurement ID 읽기 전 구현 금지. GSC/first-party baseline 재수행 금지. 오래된 `selah-admin-analytics` dirty 파일은 변경 금지. Mac 원격 main 근거는 stale cached 상태였으므로 checkout 관찰 범위로 한정.
- [x] Work Hub schema v2: 신규 claim에 repo/task/thread/base commit/exact file path 요구, scope 외 동일 자원·동일 저장소 파일/상위-하위 경로 충돌 및 증거 없는 완료 거부, handoff request/receipt/response/owner decision 분리.
- [x] PR #170 merge commit `a5bfc6476e712ed4264a20ae45c9cf66de19d455`; `branch-current`, `validate`, `contract`, `windows-protocol` 성공. Pages run `37130418662` 성공, 공개 `/docs/work-hub.json` HTTP 200에서 schema v2/6개 task/Mac 회신 hash readback.
- [ ] GA4 Analytics OAuth 연결과 정확한 property 확인은 외부 계정 작업 대기.

## 2026-10-03 · 사용자 요청: 허브 실제 테스트 후 goal 일시 중지
- [x] 실제 CLI를 임시 원장에 실행하는 13개 시나리오 작성. 첫 시험 7/13 통과, 6개 실패를 재현: scope 간 동일 자원, repo URL alias, 완료 작업 재개, 동일 task 내부 경로 오탐, 신규 메타데이터 누락, handoff 손상.
- [x] 모든 저장 전 원장 검증, repo URL 정규화, 동일 task 경로 오탐 제거, 기존 claim 예외 목록 명시, handoff 검증으로 수정. Windows CLI 13/13 통과 및 모든 거부 입력의 원장 바이트 보존 확인.
- [x] PR #175 merged `2bb382822191cb1dd0a568a7910a28afaefefc6a`; 필수 validate CI run `37131152234`에서도 13/13 성공. Pages run `37131208988` 성공, 공개 CLI HTTP 200 및 검사 소스와 일치 확인. 공개 원장 schema2/기존 claim 예외 목록 readback.
- [x] 허브 검증 완료. 사용자 요청은 검증 성공 후 analytics goal 일시 중지이며 이 결과 기록 병합 후 paused 처리. GA4 OAuth 미완료는 waiting_external로 보존; Mac 신규 실기기 수신을 이번 fixture 시험으로 확인한 것으로 간주하지 않음. 앱 build30 유지.

## 2026-10-04 함께 읽기 사용자 요구 및 검증
- 말씀 읽기에서 함께 읽기 초대 URL 생성, 상대 동일 번역본/책/장, 상대 읽는 위치 옅은 UI, 서버 기준 동일 타이머.
- build31: 접힌 번역본 메뉴에서 초대 버튼을 읽기 상단으로 이동.
- 서버 두 참여자 검증 통과. 브라우저 로딩/CDP 응답 멈춤으로 실제 클릭 E2E는 미완료; 완료로 표시하지 않는다.
- Mac/iOS 요청 selah-live-together-20261004 전달됨; 수신 및 실기기 증거 pending. 최종 계약 revision2를 반영할 것.

## 2026-10-04 · 친구와 동시에 성경 읽기 홍보
- 홈에 5개 언어로 친구와 같은 말씀을 동시에 읽는 안내와 말씀 읽기 진입 버튼을 추가.
- 초대 창의 제목도 친구 초대 목적이 분명하도록 수정.
- revision3 / build32. 서버·클라이언트 통합 검증은 이전 변경에서 통과; 실제 브라우저·실기기 검증은 pending.

## 2026-10-04 · 직접 방문 퍼널 중복 방지
- [x] direct attribution medium 정합성 수정·회귀 검사, PR #192 병합 및 Pages 배포 확인 (run `37149372833`, 공개 landing 4개 및 정적 script HTTP 200).
- [x] 10/04 Worker summary 재확인: 허용 Origin에서 HTTP 200이며 KR/ko 이벤트만 반환하고 `global-funnel-v1`은 0행이다. Origin 없는 요청도 200, 타 사이트 Origin은 CORS상 `origin_not_allowed` 403이다. 이 응답으로 실제 수집 실패를 단정하지 않는다.
- [ ] 결과를 실제 사용자 수로 과장하지 않는다. Search Console의 다음 정착 날짜와 국가/언어 연결도 별도로 대조한다.


## 2026-10-04 · 현지 검색 결과 미리보기 정합성
- [x] Fil/ES/PT-BR 현지 SEO metadata와 JSON-LD 변경 PR #194 병합 (`cb2f0646e896609254afd963890a13bca50c19f7`), Pages run `37151582667` 성공. 공개 5개 페이지와 미리보기 이미지가 HTTP 200이며 예상 title/meta/OG/schema/canonical/image 값을 반환.
- [x] 변경 URL 5개 GSC URL Inspection 조회 이력을 확인했다(2026-10-03 20:28 UTC). `requested_at`은 검사 호출 시각이며 Google의 “Request indexing” 제출/수락 증거가 아니다. 홈페이지 3개는 indexed, 안내 페이지 2개는 crawled-not-indexed이며 모든 last crawl 시각이 배포보다 앞선다. Selah sitemap은 pending, 경고/오류 0이다.
- [ ] 다음 정착 Search Console 구간에서 Web/Image 노출, query/page, 국가, CTR을 확인한다. 노출 0이면 기다리고 복수 카피/시장 승자를 선택하지 않는다.
- [x] 필리핀어 페이지 검색 제목·이미지 대체문구·구조화 이름의 영어 혼용을 현지어로 고치고 locale-specific metadata regression 검사를 PR #194에 포함했다.
- [ ] CJK 페이지의 word count는 스페이스 토큰 수의 false positive 가능성을 반영한다. 실제 현지 언어 본문과 검색 노출 전에는 페이지를 억지로 늘리지 않는다.

## 2026-10-04 · 검색 및 행동 데이터 읽기
- [x] Google Search Console 성과 데이터 정착은 2026-09-29까지다. Selah web page/country, query/page, image page/country 결과는 모두 0행이며 이번 10/04 배포 후 검색 효과는 아직 판단 불가.
- [x] Worker의 30일 집계는 허용된 사이트 Origin으로 읽었다. `kr-home-copy-v1` variant A/B는 각 exposure 이벤트 5건, CTA 4/2, reader start 2/1이었다. 30초·120초, reflection save, signup은 0; return-visit 이벤트는 2/4. `kr-spiritual-curiosity-v2`는 exposure/CTA/start가 각 1건이었다. 모든 수치는 이벤트 집계이며 사람 수가 아니다.
- [x] 지역은 KR-11 서울, KR-30 대전, KR-44 충남만 관측됐다. 표본이 variant당 5건 이하여서 승자 판정 기준 50 exposure에 크게 못 미친다. 비한국 시장이나 1,000 verified active users 달성으로 계산할 데이터는 없다.
- [x] PR #195 증거 문서 통합 merge `563de97efc5b438e44e013408c433b0de5100c29`; Pages run `37152669100` 성공.
- [ ] 10/05 다음 점검에서 GSC settled-through 날짜·재크롤링·검색 유입과 Worker의 global-funnel-v1 전달·비한국 locale/국가 분포를 재확인한다. GSC UI의 별도 “Request indexing” 제출/수락은 확인되지 않았으므로 필요 시 URL 상태와 기존 요청을 확인한 뒤 한 번만 제출한다. 작은 표본에서는 승자를 고르지 않는다.

## 2026-10-04 · 다국어 검색 유입과 IndexNow 후속
- [x] GSC에서 Selah 경로를 직접 필터한 settled Web page/country 조회가 0행임을 재확인. 최신 settled-through는 2026-09-29. 속성 전체의 다른 앱 검색 노출을 Selah 유입으로 세지 않는다.
- [x] 6개 현지 홈은 HTTP 200/indexable/self-canonical이며 현재 Google 실적 0. CJK whitespace 단어 수는 자동 감사의 토큰화 오탐 가능성이 있어 본문을 억지로 늘리지 않음.
- [x] 일본·대만·중국어권·필리핀의 공개 앱/성서기관 안내를 경쟁 기준으로 기록. 오프라인·오디오·전체 번역·메모는 여러 경쟁 제품의 기본 제공 범위여서 Selah의 차별점으로 주장하지 않음. 실제 검색 수요나 설문으로 해석하지 않음.
- [x] 기존 호스트 루트 IndexNow 공개 키 파일 검증 후 GSC Wizard의 IndexNow 설정을 맞추고 7개 언어 홈 제출. 기록된 7개가 모두 HTTP 200 `submitted, key validated`; 실제 크롤링·색인·Google 검색 효과는 아직 확인되지 않음.
- [ ] 다음 정착 GSC 창에서 Selah 경로별 Web 노출·국가·검색어, Google 재크롤링, IndexNow 이력, 실제 locale funnel 이벤트를 별도로 비교. 노출/표본이 없으면 카피 승자·시장 승자·유료 집행을 정하지 않는다.
- [x] 10/04 최신 재확인: 호스트 전체 GSC 88 impressions/3 clicks지만 Selah 하위경로 page/query는 0행이며 settled-through 09/29. Selah 8개 언어 홈은 10/01–10/02에 색인되어, 아직 색인 후 검색 성과가 측정창에 반영되기 전임을 기록.
- [x] Cloudflare 10/01–10/03: 59 page-view events/36 monthly anonymous browser IDs, KR49·US10, 10 browser IDs multi-day. 기능 API는 KR meditation_started 5/scripture_read 2; 한국 copy A/B 노출5/5, CTA4/2, read-start2/1, 30초읽기·노트·가입 0. 사람 수나 시장 선호 결론으로 해석하지 않음.
- [x] Metricool 브랜드 목록 재확인: 연결 브랜드 1개 `vivid_wave` Instagram. 개인 계정 비공개 요청에 따라 홍보 게시/예약에 사용하지 않음. 별도 Selah 전용 채널이 연결됐다는 증거 없음.
- [ ] 10/05 이후 첫 settled window가 10/02 색인 이후를 포함하는지 확인. 실행 대기 동안 Search Console 재요청 반복·신규 콘텐츠 양산 금지; Google/Bing 실제 유입과 읽기·노트 행동을 확인한 뒤 다음 시장·채널을 선택.

## 2026-10-04 · 브라질 성경 독서 필요 검증
- [x] 2024 *Retratos da Leitura no Brasil* 원문을 대조: 최근 1년 성경 독서 응답은 독서자 표본 2,547명 중 38% (비재학생 46%, 재학생 25%). 전체 5,504명 조사와 장르 질문의 분모·기간을 구분해 `GROWTH_RESEARCH.md`에 기록.
- [x] 이 결과는 성경 독서 관련성 신호일 뿐 앱 수요나 미충족 필요가 아님을 명시했다. “시간 부족”·“짧은 묵상 필요” 문구의 사실 근거로 쓰지 않는다.
- [x] 공개 원문에서 성경 장르 표가 지역/주별로 나뉘지 않는 것도 확인했다. 일반 도서 독서율 지역표를 성경 앱 수요의 지역 순위로 사용하지 않는다.
- [ ] 브라질 변형/홍보는 보류. 10/05 이후 GSC settled-through와 Selah 검색 행, 비한국어 landing→reading→reflection 이벤트를 재확인하고, 검색 의도나 현지 독자의 직접 응답으로 구체적인 필요가 확인된 뒤에만 다음 실험을 등록한다.

## 2026-10-04 · 미국 성인 검색 의도 후보 검증
- [x] American Bible Society/NORC의 2026 전국 성인 조사(n=2,649)를 확인: “Movable Middle”이 미국 인구 28%, 2024년 대비 900만 증가. 이는 성경에 대한 개방성이지 앱 수요나 검색량은 아니다.
- [x] 2023 전국 성인 조사(n=2,761)의 시간 부족 26%·시작 지점 모름 17% 응답을 오래된 보조 근거로만 기록하고, 2026년 현재 수요 추정치로 쓰지 않는다.
- [x] 필리핀 Open Generation 자료는 2021년 13–17세 1,000명 조사이므로 성인 시장/지역 수요로 일반화하지 않고 청소년 대상 캠페인도 시작하지 않는다.
- [ ] 미국 주별 유입 증거가 없으므로 지역별 맞춤 UI는 보류. Semrush 연결이 확인되면 미국 영어 검색량·난이도·상위 검색 결과를 조사해 실제 랜딩 약속과 맞는지 검토한다. 구독/유료 키워드 조회는 별도 승인 전 시작하지 않는다.
- [ ] 10/05 이후 settled GSC와 global-funnel 실제 event 도착을 다시 읽는다. 미국 전용 카피를 배포하려면 검색 의도 자료와 작동하는 이벤트 측정이 먼저 확인되어야 하며, downstream 읽기·기록·재방문과 분리해 CTR만으로 승자를 고르지 않는다.

## 2026-10-04 · 다국어 검색 크롤링 readback
- [x] `robots.txt` 전체 허용 및 sitemap 선언, sitemap HTTP 200/XML·14 URL, 표본 현지 홈 응답을 확인했다. sitemap 제출은 여전히 pending이며 경고·오류는 0이다.
- [x] GSC settled-through 2026-09-29; Selah 홈 page performance와 국가 행, 최근 14일 속성 요약 모두 impressions/clicks 0. GSC 지연 때문에 10/04 이후 검색 효과는 아직 모른다.
- [x] GSC가 연결한 확인 속성은 `https://delight0517.github.io/`이며, 여기에 저장된 정확한 Selah 기본 랜딩 8개는 모두 indexed다. Selah 경로 page performance, page+country, query+page는 확정 구간(2026-09-03–09-30, settled-through 09-29)에서 0 노출·클릭/0행이다. 하위 경로 `siteUrl`로 만든 임시 tracker는 공식 연결 속성 목록에 없었다. 그곳에 이번에 추가한 7개 행을 제거했고, 원래 4개 URL은 보존했다. 이전 11/2/3/6 상태는 사용하지 않는다.
- [ ] 10/05 KST 상위 속성 tracker/sitemap 상태 확인, 10/08 KST 이후에는 10/04 배포 뒤 확정된 GSC와 실제 글로벌 funnel event를 함께 읽는다. Semrush 키워드량은 연결 전까지 미확인으로 두고, 새 국가별 제목/광고는 실제 현지 검색 의도가 확인된 뒤에만 검토한다.


## 2026-10-04 미국 주별 숫자 수정 — 1.0.10/build33
- 사용자 피드백: 미국 주 단위로 숫자가 여전히 안 나옴.
- 원인: 서버 us-ok/us-az와 지도 us-OK/us-AZ 조회의 대소문자 불일치. 지역 코드를 소문자로 정규화해 숫자 표시 수정.
- 테스트: 소문자·대문자 데이터 및 집계 없는 주 0 표시, 50주+DC 렌더링 확인.
- 공유 웹/Windows hosted 소스 및 iOS 생성 소스 반영. Mac/iPhone 설치와 실기기 실행은 미확인.

- Live verification: build33 Pages deployed (run 37165848335); Oklahoma 6, Arizona 4, California 0; 51 states/DC. Korea/US switching passed.

## 2026-10-04 · 다국가 성장 운영 방향 정정
- [x] 한국을 단독 시장이나 타국 진입의 통과 관문으로 두지 않도록 성장 계획을 병렬 시장 검증으로 수정했다. 한국은 제품 기준선, 브라질·필리핀은 별도 증거를 쌓는 lane이며 일본·대만·스페인어권 탐색도 중단하지 않는다.
- [x] Selah 전용 GSC settled page 필터는 2026-09-29까지 0행이고, 호스트 전체 88노출/3클릭은 다른 GitHub Pages 프로젝트가 섞여 Selah 성과로 쓸 수 없음을 재기록했다. 현재 Metricool 연결은 비공개 요청에 따라 사용하지 않는 개인 Instagram 한 개뿐이다.
- [x] 브라질의 기존 한 장 읽기 메시지를 반복하지 않도록 “빠진 뒤 부담 없이 재개”를 미검증 가설로만 기록했다. 필리핀은 Ang Biblia 1905의 판본 수용성·지역별 권리·저데이터 모바일 적합성을 먼저 확인한다. 전국 독서 조사나 경쟁 앱 설치 수를 Selah 앱 수요로 간주하지 않는다.
- [x] `docs/GROWTH_PLAN_NORTHSTAR.md`, `GROWTH_RESEARCH.md`, `MARKET_PLAYBOOK.md`에 병렬 검증, 출처, 조사 표본 한계와 현재 채널/계측 공백을 기록했다. 이번 단계의 검증 활성 사용자 증가는 0명이며 광고비는 집행하지 않았다.
- [ ] 다음 settled GSC 구간과 실제 non-QA locale landing→읽기→기록→가입 집계를 국가별로 대조한다. 공통 퍼널 전달이 확인되지 않으면 해당 측정 경로를 우선 진단하고, 국가별 승자/새 UI/광고는 보류한다. 현지 독자 피드백은 개인 Instagram 외의 승인되고 귀속 가능한 채널이 생긴 뒤 수집한다.

## 2026-10-04 · 글로벌 퍼널 및 검색 구간 재확인
- [x] Worker 30일 요약을 최신 재조회: global-funnel 노출 2, CTA 1, 읽기 시작 1, 30초/120초 각 1, 묵상 저장 0, 가입 0, 재방문 0. 국가는 KR만 기록됐지만 외부 고유 사용자로 보증하지 않는다. 과거 “0행” 기록은 같은 날의 이전 시점 스냅샷으로 남긴다.
- [x] GSC exact-page 통계 9개(Selah 루트와 8개 언어 홈)를 새로 읽었다. 모두 0 노출/클릭, settled-through 2026-09-29이며 해당 구간은 홈의 10/01–02 색인 확인 이전이다. sitemap pending/오류0/경고0. 재제출 불필요.
- [x] Bing Webmaster 통계는 API key 미설정으로 비구성 상태임을 기록했다. Google·Bing 검색 성과를 합산하거나 추정하지 않는다.
- [ ] GSC settled-through가 10/02 이후 색인 시점을 포함하는 첫 보고 기간에 도달하면 Selah 언어별 URL·국가·쿼리를 재조회한다. Worker에서는 same-window non-QA locale exposure→read→reflection→signup을 점검하고, page-view와 개인 수준으로 억지 결합하지 않는다.
## 2026-10-04 · iPhone Safari 집중 읽기 화면 잘림 수정
- Safari의 주소창 높이 변화를 반영하는 `100dvh`와 안전 영역을 적용하고, 읽기 도구·책/장 선택·본문·장 이동을 한 화면의 세로 흐름으로 배치했다. 본문만 스크롤하며 마지막 구절이 하단 버튼에 가리지 않는다.
- 루트 웹 원본과 자동 생성 iOS `mobile/www` 복사본을 동기화했다. `check-platform-source`, 기능 원장 검사, 집중 읽기 세션 검사와 읽기 시작 회귀 검사는 통과했다.
- PR #217이 `9fcc866`으로 병합됐고 Pages 배포 run `37203872507`이 성공했다. 공개 HTML의 CSS 연결과 배포 CSS의 동적 높이·본문 스크롤·장 이동 배치를 읽어 확인했다.
- 남은 증거: iPhone Safari의 실기 화면 확인. Mac 화면이 잠겨 있어 이번에는 직접 조작하지 않았다.

## 2026-10-04 · 함께 읽기 기록
- 로그인된 BlueCloud 계정에 본문·참가 인원·시각을 비공개 저장하고, 세션별 친구 별명을 수정해 기기 간 동기화한다.
- Worker에는 계정 신원·묵상·기도를 보내지 않고 클라우드 이력에는 방 ID 해시만 기록한다. Web/iOS 공유 UI와 번들 검증 완료; 실제 다중 계정 클라우드 왕복과 독립 macOS 앱 동작은 미검증.

## 2026-10-04 · 한국어 공유 카드의 앱 기능 설명
- [x] 기본 링크 미리보기에서 마태복음이 앱 전체 범위처럼 보이지 않도록 제목·설명·구조화 데이터를 성경 읽기, 구절 북마크, 묵상·기도 기록, 복습 퀴즈 중심으로 바꾸고, 새 1200×630 카드 이미지로 교체했다.
- [ ] PR 통합과 GitHub Pages 배포 뒤 공개 URL의 메타데이터와 새 이미지 응답을 확인한다. 기존 카카오톡 메시지에는 캐시된 미리보기가 남을 수 있다.

## 2026-10-05 · 하이라이트 계정 보관 안내
- [x] 비로그인 상태에서 개인 하이라이트를 표시한 뒤 묵상을 마치면, 기기 저장 상태와 BlueCloud 계정 보관 이점을 안내하고 로그인·무료 가입·나중에 닫기를 제공한다. 가입/로그인은 기존 계정 인증 및 동기화 병합 경로를 사용한다.
- [x] PR #222 병합 커밋 `0705cac`의 Pages 배포(run `37214544512`) 성공. 공개 웹과 Capacitor 번들, 빌드 정보 모두 HTTP 200이며 1.0.11/build 36과 안내창 동작 소스 readback 확인. iPhone 설치·실기기 UI 동작은 아직 확인하지 않았다.

## 2026-10-05 · 국가·언어별 Selah 소개 일러스트 실험
- [x] 여정, 산만함과 집중의 은유적 대결, 픽셀 퀘스트, 수채화 정적, 에디토리얼 빛의 다섯 그림을 만들고 경량 WebP로 준비했다. 본문 문구·CTA·기능 설명은 고정하고 일러스트만 방문자별로 고정 배정한다.
- [x] `illustration-study.html`에서 한국어·영어·필리핀어·일본어·스페인어·브라질 포르투갈어·중국어 간체·번체를 제공하고, 기존 익명 집계 퍼널의 캠페인 필드에 `selah-illustration-v1-a..e`를 실어 나라·언어·기기·유입 경로별 반응을 연결한다. 앱 이름/기능 변경은 없다.
- [x] `marketing/experiments/selah-illustration-study-v1.md`에 가설, 표본 대기 규칙, Search Console 집계 검색어 분석과 개인 단위 연결 불가, 외부 노출과 사이트 방문의 측정 차이를 기록했다.
- [ ] 외부 플랫폼의 게시물 노출/클릭은 각 플랫폼 계정에서 별도로 확인해야 한다. 연결된 개인 `vivid_wave`는 제외하며, 비개인 배포 채널이 확인되면 캠페인 링크를 배포하고 같은 기간의 플랫폼 통계·GSC 집계·앱 퍼널을 대조한다.


## 제작자 소개 링크 · 2026-10-05

- Selah 웹사이트 하단에 제작자 김근후 소개와 개인 포트폴리오 링크를 추가했다. 한국어·영어·일본어·중국어 간체·번체 문구를 지원한다.
- 포트폴리오 주소: https://delight0517.github.io/
- 공용 웹 소스와 Capacitor `mobile/www` 번들을 함께 갱신한다. 웹 배포 확인과 네이티브 앱 설치 확인은 별도 기록한다.


## 2026-10-05 · 성경 판본별 권리 기록과 안전 정책
- [x] 실기기에서 확인한 일반·집중 읽기 화면의 판본명 갱신 누락을 보강한다.
- [ ] iPhone build 49의 본문 및 판본 표시를 다시 육안 확인한다. 미러링에서 “iPhone 사용 중”이 표시되어 연결이 복구되기 전에는 읽기 흐름을 통과로 기록하지 않는다.
- [x] 일반 말씀 읽기와 집중 묵상 화면에 선택된 판본의 정식 이름을 항상 표시한다. 판본명은 권리 레지스트리에서 가져오고, 직접 입력한 본문은 “번역본 미확인”으로 표시한다.
- [x] 한국어·영어·일본어·중국어 간체/번체·필리핀어·스페인어·브라질 포르투갈어 UI 라벨과 Capacitor 공유 번들을 동기화한다.
- [x] `bible-rights.json`에 번역본별 라이선스·배포 상태·상업적 이용·필수 표기·출처·검토 범위를 기록하고 선택 판본 정보를 읽기 화면에 표시.
- [x] 공식 조건이 미확인된 추가 판본은 다운로드 차단; 비영리 전용/미확인 판본이 이 기기에 저장되면 공통 광고 정책 훅은 광고를 차단. 현재 사이트에는 광고 송출 코드가 없어 실제 광고 노출은 없음.
- [x] 기본 개역한글판(1961)과 API `kor_old`(1910)를 권리 ID에서 분리. 해외 배포 범위가 확인되지 않은 중국어·스페인어·타갈로그 판본은 보수적으로 검토 대기.
- [ ] 개별 미확인 번역본의 제공처에 버전별 앱 재배포/상업 이용을 확인한 뒤 권리표를 갱신.
- [ ] 별도 macOS 앱이 웹 광고 슬롯을 소비하는지 확인; 이 작업에서는 그 앱 구현을 확인하지 못함.


## 2026-10-05 · 일간·월간 방문 수 구분
- [x] 상단 배지를 UTC 오늘의 고유 익명 브라우저 수로 표시하고, 상세 화면에는 오늘 수와 UTC 월간 고유 익명 브라우저 수 및 날짜 범위를 함께 표시했다. 모바일에서도 상단 기간 라벨을 유지하고, 지도 국·지역 수치는 날짜별 브라우저 방문 합계(브라우저·일)라고 설명한다. 한국어·영어·일본어·중국어 간체/번체·필리핀어·스페인어·브라질 포르투갈어 문구를 정리했다.
- [x] PR #245 (`1799e8a`) 병합. GitHub Pages 배포 run `37272666551` 성공, 공개 HTML과 설명 스크립트에서 일간/월간 KPI, 모바일 라벨, 브라우저·일 단위, 8개 언어를 읽어 확인했다. 플랫폼 소스 검사와 Capacitor `mobile/www` 생성본 동일성 검사 통과.
- [ ] 새 웹 소스는 배포됨. 이번 작업에서는 iOS 네이티브 앱의 새 패키지 설치 및 실기기 런타임을 검증하지 않았다. 별도 macOS 네이티브 구현도 확인하지 않았다.


## 2026-10-05 · 다국어 랜딩 제목 실험과 유입 경로 연결
- [x] 7개 현지화 소개 페이지(영어·일본어·중국어 간체/번체·필리핀어·스페인어·브라질 포르투갈어)에서 제목 한 문장만 현재 A안과 한 장 읽기·기록을 권하는 B안으로 브라우저 고정 배정한다. 기존 번역판·검색 메타데이터·CTA는 유지한다.
- [x] allow-listed 랜딩 분류를 익명 집계 퍼널에 더하고 같은 세션의 읽기·기록·가입까지 원래 route·variant와 연결한다. 기존 aggregate count는 `unattributed`로 보존하는 마이그레이션을 추가한다.
- [x] PR #215 병합, Pages workflow 성공, Worker 배포 및 D1 0005 적용. 공개 페이지/요약 API에서 실험 코드와 `landingRoute` 필드를 확인하고 기존 집계 140건을 `unattributed`로 보존했다.
- [ ] 실제 노출이 쌓일 때까지 대기한다. 첫 readback에서 새 실험 이벤트 0건이므로 성과 승자를 고르지 않는다. 국가·언어별 A/B 각 50노출과 저장 묵상 근거를 확인한 뒤에만 다음 결정을 기록한다.
- [ ] 국가·언어별 각 variant 50노출과 저장 기록 증거가 생기기 전에는 승자를 뽑거나 페이지/기능을 더 변형하지 않는다.

## 2026-10-05 · 성경 듣기 진입점을 읽기 화면으로 이동
- [x] 번역본별 YouTube 출처 저장, Selah 내 영상/재생목록 재생, 절별 시점 저장·강조, 다음 장 자동 이동은 이미 구현되어 있었다. 원인은 설정 영역이 페이지 아래쪽의 접힌 ‘내 듣기 출처’에 있어 본문에서 찾기 어려웠던 것이다.
- [x] 듣기/출처 설정을 본문 선택기 바로 아래로 옮기고 모든 지원 언어에서 ‘성경 듣기’로 알아보기 쉽게 표시한다. 기본으로 저장한 영상은 본문 위의 바로 듣기 링크에서 재생되며, Premium은 사용자가 로그인한 YouTube에서 연다.
- [x] 공유 UI build 52와 iOS Capacitor 번들을 갱신한다. 웹 브랜치 배포 및 iPhone 설치·실제 YouTube 재생·절 따라가기 확인은 별도 상태로 기록한다.
## 2026-10-05 · 한국 유입 분석 및 홍보 검증

- [x] 최근 30일 Cloudflare 익명 집계와 GSC settled 결과를 국가·광역 코드·언어·실험별로 대조하고 인과 추정 한계를 GROWTH_RESEARCH.md에 기록.
- [x] 한국 사용자에게 실제 제공되는 성경 듣기→절 따라가기→묵상 기록 흐름에 맞춘 홍보 초안을 작성. 게시·광고 집행은 하지 않음.
- [ ] 랜딩 A/B 각 50노출 및 저장 묵상 근거, 새 route-attribution 표본이 쌓일 때까지 50:50 유지. 다음 settled GSC 기간에서 한국의 query/page/country rows 확인.
## 2026-10-05 · 듣기 기능을 본문 위에 바로 표시

- [x] 사용자 재신고에서 원인을 재확인: 이전 수정은 ‘성경 듣기’ 관련 UI를 접힌 `<details>` 안으로 이동했으나, 처음 쓰는 사용자에게 보이는 것은 메뉴 제목뿐이었다. 저장된 출처가 없으면 재생 버튼도 감춰져 있어 기능이 없는 것처럼 보였다.
- [x] 접힌 메뉴를 없애고, 읽기 화면에 현재 장 낭독 검색 → YouTube 영상/재생목록 URL 저장 → Selah 내 재생을 한 영역에서 바로 보여준다. 새 링크 저장 시 플레이어를 바로 연다. HTTPS 형식만으로 저장되던 재생 불가 링크는 거부하도록 검증한다.
- [x] shared UI build 53으로 웹·Capacitor 동기화를 완료했고 source parity 및 feature parity 검사가 통과했다. iOS Simulator용 Xcode 빌드도 성공했다.
- [x] PR #255로 공용 UI를 공개 배포했고 build 54 Pages run `37299467588`의 공개 페이지 readback을 확인했다. iPhone 실기기 재생·절 따라가기는 별도 검증으로 남긴다.

## 2026-10-05 · 번역본별 YouTube 광고·Premium·연속 재생
- [x] 현재 선택한 언어·번역본·책·장으로 YouTube 검색을 만들고 저장 링크를 번역본별로 분리한다. 여러 장을 잇는 경우 YouTube 재생목록을 저장하도록 안내한다.
- [x] YouTube 표준 임베드와 표준 재생 컨트롤을 사용하고 자동 재생을 막는다. YouTube가 허용하는 경우 광고가 표시될 수 있으며, Selah가 광고를 강제하거나 차단하지 않는다.
- [x] 플레이어에서 원본 YouTube 영상·재생목록을 열 수 있어 공식 YouTube 앱/사이트의 로그인과 Premium을 사용할 수 있다. Google 자격 증명은 Selah에 입력하지 않는다. 선택 번역본과 다른 외부 성경 낭독 링크는 숨기도록 기존 한국어 링크 오류도 고쳤다.
- [x] 축소 상태에서도 영상이 보이고 임베드 최소 200×200 CSS px를 유지한다. 앱을 숨기면 임베드 재생을 일시 정지한다.
- [x] shared UI build 55, Capacitor 동기화, source parity, feature parity 검사, iOS Simulator Release build, 서명된 generic iOS build 55 및 codesign 검증을 완료했다. iPhone 설치·재생은 Mirroring 재연결 후 확인한다.
- [x] PR #257 merge commit `1a92827ad89380a28d68b7af991355d59846a320`; Pages run `37302191175` 성공. 공개 build JSON의 build 55 및 index의 YouTube player/Premium handoff 코드를 readback했다.
- [ ] 실제 브라우저의 재생목록 연속 재생, 다른 번역본에 맞는 출처 선택, iPhone build 55 축소·복원 및 공식 YouTube Premium handoff는 Mirroring 재연결 후 확인한다.

## 2026-10-05 · 마태복음 YouTube 듣기 미니 플레이어
- [x] 재생 영상에 접기/복원 버튼을 더하고 읽기 중 화면 우측 하단의 safe-area 안에서 작은 YouTube 플레이어로 유지한다. 접을 때 iframe을 교체하지 않아 현재 재생을 유지한다.
- [x] 한국어·영어·일본어·중국어 간체/번체·필리핀어·스페인어·브라질 포르투갈어에 현지화된 버튼 이름을 제공한다.
- [x] 공유 UI build 54, Capacitor 동기화, 소스 패리티, 정적 매튜 corpus/search hook 및 8개 언어 미니플레이어 문구 검사를 완료했다. iOS Simulator와 서명된 iOS 빌드에 성공했고 build 54를 iPhone 14 Pro에 설치했다.
- [ ] 마태복음 1장에서 YouTube 검색, 사용자가 고른 영상 재생, 축소 중 재생 지속, 복원을 브라우저와 iPhone에서 확인한다. iPhone Mirroring이 멈춰 실제 화면 검증은 대기 중이다.

## 2026-10-05 · iOS YouTube 임베드 Referer 오류
- [x] build 55 시뮬레이터에서 저장한 마태복음 YouTube 영상을 열어 Error 153을 확인했다. 저장·기본 선택·우측 하단 축소는 작동했지만 영상 재생은 막혔다.
- [x] YouTube 공식 문서에 따라 iOS의 로컬 Capacitor 출처가 아닌 Selah HTTPS 플레이어 페이지 안에서 표준 YouTube 플레이어를 연다. 원래 앱의 오프라인 말씀 본문과 저장 데이터는 그대로 유지한다.
- [x] 출처 origin, iframe source, 일회성 토큰을 확인하는 메시지 연결로 영상 시각과 상태만 전달하고 YouTube 표준 재생 버튼을 유지한다.
- [x] PR #263 병합 후 build 58을 iOS 26.4 QA Simulator에 설치했다. 개역한글판(1961) 마태복음 1장의 YouTube 표준 플레이어가 Error 153 없이 열리고 재생 타이머·영상 프레임이 진행됨을 확인했다.
- [x] 우측 하단 미니 플레이어로 접은 동안에도 영상 프레임이 진행되고, 다시 펼쳐지는 것을 시뮬레이터에서 확인했다. 배포·설치·실행 증거는 `/tmp/selah-youtube-player-evidence.jsonl`에 별도로 기록했다.
- [x] GitHub Pages 배포 run `37329055327` 성공. 공개 `youtube-player.html` HTTP 200 및 public `SHARED_APP_BUILD.json` 1.0.13/build 58을 읽어 확인했다.
- [ ] 재생목록 다음 영상 연속 재생, 다른 번역본별 실제 선택, 실기기, YouTube 광고 표시·Premium 계정 반영은 별도 검증이 남아 있다. 광고와 Premium은 YouTube 및 각 영상 설정에 따라 달라지며 Selah가 보장하지 않는다.

## 2026-10-05 · 러시아어·우크라이나어 성경과 검색 페이지

- [x] 러시아어·우크라이나어 UI 핵심 문구와 성경 언어 선택, 브라우저 언어 자동 감지를 추가한다.
- [x] eBible.org가 Public Domain으로 표시한 러시아 시노달 번역과 우크라이나어 Біблія свободи를 기본판으로 연결하고, 쿨리시·풀류 1905 번역을 추가 선택판으로 제공한다. 전체 다운로드는 기존 HelloAO Bible API/IndexedDB 흐름을 사용한다.
- [x] 오프라인 첫 장 자료, 책 메타데이터, 출처·권리 안내 및 러시아어·우크라이나어 SEO 진입 페이지를 추가한다.
- [ ] 공개 Pages와 러시아어·우크라이나어 브라우저에서 전체 번역 다운로드 및 오프라인 재열기를 확인한다. Windows 설치 앱과 iOS 실기기도 별도로 확인한다.

## 2026-10-05 · 테마별 본문 색상 대비 수정
- [x] 밝은 테마의 짙은 성경 카드/그라데이션 위 장·절 표시와 어두운 테마의 카드 위 표시가 배경에 맞는 전경색을 사용하도록 수정한다.
- [x] 어두운 테마에서 기본·보조 버튼과 출석 체크 표시도 표면별 색상 토큰을 사용한다. 로컬 브라우저에서 밝은 모드와 어두운 모드의 독서 화면을 확인했다.

## 2026-10-06 · 번역본별 YouTube 검색 결과 일치 안내
- [x] iOS 26.4 Selah Store QA Simulator에서 성경 언어를 English로 변경했을 때 본문·듣기 제목이 World English Bible로 바뀌고, YouTube 검색창에 `World English Bible Matthew 1` 검색어가 전달되는 것을 확인했다.
- [x] 실제 첫 결과가 ESV 낭독 영상인 것을 확인했다. 앱은 검색 결과를 자동 저장하지 않지만, 선택 판본과 다른 영상이 먼저 보일 수 있다는 점을 사용자에게 알릴 필요가 있다.
- [x] 한국어·영어·일본어·중국어 간체/번체·필리핀어·스페인어·브라질 포르투갈어 안내에 저장 전 판본 제목을 확인하라는 문구를 추가하고 feature revision 12로 기록한다.
- [x] Build 61에서 판본 일치 안내·빈 출처 카드 숨김을 시뮬레이터로 확인했다. ESV 검색 결과를 선택하지 않아 저장된 기본 출처는 없으며, 영상 판본의 정확성은 제목에서 다시 확인해야 한다.
- [ ] 재생목록 연속 재생은 선택된 YouTube 목록에 실제 다음 영상이 있을 때만 확인 가능하다. 실기기 재생, 광고 표시, Premium 계정 결과는 별도 검증이며 YouTube가 제어한다.
- [x] build 59 simulator visual check exposed overlapping translation-match copy and a blank “Open” source card even when the selected translation had no saved YouTube source.
- [x] Shorten the localized match reminder and apply an explicit `[hidden]` rule to the primary audio source card so an empty default cannot occupy the reading screen.
- [x] Rebuilt and installed build 61 in the iOS 26.4 simulator. Fresh screen capture confirms the translation-match reminder and YouTube search control are separated; the empty default-source card stays hidden. Evidence run `34cb8a12-3d3b-448c-91fa-41ed6ab2d388` is in `/tmp/selah-youtube-player-evidence.jsonl`.
- [ ] The live YouTube search for World English Bible Matthew 1 still recommends an ESV playlist first. No source was saved; exact-version discovery, playlist continuity, physical iPhone, ad, and Premium outcomes remain separate checks.

## 2026-10-06 · 내부 방문 집계 제외와 활성 이용자 지표
- [x] 개발자 통계 안에 이 브라우저의 이후 방문·기능·실험 이벤트 전송을 끄고 다시 켜는 선택을 추가했다. 설정은 해당 사이트의 이 기기 브라우저 저장소에만 남는다. 과거 집계는 소급 변경되지 않는다.
- [x] QA 쿼리 제외와 브라우저 선택 제외를 페이지뷰, 기능, 지역 실험, 글로벌 퍼널, Filipino 경로 실험의 이벤트 전송 전에 확인한다. 10개 UI 언어 문구와 iOS 공유 웹 번들을 동기화했다.
- [x] executable inline JavaScript 구문 검사, Filipino analytics 스크립트 구문 검사, 66개 웹/iOS 공유 파일 패리티 검사, `git diff --check`, iOS Simulator Debug build를 통과했다.
- [ ] Simulator는 부팅 상태였으나 새 빌드 설치 명령이 응답 없이 멈춰 앱 화면·저장 동작은 검증하지 못했다. CoreSimulator를 재시작하거나 반복 제어하지 않는다.
- [ ] 주간 활성 사용자를 정확히 세고 로그인 계정과 익명 브라우저 중복을 합치는 Worker 변경은 배포 소스 저장소와 소유 경로를 찾지 못해 별도 대기한다. 현재 `period=week` 요청은 주간 기준 증명이 아니다.


## 2026-10-06 · 성경 듣기 설정 첫 화면 접기
- [x] 성경 읽기 화면의 번역본별 오디오 설정을 native disclosure로 감싸 첫 진입 시 접어 둔다. 제목은 선택한 언어와 번역본에 맞추며 저장한 오디오의 빠른 재생 링크는 유지한다.
- [x] 공유 HTML을 iOS 번들에도 복사하고 feature parity revision 16으로 기록했다.
- [ ] 웹 배포와 브라우저 첫 화면 확인, iOS 시뮬레이터·실기기 검증은 별도 남아 있다.

## 2026-10-06 · 검색 유입과 첫 묵상 저장 병목 재확인
- [x] 공개 페이지 루트·묵상 가이드·필리핀어·브라질 포르투갈어 HTTP 200 및 실제 HTML title/description/H1을 읽었다. HTML 응답은 Google이 표시한 snippet이나 모바일 시각 검증과 다르다.
- [x] 10월 1–6 UTC 달력월 요약은 96 page-view events / 약식 익명 브라우저 55개였다. 7일 rolling 요약(9/30–10/6)은 258 page-view events / 약식 익명 브라우저 245개였으며 국가 page-view 이벤트 KR 242 / US 15 / LU 1이다. 일별 국가 고유 coverage는 10/5–6만 완전하고 두 날 모두 KR; 7일 활성 coverage는 false다. 이 수치는 사람 수가 아니다.
- [x] 최근 30일 실험 집계: 한국어 `global-funnel-v1` 노출 17 / CTA 6 / 읽기 시작 10 / 30초 9 / 120초 7 / 묵상 저장 0 / 가입 0; 한국 홈 카피 A/B 노출 19/17, CTA 5/5, 읽기 시작 5/5, 묵상 저장·가입 0/0. 표본이 작고 이벤트 분모가 달라 승자·전환율을 만들지 않았다.
- [x] 현지 경쟁 제품 페이지를 조사해 Tagalog와 브라질에서 무료 성경·오디오·플랜·메모가 이미 널리 제시되는 범주임을 기록했다. 기능 수나 성경 제공만을 Selah 차별점으로 홍보하지 않는다.
- [x] 기존 Search Console URL-prefix 속성에서 Selah 경로의 2026-09-04–10-03 정착 검색 결과를 확인했다: 노출/클릭 0, 페이지/검색어 행 0. 사이트맵은 GSC에 `Couldn't fetch`로 보인다.
- [x] Googlebot User-Agent로 공개 사이트맵과 robots.txt를 확인했다: XML HTTP 200, 파싱 통과, 16개 URL 모두 HTTP 200, robots.txt가 같은 사이트맵을 선언한다.
- [x] 2026-10-06 기존 URL-prefix 속성에서 Selah 사이트맵 재제출을 한 번 수행했고 Search Console이 접수를 확인했다. 접수 후에도 상태 `Couldn't fetch`, 상세 표기 `Sitemap could not be read`, 발견 페이지 0이다. 재제출 전 공개 Googlebot 요청은 XML HTTP 200·유효한 16 URL이었으므로 이 응답만으로 Search Console 수신 성공을 주장하지 않는다.
- [x] Antigravity 읽기 전용 상세 조회 `d4d151e5-cc68-4de8-b4c1-8360625d3b80`는 `agent_timeout`으로 종료됐다. 추가 HTTP 상태나 원인은 얻지 못했으며, 제출 성공이나 sitemap 처리 성공으로 해석하지 않는다.
- [ ] 공개 XML·robots 응답은 정상인데 Search Console 상세 오류는 확인되지 않았다. 같은 제출을 반복하지 않고 crawler 상태를 관찰한다. 구체 원인이 계속 필요하면 GSC Wizard 등 실제 연결된 검색 도구의 관리 정책을 확인해야 한다.
- [ ] 비개인 공개 배포 채널을 확인해 국가·언어별 실제 링크 유입을 만들고, referral → 읽기 지속 → 첫 기록을 같은 기간의 익명 집계로 대조한다. 개인 Instagram `vivid_wave`는 제외한다.
- [ ] 현재 copy 실험을 50:50으로 유지한다. Search Console settled data와 유효 노출 및 첫 기록 표본이 늘기 전에 지역/UI/썸네일 승자를 고르거나 유료 집행하지 않는다. 이번 확인에서 검증된 가입/활성 사용자는 0명.


## 2026-10-06 15:32 · 다국가 이벤트와 경쟁 구도 판단
- [x] 허용 Origin으로 Worker의 최근 30일 실험 요약 HTTP 200을 읽고, 26행에서 나라·언어·실험별 이벤트를 재집계했다. KR/US만 반환됐으며 이는 퍼널 행 기준이지 모든 페이지 방문 국가 목록은 아니다.
- [x] 한국 홈 카피는 A/B 노출 19/17(합 36), CTA 5/5, 읽기 시작 5/5, 저장·가입 0/0이다. 내부·소유자 제외가 집계에서 검증되지 않았고 분모가 다를 수 있어 승자나 전환율을 선언하지 않는다. 50 노출 기준 미달.
- [x] Tagalog와 브라질 포르투갈어 시장의 공개 경쟁 제품이 번역 성경뿐 아니라 오프라인·기록·메모·하이라이트·오디오/플랜도 제공함을 확인했다. 기능 목록만을 차별점으로 삼지 않도록 GROWTH_RESEARCH.md에 출처와 함께 기록했다.
- [ ] GSC Wizard가 `DISABLED_BY_ADMIN`/`NOT_AVAILABLE` 상태라 영어 가이드의 URL 검사, 검색어/노출 확인, sitemap 오류 진단을 수행할 수 없다. 활성 가능한 Search Console 연결이 확인되면 최신 상태를 한 번 읽고 다음 색인 작업을 결정한다.
- [ ] 50 eligible exposure/28일 기준에 도달하기 전에는 한국 카피 A/B 승자를 고르지 않는다. 새 국가/지역은 지역 퍼널 증거와 그 시장의 구체적 검색 필요가 함께 확인될 때 우선한다. 검증된 신규 고유 활성 사용자 증가: 0명.

- [x] 한국어 마태복음 1–28장 전체 YouTube 낭독을 추천 출처로 바로 재생할 수 있게 연결하고 낭독 판본을 구분 표기. 영상 절별 타임스탬프가 검증되지 않아 절 자동 추적은 주장하지 않음 (feature parity revision 17).

## 2026-10-06 · Curated Matthew YouTube verse-follow setup
- [x] Add an explicit localized action that saves or reuses the curated Matthew video as a separate user-owned source for the selected Bible translation, exposing the existing manual verse-cue controls without changing the curated source or claiming the editions match.
- [x] Record source parity revision 18 and prepare shared iOS/web source as build 65.
- [ ] Verify in a browser that this action saves only the selected-translation copy, exposes cue controls, and that confirmed cues drive verse following during playback.
- [ ] Build/install build 65 and verify the same flow on iPhone. Build 64 playback remains unverified; existing iPhone Mirroring action is still required.
- [ ] Selah YouTube 성경 듣기: 확인된 NLT 마태복음 28개 챕터 시점으로 장·1절 동기화(build 66) 구현. 배포 readback과 실기기에서 실제 음성 재생·본문 따라가기 검증은 별도 완료 필요; 절별 세부 동기화는 사용자가 저장한 시점만 사용.


## 2026-10-06 · YouTube 다국어 성경 낭독 자동 카탈로그
- [x] 10개 콘텐츠 언어에서 각 5개 번역판을 정해진 검색어로 찾고, YouTube API 공개·임베드 가능·긴 영상 및 판본 표기를 검증하는 무LLM 주간 갱신기를 추가한다.
- [x] 본문 화면은 최신 카탈로그를 자동으로 읽고, 장 시점이 확인된 출처를 우선 추천하며, YouTube 설명란에서 확인한 장 시점만 본문 따라가기에 쓴다. 장·절 시점을 추정해 만들지 않는다.
- [x] API 응답 데이터는 주간 새로고침하고 30일 지난 카탈로그를 거부한다. API 키는 GitHub Actions secret으로만 읽도록 구성한다.
- [x] Dedicated Google Cloud project enables only YouTube Data API v3; an API-only restricted key is stored as the GitHub repository secret `YOUTUBE_DATA_API_KEY` and its name was confirmed by metadata readback.
- [ ] 첫 자동 갱신에서 10개 언어 각각 5개 이상의 실제 번역판과 언어별 장 따라가기 출처 1개 이상이 발견되는지 확인한다. API 영상 재생과 본문 이동 검증 전까지 목표는 미완료다.

## 2026-10-06 · YouTube 전권 재생목록 자동 발견
- [x] Matthew 한 장편 영상 검색을 전체 성경 재생목록 탐색으로 바꾼다. 10개 언어 × 5개 역본에 YouTube 공식 검색 50회를 주간 실행하고, 버전별 최대 3개 재생목록 후보를 점검해 가장 넓은 장 coverage를 고른다.
- [x] 재생목록·영상 공개 및 임베드 가능성을 확인하고, 제목의 책·장과 설명란의 명시적 절 타임스탬프만 cue로 만든다. 전체 언어의 발견 역본·책·장 coverage를 기록하고, 5개 목표를 검색 전부터 달성했다고 표시하지 않는다.
- [x] 웹은 현재 선택한 성경 언어의 카탈로그 파일만 불러온다. 재생 중 영상 ID의 검증된 절 cue가 있으면 절을, 그렇지 않으면 장 첫 절을 따라간다. 오디오 다운로드나 LLM 토큰 호출은 하지 않는다.
- [x] 로컬에서 한국어·영어·일본어·중국어 책·장 분류 및 영상 설명 절 타임스탬프 self-check와 Node 구문 검사를 통과했다.
- [x] YouTube Data API v3 restricted key를 Actions secret에서 읽도록 연결했다. 첫 실제 검색에서 일부 부분 출처만 발견됐고, 완전 역본은 0개라 성공으로 처리하지 않았다.
- [ ] 변경 사항과 `.github/workflows`를 원격 브랜치에 올리는 GitHub workflow OAuth 권한은 기존 `Drive·Windows 전달 중 Mac 담당 작업 실행` 대기에서 사용자 Resume 후 재확인한다. 기존 대기 카드가 있으므로 중복 인증 요청은 보내지 않는다.

## 2026-10-06 · 현재 장부터 재생 및 전권 기준 검증
- [x] 수집한 재생목록 cue마다 YouTube playlist의 0 기준 item index를 보관하고, 자동 발견된 재생목록은 사용자가 현재 읽는 책·장 item부터 표준 YouTube 플레이어로 재생되게 한다. 수동 저장한 재생목록은 기존 동작을 유지한다.
- [x] 장 cue 66권·1,189장 전부가 확인된 역본만 `complete Bible`로 계산한다. 부분 목록은 UI에서 부분 커버리지로 표시하며 5개 전권 역본 목표에 넣지 않는다.
- [x] 가짜 API 응답 fixture로 검색 50회, 공개·임베드 검증, 번역본 격리, 장 cue와 설명란 절 cue, playlist 시작 index를 함께 확인했다.
- [x] hosted player fixture로 현재 장의 zero-based cuePlaylist 위치를 전달하고 autoplay를 끈 채 YouTube 기본 컨트롤로 시작하는 경로를 검증했다.
- [x] 50개 역본 검색은 그대로 두고 검색당 최대 50개 후보 메타데이터를 비교한 뒤, 재생 항목 수가 1,189개에 가장 가까운 공개 재생목록 하나만 역본별로 상세 스캔한다.
- [x] YouTube 역본명 일치 검사에서 악센트·구두점을 정규화하고, 약어는 단어 경계가 맞을 때만 허용한다. 실제 영상 제목의 `Reina Valera 1960` 표기를 `Reina-Valera 1960` 검색과 연결하는 회귀 fixture를 추가했다.
- [x] 검색을 50개 혼합 playlist/video 조회로 유지하고, 장·책 제목이 판본과 일치하는 공개 채널에서 업로드를 자동 검사한다. 영상 설명에 명시된 chapter/verse 타임스탬프만 cue로 만든다.
- [x] 검증된 영상 ID는 성경 순서의 queue로 정렬한다. 전체 queue는 URL에 넣지 않고 hosted player 준비 후 origin·token 검사 메시지로 전달해 URL 길이 한도를 피한다. 현재 장과 명시된 시작 초부터 cue하고 자동 재생은 하지 않는다.
- [x] 타임스탬프 장편 영상, 채널 업로드, mixed search 및 메시지 기반 큐를 fixture로 검증했다. YouTube API 검색은 50회/실행, 기타 endpoint는 9,500 quota units 이하로 제한한다.
- [x] 태평양 일일 quota reset 후 실제 Worker 검색을 실행했다. 한국어 마태복음 1장 검색은 KRV 5, NKRV 5, KSB 5, KCB 0, KLB 4개였고, 분류 수정 뒤 KCB로 잘못 들어가던 NKRV 영상은 제거됐다. 현재 검색 후보 기준 5개 완전 역본은 3개뿐이며 장·절 cue는 0개다.
- [x] Selah 전용 Google Cloud 프로젝트를 만들고 YouTube Data API v3만 허용한 키를 GitHub Actions의 `YOUTUBE_DATA_API_KEY` secret으로 저장했으며 이름 metadata readback을 확인했다. 키 문자열은 로그에 남기지 않는다.
- [x] 주간 자동 갱신을 미국 태평양 자정 이후로 옮기고 동시 실행을 직렬화해 Search Queries 일일 한도를 앞당겨 소진하거나 중복 실행하지 않게 한다 (feature parity revision 29).
- [x] 배포 Worker revision `8d01fe3f-900b-4a93-8e9d-9fcb6078d978`의 실시간 검색은 HTTP 200을 반환했다. 불충분 판본은 제한된 두 번째 YouTube 검색으로 보충하되, 제목·설명·채널이 다른 판본을 명시하면 해당 후보를 제외한다. Revision 34에서 공유 키 여유를 위해 일일 cap을 70회로 낮췄다.
- [ ] 10개 언어의 완전판·장 coverage를 자동 갱신해 측정하고, 한국어 공동번역 등 부족 판본 검색을 보완한다. 실제 검색 메타데이터는 번역본 정합성 단서이지 영상 본문/저작권/전체 재생 검증이 아니다.
- [ ] 생성 카탈로그 게시, Pages 배포, YouTube 사용자 재생 및 본문 따라가기는 별도 확인한다. 실제 결과에는 verse/chapter timestamp가 없어서 절별 따라가기는 아직 검증되지 않았다.


## 2026-10-06 · 성경 읽기 화면 테마·글꼴 컨트롤
- [x] 성경 읽기 본문 선택 영역에 다크 모드 토글과 글꼴 선택기를 표시하고 집중 읽기 상단에서도 테마를 전환할 수 있게 한다. 글꼴 선택값을 본문 CSS 변수에 연결해 저장된 선택이 유지되도록 수정한다.
- [x] 공유 소스 빌드를 1.0.13 / build 67로 올리고 feature parity revision 1을 등록한다.
- [ ] 웹 브라우저에서 읽기 화면의 밝기 전환, 글꼴 변경 및 새로고침 후 유지, 집중 읽기 화면 토글을 확인한다. iOS·macOS 패키지와 Windows 런타임 검증은 별도로 남아 있다.


## 2026-10-06 · 웹 전체 화면 종료 후 재진입 버튼
- [x] 성경 읽기·집중 읽기 화면에 전체 화면 버튼을 넣고 `fullscreenchange`로 ESC 종료 후 다시 진입 가능한 상태를 표시한다. 전체 화면 API 미지원/거부 시 읽기 집중 화면을 대체 경로로 둔다.
- [x] 공유 웹 번들을 1.0.13 / build 68로 갱신하고 feature parity revision 1을 등록한다.
- [ ] 공개 Aside 브라우저에서 진입 → ESC 종료 → 버튼 재진입 동작을 확인한다. iOS·Windows 네이티브 런타임 검증은 별도로 남아 있다.


## 2026-10-06 · 기본 성경 듣기에서 장 따라가기 우선
- [x] 사용자가 저장한 번역본별 듣기 기본값이 없으면 장 동기화가 준비된 NLT 마태복음 오디오를 우선 추천·빠른 재생 출처로 선택한다. 기존 사용자가 저장한 기본값은 계속 우선한다. 낭독 판본을 NLT로 명시한다.
- [x] 공유 웹 번들을 1.0.13 / build 69로 갱신하고 오디오 기능 parity revision 20을 등록한다.
- [ ] 공개 웹에서 기본 듣기 → YouTube 사용자 재생 → 1장 이후 장 시점에서 본문 장·1절 이동을 실제로 확인한다. 장 안의 절별 자동 이동은 별도 절 시점 없이는 주장하지 않는다.

## 2026-10-07 · Selah 오디오/본문 언어 분리와 절 시점 분류
- [x] 읽는 본문 언어와 독립된 오디오 언어 선택기를 웹 읽기 화면에 추가해, 지원 10개 언어의 음성 역본을 선택할 수 있게 한다. 검색 결과 저장 시 본문 번역본 연결은 유지하고 실제 음성 언어·역본명을 별도로 보존한다.
- [x] YouTube 검색은 선택한 오디오 언어의 정식 책 이름·검색어·장·절 시점을 사용한다. 스페인어·러시아어·우크라이나어 제목/설명과 한국어 본문 조합, 역본별 1개 결과에서 추가 검색이 생략되는 동작을 합성 계약으로 검증한다.
- [x] PR #290 수정으로 한국어 장·절 표시 파서를 보정하고 revision 36 Worker를 배포했다. Deployed Worker `6b1291ac-99bb-4ffb-939a-91650b9f5975`, Pages build 80 deployment `37526735108`; 실검색 전제 없는 OPTIONS=204 및 잘못된 장 요청=400을 확인했다.
- [ ] revision 37에서 영상과 재생목록을 함께 검색해 완전 오디오 판본 후보를 넓힌다. 재생목록에는 영상별 절 시점을 임의로 만들지 않으며, 현재 재생 영상에만 확인된 cue를 저장한다.
- [x] revision 38에서 재생목록 재생 중 YouTube의 현재 영상 URL에 playlist ID가 함께 있어도 video ID를 우선 추출해 자동 절 따라가기와 직접 절 표시가 같은 video cue를 참조하게 한다.
- [ ] YouTube quota reset 이후 10개 언어 검색을 실행해 실제 판본별 영상·재생목록·설명 cue를 검토한다. API 후보 개수나 판본명만으로 완전 성경 coverage를 주장하지 않는다.
- [ ] 웹 공개 페이지에서 사용자가 시작한 재생과 본문 따라가기를 확인한다. 언어별 완전 오디오 역본 5개 이상은 전체 성경 coverage를 검증할 때까지 미완료로 둔다.


## 2026-10-07 YouTube 오디오 판본 검증
- [ ] revision 39: 판본별 YouTube 재생목록 후보의 66권/1,189장 트랙 제목 범위를 자동 확인하고, 장별/절별 cue와 영상 순서를 저장해 웹 재생 중 본문 따라가기를 제공한다. 제목 메타데이터 확인은 실제 음성 청취 검증으로 표현하지 않는다.
- [ ] YouTube 검색 API 일일 한도 초기화 후 각 언어 검색 및 재생목록 검증 결과를 확인한다. 다섯 개 완전 판본/언어와 실제 웹 재생 및 본문 따라가기는 별도 미완료 목표다.
- [ ] revision 41: 재생목록 메타데이터가 여러 역본을 가리키면 요청한 역본이 영상 제목에서 명시된 항목만 검사하고 저장한다. 일치 항목이 없으면 역본 불일치로 표시하며, 버린 영상의 상세 API 조회도 생략한다. 합성 혼합 판본 검사와 실제 후보/웹 재생은 배포 후 확인한다.
- [x] PR #295 병합 및 Worker revision 41 배포. 혼합 KJV/NIV 합성 검사는 통과했고, 실목록 두 개는 선택한 KJV가 개별 트랙 제목에서 확인되지 않아 `edition_mismatch`로 차단됐다.
- [x] revision 42: 태평양 자정 이후 매주 10개 음성 언어를 그룹 검색하고 역본별 재생목록 후보를 최대 1개씩 자동 검증한다. 판본이 모호하거나 섞인 트랙은 재생 대상에서 제외하고, 요청 간 8초 간격을 두어 Worker 속도 제한을 지킨다.
- [x] 로컬 후속 수정: 역본별 후보를 최대 5개까지 시도해 완전 coverage를 우선하고, 책 단위 오디오 영상도 제목의 책 이름과 설명의 장별 timestamp를 검증해 본문 따라가기에 연결한다. 장별 영상·책별 영상 합성 coverage 검사는 통과했으며 Worker 배포와 실후보 검증은 미완료다.
- [x] 읽기 화면은 현재 음성 언어 카탈로그만 자동으로 불러오고, 완전/부분 장 커버리지가 검증된 재생목록을 선택한 본문 역본 아래에 해당 오디오 역본을 표시한다. 사용자가 YouTube 표준 재생 버튼을 눌러 듣도록 유지한다.
- [ ] PR #296 병합과 Pages build 84 배포 후 공개 카탈로그 로딩·웹 재생·본문 따라가기를 확인한다. iPhone build/install/runtime은 별도다.
- [ ] 첫 자동 YouTube 검색은 일일 한도 재설정 뒤 실행한다. 10개 언어 각각 실제 완전 커버리지 역본 5개, 재생과 본문 따라가기를 확인할 때까지 목표는 미완료다.
- [ ] 새 Worker 코드가 배포되면 66개 책별 영상 playlist를 재검증해 장별 timestamp cue가 실제 본문과 함께 움직이는지 확인한다. 현재 NIV 후보는 itemCount 66, Worker PARTIAL_COVERAGE 0/1,189, cue 0으로 아직 플레이 가능한 검증 결과가 아니다.

### 2026-10-07 후속: 무인 Worker 카탈로그 갱신
- [x] GitHub Actions의 workflow scope handoff를 기다리지 않고, 이미 설정된 Worker API 키로 Cloudflare Cron이 매일 언어 하나씩 순환 갱신하도록 경로를 바꿨다. 10개 언어 전체는 10일마다 순환하며, 각 언어의 다섯 역본에서 최대 다섯 재생목록 후보를 확인한다.
- [x] 웹은 Worker의 최신 언어별 카탈로그를 먼저 요청하고, Worker에 결과가 없거나 통신이 실패하면 저장소 내 정적 카탈로그로 대체한다. 검색 API 키는 계속 Worker 안에만 둔다.
- [x] 합성 discovery, 후보 재시도, Durable Object 저장/읽기, 같은 날 중복 방지, 언어 순환과 CORS 계약 테스트를 통과했다.
- [x] Revision 45: `search.list` 사용자 70회/자동 30회를 분리하고 재생목록 검증을 사용자 150개/자동 30개로 예약한다. 후보당 최악 49 단위, 최대 8,820/10,000 비검색 단위로 제한한다. 계약 검사 통과, PR #300 병합, Worker `a2b3adc5-7513-4f2b-9151-42f1ebdfacae` 배포와 Cron readback 완료; 첫 카탈로그 Cron은 오늘 17:20 KST 대기. [기록 2026-10-07 · 삭제 예정 2027-10-07]
- [ ] Revision 46: 자동 Cron에서 후보 검증 하나씩 Durable Object 별도 요청으로 실행해 Workers Free의 호출당 외부 요청 50개 제한에 맞춘다. Search·coverage·카탈로그 계약 검사 통과; 병합/Worker 배포와 첫 실데이터 수집 대기. [기록 2026-10-07 · 삭제 예정 2027-10-07]
- [ ] Worker 배포와 Cron trigger readback, 첫 일일 실행 및 실제 후보 커버리지를 확인한다. 언어별 다섯 개 완전 성경 역본 목표는 실데이터 확인 전 미완료다.
- [ ] 웹 화면에서 YouTube 사용자 재생을 시작하고 실제 소리와 확인된 cue에 따른 본문 따라가기를 확인한다. Aside 브라우저 제어가 가능해지기 전까지 HTTP 배포 확인은 화면·소리 증거를 대신하지 않는다.

## 2026-10-07 · 읽기 컨트롤 회귀 및 YouTube API 자동 수집
### 2026-10-07 후속 점검 및 글꼴 회귀 수정
- [x] 전역 `!important` 글꼴 규칙이 성경 본문과 글꼴 미리보기를 덮던 문제를 수정하고, 읽기/집중 화면의 글꼴 선택 컨트롤을 숨기던 규칙을 제거했다. 공유 웹 번들은 1.0.17/build 85로 동기화했다. 글꼴·전체화면 parity revision 2와 정적 UI 계약 검사 통과; 공개 브라우저의 실제 입력/표시 및 ESC 재진입 검증은 대기. [기록 2026-10-07 · 삭제 예정 2027-10-07]
- [ ] YouTube API Worker 비밀값이 배포 환경에 존재하는 것을 확인했다. API 검색·카탈로그는 16:00 KST 일일 한도 초기화와 17:20 KST Cron 실행 이후 실제 후보/coverage를 확인한다. 현재 공개 카탈로그 응답은 `catalog_not_found`로 첫 실행 전이다. [기록 2026-10-07 · 삭제 예정 2027-10-07]

## 2026-10-07 · 사용자 지정 테마의 대비 하한 보장
- [x] 기존 대체 전경색이 순수 흑/백이 아니라 회색 배경 일부에서 4.5:1보다 낮아지는 회귀 원인을 수정했다. 대비가 부족하면 순수 흑/백 중 실제 배경에 더 잘 맞는 쪽을 선택한다.
- [x] 회색 256단계와 대표 색 6개에서 10개 텍스트 역할의 WCAG 4.5:1 대비를 확인하는 회귀 검사를 추가하고 공용 앱 CI에 연결했다.
- [x] 스크린샷에서 드러난 원인은 성경 본문 전에 닫혀야 할 오디오 설정 `<section>` 경계가 잘못되어 본문이 읽기 카드와 읽기 열 밖으로 빠져나온 것이었다. 중첩을 바로잡고 이 구조를 회귀 검사에 추가했다.
- [x] 대비 계산은 `--green` 단색을 기준으로 하는데 실제 패널에는 검정 혼합 그라디언트를 그리고, 번역본/오디오 안내는 `--ink`·`--green`을 직접 써서 표면과 어긋나 있었다. 패널을 단색 accent로 통일하고 각 컨트롤에 실제 배경 역할의 계산된 전경색을 적용했다.
- [x] 데스크톱 읽기 패널의 `920px` 제한을 제거해 읽기 도구와 같은 콘텐츠 열 너비로 정렬했다. 모바일 집중 읽기는 종이 배경/잉크 대비 역할을 사용한다.
- [x] Capacitor `mobile/www` 67개 파일 동기화·해시 확인, 대비/모바일 배치 회귀, 플랫폼 parity, 기능 parity 검사를 통과시켰다. revision 7은 본문 컨트롤을 모바일 한 행으로 정렬하고 상태 막대 아래 안전 영역을 가린다.
- [x] iOS 26.4 `Selah Store QA 01a0fab5` Simulator에서 1.0.18/build 86을 빌드·설치·실행했다. 라이트·다크 화면 캡처에서 카드 대비, A−/A+ 가시성, 스크롤 중 상태 막대 겹침 방지를 확인하고 글자 크기를 테스트 전 값 28px로 복원했다.
- [ ] 실제 iPhone과 웹 배포 화면은 별도 검증이 남아 있다. [기록 2026-10-07 · 삭제 예정 2027-10-07]

## 2026-10-07 · 열린 웹 세션에서 자동 오디오 카탈로그 갱신
- [x] 첫 Cron 전 `404 catalog_not_found`를 받은 탭이 실패를 세션 동안 계속 보관하던 문제를 수정한다. 카탈로그가 없으면 다음 UTC 08:30 확인 시각을 향해 최대 6시간 간격으로 다시 읽고, 응답이 생기면 자동으로 듣기 목록을 다시 그린다.
- [x] 재시도는 공개 카탈로그 GET만 사용하고 YouTube 검색·재생목록 스캔을 추가 호출하지 않는다. fixture가 Cron 전 404 뒤 공개된 새 응답을 같은 세션에서 읽는 것을 확인한다.
- [ ] 웹 배포 후 열어 둔 탭의 실제 갱신을 확인하고, 예약 카탈로그의 완전판·YouTube 실제 재생·본문 따라가기를 검증한다.

## 2026-10-07 · 자동 재생목록 후보 검사 활용도
- [x] 기존 자동 검사 한도 30개 안에서 다섯 역본 언어는 역본당 후보를 5→6개로 확대하고, 6개인 한국어는 기존처럼 5개씩 유지한다. 추가 YouTube 검색이나 쿼터 사용은 없다 (feature parity revision 52).
- [x] 영어·한국어 합성 카탈로그에서 후보 cap, 검사 수, 최고 coverage 선택을 확인하는 회귀 검사를 통과했다.
- [ ] Worker 배포 뒤 실제 일일 수집에서 후보별 coverage 증가와 YouTube 사용자 재생·본문 따라가기를 확인한다. [기록 2026-10-07 · 삭제 예정 2027-10-07]

## 2026-10-07 · 집중 성경 읽기 화면 비율별 겹침 수정
- [x] iPhone 집중 읽기에서 고정 높이 Grid 행 때문에 오디오 보조 링크와 본문이 겹치고 본문이 남은 세로 공간을 받지 못하던 원인을 수정했다. 오디오 보조 컨트롤을 집중 화면에서 숨기고 본문에 유연 행을 할당; 회귀 검사 추가. [기록 2026-10-07 · 삭제 예정 2027-10-07]
- [x] iPhone·iPad Simulator의 세로·가로 비율에서 본문과 컨트롤 겹침이 없는 것을 확인했다.
- [x] PR #311 (`b6ae77f`)을 main에 병합하고 Pages 배포 run `37568119465` 성공을 확인했다. 공개 HTML에서 수정된 focus Grid 및 오디오 숨김 CSS를 읽었고, iPad Simulator Safari에서 배포 화면을 확인했다. [기록 2026-10-07 · 삭제 예정 2027-10-07]
