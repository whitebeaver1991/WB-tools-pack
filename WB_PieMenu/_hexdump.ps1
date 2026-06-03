$path = "C:\AE_FX_Panel\AE_FX_Manager (1)\AE_FX_Manager\WB_PieMenu\PiPL.bin"
$bytes = [System.IO.File]::ReadAllBytes($path)
Write-Host ("Total bytes: " + $bytes.Length)
Write-Host "Hex dump:"
for ($i = 0; $i -lt $bytes.Length; $i += 16) {
    $line = ""
    for ($j = 0; $j -lt 16 -and ($i + $j) -lt $bytes.Length; $j++) {
        $line += ("{0:X2} " -f $bytes[$i + $j])
    }
    Write-Host $line
}

# Also dump ASCII representation
Write-Host "`nASCII (printable only):"
for ($i = 0; $i -lt $bytes.Length; $i += 16) {
    $line = ""
    for ($j = 0; $j -lt 16 -and ($i + $j) -lt $bytes.Length; $j++) {
        $c = $bytes[$i + $j]
        if ($c -ge 32 -and $c -le 126) {
            $line += [char]$c
        } else {
            $line += "."
        }
    }
    Write-Host $line
}

# Also run the SDK PiPLTool for comparison
$sdktool = "E:\AfterEffectsSDK_25.2_20_win\ae25.2_20.64bit.AfterEffectsSDK\AfterEffectsSDK\Examples\Resources\PiPLTool.exe"
$sourcerDir = "C:\AE_FX_Panel\AE_FX_Manager (1)\AE_FX_Manager\WB_PieMenu"
$workDir = "C:\Temp\PiPL_Work_SDK"

if (!(Test-Path $workDir)) { New-Item -Type Directory -Path $workDir -Force | Out-Null }

# Copy the .r file
Copy-Item "$sourcerDir\WB_PieMenu_PiPL.r" "$workDir\WB_PieMenu_PiPL.r" -Force

# Step 1: cl /EP
$headers = "E:\AfterEffectsSDK_25.2_20_win\ae25.2_20.64bit.AfterEffectsSDK\AfterEffectsSDK\Examples\Headers"
cl "/I$headers" "/I$sourcerDir" /EP "$workDir\WB_PieMenu_PiPL.r" 2>&1 | Out-File "$workDir\WB_PieMenu_PiPL.rr" -Encoding ASCII

Write-Host "`n--- Step 1: .rr file generated ---"

# Step 2: PiPLTool
if (Test-Path $sdktool) {
    & $sdktool "$workDir\WB_PieMenu_PiPL.rr" "$workDir\WB_PieMenu_PiPL.rrc"
    Write-Host "--- Step 2: PiPLTool completed ---"
    
    # Check if .rrc exists
    $rrc = Get-ChildItem $workDir -Filter *.rrc | Select-Object -First 1
    if ($rrc) {
        Write-Host "Found .rrc: " $rrc.FullName
        Write-Host "--- .rrc content: ---"
        Get-Content $rrc.FullName
        
        # Check if .bin was generated alongside .rrc
        $binFile = $rrc.FullName -replace '\.rrc$', '.bin'
        if (Test-Path $binFile) {
            Write-Host "`n--- SDK PiPLTool .bin hex dump ($binFile) ---"
            $sdkBytes = [System.IO.File]::ReadAllBytes($binFile)
            Write-Host ("Total bytes: " + $sdkBytes.Length)
            for ($i = 0; $i -lt $sdkBytes.Length; $i += 16) {
                $line = ""
                for ($j = 0; $j -lt 16 -and ($i + $j) -lt $sdkBytes.Length; $j++) {
                    $line += ("{0:X2} " -f $sdkBytes[$i + $j])
                }
                Write-Host $line
            }
        } else {
            Write-Host "No .bin file found alongside .rrc"
        }
    } else {
        Write-Host "No .rrc file found"
        Write-Host "Searching for all files in $workDir..."
        Get-ChildItem $workDir | ForEach-Object { Write-Host $_.Name }
    }
}
