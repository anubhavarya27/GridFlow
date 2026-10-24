# Setup and run

Three components, three terminals. Order: **database → backend → frontend**.

## Prerequisites

| Tool | Version | For |
|---|---|---|
| Docker Desktop (or Docker Engine + Compose v2) | recent | PostgreSQL 16 + TimescaleDB 2.17 and legacy MySQL 8 containers |
| Python | 3.9+ | dataset generator, migration script (`pip install PyMySQL "psycopg[binary]"` only for migration) |
| JDK | 17+ | backend |
| Maven | 3.9+ (needs access to Maven Central) | backend build |
| Node.js | 20+ (22 tested) | frontend |

Without Docker: install PostgreSQL 16 with the TimescaleDB package for your OS
(see TimescaleDB's install docs) and MySQL 8, then follow "Manual setup" in
[`database/README.md`](../database/README.md).

## 1. Database

```bash
cd database
cp .env.example .env          # set the four passwords
docker compose up -d          # first start: roles, DB, extension, schema, hypertable, caggs, legacy data
./scripts/setup.sh            # Windows PowerShell: .\scripts\setup.ps1
```

`setup.sh` generates the **simulated** 15-minute dataset (up to "now"; `END=2026-10-24T00:00`
for a fixed one), loads it into TimescaleDB, refreshes the continuous aggregates, prints
`99_validation.sql` (expect no FAIL; two documented WARN rows), and loads the same readings
into the legacy MySQL for the Performance Lab.

Check: `docker compose exec timescaledb psql -U postgres -d gridpulse -c "\dx timescaledb"`.

## 2. Backend

```bash
cd backend
cp .env.example .env
#   DB_PASSWORD           = GRIDPULSE_APP_PASSWORD from database/.env
#   GRIDPULSE_TOKEN_SECRET = output of: openssl rand -hex 32
#   BENCHMARK_MYSQL_PASSWORD = GRIDPULSE_MYSQL_RO_PASSWORD from database/.env
mvn spring-boot:run           # http://localhost:5000/api/health
```

`/api/health` should return `"database":"UP","timescaledb":"2.17.x"`. Then:

```bash
node scripts/api-smoke-test.mjs        # 45 HTTP checks: login, roles, approvals, analytics …
mvn test                               # unit tests; integration tests need GRIDPULSE_TEST_DB_* (backend/README.md)
```

### Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | localhost, 5432, gridpulse, gridpulse_app, — | JDBC connection (change without touching code) |
| `DB_POOL_SIZE` | 10 | HikariCP pool |
| `BACKEND_PORT` | 5000 | HTTP port |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Vite dev server |
| `GRIDPULSE_DEMO_USER_PASSWORD`, `GRIDPULSE_DEMO_ADMIN_PASSWORD`, `GRIDPULSE_APPROVAL_PASSWORD` | — (account disabled if empty) | demo credentials |
| `GRIDPULSE_TOKEN_SECRET`, `GRIDPULSE_TOKEN_TTL_MINUTES` | random per start, 120 | session token signing |
| `BENCHMARK_MYSQL_URL`, `BENCHMARK_MYSQL_USER`, `BENCHMARK_MYSQL_PASSWORD` | — | legacy MySQL for the Performance Lab ("Not configured" if empty) |
| `BENCHMARK_SQL_DIR` | `../database/benchmark` | fixed benchmark SQL files |
| `GRIDPULSE_DETECT_ON_STARTUP` | true | run anomaly detection at startup |

## 3. Frontend

```bash
cd frontend
npm install
npm run dev                    # http://localhost:5173
# optional: cp .env.example .env and set VITE_API_BASE_URL
npm run build                  # production bundle in dist/
```

Sign in with `user` / `user123` or `admin` / `admin123`. The Approvals page and every
approve/reject ask for the approval password `admin1234`.

## Security notes

* **Demo credentials are plain text on purpose** (project brief). They are compared in
  `security/DemoCredentialStore`, supplied only through configuration, never sent to the
  browser, never returned by the API, logged or stored. Do not reuse them anywhere; a real
  system would store salted password hashes (BCrypt/Argon2) per user.
* `.env` files are git-ignored; only `.env.example` templates with placeholders are committed.
* The browser never talks to a database. Query Studio and the Performance Lab run on the
  server with restricted roles and fixed SQL respectively.
* Tokens are signed with HMAC-SHA256; set a long `GRIDPULSE_TOKEN_SECRET` so sessions survive
  restarts.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `01_extensions.sql` fails: extension "timescaledb" is not available | the PostgreSQL server has no TimescaleDB package — use the Docker image or install it |
| `/api/health` → `timescaledb: NOT_INSTALLED` | the backend points at a database without the extension; analytics will fail and the Performance Lab will measure nothing for PostgreSQL |
| Frontend shows "Unable to connect to the backend server" | backend not running on 5000, or `VITE_API_BASE_URL` wrong, or CORS origin missing |
| Performance Lab: MySQL "Not configured" / "Connection failed" | set `BENCHMARK_MYSQL_*`; the read-only user is created by `docker/mysql-init/99_readonly_user.sh` |
| Login works but every call returns 401 after a restart | no `GRIDPULSE_TOKEN_SECRET` set → random secret per start; sign in again |
