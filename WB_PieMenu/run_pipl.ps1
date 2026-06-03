# Load VS 2026 x64 environment
$VCVARS = "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvarsall.bat"
cmd /c "`"$VCVARS`" x64 > nul 2>&1 && set" | ForEach-Object {
    if ($_ -match "^(.*?)=(.*)$") {
        Set-Item -Path "env:$($matches[1])" -Value $matches[2]
    }
}

$Project = "C:\AE_FX_Panel\AE_FX_Manager (1)\AE_FX_Manager\WB_PieMenu"
$tmpDir = "C:\Temp\PiPL_Work"
New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null
$headers = "E:\AfterEffectsSDK_25.2_20_win\ae25.2_20.64bit.AfterEffectsSDK\AfterEffectsSDK\Examples\Headers"
$rrTmp = "$tmpDir\WB_PieMenu_PiPL.rr"
$rrcTmp = "$tmpDir\WB_PieMenu_PiPL.rrc"
$temp_rc = "$Project\WB_PieMenu_PiPL_temp.rc"

Write-Host "=== Step 1: Preprocess .r file ==="
$out = cl /I $headers /EP "$Project\WB_PieMenu_PiPL.r" 2>&1
$clean = @()
foreach ($line in $out) { if ($line -notmatch 'Microsoft|Copyright|WB_PieMenu_PiPL\.r') { $clean += $line } }
$clean | Out-File -FilePath $rrTmp -Encoding ASCII -Force
Write-Host "  OK -> $rrTmp"

Write-Host "=== Step 2: PiPLTool conversion ==="
$piplTool = "E:\AfterEffectsSDK_25.2_20_win\ae25.2_20.64bit.AfterEffectsSDK\AfterEffectsSDK\Examples\Resources\PiPLtool.exe"
& $piplTool $rrTmp $rrcTmp 2>&1
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED" -ForegroundColor Red; exit 1 }
Write-Host "  OK -> $rrcTmp"

Write-Host "=== Step 3: Preprocess .rrc to final .rc ==="
$out2 = cl /D "MSWindows" /EP $rrcTmp 2>&1
$clean2 = @()
foreach ($line in $out2) { if ($line -notmatch 'Microsoft|Copyright') { $clean2 += $line } }
$clean2 | Out-File -FilePath $temp_rc -Encoding ASCII -Force
Write-Host "  OK -> $temp_rc"

Get-ChildItem $temp_rc | Select-Object Length, Name
Write-Host "=== DONE ===" -ForegroundColor Green
