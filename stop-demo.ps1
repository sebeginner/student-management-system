$ports = @(3000, 5173)

foreach ($port in $ports) {
  $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue

  foreach ($connection in $connections) {
    $processId = $connection.OwningProcess

    if ($processId) {
      Write-Host "Stopping process $processId on port $port"
      Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
  }
}

Write-Host "Demo servers stopped."
