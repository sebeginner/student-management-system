$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

Write-Host "Starting Student Management System demo..."
Write-Host "Backend:  http://localhost:3000/api/v1"
Write-Host "Swagger:  http://localhost:3000/api"
Write-Host "Frontend: http://127.0.0.1:5173"

Start-Process powershell.exe -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$backend'; npm.cmd run start"
)

Start-Sleep -Seconds 2

Start-Process powershell.exe -ArgumentList @(
  "-NoExit",
  "-Command",
  "Set-Location '$frontend'; npm.cmd run dev -- --host 127.0.0.1 --port 5173"
)

Write-Host ""
Write-Host "Two PowerShell windows were opened. Keep both running while viewing the demo."
Write-Host "Open http://127.0.0.1:5173 in your browser."
