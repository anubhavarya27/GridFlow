# GridPulse — database

PostgreSQL 16 + **TimescaleDB 2.17** for both the relational billing domain and the
smart-meter time series, plus the original U/BILL MySQL scripts (kept as the
migration source and the Performance Lab baseline).

```text
database/
├── docker-compose.yml          TimescaleDB (new) + MySQL 8 (legacy U/BILL) containers
├── .env.example                passwords for docker-compose (copy to .env)
├── postgres/                   GridPulse schema, run in this order
│   ├── 00_roles_and_database.sql     roles gridpulse_app / _query_reader / _query_writer, DB gridpulse
│   ├── 01_extensions.sql             CREATE EXTENSION timescaledb            [TimescaleDB]
│   ├── 02_schema.sql                 20 U/BILL tables converted from MySQL + meter_interval_reading
│   ├── 03_application_tables.sql     app_users, access_requests, query_request, approval_audit,
│   │                                 consumption_alert, benchmark_run
│   ├── 04_timescale_hypertable.sql   meter_interval_reading -> hypertable     [TimescaleDB]
│   ├── 05_continuous_aggregates.sql  cagg_meter_hourly, cagg_meter_daily + refresh policies [TimescaleDB]
│   ├── 06_legacy_data.sql            the original U/BILL sample data (unchanged)
│   ├── 07_views.sql                  v_meter_profile (service type, unit, owners)
│   ├── 08_query_studio_privileges.sql least-privilege grants for Query Studio
│   ├── 09_post_load.sql              refresh continuous aggregates, ANALYZE   [TimescaleDB]
│   └── 99_validation.sql             PASS / WARN / FAIL report
├── legacy-mysql/               original U/BILL scripts 01-09 (unchanged) + 10_benchmark_interval_readings.sql
├── generator/generate_dataset.py   reproducible SIMULATED 15-minute readings, bills, payments
├── migration/migrate_mysql_to_postgres.py   live MySQL -> PostgreSQL copy + verification
├── benchmark/*.sql             fixed Performance Lab workloads (PostgreSQL raw / cagg, MySQL raw)
├── scripts/                    setup.sh, setup.ps1, load_generated_postgres.sql, load_generated_mysql.sql
└── docker/                     container init scripts
```

## Quick start (Docker — recommended)

Requirements: Docker Desktop, Python 3.9+.

```bash
cd database
cp .env.example .env            # choose passwords
docker compose up -d            # first start creates roles, schema, hypertable, caggs, legacy data
./scripts/setup.sh              # Windows: .\scripts\setup.ps1
#   1 generates the SIMULATED dataset (634,450 readings to "now")
#   2 loads it into TimescaleDB, 3 refreshes the continuous aggregates,
#   4 prints 99_validation.sql,  5 loads the same readings into legacy MySQL
```

For a fixed, reproducible dataset use `END=2026-10-24T00:00 ./scripts/setup.sh`
(`-End 2026-10-24T00:00` in PowerShell). Same seed + same end = byte-identical files.

`99_validation.sql` must report **no FAIL**. Two WARN rows are expected — they are
inconsistencies in the original U/BILL sample data, deliberately not edited:

| WARN | Meaning |
|---|---|
| payment 9008 is `UPI` but has a `CARD_PAYMENT` row | legacy data entry error |
| 18 legacy Paid bills: payment ≠ derived amount | U/BILL never stored a bill amount; the legacy payments do not follow any formula present in the data (see docs/BILLING_RULES.md) |

## Manual setup (existing PostgreSQL 16 with TimescaleDB installed)

```bash
psql -U postgres -d postgres  -v app_password='...' -f postgres/00_roles_and_database.sql
psql -U postgres -d gridpulse -f postgres/01_extensions.sql
for f in 02 03 04 05 06 07 08; do psql -U postgres -d gridpulse -f postgres/${f}_*.sql; done
python3 generator/generate_dataset.py
cd generated && psql -U gridpulse_app -d gridpulse -f ../scripts/load_generated_postgres.sql && cd ..
psql -U gridpulse_app -d gridpulse -f postgres/09_post_load.sql
psql -U gridpulse_app -d gridpulse -f postgres/99_validation.sql
```

`01_extensions.sql` stops with an error if TimescaleDB is not installed — GridPulse never
silently falls back to plain PostgreSQL.

## Migrating a live U/BILL MySQL database

```bash
pip install PyMySQL "psycopg[binary]"
export MYSQL_HOST=localhost MYSQL_USER=gridpulse_ro MYSQL_PASSWORD=... MYSQL_DATABASE=utility_billing_db
export PGHOST=localhost PGUSER=gridpulse_app PGPASSWORD=... PGDATABASE=gridpulse
python3 migration/migrate_mysql_to_postgres.py migrate --replace --include-app-tables
python3 migration/migrate_mysql_to_postgres.py verify      # read-only re-check at any time
```

`migrate` copies all 20 domain tables (and optionally users without password hashes,
access_requests, QUERY_REQUEST) in **one PostgreSQL transaction**, then verifies row counts,
a SHA-256 fingerprint of every row of every table, per-bill units and payment totals, and
orphan checks. If anything differs it **rolls back**. MySQL is only read, never modified.

## TimescaleDB vs plain PostgreSQL

| Feature | Needs TimescaleDB | Where |
|---|---|---|
| Hypertable `meter_interval_reading` (7-day chunks) | yes | 04 |
| `time_bucket(..., 'Asia/Kolkata')` time-zone-aware buckets | yes | 05, benchmark SQL |
| Continuous aggregates `cagg_meter_hourly`, `cagg_meter_daily` (real-time aggregation on) | yes | 05 |
| Refresh policies (background jobs) | yes | 05 |
| `refresh_continuous_aggregate`, `hypertable_size`, `timescaledb_information.*` | yes | 09, 99, backend |
| Tables, PK/FK/UNIQUE/CHECK, identity, JSONB, triggers, views, roles/grants | no (PostgreSQL) | 00, 02, 03, 06, 07, 08 |

Design notes (why two reading tables, the cumulative-register rule, time zone, chunk
size, refresh strategy) are in [docs/TIMESCALEDB.md](../docs/TIMESCALEDB.md); MySQL→PostgreSQL
conversion details and schema corrections are in
[docs/DATABASE_MIGRATION.md](../docs/DATABASE_MIGRATION.md).

## Simulated data

Everything produced by `generator/generate_dataset.py` is **synthetic**
(`meter_interval_reading.data_source = 'SIMULATED'`, plus bills ≥ 5031 and payments ≥ 9020).
The register is anchored to the legacy readings of 1 Jan, 1 Feb and 1 Mar 2025, so the
legacy bills remain consistent with the time series. `generated/manifest.json` records the
parameters, row counts, checksums and the injected anomalies / gaps that the backend's
anomaly-detection test uses as ground truth.
