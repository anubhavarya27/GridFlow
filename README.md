# GridFlow

Smart Utility Billing and Resource Management System.

GridFlow is a Spring Boot REST API for utility customers, properties, ownership,
meter readings, bills, payments, tariffs, utility services, dashboard data,
projected bills, analytics, and database benchmarks.

## Technology Stack

- Java 21
- Spring Boot 4.1.1
- Maven
- PostgreSQL / TimescaleDB
- Spring Security and JWT authentication

## Project Structure

- `backend/` — Spring Boot application and automated tests
- `database/postgres/001_schema.sql` — Application schema
- `database/postgres/002_auth.sql` — Authentication schema
- `database/postgres/003_timescale_hypertable.sql` — Meter-reading hypertable setup
- `database/postgres/004_sample_data.sql` — Sample data
- `database/postgres/005_database_benchmarks.sql` — Benchmark database objects
- `compose.timescale.yml` — Local TimescaleDB configuration
- `.env.example` — Environment variable template

## Prerequisites

Install Java 21, Docker Desktop, and Git.

## Configure Environment Variables

Create your local environment file:

```powershell
Copy-Item .env.example .env
```

Edit `.env` locally and set these variables:

- `POSTGRES_PASSWORD` — Password used to initialize the database container
- `GRIDFLOW_DB_PASSWORD` — Password used by the backend to connect to PostgreSQL
- `GRIDFLOW_JWT_SECRET` — Secret used for JWT signing
- `GRIDFLOW_APPROVAL_PASSWORD_HASH` — BCrypt hash of the approval password

For the supplied local database configuration, `POSTGRES_PASSWORD` and
`GRIDFLOW_DB_PASSWORD` should match.

Use a strong JWT secret that meets the requirements of the existing
`JwtService`. Set a valid BCrypt hash for the approval password. Never commit
`.env` or share its real values.

## Start TimescaleDB

From the project root:

```powershell
docker compose -f compose.timescale.yml up -d
docker exec gridflow-timescale pg_isready -U gridflow -d gridflow
```

The supplied configuration uses localhost port `5433` and database `gridflow`.
The database port is intended for local development.

## Initialize a New Database

For a new, empty database, review and apply the SQL files in this order:

1. `database/postgres/001_schema.sql`
2. `database/postgres/002_auth.sql`
3. `database/postgres/003_timescale_hypertable.sql`
4. `database/postgres/004_sample_data.sql`
5. `database/postgres/005_database_benchmarks.sql`

Example for applying the first script:

```powershell
Get-Content -Raw .\database\postgres\001_schema.sql |
    docker exec -i gridflow-timescale psql -U gridflow -d gridflow
```

Repeat for each subsequent file, checking its output before proceeding.
Do not blindly reapply initialization scripts to a database that already
contains data. Back up existing data before schema changes.

See `database/postgres/README.md` and
`database/postgres/TIMESCALE_SETUP.md` for additional details.

## Run the Backend

Open PowerShell in the project root. Load the local `.env` variables into the
current process and start Spring Boot:

```powershell
Get-Content .\.env | ForEach-Object {
    if ($_ -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$' -and
        $_ -notmatch '^\s*#') {
        $key = $matches[1]
        $value = $matches[2].Trim().Trim('"').Trim("'")
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

.\backend\mvnw.cmd -f .\backend\pom.xml spring-boot:run
```

The backend is configured to listen on port `8080`.

## Build and Automated Tests

Run Maven verification:

```powershell
.\backend\mvnw.cmd -f .\backend\pom.xml verify
```

To request a clean build when generated files are not locked:

```powershell
.\backend\mvnw.cmd -f .\backend\pom.xml clean verify
```

A successful build does not replace live API and database integration testing.

## API Reference

Base URL for local development: `http://localhost:8080`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health check; public |
| POST | `/api/auth/login` | Authenticate a user |
| POST | `/api/auth/verify-approval` | Verify administrator approval credentials |
| GET | `/api/customers` | List customers |
| GET | `/api/customers/{customerId}` | Retrieve a customer |
| GET | `/api/properties` | Retrieve properties |
| GET | `/api/meters` | Retrieve meters |
| GET | `/api/ownerships` | List ownership records |
| GET | `/api/ownerships/customer/{customerId}` | Retrieve ownerships for a customer |
| GET | `/api/meter-readings` | Retrieve meter readings |
| GET | `/api/meter-readings/meter/{meterId}` | Retrieve readings for a meter |
| GET | `/api/meter-readings/consumption` | Retrieve consumption data |
| GET | `/api/meter-readings/daily-aggregate` | Retrieve daily aggregates |
| GET | `/api/meter-readings/alerts` | Retrieve meter-reading alerts |
| GET | `/api/bills` | List bills |
| GET | `/api/bills/{billId}` | Retrieve a bill |
| GET | `/api/bills/projected` | Retrieve projected bills |
| GET | `/api/payments` | List payments |
| GET | `/api/payments/bill/{billId}` | Retrieve payments for a bill |
| GET | `/api/payment-details/{resource}` | Retrieve payment details |
| GET | `/api/tariffs` | List tariffs |
| GET | `/api/tariffs/{tariffCode}` | Retrieve a tariff |
| GET | `/api/services` | List utility services |
| GET | `/api/services/electricity` | Retrieve electricity service information |
| GET | `/api/services/water` | Retrieve water service information |
| GET | `/api/dashboard/summary` | Dashboard summary |
| GET | `/api/dashboard/bill-status` | Dashboard bill status |
| GET | `/api/dashboard/payment-methods` | Dashboard payment methods |
| GET | `/api/dashboard/consumption` | Dashboard consumption |
| GET | `/api/dashboard/revenue` | Dashboard revenue |
| POST | `/api/database/benchmarks/run` | Run database benchmarks |
| GET | `/api/database/benchmarks/history?limit=5` | Retrieve benchmark history; `limit` defaults to 20 and must be between 1 and 100 |

### Authentication and Authorization

- `GET /api/health` and `POST /api/auth/login` are configured as public routes.
- Other application endpoints require authentication unless explicitly configured otherwise.
- Administrator-only routes include `/api/admin/**` and `/api/database/benchmarks/**`.
- Benchmark execution requires an authenticated administrator and a valid `X-Approval-Token` header.
- The approval verification endpoint is restricted to authenticated administrators by the current security configuration.
- Obtain the exact login and approval request fields from the DTO classes and controller implementations.
- The table documents route mappings; request schemas, response examples, and runtime behavior should be verified separately.
## Security Notes

- Never commit `.env`, passwords, or signing secrets.
- Use strong, locally generated secrets.
- Configure a valid BCrypt approval-password hash.
- Keep database ports private unless remote access is explicitly required.
- Back up existing data before applying schema changes.

## Development Status

The project includes backend controllers and services, database scripts, and
automated tests. Runtime API behavior, database integration, and deployment
readiness must be verified separately before release.


## API Documentation (Swagger)

When the GridFlow backend is running locally:

- Swagger UI: http://localhost:8080/swagger-ui/index.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs

Swagger documentation endpoints are publicly accessible. API endpoints remain protected by Spring Security. Use a valid JWT bearer token in Swagger's Authorize feature for protected endpoints. Administrator-only endpoints require an administrator account.
