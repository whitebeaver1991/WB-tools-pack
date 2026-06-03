$bytes = [System.IO.File]::ReadAllBytes("$PSScriptRoot\PiPL.bin")
Write-Host "Total size: $($bytes.Length) bytes"
Write-Host "--- Hex dump ---"
for ($i = 0; $i -lt $bytes.Length; $i += 16) {
    $end = [Math]::Min($i+15, $bytes.Length-1)
    $hex = ($bytes[$i..$end] | ForEach-Object { "{0:X2}" -f $_ }) -join " "
    $ascii = ($bytes[$i..$end] | ForEach-Object { if ($_ -ge 32 -and $_ -le 126) { [char]$_ } else { "." } }) -join ""
    Write-Host ("{0:X4}:  {1,-48}  {2}" -f $i, $hex, $ascii)
}
