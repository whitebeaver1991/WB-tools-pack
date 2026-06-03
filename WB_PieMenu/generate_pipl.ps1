# generate_pipl.ps1 - Generate PiPL binary for WB Pie Menu
#
# PiPL binary format (raw PIType list, no outer wrapper):
#
#   PIPropertyList (8 bytes):
#     version (SPInt32, LE) = 0
#     count   (SPInt32, LE) = N (number of atoms)
#
#   PIProperty atom:
#     vendorID      (4 bytes) = '8BIM' FourCharCode (byte-reversed)
#     propertyKey   (4 bytes) = atom key FourCharCode (byte-reversed)
#     propertyID    (SPInt32, LE) = 0
#     propertyLength(SPInt32, LE) = padded data size (rounded up to even)
#     propertyData  (N bytes, padded to even)
#
# IMPORTANT: On Windows/LE, FourCharCode bytes are stored REVERSED
#   so that when read as a LE uint32, they match MSVC multi-char literal.
#   E.g., '8BIM' = 0x3842494D, stored as bytes [4D,49,42,38] = "MIB8"

param(
    [string]$OutputDir = "."
)

function Write-LittleEndianInt32 {
    param([int]$Value)
    return [byte[]]@(
        [byte]($Value -band 0xFF),
        [byte](($Value -shr 8) -band 0xFF),
        [byte](($Value -shr 16) -band 0xFF),
        [byte](($Value -shr 24) -band 0xFF)
    )
}

function Write-FourCharCode {
    param([string]$Code)
    if ($Code.Length -ne 4) { throw "FourCharCode must be exactly 4 chars" }
    return [byte[]]@(
        [byte][char]$Code[3],
        [byte][char]$Code[2],
        [byte][char]$Code[1],
        [byte][char]$Code[0]
    )
}

function Write-PascalString {
    param([string]$Str)
    $bytes = [System.Text.Encoding]::ASCII.GetBytes($Str)
    return [byte[]]@([byte]$bytes.Length) + $bytes
}

function Write-CString {
    param([string]$Str)
    $bytes = [System.Text.Encoding]::ASCII.GetBytes($Str)
    return $bytes + [byte]0x00
}

# Pad byte array to even length (8BIM alignment requirement)
function Add-PadToEven {
    param([byte[]]$Data)
    if (($Data.Length % 2) -eq 0) {
        return $Data
    }
    return $Data + [byte]0x00
}

# Write a PIProperty atom: vendorID + propertyKey + propertyID(LE) + propertyLength(LE) + paddedData
function Write-PIProperty {
    param(
        [string]$Key,
        [byte[]]$Data
    )
    $paddedData = Add-PadToEven -Data $Data
    $paddedSize = $paddedData.Length

    $result = [byte[]]@()
    $result += Write-FourCharCode "8BIM"
    $result += Write-FourCharCode $Key
    $result += Write-LittleEndianInt32 0
    $result += Write-LittleEndianInt32 $paddedSize
    $result += $paddedData
    return $result
}

# ============================================================
# Build PiPL atoms
# ============================================================

# kind = AEGP ('AEgx')
$atomKind = Write-PIProperty -Key "kind" -Data (Write-FourCharCode "AEgx")

# name = Pascal string
$atomName = Write-PIProperty -Key "name" -Data (Write-PascalString "WB Pie Menu")

# catg = Pascal string
$atomCatg = Write-PIProperty -Key "catg" -Data (Write-PascalString "General Plugin")

# vers = little-endian int32 (196608 = 0x00030000 = version 3.0.0)
$atomVers = Write-PIProperty -Key "vers" -Data (Write-LittleEndianInt32 196608)

# 8664 = C-string entry point function name
$atomEntry = Write-PIProperty -Key "8664" -Data (Write-CString "EntryPointFunc")

# ============================================================
# Build PiPL binary: version(0) + count(5) + atoms
# ============================================================

$piplData = [byte[]]@()
$piplData += Write-LittleEndianInt32 0   # kCurrentPiPLVersion
$piplData += Write-LittleEndianInt32 5   # atom count
$piplData += $atomKind
$piplData += $atomName
$piplData += $atomCatg
$piplData += $atomVers
$piplData += $atomEntry

$binPath = Join-Path $OutputDir "PiPL.bin"
[System.IO.File]::WriteAllBytes($binPath, $piplData)
Write-Host "Generated: $binPath ($($piplData.Length) bytes)"

$rcPath = Join-Path $OutputDir "PiPL.rc"
@"
// PiPL.rc - Auto-generated
LANGUAGE LANG_ENGLISH, SUBLANG_ENGLISH_US

16000 PiPL "PiPL.bin"
"@ | Out-File -FilePath $rcPath -Encoding ASCII
Write-Host "Generated: $rcPath"
