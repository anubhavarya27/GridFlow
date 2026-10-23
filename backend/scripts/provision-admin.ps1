$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($env:GRIDFLOW_DB_PASSWORD)) {
    throw 'Set GRIDFLOW_DB_PASSWORD in this PowerShell session before provisioning an administrator.'
}

$username = Read-Host 'Administrator username'
if ($username -notmatch '^[A-Za-z0-9._-]{1,50}$') {
    throw 'Use 1-50 letters, digits, periods, underscores, or hyphens for the username.'
}

$backendDirectory = Split-Path -Parent $PSScriptRoot
$classpathFile = Join-Path $backendDirectory 'target\provisioning.classpath'
Push-Location $backendDirectory
try {
    & .\mvnw.cmd -q -DskipTests -DincludeScope=runtime "-Dmdep.outputFile=$classpathFile" compile dependency:build-classpath
    if ($LASTEXITCODE -ne 0) { throw 'Could not prepare the password-hashing helper.' }

    $dependencyClasspath = (Get-Content -Raw $classpathFile).Trim()
    $classpath = "target\classes;$dependencyClasspath"
    $passwordHash = (& java -cp $classpath com.gridflow.backend.security.AdminPasswordHash).Trim()
    if ($LASTEXITCODE -ne 0 -or $passwordHash -notmatch '^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$') {
        throw 'The password-hashing helper did not return a valid BCrypt hash.'
    }

    $env:PGPASSWORD = $env:GRIDFLOW_DB_PASSWORD
    $sql = @"
INSERT INTO app_user (username, password_hash, role, account_status)
VALUES ('$username', '$passwordHash', 'ADMIN', 'ACTIVE')
ON CONFLICT (LOWER(username)) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    role = 'ADMIN',
    account_status = 'ACTIVE',
    updated_at = CURRENT_TIMESTAMP;
"@
    $sql | & psql -X -q -v ON_ERROR_STOP=1 -h localhost -p 5433 -U gridflow -d gridflow
    if ($LASTEXITCODE -ne 0) { throw 'Administrator provisioning failed.' }
    Write-Host 'Administrator account provisioned.'
}
finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
    Pop-Location
}
