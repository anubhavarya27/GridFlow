-- GridPulse Performance Lab | workload DAILY | engine PostgreSQL+TimescaleDB | method RAW
-- Daily consumption per meter, aggregated directly from the raw hypertable.
-- Parameters (JDBC, in order): 1 = range start (timestamptz), 2 = range end (timestamptz, exclusive)
-- Result columns: meter_id, period (local date, Asia/Kolkata), total_consumption, reading_count
SELECT meter_id,
       (time_bucket(INTERVAL '1 day', reading_time, 'Asia/Kolkata') AT TIME ZONE 'Asia/Kolkata')::date AS period,
       SUM(interval_consumption) AS total_consumption,
       COUNT(*)                  AS reading_count
FROM meter_interval_reading
WHERE reading_time >= ? AND reading_time < ?
GROUP BY meter_id, time_bucket(INTERVAL '1 day', reading_time, 'Asia/Kolkata')
ORDER BY meter_id, period
