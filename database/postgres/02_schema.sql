-- =====================================================================
-- GridPulse | 02_schema.sql  —  relational billing domain
-- ---------------------------------------------------------------------
-- Converted from legacy-mysql/02_create_tables.sql (U/BILL, MySQL 8).
-- Run in database "gridpulse".  Every object is owned by gridpulse_app.
--
-- Plain PostgreSQL features only (no TimescaleDB in this file).
--
-- MySQL -> PostgreSQL conversion notes
--   * Identifiers are created UNQUOTED, so PostgreSQL folds them to lower
--     case.  Existing queries such as  SELECT * FROM Customer  or
--     FROM CUSTOMER  keep working because they also fold to "customer".
--   * INT -> INTEGER, DECIMAL(p,s) -> NUMERIC(p,s), VARCHAR unchanged,
--     DATE unchanged.  Legacy domain tables never used AUTO_INCREMENT
--     (IDs are business keys supplied by the user), so no identity
--     columns are introduced here.
--   * All legacy PRIMARY KEY / UNIQUE / FOREIGN KEY / CHECK constraints
--     are preserved with the same names.
--   * Corrections/additions are marked  [GRIDPULSE]  and documented in
--     docs/DATABASE_MIGRATION.md.
-- =====================================================================

\set ON_ERROR_STOP on
SET ROLE gridpulse_app;

BEGIN;

-- ============================================================
-- 1. CUSTOMER
-- ============================================================
CREATE TABLE customer (
    cust_id    INTEGER      PRIMARY KEY,
    cust_name  VARCHAR(100) NOT NULL,
    apartment  VARCHAR(100),
    flat_no    VARCHAR(20),
    city       VARCHAR(100) NOT NULL,
    dob        DATE         NOT NULL
);

