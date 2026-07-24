# Release Workflow

One-shot process for shipping a new build of the Finance-Manager app to
existing users. Covers data migration, web bundle, and Android release APK.

## TL;DR

```powershell
# 1. set env (each new shell)
$env:JAVA_HOME = 'D:\Android\Android_Studio\jbr'
$env:ANDROID_HOME = 'D:\Android\Sdk'
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\build-tools\36.0.0;" + $env:Path

# 2. bump version (BEFORE building — see "Versioning" below)
#    edit app.config.ts:  version: '1.1.0'
#    edit android/app/build.gradle:  versionCode 2, versionName "1.1.0"

# 3. add data migrations if the schema/defaults changed
#    edit services/database/initialize.ts MIGRATIONS array
#    ALWAYS write the new version to be idempotent (skip if exists by name)
#    bump CURRENT_SCHEMA_VERSION

# 4. build everything in one shot
powershell -ExecutionPolicy Bypass -File scripts\build-release.ps1

# 5. install + smoke-test
adb install -r android\app\build\outputs\apk\release\app-release.apk
adb logcat -c
adb logcat -s ReactNativeJS:V ReactNative:E AndroidRuntime:E
adb shell monkey -p com.anonymous.financemanager -c android.intent.category.LAUNCHER 1
```

## Data migration rules (the part that bit us)

This app ships defaults (categories, accounts) via two paths, and **both
must be idempotent** so we never duplicate rows on update:

1. **Fresh install / `resetDatabase` path** — `initializeDefaultData()` in
   `services/database/initialize.ts`. Runs after tables are created and
   the schema-version check passes. Use name-based skip:
   `DEFAULT_CATEGORIES.filter(c => !existingNames.has(c.name))`.

2. **Upgrade path** — the `MIGRATIONS` array. For v5 (the categories
   backfill), each `INSERT` checks the existing name set first and
   skips. Same pattern, same goal: never insert a duplicate.

After any change to `DEFAULT_CATEGORIES` (or any other default row), add
a new entry to `MIGRATIONS` that uses the name-based skip. Bump
`CURRENT_SCHEMA_VERSION`. Existing installs run it once on first launch
of the new APK.

## Versioning

- `app.config.ts` → `version` (semver, e.g. `1.1.0`)
- `android/app/build.gradle` → `versionCode` (monotonically increasing
  int, e.g. `2`) and `versionName` (must match `app.config.ts`)
- versionCode must always go up — Android blocks downgrades. versionName
  is cosmetic.

## What `build-release.ps1` does

1. Re-exports the Expo web bundle → `dist/`. This is what the browser
   sees in **Web 模式**. Without this re-export, the browser side runs a
   stale bundle.
2. Wipes `android\app\src\main\assets\web` and copies the fresh `dist/`
   into it. This is the path `merge{Flavor}Assets` reads from, so the
   APK gets the fresh bundle. (Earlier this step was a gradle task with
   a `doLast` — but `doLast` runs AFTER `mergeReleaseAssets`, so the
   APK shipped a one-build-stale bundle. That manifested as
   `192.168.x.x:8080/` returning 404 on the very first install after a
   `dist/` change. Moving the copy into the build script fixes it.)
3. Runs `.\gradlew.bat :app:assembleRelease`. Produces a signed APK at
   `android\app\build\outputs\apk\release\app-release.apk`.
4. Prints path + size.

The release APK is signed with the **debug keystore** (see
`android\app\build.gradle` lines 137-145). Fine for internal
distribution and OTA updates, but **not** for the Play Store — generate
a real keystore and wire it in before public release.

## Build times

| Stage | First build | Incremental |
|-------|-------------|-------------|
| Web export (`npx expo export --platform web`) | ~15s | ~15s |
| Gradle `assembleRelease` (cold cache) | ~3 min | n/a |
| Gradle `assembleRelease` (warm cache) | n/a | ~1-2 min |

The cold-cache cost is C++ compilation of the native modules (Hermes,
Reanimated, SQLite, SVG, gesture-handler, screens, etc.) for 4 ABIs. To
halve that, restrict ABIs to `arm64-v8a` only in
`android/app/build.gradle` `defaultConfig.ndk.abiFilters` — covers ~95%
of modern phones. TBD whether you want to do that.

## Web-only iteration (without a full APK rebuild)

When you're just iterating on the browser side and the phone side is
fine, skip the gradle build:

```powershell
Remove-Item dist -Recurse -Force
npx expo export --platform web
Remove-Item android\app\src\main\assets\web -Recurse -Force
Copy-Item dist android\app\src\main\assets\web -Recurse -Force
```

The phone's native JS comes from Metro at dev time, so phone-side
changes don't need a re-export — only browser-side changes do.

## Common foot-guns

- `Cannot find native module 'ExpoSQLite'` in browser → web bundle
  leaked `expo-sqlite`. Check `metro.config.js` alias, make sure no
  shared file does a top-level `import` of it.
- Browser shows old UI → `android\app\src\main\assets\web` is stale.
  Re-export + re-copy.
- Phone says categories are still the old 6 → migration didn't run.
  Check `schema_version` table — if it's at 5 already, the v5 migration
  was a no-op for the data. If it's < 5, you forgot to bump
  `CURRENT_SCHEMA_VERSION`.
- `adb: no devices/emulators found` → USB cable, USB debugging on
  phone, try `adb kill-server` then `adb start-server`.
- `ninja: error: mkdir(...): No such file or directory` during C++ build
  → project path too long. Move to a shorter root (we're at
  `D:\01proj\Finance-Management-App` which is fine).
- `no member named 'StyleSizeLength' in namespace 'facebook::yoga'` →
  `react-native-svg` too new for RN 0.76. Pin to `15.8.0` exactly.
