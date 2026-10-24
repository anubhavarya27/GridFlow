-- =====================================================================
-- GridPulse | 00_roles_and_database.sql
-- ---------------------------------------------------------------------
-- Run as a PostgreSQL SUPERUSER, connected to the "postgres" database.
--
--   psql -U postgres -d postgres \
--        -v app_password='<choose-a-password>' \
--        -f database/postgres/00_roles_and_database.sql
--
-- Creates:
--   gridpulse_app           LOGIN role used by the Spring Boot backend.
--                           Owns every GridPulse object. NOT a superuser.
--   gridpulse_query_reader  NOLOGIN role. Query Studio read queries run
--                           under SET LOCAL ROLE gridpulse_query_reader.
--   gridpulse_query_writer  NOLOGIN role. Approved Query Studio DML runs
--                           under SET LOCAL ROLE gridpulse_query_writer.
--   gridpulse               the application database.
--
-- The password is passed as a psql variable so it is never stored in
-- this file or in Git.  Plain PostgreSQL feature (no TimescaleDB).
-- =====================================================================

\set ON_ERROR_STOP on

\if :{?app_password}
\else
  \echo 'ERROR: pass -v app_password=... (the gridpulse_app login password)'
  \quit
\endif

SELECT format('CREATE ROLE gridpulse_app LOGIN PASSWORD %L', :'app_password')
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gridpulse_app')
\gexec

-- Keep the password in sync when the script is re-run.
SELECT format('ALTER ROLE gridpulse_app LOGIN PASSWORD %L', :'app_password')
\gexec

SELECT 'CREATE ROLE gridpulse_query_reader NOLOGIN'
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gridpulse_query_reader')
\gexec

SELECT 'CREATE ROLE gridpulse_query_writer NOLOGIN'
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'gridpulse_query_writer')
\gexec

-- gridpulse_app must be a member of both roles so that it can
-- SET LOCAL ROLE to them inside a Query Studio transaction.
GRANT gridpulse_query_reader TO gridpulse_app;
GRANT gridpulse_query_writer TO gridpulse_app;

SELECT 'CREATE DATABASE gridpulse OWNER gridpulse_app'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'gridpulse')
\gexec

\echo 'Roles and database ready. Next: 01_extensions.sql (as superuser, in database gridpulse).'
