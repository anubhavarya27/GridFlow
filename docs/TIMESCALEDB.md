# TimescaleDB in GridPulse — hypertable, continuous aggregates, and why

> **Verification status (read first).** The TimescaleDB SQL in this project
> (`04_timescale_hypertable.sql`, `05_continuous_aggregates.sql`, `09_post_load.sql`,
> the `pg_*` benchmark files) targets **TimescaleDB 2.17 on PostgreSQL 16** (the
> `timescale/timescaledb:2.17.2-pg16` image in `database/docker-compose.yml`). The
> development environment used to build GridPulse could not install TimescaleDB (no
> package source was reachable and building the extension from source was not
> permitted), so these scripts have **not yet been executed against a real TimescaleDB
> server**. Everything else was verified on PostgreSQL 16.15. Until you run
> `docker compose up -d` and `99_validation.sql` reports no FAIL, treat the hypertable
> and continuous aggregates as **implemented but unverified**. The backend never
> pretends otherwise: `/api/health` reports `timescaledb: NOT_INSTALLED` and the
> Performance Lab refuses to measure or claim anything for TimescaleDB.

## Why TimescaleDB instead of plain MySQL for this workload

Smart-meter data is append-mostly, time-ordered, and almost always read as
"consumption per meter per hour/day/month over a date range". For that shape:

| Need | MySQL 8 (U/BILL) | PostgreSQL + TimescaleDB |
|---|---|---|
| Keep recent data fast as history grows | one large InnoDB B-tree; range scans touch an ever-growing index | hypertable split into 7-day chunks; a date-range query only opens the chunks in range (chunk exclusion) |
| Time bucketing in local time | `DATE(CONVERT_TZ(...))` expressions, recomputed per query | `time_bucket('1 day', ts, 'Asia/Kolkata')` |
| Pre-computed daily/hourly totals that stay correct when new readings arrive | manual summary tables + triggers or batch jobs | continuous aggregates with refresh policies and real-time aggregation for not-yet-materialized rows |
| Billing data and time series in one place with foreign keys | yes | yes — the hypertable has a FK to `meter`, and bills, payments and readings stay in one transactional database |
| Mature SQL (window functions, CTEs, JSONB, roles) | partial | full PostgreSQL |

These are **expected** benefits from how the systems work. Whether they translate into
faster queries for *this* dataset is exactly what the Performance Lab measures; see
[PERFORMANCE_LAB.md](PERFORMANCE_LAB.md). No speed-up is claimed until it is measured.

## Which features need TimescaleDB

| Feature | Needs TimescaleDB | File |
|---|---|---|
| `create_hypertable('meter_interval_reading', 'reading_time', 7 days)` | yes | `04_timescale_hypertable.sql` |
| `time_bucket(interval, ts, 'Asia/Kolkata')` | yes | `05`, `database/benchmark/pg_*_raw.sql` |
| `cagg_meter_hourly`, `cagg_meter_daily` (`timescaledb.continuous`, real-time aggregation on) | yes | `05_continuous_aggregates.sql` |
| `add_continuous_aggregate_policy` background refresh jobs | yes | `05` |
| `refresh_continuous_aggregate`, `hypertable_size`, `timescaledb_information.*` | yes | `09_post_load.sql`, `99_validation.sql`, `BenchmarkService` |
| Tables, PK/FK/UNIQUE/CHECK, identity columns, JSONB, triggers, views, roles/grants, window functions | no — PostgreSQL | `00`, `02`, `03`, `06`, `07`, `08` |
| Analytics, alerts, forecasts in the backend | read the continuous aggregates, so yes at runtime | `AnalyticsRepository` |

`01_extensions.sql` runs `CREATE EXTENSION timescaledb` and **stops with an error** if it
is missing; the setup never silently continues on plain PostgreSQL.

## Design decisions

### Two reading tables

`METER_READING` (U/BILL) is keyed by `(meter_id, reading_no)`. TimescaleDB requires every
primary key / unique index on a hypertable to include the time column, so converting it
would change its identity to `(meter_id, reading_no, reading_date)` and stop guaranteeing
one reading number per meter. GridPulse therefore keeps `METER_READING` unchanged for
billing-cycle reads and adds `METER_INTERVAL_READING` with the natural time-series key
`(meter_id, reading_time)`. No table has a foreign key *into* the hypertable, so the
"no FKs referencing hypertables" restriction does not apply; the hypertable's own FK to
`meter` is supported.

