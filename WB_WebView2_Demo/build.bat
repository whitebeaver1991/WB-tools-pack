@echo off
cd /d "%~dp0"

echo === Step 1: Download NuGet ===
if not exist nuget.exe (
    echo Downloading NuGet...
    powershell -Command "Invoke-WebRequest -Uri 'https://dist.nuget.org/win-x86-commandline/latest/nuget.exe' -OutFile 'nuget.exe'"
)

echo === Step 2: Install WebView2 SDK (NuGet) ===
nuget install Microsoft.Web.WebView2 -Version 1.0.3065.39 -OutputDirectory packages -ExcludeVersion >nul 2>&1
set WV2=%USERPROFILE%\.nuget\packages\microsoft.web.webview2\1.0.3065.39\build\native
if not exist "%WV2%" (
    echo ERROR: WebView2 SDK not found at %WV2%
    pause
    exit /b 1
)

echo === Step 3: Install WebView2 Runtime (Evergreen) ===
if not exist "%PROGRAMFILES%\Microsoft\EdgeWebView\WebView2Application.exe" (
    echo Downloading WebView2 Evergreen Runtime Bootstrapper...
    powershell -Command "Invoke-WebRequest -Uri 'https://go.microsoft.com/fwlink/p/?LinkId=2124703' -OutFile 'MicrosoftEdgeWebview2Setup.exe'"
    echo Installing WebView2 Runtime...
    start /wait MicrosoftEdgeWebview2Setup.exe /silent /install
)

echo === Step 4: Kill running instance ===
taskkill /f /im WB_PieMenu_WebView2.exe >nul 2>&1

echo === Step 5: Compile ===
set MY_CL=C:\Program Files\Microsoft Visual Studio\18\Community\VC\Tools\MSVC\14.50.35717\bin\Hostx64\x64\cl.exe
set VC=C:\Program Files\Microsoft Visual Studio\18\Community\VC\Tools\MSVC\14.50.35717
set SDK=C:\Program Files (x86)\Windows Kits\10\Include\10.0.26100.0
set WVLIB=C:\Program Files (x86)\Windows Kits\10\Lib\10.0.26100.0

"%MY_CL%" demo.cpp /EHsc /I"%VC%\include" /I"%SDK%\um" /I"%SDK%\shared" /I"%SDK%\ucrt" /I"%SDK%\winrt" /I"%WV2%\include" /Fe:WB_PieMenu_WebView2.exe /link /LIBPATH:"%VC%\lib\x64" /LIBPATH:"%WVLIB%\um\x64" /LIBPATH:"%WVLIB%\ucrt\x64" "%WV2%\x64\WebView2LoaderStatic.lib" kernel32.lib user32.lib advapi32.lib ole32.lib oleaut32.lib /nologo

if %ERRORLEVEL% neq 0 (
    echo.
    echo === BUILD FAILED ===
    pause
    exit /b 1
)

echo.
echo === BUILD SUCCESS ===
echo.
echo File: WB_PieMenu_WebView2.exe (%~dp0)
echo Hotkey: Ctrl+Shift+Space toggles the pie menu overlay
echo Double-click center circle to open search
echo.
pause
