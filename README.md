# Selah — 말씀 묵상

지역별 제품·성장 방향과 검증 상태는 [지역별 플레이북](MARKET_PLAYBOOK.md)에서 관리합니다.

서비스: https://delight0517.github.io/selah-bible-meditation/
저장소: https://github.com/delight0517/selah-bible-meditation

마태복음에서 시작하는 한국어 성경 묵상 웹앱입니다.

## 홈과 읽기 화면

- `home.html`: 본문 없는 독립 홈/대시보드. 이 브라우저의 출석·묵상·복습 카드 수를 읽기 전용으로 보여 줍니다.
- `index.html`: 기존 성경 읽기·묵상 화면. 상단의 홈 링크로 돌아갈 수 있습니다. 기존 공유 주소는 유지합니다.
- 홈에서 말씀 읽기는 집중 읽기로, 시간 묵상은 시간 선택 창으로 연결됩니다.
- 광고는 비활성입니다. 설정 및 CMP 요건: [docs/adsense-draft.md](docs/adsense-draft.md).
- 검증: `node scripts/check-home.mjs`, `node scripts/check-dashboard-ad.mjs`.


## 사용해 보기

말씀을 한 장씩 읽고 묵상 기록을 이어가는 Selah입니다. 한국어 앱은 로그인 없이 시작할 수 있고, 계정 동기화는 선택 사항입니다.

### Português do Brasil

Leia um capítulo, observe o contexto e registre uma pergunta ou reflexão. O leitor em português oferece a Bíblia Livre 2018 completa (66 livros), leitura offline e notas salvas neste dispositivo, sem exigir login.

- [Abrir o leitor bíblico em português](https://delight0517.github.io/selah-bible-meditation/pt-br/?utm_source=github&utm_medium=referral&utm_campaign=selah_ptbr_readme)
- [Guia: como meditar na Bíblia quando a rotina é corrida](https://delight0517.github.io/selah-bible-meditation/pt-br/guia/?utm_source=github&utm_medium=referral&utm_campaign=selah_ptbr_readme)
- Texto: Bíblia Livre 2018, licença CC BY 4.0; [créditos e licença](https://delight0517.github.io/selah-bible-meditation/pt-br/ATTRIBUTION.md).

## 운영 방식

- GitHub Pages가 `main` 브랜치의 루트 `index.html`을 제공합니다.
- `index.html`을 수정하고 `main`에 push하면 GitHub Pages가 갱신합니다.
- BlueCloud 서버(`brainwire-f2gf.onrender.com`)는 로그인, 기기 간 동기화, 친구 기능을 제공합니다.
- 로그인 전 기록은 브라우저에 저장됩니다. 기기 간 이동 전 앱의 백업 기능을 사용하세요.

## Mac·Windows 간 백업 이동

Safari 웹 앱과 Edge PWA는 각자 별도의 브라우저 저장 공간을 사용합니다. 같은 BlueCloud 계정으로 로그인하면 지원 데이터가 동기화되고, 계정 동기화를 쓰지 않을 때는 원본 기기에서 **내 기록 백업**을 내보내 대상 기기에서 가져오세요. 새 백업 형식은 묵상 기록과 현재 초안 등 사용자 상태를 유지하면서 원본 계정 식별자와 서버 revision을 제거합니다. 로그인 토큰은 별도 저장되어 백업에 포함되지 않습니다. 기존의 평면 JSON 백업도 계속 가져올 수 있습니다. 형식은 [`contracts/selah-portable-backup.schema.json`](contracts/selah-portable-backup.schema.json)에 정의돼 있습니다.

## Mac에서 앱처럼 열기

1. macOS Sonoma 14 이상에서 Safari로 `https://delight0517.github.io/selah-bible-meditation/`을 엽니다.
2. 메뉴 막대에서 **파일 → Dock에 추가**를 선택합니다. 또는 공유 버튼에서 **Dock에 추가**를 선택합니다.
3. 추가된 Selah 아이콘은 Dock과 Spotlight에서 실행할 수 있습니다. 본문 오른쪽 위의 **집중 읽기** 버튼으로 읽기 화면을 넓게 전환하세요.

Mac에는 Safari의 **Dock에 추가** 웹 앱과 별도 `Selah Mac.app`이 있습니다. 설치된 앱은 macOS 14 이상용 universal SwiftUI/WebKit 래퍼로, 같은 Selah 웹 URL을 엽니다. Mac 소스에서는 뒤로/앞으로, 80–150% 페이지 확대·축소, 집중 읽기, 키보드 명령과 스와이프 탐색이 확인됐습니다. 서명된 권한은 앱 샌드박스와 네트워크 클라이언트입니다. 설치 바이너리와 로컬 archive의 Mach-O UUID가 달라 정확한 설치 소스 빌드는 미확인입니다. Safari 앱과 WKWebView 앱의 로컬 기록은 별도 프로필로 취급하세요. 로그인 전 기록은 앱별 저장 공간에 남으며 백업 기능으로 옮길 수 있습니다.

## Windows에서 앱처럼 열기

1. Windows에서 [Microsoft Edge 설치 안내](windows/README.md)를 따르세요. Edge의 **Install this site as an app** 기능으로 Selah를 별도 앱 창에 설치하고 시작 메뉴·작업 표시줄·바탕 화면 바로가기를 만들 수 있습니다.
2. 빠르게 앱 창을 열려면 [Windows 런처](windows/Launch-Selah.cmd)를 실행하세요. 바탕 화면과 시작 메뉴 바로가기는 [바로가기 만들기](windows/Create-Selah-Desktop-Shortcut.vbs)를 실행하면 생성됩니다.

Windows는 관리형 Edge 앱 창/PWA 런처를 사용합니다. Mac 네이티브 래퍼와 같은 뒤로/앞으로, 80–150% 페이지 확대·축소, 집중 읽기 도구막대를 공유 웹 앱에 제공합니다. 두 플랫폼은 같은 호스팅 웹 소스와 BlueCloud 계정 API를 사용하므로 말씀 읽기·묵상·기록 형식은 공유됩니다. 페이지 확대값과 로그인 전 기록은 브라우저 프로필별로 남으므로 기기 이동 전에 기록을 백업하세요.

두 데스크톱 환경이 공유하는 현재 BlueCloud payload와 확인된 묵상·퀴즈·QT·경험·성경 대화 기록 필드는 [`contracts/selah-cloud-state.schema.json`](contracts/selah-cloud-state.schema.json)에 있습니다. 앱 UI 언어와 성경 본문 언어는 따로 저장하며, 로그인한 기기 사이에서는 본문 언어 선택을 동기화합니다. 번역본 다운로드는 브라우저별로 준비해야 합니다. Mac 측 추가 자료를 받으면 기존 데이터 호환성을 해치지 않는 범위에서 나머지 필드를 보완합니다.

## 中文阅读

- 简体中文入口：`https://delight0517.github.io/selah-bible-meditation/zh-cn/`
- 繁體中文入口：`https://delight0517.github.io/selah-bible-meditation/zh-tw/`
- 内置中文经文为1919年《和合本》，简体与繁體各自采用对应原文数据。Open Bibles 将其列为 Public Domain；不同司法辖区的权利状态可能不同。1988/2010年后续修订本不包含在内。
