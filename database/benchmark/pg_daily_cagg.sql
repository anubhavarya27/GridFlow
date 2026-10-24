-- GridPulse Performance Lab | workload DAILY | engine PostgreSQL+TimescaleDB | method CONTINUOUS_AGGREGATE
-- Same result as pg_daily_raw.sql, read from the continuous aggregate cagg_meter_daily.
-- Parameters (JDBC, in order): 1 = range start (timestamptz), 2 = range end (timestamptz, exclusive)
SELECT meter_id,
       (bucket AT TIME ZONE 'Asia/Kolkata')::date AS period,
       total_consumption,
       reading_count
FROM cagg_meter_daily
WHERE bucket >= ? AND bucket < ?
ORDER BY meter_id, period
