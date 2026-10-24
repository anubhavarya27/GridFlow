-- GridPulse Performance Lab | workload DAILY | engine MySQL 8 (legacy U/BILL) | method RAW
-- Same result definition as pg_daily_raw.sql.  reading_time is stored as UTC;
-- IST has no daylight saving, so a fixed +05:30 offset gives the same local day.
-- Parameters (JDBC, in order): 1 = range start (UTC DATETIME), 2 = range end (UTC DATETIME, exclusive)
SELECT meter_id,
       DATE(CONVERT_TZ(reading_time, '+00:00', '+05:30')) AS period,
       SUM(interval_consumption) AS total_consumption,
       COUNT(*)                  AS reading_count
FROM meter_interval_reading
WHERE reading_time >= ? AND reading_time < ?
GROUP BY meter_id, DATE(CONVERT_TZ(reading_time, '+00:00', '+05:30'))
ORDER BY meter_id, period
