-- =====================================================================
-- GridPulse | 99_validation.sql
-- ---------------------------------------------------------------------
-- Read-only verification of the migrated / generated database.
--   psql -U gridpulse_app -d gridpulse -f database/postgres/99_validation.sql
--
-- Every check prints PASS, WARN or FAIL with a detail column.
--   FAIL = the database is not in a usable state for GridPulse
--   WARN = a documented legacy inconsistency or an optional component
-- Checks marked [TSDB] need TimescaleDB; they FAIL (not skip) without it.
-- =====================================================================

\set ON_ERROR_STOP on
\pset footer off

CREATE TEMP TABLE validation_result (
    seq     SERIAL,
    check_name TEXT,
    status  TEXT,
    detail  TEXT
);

-- ---------------------------------------------------------------------
-- [TSDB] 1. TimescaleDB extension
-- ---------------------------------------------------------------------
INSERT INTO validation_result (check_name, status, detail)
SELECT '[TSDB] timescaledb extension installed',
       CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END,
       COALESCE(MAX('version ' || extversion), 'extension not installed')
FROM pg_extension WHERE extname = 'timescaledb';

-- ---------------------------------------------------------------------
-- [TSDB] 2. Hypertable and continuous aggregates
--      (queried through to_regclass so the script still runs — and
--       reports FAIL — on a server without TimescaleDB)
-- ---------------------------------------------------------------------
DO $$
DECLARE
    has_tsdb BOOLEAN := EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb');
    n INTEGER;
BEGIN
    IF has_tsdb THEN
        EXECUTE $q$SELECT COUNT(*) FROM timescaledb_information.hypertables
                   WHERE hypertable_name = 'meter_interval_reading'$q$ INTO n;
        INSERT INTO validation_result (check_name, status, detail)
        VALUES ('[TSDB] meter_interval_reading is a hypertable',
                CASE WHEN n = 1 THEN 'PASS' ELSE 'FAIL' END,
                n || ' matching hypertable(s)');

        EXECUTE $q$SELECT COUNT(*) FROM timescaledb_information.continuous_aggregates
                   WHERE view_name IN ('cagg_meter_hourly', 'cagg_meter_daily')$q$ INTO n;
        INSERT INTO validation_result (check_name, status, detail)
        VALUES ('[TSDB] continuous aggregates exist',
                CASE WHEN n = 2 THEN 'PASS' ELSE 'FAIL' END,
                n || ' of 2 continuous aggregates');

        EXECUTE $q$SELECT COUNT(*) FROM timescaledb_information.jobs
                   WHERE proc_name = 'policy_refresh_continuous_aggregate'$q$ INTO n;
        INSERT INTO validation_result (check_name, status, detail)
        VALUES ('[TSDB] continuous aggregate refresh policies',
                CASE WHEN n >= 2 THEN 'PASS' ELSE 'FAIL' END,
                n || ' refresh job(s)');
    ELSE
        INSERT INTO validation_result (check_name, status, detail) VALUES
        ('[TSDB] meter_interval_reading is a hypertable', 'FAIL', 'TimescaleDB not installed'),
        ('[TSDB] continuous aggregates exist',            'FAIL', 'TimescaleDB not installed'),
        ('[TSDB] continuous aggregate refresh policies',  'FAIL', 'TimescaleDB not installed');
    END IF;
END $$;

-- ---------------------------------------------------------------------
-- 3. Row counts (informational)
-- ---------------------------------------------------------------------
INSERT INTO validation_result (check_name, status, detail)
SELECT 'row count: ' || t.name, 'PASS', t.n::text
FROM (
    SELECT 'customer' AS name, COUNT(*) AS n FROM customer UNION ALL
    SELECT 'customer_phone', COUNT(*) FROM customer_phone UNION ALL
    SELECT 'customer_email', COUNT(*) FROM customer_email UNION ALL
    SELECT 'property', COUNT(*) FROM property UNION ALL
    SELECT 'customer_owns_property', COUNT(*) FROM customer_owns_property UNION ALL
    SELECT 'meter', COUNT(*) FROM meter UNION ALL
    SELECT 'property_incorporate_meter', COUNT(*) FROM property_incorporate_meter UNION ALL
    SELECT 'meter_reading', COUNT(*) FROM meter_reading UNION ALL
    SELECT 'utility_service', COUNT(*) FROM utility_service UNION ALL
    SELECT 'electricity_service', COUNT(*) FROM electricity_service UNION ALL
    SELECT 'water_service', COUNT(*) FROM water_service UNION ALL
    SELECT 'meter_service', COUNT(*) FROM meter_service UNION ALL
    SELECT 'tariff', COUNT(*) FROM tariff UNION ALL
    SELECT 'bill', COUNT(*) FROM bill UNION ALL
    SELECT 'payment_schedule', COUNT(*) FROM payment_schedule UNION ALL
    SELECT 'payment', COUNT(*) FROM payment UNION ALL
    SELECT 'card', COUNT(*) FROM card UNION ALL
    SELECT 'card_payment', COUNT(*) FROM card_payment UNION ALL
    SELECT 'cash_payment', COUNT(*) FROM cash_payment UNION ALL
    SELECT 'upi_payment', COUNT(*) FROM upi_payment UNION ALL
    SELECT 'meter_interval_reading', COUNT(*) FROM meter_interval_reading UNION ALL
    SELECT 'meter_interval_reading (SIMULATED)', COUNT(*) FROM meter_interval_reading WHERE data_source = 'SIMULATED'
) t;

