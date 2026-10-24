-- =====================================================================
-- GridPulse | load_generated_mysql.sql
-- ---------------------------------------------------------------------
-- Loads the SAME simulated interval readings into the legacy MySQL
-- database for the Performance Lab comparison.  Run FROM database/generated:
--
--   cd database/generated
--   mysql --local-infile=1 -u root -p utility_billing_db < ../scripts/load_generated_mysql.sql
--
-- Requires the server variable local_infile=ON
--   (SET GLOBAL local_infile = 1;  as an administrator).
-- Requires legacy-mysql/10_benchmark_interval_readings.sql first.
-- =====================================================================

TRUNCATE TABLE meter_interval_reading;

LOAD DATA LOCAL INFILE 'interval_readings.csv'
INTO TABLE meter_interval_reading
FIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"' ESCAPED BY '\\'
LINES TERMINATED BY '\n'
IGNORE 1 LINES
(meter_id, reading_time, register_value, interval_consumption, interval_minutes,
 reading_quality, register_reset, data_source);

ANALYZE TABLE meter_interval_reading;

SELECT COUNT(*) AS interval_rows,
       SUM(interval_consumption) AS total_consumption
FROM meter_interval_reading;
