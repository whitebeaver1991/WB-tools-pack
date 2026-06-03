@echo off
setlocal enabledelayedexpansion

set "CEPSRC=%~dp0..\CEP\WB_PieMenu_Panel"
set "CEP_DST=%APPDATA%\Adobe\CEP\extensions\WB_PieMenu_Panel"

echo Installing WB Pie Menu CEP Extension...
echo From: %CEPSRC%
echo To:   %CEP_DST%
echo.

if not exist "%CEPSRC%" (
    echo ERROR: Source not found at %CEPSRC%
    pause
    exit /b 1
)

if exist "%CEP_DST%" (
    echo Removing old installation...
    rmdir /s /q "%CEP_DST%"
)

xcopy "%CEPSRC%" "%CEP_DST%" /E /I /Q /H

if exist "%CEP_DST%\CSXS\manifest.xml" (
    echo.
    echo SUCCESS: CEP Extension installed!
    echo.
    echo Next steps:
    echo   1. Make sure CEP debug mode is enabled:
    echo      Create or edit %APPDATA%\Adobe\CEP\extensions\.debug
    echo      Add this line: "WB_PieMenu_Panel": 1
    echo.
    echo   2. Restart After Effects
    echo.
    echo   3. Open Window ^> Extensions ^> WB Pie Menu
) else (
    echo ERROR: Installation failed
)

pause