-- ---------------------------------------------------------------------
-- 4. Referential integrity beyond FKs: specialization coverage
-- ---------------------------------------------------------------------
INSERT INTO validation_result (check_name, status, detail)
SELECT 'payments without a Card/Cash/UPI specialization row',
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARN' END,
       COUNT(*) || ' payment(s): ' || COALESCE(STRING_AGG(p.payment_id::text, ', '), '-')
FROM payment p
WHERE NOT EXISTS (SELECT 1 FROM card_payment c WHERE c.payment_id = p.payment_id)
  AND NOT EXISTS (SELECT 1 FROM cash_payment c WHERE c.payment_id = p.payment_id)
  AND NOT EXISTS (SELECT 1 FROM upi_payment  c WHERE c.payment_id = p.payment_id);

INSERT INTO validation_result (check_name, status, detail)
SELECT 'payment_mode disagrees with specialization table',
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARN' END,
       COUNT(*) || ' payment(s): ' || COALESCE(STRING_AGG(x.payment_id || ' (' || x.payment_mode || ' but ' || x.spec || ')', ', '), '-')
FROM (
    SELECT p.payment_id, p.payment_mode, 'Card' AS spec FROM payment p JOIN card_payment c USING (payment_id) WHERE p.payment_mode <> 'Card'
    UNION ALL
    SELECT p.payment_id, p.payment_mode, 'Cash' FROM payment p JOIN cash_payment c USING (payment_id) WHERE p.payment_mode <> 'Cash'
    UNION ALL
    SELECT p.payment_id, p.payment_mode, 'UPI'  FROM payment p JOIN upi_payment c USING (payment_id)  WHERE p.payment_mode <> 'UPI'
) x;

INSERT INTO validation_result (check_name, status, detail)
SELECT 'meters without a utility service',
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARN' END,
       COUNT(*)::text
FROM meter m WHERE NOT EXISTS (SELECT 1 FROM meter_service ms WHERE ms.meter_id = m.meter_id);

-- ---------------------------------------------------------------------
-- 5. Bill totals and payment relationships
--    Derived bill amount (documented in docs/BILLING_RULES.md):
--      total = round((units * tariff.unit_rate + service.fixed_charge)
--                    * (1 + service.tax / 100), 2)
-- ---------------------------------------------------------------------
INSERT INTO validation_result (check_name, status, detail)
SELECT 'bill consumption totals', 'PASS',
       COUNT(*) || ' bills, ' || SUM(current_reading - previous_reading) || ' units billed'
FROM bill;

WITH bill_amount AS (
    SELECT b.bill_id, b.bill_status,
           ROUND(((b.current_reading - b.previous_reading) * t.unit_rate + vp.fixed_charge)
                 * (1 + vp.tax / 100), 2) AS derived_total
    FROM bill b
    JOIN tariff t           ON t.tariff_code = b.tariff_code
    JOIN v_meter_profile vp ON vp.meter_id = b.meter_id
), paid AS (
    SELECT bill_id, SUM(amount) AS paid FROM payment GROUP BY bill_id
)
INSERT INTO validation_result (check_name, status, detail)
SELECT 'Paid bills whose payments differ from the derived amount',
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARN' END,
       COUNT(*) || ' bill(s), e.g. ' ||
       COALESCE(STRING_AGG(ba.bill_id || ': derived ' || ba.derived_total || ' paid ' || COALESCE(p.paid, 0), '; ' ORDER BY ba.bill_id)
                FILTER (WHERE ba.bill_id <= 5010), '-')
FROM bill_amount ba
LEFT JOIN paid p ON p.bill_id = ba.bill_id
WHERE ba.bill_status = 'Paid' AND COALESCE(p.paid, 0) <> ba.derived_total;

INSERT INTO validation_result (check_name, status, detail)
SELECT 'bills marked Paid with no payment row',
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARN' END,
       COUNT(*) || ' bill(s): ' || COALESCE(STRING_AGG(b.bill_id::text, ', '), '-')
FROM bill b
WHERE b.bill_status = 'Paid' AND NOT EXISTS (SELECT 1 FROM payment p WHERE p.bill_id = b.bill_id);

-- Bills must line up with billing-cycle readings when both exist
-- (legacy convention: bill for month M uses the cycle read dated M-01 as
--  current_reading and the read dated (M-1)-01 as previous_reading).
INSERT INTO validation_result (check_name, status, detail)
SELECT 'bill readings match billing-cycle readings',
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
       COUNT(*) || ' mismatching bill(s)'
