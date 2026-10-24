# GridPulse — Smart Utility Billing and Consumption Intelligence

**React · Java 17 / Spring Boot 3 / JDBC · PostgreSQL 16 + TimescaleDB**

GridPulse is the upgraded **U/BILL** utility billing system (academic DBMS project). It keeps
U/BILL's customers, properties, meters, readings, electricity/water services, tariffs, bills,
payments, dashboard, Database Explorer, Query Studio, Processing queue, approvals and reports,
and adds smart-meter time-series analytics, explainable consumption alerts, projected
month-end bills and a measured database performance lab.

```text
React (frontend/) ──HTTP/JSON──▶ Spring Boot REST API (backend/) ──JDBC──▶ PostgreSQL + TimescaleDB (database/)
                                                     └──JDBC, read-only──▶ legacy MySQL (Performance Lab baseline only)
```

## Repository layout

```text
GridPulse/
├── frontend/   React 19 + Vite UI (U/BILL design, extended)
├── backend/    Java 17 Spring Boot 3 API, JdbcTemplate repositories, tests
├── database/   PostgreSQL/TimescaleDB schema, migration, generator, benchmark SQL, legacy MySQL scripts
├── docs/       documentation
├── .gitignore
└── README.md
```

Details: [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md).

## Run it

```bash
# 1. database  (Docker: TimescaleDB 2.17 on PostgreSQL 16 + MySQL 8)
cd database && cp .env.example .env && docker compose up -d && ./scripts/setup.sh

# 2. backend   (http://localhost:5000/api)
cd backend && cp .env.example .env    # DB_PASSWORD, GRIDPULSE_TOKEN_SECRET, BENCHMARK_MYSQL_PASSWORD
mvn spring-boot:run
node scripts/api-smoke-test.mjs       # optional end-to-end check

# 3. frontend  (http://localhost:5173)
cd frontend && npm install && npm run dev
```

Full instructions, environment variables and troubleshooting: [docs/SETUP.md](docs/SETUP.md).

## Demo accounts (academic demonstration only)

| Username | Password | Role |
|---|---|---|
| `user` | `user123` | USER — read everything, submit Query Studio changes, mark alerts reviewed |
| `admin` | `admin123` | ADMIN — all changes, approvals, alert resolution, detection, benchmarks |
| Approval password | `admin1234` | required by the backend for every approve/reject, separate from the admin login |

> These passwords are **compared in plain text on purpose** because the project brief asks
> for it. They live only in backend configuration (`backend/.env`), are never sent to the
> browser, returned by the API, logged or stored. **This is not suitable for production**,
> where salted password hashes per user are required.

Authorization is enforced by the backend: every API call needs an HMAC-signed token, the
role comes from the token (editing browser storage changes nothing), ADMIN operations return
403 for USER, and approvals are audited in `approval_audit` without the password.

## What's new compared with U/BILL

| Feature | Where |
|---|---|
| Java/Spring Boot backend with JDBC (`JdbcTemplate`, HikariCP, parameterized SQL, transactions) replacing Node/Express; same endpoint paths and response envelope | `backend/` |
| PostgreSQL schema converted from MySQL with all keys and constraints; verified migration script | `database/postgres`, `database/migration` |
| TimescaleDB hypertable `meter_interval_reading` + continuous aggregates `cagg_meter_hourly`, `cagg_meter_daily` with refresh policies | `database/postgres/04, 05` |
| Dashboard: month-to-date consumption, change vs last month, estimated month-end bill, active alerts, alert preview, projected-bill panel | Dashboard |
| Consumption Analytics: meter/service filter, hour/day/week/month, period comparison, reading history, CSV export | `/analytics` |
| Explainable anomaly detection (trimmed 28-day baseline, configurable thresholds) and alert lifecycle NEW → REVIEWED → RESOLVED | `/alerts` |
| Predictive billing priced with the existing tariff rule, never stored as a bill | Dashboard, Billing Center, Meter Monitor |
| Meter detail panel, bill generation and payment recording (transactional) | Operations pages |
| Database Performance Lab: MySQL vs PostgreSQL raw vs continuous aggregate, real timings only | `/performance-lab` |
| Security fixes: all routes authenticated, ADMIN-only writes, approval password per action, sandboxed Query Studio | backend |

Feature details: [docs/FEATURES.md](docs/FEATURES.md) · Bill amount and estimate rules:
[docs/BILLING_RULES.md](docs/BILLING_RULES.md).

## Why TimescaleDB

