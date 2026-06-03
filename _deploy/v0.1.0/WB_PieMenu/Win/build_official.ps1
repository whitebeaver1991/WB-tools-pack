$SDK = "E:\May2023_AfterEffectsSDK_Win\AfterEffectsSDK"
$ProjectDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$WinDir = Join-Path $ProjectDir "Win"
$AePluginDir = "C:\AE_FX_Panel\AE_FX_Manager (1)\AE_FX_Manager\WB_PieMenu_Official\BuildOutput"

if (-not (Test-Path $AePluginDir)) {
    New-Item -ItemType Directory -Path $AePluginDir -Force | Out-Null
}

Write-Host "=== Step 1: Generate PiPL.rc ==="
Push-Location $WinDir
& "$WinDir\gen_pipl.cmd"
if ($LASTEXITCODE -ne 0) {
    Write-Host "PiPL generation failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

Write-Host "=== Step 2: Build with MSBuild ==="
$env:AE_PLUGIN_BUILD_DIR = $AePluginDir
$slnPath = Join-Path $WinDir "WB_PieMenu.sln"

& "C:\Program Files\Microsoft Visual Studio\2022\Professional\MSBuild\Current\Bin\MSBuild.exe" $slnPath /p:Configuration=Release /p:Platform=x64 /t:Rebuild

if ($LASTEXITCODE -eq 0) {
    Write-Host "=== Build SUCCESS ===" -ForegroundColor Green
    $outputDir = Join-Path $AePluginDir "AEGP"
    if (Test-Path $outputDir) {
        Write-Host "Output files:" -ForegroundColor Cyan
        Get-ChildItem $outputDir | Format-Table Name, Length
    }
} else {
    Write-Host "=== Build FAILED ===" -ForegroundColor Red
}
