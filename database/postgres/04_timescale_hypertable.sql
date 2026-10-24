-- =====================================================================
-- GridPulse | 04_timescale_hypertable.sql
-- ---------------------------------------------------------------------
-- TIMESCALEDB REQUIRED.
--
-- Converts meter_interval_reading (created empty in 02_schema.sql) into a
-- TimescaleDB hypertable partitioned on reading_time.
--
-- Constraint review (TimescaleDB rule: every UNIQUE index / PRIMARY KEY
-- on a hypertable must include the partitioning column):
--   PRIMARY KEY (meter_id, reading_time)  -> includes reading_time  OK
--   FOREIGN KEY meter_id -> meter          -> FKs FROM a hypertable to a
--                                             regular table are supported
--   No table references meter_interval_reading with a FOREIGN KEY, so the
--   "FKs into hypertables" restriction does not apply.
--
-- chunk_time_interval = 7 days (TimescaleDB's default).  With 15-minute
-- readings for 10 meters that is ~6,700 rows per chunk.  Kept at the
-- default so the Performance Lab does not rely on hand-tuned chunking.
-- =====================================================================

\set ON_ERROR_STOP on
SET ROLE gridpulse_app;

SELECT create_hypertable(
    'meter_interval_reading',
    'reading_time',
    chunk_time_interval => INTERVAL '7 days',
    if_not_exists       => TRUE
);

-- The primary key already provides (meter_id, reading_time) ordering for
-- per-meter range scans.  create_hypertable() also adds an index on
-- (reading_time DESC) for cross-meter time-range scans.

-- Show the result for the setup log.
SELECT hypertable_name, num_dimensions, num_chunks
FROM timescaledb_information.hypertables
WHERE hypertable_name = 'meter_interval_reading';

\echo 'Hypertable ready. Next: 05_continuous_aggregates.sql'
