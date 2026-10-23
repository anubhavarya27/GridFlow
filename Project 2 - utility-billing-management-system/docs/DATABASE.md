# Database Reference

Linked from [README.md](../README.md#7-database-design). Full table list, keys, and constraints.

## 20 Core Domain Tables

### Customer & Property Domain
| Table | Purpose |
|---|---|
| `CUSTOMER` | Customer master information |
| `CUSTOMER_PHONE` | Multiple phone numbers per customer |
| `CUSTOMER_EMAIL` | Multiple email addresses per customer |
| `PROPERTY` | Property information |
| `CUSTOMER_OWNS_PROPERTY` | Customer-property ownership relationship |

### Metering Domain
| Table | Purpose |
|---|---|
| `METER` | Meter details |
| `PROPERTY_INCORPORATE_METER` | Property-meter association |
| `METER_READING` | Historical meter readings |

### Utility Services
| Table | Purpose |
|---|---|
| `UTILITY_SERVICE` | General utility service information |
| `ELECTRICITY_SERVICE` | Electricity specialization |
| `WATER_SERVICE` | Water specialization |
| `METER_SERVICE` | Meter-service relationship |
| `TARIFF` | Tariff codes and rates |

### Billing & Payments
| Table | Purpose |
|---|---|
| `BILL` | Utility billing information |
| `PAYMENT` | Payment records |
| `PAYMENT_SCHEDULE` | Payment schedules and due dates |
| `CARD` | Card information |
| `CARD_PAYMENT` | Card-payment specialization |
| `CASH_PAYMENT` | Cash-payment specialization |
| `UPI_PAYMENT` | UPI-payment specialization |

### Application & Workflow (beyond the 20 domain tables)
| Table | Purpose |
|---|---|
| `users` | Application users, password hashes and roles |
| `access_requests` | General controlled-access workflow |
| `QUERY_REQUEST` | Query Studio approval workflow |

## Keys

**Primary Keys**
```text
CUSTOMER(cust_id)  PROPERTY(property_id)  METER(meter_id)
UTILITY_SERVICE(service_id)  TARIFF(tariff_code)  CARD(card_no)
```

**Composite Keys**
```text
CUSTOMER_PHONE(cust_id, phone_no)
CUSTOMER_EMAIL(cust_id, email)
CUSTOMER_OWNS_PROPERTY(cust_id, property_id)
METER_READING(meter_id, reading_no)
METER_SERVICE(meter_id, service_id)
BILL(meter_id, billing_month)
PAYMENT(bill_id, payment_sequence)
```

**Foreign Keys (representative)**
```text
CUSTOMER_OWNS_PROPERTY → CUSTOMER, PROPERTY
PROPERTY_INCORPORATE_METER → PROPERTY, METER
METER_READING → METER
METER_SERVICE → METER, UTILITY_SERVICE
BILL → METER, TARIFF
PAYMENT → BILL, PAYMENT_SCHEDULE
```

## Specialization / Generalization

```text
UTILITY_SERVICE
   ├── ELECTRICITY_SERVICE
   └── WATER_SERVICE

PAYMENT
   ├── CARD_PAYMENT
   ├── CASH_PAYMENT
   └── UPI_PAYMENT
```

## Check Constraints (representative)

```text
Meter capacity > 0
Meter reading value >= 0
Bill current reading >= previous reading
Payment amount > 0
Tariff unit rate >= 0
```

## Database Verification

```sql
USE utility_billing_db;
SHOW TABLES;

SELECT COUNT(*) FROM CUSTOMER;
SELECT COUNT(*) FROM PROPERTY;
SELECT COUNT(*) FROM METER;
SELECT COUNT(*) FROM METER_READING;
SELECT COUNT(*) FROM UTILITY_SERVICE;
SELECT COUNT(*) FROM BILL;
SELECT COUNT(*) FROM PAYMENT;

-- Inspect foreign-key relationships
SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME,
       REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'utility_billing_db'
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME;
```
