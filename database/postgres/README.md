# GridFlow PostgreSQL and TimescaleDB Database

## Overview

GridFlow uses PostgreSQL with TimescaleDB for utility billing data and
time-series meter readings.

The database scripts are stored in this directory:

| Script | Purpose |
|---|---|
| `001_schema.sql` | Application schema |
| `002_auth.sql` | Authentication tables and related schema |
| `003_timescale_hypertable.sql` | Meter-reading hypertable configuration |
| `004_sample_data.sql` | Sample data |
| `005_database_benchmarks.sql` | Database benchmark objects |

Review each script before applying it to a database containing existing data.

## Local Connection

The supplied Docker Compose configuration uses:

- Host: `localhost`
- Port: `5433`
- Database: `gridflow`
- Username: `gridflow`
- Password: configured locally through `.env`

Never commit `.env` or real credentials to Git.

## Fresh Database Initialization

For a new, empty database, apply scripts in numerical order from `001` through
`005`.

The root `compose.timescale.yml` mounts these scripts into the container's
`/docker-entrypoint-initdb.d/` directory. Docker runs these initialization
scripts only when the PostgreSQL data directory is initialized for the first
time.

Starting an existing container does not rerun the initialization scripts.

## Existing Database

Before changing an existing database:

1. Take a database backup.
2. Confirm the backup can be restored.
3. Inspect which scripts have already been applied.
4. Review the pending migration and its assumptions.
5. Apply only the required migration steps.
6. Verify schema objects, constraints, and data afterward.

Do not delete the Docker volume to force initialization. Doing so can destroy
the local database contents.

## Database Verification

Check the application tables:

```sql
SELECT COUNT(*) AS table_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
```

Check the TimescaleDB hypertable:

```sql
SELECT hypertable_schema, hypertable_name
FROM timescaledb_information.hypertables
WHERE hypertable_schema = 'public'
  AND hypertable_name = 'meter_reading';
```

Check the benchmark history table:

```sql
SELECT to_regclass('public.database_benchmark_history')
    AS benchmark_history_table;
```

Check the daily meter-reading aggregate:

```sql
SELECT view_schema, view_name
FROM timescaledb_information.continuous_aggregates
WHERE view_schema = 'public'
  AND view_name = 'meter_reading_daily';
```

These queries inspect whether the expected objects exist. They do not by
themselves prove that all migrations or application workflows are correct.

## Related Documentation

See the root `README.md` for environment configuration, backend startup, and
build instructions.

See `TIMESCALE_SETUP.md` for database initialization and migration details.
