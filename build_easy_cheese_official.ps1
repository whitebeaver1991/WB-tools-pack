# Build Easy_Cheese using official VS project
$sdkRoot = "E:\May2023_AfterEffectsSDK_Win\AfterEffectsSDK"
$srcDir = "$sdkRoot\Examples\AEGP\Easy_Cheese"
$destDir = "C:\AE_FX_Panel\AE_FX_Manager (1)\AE_FX_Manager\easy_cheese"
$vcxproj = "$destDir\Win\Easy_Cheese.vcxproj"

Write-Host "=== Step 1: Clean and recreate $destDir ==="
if (Test-Path $destDir) { Remove-Item $destDir -Recurse -Force }
New-Item -ItemType Directory -Path $destDir -Force | Out-Null

Write-Host "=== Step 2: Copy Easy_Cheese SDK example ==="
Copy-Item "$srcDir\*" $destDir -Recurse -Force

Write-Host "=== Step 3: Fix vcxproj ==="
$content = Get-Content $vcxproj -Raw
# PlatformToolset: v142 -> v145
$content = $content -replace 'v142', 'v145'
# Remove broken VC98 ref
$content = $content -replace '<ClInclude Include=".*\\VC98\\Include\\.*" />', ''
# Fix relative paths: ..\..\..\ -> absolute SDK root  
$content = $content -replace '\.\.\\\.\.\\\.\.\\', "$sdkRoot\"
# Disable PiPL CustomBuild (we do it in Step 4), but keep .rc ResourceCompile
$content = $content -replace '(?s)<CustomBuild Include="..\\Easy_Cheese_PiPL\.r">.*?</CustomBuild>', '<!-- PiPL CustomBuild disabled -->'
Set-Content $vcxproj -Value $content

# Write inner build script — use short paths to avoid PiPLTool space issue
$innerScript = @"
`$ErrorActionPreference = 'Continue'
`$sdkRoot = "$sdkRoot"
`$destDir = (New-Object -ComObject Scripting.FileSystemObject).GetFolder("$destDir").ShortPath
`$vcxproj = "`$destDir\Win\Easy_Cheese.vcxproj"
`$env:AE_PLUGIN_BUILD_DIR = "`$destDir\Win"
`$piplR = "`$destDir\Easy_Cheese_PiPL.r"
`$intDir = "`$destDir\Win\x64\Release\"
`$piplRR = "`$intDir\Easy_Cheese_PiPL.rr"
`$piplRRC = "`$intDir\Easy_Cheese_PiPL.rrc"
`$piplRC = "`$destDir\Win\Easy_Cheese_PiPL.rc"
`$piplTool = (New-Object -ComObject Scripting.FileSystemObject).GetFile("$sdkRoot\Examples\Resources\PiPLTool.exe").ShortPath
New-Item -ItemType Directory -Path "`$intDir" -Force | Out-Null

Write-Host "Using short path: `$destDir"

Write-Host "  Step 4a: .r -> .rr"
cl /I "`$sdkRoot\Headers" /EP "`$piplR" > "`$piplRR" 2>&1
Write-Host "  cl exit code: `$LASTEXITCODE"
if (Test-Path "`$piplRR") { Write-Host "  .rr OK - `$((Get-Item "`$piplRR").Length) bytes" }
else { throw "FAILED 4a - no .rr output" }

Write-Host "  Step 4b: PiPLTool .rr -> .rrc"
& "`$piplTool" "`$piplRR" "`$piplRRC" 2>&1
Write-Host "  PiPLTool exit code: `$LASTEXITCODE"
if (Test-Path "`$piplRRC") { Write-Host "  .rrc OK - `$((Get-Item "`$piplRRC").Length) bytes" }
else { throw "FAILED 4b - no .rrc output" }

Write-Host "  Step 4c: .rrc -> .rc"
cl /D "MSWindows" /EP "`$piplRRC" > "`$piplRC" 2>&1
Write-Host "  cl exit code: `$LASTEXITCODE"
if (Test-Path "`$piplRC") { Write-Host "  .rc OK - `$((Get-Item "`$piplRC").Length) bytes" }
else { throw "FAILED 4c - no .rc output" }

Write-Host "=== Step 5: MSBuild Release|x64 ==="
`$msbuild = "C:\Program Files\Microsoft Visual Studio\18\Community\MSBuild\Current\Bin\MSBuild.exe"
& `$msbuild "`$vcxproj" /p:Configuration=Release /p:Platform=x64 /p:PlatformToolset=v145 /t:Clean,Build /v:n /nologo 2>&1
if (`$LASTEXITCODE -eq 0) {
    Write-Host "=== BUILD SUCCESS! ==="
    Get-ChildItem "`$destDir" -Recurse -Filter "Easy_Cheese.aex" | Select-Object FullName, Length
} else {
    Write-Host "=== BUILD FAILED: `$LASTEXITCODE ==="
}
"@

$innerPath = "$env:TEMP\_build_inner.ps1"
$innerScript | Out-File -FilePath $innerPath -Encoding ascii -Force

Write-Host "=== Step 4+5: Building in VS2026 dev environment ==="
$vsShell = "C:\Program Files\Microsoft Visual Studio\18\Community\Common7\Tools\Launch-VsDevShell.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -Command ". '$vsShell'; & '$innerPath'"