FROM bill b
JOIN meter_reading cur  ON cur.meter_id = b.meter_id AND cur.reading_date = b.billing_month
LEFT JOIN meter_reading prev
       ON prev.meter_id = b.meter_id AND prev.reading_date = (b.billing_month - INTERVAL '1 month')::date
WHERE cur.reading_value <> b.current_reading
   OR (prev.reading_no IS NOT NULL AND prev.reading_value <> b.previous_reading);

-- ---------------------------------------------------------------------
-- 6. Time-series consistency
-- ---------------------------------------------------------------------
WITH ordered AS (
    SELECT meter_id, reading_time, register_value, interval_consumption, register_reset,
           LAG(register_value) OVER (PARTITION BY meter_id ORDER BY reading_time) AS prev_register
    FROM meter_interval_reading
)
INSERT INTO validation_result (check_name, status, detail)
SELECT 'interval_consumption equals register delta (cumulative -> interval)',
       CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
       COUNT(*) || ' inconsistent reading(s)'
FROM ordered
WHERE prev_register IS NOT NULL
  AND NOT register_reset
  AND interval_consumption IS DISTINCT FROM (register_value - prev_register);

INSERT INTO validation_result (check_name, status, detail)
SELECT 'billing-cycle readings match the interval register at local midnight',
       CASE WHEN COUNT(*) FILTER (WHERE ir.register_value IS NOT NULL AND ir.register_value <> mr.reading_value) = 0
            THEN 'PASS' ELSE 'FAIL' END,
       COUNT(*) FILTER (WHERE ir.register_value IS NOT NULL) || ' cycle read(s) compared, '
       || COUNT(*) FILTER (WHERE ir.register_value IS NOT NULL AND ir.register_value <> mr.reading_value) || ' mismatch(es)'
FROM meter_reading mr
LEFT JOIN meter_interval_reading ir
       ON ir.meter_id = mr.meter_id
      AND ir.reading_time = (mr.reading_date::timestamp AT TIME ZONE 'Asia/Kolkata');

-- ---------------------------------------------------------------------
-- [TSDB] 7. Continuous aggregate correctness: cagg == raw aggregation
-- ---------------------------------------------------------------------
DO $$
DECLARE
    mismatches BIGINT;
    compared   BIGINT;
BEGIN
    IF to_regclass('cagg_meter_daily') IS NULL THEN
        INSERT INTO validation_result (check_name, status, detail)
        VALUES ('[TSDB] cagg_meter_daily equals raw daily aggregation', 'FAIL', 'cagg_meter_daily does not exist');
        RETURN;
    END IF;
    EXECUTE $q$
        WITH raw AS (
            SELECT meter_id,
                   time_bucket(INTERVAL '1 day', reading_time, 'Asia/Kolkata') AS bucket,
                   SUM(interval_consumption) AS total, COUNT(*) AS n
            FROM meter_interval_reading GROUP BY 1, 2
        )
        SELECT COUNT(*) FILTER (WHERE c.meter_id IS NULL OR r.meter_id IS NULL
                                   OR c.total_consumption IS DISTINCT FROM r.total
                                   OR c.reading_count <> r.n),
               COUNT(*)
        FROM raw r FULL JOIN cagg_meter_daily c
          ON c.meter_id = r.meter_id AND c.bucket = r.bucket
    $q$ INTO mismatches, compared;
    INSERT INTO validation_result (check_name, status, detail)
    VALUES ('[TSDB] cagg_meter_daily equals raw daily aggregation',
            CASE WHEN mismatches = 0 THEN 'PASS' ELSE 'FAIL' END,
            compared || ' day buckets compared, ' || mismatches || ' mismatch(es)');
END $$;

-- ---------------------------------------------------------------------
-- 8. Alerts and Query Studio privileges
-- ---------------------------------------------------------------------
INSERT INTO validation_result (check_name, status, detail)
SELECT 'Query Studio reader role cannot read app_users',
       CASE WHEN NOT has_table_privilege('gridpulse_query_reader', 'app_users', 'SELECT') THEN 'PASS' ELSE 'FAIL' END,
       'has SELECT = ' || has_table_privilege('gridpulse_query_reader', 'app_users', 'SELECT');

INSERT INTO validation_result (check_name, status, detail)
SELECT 'Query Studio writer role cannot write meter_interval_reading',
       CASE WHEN NOT has_table_privilege('gridpulse_query_writer', 'meter_interval_reading', 'INSERT') THEN 'PASS' ELSE 'FAIL' END,
       'has INSERT = ' || has_table_privilege('gridpulse_query_writer', 'meter_interval_reading', 'INSERT');

INSERT INTO validation_result (check_name, status, detail)
SELECT 'application login role is not a superuser',
       CASE WHEN NOT rolsuper THEN 'PASS' ELSE 'WARN' END,
       'gridpulse_app rolsuper = ' || rolsuper
FROM pg_roles WHERE rolname = 'gridpulse_app';

SELECT check_name, status, detail FROM validation_result ORDER BY seq;

SELECT status, COUNT(*) FROM validation_result GROUP BY status ORDER BY status;
