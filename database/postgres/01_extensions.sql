-- =====================================================================
-- GridPulse | 01_extensions.sql
-- ---------------------------------------------------------------------
-- Run as a SUPERUSER, connected to the "gridpulse" database:
--
--   psql -U postgres -d gridpulse -f database/postgres/01_extensions.sql
--
-- TIMESCALEDB REQUIRED.  This script fails (ON_ERROR_STOP) if the
-- TimescaleDB extension is not installed on the server.  GridPulse does
-- not silently fall back to plain PostgreSQL.
--
-- The server must also have:  shared_preload_libraries = 'timescaledb'
-- (the official timescale/timescaledb Docker image sets this already).
-- =====================================================================

\set ON_ERROR_STOP on

CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Show what was installed so the operator can record it.
SELECT extname, extversion
FROM pg_extension
WHERE extname = 'timescaledb';

-- Allow the application role to create objects in the public schema
-- (PostgreSQL 15+ no longer grants CREATE on public to everyone).
GRANT USAGE, CREATE ON SCHEMA public TO gridpulse_app;
