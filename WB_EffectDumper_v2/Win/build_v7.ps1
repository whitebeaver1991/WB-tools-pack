$ErrorActionPreference = "Stop"
$sdk = "E:\May2023_AfterEffectsSDK_Win\AfterEffectsSDK"
$root = "C:\AE_FX_Panel\AE_FX_Manager (1)\AE_FX_Manager\WB_EffectDumper_v2"
$tmp = "$env:TEMP\wbed_pipl_v7"

# Step 0: VS env
& "C:\Program Files\Microsoft Visual Studio\18\Community\Common7\Tools\Launch-VsDevShell.ps1" -Arch amd64 -HostArch amd64 2>$null

Write-Host "=== Step 1: .r -> .rr ==="
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
cl.exe /I "$sdk\Examples\Headers" /DAE_OS_WIN /DAE_PROC_INTELx64 /EP "$root\WB_EffectDumper_PiPL.r" > "$tmp\WB_EffectDumper_PiPL.rr" 2>&1
$rr = Get-Content "$tmp\WB_EffectDumper_PiPL.rr" -Raw
Write-Host "rr length: " $rr.Length
if ($rr.Length -lt 100) {
    Write-Host "ERROR: PiPL rr too small! Content:"
    Write-Host $rr
    exit 1
}

Write-Host "=== Step 2: .rr -> .rrc ==="
& "$sdk\Examples\Resources\PiPLtool.exe" "$tmp\WB_EffectDumper_PiPL.rr" "$tmp\WB_EffectDumper_PiPL.rrc" 2>&1
$rrc = Get-Item "$tmp\WB_EffectDumper_PiPL.rrc"
Write-Host "rrc size: $($rrc.Length)"

Write-Host "=== Step 3: .rrc -> .rc ==="
cl.exe /D MSWindows /EP "$tmp\WB_EffectDumper_PiPL.rrc" > "$root\Win\WB_EffectDumper_PiPL.rc" 2>&1
$rc = Get-Item "$root\Win\WB_EffectDumper_PiPL.rc"
Write-Host "rc size: $($rc.Length)"

Write-Host "=== Step 4: Build ==="
& "C:\Program Files\Microsoft Visual Studio\18\Community\MSBuild\Current\Bin\MSBuild.exe" "$root\Win\WB_EffectDumper.vcxproj" /p:Configuration=Release /p:Platform=x64 /t:Build /v:q 2>&1 | Select-String -Pattern "error|Error|succeeded|failed|BUILD|aex|LNK|warning C"

$aex = Get-Item "$root\BuildOutput\AEGP\WB_EffectDumper.aex"
Write-Host "=== DONE ==="
Write-Host "AEX size: $($aex.Length)"
Write-Host "AEX time: $($aex.LastWriteTime)"
