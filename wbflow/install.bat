@echo off
chcp 65001 >nul
title WB FlowBoard Installer
echo ============================================
echo   WB FlowBoard - CEP Extension Installer
echo ============================================
echo.
echo   This script will install the FlowBoard panel for AE.
echo.

rem --- Step 1: Determine CEP extensions folder ---
set "CEP_TARGET=%APPDATA%\Adobe\CEP\extensions\WB_FlowBoard"
if not exist "%CEP_TARGET%" mkdir "%CEP_TARGET%"

rem --- Step 2: Copy files ---
echo [1/2] Copying panel files...
set "SOURCE=%~dp0"
xcopy /E /Y /I /Q "%SOURCE%\CSXS" "%CEP_TARGET%\CSXS\" >nul
xcopy /E /Y /I /Q "%SOURCE%\js" "%CEP_TARGET%\js\" >nul
xcopy /E /Y /I /Q "%SOURCE%\css" "%CEP_TARGET%\css\" >nul
xcopy /E /Y /I /Q "%SOURCE%\jsx" "%CEP_TARGET%\jsx\" >nul
copy /Y "%SOURCE%\index.html" "%CEP_TARGET%\" >nul
copy /Y "%SOURCE%\CSInterface.js" "%CEP_TARGET%\" >nul

rem --- Step 3: Enable CEP debug if needed ---
set "CSXS_FLAG=%APPDATA%\Adobe\CEP\CSXS.6"
if not exist "%CSXS_FLAG%" (
    reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.6" /v "PlayerDebugMode" /t REG_SZ /d "1" /f >nul 2>&1
    reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.7" /v "PlayerDebugMode" /t REG_SZ /d "1" /f >nul 2>&1
    reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.8" /v "PlayerDebugMode" /t REG_SZ /d "1" /f >nul 2>&1
    reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.9" /v "PlayerDebugMode" /t REG_SZ /d "1" /f >nul 2>&1
    reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.10" /v "PlayerDebugMode" /t REG_SZ /d "1" /f >nul 2>&1
    reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.11" /v "PlayerDebugMode" /t REG_SZ /d "1" /f >nul 2>&1
)

echo [2/2] Done!
echo.
echo ============================================
echo   Installation Complete!
echo ============================================
echo.
echo   Next steps:
echo     1. If AE is running, RESTART it
echo     2. Go to Window ^> Extensions ^> WB FlowBoard
echo.
echo   Compatibility: AE 17.0 - 99.9
echo.
pause
