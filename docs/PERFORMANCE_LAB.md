# Database Performance Lab — methodology and results

The Performance Lab (`/performance-lab` in the UI, `GET /api/benchmark/summary`,
`POST /api/benchmark/run`) compares the same consumption-aggregation workload on:

| Method | Engine | Query file |
|---|---|---|
| `PG_RAW` | PostgreSQL + TimescaleDB, raw hypertable with `time_bucket` | `database/benchmark/pg_daily_raw.sql`, `pg_monthly_raw.sql` |
| `PG_CAGG` | PostgreSQL + TimescaleDB, continuous aggregate `cagg_meter_daily` | `pg_daily_cagg.sql`, `pg_monthly_cagg.sql` |
| `MYSQL_RAW` | legacy U/BILL MySQL 8, same readings in `meter_interval_reading` | `mysql_daily_raw.sql`, `mysql_monthly_raw.sql` |

Workloads: **DAILY** (consumption per meter per local day) and **MONTHLY** (per meter per
local month), over the same range, with the same result definition:
`(meter_id, local period, SUM(interval_consumption), COUNT(*))`.

## Data flow

```text
Performance Lab UI → POST /api/benchmark/run {repetitions}  (ADMIN only, 3–30 repetitions)
  → BenchmarkService: read metadata from both databases
  → for each workload × method: 2 warm-ups, N timed runs (prepared statement, one connection)
  → result equivalence check vs PG_RAW
  → EXPLAIN (ANALYZE, BUFFERS) / MySQL EXPLAIN ANALYZE once, separately
  → stored in benchmark_run (JSONB) → GET /api/benchmark/summary → charts and tables
```

No SQL is accepted from the browser; only the fixed files in `database/benchmark/` run.
Nothing is hard-coded: every number on the page comes from a stored, measured run.

## Methodology (as implemented in `BenchmarkService`)

1. **Range:** the last 365 complete local days (Asia/Kolkata) that contain data. Every
   method uses the same instants.
2. **Same data:** before timing MySQL, the row count and total consumption of the range are
   compared between the databases. If they differ → `Comparison unavailable`.
3. **Warm-up:** 2 untimed executions per method (reported separately).
4. **Timing:** `System.nanoTime()` from `executeQuery()` until the backend has read the
   last row — what the application actually experiences (includes JDBC transfer/decoding).
5. **Statistics:** median, mean, min, max, p95, standard deviation from the N samples.
6. **Equivalence:** each result set is compared with `PG_RAW` on keys, reading counts and
   totals (|difference| ≤ 0.0001). A speed-up is reported **only** for equivalent results;
   otherwise the comparison is flagged invalid.
7. **Continuous aggregate state:** `PG_CAGG` is timed only if the aggregate is materialized
   for the whole range (so real-time aggregation of raw rows cannot distort it). Otherwise
   the status says what setup is missing.
8. **Plans:** `EXPLAIN (ANALYZE, BUFFERS)` (PostgreSQL) and `EXPLAIN ANALYZE` (MySQL) run once
   per method, outside the timed runs, and are shown separately from the timings.
9. **Caches are warm** (OS and DB buffers are not flushed). Results describe this machine,
   this configuration and this dataset only.

### Status values shown instead of numbers

`NOT_CONFIGURED` (no MySQL URL), `CONNECTION_FAILED` (no secrets are echoed),
`SCHEMA_UNAVAILABLE` (benchmark table missing), `TIMESCALEDB_NOT_INSTALLED`,
`CAGG_NOT_CREATED`, `CAGG_NOT_REFRESHED` (not materialized for the whole range),
`COMPARISON_UNAVAILABLE` (datasets differ). Non-equivalent results are marked
`equivalent: false` and get no speed-up. The UI never substitutes sample numbers.

## Results measured in the development environment

**Run #10, 24 Oct 2026 02:53 IST, 10 timed repetitions + 2 warm-ups per method.**

| Item | Value |
|---|---|
| Machine | Linux x86-64 container, 2 vCPU, Java 21, backend and both databases on the same host |
| PostgreSQL | 16.15 — **TimescaleDB not installed** |
| MySQL | 8.0.46, `utility_billing_db`, data 41.6 MB + index 16.5 MB |
| Dataset (simulated) | 634,450 interval readings, 10 meters; range 24 Oct 2025 → 24 Oct 2026 = 350,304 readings, total 22,850.045 units, identical in both databases |

| Workload | Method | Status | Median | Mean | Min | Max | p95 | Rows |
|---|---|---|---|---|---|---|---|---|
| DAILY | PG_RAW | TIMESCALEDB_NOT_INSTALLED | — | — | — | — | — | — |
| DAILY | PG_CAGG | TIMESCALEDB_NOT_INSTALLED | — | — | — | — | — | — |
| DAILY | MYSQL_RAW | MEASURED | 323.9 ms | 374.7 ms | 302.2 ms | 769.8 ms | 769.8 ms | 3,649 |
| MONTHLY | PG_RAW | TIMESCALEDB_NOT_INSTALLED | — | — | — | — | — | — |
| MONTHLY | PG_CAGG | TIMESCALEDB_NOT_INSTALLED | — | — | — | — | — | — |
| MONTHLY | MYSQL_RAW | MEASURED | 401.7 ms | 410.6 ms | 376.4 ms | 484.3 ms | 484.3 ms | 130 |

MySQL plan (both workloads): full table scan of `meter_interval_reading` (634,450 rows),
filter to 350,304 rows, aggregate in a temporary table, sort. The `reading_time` index is
not used because the range covers about 55 % of the table.

**Conclusion so far:** only the MySQL baseline could be measured here. **No TimescaleDB
result and no speed-up is claimed.** Run the lab against the Docker TimescaleDB setup to
obtain the PostgreSQL numbers; the page will then show the comparison automatically, and
only if the results are equivalent.

### What to expect (not a measurement)

The continuous aggregate reads ~3,650 pre-aggregated daily rows instead of aggregating
~350,000 raw rows, so it is expected to be much faster for these workloads; the raw
hypertable query is expected to be in the same order of magnitude as MySQL. Whether that
holds on your machine is what the measurement is for. Factors that change results:
dataset size (try a longer `--start` in the generator), whether the aggregate is fully
materialized, chunk count, cache state, `work_mem`, and running everything on one host.

## Reproduce

```bash
cd database && docker compose up -d && ./scripts/setup.sh     # same CSVs into both DBs
cd ../backend && mvn spring-boot:run                          # BENCHMARK_MYSQL_* set in .env
# UI: sign in as admin → Performance Lab → RUN MEASUREMENT
# or: RUN_BENCHMARK=1 node scripts/api-smoke-test.mjs
```

You can also run the files by hand: `psql … -v` with the two timestamps, or MySQL with the
two UTC datetimes, to cross-check a single timing outside the application.
