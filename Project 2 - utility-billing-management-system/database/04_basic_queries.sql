USE utility_billing_db;


-- ============================================================
-- 1. DISPLAY ALL CUSTOMERS
-- ============================================================

SELECT *
FROM Customer;


-- ============================================================
-- 2. DISPLAY CUSTOMERS FROM CHENNAI
-- ============================================================

SELECT *
FROM Customer
WHERE city = 'Chennai';


-- ============================================================
-- 3. DISPLAY OCCUPIED PROPERTIES
-- ============================================================

SELECT *
FROM Property
WHERE occupancy_status = 'Occupied';


-- ============================================================
-- 4. DISPLAY ACTIVE METERS
-- ============================================================

SELECT *
FROM Meter
WHERE meter_status = 'Active';


-- ============================================================
-- 5. DISPLAY BILLS WITH PENDING STATUS
-- ============================================================

SELECT *
FROM Bill
WHERE bill_status = 'Pending';


-- ============================================================
-- 6. DISPLAY OVERDUE BILLS
-- ============================================================

SELECT *
FROM Bill
WHERE bill_status = 'Overdue';


-- ============================================================
-- 7. DISPLAY CUSTOMERS IN ALPHABETICAL ORDER
-- ============================================================

SELECT *
FROM Customer
ORDER BY cust_name;


-- ============================================================
-- 8. DISPLAY METERS BY CAPACITY
-- ============================================================

SELECT *
FROM Meter
ORDER BY capacity DESC;


-- ============================================================
-- 9. DISPLAY BILLS BY BILLING DATE
-- ============================================================

SELECT *
FROM Bill
ORDER BY billing_date DESC;


-- ============================================================
-- 10. DISPLAY CUSTOMERS AND THEIR PHONE NUMBERS
-- ============================================================

SELECT
    c.cust_id,
    c.cust_name,
    cp.phone_no
FROM Customer c
JOIN Customer_Phone cp
    ON c.cust_id = cp.cust_id;


-- ============================================================
-- 11. DISPLAY CUSTOMERS AND EMAILS
-- ============================================================

SELECT
    c.cust_id,
    c.cust_name,
    ce.email
FROM Customer c
JOIN Customer_Email ce
    ON c.cust_id = ce.cust_id;


-- ============================================================
-- 12. DISPLAY CUSTOMERS AND THEIR PROPERTIES
-- ============================================================

SELECT
    c.cust_id,
    c.cust_name,
    p.property_id,
    p.property_name,
    cop.ownership_type,
    cop.ownership_date
FROM Customer c
JOIN Customer_Owns_Property cop
    ON c.cust_id = cop.cust_id
JOIN Property p
    ON cop.property_id = p.property_id;


-- ============================================================
-- 13. DISPLAY PROPERTIES AND METERS
-- ============================================================

SELECT
    p.property_id,
    p.property_name,
    m.meter_id,
    m.capacity,
    m.meter_status
FROM Property p
JOIN Property_Incorporate_Meter pim
    ON p.property_id = pim.property_id
JOIN Meter m
    ON pim.meter_id = m.meter_id;


-- ============================================================
-- 14. DISPLAY METER READINGS
-- ============================================================

SELECT
    meter_id,
    reading_no,
    reading_date,
    reading_value,
    reading_status
FROM Meter_Reading
ORDER BY meter_id, reading_date;


-- ============================================================
-- 15. DISPLAY ALL SERVICES
-- ============================================================

SELECT *
FROM Utility_Service;


-- ============================================================
-- 16. DISPLAY ELECTRICITY SERVICES
-- ============================================================

SELECT
    us.service_id,
    us.fixed_charge,
    us.unit_rate,
    us.tax,
    es.voltage_level
FROM Utility_Service us
JOIN Electricity_Service es
    ON us.service_id = es.service_id;


-- ============================================================
-- 17. DISPLAY WATER SERVICES
-- ============================================================

SELECT
    us.service_id,
    us.fixed_charge,
    us.unit_rate,
    us.tax,
    ws.water_source
FROM Utility_Service us
JOIN Water_Service ws
    ON us.service_id = ws.service_id;


-- ============================================================
-- 18. DISPLAY METERS AND THEIR SERVICES
-- ============================================================

SELECT
    m.meter_id,
    us.service_id,
    us.unit_rate
FROM Meter m
JOIN Meter_Service ms
    ON m.meter_id = ms.meter_id
JOIN Utility_Service us
    ON ms.service_id = us.service_id;


-- ============================================================
-- 19. DISPLAY BILLS WITH TARIFF INFORMATION
-- ============================================================

SELECT
    b.bill_id,
    b.meter_id,
    b.billing_month,
    b.previous_reading,
    b.current_reading,
    t.tariff_code,
    t.unit_rate,
    b.bill_status
FROM Bill b
JOIN Tariff t
    ON b.tariff_code = t.tariff_code;


-- ============================================================
-- 20. CALCULATE CONSUMPTION FOR EACH BILL
-- ============================================================

SELECT
    bill_id,
    meter_id,
    billing_month,
    current_reading - previous_reading AS consumption
FROM Bill;


-- ============================================================
-- 21. DISPLAY PAYMENTS
-- ============================================================

SELECT *
FROM Payment;


-- ============================================================
-- 22. DISPLAY PAYMENT DETAILS WITH BILLS
-- ============================================================

SELECT
    p.payment_id,
    p.bill_id,
    p.payment_date,
    p.amount,
    p.payment_mode
FROM Payment p
JOIN Bill b
    ON p.bill_id = b.bill_id;


-- ============================================================
-- 23. DISPLAY CARD PAYMENTS
-- ============================================================

SELECT
    p.payment_id,
    p.bill_id,
    p.amount,
    cp.card_no,
    c.bank_name
FROM Payment p
JOIN Card_Payment cp
    ON p.payment_id = cp.payment_id
JOIN Card c
    ON cp.card_no = c.card_no;


-- ============================================================
-- 24. DISPLAY CASH PAYMENTS
-- ============================================================

SELECT
    p.payment_id,
    p.bill_id,
    p.amount,
    cp.receipt_no
FROM Payment p
JOIN Cash_Payment cp
    ON p.payment_id = cp.payment_id;


-- ============================================================
-- 25. DISPLAY UPI PAYMENTS
-- ============================================================

SELECT
    p.payment_id,
    p.bill_id,
    p.amount,
    up.upi_id,
    up.upi_app
FROM Payment p
JOIN UPI_Payment up
    ON p.payment_id = up.payment_id;