$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot  = Resolve-Path (Join-Path $scriptDir '..')
Set-Location $repoRoot

function Resolve-FirstExistingPath([string[]]$candidates) {
    foreach ($candidate in $candidates) {
        if ($candidate -and (Test-Path $candidate)) { return $candidate }
    }
    return $null
}

if (-not $env:JAVA_HOME) {
    $env:JAVA_HOME = Resolve-FirstExistingPath @(
        'C:\Android\Android_Studio\jbr',
        'D:\Android\Android_Studio\jbr',
        (Join-Path $env:LOCALAPPDATA 'Programs\Android Studio\jbr')
    )
}
if (-not $env:ANDROID_HOME) {
    $env:ANDROID_HOME = Resolve-FirstExistingPath @(
        'C:\Android\Sdk',
        'D:\Android\Sdk',
        (Join-Path $env:LOCALAPPDATA 'Android\Sdk')
    )
}
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\build-tools\36.0.0;" + $env:Path
Set-Location (Join-Path $repoRoot 'android')
$output = .\gradlew.bat :app:assembleDebug 2>&1
$tail = $output | Select-Object -Last 80
$tail | ForEach-Object { Write-Host $_ }
