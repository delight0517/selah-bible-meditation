param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[a-z0-9]+(?:-[a-z0-9]+)*$')]
    [string]$TaskSlug,
    [string]$BaseRef = 'origin/main'
)

$ErrorActionPreference = 'Stop'
$repoRoot = & git rev-parse --show-toplevel 2>$null
if ($LASTEXITCODE -ne 0 -or -not $repoRoot) { throw 'Run this script from inside the Selah Git repository.' }
$repoRoot = [IO.Path]::GetFullPath($repoRoot.Trim())
$origin = & git -C $repoRoot remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0 -or -not $origin) { throw 'Could not identify the GitHub origin.' }
$normalizedOrigin = $origin.Trim().Replace(':', '/').TrimEnd('/') -replace '\.git$', ''
if ($normalizedOrigin -notmatch 'github\.com/delight0517/selah-bible-meditation$') { throw "Unexpected Git origin: $origin" }
$status = @(& git -C $repoRoot status --porcelain=v1)
if ($LASTEXITCODE -ne 0) { throw 'Could not read Git status.' }
if ($status.Count -gt 0) { throw 'This checkout has local changes. Preserve them and start from a separate clean checkout.' }

& git -C $repoRoot fetch origin
if ($LASTEXITCODE -ne 0) { throw 'Fetching origin failed; no worktree was created.' }
& git -C $repoRoot rev-parse --verify "$BaseRef^{commit}" *> $null
if ($LASTEXITCODE -ne 0) { throw "Base ref '$BaseRef' is unavailable." }

$date = Get-Date -Format 'yyyyMMdd'
$branch = "codex/$TaskSlug-$date"
$worktreeRoot = Join-Path (Split-Path -Parent $repoRoot) ((Split-Path -Leaf $repoRoot) + '-worktrees')
$worktreePath = Join-Path $worktreeRoot "$TaskSlug-$date"
if (Test-Path -LiteralPath $worktreePath) { throw "Worktree path already exists: $worktreePath" }
& git -C $repoRoot show-ref --verify --quiet "refs/heads/$branch"
if ($LASTEXITCODE -eq 0) { throw "Branch already exists: $branch. Choose another task slug." }

New-Item -ItemType Directory -Path $worktreeRoot -Force | Out-Null
& git -C $repoRoot worktree add -b $branch $worktreePath $BaseRef
if ($LASTEXITCODE -ne 0) { throw 'Git could not create the isolated worktree.' }
Write-Output "TASK_BRANCH=$branch"
Write-Output "TASK_WORKTREE=$worktreePath"
