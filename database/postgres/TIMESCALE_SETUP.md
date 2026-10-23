# GridFlow TimescaleDB Setup

## Local connection

- Host: localhost
- Port: 5433
- Database: gridflow
- Username: gridflow
- Password: locally configured development password

The original PostgreSQL instance remains on port 5432. TimescaleDB uses a separate Docker volume.

## Start the database

    docker start gridflow-timescale
    docker exec gridflow-timescale pg_isready -U gridflow -d gridflow

## Migration order for a new empty database

1. Apply `001_schema.sql`.
2. Apply `002_auth.sql`.
3. Apply `003_timescale_hypertable.sql`.

Set connection credentials locally. Never commit passwords to Git.

## Existing database migration

1. Take and validate a backup.
2. Restore it into a separate TimescaleDB instance.
3. Apply `003_timescale_hypertable.sql`.
4. Verify table counts, row counts, constraints, and hypertable status.

## Schema changes

Migration 003 converts `public.meter_reading` into a hypertable partitioned by `reading_date`, with one-month chunks.

The primary key changes from `(meter_id, reading_no)` to `(meter_id, reading_no, reading_date)` because a hypertable's unique key must include the partitioning column.

The `meter` foreign key and `chk_reading_status` and `chk_reading_value` constraints are preserved.

Important: this key change no longer enforces global uniqueness of `(meter_id, reading_no)` across different dates. Confirm this is compatible with the backend's intended data model.

## Verify

    SELECT hypertable_schema, hypertable_name
    FROM timescaledb_information.hypertables
    WHERE hypertable_name = 'meter_reading';

    SELECT COUNT(*) AS table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';

The Docker port is bound to 127.0.0.1, so it is accessible from this laptop only, not directly from a teammate's computer.
