# Complete Functionality Reference

Linked from [README.md](../README.md#5-feature-areas). Full field-level and workflow detail for every module.

## Customer Management

Customer records include: Customer ID, Customer name, Apartment, Flat number, City, Date of birth.

Contact information is separated into `CUSTOMER_PHONE` and `CUSTOMER_EMAIL`, supporting multiple phone numbers and email addresses without repeating attributes inside `CUSTOMER`.

- Retrieve, create, update, and delete customers
- Maintain multiple phone numbers and email addresses

## Property Management

Property records include: Property ID, Property name, Occupancy status.

Customer ownership is represented through `CUSTOMER_OWNS_PROPERTY`, containing: Customer, Property, Ownership date, Ownership type.

- Retrieve property records, track occupancy, connect customers and properties

## Meter Management

Meters store: Meter ID, Capacity, Installation date, Meter status.

Properties and meters are associated through `PROPERTY_INCORPORATE_METER`. Meter readings use the composite identifier `(meter_id, reading_no)`.

- Retrieve meters; track capacity, installation date, meter status
- Retrieve and add meter readings

## Meter Reading Management

Historical readings include: Meter ID, Reading number, Reading date, Reading value, Reading status — supporting billing based on previous and current readings.

## Utility Service Management

`UTILITY_SERVICE` stores: Service ID, Fixed charge, Unit rate, Tax.

Specialization:

```text
UTILITY_SERVICE
   ├── ELECTRICITY_SERVICE (+ voltage level)
   └── WATER_SERVICE (+ water source)
```

- Retrieve common/electricity/water services; associate services with meters

## Tariff Management

Tariffs contain: Tariff code, Unit rate. Bills reference the applicable tariff via foreign key.

- Retrieve tariff records, maintain unit rates, associate tariffs with bills

## Billing Management

Bills store: Meter ID, Billing month, Bill ID, Billing date, Previous reading, Current reading, Tariff code, Bill status.

Identifying composite key: `(meter_id, billing_month)`. The bill amount is derived from billing information and applicable charges rather than being an independent base attribute in the conceptual design.

- Retrieve, create, and update bills; track previous/current readings, tariff, bill status

## Payment Management

Payments contain: Bill ID, Payment sequence, Payment date, Amount, Payment mode, Payment due date.

Specialization:

```text
PAYMENT
   ├── CARD_PAYMENT ── CARD
   ├── CASH_PAYMENT (+ receipt information)
   └── UPI_PAYMENT (+ UPI ID, UPI application)
```

- Retrieve and create payments; associate payments with bills; track dates, amounts, modes

## Dashboard

Database-backed metrics: total customers, total properties, total meters, revenue, consumption analysis, bill-status distribution, payment-method distribution, recent billing/payment activity, monthly revenue. Values come from backend APIs, not hard-coded frontend values.

## Reports & Analytics

SQL-backed views: customer/property/meter/bill/payment counts, revenue, consumption, monthly consumption, monthly revenue, bill-status distribution, payment-method distribution, top-consuming meters. Maintained separately from core entity controllers.

## Database Explorer

Interactive inspection of the database via backend APIs (never a direct browser-to-MySQL connection): view relations, select tables, retrieve/search/filter records, inspect columns, view record counts.

## Query Studio — Supporting Detail

(See [README §6](../README.md#6-query-studio--controlled-sql-execution) for the classification and approval-lifecycle summary.)

**`QUERY_REQUEST` fields:** request_id, submitted_by, reviewed_by, sql_query, query_type, status, submitted_at, reviewed_at, rejection_reason, execution_result.

**Processing Queue** tracks lifecycle states (`PENDING → APPROVED → EXECUTING → COMPLETED`, `PENDING → REJECTED`, `EXECUTING → FAILED`) and lets users: view requests by state, inspect submitted SQL, view submitter/reviewer info, view rejection reasons and execution results, and refresh the queue (including periodic auto-refresh).

**Admin Approvals** lets administrators: view pending requests, inspect full SQL, view metadata, approve/reject with a reason, review execution results, and track completed/rejected history. Write queries submitted through Query Studio never execute directly from the initial submission path.

## Operations Hub

- **Customer 360** — customer details, properties, associated meters, billing info, payment info
- **Property Portfolio** — properties, occupancy, customer ownership relationships, associated meters
- **Meter Monitor** — meter details, capacity, installation info, status, readings, consumption
- **Tariff Lab** — tariff codes, unit rates, utility service info (electricity/water), billing context
- **Billing Center** — bills, billing periods, readings used for billing, tariffs, bill status, payment schedules, revenue context
- **Payment Hub** — payment records, amount, date, mode, card/cash/UPI payment details
