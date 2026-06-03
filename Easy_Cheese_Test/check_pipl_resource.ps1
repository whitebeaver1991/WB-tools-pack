$path = "C:\AE_FX_Panel\AE_FX_Manager (1)\AE_FX_Manager\Easy_Cheese_Test\build\Release\Easy_Cheese.aex"
$bytes = [System.IO.File]::ReadAllBytes($path)

# .rsrc section: VA=0x23000, FileOff=0x1E400, Size=512
$rsrcOff = 0x1E400
$rsrcSize = 512
Write-Host ".rsrc section at 0x1E400, size $rsrcSize bytes"
Write-Host "`n=== Resource section hex dump ==="
for ($i = 0; $i -lt $rsrcSize; $i += 16) {
    $line = ""
    for ($j = 0; $j -lt 16 -and ($i + $j) -lt $rsrcSize; $j++) {
        $line += "{0:X2} " -f $bytes[$rsrcOff + $i + $j]
    }
    Write-Host "$line"
}

# Search for "PiPL" or "MIB8" in the .rsrc section
Write-Host "`n=== Searching for PiPL/MIB8 in .rsrc ==="
$piplFound = $false
$mib8Found = $false
for ($i = $rsrcOff; $i -lt $rsrcOff + $rsrcSize - 4; $i++) {
    if ($bytes[$i] -eq 0x50 -and $bytes[$i+1] -eq 0x69 -and $bytes[$i+2] -eq 0x50 -and $bytes[$i+3] -eq 0x4C) {
        Write-Host "Found 'PiPL' at offset 0x$('{0:X}' -f $i) (file), RVA=0x$('{0:X}' -f ($i - $rsrcOff + 0x23000))"
        $piplFound = $true
    }
    if ($bytes[$i] -eq 0x4D -and $bytes[$i+1] -eq 0x49 -and $bytes[$i+2] -eq 0x42 -and $bytes[$i+3] -eq 0x38) {
        Write-Host "Found 'MIB8' at offset 0x$('{0:X}' -f $i) (file), RVA=0x$('{0:X}' -f ($i - $rsrcOff + 0x23000))"
        $mib8Found = $true
        # Dump 40 bytes from the PiPL data start (8 bytes before MIB8)
        $dataStart = $i - 8
        Write-Host "PiPL data dump (from 8 bytes before MIB8, offset 0x$('{0:X}' -f $dataStart)):"
        for ($j = $dataStart; $j -lt $dataStart + 160 -and $j -lt $rsrcOff + $rsrcSize; $j += 16) {
            $line = ""
            $asciiLine = ""
            for ($k = 0; $k -lt 16 -and ($j + $k) -lt $rsrcOff + $rsrcSize; $k++) {
                $line += "{0:X2} " -f $bytes[$j + $k]
                if ($bytes[$j+$k] -ge 0x20 -and $bytes[$j+$k] -le 0x7E) {
                    $asciiLine += [char]$bytes[$j+$k]
                } else { $asciiLine += "." }
            }
            Write-Host "$line  $asciiLine"
        }
    }
}
if (-not $piplFound) { Write-Host "WARNING: 'PiPL' type string NOT found in .rsrc!" -ForegroundColor Red }
if (-not $mib8Found) { Write-Host "WARNING: 'MIB8' (8BIM) NOT found in .rsrc!" -ForegroundColor Red }
