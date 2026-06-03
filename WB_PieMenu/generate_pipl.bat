@echo off
setlocal enabledelayedexpansion

REM =====================================================
REM  generate_pipl.bat - Compile PiPL.r -> PiPL.rc
REM  Requires: Visual Studio Developer Command Prompt
REM  Usage:   generate_pipl.bat <SDK_Headers_Dir> <PiPLTool_Path>
REM  Example: generate_pipl.bat "E:\...\AfterEffectsSDK\Examples\Headers" "E:\...\AfterEffectsSDK\Examples\Resources\PiPLtool"
REM =====================================================

set HEADERS_DIR=%~1
set PIPLTOOL=%~2
set SCRIPT_DIR=%~dp0
set BUILD_DIR=%SCRIPT_DIR%build_pipl

if "%HEADERS_DIR%"=="" (
    echo Error: Missing HEADERS_DIR argument
    echo Usage: %~nx0 ^<SDK_Headers_Dir^> ^<PiPLTool_Path^>
    exit /b 1
)
if "%PIPLTOOL%"=="" (
    echo Error: Missing PIPLTOOL argument
    exit /b 1
)

if not exist "%HEADERS_DIR%" (
    echo Error: Headers directory not found: %HEADERS_DIR%
    exit /b 1
)
if not exist "%PIPLTOOL%" (
    echo Error: PiPLTool not found: %PIPLTOOL%
    exit /b 1
)

if not exist "%BUILD_DIR%" mkdir "%BUILD_DIR%"

echo [1/3] Preprocessing PiPL.r ...
cl /I "%HEADERS_DIR%" /EP "%SCRIPT_DIR%PiPL.r" > "%BUILD_DIR%\PiPL.rr"
if %ERRORLEVEL% neq 0 (
    echo Preprocessing failed!
    exit /b %ERRORLEVEL%
)

echo [2/3] Running PiPLTool ...
"%PIPLTOOL%" "%BUILD_DIR%\PiPL.rr" "%BUILD_DIR%\PiPL.rrc"
if %ERRORLEVEL% neq 0 (
    echo PiPLTool failed!
    exit /b %ERRORLEVEL%
)

echo [3/3] Generating PiPL.rc ...
cl /D "MSWindows" /EP "%BUILD_DIR%\PiPL.rrc" > "%SCRIPT_DIR%PiPL.rc"
if %ERRORLEVEL% neq 0 (
    echo RC generation failed!
    exit /b %ERRORLEVEL%
)

echo Done! Generated: %SCRIPT_DIR%PiPL.rc
exit /b 0
