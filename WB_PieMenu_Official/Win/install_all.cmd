@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   WB Pie Menu - Installer
echo ============================================
echo.

rem --- Step 1: Install CEP Extension ---
set "CEPSRC=%~dp0..\CEP\WB_PieMenu_Panel"
set "CEP_DST=%APPDATA%\Adobe\CEP\extensions\WB_PieMenu_Panel"

echo [1/4] Installing CEP Extension...
if exist "%CEP_DST%" (
    rmdir /s /q "%CEP_DST%" 2>nul
)
xcopy "%CEPSRC%" "%CEP_DST%" /E /I /Q /H >nul
if exist "%CEP_DST%\CSXS\manifest.xml" (
    echo   ^> CEP Extension installed to %CEP_DST%
) else (
    echo   ^> FAILED to install CEP Extension
)

rem --- Step 2: Enable CEP Debug Mode ---
echo [2/4] Enabling CEP debug mode...
set "DEBUG_FILE=%APPDATA%\Adobe\CEP\extensions\.debug"
if exist "%DEBUG_FILE%" (
    find "WB_PieMenu_Panel" "%DEBUG_FILE%" >nul 2>nul
    if errorlevel 1 (
        echo.>>"%DEBUG_FILE%"
        echo "WB_PieMenu_Panel": 1>>"%DEBUG_FILE%"
    )
) else (
    echo "WB_PieMenu_Panel": 1>"%DEBUG_FILE%"
)
echo   ^> CEP debug mode enabled

rem --- Step 3: Create default settings ---
echo [3/4] Creating default settings...
set "SETTINGS_DIR=%LOCALAPPDATA%\WB_PieMenu"
if not exist "%SETTINGS_DIR%" mkdir "%SETTINGS_DIR%"
(
echo trigger_key=32
echo trigger_mod=6
echo n0=Item 1
echo n1=Item 2
echo n2=Item 3
echo n3=Item 4
) > "%SETTINGS_DIR%\settings.txt"
echo   ^> Settings created at %SETTINGS_DIR%\settings.txt
echo   ^> Default trigger: Ctrl+Shift+Space

rem --- Step 4: Copy AEX Plugin ---
echo [4/4] Copying AEX plugin to AE...
set "AEX_SRC=C:\AEGP\WB_PieMenu.aex"

if not exist "%AEX_SRC%" (
    echo   ^> WARNING: AEX not found at %AEX_SRC%
    echo   ^> Build it first, then copy manually
) else (
    rem Try common AE versions
    set "AE_DIRS=C:\Program Files\Adobe\Adobe After Effects 2025\Support Files\Plug-ins;C:\Program Files\Adobe\Adobe After Effects 2024\Support Files\Plug-ins;C:\Program Files\Adobe\Adobe After Effects 2023\Support Files\Plug-ins;C:\Program Files\Adobe\Adobe After Effects 2022\Support Files\Plug-ins"
    set "COPIED=0"
    for %%d in (%AE_DIRS%) do (
        if exist "%%d" (
            copy /Y "%AEX_SRC%" "%%d\WB_PieMenu.aex" >nul 2>nul
            if not errorlevel 1 (
                echo   ^> Installed to %%d
                set "COPIED=1"
            )
        )
    )
    if "!COPIED!"=="0" (
        echo   ^> Could not auto-install. Please copy manually:
        echo      From: %AEX_SRC%
        echo      To:   Your AE Plug-ins folder
    )
)

echo.
echo ============================================
echo   Installation Complete!
echo ============================================
echo.
echo Next steps:
echo   1. Launch/Restart After Effects
echo   2. Open Window ^> Extensions ^> WB Pie Menu
echo   3. Set your desired hotkey and item names
echo   4. Click Save, then press Ctrl+Shift+Space to test
echo.
pause
