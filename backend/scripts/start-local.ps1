$ErrorActionPreference = 'Stop'

$rootDirectory = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$environmentFile = Join-Path $rootDirectory '.env'
if (-not (Test-Path -LiteralPath $environmentFile)) {
    throw "Create $environmentFile from the repository's .env.example first."
}

$allowedNames = @(
    'POSTGRES_PASSWORD',
    'GRIDFLOW_DB_PASSWORD',
    'GRIDFLOW_JWT_SECRET',
    'GRIDFLOW_APPROVAL_PASSWORD_HASH',
    'GRIDFLOW_FRONTEND_ORIGIN',
    'SERVER_PORT'
)
$previousValues = @{}
foreach ($line in Get-Content -LiteralPath $environmentFile) {
    if ($line -match '^\s*(?:#|$)') { continue }
    if ($line -notmatch '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$') {
        throw 'The .env file contains an invalid line.'
    }
    $name = $Matches[1]
    if ($name -notin $allowedNames) { continue }
    $value = $Matches[2].Trim().Trim('"').Trim("'")
    $previousValues[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
    [Environment]::SetEnvironmentVariable($name, $value, 'Process')
}

try {
    Push-Location (Join-Path $rootDirectory 'backend')
    & .\mvnw.cmd spring-boot:run
    if ($LASTEXITCODE -ne 0) { throw 'GridFlow backend exited with an error.' }
}
finally {
    Pop-Location
    foreach ($name in $previousValues.Keys) {
        [Environment]::SetEnvironmentVariable($name, $previousValues[$name], 'Process')
    }
}
