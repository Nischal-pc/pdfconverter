$root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Starting PdfFlow backend on port 5000..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\server'; node index.js"

Start-Sleep -Seconds 2

Write-Host "Starting PdfFlow frontend on port 3000..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\client'; npm run dev"

Start-Sleep -Seconds 5

Write-Host "Opening http://localhost:3000"
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "Keep BOTH PowerShell windows open while using PdfFlow."
