-- GridPulse Performance Lab | workload MONTHLY | engine MySQL 8 (legacy U/BILL) | method RAW
-- Same result definition as pg_monthly_raw.sql.
-- Parameters (JDBC, in order): 1 = range start (UTC DATETIME), 2 = range end (UTC DATETIME, exclusive)
SELECT meter_id,
       CAST(DATE_FORMAT(CONVERT_TZ(reading_time, '+00:00', '+05:30'), '%Y-%m-01') AS DATE) AS period,
       SUM(interval_consumption) AS total_consumption,
       COUNT(*)                  AS reading_count
FROM meter_interval_reading
WHERE reading_time >= ? AND reading_time < ?
GROUP BY meter_id, CAST(DATE_FORMAT(CONVERT_TZ(reading_time, '+00:00', '+05:30'), '%Y-%m-01') AS DATE)
ORDER BY meter_id, period