-- ============================================================
-- 2. CUSTOMER_PHONE  (multivalued attribute)
-- ============================================================
CREATE TABLE customer_phone (
    cust_id   INTEGER     NOT NULL,
    phone_no  VARCHAR(20) NOT NULL,
    PRIMARY KEY (cust_id, phone_no),
    CONSTRAINT fk_customer_phone_customer
        FOREIGN KEY (cust_id) REFERENCES customer (cust_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- ============================================================
-- 3. CUSTOMER_EMAIL  (multivalued attribute)
-- ============================================================
CREATE TABLE customer_email (
    cust_id  INTEGER      NOT NULL,
    email    VARCHAR(255) NOT NULL,
    PRIMARY KEY (cust_id, email),
    CONSTRAINT fk_customer_email_customer
        FOREIGN KEY (cust_id) REFERENCES customer (cust_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- ============================================================
-- 4. PROPERTY
-- ============================================================
CREATE TABLE property (
    property_id       INTEGER      PRIMARY KEY,
    property_name     VARCHAR(100) NOT NULL,
    occupancy_status  VARCHAR(30)  NOT NULL,
    CONSTRAINT chk_property_occupancy
        CHECK (occupancy_status IN ('Occupied', 'Vacant'))
);

-- ============================================================
-- 5. CUSTOMER_OWNS_PROPERTY  (M:N relationship)
-- ============================================================
CREATE TABLE customer_owns_property (
    cust_id         INTEGER     NOT NULL,
    property_id     INTEGER     NOT NULL,
    ownership_date  DATE        NOT NULL,
    ownership_type  VARCHAR(30) NOT NULL,
    PRIMARY KEY (cust_id, property_id),
    CONSTRAINT fk_owns_customer
        FOREIGN KEY (cust_id) REFERENCES customer (cust_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_owns_property
        FOREIGN KEY (property_id) REFERENCES property (property_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);
-- [GRIDPULSE] PostgreSQL does not auto-index FK columns (InnoDB does).
CREATE INDEX idx_owns_property ON customer_owns_property (property_id);

-- ============================================================
-- 6. METER
-- ============================================================
CREATE TABLE meter (
    meter_id           INTEGER       PRIMARY KEY,
    capacity           NUMERIC(10,2) NOT NULL,
    installation_date  DATE          NOT NULL,
    meter_status       VARCHAR(30)   NOT NULL,
    CONSTRAINT chk_meter_capacity CHECK (capacity > 0),
    CONSTRAINT chk_meter_status
        CHECK (meter_status IN ('Active', 'Inactive', 'Faulty', 'Removed'))
);

-- ============================================================
-- 7. PROPERTY_INCORPORATE_METER  (1:N, meter is the key)
-- ============================================================
CREATE TABLE property_incorporate_meter (
    property_id  INTEGER NOT NULL,
    meter_id     INTEGER PRIMARY KEY,
    CONSTRAINT fk_property_meter_property
        FOREIGN KEY (property_id) REFERENCES property (property_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_property_meter_meter
        FOREIGN KEY (meter_id) REFERENCES meter (meter_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX idx_property_meter_property ON property_incorporate_meter (property_id);

-- ============================================================
-- 8. METER_READING  — billing-cycle readings (weak entity)
-- ------------------------------------------------------------
-- Kept exactly as in U/BILL: identifying key (meter_id, reading_no),
-- one row per billing-cycle read.  reading_value is the CUMULATIVE
-- register value.  High-frequency smart-meter data lives in the
-- TimescaleDB hypertable meter_interval_reading (see below and
-- 04_timescale_hypertable.sql).
-- ============================================================
CREATE TABLE meter_reading (
    meter_id        INTEGER       NOT NULL,
    reading_no      INTEGER       NOT NULL,
    reading_date    DATE          NOT NULL,
    reading_value   NUMERIC(12,2) NOT NULL,
    reading_status  VARCHAR(30)   NOT NULL,
    PRIMARY KEY (meter_id, reading_no),
    CONSTRAINT fk_reading_meter
        FOREIGN KEY (meter_id) REFERENCES meter (meter_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_reading_value CHECK (reading_value >= 0),
    CONSTRAINT chk_reading_status
        CHECK (reading_status IN ('Valid', 'Invalid', 'Estimated')),
    -- [GRIDPULSE] at most one cycle read per meter per date (legacy data
    -- satisfies this); used by bill generation to find cycle boundaries.
    CONSTRAINT uq_reading_meter_date UNIQUE (meter_id, reading_date)
);

-- ============================================================
-- 9. UTILITY_SERVICE  (supertype)
-- ============================================================
CREATE TABLE utility_service (
    service_id    INTEGER       PRIMARY KEY,
    fixed_charge  NUMERIC(10,2) NOT NULL,
    unit_rate     NUMERIC(10,4) NOT NULL,
    tax           NUMERIC(5,2)  NOT NULL,
    CONSTRAINT chk_service_fixed_charge CHECK (fixed_charge >= 0),
    CONSTRAINT chk_service_unit_rate    CHECK (unit_rate >= 0),
    CONSTRAINT chk_service_tax          CHECK (tax >= 0)
);

-- ============================================================
-- 10. ELECTRICITY_SERVICE  (subtype)
-- ============================================================
CREATE TABLE electricity_service (
    service_id     INTEGER     PRIMARY KEY,
    voltage_level  VARCHAR(30) NOT NULL,
    CONSTRAINT fk_electricity_service
        FOREIGN KEY (service_id) REFERENCES utility_service (service_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- ============================================================
-- 11. WATER_SERVICE  (subtype)
-- ============================================================
CREATE TABLE water_service (
    service_id    INTEGER      PRIMARY KEY,
    water_source  VARCHAR(100) NOT NULL,
    CONSTRAINT fk_water_service
        FOREIGN KEY (service_id) REFERENCES utility_service (service_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- ============================================================
-- 12. METER_SERVICE  (M:N relationship)
-- ============================================================
CREATE TABLE meter_service (
    meter_id    INTEGER NOT NULL,
    service_id  INTEGER NOT NULL,
    PRIMARY KEY (meter_id, service_id),
    CONSTRAINT fk_meter_service_meter
        FOREIGN KEY (meter_id) REFERENCES meter (meter_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_meter_service_service
        FOREIGN KEY (service_id) REFERENCES utility_service (service_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);
CREATE INDEX idx_meter_service_service ON meter_service (service_id);

-- ============================================================
-- 13. TARIFF
-- ============================================================
CREATE TABLE tariff (
    tariff_code  VARCHAR(20)   PRIMARY KEY,
    unit_rate    NUMERIC(10,4) NOT NULL,
    CONSTRAINT chk_tariff_unit_rate CHECK (unit_rate >= 0)
);

-- ============================================================
-- 14. BILL  (weak entity of METER)
-- ============================================================
CREATE TABLE bill (
    meter_id          INTEGER       NOT NULL,
    billing_month     DATE          NOT NULL,
    bill_id           INTEGER       NOT NULL UNIQUE,
    billing_date      DATE          NOT NULL,
    previous_reading  NUMERIC(12,2) NOT NULL,
    current_reading   NUMERIC(12,2) NOT NULL,
    tariff_code       VARCHAR(20)   NOT NULL,
    bill_status       VARCHAR(30)   NOT NULL,
    PRIMARY KEY (meter_id, billing_month),
    CONSTRAINT fk_bill_meter
        FOREIGN KEY (meter_id) REFERENCES meter (meter_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_bill_tariff
        FOREIGN KEY (tariff_code) REFERENCES tariff (tariff_code)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_bill_readings
        CHECK (previous_reading >= 0 AND current_reading >= previous_reading),
    CONSTRAINT chk_bill_status
        CHECK (bill_status IN ('Pending', 'Paid', 'Partially Paid', 'Overdue')),
    -- [GRIDPULSE] billing_month identifies a month, so it must be the 1st.
    CONSTRAINT chk_bill_month_first_day
        CHECK (billing_month = date_trunc('month', billing_month)::date)
);
CREATE INDEX idx_bill_tariff ON bill (tariff_code);

-- ============================================================
-- 15. PAYMENT_SCHEDULE
-- ============================================================
CREATE TABLE payment_schedule (
    payment_sequence  INTEGER PRIMARY KEY,
    payment_due_date  DATE    NOT NULL
);

-- ============================================================
-- 16. PAYMENT  (weak entity of BILL)
-- ============================================================
CREATE TABLE payment (
    bill_id           INTEGER       NOT NULL,
    payment_sequence  INTEGER       NOT NULL,
    payment_id        INTEGER       NOT NULL UNIQUE,
    payment_date      DATE          NOT NULL,
    amount            NUMERIC(12,2) NOT NULL,
    payment_mode      VARCHAR(20)   NOT NULL,
    PRIMARY KEY (bill_id, payment_sequence),
    CONSTRAINT fk_payment_bill
        FOREIGN KEY (bill_id) REFERENCES bill (bill_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_payment_schedule
        FOREIGN KEY (payment_sequence) REFERENCES payment_schedule (payment_sequence)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_payment_amount CHECK (amount > 0),
    CONSTRAINT chk_payment_mode   CHECK (payment_mode IN ('Card', 'Cash', 'UPI'))
);
CREATE INDEX idx_payment_schedule ON payment (payment_sequence);
CREATE INDEX idx_payment_date ON payment (payment_date);

-- ============================================================
-- 17. CARD
-- ============================================================
CREATE TABLE card (
    card_no    VARCHAR(30)  PRIMARY KEY,
    bank_name  VARCHAR(100) NOT NULL
);

-- ============================================================
-- 18. CARD_PAYMENT  (subtype of PAYMENT)
-- ============================================================
CREATE TABLE card_payment (
    payment_id  INTEGER     PRIMARY KEY,
    card_no     VARCHAR(30) NOT NULL,
    CONSTRAINT fk_card_payment_payment
        FOREIGN KEY (payment_id) REFERENCES payment (payment_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_card_payment_card
        FOREIGN KEY (card_no) REFERENCES card (card_no)
        ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX idx_card_payment_card ON card_payment (card_no);

-- ============================================================
-- 19. CASH_PAYMENT  (subtype of PAYMENT)
-- ============================================================
CREATE TABLE cash_payment (
    payment_id  INTEGER     PRIMARY KEY,
    receipt_no  VARCHAR(50) NOT NULL UNIQUE,
    CONSTRAINT fk_cash_payment_payment
        FOREIGN KEY (payment_id) REFERENCES payment (payment_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- ============================================================
-- 20. UPI_PAYMENT  (subtype of PAYMENT)
-- ============================================================
CREATE TABLE upi_payment (
    payment_id  INTEGER      PRIMARY KEY,
    upi_id      VARCHAR(100) NOT NULL,
    upi_app     VARCHAR(50)  NOT NULL,
    CONSTRAINT fk_upi_payment_payment
        FOREIGN KEY (payment_id) REFERENCES payment (payment_id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

-- ============================================================
-- 21. METER_INTERVAL_READING  [GRIDPULSE]  — smart-meter time series
-- ------------------------------------------------------------
-- Converted into a TimescaleDB hypertable by 04_timescale_hypertable.sql.
--
-- Why a separate table instead of converting METER_READING?
--   TimescaleDB requires every PRIMARY KEY / UNIQUE index of a hypertable
--   to include the partitioning (time) column.  Converting METER_READING
--   would force its identifying key (meter_id, reading_no) to become
--   (meter_id, reading_no, time), which no longer guarantees that a
--   reading number is unique per meter.  Keeping billing-cycle reads in
--   METER_READING preserves the original identity; the high-volume
--   interval data uses the natural time-series key (meter_id, reading_time).
--
-- register_value       cumulative meter register (kWh or kL)
-- interval_consumption register delta since the previous reading of the
--                      same meter (NULL for the first reading).  Stored so
--                      that aggregates SUM consumption instead of summing
--                      cumulative register values.  On a register reset the
--                      delta is the new register value (counter restarted
--                      from zero) and register_reset = TRUE.
-- interval_minutes     minutes since the previous reading (detects gaps /
--                      different interval lengths).
-- data_source          SIMULATED rows come from database/generator and are
--                      clearly labelled as synthetic data.
-- ============================================================
CREATE TABLE meter_interval_reading (
    meter_id              INTEGER       NOT NULL,
    reading_time          TIMESTAMPTZ   NOT NULL,
    register_value        NUMERIC(14,3) NOT NULL,
    interval_consumption  NUMERIC(12,4),
    interval_minutes      INTEGER,
    reading_quality       VARCHAR(20)   NOT NULL DEFAULT 'Valid',
    register_reset        BOOLEAN       NOT NULL DEFAULT FALSE,
    data_source           VARCHAR(20)   NOT NULL DEFAULT 'METER',
    PRIMARY KEY (meter_id, reading_time),
    CONSTRAINT fk_interval_reading_meter
        FOREIGN KEY (meter_id) REFERENCES meter (meter_id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT chk_interval_register     CHECK (register_value >= 0),
    CONSTRAINT chk_interval_consumption  CHECK (interval_consumption IS NULL OR interval_consumption >= 0),
    CONSTRAINT chk_interval_minutes      CHECK (interval_minutes IS NULL OR interval_minutes > 0),
    CONSTRAINT chk_interval_quality
        CHECK (reading_quality IN ('Valid', 'Invalid', 'Estimated')),
    CONSTRAINT chk_interval_source
        CHECK (data_source IN ('METER', 'SIMULATED', 'MANUAL'))
);

COMMIT;

\echo 'Relational schema created. Next: 03_application_tables.sql'
