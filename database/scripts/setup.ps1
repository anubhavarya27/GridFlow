# =====================================================================
# GridPulse database setup (Windows PowerShell).  Run from database\ :
#   docker compose up -d
#   .\scripts\setup.ps1                      # dataset ends now
#   .\scripts\setup.ps1 -End 2026-10-24T00:00
# Same steps as scripts/setup.sh.
# =====================================================================
param([string]$End = "", [string]$Python = "python")
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

function Invoke-Step($cmd) {
    Write-Host "   > $cmd"
    Invoke-Expression $cmd
    if ($LASTEXITCODE -ne 0) { throw "Step failed (exit $LASTEXITCODE): $cmd" }
}

Write-Host "== 1/5 generating SIMULATED dataset"
if ($End) { Invoke-Step "$Python generator/generate_dataset.py --end $End" }
else      { Invoke-Step "$Python generator/generate_dataset.py" }

Write-Host "== 2/5 waiting for containers"
foreach ($c in @("gridpulse-timescaledb", "gridpulse-legacy-mysql")) {
    for ($i = 0; $i -lt 60; $i++) {
        $s = (docker inspect -f "{{.State.Health.Status}}" $c) 2>$null
        if ($s -eq "healthy") { break }
        Start-Sleep -Seconds 2
    }
    Write-Host "   $c : $s"
}

Write-Host "== 3/5 loading TimescaleDB"
Invoke-Step "docker compose exec -T -w /gridpulse/generated timescaledb psql -v ON_ERROR_STOP=1 -U postgres -d gridpulse -f /gridpulse/scripts/load_generated_postgres.sql"
Invoke-Step "docker compose exec -T timescaledb psql -v ON_ERROR_STOP=1 -U postgres -d gridpulse -f /gridpulse/postgres/09_post_load.sql"

Write-Host "== 4/5 validating"
Invoke-Step "docker compose exec -T timescaledb psql -U postgres -d gridpulse -f /gridpulse/postgres/99_validation.sql"

Write-Host "== 5/5 loading the benchmark table in legacy MySQL"
Invoke-Step "docker compose exec -T -w /gridpulse/generated mysql sh -c 'mysql --local-infile=1 -uroot -p`"`$MYSQL_ROOT_PASSWORD`" utility_billing_db < /gridpulse/scripts/load_generated_mysql.sql'"

Write-Host "Done. Start the backend (backend\README.md) and open the frontend."
