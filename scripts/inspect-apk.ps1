Add-Type -AssemblyName System.IO.Compression.FileSystem
$apkPath = 'D:\01proj\Finance-Management-App\android\app\build\outputs\apk\release\app-release.apk'
$zip = [System.IO.Compression.ZipFile]::OpenRead($apkPath)
Write-Host "Total entries: $($zip.Entries.Count)"
Write-Host "`nHTML files in assets/web:"
$zip.Entries | Where-Object { $_.FullName -like 'assets/web/*.html' } | ForEach-Object { Write-Host ("  {0,-40} {1,10} bytes" -f $_.FullName, $_.Length) }
Write-Host "`nFirst 5 web JS bundles in assets/web:"
$zip.Entries | Where-Object { $_.FullName -like 'assets/web/_expo/static/js/web/*' } | Select-Object -First 5 | ForEach-Object { Write-Host ("  {0,-80} {1,10} bytes" -f $_.FullName, $_.Length) }
Write-Host "`nFirst 5 anything in assets/web:"
$zip.Entries | Where-Object { $_.FullName -like 'assets/web/*' } | Select-Object -First 5 | ForEach-Object { Write-Host ("  {0,-80} {1,10} bytes" -f $_.FullName, $_.Length) }
$zip.Dispose()
