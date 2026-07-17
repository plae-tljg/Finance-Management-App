# Debug Workflow

Everything you need to develop, install, and troubleshoot the app on a connected Android device.

## One-time setup

### Windows env vars (set every shell session)

```powershell
$env:JAVA_HOME = 'D:\Android\Android_Studio\jbr'
$env:ANDROID_HOME = 'D:\Android\Sdk'
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\build-tools\36.0.0;$env:ANDROID_HOME\cmdline-tools\latest\bin;" + $env:Path
```

Notes:
- The JDK is the **bundled JBR** that comes with Android Studio (`D:\Android\Android_Studio\jbr`) — not a separate JDK install. It is Java 21.
- The Android SDK is at `D:\Android\Sdk`. Adjust if you move Android Studio.
- PowerShell's execution policy blocks `npm.ps1`. Always use the `.cmd` shim:
  ```powershell
  & 'C:\Program Files\nodejs\npm.cmd' install
  ```

### Project location

Keep the project at a **short path** — Windows has a 250-char limit on object file paths that CMake hits during native builds. Anything under `C:\Users\<name>\Documents\01proj\...` (≈60 chars deep) is too long and will fail at `react-native-reanimated` C++ build with `ninja: error: mkdir(...): No such file or directory`. Recommended: `D:\01proj\Finance-Management-App` (28 chars).

If you ever hit this, just `Move-Item` the project; then **wipe stale caches** before rebuilding:
```powershell
mavis-trash android\.gradle android\app\.gradle android\app\build android\build android\app\src\main\assets\web
mavis-trash node_modules\react-native-reanimated\android\.cxx
mavis-trash node_modules\react-native-svg\android\.cxx
mavis-trash node_modules\react-native-screens\android\.cxx
mavis-trash node_modules\react-native-gesture-handler\android\.cxx
mavis-trash node_modules\react-native-safe-area-context\android\.cxx
```
These get regenerated; the wipe just drops paths baked in from the old location.

## Day-to-day: `npm run android`

The whole dev cycle is one command when the phone is connected via USB:

```powershell
npm run android
```

That runs `expo run:android`, which:
1. Sees your phone on `adb devices` (look for `d127a8...` style id)
2. Builds the debug APK via gradle (incremental — only re-runs what changed)
3. Installs the APK on the phone
4. Starts Metro bundler
5. Launches the app
6. Streams `ReactNativeJS` logs to your terminal

In the terminal: `r` reload, `r r` force-reload, `Ctrl+C` to quit.

On the phone: shake to open the dev menu → "Open JS Debugger" / "Open Network Inspector" / "Toggle Performance Monitor".

## Logcat filters (in a second terminal)

| Goal | Command |
|------|---------|
| All RN JS console | `adb logcat -s ReactNativeJS:V ReactNative:E AndroidRuntime:E` |
| Native HTTP server (Web 模式) | `adb logcat -s FMHttpServer:V ReactNativeJS:V` |
| Web server DB layer | `adb logcat -s FMWebDb:V FMHttpServer:V` |
| Only errors | `adb logcat *:E` |

`-s` is "filter by tag" (silent everything else). `*:S` silences everything; you can chain like `*:S FMHttpServer:V ReactNativeJS:V`.

## Build commands (manual)

| Command | When |
|---------|------|
| `npm run build` | TypeScript only (`tsc --project tsconfig.json`) |
| `npm run android` | Build + install + launch on connected device |
| `npm run start` | Just start Metro (assumes APK already installed) |
| `npm run web` | Start Metro for browser only |
| `cd android; .\gradlew.bat :app:assembleDebug` | Build APK without installing |
| `cd android; .\gradlew.bat :app:assembleRelease` | Release APK (signed with debug key in this repo) |
| `cd android; .\gradlew.bat clean` | Nuke build cache (slow, only when truly broken) |
| `bash scripts/build-web.sh` | (Linux/Mac) Rebuild web bundle and copy into APK assets |
| `npx expo export --platform web` | Manual web export (creates `dist/`) |

## When do I need to rebuild the web bundle?

The APK ships the Expo Web bundle inside `android/app/src/main/assets/web/`. The
native HTTP server in the app serves this bundle to browsers in **Web モード**.

Gradle **will not re-export the web bundle** when you change JS/TSX — `npx expo
export` is a Metro feature, not a gradle task. If you only run `gradlew
assembleDebug` after editing components, the new code is in the APK's native
JS bundle (so the phone app picks it up via Metro reload) but **the embedded
web bundle is stale** — the browser version of the app will be a snapshot of
whatever was last exported.

