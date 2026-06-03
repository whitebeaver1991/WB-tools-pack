param([string]$Configuration = "Release")

$VCVARS = "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvarsall.bat"
Write-Host "Loading VS 2026 x64 environment ..."
cmd /c "`"$VCVARS`" x64 > nul 2>&1 && set" | ForEach-Object {
    if ($_ -match "^(.*?)=(.*)$") {
        Set-Item -Path "env:$($matches[1])" -Value $matches[2]
    }
}

$ProjectRoot = "E:\WB_PieMenu"
$OutDir = "C:\AE_FX_Panel\AE_FX_Manager (1)\AE_FX_Manager\WB_PieMenu\minimal_test_build"
New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

$SDK = "E:\AfterEffectsSDK_25.2_20_win\ae25.2_20.64bit.AfterEffectsSDK\AfterEffectsSDK\Examples"

Write-Host "Compiling minimal_test.cpp ..."
& "cl.exe" "/nologo" "/c" "/MD" "/O2" "/W3" "/EHsc" `
    "/I$SDK\Headers" "/I$SDK\Headers\SP" "/I$SDK\Headers\Win" "/I$SDK\Resources" "/I$SDK\Util" "/I$ProjectRoot" `
    "/DMSWindows" "/DWIN32" "/D_WINDOWS" "/DAE_PROC_AMD64=1" "/D_USRDLL=1" `
    "/Fo$OutDir\minimal_test.obj" `
    "C:\AE_FX_Panel\AE_FX_Manager (1)\AE_FX_Manager\WB_PieMenu\minimal_test.cpp"
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED" -ForegroundColor Red; exit 1 }

Write-Host "Compiling Resource.rc ..."
& "rc.exe" "/nologo" "/I$ProjectRoot" "/fo$OutDir\Minimal_Test.res" "$ProjectRoot\Resource.rc"
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED" -ForegroundColor Red; exit 1 }

Write-Host "Linking ..."
& "link.exe" "/nologo" "/DLL" "/out:$OutDir\Minimal_Test.aex" `
    "$OutDir\minimal_test.obj" "$OutDir\Minimal_Test.res" `
    "user32.lib" "ole32.lib" "oleaut32.lib" "uuid.lib"
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED" -ForegroundColor Red; exit 1 }

Write-Host "`nBUILD SUCCESSFUL: $OutDir\Minimal_Test.aex" -ForegroundColor Green
