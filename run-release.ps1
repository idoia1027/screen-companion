Set-Location -LiteralPath $PSScriptRoot

Get-Process |
  Where-Object { $_.ProcessName -like 'Screen Companion*' -or $_.ProcessName -like 'electron*' } |
  Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Milliseconds 500

$exe = Join-Path $PSScriptRoot 'release\win-unpacked\Screen Companion.exe'
Start-Process -FilePath $exe
