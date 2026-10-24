-- GridPulse Performance Lab | workload MONTHLY | engine PostgreSQL+TimescaleDB | method RAW
-- Monthly consumption per meter from the raw hypertable.
-- Parameters (JDBC, in order): 1 = range start (timestamptz), 2 = range end (timestamptz, exclusive)
SELECT meter_id,
       date_trunc('month', reading_time AT TIME ZONE 'Asia/Kolkata')::date AS period,
       SUM(interval_consumption) AS total_consumption,
       COUNT(*)                  AS reading_count
FROM meter_interval_reading
WHERE reading_time >= ? AND reading_time < ?
GROUP BY meter_id, date_trunc('month', reading_time AT TIME ZONE 'Asia/Kolkata')
ORDER BY meter_id, period
