-- =====================================================================
-- GridPulse | 09_post_load.sql
-- ---------------------------------------------------------------------
-- Run after loading data (06_legacy_data.sql and/or the generated
-- dataset, or after migrate_mysql_to_postgres.py).
--
--   * TIMESCALEDB: fully materializes both continuous aggregates so that
--     historical queries (and the Performance Lab) read materialized data.
--   * Updates planner statistics.
--
-- refresh_continuous_aggregate() is a procedure and cannot run inside an
-- explicit transaction block; psql's default autocommit mode is required.
-- =====================================================================

\set ON_ERROR_STOP on
SET ROLE gridpulse_app;

CALL refresh_continuous_aggregate('cagg_meter_hourly', NULL, NULL);
CALL refresh_continuous_aggregate('cagg_meter_daily',  NULL, NULL);

ANALYZE meter_interval_reading;
ANALYZE meter_reading;
ANALYZE bill;
ANALYZE payment;

SELECT
    (SELECT COUNT(*) FROM meter_interval_reading) AS interval_readings,
    (SELECT COUNT(*) FROM cagg_meter_hourly)      AS hourly_buckets,
    (SELECT COUNT(*) FROM cagg_meter_daily)       AS daily_buckets;

\echo 'Post-load refresh complete. Run 99_validation.sql to verify the database.'
