# Selah repository workflow

Selah's canonical GitHub repository is `delight0517/selah-bible-meditation`.
`main` is the source of truth and deploys the GitHub Pages site from the
repository root. `brainwire-app` is a separate repository and its permissions
do not grant access to Selah.

## Before changing files

1. Confirm the checkout with `git remote get-url origin` and confirm it is the
   Selah repository above.
2. Run `git status --short --branch`. Do not edit, reset, clean, or switch a
   checkout that contains someone else's changes.
3. Run `git fetch origin` before creating a task branch. Start each task branch
   from the fetched `origin/main`, never from another task branch or an old
   local `main`.
4. Use one clean checkout for one task. Keep existing dirty checkouts intact;
   do not use them as the starting point for unrelated work.

## Before pushing or opening a pull request

1. Fetch `origin` again and inspect both sides of the branch:

   ```sh
   git rev-list --left-right --count HEAD...origin/main
   git log --oneline origin/main..HEAD
   git log --oneline HEAD..origin/main
   ```

2. If `origin/main` has commits missing from the task branch, inspect changed
   files and reconcile the branch before pushing. Never force-push, reset away
   commits, or assume an earlier fetch is current. If the same file changed on
   both sides and the correct result is not clear, stop and ask the owner.
3. Push only the task branch and use a pull request into `main`. Do not push
   feature work directly to `main`.
4. After merge, fetch `main` and verify the merged commit and Pages deployment
   separately. A successful push or merge alone is not proof of deployment.

## Shared feature ownership and release

Follow [PLATFORM_RELEASE.md](PLATFORM_RELEASE.md) for every feature change.
Coordinate behavior across independent web, Windows, macOS and iOS implementations.
Do not force native apps to use hosted web UI. Register functional changes in
`contracts/feature-parity.json` with a feature ID/revision, acceptance criteria,
affected paths and all platform owners/statuses. Increment revision on behavior
changes and reassess all platforms; stale targets stay pending. Existing generated
`mobile/www` stays generated until its architecture is explicitly changed.
Run `npm --prefix mobile run copy:web` and `node scripts/check-platform-source.mjs`
and `node scripts/check-feature-parity.mjs` before a PR. iOS and iPhone are the
same target. Record source parity, web
deployment, native packaging, installation and runtime verification separately
in TODO.md. Never report a native install or Microsoft Store release from a web
deployment alone. Keep Windows launcher package and shared UI versions distinct.
Run `node scripts/check-feature-parity.mjs --release` before declaring a unified
release complete. Sending a Mac request is not acknowledgement or implementation.
Use the same feature ID/revision for requests and replies; do not duplicate jobs.

## Checkout inventory

Old task checkouts may remain for recovery. Their presence does not make them
current. Always use a fresh task checkout from the latest `origin/main`; do not
try to synchronize all historical worktrees automatically, because some have
uncommitted user changes.
