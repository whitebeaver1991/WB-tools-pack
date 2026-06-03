$ErrorActionPreference = "Stop"
$sdk = "E:\May2023_AfterEffectsSDK_Win\AfterEffectsSDK"
$root = "C:\AE_FX_Panel\AE_FX_Manager (1)\AE_FX_Manager\WB_EffectDumper_v2"
$tmp = "$env:TEMP\wbed_pipl_v8"

# Find VS2022+ vcvarsall
$vcvars = "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvarsall.bat"
if (-not (Test-Path $vcvars)) {
    $vcvars = "C:\Program Files\Microsoft Visual Studio\17\Community\VC\Auxiliary\Build\vcvarsall.bat"
}

Write-Host "Using vcvars: $vcvars"

# Set VS env
cmd /c "`"$vcvars`" x64 2>NUL && set" | ForEach-Object {
    if ($_ -match '^(\w+)=(.*)') {
        Set-Item -Path "env:$($matches[1])" -Value $matches[2]
    }
}

# Test cl
cl.exe 2>&1 | Select-Object -First 1

Write-Host "=== Step 1: .r -> .rr ==="
New-Item -ItemType Directory -Path $tmp -Force | Out-Null
$clResult = cl.exe /I "$sdk\Examples\Headers" /DAE_OS_WIN /DAE_PROC_INTELx64 /EP "$root\WB_EffectDumper_PiPL.r" 2>&1
$clResult | Out-File "$tmp\WB_EffectDumper_PiPL.rr" -Encoding ascii
$rrContent = Get-Content "$tmp\WB_EffectDumper_PiPL.rr" -Raw
Write-Host "rr length: $($rrContent.Length)"
if ($rrContent.Length -lt 100) {
    Write-Host "ERROR: rr too small!"
    Write-Host $rrContent.Substring(0, [Math]::Min(200, $rrContent.Length))
    # Try without AEConfig.h override
    Write-Host "=== Retry: .r -> .rr (alternative) ==="
    cl.exe /I "$sdk\Examples\Headers" /DAE_OS_WIN=1 /DAE_PROC_INTELx64=1 /EP "$root\WB_EffectDumper_PiPL.r" 2>&1 | Out-File "$tmp\WB_EffectDumper_PiPL.rr" -Encoding ascii
    $rrContent = Get-Content "$tmp\WB_EffectDumper_PiPL.rr" -Raw
    Write-Host "retry rr length: $($rrContent.Length)"
}

if ($rrContent.Length -lt 100) {
    Write-Host "=== Retry 2: .r -> .rr (without AEConfig.h) ==="
    # Create a simplified .r file that doesn't include AEConfig.h
    @"
resource 'PiPL' (16000) {
    Kind { AEGP },
    Name { "WB_EffectDumper" },
    Category { "General Plugin" },
    Version { 196609 },
    CodeWin64X86 {"EntryPointFunc"},
};
"@ | Out-File "$tmp\simple_pipl.r" -Encoding ascii
    cl.exe /I "$sdk\Examples\Headers" /DAE_OS_WIN /DAE_PROC_INTELx64 /EP "$tmp\simple_pipl.r" 2>&1 | Out-File "$tmp\WB_EffectDumper_PiPL.rr" -Encoding ascii
    $rrContent = Get-Content "$tmp\WB_EffectDumper_PiPL.rr" -Raw
    Write-Host "retry2 rr length: $($rrContent.Length)"
}

if ($rrContent.Length -lt 100) {
    Write-Host "=== ALL PiPL attempts failed ==="
    Write-Host "Trying to build directly from existing .rc..."
}

Write-Host "=== Step 2: PiPLTool .rr -> .rrc ==="
& "$sdk\Examples\Resources\PiPLtool.exe" "$tmp\WB_EffectDumper_PiPL.rr" "$tmp\WB_EffectDumper_PiPL.rrc" 2>&1
if (Test-Path "$tmp\WB_EffectDumper_PiPL.rrc") {
    $rrcSize = (Get-Item "$tmp\WB_EffectDumper_PiPL.rrc").Length
    Write-Host "rrc size: $rrcSize"
} else { Write-Host "rrc NOT created"; exit 1 }

Write-Host "=== Step 3: .rrc -> .rc ==="
cl.exe /D MSWindows /EP "$tmp\WB_EffectDumper_PiPL.rrc" 2>&1 | Out-File "$root\Win\WB_EffectDumper_PiPL.rc" -Encoding ascii
$rcSize = (Get-Item "$root\Win\WB_EffectDumper_PiPL.rc").Length
Write-Host "rc size: $rcSize"

Write-Host "=== Step 4: MSBuild ==="
$msb = "C:\Program Files\Microsoft Visual Studio\18\Community\MSBuild\Current\Bin\MSBuild.exe"
& $msb "$root\Win\WB_EffectDumper.vcxproj" /p:Configuration=Release /p:Platform=x64 /t:Build /v:q 2>&1 | Select-String -Pattern "error|Error|succeeded|failed|BUILD|aex|LNK|warning C"

$aex = Get-Item "$root\BuildOutput\AEGP\WB_EffectDumper.aex"
Write-Host "=== DONE ==="
Write-Host "AEX size: $($aex.Length), time: $($aex.LastWriteTime)"
