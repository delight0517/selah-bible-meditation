[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$buildInfo = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'BUILD_INFO.json') -Raw | ConvertFrom-Json
$packageName = 'Selah-Windows-Launcher-v{0}-build{1}' -f $buildInfo.version, $buildInfo.build
$outputRoot = Join-Path $PSScriptRoot 'dist'
$stagingRoot = Join-Path $outputRoot ($packageName + '-stage-' + [Guid]::NewGuid().ToString('N'))
$archivePath = Join-Path $outputRoot ($packageName + '.zip')

if (Test-Path -LiteralPath $archivePath) {
    throw "Release ZIP already exists. Preserve it and use a new build number: $archivePath"
}
New-Item -ItemType Directory -Path $stagingRoot -Force | Out-Null

# Explicit allowlist: no Bible datasets, cloud credentials, local app settings,
# user notes, browser extensions, PAC files, or third-party images are bundled.
$releaseFiles = [ordered]@{
    'Launch-Selah.cmd' = Join-Path $PSScriptRoot 'Launch-Selah.cmd'
    'Launch-Selah-App.vbs' = Join-Path $PSScriptRoot 'Launch-Selah-App.vbs'
    'Create-Selah-Desktop-Shortcut.vbs' = Join-Path $PSScriptRoot 'Create-Selah-Desktop-Shortcut.vbs'
    'BUILD_INFO.json' = Join-Path $PSScriptRoot 'BUILD_INFO.json'
    'README.md' = Join-Path $PSScriptRoot 'DOWNLOAD-README.md'
    'LICENSE' = Join-Path $repoRoot 'LICENSE'
    'THIRD_PARTY_NOTICES.md' = Join-Path $repoRoot 'THIRD_PARTY_NOTICES.md'
}
$inventory = @()
foreach ($entry in $releaseFiles.GetEnumerator()) {
    if (-not (Test-Path -LiteralPath $entry.Value -PathType Leaf)) {
        throw "Missing release input: $($entry.Key)"
    }
    $destinationPath = Join-Path $stagingRoot $entry.Key
    Copy-Item -LiteralPath $entry.Value -Destination $destinationPath
    $inventory += [ordered]@{
        path = $entry.Key
        sha256 = (Get-FileHash -LiteralPath $destinationPath -Algorithm SHA256).Hash.ToLowerInvariant()
    }
}
$releaseManifest = [ordered]@{
    package = $packageName
    kind = 'hosted-edge-app-window-launcher'
    version = $buildInfo.version
    build = $buildInfo.build
    appUrl = 'https://delight0517.github.io/selah-bible-meditation/?windowsShell=1'
    license = 'MIT for original application code; see THIRD_PARTY_NOTICES.md'
    files = $inventory
}
$manifestPath = Join-Path $stagingRoot 'RELEASE-MANIFEST.json'
$releaseManifest | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $manifestPath -Encoding utf8
Compress-Archive -Path (Join-Path $stagingRoot '*') -DestinationPath $archivePath
$archiveHash = (Get-FileHash -LiteralPath $archivePath -Algorithm SHA256).Hash.ToLowerInvariant()
$checksumPath = Join-Path $outputRoot ($packageName + '.sha256')
('{0}  {1}' -f $archiveHash, [IO.Path]::GetFileName($archivePath)) | Set-Content -LiteralPath $checksumPath -Encoding ascii
Write-Output "PACKAGE=$archivePath"
Write-Output "CHECKSUM=$checksumPath"
Write-Output "SHA256=$archiveHash"
