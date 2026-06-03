param( [string]$OutputDir = "." )

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

function Add-PadToEven {
    param([byte[]]$Data)
    if (($Data.Length % 2) -eq 0) { return $Data }
    return $Data + [byte]0x00
}

function Write-PIProperty {
    param([string]$Key, [byte[]]$Data)
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

# Easy_Cheese_PiPL.r defines:
#   Kind { AEGP },
#   Name { "Easy_Cheese" },
#   Category { "General Plugin" },
#   Version { 196608 },
#   CodeWin64X86 {"EntryPointFunc"},

$atomKind = Write-PIProperty -Key "kind" -Data (Write-FourCharCode "AEGP")
$atomName = Write-PIProperty -Key "name" -Data (Write-PascalString "Easy_Cheese")
$atomCatg = Write-PIProperty -Key "catg" -Data (Write-PascalString "General Plugin")
$atomVers = Write-PIProperty -Key "vers" -Data (Write-LittleEndianInt32 196608)
$atomEntry = Write-PIProperty -Key "8664" -Data (Write-CString "EntryPointFunc")

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

@"
16000 PiPL "PiPL.bin"
"@ | Out-File -FilePath (Join-Path $OutputDir "PiPL.rc") -Encoding ASCII
