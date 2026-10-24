USE utility_billing_db;


DROP TABLE IF EXISTS UPI_Payment;
DROP TABLE IF EXISTS Cash_Payment;
DROP TABLE IF EXISTS Card_Payment;
DROP TABLE IF EXISTS Card;
DROP TABLE IF EXISTS Payment;
DROP TABLE IF EXISTS Payment_Schedule;
DROP TABLE IF EXISTS Bill;
DROP TABLE IF EXISTS Tariff;
DROP TABLE IF EXISTS Meter_Service;
DROP TABLE IF EXISTS Water_Service;
DROP TABLE IF EXISTS Electricity_Service;
DROP TABLE IF EXISTS Utility_Service;
DROP TABLE IF EXISTS Meter_Reading;
DROP TABLE IF EXISTS Property_Incorporate_Meter;
DROP TABLE IF EXISTS Meter;
DROP TABLE IF EXISTS Customer_Owns_Property;
DROP TABLE IF EXISTS Property;
DROP TABLE IF EXISTS Customer_Email;
DROP TABLE IF EXISTS Customer_Phone;
DROP TABLE IF EXISTS Customer;


-- ============================================================
-- 1. CUSTOMER
-- ============================================================

CREATE TABLE IF NOT EXISTS Customer (
    cust_id INT PRIMARY KEY,
    cust_name VARCHAR(100) NOT NULL,
    apartment VARCHAR(100),
    flat_no VARCHAR(20),
    city VARCHAR(100) NOT NULL,
    dob DATE NOT NULL
);


-- ============================================================
-- 2. CUSTOMER_PHONE
-- ============================================================

