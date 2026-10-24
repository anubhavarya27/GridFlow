USE utility_billing_db;


-- ============================================================
-- 1. TOTAL NUMBER OF CUSTOMERS
-- ============================================================

SELECT COUNT(*) AS total_customers
FROM Customer;


-- ============================================================
-- 2. TOTAL NUMBER OF PROPERTIES
-- ============================================================

SELECT COUNT(*) AS total_properties
FROM Property;


-- ============================================================
-- 3. TOTAL NUMBER OF ACTIVE METERS
-- ============================================================

SELECT COUNT(*) AS active_meters
FROM Meter
WHERE meter_status = 'Active';


-- ============================================================
-- 4. TOTAL NUMBER OF BILLS
-- ============================================================

SELECT COUNT(*) AS total_bills
FROM Bill;


-- ============================================================
-- 5. BILL COUNT BY STATUS
-- ============================================================

SELECT
    bill_status,
    COUNT(*) AS number_of_bills
FROM Bill
GROUP BY bill_status;


-- ============================================================
-- 6. TOTAL PAYMENT AMOUNT
-- ============================================================

SELECT
    SUM(amount) AS total_payments
FROM Payment;


-- ============================================================
-- 7. PAYMENT TOTAL BY PAYMENT MODE
-- ============================================================

SELECT
    payment_mode,
    COUNT(*) AS number_of_payments,
    SUM(amount) AS total_amount
FROM Payment
GROUP BY payment_mode;


-- ============================================================
-- 8. AVERAGE PAYMENT AMOUNT
-- ============================================================

SELECT
    AVG(amount) AS average_payment
FROM Payment;


-- ============================================================
-- 9. MAXIMUM PAYMENT
-- ============================================================

SELECT
    MAX(amount) AS maximum_payment
FROM Payment;


-- ============================================================
-- 10. MINIMUM PAYMENT
-- ============================================================

SELECT
    MIN(amount) AS minimum_payment
FROM Payment;


-- ============================================================
-- 11. TOTAL CONSUMPTION BY METER
-- ============================================================

SELECT
    meter_id,
    SUM(current_reading - previous_reading) AS total_consumption
FROM Bill
GROUP BY meter_id
ORDER BY total_consumption DESC;


-- ============================================================
-- 12. AVERAGE CONSUMPTION BY METER
-- ============================================================

SELECT
    meter_id,
    AVG(current_reading - previous_reading) AS average_consumption
FROM Bill
GROUP BY meter_id;


-- ============================================================
-- 13. METERS WITH CONSUMPTION ABOVE 150 UNITS
-- ============================================================

SELECT
    meter_id,
    billing_month,
    current_reading - previous_reading AS consumption
FROM Bill
WHERE current_reading - previous_reading > 150;


-- ============================================================
-- 14. CUSTOMERS WITH THEIR PROPERTY AND METER
-- ============================================================

SELECT
    c.cust_name,
    p.property_name,
    m.meter_id
FROM Customer c
JOIN Customer_Owns_Property cop
    ON c.cust_id = cop.cust_id
JOIN Property p
    ON cop.property_id = p.property_id
JOIN Property_Incorporate_Meter pim
    ON p.property_id = pim.property_id
JOIN Meter m
    ON pim.meter_id = m.meter_id
ORDER BY c.cust_name;


-- ============================================================
-- 15. CUSTOMERS WITH BILLS
-- ============================================================

SELECT
    c.cust_id,
    c.cust_name,
    b.bill_id,
    b.billing_month,
    b.bill_status
FROM Customer c
JOIN Customer_Owns_Property cop
    ON c.cust_id = cop.cust_id
JOIN Property_Incorporate_Meter pim
    ON cop.property_id = pim.property_id
JOIN Bill b
    ON pim.meter_id = b.meter_id;


-- ============================================================
-- 16. CUSTOMERS WITH OUTSTANDING/PENDING BILLS
-- ============================================================

SELECT
    c.cust_id,
    c.cust_name,
    b.bill_id,
    b.billing_month,
    b.bill_status
FROM Customer c
JOIN Customer_Owns_Property cop
    ON c.cust_id = cop.cust_id
JOIN Property_Incorporate_Meter pim
    ON cop.property_id = pim.property_id
JOIN Bill b
    ON pim.meter_id = b.meter_id
WHERE b.bill_status IN ('Pending', 'Partially Paid', 'Overdue');


-- ============================================================
-- 17. BILL CONSUMPTION AND TARIFF RATE
-- ============================================================

SELECT
    b.bill_id,
    b.meter_id,
    b.billing_month,
    b.current_reading - b.previous_reading AS consumption,
    t.unit_rate,
    (b.current_reading - b.previous_reading) * t.unit_rate
        AS energy_charge
FROM Bill b
JOIN Tariff t
    ON b.tariff_code = t.tariff_code;


