-- =====================================================================
-- GridPulse | 08_query_studio_privileges.sql
-- ---------------------------------------------------------------------
-- Least-privilege roles for Query Studio.  Plain PostgreSQL.
--
-- The backend executes user-written SQL ONLY inside a transaction that
-- first runs   SET LOCAL ROLE gridpulse_query_reader   (read path, plus
-- SET TRANSACTION READ ONLY) or   SET LOCAL ROLE gridpulse_query_writer
-- (approved DML path).  PostgreSQL then enforces these grants, so even a
-- query that slips past the backend's statement classifier cannot touch
-- application tables (users, approvals, audit, alerts, benchmarks) or
-- run DDL.
--
-- gridpulse_query_writer deliberately has NO write access to
-- meter_interval_reading: interval consumption is derived by the backend's
-- reading service, and hand-written inserts would bypass that derivation.
-- =====================================================================

\set ON_ERROR_STOP on
SET ROLE gridpulse_app;

GRANT USAGE ON SCHEMA public TO gridpulse_query_reader, gridpulse_query_writer;

-- Read access: the 20 legacy domain tables, the time-series table, the
-- continuous aggregates and the helper view.
GRANT SELECT ON
    customer, customer_phone, customer_email, property, customer_owns_property,
    meter, property_incorporate_meter, meter_reading, utility_service,
    electricity_service, water_service, meter_service, tariff, bill,
    payment_schedule, payment, card, card_payment, cash_payment, upi_payment,
    meter_interval_reading, consumption_alert, v_meter_profile
TO gridpulse_query_reader, gridpulse_query_writer;

-- Continuous aggregates are views over internal materialization
-- hypertables; TimescaleDB propagates GRANTs on the view to them.
GRANT SELECT ON cagg_meter_hourly, cagg_meter_daily
TO gridpulse_query_reader, gridpulse_query_writer;

-- Write access for approved DML: the legacy domain tables only.
GRANT INSERT, UPDATE, DELETE ON
    customer, customer_phone, customer_email, property, customer_owns_property,
    meter, property_incorporate_meter, meter_reading, utility_service,
    electricity_service, water_service, meter_service, tariff, bill,
    payment_schedule, payment, card, card_payment, cash_payment, upi_payment
TO gridpulse_query_writer;

-- Defence in depth: make sure neither role can read application tables
-- even if a future GRANT ... ON ALL TABLES is added by mistake.
REVOKE ALL ON app_users, access_requests, query_request, approval_audit, benchmark_run
FROM gridpulse_query_reader, gridpulse_query_writer;

\echo 'Query Studio privileges applied.'
