& "C:\Program Files\Microsoft Visual Studio\18\Community\Common7\Tools\Launch-VsDevShell.ps1" -Arch amd64 -HostArch amd64 2>$null
$root = "C:\AE_FX_Panel\AE_FX_Manager (1)\AE_FX_Manager\WB_EffectDumper_v2"
MSBuild.exe "$root\Win\WB_EffectDumper.vcxproj" /p:Configuration=Release /p:Platform=x64 /t:Build /v:q 2>&1 | Select-String -Pattern "error|Error|succeeded|failed|BUILD|aex|LNK|fatal"
if ($LASTEXITCODE -eq 0) {
    $aex = Get-Item "$root\BuildOutput\AEGP\WB_EffectDumper.aex"
    Write-Host "BUILD SUCCEEDED - AEX: $($aex.Length) bytes, $($aex.LastWriteTime)"
} else {
    Write-Host "BUILD FAILED with exit code $LASTEXITCODE"
}
