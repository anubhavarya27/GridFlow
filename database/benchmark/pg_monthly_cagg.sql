-- GridPulse Performance Lab | workload MONTHLY | engine PostgreSQL+TimescaleDB | method CONTINUOUS_AGGREGATE
-- Same result as pg_monthly_raw.sql, rolled up from the daily continuous aggregate.
-- Parameters (JDBC, in order): 1 = range start (timestamptz), 2 = range end (timestamptz, exclusive)
SELECT meter_id,
       date_trunc('month', bucket AT TIME ZONE 'Asia/Kolkata')::date AS period,
       SUM(total_consumption) AS total_consumption,
       SUM(reading_count)     AS reading_count
FROM cagg_meter_daily
WHERE bucket >= ? AND bucket < ?
GROUP BY meter_id, date_trunc('month', bucket AT TIME ZONE 'Asia/Kolkata')
ORDER BY meter_id, period
