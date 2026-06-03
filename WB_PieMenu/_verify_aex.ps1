$vsRoot = "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build"
$vcvars = "$vsRoot\vcvarsall.bat"
$cmd = "`"$vcvars`" x64 > nul 2>&1 && dumpbin /EXPORTS `"$PSScriptRoot\build\Release\WB_PieMenu.aex`""
$output = cmd /c $cmd
Write-Host $output
