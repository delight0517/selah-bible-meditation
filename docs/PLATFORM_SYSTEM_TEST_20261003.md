# 플랫폼 작업 시스템 실제 시험 — 2026-10-03

시험 대상 main: c95542d3dd369c502a5859eeeb2a51a8dfdcbe30. 앱 UI 1.0.10/build29.

| 시험 | 방식 | 결과 |
| --- | --- | --- |
| 변경 코드만 있고 기능 원장 없음 | 실제 PR #167, 웹 index 주석 변경 및 모바일 bundle 동기화, 원장 누락 | 필수 contract 실패: Product changed without feature-parity ledger update |
| 실패한 PR 병합 가능 여부 | draft를 ready로 전환해 GitHub mergeState 확인 | BLOCKED. PR은 병합 없이 종료 |
| 정상 플랫폼 기록 | 격리 Git fixture에서 모든 target revision/evidence 작성 | 검사 통과 |
| 이전 revision 검증 재사용 | fixture 기능 revision 상승, 기존 platform revision 유지 | 차단 |
| 반영 대기 iOS/Mac | fixture pending 기록 | 부분 변경은 허용, --release 전체 완료는 차단 |
| 실제 원장의 전체 완료 | 현재 실제 원장에 --release 실행 | 7개 미검증 플랫폼 항목 때문에 차단(exit1) |
| 모바일 누락/오래된 복사본 | 새 JS 의존성, stale bundle, 누락 파일 fixture | 모두 차단; 생성 후 정상 통과 |
| 중복 Mac 작업 | 실제 work-hub 원장의 임시 복사본에 동일 scope 재등록 | 기존 waiting_external 작업 감지, 차단(exit1) |
| 현재 소스/설정 일치 | check-platform-source + work-hub check | 48개 파일/버전 및 5작업/6범위 유효 |
| Mac 큐 전송/readback | 기존 request_id 조회 | origin/main에서 open, received=false, completed=false |

GitHub 근거:
- 실패 테스트 PR: https://github.com/delight0517/selah-bible-meditation/pull/167 (CLOSED, 미병합).
- 실제 PR CI: https://github.com/delight0517/selah-bible-meditation/actions/runs/37129848918 (contract FAILURE; windows-protocol SUCCESS).
- 브랜치 필수 검사 조회 결과: branch-current, contract, validate.
- Mac request_id: selah-apple-feature-parity-20261003. 전송 commit d0eb1304a32d2271916c174172d81e9989778278.

결론: GitHub에서 기록 누락을 차단하고, 미반영/미검증을 완료로 처리하지 않는 현재 관리 시스템은 작동한다. 이것이 기기별 구현을 자동 생성하거나 설치하는 것은 아니다. Mac 담당 수신·작업·실제 iPhone 설치·실행 회신까지의 전체 흐름은 아직 미검증이다. 별도 플랫폼 저장소에도 같은 관리 규칙을 적용했다는 Mac 회신이 필요하다. --release는 현재 제공한 완료 확인 명령이며 App Store/Store 업로드 시스템을 자동 통제하는 것은 아니다.
