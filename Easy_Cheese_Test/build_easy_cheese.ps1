param([string]$Configuration = "Release")

$VCVARS = "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvarsall.bat"
if (Test-Path $VCVARS) {
    Write-Host "Loading VS 2026 x64 environment ..."
    cmd /c "`"$VCVARS`" x64 > nul 2>&1 && set" | ForEach-Object {
        if ($_ -match "^(.*?)=(.*)$") {
            Set-Item -Path "env:$($matches[1])" -Value $matches[2]
        }
    }
} else {
    Write-Host "WARNING: vcvarsall.bat not found at $VCVARS" -ForegroundColor Yellow
}

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot
$BuildRoot = Join-Path $ProjectRoot "build"
$OutDir = Join-Path $BuildRoot $Configuration
New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

$SDK = "E:\setup files\May2023_AfterEffectsSDK_Win\AfterEffectsSDK\Examples"

$CL_Common = @(
    "/nologo", "/c", "/W3", "/EHsc", "/MT", "/O2"
    "/DMSWindows", "/DWIN32", "/D_WINDOWS", "/DAE_PROC_AMD64=1", "/D_USRDLL=1"
)

$INC = @()
$INC += "/I"; $INC += "$SDK\Headers"
$INC += "/I"; $INC += "$SDK\Headers\SP"
$INC += "/I"; $INC += "$SDK\Headers\Win"
$INC += "/I"; $INC += "$SDK\Resources"
$INC += "/I"; $INC += "$SDK\Util"
$INC += "/I"; $INC += "$ProjectRoot"

$OBJS = @()

foreach ($src in @("Easy_Cheese.cpp","Easy_Cheese_Strings.cpp")) {
    $sp = Join-Path $ProjectRoot $src
    $op = Join-Path $OutDir ($src -replace "\.cpp$",".obj")
    $OBJS += $op
    Write-Host "Compiling $src ..."
    & "cl.exe" @CL_Common @INC "/Fo$op" $sp
    if ($LASTEXITCODE -ne 0) { Write-Host "FAILED: $src" -ForegroundColor Red; exit 1 }
}

foreach ($src in @("$SDK\Util\AEGP_SuiteHandler.cpp","$SDK\Util\MissingSuiteError.cpp")) {
    $bn = Split-Path $src -Leaf
    $op = Join-Path $OutDir ($bn -replace "\.cpp$",".obj")
    $OBJS += $op
    Write-Host "Compiling $bn ..."
    & "cl.exe" @CL_Common @INC "/Fo$op" $src
    if ($LASTEXITCODE -ne 0) { Write-Host "FAILED: $bn" -ForegroundColor Red; exit 1 }
}

$genPipl = "$ProjectRoot\generate_pipl.ps1"
if (Test-Path $genPipl) {
    Write-Host ">>> Generating PiPL resources ..." -ForegroundColor Yellow
    & $genPipl -OutputDir $ProjectRoot
    Write-Host ">>> PiPL.bin and PiPL.rc generated." -ForegroundColor Green
} else {
    Write-Warning "generate_pipl.ps1 not found at $genPipl"
}

Write-Host "Compiling Resource.rc ..."
& "rc.exe" "/nologo" "/I$ProjectRoot" "/fo$OutDir\Easy_Cheese.res" "$ProjectRoot\Resource.rc"
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED: Resource.rc" -ForegroundColor Red; exit 1 }

$OutputDll = Join-Path $OutDir "Easy_Cheese.aex"
Write-Host "Linking ..."
$LINK_ARGS = @("/nologo", "/DLL", "/out:$OutputDll")
$LINK_ARGS += $OBJS
$LINK_ARGS += "$OutDir\Easy_Cheese.res"
$LINK_ARGS += @("user32.lib","gdi32.lib","comctl32.lib","comdlg32.lib","winspool.lib","ole32.lib","oleaut32.lib","uuid.lib")
& "link.exe" @LINK_ARGS
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED: Linking" -ForegroundColor Red; exit 1 }

Write-Host "`nBUILD SUCCESSFUL: $OutputDll" -ForegroundColor Green
