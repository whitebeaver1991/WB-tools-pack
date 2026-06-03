param([string]$Configuration = "Release")

# Load VS 2026 x64 environment
$VCVARS = "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvarsall.bat"
if (Test-Path $VCVARS) {
    Write-Host "Loading VS 2026 x64 environment ..."
    cmd /c "`"$VCVARS`" x64 > nul 2>&1 && set" | ForEach-Object {
        if ($_ -match "^(.*?)=(.*)$") {
            Set-Item -Path "env:$($matches[1])" -Value $matches[2]
        }
    }
}

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BuildRoot = Join-Path $ProjectRoot "build"
$OutDir = Join-Path $BuildRoot $Configuration
New-Item -ItemType Directory -Path $OutDir -Force | Out-Null

$SDK = "E:\AfterEffectsSDK_25.2_20_win\ae25.2_20.64bit.AfterEffectsSDK\AfterEffectsSDK\Examples"

$CL_Common = @("/nologo", "/c", "/W3", "/EHsc", "/MD", "/O2",
    "/DMSWindows", "/DWIN32", "/D_WINDOWS", "/DAE_PROC_AMD64=1", "/D_USRDLL=1")

$INC = @()
$INC += "/I"; $INC += "$SDK\Headers"
$INC += "/I"; $INC += "$SDK\Headers\SP"
$INC += "/I"; $INC += "$SDK\Headers\Win"
$INC += "/I"; $INC += "$SDK\Resources"
$INC += "/I"; $INC += "$SDK\Util"
$INC += "/I"; $INC += "$ProjectRoot"

# Write minimal source
@"
#include <AEConfig.h>
#ifdef AE_OS_WIN
#include <windows.h>
#endif
#include <AE_GeneralPlug.h>
#include <AEGP_SuiteHandler.h>

#define DllExport __declspec(dllexport)

static AEGP_PluginID g_plugin_id = NULL;
static SPBasicSuite *g_sp_basic = NULL;
static AEGP_Command g_cmd_id = 0;

A_Err CommandHook(
    AEGP_GlobalRefcon plugin_refcon,
    AEGP_CommandRefcon refcon,
    AEGP_Command command,
    AEGP_HookPriority hook_priority,
    A_Boolean already_handled,
    A_Boolean *handledPB)
{
    return A_Err_NONE;
}

A_Err UpdateMenuHook(
    AEGP_GlobalRefcon plugin_refcon,
    AEGP_UpdateMenuRefcon refcon,
    AEGP_WindowType active_window)
{
    return A_Err_NONE;
}

extern "C" DllExport A_Err EntryPointFunc(
    SPBasicSuite *pica_basicP,
    A_long major_versionL,
    A_long minor_versionL,
    AEGP_PluginID aegp_plugin_id,
    AEGP_GlobalRefcon *global_refconP)
{
    g_sp_basic = pica_basicP;
    g_plugin_id = aegp_plugin_id;
    A_Err err = A_Err_NONE;
    AEGP_SuiteHandler suites(pica_basicP);

    err = suites.CommandSuite1()->AEGP_GetUniqueCommand(&g_cmd_id);
    if (err) return err;

    err = suites.CommandSuite1()->AEGP_InsertMenuCommand(
        g_cmd_id, "WB Minimal Test",
        AEGP_Menu_WINDOW, AEGP_MENU_INSERT_SORTED);
    if (err) return err;

    err = suites.RegisterSuite5()->AEGP_RegisterCommandHook(
        aegp_plugin_id, AEGP_HP_BeforeAE,
        AEGP_Command_ALL, CommandHook, 0);
    if (err) return err;

    err = suites.RegisterSuite5()->AEGP_RegisterUpdateMenuHook(
        aegp_plugin_id, UpdateMenuHook, 0);
    if (err) return err;

    return err;
}
"@ | Out-File -FilePath "$OutDir\test_minimal.cpp" -Encoding ASCII

# Compile minimal test
Write-Host "Compiling test_minimal.cpp ..."
& "cl.exe" @CL_Common @INC "/Fo$OutDir\test_minimal.obj" "$OutDir\test_minimal.cpp"
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED" -ForegroundColor Red; exit 1 }

# Compile SDK files
foreach ($src in @("$SDK\Util\AEGP_SuiteHandler.cpp","$SDK\Util\MissingSuiteError.cpp")) {
    $bn = Split-Path $src -Leaf
    $op = Join-Path $OutDir ($bn -replace "\.cpp$",".obj")
    Write-Host "Compiling $bn ..."
    & "cl.exe" @CL_Common @INC "/Fo$op" $src
    if ($LASTEXITCODE -ne 0) { Write-Host "FAILED: $bn" -ForegroundColor Red; exit 1 }
}

# Helper functions for PiPL generation
function Write-BigEndianInt32 { param([int]$Value); return [byte[]]@([byte](($Value -shr 24) -band 0xFF),[byte](($Value -shr 16) -band 0xFF),[byte](($Value -shr 8) -band 0xFF),[byte]($Value -band 0xFF)) }
function Write-FourCharCode { param([string]$Code); return [byte[]]@([byte][char]$Code[0],[byte][char]$Code[1],[byte][char]$Code[2],[byte][char]$Code[3]) }
function Write-PascalString { param([string]$Str); $bytes = [System.Text.Encoding]::ASCII.GetBytes($Str); return [byte[]]@([byte]$bytes.Length) + $bytes }
function Write-CString { param([string]$Str); $bytes = [System.Text.Encoding]::ASCII.GetBytes($Str); return $bytes + [byte[]]@(0x00) }
function Write-PiPLAtom { param([string]$Key,[byte[]]$Data); $r=[byte[]]@(); $r+=Write-FourCharCode "8BIM"; $r+=Write-FourCharCode $Key; $r+=Write-BigEndianInt32 0; $r+=Write-BigEndianInt32 $Data.Length; $r+=$Data; if(($Data.Length%2)-ne0){$r+=[byte]0x00}; return $r }

# Generate PiPL
$bodyData = [byte[]]@()
$bodyData += Write-PiPLAtom -Key "kind" -Data (Write-FourCharCode "AEgx")
$bodyData += Write-PiPLAtom -Key "name" -Data (Write-PascalString "WB Minimal Test")
$bodyData += Write-PiPLAtom -Key "catg" -Data (Write-PascalString "General Plugin")
$bodyData += Write-PiPLAtom -Key "vers" -Data (Write-BigEndianInt32 196608)
$bodyData += Write-PiPLAtom -Key "8664" -Data (Write-CString "EntryPointFunc")
$piplAtom = Write-PiPLAtom -Key "prPi" -Data $bodyData
$binFullPath = [IO.Path]::GetFullPath("$OutDir/Minimal_PiPL.bin")
[System.IO.File]::WriteAllBytes($binFullPath, $piplAtom)
Write-Host "Generated PiPL: $binFullPath ($($piplAtom.Length) bytes)"

# Create .rc file
$binFullPath = [IO.Path]::GetFullPath("$OutDir/Minimal_PiPL.bin")
$rcContent = "// Minimal_PiPL.rc`r`nLANGUAGE 9, 1`r`n2800 PiPL `"$binFullPath`"`r`n"
[System.IO.File]::WriteAllText([IO.Path]::GetFullPath("$OutDir/Minimal_PiPL.rc"), $rcContent)

# Compile resource
Write-Host "Compiling Minimal_PiPL.rc ..."
& "rc.exe" "/nologo" "/fo$OutDir\Minimal_PiPL.res" "$OutDir\Minimal_PiPL.rc"
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED: resource" -ForegroundColor Red; exit 1 }

# Link
$OutputDll = Join-Path $OutDir "WB_Minimal.aex"
Write-Host "Linking ..."
& "link.exe" @("/nologo", "/DLL", "/out:$OutputDll",
    "$OutDir\test_minimal.obj",
    "$OutDir\AEGP_SuiteHandler.obj",
    "$OutDir\MissingSuiteError.obj",
    "$OutDir\Minimal_PiPL.res",
    "user32.lib","gdi32.lib","comctl32.lib","comdlg32.lib","winspool.lib","ole32.lib","oleaut32.lib","uuid.lib")
if ($LASTEXITCODE -ne 0) { Write-Host "FAILED: Linking" -ForegroundColor Red; exit 1 }

Write-Host "`nBUILD SUCCESSFUL: $OutputDll ($((Get-Item $OutputDll).Length) bytes)" -ForegroundColor Green
