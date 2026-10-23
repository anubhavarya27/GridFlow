# GridFlow TimescaleDB Setup

## Local Connection

- Host: localhost
- Port: 5433
- Database: gridflow
- Username: gridflow
- Password: configured locally in `.env`

The Docker port is bound to `127.0.0.1`, so the database is intended for
local development on this computer. The database uses a separate Docker volume.

## Start the Database

```powershell
docker compose -f .\compose.timescale.yml up -d
docker exec gridflow-timescale pg_isready -U gridflow -d gridflow
```

## Fresh Database Initialization

For a new, empty database volume, the Compose configuration mounts these
scripts in numerical order:

1. `001_schema.sql`
2. `002_auth.sql`
3. `003_timescale_hypertable.sql`
4. `004_sample_data.sql`
5. `005_database_benchmarks.sql`

Docker runs these initialization scripts only when initializing a new data
directory. Restarting an existing container does not rerun them.

## Existing Database

Before migrating an existing database:

1. Back up the database and verify that the backup can be restored.
2. Determine which migrations and database objects already exist.
3. Review the pending migration SQL and its assumptions.
4. Apply only the missing migration steps.
5. Verify the resulting schema and data.

Do not delete the database volume to rerun initialization scripts.

If migration `005_database_benchmarks.sql` has not been applied to an existing
database, review it and apply it separately after backing up and confirming
the target database.

## Meter-Reading Hypertable

Migration `003_timescale_hypertable.sql` converts `public.meter_reading` into
a TimescaleDB hypertable partitioned by `reading_date`, with one-month chunks.

The primary key changes from `(meter_id, reading_no)` to
`(meter_id, reading_no, reading_date)` because a hypertable's unique key must
include the partitioning column.

This change no longer enforces global uniqueness of `(meter_id, reading_no)`
across different dates. Confirm compatibility with the intended data model
before migrating an existing database.

## Verification

Check hypertable status:

```sql
SELECT hypertable_schema, hypertable_name
FROM timescaledb_information.hypertables
WHERE hypertable_schema = 'public'
  AND hypertable_name = 'meter_reading';
```

Check benchmark history:

```sql
SELECT to_regclass('public.database_benchmark_history')
    AS benchmark_history_table;
```

Check the daily continuous aggregate:

```sql
SELECT view_schema, view_name
FROM timescaledb_information.continuous_aggregates
WHERE view_schema = 'public'
  AND view_name = 'meter_reading_daily';
```

Check public base-table count:

```sql
SELECT COUNT(*) AS table_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
```

These checks verify object presence; they do not prove all application
workflows or migrations are correct.

## Security

- Never commit `.env` or real credentials.
- Keep the database port private unless remote access is required.
- Back up existing data before schema changes.
