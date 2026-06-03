$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$SDK = "E:\setup files\May2023_AfterEffectsSDK_Win\AfterEffectsSDK\Examples"
$Headers = "$SDK\Headers"
$PiPLTool = "$SDK\Resources\PiPLtool.exe"
$EasyCheeseDir = "$SDK\AEGP\Easy_Cheese"
$IntDir = "$ProjectRoot\build\int"
New-Item -ItemType Directory -Force -Path $IntDir | Out-Null

# VS env setup (same as build_easy_cheese.ps1)
$VCVARS = "C:\Program Files\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvarsall.bat"
cmd /c "`"$VCVARS`" x64 > nul 2>&1 && set" | ForEach-Object {
    if ($_ -match "^(.*?)=(.*)$") {
        Set-Item -Path "env:$($matches[1])" -Value $matches[2]
    }
}

Write-Host "=== Step 1: Preprocessing Easy_Cheese_PiPL.r -> .rr ==="
cl /I"$Headers" /EP "$EasyCheeseDir\Easy_Cheese_PiPL.r" > "$IntDir\Easy_Cheese_PiPL.rr" 2>&1
$rrContent = Get-Content "$IntDir\Easy_Cheese_PiPL.rr" -Raw
Write-Host $rrContent

Write-Host "`n=== Step 2: PiPLTool .rr -> .rrc ==="
& $PiPLTool "$IntDir\Easy_Cheese_PiPL.rr" "$IntDir\Easy_Cheese_PiPL.rrc"

Write-Host "`n=== Step 3: Post-process .rrc -> .rc ==="
cl /D "MSWindows" /EP "$IntDir\Easy_Cheese_PiPL.rrc" > "$IntDir\Easy_Cheese_PiPL.rc" 2>&1
Get-Content "$IntDir\Easy_Cheese_PiPL.rc"

Write-Host "`n=== PiPLTool .rrc hex dump ==="
$ptBytes = [System.IO.File]::ReadAllBytes("$IntDir\Easy_Cheese_PiPL.rrc")
Write-Host "PiPLTool size: $($ptBytes.Length) bytes"
for ($i = 0; $i -lt $ptBytes.Length; $i += 16) {
    $line = ""
    for ($j = 0; $j -lt 16 -and ($i + $j) -lt $ptBytes.Length; $j++) {
        $line += "{0:X2} " -f $ptBytes[$i + $j]
    }
    Write-Host "$line"
}

Write-Host "`n=== Our generated PiPL.bin hex dump ==="
$ourBytes = [System.IO.File]::ReadAllBytes("$ProjectRoot\PiPL.bin")
Write-Host "Our size: $($ourBytes.Length) bytes"
for ($i = 0; $i -lt $ourBytes.Length; $i += 16) {
    $line = ""
    for ($j = 0; $j -lt 16 -and ($i + $j) -lt $ourBytes.Length; $j++) {
        $line += "{0:X2} " -f $ourBytes[$i + $j]
    }
    Write-Host "$line"
}

if ($ourBytes.Length -eq $ptBytes.Length) {
    $match = $true
    for ($i = 0; $i -lt $ourBytes.Length; $i++) {
        if ($ourBytes[$i] -ne $ptBytes[$i]) { $match = $false; break }
    }
    if ($match) { Write-Host "`nIDENTICAL - Our PiPL.bin matches PiPLTool!" }
    else { Write-Host "`nDIFFERENT - Need to fix!" }
} else {
    Write-Host "`nDIFFERENT SIZE - Need to fix!"
}
