USE utility_billing_db;


-- ============================================================
-- DASHBOARD 1: TOTAL CUSTOMERS
-- ============================================================

SELECT COUNT(*) AS total_customers
FROM Customer;


-- ============================================================
-- DASHBOARD 2: TOTAL PROPERTIES
-- ============================================================

SELECT COUNT(*) AS total_properties
FROM Property;


-- ============================================================
-- DASHBOARD 3: TOTAL METERS
-- ============================================================

SELECT COUNT(*) AS total_meters
FROM Meter;


-- ============================================================
-- DASHBOARD 4: ACTIVE METERS
-- ============================================================

SELECT COUNT(*) AS active_meters
FROM Meter
WHERE meter_status = 'Active';


-- ============================================================
-- DASHBOARD 5: TOTAL BILLS
-- ============================================================

SELECT COUNT(*) AS total_bills
FROM Bill;


-- ============================================================
-- DASHBOARD 6: PAID BILLS
-- ============================================================

SELECT COUNT(*) AS paid_bills
FROM Bill
WHERE bill_status = 'Paid';


-- ============================================================
-- DASHBOARD 7: PENDING BILLS
-- ============================================================

SELECT COUNT(*) AS pending_bills
FROM Bill
WHERE bill_status = 'Pending';


-- ============================================================
-- DASHBOARD 8: OVERDUE BILLS
-- ============================================================

SELECT COUNT(*) AS overdue_bills
FROM Bill
WHERE bill_status = 'Overdue';


-- ============================================================
-- DASHBOARD 9: PARTIALLY PAID BILLS
-- ============================================================

SELECT COUNT(*) AS partially_paid_bills
FROM Bill
WHERE bill_status = 'Partially Paid';


-- ============================================================
-- DASHBOARD 10: TOTAL REVENUE
-- ============================================================

SELECT
    COALESCE(SUM(amount), 0) AS total_revenue
FROM Payment;


-- ============================================================
-- DASHBOARD 11: TOTAL PAYMENTS
-- ============================================================

SELECT COUNT(*) AS total_payments
FROM Payment;


-- ============================================================
-- DASHBOARD 12: TOTAL CONSUMPTION
-- ============================================================

SELECT
    COALESCE(
        SUM(current_reading - previous_reading),
        0
    ) AS total_consumption
FROM Bill;


-- ============================================================
-- DASHBOARD 13: CONSUMPTION BY MONTH
-- ============================================================

SELECT
    DATE_FORMAT(billing_month, '%Y-%m') AS month,
    SUM(current_reading - previous_reading) AS consumption
FROM Bill
GROUP BY DATE_FORMAT(billing_month, '%Y-%m')
ORDER BY month;


-- ============================================================
-- DASHBOARD 14: REVENUE BY MONTH
-- ============================================================

SELECT
    DATE_FORMAT(payment_date, '%Y-%m') AS month,
    SUM(amount) AS revenue
FROM Payment
GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
ORDER BY month;


-- ============================================================
-- DASHBOARD 15: PAYMENT METHODS
-- ============================================================

SELECT
    payment_mode,
    COUNT(*) AS payment_count,
    SUM(amount) AS total_amount
FROM Payment
GROUP BY payment_mode
ORDER BY payment_count DESC;


-- ============================================================
-- DASHBOARD 16: BILL STATUS DISTRIBUTION
-- ============================================================

SELECT
    bill_status,
    COUNT(*) AS bill_count
FROM Bill
GROUP BY bill_status;


-- ============================================================
-- DASHBOARD 17: TOP CONSUMING METERS
-- ============================================================

SELECT
    meter_id,
    SUM(current_reading - previous_reading)
        AS total_consumption
FROM Bill
GROUP BY meter_id
ORDER BY total_consumption DESC
LIMIT 10;


-- ============================================================
-- DASHBOARD 18: CUSTOMER BILL SUMMARY
-- ============================================================

SELECT
    c.cust_id,
    c.cust_name,
    COUNT(b.bill_id) AS bill_count,
    SUM(
        b.current_reading - b.previous_reading
    ) AS total_consumption
FROM Customer c
JOIN Customer_Owns_Property cop
    ON c.cust_id = cop.cust_id
JOIN Property_Incorporate_Meter pim
    ON cop.property_id = pim.property_id
JOIN Bill b
    ON pim.meter_id = b.meter_id
GROUP BY
    c.cust_id,
    c.cust_name
ORDER BY total_consumption DESC;


-- ============================================================
-- DASHBOARD 19: SERVICE DISTRIBUTION
-- ============================================================

SELECT
    CASE
        WHEN es.service_id IS NOT NULL
            THEN 'Electricity'
        WHEN ws.service_id IS NOT NULL
            THEN 'Water'
        ELSE 'Other'
    END AS service_type,
    COUNT(*) AS service_count
FROM Utility_Service us
LEFT JOIN Electricity_Service es
    ON us.service_id = es.service_id
LEFT JOIN Water_Service ws
    ON us.service_id = ws.service_id
GROUP BY service_type;


-- ============================================================
-- DASHBOARD 20: METER STATUS DISTRIBUTION
-- ============================================================

SELECT
    meter_status,
    COUNT(*) AS meter_count
FROM Meter
GROUP BY meter_status;