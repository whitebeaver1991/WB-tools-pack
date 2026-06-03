$ErrorActionPreference = "Stop"
$sdk = "E:\May2023_AfterEffectsSDK_Win\AfterEffectsSDK"
$root = "C:\AE_FX_Panel\AE_FX_Manager (1)\AE_FX_Manager\WB_EffectDumper_v2"
$tmp = "$env:TEMP\wbed_pipl_v5"

Write-Host "=== Step 1: PiPL .r -> .rr ==="
New-Item -ItemType Directory -Path $tmp -Force | Out-Null

# Use VS dev prompt environment
Push-Location "$root\Win"
& "C:\Program Files\Microsoft Visual Studio\18\Community\Common7\Tools\Launch-VsDevShell.ps1" -Arch amd64 -HostArch amd64 2>$null

cl.exe /I "$sdk\Examples\Headers" /DAE_OS_WIN /DAE_PROC_INTELx64 /EP "$root\WB_EffectDumper_PiPL.r" > "$tmp\WB_EffectDumper_PiPL.rr" 2>NUL
Write-Host "rr size: $(if(Test-Path $tmp\WB_EffectDumper_PiPL.rr){(Get-Item $tmp\WB_EffectDumper_PiPL.rr).Length}else{'0'})"

Write-Host "=== Step 2: PiPLTool .rr -> .rrc ==="
& "$sdk\Examples\Resources\PiPLtool.exe" "$tmp\WB_EffectDumper_PiPL.rr" "$tmp\WB_EffectDumper_PiPL.rrc"
Write-Host "rrc size: $(if(Test-Path $tmp\WB_EffectDumper_PiPL.rrc){(Get-Item $tmp\WB_EffectDumper_PiPL.rrc).Length}else{'0'})"

Write-Host "=== Step 3: .rrc -> .rc ==="
cl.exe /D MSWindows /EP "$tmp\WB_EffectDumper_PiPL.rrc" > "$root\Win\WB_EffectDumper_PiPL.rc" 2>NUL
Write-Host "rc size: $(if(Test-Path $root\Win\WB_EffectDumper_PiPL.rc){(Get-Item $root\Win\WB_EffectDumper_PiPL.rc).Length}else{'0'})"

Write-Host "=== Step 4: Build ==="
& "C:\Program Files\Microsoft Visual Studio\18\Community\MSBuild\Current\Bin\MSBuild.exe" "$root\Win\WB_EffectDumper.vcxproj" /p:Configuration=Release /p:Platform=x64 /t:Build /v:q 2>&1 | Select-String -Pattern "error|Error|succeeded|failed|BUILD|aex|LNK|warning C"

Write-Host "=== Done ==="
Pop-Location
