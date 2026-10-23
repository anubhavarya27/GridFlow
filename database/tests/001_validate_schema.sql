SELECT COUNT(*) AS application_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name IN (
    'customer', 'customer_phone', 'customer_email',
    'property', 'customer_owns_property', 'meter',
    'property_incorporate_meter', 'meter_reading',
    'utility_service', 'electricity_service', 'water_service',
    'meter_service', 'tariff', 'bill', 'payment_schedule',
    'payment', 'card', 'card_payment', 'cash_payment',
    'upi_payment'
  );