CREATE TABLE IF NOT EXISTS Customer_Phone (
    cust_id INT NOT NULL,
    phone_no VARCHAR(20) NOT NULL,

    PRIMARY KEY (cust_id, phone_no),

    CONSTRAINT fk_customer_phone_customer
        FOREIGN KEY (cust_id)
        REFERENCES Customer(cust_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- ============================================================
-- 3. CUSTOMER_EMAIL
-- ============================================================

CREATE TABLE IF NOT EXISTS Customer_Email (
    cust_id INT NOT NULL,
    email VARCHAR(255) NOT NULL,

    PRIMARY KEY (cust_id, email),

    CONSTRAINT fk_customer_email_customer
        FOREIGN KEY (cust_id)
        REFERENCES Customer(cust_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- ============================================================
-- 4. PROPERTY
-- ============================================================

CREATE TABLE IF NOT EXISTS Property (
    property_id INT PRIMARY KEY,
    property_name VARCHAR(100) NOT NULL,
    occupancy_status VARCHAR(30) NOT NULL,

    CONSTRAINT chk_property_occupancy
        CHECK (occupancy_status IN ('Occupied', 'Vacant'))
);


-- ============================================================
-- 5. CUSTOMER_OWNS_PROPERTY
-- ============================================================

CREATE TABLE IF NOT EXISTS Customer_Owns_Property (
    cust_id INT NOT NULL,
    property_id INT NOT NULL,
    ownership_date DATE NOT NULL,
    ownership_type VARCHAR(30) NOT NULL,

    PRIMARY KEY (cust_id, property_id),

    CONSTRAINT fk_owns_customer
        FOREIGN KEY (cust_id)
        REFERENCES Customer(cust_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_owns_property
        FOREIGN KEY (property_id)
        REFERENCES Property(property_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- ============================================================
-- 6. METER
-- ============================================================

CREATE TABLE IF NOT EXISTS Meter (
    meter_id INT PRIMARY KEY,
    capacity DECIMAL(10,2) NOT NULL,
    installation_date DATE NOT NULL,
    meter_status VARCHAR(30) NOT NULL,

    CONSTRAINT chk_meter_capacity
        CHECK (capacity > 0),

    CONSTRAINT chk_meter_status
        CHECK (meter_status IN ('Active', 'Inactive', 'Faulty', 'Removed'))
);


-- ============================================================
-- 7. PROPERTY_INCORPORATE_METER
-- ============================================================

CREATE TABLE IF NOT EXISTS Property_Incorporate_Meter (
    property_id INT NOT NULL,
    meter_id INT PRIMARY KEY,

    CONSTRAINT fk_property_meter_property
        FOREIGN KEY (property_id)
        REFERENCES Property(property_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_property_meter_meter
        FOREIGN KEY (meter_id)
        REFERENCES Meter(meter_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- ============================================================
-- 8. METER_READING
-- ============================================================

CREATE TABLE IF NOT EXISTS Meter_Reading (
    meter_id INT NOT NULL,
    reading_no INT NOT NULL,
    reading_date DATE NOT NULL,
    reading_value DECIMAL(12,2) NOT NULL,
    reading_status VARCHAR(30) NOT NULL,

    PRIMARY KEY (meter_id, reading_no),

    CONSTRAINT fk_reading_meter
        FOREIGN KEY (meter_id)
        REFERENCES Meter(meter_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT chk_reading_value
        CHECK (reading_value >= 0),

    CONSTRAINT chk_reading_status
        CHECK (reading_status IN ('Valid', 'Invalid', 'Estimated'))
);


-- ============================================================
-- 9. UTILITY_SERVICE
-- ============================================================

CREATE TABLE IF NOT EXISTS Utility_Service (
    service_id INT PRIMARY KEY,
    fixed_charge DECIMAL(10,2) NOT NULL,
    unit_rate DECIMAL(10,4) NOT NULL,
    tax DECIMAL(5,2) NOT NULL,

    CONSTRAINT chk_service_fixed_charge
        CHECK (fixed_charge >= 0),

    CONSTRAINT chk_service_unit_rate
        CHECK (unit_rate >= 0),

    CONSTRAINT chk_service_tax
        CHECK (tax >= 0)
);


-- ============================================================
-- 10. ELECTRICITY_SERVICE
-- ============================================================

CREATE TABLE IF NOT EXISTS Electricity_Service (
    service_id INT PRIMARY KEY,
    voltage_level VARCHAR(30) NOT NULL,

    CONSTRAINT fk_electricity_service
        FOREIGN KEY (service_id)
        REFERENCES Utility_Service(service_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- ============================================================
-- 11. WATER_SERVICE
-- ============================================================

CREATE TABLE IF NOT EXISTS Water_Service (
    service_id INT PRIMARY KEY,
    water_source VARCHAR(100) NOT NULL,

    CONSTRAINT fk_water_service
        FOREIGN KEY (service_id)
        REFERENCES Utility_Service(service_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- ============================================================
-- 12. METER_SERVICE
-- ============================================================

CREATE TABLE IF NOT EXISTS Meter_Service (
    meter_id INT NOT NULL,
    service_id INT NOT NULL,

    PRIMARY KEY (meter_id, service_id),

    CONSTRAINT fk_meter_service_meter
        FOREIGN KEY (meter_id)
        REFERENCES Meter(meter_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_meter_service_service
        FOREIGN KEY (service_id)
        REFERENCES Utility_Service(service_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- ============================================================
-- 13. TARIFF
-- ============================================================

CREATE TABLE IF NOT EXISTS Tariff (
    tariff_code VARCHAR(20) PRIMARY KEY,
    unit_rate DECIMAL(10,4) NOT NULL,

    CONSTRAINT chk_tariff_unit_rate
        CHECK (unit_rate >= 0)
);


-- ============================================================
-- 14. BILL
-- ============================================================

CREATE TABLE IF NOT EXISTS Bill (
    meter_id INT NOT NULL,
    billing_month DATE NOT NULL,
    bill_id INT NOT NULL UNIQUE,
    billing_date DATE NOT NULL,
    previous_reading DECIMAL(12,2) NOT NULL,
    current_reading DECIMAL(12,2) NOT NULL,
    tariff_code VARCHAR(20) NOT NULL,
    bill_status VARCHAR(30) NOT NULL,

    PRIMARY KEY (meter_id, billing_month),

    CONSTRAINT fk_bill_meter
        FOREIGN KEY (meter_id)
        REFERENCES Meter(meter_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_bill_tariff
        FOREIGN KEY (tariff_code)
        REFERENCES Tariff(tariff_code)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_bill_readings
        CHECK (
            previous_reading >= 0
            AND current_reading >= previous_reading
        ),

    CONSTRAINT chk_bill_status
        CHECK (bill_status IN ('Pending', 'Paid', 'Partially Paid', 'Overdue'))
);


-- ============================================================
-- 15. PAYMENT_SCHEDULE
-- ============================================================

CREATE TABLE IF NOT EXISTS Payment_Schedule (
    payment_sequence INT PRIMARY KEY,
    payment_due_date DATE NOT NULL
);


-- ============================================================
-- 16. PAYMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS Payment (
    bill_id INT NOT NULL,
    payment_sequence INT NOT NULL,
    payment_id INT NOT NULL UNIQUE,
    payment_date DATE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_mode VARCHAR(20) NOT NULL,

    PRIMARY KEY (bill_id, payment_sequence),

    CONSTRAINT fk_payment_bill
        FOREIGN KEY (bill_id)
        REFERENCES Bill(bill_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_payment_schedule
        FOREIGN KEY (payment_sequence)
        REFERENCES Payment_Schedule(payment_sequence)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_payment_amount
        CHECK (amount > 0),

    CONSTRAINT chk_payment_mode
        CHECK (payment_mode IN ('Card', 'Cash', 'UPI'))
);


-- ============================================================
-- 17. CARD
-- ============================================================

CREATE TABLE IF NOT EXISTS Card (
    card_no VARCHAR(30) PRIMARY KEY,
    bank_name VARCHAR(100) NOT NULL
);


-- ============================================================
-- 18. CARD_PAYMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS Card_Payment (
    payment_id INT PRIMARY KEY,
    card_no VARCHAR(30) NOT NULL,

    CONSTRAINT fk_card_payment_payment
        FOREIGN KEY (payment_id)
        REFERENCES Payment(payment_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_card_payment_card
        FOREIGN KEY (card_no)
        REFERENCES Card(card_no)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


-- ============================================================
-- 19. CASH_PAYMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS Cash_Payment (
    payment_id INT PRIMARY KEY,
    receipt_no VARCHAR(50) NOT NULL UNIQUE,

    CONSTRAINT fk_cash_payment_payment
        FOREIGN KEY (payment_id)
        REFERENCES Payment(payment_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);


-- ============================================================
-- 20. UPI_PAYMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS UPI_Payment (
    payment_id INT PRIMARY KEY,
    upi_id VARCHAR(100) NOT NULL,
    upi_app VARCHAR(50) NOT NULL,

    CONSTRAINT fk_upi_payment_payment
        FOREIGN KEY (payment_id)
        REFERENCES Payment(payment_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);