### Cumulative registers → interval consumption

Meters report a **cumulative register**. Summing register values is meaningless, so each
row stores `interval_consumption = register − previous register of the same meter`
(computed by `BillingService.addIntervalReading` and by the dataset generator). A lower
register is rejected unless `register_reset = true`; on a reset the interval consumption is
the new register value. `interval_minutes` records the gap since the previous reading, so a
catch-up reading after an outage is visible. All aggregates `SUM(interval_consumption)` and
never `SUM(register_value)`. Tests check that the daily sums equal register differences
(`AnalyticsIntegrationTest.cumulativeRegisterDeltaEqualsSumOfIntervals`).

A reading is attributed to the bucket of its timestamp (interval-ending convention).

### Time zone

Customers are in Chennai (IST, UTC+05:30, no daylight saving). Buckets are aligned to
local midnight/hour with `time_bucket(..., 'Asia/Kolkata')`; UTC-aligned day buckets would
split every local day at 05:30.

### Chunk size

7 days (TimescaleDB default). With 10 meters at 15-minute intervals that is ~6,700 rows per
chunk. Kept at the default so the benchmark does not depend on hand-tuning.

### Continuous aggregates and refresh strategy

| Aggregate | Bucket | Policy (start_offset / end_offset / schedule) | Used by |
|---|---|---|---|
| `cagg_meter_hourly` | 1 hour IST | 3 days / 1 hour / every 15 min | analytics `interval=hour` |
| `cagg_meter_daily` | 1 day IST | 7 days / 1 hour / every 30 min | analytics day/week/month, anomaly detection, forecasts, dashboard insights, Performance Lab |

Both are created with `timescaledb.materialized_only = false` (real-time aggregation):
rows newer than the last refresh are aggregated from the raw hypertable at query time and
combined with the materialized part, so a reading inserted through the API shows up in the
charts immediately. The policies then materialize it in the background. `09_post_load.sql`
refreshes both aggregates over the whole history after a bulk load.

Besides the total, each bucket keeps `reading_count`, `covered_minutes`,
`max_interval_minutes`, `has_reset` and `non_valid_count`, which the backend uses for data
quality decisions (gaps, resets, estimated readings).

### How the analytics endpoints use them

| Endpoint / feature | Source |
|---|---|
| `/api/analytics/consumption?interval=hour` | `cagg_meter_hourly` |
| `interval=day` | `cagg_meter_daily` |
| `interval=week` / `month` | `cagg_meter_daily` rolled up with `date_trunc` in IST |
| `/api/analytics/comparison` | `cagg_meter_daily`, same-length previous period |
| `/api/analytics/readings` | raw hypertable (paged) |
| `/api/dashboard/consumption-insights` | `cagg_meter_daily` |
| anomaly detection | `cagg_meter_daily` |
| `/api/bills/estimate/{meterId}` | `cagg_meter_daily` for the current billing period |

Every analytics response includes a `source` field naming the aggregate it read.

## Test-only shim

`backend/src/test/resources/plain-postgres-test-shim.sql` defines a plain SQL
`time_bucket` and two ordinary views named like the aggregates so the integration tests
can run on a PostgreSQL server without TimescaleDB. It is **only** for tests. The
Performance Lab detects the missing extension and reports `TIMESCALEDB_NOT_INSTALLED`
instead of measuring the shim.

## Bring it up for real

```bash
cd database
cp .env.example .env              # choose passwords
docker compose up -d              # PostgreSQL 16 + TimescaleDB 2.17, MySQL 8
./scripts/setup.sh                # generate + load data, refresh aggregates, validate
psql "postgresql://gridpulse_app:...@localhost:5432/gridpulse" -f postgres/99_validation.sql
```

Expected: `timescaledb extension installed — PASS`, `hypertable — PASS`, both continuous
aggregates `PASS`, and only the two documented legacy-data WARN rows.
