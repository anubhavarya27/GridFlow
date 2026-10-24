-- =====================================================================
-- GridPulse | load_generated_postgres.sql
-- ---------------------------------------------------------------------
-- Loads the SIMULATED dataset produced by generator/generate_dataset.py.
-- Run FROM the database/generated directory (\copy paths are relative):
--
--   cd database/generated
--   psql -U gridpulse_app -d gridpulse -f ../scripts/load_generated_postgres.sql
--
-- Idempotent: rows whose keys appear in the CSV files are replaced, and all
-- previously loaded SIMULATED interval readings are removed first.  Legacy
-- U/BILL rows (bills 5001-5030, payments 9001-9019, readings 1-3) are never
-- touched because the generator never emits those keys.
-- Plain PostgreSQL; works on a hypertable or an ordinary table.
-- Afterwards run ../postgres/09_post_load.sql to refresh the aggregates.
-- =====================================================================

\set ON_ERROR_STOP on
SET ROLE gridpulse_app;
SET TIME ZONE 'UTC';   -- reading_time values in the CSV are UTC

BEGIN;

CREATE TEMP TABLE g_interval (LIKE meter_interval_reading INCLUDING DEFAULTS) ON COMMIT DROP;
CREATE TEMP TABLE g_cycle    (LIKE meter_reading)    ON COMMIT DROP;
CREATE TEMP TABLE g_bill     (LIKE bill)             ON COMMIT DROP;
CREATE TEMP TABLE g_payment  (LIKE payment)          ON COMMIT DROP;
CREATE TEMP TABLE g_card     (LIKE card_payment)     ON COMMIT DROP;
CREATE TEMP TABLE g_cash     (LIKE cash_payment)     ON COMMIT DROP;
CREATE TEMP TABLE g_upi      (LIKE upi_payment)      ON COMMIT DROP;

\copy g_interval (meter_id, reading_time, register_value, interval_consumption, interval_minutes, reading_quality, register_reset, data_source) FROM 'interval_readings.csv' WITH (FORMAT csv, HEADER true, NULL '\N')
\copy g_cycle   FROM 'cycle_readings.csv' WITH (FORMAT csv, HEADER true)
\copy g_bill    FROM 'bills.csv'          WITH (FORMAT csv, HEADER true)
\copy g_payment FROM 'payments.csv'       WITH (FORMAT csv, HEADER true)
\copy g_card    FROM 'card_payments.csv'  WITH (FORMAT csv, HEADER true)
\copy g_cash    FROM 'cash_payments.csv'  WITH (FORMAT csv, HEADER true)
\copy g_upi     FROM 'upi_payments.csv'   WITH (FORMAT csv, HEADER true)

-- Remove a previous load (children first).
DELETE FROM upi_payment  WHERE payment_id IN (SELECT payment_id FROM g_payment);
DELETE FROM cash_payment WHERE payment_id IN (SELECT payment_id FROM g_payment);
DELETE FROM card_payment WHERE payment_id IN (SELECT payment_id FROM g_payment);
DELETE FROM payment      WHERE payment_id IN (SELECT payment_id FROM g_payment)
                            OR bill_id    IN (SELECT bill_id FROM g_bill);
DELETE FROM bill         WHERE bill_id    IN (SELECT bill_id FROM g_bill);
DELETE FROM meter_reading mr USING g_cycle g
 WHERE mr.meter_id = g.meter_id AND (mr.reading_no = g.reading_no OR mr.reading_date = g.reading_date);
DELETE FROM meter_interval_reading WHERE data_source = 'SIMULATED';

INSERT INTO meter_interval_reading SELECT * FROM g_interval ORDER BY meter_id, reading_time;
INSERT INTO meter_reading SELECT * FROM g_cycle;
INSERT INTO bill          SELECT * FROM g_bill;
INSERT INTO payment       SELECT * FROM g_payment;
INSERT INTO card_payment  SELECT * FROM g_card;
INSERT INTO cash_payment  SELECT * FROM g_cash;
INSERT INTO upi_payment   SELECT * FROM g_upi;

SELECT
    (SELECT COUNT(*) FROM g_interval) AS interval_rows,
    (SELECT COUNT(*) FROM g_cycle)    AS cycle_rows,
    (SELECT COUNT(*) FROM g_bill)     AS bill_rows,
    (SELECT COUNT(*) FROM g_payment)  AS payment_rows;

COMMIT;

\echo 'SIMULATED dataset loaded. Next: psql -f ../postgres/09_post_load.sql'
