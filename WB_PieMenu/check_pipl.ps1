$path = "build\Release\WB_PieMenu.aex"
$fullPath = Resolve-Path $path
$bytes = [System.IO.File]::ReadAllBytes($fullPath.Path)
$target = [byte[]]@(0x41, 0x45, 0x67, 0x78)  # "AEgx"

for ($i = 0; $i -lt $bytes.Length - 4; $i++) {
    $found = $true
    for ($j = 0; $j -lt 4; $j++) {
        if ($bytes[$i + $j] -ne $target[$j]) { $found = $false; break }
    }
    if ($found) {
        Write-Host "FOUND 'AEgx' at offset 0x$('{0:X}' -f $i)"
        Write-Host "Checking for '8664' and 'catg' in same region..."
        $regionStart = [Math]::Max(0, $i - 64)
        $regionEnd = [Math]::Min($bytes.Length, $i + 128)
        $asciiStr = ""
        for ($k = $regionStart; $k -lt $regionEnd; $k++) {
            $c = [char]$bytes[$k]
            if ($bytes[$k] -ge 32 -and $bytes[$k] -le 126) { $asciiStr += $c } else { $asciiStr += "." }
        }
        Write-Host "ASCII context: [$asciiStr]"
        
        if ($asciiStr -match "8664") { Write-Host "Confirmed '8664' (Win64 code key) present: YES" } else { Write-Host "Confirmed '8664' (Win64 code key) present: NO" }
        if ($asciiStr -match "catg") { Write-Host "Confirmed 'catg' (category key) present: YES" } else { Write-Host "Confirmed 'catg' (category key) present: NO" }
        if ($asciiStr -match "name") { Write-Host "Confirmed 'name' present: YES" } else { Write-Host "Confirmed 'name' present: NO" }
        if ($asciiStr -match "kind") { Write-Host "Confirmed 'kind' present: YES" } else { Write-Host "Confirmed 'kind' present: NO" }
        if ($asciiStr -match "EntryPointFunc") { Write-Host "Confirmed 'EntryPointFunc' present: YES" } else { Write-Host "Confirmed 'EntryPointFunc' present: NO" }
        if ($asciiStr -match "prPi") { Write-Host "Confirmed 'prPi' present: YES" } else { Write-Host "Confirmed 'prPi' present: NO" }
        if ($asciiStr -match "8BIM") { Write-Host "Confirmed '8BIM' present: YES" } else { Write-Host "Confirmed '8BIM' present: NO" }
        break
    }
}
if ($i -ge $bytes.Length - 4) { Write-Host "NOT FOUND" }