Rebuild the web bundle before producing a fresh APK whenever the browser side
needs the new code:

```bash
# Easiest (Linux/Mac/git-bash)
bash scripts/build-web.sh

# Windows PowerShell equivalent
Remove-Item dist -Recurse -Force
npx expo export --platform web
Remove-Item android\app\src\main\assets\web -Recurse -Force
Copy-Item dist android\app\src\main\assets\web -Recurse -Force
```

Then `npm run android` (or `gradlew assembleDebug`) to bake the new bundle into
the APK. The phone's native JS will always be live; only the Web モード browser
needs the re-export.

## Web 模式 (LAN access) end-to-end test

1. App on phone: Settings → **Web 模式** → flip the switch
2. Phone shows: URL (e.g. `http://192.168.x.x:8080/?token=1234`), QR code, active connection count
3. PC browser: open that URL (or scan QR). Same Wi-Fi required.
4. Browser fetches data, edits, etc. — changes go through REST → phone's SQLite → both sides see updates
5. If you toggle the switch off, the server stops. Browser shows 401s / network errors.
6. If the app backgrounds for >5 min, server auto-stops; foregrounding restarts it (see `useWebServerLifecycle`).

### Web mode gotchas
- **URL is one-shot**: each toggle generates a fresh PIN. Bookmark → 401 next time.
- **401 Unauthorized** on `/api/*` means the bundle is calling without the `?token=` query param (or the bundle is stale — Ctrl+Shift+R).
- **Blank page with `Cannot find native module 'ExpoSQLite'`** means the web bundle was built without the metro alias — see "Web bundle must not include expo-sqlite" below.

## What NOT to forget (frequent foot-guns)

### Web bundle must not include `expo-sqlite`
The web bundle runs in a browser — no native module bridge. If `expo-sqlite` gets pulled in, it tries `requireNativeModule('ExpoSQLite')` and crashes the page.

Three rules to keep it out:
1. **No top-level `import ... from 'expo-sqlite'`** in any file that gets bundled for web. Use `import type` for type-only imports.
2. **No `require('expo-sqlite')` in shared files.** Put native init in a `*.native.ts(x)` file; web init in a `*.web.ts(x)` file; let Metro's platform resolver pick the right one.
3. **Metro alias** in `metro.config.js` substitutes `expo-sqlite` → `web/expo-sqlite.web.stub.js` on web builds, so any leaked require still resolves to a no-op.

### Stale web bundle in the APK
`gradlew assembleDebug` reuses the `assets/web/` from previous builds when it's UP-TO-DATE. After re-running `npx expo export --platform web`, force-sync:
```powershell
Remove-Item android\app\src\main\assets\web -Recurse -Force
Copy-Item dist android\app\src\main\assets\web -Recurse -Force
```
Or just delete `android\app\src\main\assets\web` and let the build repopulate it.

### `expo-sqlite` / RN version drift
The bundled `react-native-svg` version must match your RN version. As of writing:
- RN 0.76.x → use `react-native-svg` `15.8.0` exactly (pinned, no `^`)
- Newer svg versions (15.15+) use a Yoga API (`StyleSizeLength`) that doesn't exist in RN 0.76's Yoga and will fail to compile

If you ever upgrade RN, also pin svg to a version released at the same time.

## Quick troubleshooting

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| `tsc` not found | `node_modules` not installed | `npm install` |
| `JAVA_HOME` / `JAVA not found` | Env var not set in this shell | Re-export `JAVA_HOME` |
| `SDK location not found` | `ANDROID_HOME` not set | Re-export `ANDROID_HOME` |
| `ninja: error: mkdir(...): No such file or directory` during C++ build | Project path too long (250 char limit) | Move project to a short path, wipe `.cxx` |
| `no member named 'StyleSizeLength' in namespace 'facebook::yoga'` | `react-native-svg` too new for RN | Pin to RN-matched version |
| `Cannot find native module 'ExpoSQLite'` in web mode | Web bundle leaked `expo-sqlite` | Check metro alias, platform-specific files |
| 401 on all `/api/*` in browser | Browser URL missing `?token=` | Re-open URL from phone (it has the token) |
| Hot reload not picking up changes | Metro cached old bundle | Press `r` in Metro, or shake phone → Reload |
| `adb: no devices/emulators found` | USB cable data lines, or no USB debugging | Try different cable, enable Developer options + USB debugging on phone |
