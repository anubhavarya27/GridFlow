-- =====================================================================
-- GridPulse | 05_continuous_aggregates.sql
-- ---------------------------------------------------------------------
-- TIMESCALEDB REQUIRED (tested design target: TimescaleDB 2.17, PG 16).
--
-- Two continuous aggregates over meter_interval_reading:
--
--   cagg_meter_hourly  hourly consumption per meter  (analytics: hour)
--   cagg_meter_daily   daily consumption per meter   (analytics: day,
--                      week and month roll-ups, anomaly detection,
--                      forecasting, Performance Lab)
--
-- Consumption semantics
--   reading register values are CUMULATIVE.  The aggregates SUM the
--   stored interval_consumption (register delta per reading) and never
--   sum register_value.  MIN/MAX of the register are kept only for
--   diagnostics.
--
-- Time zone
--   Buckets are aligned to local midnight / local hour in Asia/Kolkata
--   (the customers are in Chennai).  IST is UTC+05:30, so UTC-aligned
--   hour or day buckets would split local days.
--
-- Freshness
--   timescaledb.materialized_only = false enables real-time aggregation:
--   rows inserted after the last refresh are combined from the raw
--   hypertable at query time, so new readings appear immediately.
--   The refresh policies below materialize them in the background.
-- =====================================================================

\set ON_ERROR_STOP on
SET ROLE gridpulse_app;

-- ----------------------------------------------------------------------
-- Hourly
-- ----------------------------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS cagg_meter_hourly
WITH (timescaledb.continuous, timescaledb.materialized_only = false) AS
SELECT
    meter_id,
    time_bucket(INTERVAL '1 hour', reading_time, 'Asia/Kolkata') AS bucket,
    SUM(interval_consumption)                         AS total_consumption,
    COUNT(*)                                          AS reading_count,
    SUM(interval_minutes)                             AS covered_minutes,
    MAX(interval_minutes)                             AS max_interval_minutes,
    MAX(interval_consumption)                         AS max_interval_consumption,
    MIN(register_value)                               AS min_register,
    MAX(register_value)                               AS max_register,
    BOOL_OR(register_reset)                           AS has_reset,
    COUNT(*) FILTER (WHERE reading_quality <> 'Valid') AS non_valid_count
FROM meter_interval_reading
GROUP BY meter_id, time_bucket(INTERVAL '1 hour', reading_time, 'Asia/Kolkata')
WITH NO DATA;

-- ----------------------------------------------------------------------
-- Daily
-- ----------------------------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS cagg_meter_daily
WITH (timescaledb.continuous, timescaledb.materialized_only = false) AS
SELECT
    meter_id,
    time_bucket(INTERVAL '1 day', reading_time, 'Asia/Kolkata') AS bucket,
    SUM(interval_consumption)                         AS total_consumption,
    COUNT(*)                                          AS reading_count,
    SUM(interval_minutes)                             AS covered_minutes,
    MAX(interval_minutes)                             AS max_interval_minutes,
    MAX(interval_consumption)                         AS max_interval_consumption,
    MIN(register_value)                               AS min_register,
    MAX(register_value)                               AS max_register,
    BOOL_OR(register_reset)                           AS has_reset,
    COUNT(*) FILTER (WHERE reading_quality <> 'Valid') AS non_valid_count
FROM meter_interval_reading
GROUP BY meter_id, time_bucket(INTERVAL '1 day', reading_time, 'Asia/Kolkata')
WITH NO DATA;

-- ----------------------------------------------------------------------
-- Refresh policies (background jobs run by TimescaleDB).
--   start_offset : how far back each run re-materializes (late data)
--   end_offset   : leave the most recent hour to real-time aggregation
-- ----------------------------------------------------------------------
SELECT add_continuous_aggregate_policy('cagg_meter_hourly',
    start_offset      => INTERVAL '3 days',
    end_offset        => INTERVAL '1 hour',
    schedule_interval => INTERVAL '15 minutes',
    if_not_exists     => TRUE);

SELECT add_continuous_aggregate_policy('cagg_meter_daily',
    start_offset      => INTERVAL '7 days',
    end_offset        => INTERVAL '1 hour',
    schedule_interval => INTERVAL '30 minutes',
    if_not_exists     => TRUE);

-- Lookup index used by the analytics API (per-meter range scans).
CREATE INDEX IF NOT EXISTS idx_cagg_meter_daily_meter_bucket
    ON cagg_meter_daily (meter_id, bucket);
CREATE INDEX IF NOT EXISTS idx_cagg_meter_hourly_meter_bucket
    ON cagg_meter_hourly (meter_id, bucket);

SELECT view_name, materialized_only
FROM timescaledb_information.continuous_aggregates
ORDER BY view_name;

\echo 'Continuous aggregates created (empty). Load data, then run 09_post_load.sql.'
