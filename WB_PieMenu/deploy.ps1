param(
    [string]$AEVersion = "2025"
)

$SourceFile = "C:\AE_FX_Panel\AE_FX_Manager (1)\AE_FX_Manager\WB_PieMenu\build\Release\WB_PieMenu.aex"

$TargetDir = "C:\Program Files\Adobe\Adobe After Effects $AEVersion\Support Files\Plug-ins"
$TargetFile = "$TargetDir\WB_PieMenu.aex"

if (!(Test-Path $SourceFile)) {
    Write-Host "ERROR: $SourceFile not found. Run build_x64.ps1 first." -ForegroundColor Red
    exit 1
}

if (!(Test-Path $TargetDir)) {
    Write-Host "ERROR: AE $AEVersion not found at $TargetDir" -ForegroundColor Red
    exit 1
}

Copy-Item -Path $SourceFile -Destination $TargetFile -Force
Write-Host "Deployed WB_PieMenu.aex to AE $AEVersion Plug-ins" -ForegroundColor Green

# Also create Temp directory for debug.txt
$TempDir = "C:\Temp"
if (!(Test-Path $TempDir)) {
    New-Item -Type Directory -Path $TempDir -Force | Out-Null
    Write-Host "Created $TempDir for debug logs" -ForegroundColor Yellow
}

Write-Host "`nDone! Restart After Effects to load the plugin." -ForegroundColor Green
