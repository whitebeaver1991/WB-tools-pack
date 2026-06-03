$sln = "E:\May2023_AfterEffectsSDK_Win\AfterEffectsSDK\Examples\AEGP\Easy_Cheese\Win\Easy_Cheese.sln"
$dest = "C:\AE_FX_Panel\AE_FX_Manager (1)\AE_FX_Manager\Easy_Cheese_Official"

# Copy the entire Easy_Cheese folder to writable location
Copy-Item "E:\May2023_AfterEffectsSDK_Win\AfterEffectsSDK\Examples\AEGP\Easy_Cheese" $dest -Recurse -Force

# Find MSBuild
$msbuild = "C:\Program Files\Microsoft Visual Studio\18\Community\MSBuild\Current\Bin\MSBuild.exe"
Write-Host "Using MSBuild: $msbuild"
Write-Host "Building at: $dest\Win\Easy_Cheese.vcxproj"

# Build with MSBuild
& $msbuild "$dest\Win\Easy_Cheese.vcxproj" /p:Configuration=Release /p:Platform=x64 /p:PlatformToolset=v142 /t:Clean,Build /v:n /nologo 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "BUILD SUCCESS!"
    Get-ChildItem "$dest\Win\x64\Release\Easy_Cheese.aex" | Select-Object FullName, Length
} else {
    Write-Host "BUILD FAILED: $LASTEXITCODE"
}
