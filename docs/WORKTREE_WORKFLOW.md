# Selah: parallel chat and shared work workflow

GitHub `main` is the source of truth. Each concurrent chat works in a separate Git worktree and task branch so parallel edits do not share a mutable checkout. Do not use `main` as a task branch, and never edit another task's worktree.

## Start a task

1. Read `AGENTS.md`; inspect relevant files and open PRs to define scope.
2. From a clean repository checkout, run `powershell -ExecutionPolicy Bypass -File scripts/Start-WorktreeTask.ps1 -TaskSlug <short-name>`.
3. The script fetches `origin`, creates a dated `codex/<slug>-YYYYMMDD` branch from `origin/main`, and creates a sibling checkout under `<repo>-worktrees/`.
4. Keep each task to its owned files. For broader work, add `docs/work-items/<slug>.md` with goal, owner/chat, branch, files, dependencies, and status.

## Share and integrate work

- Share code through a branch and pull request. Share plans, interfaces, and file ownership through the task note and PR description. GitHub is code authority; Drive is handoff/status only.
- Before opening a PR, inspect the full diff, run relevant checks, update `TODO.md`, and confirm the worktree is clean after commit.
- Merge only after review and CI. If `main` moves, fetch and inspect the delta. Resolve conflicts in the task worktree while preserving both tasks; never reset or force-push shared history.
- After merge, verify the deployed page from its public URL. After publishing an installer or other artifact, download it from the target and verify its hash separately.
- When changing a static stylesheet, increment its query-string cache token in the HTML link as part of the same PR; GitHub Pages can cache CSS for 600 seconds.
- Mark a task done only when the note/PR says whether it is local, in review, merged, or deployed and records direct evidence.

## Shared task note template

Create one small `docs/work-items/<slug>.md` per multi-chat effort:

```md
# <Task title>
- Owner/chat:
- Branch/worktree:
- Status: planned | active | review | merged | deployed
- Owns:
- Depends on:
- Handoff/verification:
```

The task note and PR are the shared handoff. Never coordinate by editing a peer's checkout or force-pushing a shared branch.
