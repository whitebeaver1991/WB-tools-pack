$sdkRoot = "E:\May2023_AfterEffectsSDK_Win\AfterEffectsSDK"
$destDir = "C:\AE_FX_Panel\AE_FX_Manager (1)\AE_FX_Manager\easy_cheese"
$vcxproj = "$destDir\Win\Easy_Cheese.vcxproj"

$innerScript = @"
`$ErrorActionPreference = 'Continue'
`$sdkRoot = "$sdkRoot"
`$destDir = "$destDir"
`$vcxproj = "$destDir\Win\Easy_Cheese.vcxproj"

`$piplR = "`$destDir\Easy_Cheese_PiPL.r"
`$tmpDir = "$env:TEMP\ec_pipl"
New-Item -ItemType Directory -Path "`$tmpDir" -Force | Out-Null
`$piplRR = "`$tmpDir\Easy_Cheese_PiPL.rr"
`$piplRRC = "`$tmpDir\Easy_Cheese_PiPL.rrc"
`$piplRC = "`$destDir\Win\Easy_Cheese_PiPL.rc"
`$piplTool = "`$sdkRoot\Examples\Resources\PiPLtool.exe"

Write-Host "=== Step 1a: .r -> .rr ==="
cl.exe /I "`$sdkRoot\Examples\Headers" /EP "`$piplR" > "`$piplRR" 2>`$null
Write-Host "cl exit: `$LASTEXITCODE"
if ((Test-Path "`$piplRR") -and ((Get-Item "`$piplRR").Length -gt 0)) {
    Write-Host "  .rr OK - `$((Get-Item "`$piplRR").Length) bytes"
} else { throw "FAILED 1a" }

Write-Host "=== Step 1b: PiPLTool .rr -> .rrc ==="
`$fso = New-Object -ComObject Scripting.FileSystemObject
`$shortPiplRR = `$fso.GetFile("`$piplRR").ShortPath
& "`$piplTool" "`$shortPiplRR" "`$piplRRC" 2>`$null
Write-Host "PiPLTool exit: `$LASTEXITCODE"
if ((Test-Path "`$piplRRC") -and ((Get-Item "`$piplRRC").Length -gt 0)) {
    Write-Host "  .rrc OK - `$((Get-Item "`$piplRRC").Length) bytes"
} else { throw "FAILED 1b" }

Write-Host "=== Step 1c: .rrc -> .rc ==="
cl.exe /D MSWindows /EP "`$piplRRC" > "`$piplRC" 2>`$null
Write-Host "cl exit: `$LASTEXITCODE"
if ((Test-Path "`$piplRC") -and ((Get-Item "`$piplRC").Length -gt 0)) {
    Write-Host "  .rc OK - `$((Get-Item "`$piplRC").Length) bytes"
} else { throw "FAILED 1c" }

Write-Host "=== Step 2: MSBuild Release|x64 ==="
`$msbuild = "C:\Program Files\Microsoft Visual Studio\18\Community\MSBuild\Current\Bin\MSBuild.exe"
& `$msbuild "`$vcxproj" /p:Configuration=Release /p:Platform=x64 /p:PlatformToolset=v145 /p:AE_PLUGIN_BUILD_DIR="`$destDir\Win" /t:Clean,Build /v:n /nologo 2>&1
if (`$LASTEXITCODE -eq 0) {
    Write-Host "=== BUILD SUCCESS! ==="
    Get-ChildItem "`$destDir" -Recurse -Filter "Easy_Cheese.aex" | Select-Object FullName, Length
} else {
    Write-Host "=== BUILD FAILED: `$LASTEXITCODE ==="
}
"@

$innerPath = "$env:TEMP\_build_official_inner.ps1"
$innerScript | Out-File -FilePath $innerPath -Encoding ascii -Force

Write-Host "=== Building in VS2026 dev environment ==="
$vsShell = "C:\Program Files\Microsoft Visual Studio\18\Community\Common7\Tools\Launch-VsDevShell.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -Command ". '$vsShell'; & '$innerPath'"
