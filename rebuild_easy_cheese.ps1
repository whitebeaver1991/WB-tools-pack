# Quick rebuild of Easy_Cheese using MSBuild inside VS dev env
$sdkRoot = "E:\May2023_AfterEffectsSDK_Win\AfterEffectsSDK"
$destDir = "C:\AE_FX_Panel\AE_FX_Manager (1)\AE_FX_Manager\easy_cheese"
$vcxproj = "$destDir\Win\Easy_Cheese.vcxproj"

Write-Host "=== Fix vcxproj paths ==="
$content = Get-Content $vcxproj -Raw
# PlatformToolset
$content = $content -replace 'v142', 'v145'
# Remove VC98 ref
$content = $content -replace '<ClInclude Include=".*\\VC98\\Include\\.*" />', ''
# Fix relative paths
$content = $content -replace '\.\.\\\.\.\\\.\.\\', "$sdkRoot\"
# Disable PiPL CustomBuild
$content = $content -replace '(?s)<CustomBuild Include="..\\Easy_Cheese_PiPL\.r">.*?</CustomBuild>', '<!-- PiPL CustomBuild disabled -->'
Set-Content $vcxproj -Value $content

Write-Host "=== Check PiPL .rc exists ==="
$piplRC = "$destDir\Win\Easy_Cheese_PiPL.rc"
if (-not (Test-Path $piplRC)) {
    Write-Host "  .rc not found, rebuilding PiPL..."
    # PiPL build requires VS env, will be done inside the inner script
}

# Inner build script
$inner = @"
`$ErrorActionPreference = 'Continue'
`$destDir = "$destDir"
`$vcxproj = "$vcxproj"
`$sdkRoot = "$sdkRoot"

# Only rebuild PiPL if .rc doesn't exist
`$piplRC = "$destDir\Win\Easy_Cheese_PiPL.rc"
if (-not (Test-Path "`$piplRC")) {
    Write-Host "  Building PiPL..."
    `$piplR = "$destDir\Easy_Cheese_PiPL.r"
    `$intDir = "$destDir\Win\x64\Release\"
    New-Item -ItemType Directory -Path "`$intDir" -Force | Out-Null
    `$piplRR = "`$intDir\Easy_Cheese_PiPL.rr"
    `$piplRRC = "`$intDir\Easy_Cheese_PiPL.rrc"
    `$piplTool = "`$sdkRoot\Examples\Resources\PiPLTool.exe"
    
    cl /I "`$sdkRoot\Headers" /EP "`$piplR" > "`$piplRR" 2>&1
    & "`$piplTool" "`$piplRR" "`$piplRRC" 2>&1
    cl /D "MSWindows" /EP "`$piplRRC" > "`$piplRC" 2>&1
    Write-Host "  PiPL done"
}

Write-Host "=== MSBuild Release|x64 ==="
`$env:AE_PLUGIN_BUILD_DIR = "$destDir\Win"
`$msbuild = "C:\Program Files\Microsoft Visual Studio\18\Community\MSBuild\Current\Bin\MSBuild.exe"
& `$msbuild "`$vcxproj" /p:Configuration=Release /p:Platform=x64 /p:PlatformToolset=v145 /t:Clean,Build /v:n /nologo 2>&1
if (`$LASTEXITCODE -eq 0) {
    Write-Host "=== BUILD SUCCESS! ==="
    Get-ChildItem "`$destDir" -Recurse -Filter "Easy_Cheese.aex" | Select-Object FullName, Length
} else {
    Write-Host "=== BUILD FAILED: `$LASTEXITCODE ==="
}
"@

$innerPath = "$env:TEMP\_rebuild_inner.ps1"
$inner | Out-File -FilePath $innerPath -Encoding ascii -Force

Write-Host "=== Building in VS2026 dev environment ==="
$vsShell = "C:\Program Files\Microsoft Visual Studio\18\Community\Common7\Tools\Launch-VsDevShell.ps1"
powershell -NoProfile -ExecutionPolicy Bypass -Command ". '$vsShell'; & '$innerPath'"
