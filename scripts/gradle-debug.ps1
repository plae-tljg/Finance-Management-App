Set-Location 'D:\01proj\Finance-Management-App'
$env:JAVA_HOME = 'D:\Android\Android_Studio\jbr'
$env:ANDROID_HOME = 'D:\Android\Sdk'
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\build-tools\36.0.0;" + $env:Path
Set-Location 'D:\01proj\Finance-Management-App\android'
$output = .\gradlew.bat :app:assembleRelease 2>&1
$tail = $output | Select-Object -Last 80
$tail | ForEach-Object { Write-Host $_ }
