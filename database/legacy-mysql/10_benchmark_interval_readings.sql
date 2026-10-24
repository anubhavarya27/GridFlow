-- =====================================================================
-- GridPulse | legacy-mysql/10_benchmark_interval_readings.sql
-- ---------------------------------------------------------------------
-- Adds ONE table to the legacy U/BILL MySQL database so that the Database
-- Performance Lab can run the same consumption-aggregation workload on
-- MySQL and on PostgreSQL/TimescaleDB over an identical dataset.
-- Nothing else in the legacy database is changed.
--
-- Same columns, types and primary key as the PostgreSQL table
-- meter_interval_reading (see database/postgres/02_schema.sql).
-- reading_time is stored as UTC in a DATETIME column (MySQL DATETIME has
-- no time zone); the benchmark converts to IST with CONVERT_TZ.
--
-- Load the data with  database/scripts/load_generated_mysql.sql
-- =====================================================================

USE utility_billing_db;

CREATE TABLE IF NOT EXISTS meter_interval_reading (
    meter_id              INT           NOT NULL,
    reading_time          DATETIME      NOT NULL COMMENT 'UTC',
    register_value        DECIMAL(14,3) NOT NULL,
    interval_consumption  DECIMAL(12,4) NULL,
    interval_minutes      INT           NULL,
    reading_quality       VARCHAR(20)   NOT NULL DEFAULT 'Valid',
    register_reset        TINYINT(1)    NOT NULL DEFAULT 0,
    data_source           VARCHAR(20)   NOT NULL DEFAULT 'METER',

    PRIMARY KEY (meter_id, reading_time),
    INDEX idx_interval_reading_time (reading_time),

    CONSTRAINT fk_interval_reading_meter
        FOREIGN KEY (meter_id) REFERENCES Meter (meter_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_interval_register CHECK (register_value >= 0),
    CONSTRAINT chk_interval_quality  CHECK (reading_quality IN ('Valid', 'Invalid', 'Estimated'))
) ENGINE = InnoDB;
