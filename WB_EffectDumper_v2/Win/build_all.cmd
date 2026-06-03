@echo off
call "C:\Program Files\Microsoft Visual Studio\18\Community\Common7\Tools\VsDevCmd.bat" -arch=amd64 -host_arch=amd64 2>NUL

set SDK_ROOT=E:\May2023_AfterEffectsSDK_Win\AfterEffectsSDK
set DEST_DIR=C:\AE_FX_Panel\AE_FX_Manager (1)\AE_FX_Manager\WB_EffectDumper_v2
set TMP_DIR=%TEMP%\wbed_pipl_v5

if not exist "%TMP_DIR%" mkdir "%TMP_DIR%"

echo === Step 1: PiPL .r -^> .rr ===
cl.exe /I "%SDK_ROOT%\Examples\Headers" /DAE_OS_WIN /DAE_PROC_INTELx64 /EP "%DEST_DIR%\WB_EffectDumper_PiPL.r" > "%TMP_DIR%\WB_EffectDumper_PiPL.rr" 2>NUL

echo === Step 2: PiPLTool .rr -^> .rrc ===
"%SDK_ROOT%\Examples\Resources\PiPLtool.exe" "%TMP_DIR%\WB_EffectDumper_PiPL.rr" "%TMP_DIR%\WB_EffectDumper_PiPL.rrc"

echo === Step 3: .rrc -^> .rc ===
cl.exe /D MSWindows /EP "%TMP_DIR%\WB_EffectDumper_PiPL.rrc" > "%DEST_DIR%\Win\WB_EffectDumper_PiPL.rc" 2>NUL

echo === Step 4: Build ===
msbuild "%DEST_DIR%\Win\WB_EffectDumper.vcxproj" /p:Configuration=Release /p:Platform=x64 /t:Build /v:q

echo === Done ===