-- ============================================================
-- 18. BILLS WITH ESTIMATED PAYMENT VALUE
-- ============================================================

SELECT
    b.bill_id,
    b.meter_id,
    b.billing_month,
    b.current_reading - b.previous_reading AS consumption,
    t.unit_rate,
    (
        (b.current_reading - b.previous_reading) * t.unit_rate
    ) AS estimated_charge
FROM Bill b
JOIN Tariff t
    ON b.tariff_code = t.tariff_code;


-- ============================================================
-- 19. TOTAL REVENUE BY MONTH
-- ============================================================

SELECT
    DATE_FORMAT(payment_date, '%Y-%m') AS payment_month,
    SUM(amount) AS total_revenue
FROM Payment
GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
ORDER BY payment_month;


-- ============================================================
-- 20. PAYMENT COUNT BY MODE
-- ============================================================

SELECT
    payment_mode,
    COUNT(*) AS payment_count
FROM Payment
GROUP BY payment_mode
ORDER BY payment_count DESC;


-- ============================================================
-- 21. CUSTOMERS HAVING MORE THAN ONE PHONE NUMBER
-- ============================================================

SELECT
    cust_id,
    COUNT(*) AS phone_count
FROM Customer_Phone
GROUP BY cust_id
HAVING COUNT(*) > 1;


-- ============================================================
-- 22. METERS WITH MORE THAN TWO READINGS
-- ============================================================

SELECT
    meter_id,
    COUNT(*) AS reading_count
FROM Meter_Reading
GROUP BY meter_id
HAVING COUNT(*) > 2;


-- ============================================================
-- 23. HIGHEST CONSUMPTION BILL
-- ============================================================

SELECT
    bill_id,
    meter_id,
    billing_month,
    current_reading - previous_reading AS consumption
FROM Bill
WHERE current_reading - previous_reading = (
    SELECT MAX(current_reading - previous_reading)
    FROM Bill
);


-- ============================================================
-- 24. HIGHEST PAYMENT
-- ============================================================

SELECT
    payment_id,
    bill_id,
    amount,
    payment_mode
FROM Payment
WHERE amount = (
    SELECT MAX(amount)
    FROM Payment
);


-- ============================================================
-- 25. CUSTOMERS WHO HAVE AT LEAST ONE PAID BILL
-- ============================================================

SELECT DISTINCT
    c.cust_id,
    c.cust_name
FROM Customer c
JOIN Customer_Owns_Property cop
    ON c.cust_id = cop.cust_id
JOIN Property_Incorporate_Meter pim
    ON cop.property_id = pim.property_id
JOIN Bill b
    ON pim.meter_id = b.meter_id
WHERE b.bill_status = 'Paid';


-- ============================================================
-- 26. CUSTOMERS WHO HAVE NO BILL
-- ============================================================

SELECT
    c.cust_id,
    c.cust_name
FROM Customer c
WHERE NOT EXISTS (
    SELECT 1
    FROM Customer_Owns_Property cop
    JOIN Property_Incorporate_Meter pim
        ON cop.property_id = pim.property_id
    JOIN Bill b
        ON pim.meter_id = b.meter_id
    WHERE cop.cust_id = c.cust_id
);


-- ============================================================
-- 27. BILL STATUS USING CASE
-- ============================================================

SELECT
    bill_id,
    meter_id,
    billing_month,
    CASE
        WHEN bill_status = 'Paid'
            THEN 'Payment Completed'
        WHEN bill_status = 'Partially Paid'
            THEN 'Payment Incomplete'
        WHEN bill_status = 'Pending'
            THEN 'Payment Required'
        WHEN bill_status = 'Overdue'
            THEN 'Payment Overdue'
        ELSE 'Unknown'
    END AS payment_description
FROM Bill;


-- ============================================================
-- 28. SERVICE TYPE
-- ============================================================

SELECT
    us.service_id,
    CASE
        WHEN es.service_id IS NOT NULL
            THEN 'Electricity'
        WHEN ws.service_id IS NOT NULL
            THEN 'Water'
        ELSE 'Other'
    END AS service_type,
    us.unit_rate
FROM Utility_Service us
LEFT JOIN Electricity_Service es
    ON us.service_id = es.service_id
LEFT JOIN Water_Service ws
    ON us.service_id = ws.service_id;


-- ============================================================
-- 29. TOTAL CONSUMPTION BY BILLING MONTH
-- ============================================================

SELECT
    billing_month,
    SUM(current_reading - previous_reading) AS total_consumption
FROM Bill
GROUP BY billing_month
ORDER BY billing_month;


-- ============================================================
-- 30. BILL COUNT BY MONTH
-- ============================================================

SELECT
    billing_month,
    COUNT(*) AS bill_count
FROM Bill
GROUP BY billing_month
ORDER BY billing_month;