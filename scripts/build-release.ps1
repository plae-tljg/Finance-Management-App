# build-release.ps1
# One-shot release build for the Finance-Management-App.
#
# What it does:
#   1. Sets JAVA_HOME / ANDROID_HOME for this shell.
#   2. Re-exports the Expo Web bundle (dist/) so the browser side picks up
#      the latest JS. Gradle's copyWebBundle task then copies dist into
#      android/app/src/main/assets/web/ when the APK is assembled.
#   3. Runs `gradlew :app:assembleRelease`.
#   4. Prints the APK path + size so you can grab it.
#
# Usage:
#   pwsh ./scripts/build-release.ps1
#
# Optional env var override (defaults match the docs):
#   $env:JAVA_HOME   = 'D:\Android\Android_Studio\jbr'
#   $env:ANDROID_HOME = 'D:\Android\Sdk'

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

# --- 1. Environment -----------------------------------------------------------
if (-not $env:JAVA_HOME) {
    $env:JAVA_HOME = 'D:\Android\Android_Studio\jbr'
}
if (-not $env:ANDROID_HOME) {
    $env:ANDROID_HOME = 'D:\Android\Sdk'
}
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\build-tools\36.0.0;$env:ANDROID_HOME\cmdline-tools\latest\bin;" + $env:Path

Write-Host "JAVA_HOME   = $env:JAVA_HOME" -ForegroundColor DarkGray
Write-Host "ANDROID_HOME = $env:ANDROID_HOME" -ForegroundColor DarkGray

# --- 2. Locate repo root (this script lives in scripts/) ----------------------
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot  = Resolve-Path (Join-Path $scriptDir '..')
Write-Host "Repo root   = $repoRoot" -ForegroundColor DarkGray

Push-Location $repoRoot
try {
    # --- 3. Re-export the web bundle -----------------------------------------
    Write-Host "`n[1/3] Re-exporting Expo web bundle..." -ForegroundColor Cyan
    if (Test-Path dist) {
        Remove-Item dist -Recurse -Force
    }
    & npx expo export --platform web
    if ($LASTEXITCODE -ne 0) { throw "expo export failed (exit $LASTEXITCODE)" }

    # Copy dist/ straight into android/app/src/main/assets/web/ BEFORE
    # the gradle build. merge{Flavor}Assets reads from this directory,
    # so the APK gets the fresh bundle. (Routing this through a gradle
    # task was making lint-vital-model and friends see stale hashes.)
    $apkWeb = Join-Path $repoRoot 'android\app\src\main\assets\web'
    if (Test-Path $apkWeb) {
        Remove-Item $apkWeb -Recurse -Force
    }
    Copy-Item dist $apkWeb -Recurse -Force
    Write-Host "  -> copied dist/ to $apkWeb" -ForegroundColor DarkGray

    # --- 4. Build release APK ------------------------------------------------
    Write-Host "`n[2/3] Building release APK..." -ForegroundColor Cyan
    Push-Location (Join-Path $repoRoot 'android')
    try {
        & .\gradlew.bat :app:assembleRelease
        if ($LASTEXITCODE -ne 0) { throw "gradle assembleRelease failed (exit $LASTEXITCODE)" }
    } finally {
        Pop-Location
    }

    # --- 5. Report -----------------------------------------------------------
    Write-Host "`n[3/3] Done." -ForegroundColor Green
    $apkPath = Join-Path $repoRoot 'android\app\build\outputs\apk\release\app-release.apk'
    if (Test-Path $apkPath) {
        $size = (Get-Item $apkPath).Length
        $sizeMb = [math]::Round($size / 1MB, 2)
        Write-Host "APK: $apkPath" -ForegroundColor Green
        Write-Host "Size: $sizeMb MB ($size bytes)" -ForegroundColor Green
    } else {
        Write-Warning "Expected APK not found at $apkPath"
    }
} finally {
    Pop-Location
}
