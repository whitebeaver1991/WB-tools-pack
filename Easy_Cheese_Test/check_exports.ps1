param([string]$DllPath)

if (-not $DllPath) {
    $DllPath = "C:\AE_FX_Panel\AE_FX_Manager (1)\AE_FX_Manager\Easy_Cheese_Test\build\Release\Easy_Cheese.aex"
}

$bytes = [System.IO.File]::ReadAllBytes($DllPath)
Write-Host "File: $DllPath"
Write-Host "Size: $($bytes.Length) bytes"

$peOffset = [System.BitConverter]::ToInt32($bytes, 0x3C)
$magic = [System.Text.Encoding]::ASCII.GetString($bytes, $peOffset, 4)
Write-Host "PE offset: 0x$('{0:X}' -f $peOffset) magic: $magic"

$numSections = [System.BitConverter]::ToUInt16($bytes, $peOffset+6)
$optHeaderSize = [System.BitConverter]::ToUInt16($bytes, $peOffset+20)

$exportDirRVA = [System.BitConverter]::ToUInt32($bytes, $peOffset+24+112)
$exportDirSize = [System.BitConverter]::ToUInt32($bytes, $peOffset+24+116)
Write-Host "Export dir RVA: 0x$('{0:X}' -f $exportDirRVA), Size: $exportDirSize"

if ($exportDirRVA -eq 0) {
    Write-Host "ERROR: NO EXPORT TABLE! AE will not find EntryPointFunc!" -ForegroundColor Red
    exit 1
}

$sectionsOffset = $peOffset + 24 + $optHeaderSize
$fileOff = 0
for ($i = 0; $i -lt $numSections; $i++) {
    $s = $sectionsOffset + $i * 40
    $name = [System.Text.Encoding]::ASCII.GetString($bytes, $s, 8).TrimEnd("`0")
    $virtSize = [System.BitConverter]::ToUInt32($bytes, $s+8)
    $virtAddr = [System.BitConverter]::ToUInt32($bytes, $s+12)
    $rawSize = [System.BitConverter]::ToUInt32($bytes, $s+16)
    $rawPtr = [System.BitConverter]::ToUInt32($bytes, $s+20)
    Write-Host "Section $name : VA=0x$('{0:X}' -f $virtAddr) Size=$rawSize FileOff=0x$('{0:X}' -f $rawPtr)"
    if ($exportDirRVA -ge $virtAddr -and $exportDirRVA -lt ($virtAddr+$virtSize)) {
        $fileOff = $rawPtr + ($exportDirRVA - $virtAddr)
    }
}

Write-Host "Export table file offset: 0x$('{0:X}' -f $fileOff)"
$numExports = [System.BitConverter]::ToUInt32($bytes, $fileOff+20)
$addrOfNames = [System.BitConverter]::ToUInt32($bytes, $fileOff+32)
Write-Host "Number of exports: $numExports"

# Find names table file offset
$namesFileOff = 0
for ($i = 0; $i -lt $numSections; $i++) {
    $s = $sectionsOffset + $i * 40
    $virtAddr = [System.BitConverter]::ToUInt32($bytes, $s+12)
    $rawPtr = [System.BitConverter]::ToUInt32($bytes, $s+20)
    $virtSize = [System.BitConverter]::ToUInt32($bytes, $s+8)
    if ($addrOfNames -ge $virtAddr -and $addrOfNames -lt ($virtAddr+$virtSize)) {
        $namesFileOff = $rawPtr + ($addrOfNames - $virtAddr)
        break
    }
}

Write-Host "`n=== EXPORTED FUNCTIONS ==="
for ($i = 0; $i -lt $numExports; $i++) {
    $nameRVA = [System.BitConverter]::ToUInt32($bytes, $namesFileOff + $i*4)
    # Convert RVA to file offset
    $nameOff = 0
    for ($j = 0; $j -lt $numSections; $j++) {
        $s = $sectionsOffset + $j * 40
        $virtAddr = [System.BitConverter]::ToUInt32($bytes, $s+12)
        $rawPtr = [System.BitConverter]::ToUInt32($bytes, $s+20)
        $virtSize = [System.BitConverter]::ToUInt32($bytes, $s+8)
        if ($nameRVA -ge $virtAddr -and $nameRVA -lt ($virtAddr+$virtSize)) {
            $nameOff = $rawPtr + ($nameRVA - $virtAddr)
            break
        }
    }
    if ($nameOff -gt 0) {
        $nameEnd = $nameOff
        while ($bytes[$nameEnd] -ne 0) { $nameEnd++ }
        $name = [System.Text.Encoding]::ASCII.GetString($bytes, $nameOff, $nameEnd - $nameOff)
        Write-Host "  [$i] $name"
    }
}
