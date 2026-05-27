@echo off
set SDK_ROOT=E:\May2023_AfterEffectsSDK_Win\AfterEffectsSDK
set DEST_DIR=C:\AE_FX_Panel\AE_FX_Manager (1)\AE_FX_Manager\WB_PieMenu_Official
set TMP_DIR=%TEMP%\wbpm_pipl

if not exist "%TMP_DIR%" mkdir "%TMP_DIR%"

echo === Step 1: .r -^> .rr ===
cl.exe /I "%SDK_ROOT%\Examples\Headers" /DAE_OS_WIN /DAE_PROC_INTELx64 /EP "%DEST_DIR%\WB_PieMenu_PiPL.r" > "%TMP_DIR%\WB_PieMenu_PiPL.rr" 2>NUL
echo cl exit: %ERRORLEVEL%

echo === Step 2: PiPLTool .rr -^> .rrc ===
"%SDK_ROOT%\Examples\Resources\PiPLtool.exe" "%TMP_DIR%\WB_PieMenu_PiPL.rr" "%TMP_DIR%\WB_PieMenu_PiPL.rrc"
echo PiPLTool exit: %ERRORLEVEL%

echo === Step 3: .rrc -^> .rc ===
cl.exe /D MSWindows /EP "%TMP_DIR%\WB_PieMenu_PiPL.rrc" > "%DEST_DIR%\Win\WB_PieMenu_PiPL.rc" 2>NUL
echo cl exit: %ERRORLEVEL%

echo === Done ===
