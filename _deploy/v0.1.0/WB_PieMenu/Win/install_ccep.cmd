@echo off
chcp 65001 >nul
title WB Pie Menu - CEP Extension Installer
echo ============================================
echo   WB Pie Menu - CEP Extension Installer
echo ============================================
echo.

rem --- Step 1: Delete OLD version from Common Files ---
set "OLD_DIR=C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\WB_PieMenu_Panel"
echo [1/4] Removing old version from Program Files...
if exist "%OLD_DIR%" (
    echo   ^> Found old version at: %OLD_DIR%
    echo   ^> Please close After Effects first!
    echo.
    takeown /f "%OLD_DIR%" /r /d y >nul 2>nul
    icacls "%OLD_DIR%" /grant administrators:F /t /q >nul 2>nul
    rmdir /s /q "%OLD_DIR%" 2>nul
    if exist "%OLD_DIR%" (
        echo   ^> WARNING: Could not delete automatically.
        echo   ^> Please manually DELETE this folder:
        echo      %OLD_DIR%
        echo   ^> Then re-run this script.
        echo.
        pause
        exit /b 1
    )
    echo   ^> Old version deleted.
) else (
    echo   ^> No old version found.
)
echo.

rem --- Step 2: Install new CEP Extension ---
set "CEPSRC=%~dp0..\CEP\WB_PieMenu_Panel"
set "CEP_DST=%APPDATA%\Adobe\CEP\extensions\WB_PieMenu_Panel"
echo [2/4] Installing CEP Extension...
if exist "%CEP_DST%" (
    echo   ^> Removing previous installation...
    rmdir /s /q "%CEP_DST%" 2>nul
)
xcopy "%CEPSRC%" "%CEP_DST%" /E /I /Q /H >nul
if exist "%CEP_DST%\CSXS\manifest.xml" (
    echo   ^> CEP Extension installed to:
    echo      %CEP_DST%
) else (
    echo   ^> FAILED to install CEP Extension
    pause
    exit /b 1
)
echo.

rem --- Step 3: Enable CEP Debug Mode ---
echo [3/4] Enabling CEP debug mode...
set "DEBUG_FILE=%APPDATA%\Adobe\CEP\extensions\.debug"
echo "WB_PieMenu_Panel": 1 > "%DEBUG_FILE%"
echo   ^> Debug file created at %DEBUG_FILE%
echo.

rem --- Step 4: Create default settings ---
echo [4/4] Creating default settings...
set "SETTINGS_DIR=%LOCALAPPDATA%\WB_PieMenu"
if not exist "%SETTINGS_DIR%" mkdir "%SETTINGS_DIR%"
(
echo item_count=4
echo trigger_key=32
echo trigger_mod=6
echo opacity=160
echo numpad_enabled=0
echo menu_type=0
echo pie_count=4
echo quick_count=6
echo pie_0_0_n=Item 1
echo pie_0_1_n=Item 2
echo pie_0_2_n=Item 3
echo pie_0_3_n=Item 4
) > "%SETTINGS_DIR%\settings.txt"
echo   ^> Settings created at %SETTINGS_DIR%\settings.txt
echo.

echo ============================================
echo   Installation Complete!
echo ============================================
echo.
echo   Next steps:
echo     1. If AE is running, RESTART it
echo     2. Go to Window ^> Extensions ^> WB Pie Menu
echo     3. The settings panel will appear
echo     4. Configure your items and click Save
echo     5. Press Ctrl+Shift+Space to test
echo.
echo   Compatibility: AE 17.0 - 99.9 (including AE 2025 v25.6)
echo.
echo   TIP: You can dock the panel to AE's UI
echo        just like any other panel.
echo.
pause
