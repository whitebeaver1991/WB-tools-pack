$ErrorActionPreference = "Stop"

$sln = "E:\May2023_AfterEffectsSDK_Win\AfterEffectsSDK\Examples\AEGP\Easy_Cheese\Win\Easy_Cheese.sln"
Write-Host "Building official Easy_Cheese with MSBuild..."

# Find latest VS with MSBuild
$vsPaths = @()
foreach ($year in @(2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019)) {
    $p = "C:\Program Files\Microsoft Visual Studio\$year\Professional\MSBuild\Current\Bin\MSBuild.exe"
    if (Test-Path $p) { $vsPaths += $p }
    $p = "C:\Program Files\Microsoft Visual Studio\$year\Community\MSBuild\Current\Bin\MSBuild.exe"
    if (Test-Path $p) { $vsPaths += $p }
}
$p = "C:\Program Files\Microsoft Visual Studio\2022\Professional\MSBuild\Current\Bin\MSBuild.exe"
if (Test-Path $p) { $vsPaths += $p }
$p = "C:\Program Files\Microsoft Visual Studio\2022\Community\MSBuild\Current\Bin\MSBuild.exe"
if (-not (Test-Path $p)) { $p = "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\MSBuild\Current\Bin\MSBuild.exe" }
if (Test-Path $p) { $vsPaths += $p }

Write-Host "Found MSBuild: $vsPaths"

if ($vsPaths.Length -eq 0) {
    Write-Host "MSBuild not found!"
    exit 1
}

$msbuild = $vsPaths[0]
Write-Host "Using: $msbuild"

# Run MSBuild directly with platform toolset override  
& $msbuild $sln /p:Configuration=Release /p:Platform=x64 /p:PlatformToolset=v142 /t:Clean,Build /v:n /nologo 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "BUILD SUCCESS!"
} else {
    Write-Host "BUILD FAILED with exit code: $LASTEXITCODE"
}