Meter readings are append-only and queried as "consumption per meter per hour/day/month over
a range". TimescaleDB partitions them into time chunks (queries open only the chunks in range),
buckets time in local IST with `time_bucket`, and keeps hourly/daily totals up to date with
continuous aggregates — while the billing data stays in the same PostgreSQL database with
foreign keys and transactions. These are expected benefits; the Performance Lab measures
whether they hold for this dataset. More: [docs/TIMESCALEDB.md](docs/TIMESCALEDB.md).

## Verification status — please read

| Area | Status |
|---|---|
| Backend tests (120 unit + integration) | ✅ all pass on PostgreSQL 16.15 + MySQL 8.0.46 |
| API smoke test against the running backend | ✅ 44/45 — the failing check is "TimescaleDB is active" |
| Live MySQL → PostgreSQL migration + verification | ✅ VERIFICATION PASSED |
| Frontend build and browser walk-through (admin and user) | ✅ |
| **TimescaleDB extension, hypertable, continuous aggregates** | ⏳ **not verified** — TimescaleDB could not be installed in the development environment. Scripts target `timescale/timescaledb:2.17.2-pg16`; analytics were tested through a test-only plain-SQL shim |
| **Spring Boot startup** (`GridPulseApplication`, `WebConfig`, `AuthInterceptor`) | ⏳ not run — Maven Central was unreachable; all other classes were compiled and exercised through a harness that invokes the real controllers |
| Performance Lab TimescaleDB timings | ⏳ only the MySQL baseline was measured (daily median 323.9 ms, monthly 401.7 ms, 350,304 readings); **no TimescaleDB speed-up is claimed** |

To close the gaps: on a machine with Docker and Maven access run the three commands in
"Run it", check `/api/health` shows the TimescaleDB version, run `99_validation.sql`, the smoke
test, and one Performance Lab run. Details: [docs/TESTING.md](docs/TESTING.md),
[docs/PERFORMANCE_LAB.md](docs/PERFORMANCE_LAB.md).

## Known limitations

* The time series is **simulated** (`data_source = 'SIMULATED'`), anchored to the legacy
  readings; the original archive contained only three readings per meter.
* No customer-facing accounts: U/BILL's users were never linked to customers, so `USER` is a
  read-only staff role rather than a per-customer login.
* Tariffs are flat per unit (the data model has no slabs); the fixed charge + tax part of the
  bill amount is a documented interpretation of existing attributes.
* Units are inferred from the service type (kWh for electricity, kL for water) because the
  model stores none.
* Anomaly thresholds are illustrative starting values, not standards, and ignore seasonality.
* Legacy data inconsistencies (payment 9008, legacy payment amounts) are reported, not edited.
* The Query Studio no longer executes DDL from the browser (U/BILL did); schema changes go
  through `database/postgres`.

## Documentation

| Document | Contents |
|---|---|
| [MIGRATION_PLAN.md](docs/MIGRATION_PLAN.md) | what U/BILL actually contained, risks, phased plan |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | system architecture diagram, layers, request flows |
| [DATABASE.md](docs/DATABASE.md) | updated EER diagram and relational schema, roles |
| [DATABASE_MIGRATION.md](docs/DATABASE_MIGRATION.md) | MySQL → PostgreSQL conversion, corrections, verified migration |
| [TIMESCALEDB.md](docs/TIMESCALEDB.md) | hypertable, continuous aggregates, refresh policy, why TimescaleDB |
| [API_CONTRACT.md](docs/API_CONTRACT.md) | every endpoint, parameters, examples, errors, authorization |
| [FEATURES.md](docs/FEATURES.md) | modules, anomaly algorithm, predictive billing |
| [BILLING_RULES.md](docs/BILLING_RULES.md) | bill amount, generation, payments, estimates |
| [PERFORMANCE_LAB.md](docs/PERFORMANCE_LAB.md) | benchmark methodology and measured results |
| [SETUP.md](docs/SETUP.md) | installation, environment variables, security notes |
| [TESTING.md](docs/TESTING.md) | tests run, acceptance checklist, manual checks |
| [DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) | 15-minute evaluation walkthrough |
| [ACADEMIC.md](docs/ACADEMIC.md) | DBMS concepts and team contributions |
| `backend/README.md`, `database/README.md` | component-level details |

## Team

| Team Member | Registration No. | Role (U/BILL) |
|---|---|---|
| **Arya Anubhav** | 25BCE5407 | Frontend Development & System Integration |
| **Tarang Gupta** | 25BCE5383 | Backend & API Development |
| **Amrit Nitin** | 25BCE5385 | Database & SQL Development |

Developed for academic and educational purposes.
