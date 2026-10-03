# Selah cross-device work and analytics hub

`work-hub.json` is the shared source of truth for Selah task ownership, overlapping scopes, handoffs, and analytics data-source pointers. GitHub `main` is authoritative for both Mac and Windows. Do not start overlapping implementation while a task scope is claimed, active, waiting on external access, or under review.

## Before starting work

1. Fetch the current `origin/main` and inspect `docs/work-hub.json` plus open pull requests. A local checkout or old task note is not authoritative.
2. Use the controlled scope IDs in `scopeCatalog`. If a task touches the same scope as a live task, add a handoff or feedback entry to that existing record instead of creating a parallel claim.
3. Claim work with `node scripts/work-hub.mjs claim --id <stable-id> --owner <mac|windows|shared> --scopes <scope-id,...> --branch <branch> --summary <short-summary>`. Commit only the resulting hub change and open a PR. Start source edits after the claim PR is merged. A merged claim reserves those scopes across devices.
4. After source edits, update the same record with evidence and status using `node scripts/work-hub.mjs set <id> <waiting_external|review|completed|canceled>`. Record Mac/Windows feedback using `node scripts/work-hub.mjs feedback <id> --from <mac|windows> --text <feedback>`.
5. Keep a task claimed while waiting for authentication, another device, or review. Release it only when complete or explicitly canceled. A completed record remains as history but does not block future work.

## Merge gate and race handling

The `work-hub / validate` GitHub Actions check rejects invalid records, unknown scopes, and live tasks that claim the same scope. The protected `main` branch also requires the existing `branch-current` check, so a competing claim must incorporate the first merged claim before it can merge. The refreshed branch then fails the scope check instead of silently creating duplicate ownership. Do not bypass either required check.

GitHub is the shared editing and review surface: Mac and Windows each submit changes through task branches and pull requests. Never edit the other device's checkout. GitHub comments and `feedback` entries are the review trail.

## Analytics data handling

The catalog in `work-hub.json` points to each dataset's actual system of record and documents coverage, freshness, and limitations. It intentionally does not copy raw Search Console or GA4 data into Git. Store only reviewed aggregate snapshots when a decision requires them; include the query window, dimensions, source, and caveats. First-party feature-event aggregates and page-view aggregates are separate datasets. Do not combine them or count them as people. Do not attribute a page-view row to a domain when its origin is unknown.

Google Search Console, the first-party Cloudflare Worker, and GA4 remain separate source systems. This hub centralizes ownership, definitions, review, and handoffs; it does not pretend that missing external authorization or uncollected GA4 events already exist.

## Commands

- `node scripts/work-hub.mjs list` — show live and completed task records.
- `node scripts/work-hub.mjs check` — validate the ledger and duplicate-scope guard.
- `node scripts/work-hub.mjs claim ...` — append a unique, scope-checked claim.
- `node scripts/work-hub.mjs set <id> <status>` — move a claim forward and optionally attach evidence / next action.
- `node scripts/work-hub.mjs feedback ...` — append cross-device feedback to a task.

The CLI edits only `docs/work-hub.json`; it never commits, pushes, merges, changes account settings, or copies analytics rows.
