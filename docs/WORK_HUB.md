# Selah cross-device work and analytics hub

`work-hub.json` is the shared source of truth for Selah task ownership, overlapping scopes, handoffs, and analytics data-source pointers. GitHub `main` is authoritative for both Mac and Windows. Do not start overlapping implementation while a task scope is claimed, active, waiting on external access, or under review.

## Before starting work

1. Fetch the current `origin/main` and inspect `docs/work-hub.json` plus open pull requests. A local checkout or old task note is not authoritative.
2. Use the controlled scope IDs in `scopeCatalog`. A live task reserves both its scope and its declared resources. If any match, add a handoff or feedback entry to the existing task instead of creating parallel work.
3. Claim work with `node scripts/work-hub.mjs claim --id <stable-id> --owner <mac|windows|shared> --scopes <scope-id,...> --branch <branch> --summary <short-summary> --repo <https-repo-url> --thread <task-id> --base <origin-main-sha> --files <repo/relative/path,...>`. Each claim must identify its repository, originating task, base commit, and exact files or directories. Wildcards, absolute paths, and `..` are rejected. Commit only the resulting hub change and open a PR. Start source edits after the claim PR is merged.
4. The validator rejects overlapping scopes, identical declared resources, and exact or parent/child path overlaps in the same repository. It also rejects completion without evidence. Older live claims without the new metadata are reported as migration warnings; do not invent missing owners or file lists.
5. After source edits, update the same record with evidence and status using `node scripts/work-hub.mjs set <id> <waiting_external|review|completed|canceled>`. Record Mac/Windows feedback using `node scripts/work-hub.mjs feedback <id> --from <mac|windows> --text <feedback>`.
6. Track cross-device requests with `handoff`, then `ack`, `respond`, and `resolve`. A sent request is not received; a response is not accepted until the task owner resolves it. Record an external dispatch artifact hash or other independently checkable receipt when available.
5. Keep a task claimed while waiting for authentication, another device, or review. Release it only when complete or explicitly canceled. A completed record remains as history but does not block future work.

## Merge gate and race handling

The `work-hub / validate` GitHub Actions check rejects invalid records, unknown scopes, and live scope/resource/file collisions. The protected `main` branch also requires the existing `branch-current` check, so a competing claim must incorporate the first merged claim before it can merge. The refreshed branch then fails the overlap check instead of silently creating duplicate ownership. Do not bypass either required check.

GitHub is the shared editing and review surface: Mac and Windows each submit changes through task branches and pull requests. Never edit the other device's checkout. GitHub comments and `feedback` entries are the review trail.

## Analytics data handling

The catalog in `work-hub.json` points to each dataset's actual system of record and documents coverage, freshness, and limitations. It intentionally does not copy raw Search Console or GA4 data into Git. Store only reviewed aggregate snapshots when a decision requires them; include the query window, dimensions, source, and caveats. First-party feature-event aggregates and page-view aggregates are separate datasets. Do not combine them or count them as people. Do not attribute a page-view row to a domain when its origin is unknown.

Google Search Console, the first-party Cloudflare Worker, and GA4 remain separate source systems. This hub centralizes ownership, definitions, review, and handoffs; it does not pretend that missing external authorization or uncollected GA4 events already exist.

## Commands

- `node scripts/work-hub.mjs list` — show live and completed task records.
- `node scripts/work-hub.mjs check` — validate the ledger and duplicate scope/resource/file guards.
- `node scripts/work-hub.mjs claim ...` — append a unique, scope-checked claim.
- `node scripts/work-hub.mjs set <id> <status>` — move a claim forward and optionally attach evidence / next action.
- `node scripts/work-hub.mjs feedback ...` — append cross-device feedback to a task.
- `node scripts/work-hub.mjs handoff ...` / `ack` / `respond` / `resolve` — record request, receipt, response, and owner decision separately.

The CLI edits only `docs/work-hub.json`; it never commits, pushes, merges, changes account settings, or copies analytics rows.

## 플랫폼 기능 동등성
기능별 합격 기준과 revision은 contracts/feature-parity.json에서 관리한다. 작업 담당·중복 범위·수신 대기는 이 work-hub 원장을 사용한다. 기능 원장의 workItem으로 기존 작업을 이어가고 같은 요청을 새로 만들지 않는다. 플랫폼별 구현 기술은 강제하지 않는다. 자세한 규칙은 PLATFORM_RELEASE.md를 따른다.
