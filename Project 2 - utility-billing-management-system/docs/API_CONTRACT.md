# Utility Billing Management System

## API Contract

### Base URL

`http://localhost:5000/api`

---

# 1. Customers

## GET /customers

Returns all customers.

### Response

```json
{
  "success": true,
  "data": [
    {
      "cust_id": 1,
      "cust_name": "John Doe",
      "apartment": "Sunrise Apartments",
      "flat_no": "A-101",
      "city": "Chennai",
      "dob": "1995-05-10"
    }
  ]
}
```

## GET /customers/:id

Returns one customer by customer ID.

### Example

`GET /customers/1`

## POST /customers

Creates a new customer.

### Request Body

```json
{
  "cust_id": 1,
  "cust_name": "John Doe",
  "apartment": "Sunrise Apartments",
  "flat_no": "A-101",
  "city": "Chennai",
  "dob": "1995-05-10"
}
```

## PUT /customers/:id

Updates an existing customer.

### Request Body

```json
{
  "cust_name": "John Doe",
  "apartment": "Sunrise Apartments",
  "flat_no": "A-102",
  "city": "Chennai",
  "dob": "1995-05-10"
}
```

## DELETE /customers/:id

Deletes a customer by customer ID.

---

# 2. Properties

## GET /properties

Returns all properties.

### Response

```json
{
  "success": true,
  "data": [
    {
      "property_id": 101,
      "property_name": "Sunrise Apartments",
      "occupancy_status": "Occupied"
    }
  ]
}
```

## GET /properties/:id

Returns one property by property ID.

### Example

`GET /properties/101`

---

# 3. Meters

## GET /meters

Returns all meters.

### Response

```json
{
  "success": true,
  "data": [
    {
      "meter_id": 1001,
      "capacity": 10,
      "installation_date": "2025-01-15",
      "meter_status": "Active"
    }
  ]
}
```

## GET /meters/:id

Returns one meter by meter ID.

### Example

`GET /meters/1001`

---

# 4. Meter Readings

## GET /readings

Returns all meter readings.

### Response

```json
{
  "success": true,
  "data": [
    {
      "meter_id": 1001,
      "reading_no": 1,
      "reading_date": "2024-12-31T18:30:00.000Z",
      "reading_value": "1200.00",
      "reading_status": "Valid"
    }
  ]
}
```

## GET /readings/:meterId

Returns all readings for a specific meter.

### Example

`GET /readings/1001`

---

# 5. Utility Services

## GET /services

Returns all utility services.

### Response

```json
{
  "success": true,
  "data": [
    {
      "service_id": 1,
      "fixed_charge": "50.00",
      "unit_rate": "8.5000",
      "tax": "5.00"
    }
  ]
}
```

## GET /services/:id

Returns one utility service by service ID.

### Example

`GET /services/1`

---

# 6. Electricity Services

## GET /electricity-services

Returns electricity-specific service information.

### Response

```json
{
  "success": true,
  "data": [
    {
      "service_id": 1,
      "fixed_charge": "50.00",
      "unit_rate": "8.5000",
      "tax": "5.00",
      "voltage_level": "230V"
    }
  ]
}
```

## GET /electricity-services/:id

Returns one electricity service by service ID.

### Example

`GET /electricity-services/1`

---

# 7. Water Services

## GET /water-services

Returns water-specific service information.

### Response

```json
{
  "success": true,
  "data": [
    {
      "service_id": 2,
      "fixed_charge": "30.00",
      "unit_rate": "6.0000",
      "tax": "5.00",
      "water_source": "Municipal"
    }
  ]
}
```

## GET /water-services/:id

Returns one water service by service ID.

### Example

`GET /water-services/2`

---

# 8. Bills

## GET /bills

Returns all bills.

### Response

```json
{
  "success": true,
  "data": [
    {
      "meter_id": 1001,
      "billing_month": "2025-01",
      "bill_id": 1001,
      "billing_date": "2025-01-01",
      "previous_reading": "1200.00",
      "current_reading": "1350.00",
      "tariff_code": "ELEC-A",
      "bill_status": "Pending"
    }
  ]
}
```

## GET /bills/:id

Returns one bill using `bill_id`.

### Example

`GET /bills/1001`

---

# 9. Payments

## GET /payments

Returns all payments.

### Response

```json
{
  "success": true,
  "data": [
    {
      "bill_id": 1001,
      "payment_sequence": 1,
      "payment_id": 9001,
      "payment_date": "2025-02-10",
      "amount": "1200.00",
      "payment_mode": "UPI",
      "payment_due_date": "2025-02-09"
    }
  ]
}
```

## GET /payments/:id

Returns one payment using `payment_id`.

### Example

`GET /payments/9001`

---

# 10. Customer Ownership

## GET /ownerships

Returns all customer-property ownership relationships.

### Response

```json
{
  "success": true,
  "data": [
    {
      "cust_id": 1,
      "property_id": 101,
      "ownership_date": "2020-06-14T18:30:00.000Z",
      "ownership_type": "Owner"
    }
  ]
}
```

## GET /ownerships/customer/:customerId

Returns ownership records for a specific customer.

### Example

`GET /ownerships/customer/1`

## GET /ownerships/:customerId/:propertyId

Returns a specific customer-property ownership relationship.

### Example

`GET /ownerships/1/101`

---

# 11. Customer Phone Numbers

## GET /customer-phones

Returns all customer phone numbers.

### Response

```json
{
  "success": true,
  "data": [
    {
      "cust_id": 1,
      "phone_no": "9123456780"
    }
  ]
}
```

## GET /customer-phones/customer/:customerId

Returns phone numbers for a specific customer.

### Example

`GET /customer-phones/customer/1`

## GET /customer-phones/:customerId/:phoneNo

Returns a specific customer phone record.

### Example

`GET /customer-phones/1/9123456780`

---

# 12. Customer Email Addresses

## GET /customer-emails

Returns all customer email addresses.

### Response

```json
{
  "success": true,
  "data": [
    {
      "cust_id": 1,
      "email": "arun@example.com"
    }
  ]
}
```

## GET /customer-emails/customer/:customerId

Returns email addresses for a specific customer.

### Example

`GET /customer-emails/customer/1`

## GET /customer-emails/:customerId/:email

Returns a specific customer email record.

### Example

`GET /customer-emails/1/arun@example.com`

---

# 13. Property-Meter Relationships

## GET /property-meters

Returns all property-meter relationships.

### Response

```json
{
  "success": true,
  "data": [
    {
      "property_id": 101,
      "meter_id": 1001
    }
  ]
}
```

## GET /property-meters/property/:propertyId

Returns meters associated with a specific property.

### Example

`GET /property-meters/property/101`

## GET /property-meters/meter/:meterId

Returns the property associated with a specific meter.

### Example

`GET /property-meters/meter/1001`

---

# 14. Meter-Service Relationships

## GET /meter-services

Returns all meter-service relationships.

### Response

```json
{
  "success": true,
  "data": [
    {
      "meter_id": 1001,
      "service_id": 1
    }
  ]
}
```

## GET /meter-services/meter/:meterId

Returns services associated with a specific meter.

### Example

`GET /meter-services/meter/1001`

## GET /meter-services/service/:serviceId

Returns meters associated with a specific service.

### Example

`GET /meter-services/service/1`

## GET /meter-services/:meterId/:serviceId

Returns a specific meter-service relationship.

### Example

`GET /meter-services/1001/1`

---

# 15. Tariffs

## GET /tariffs

Returns all tariffs.

### Response

```json
{
  "success": true,
  "data": [
    {
      "tariff_code": "ELEC-A",
      "unit_rate": "8.5000"
    }
  ]
}
```

## GET /tariffs/:code

Returns one tariff by tariff code.

### Example

`GET /tariffs/ELEC-A`

---

# 16. Payment Schedules

## GET /payment-schedules

Returns all payment schedules.

### Response

```json
{
  "success": true,
  "data": [
    {
      "payment_sequence": 1,
      "payment_due_date": "2025-02-09T18:30:00.000Z"
    }
  ]
}
```

## GET /payment-schedules/:sequence

Returns one payment schedule by payment sequence.

### Example

`GET /payment-schedules/1`

---

# 17. Card Payments

## GET /card-payments

Returns all card payment records.

### Response

```json
{
  "success": true,
  "data": [
    {
      "payment_id": 9001,
      "card_no": "CARD10001",
      "bank_name": "State Bank"
    }
  ]
}
```

## GET /card-payments/:id

Returns one card payment by payment ID.

### Example

`GET /card-payments/9001`

## GET /card-payments/cards

Returns all card records.

### Response

```json
{
  "success": true,
  "data": [
    {
      "card_no": "CARD10001",
      "bank_name": "State Bank"
    }
  ]
}
```

## GET /card-payments/cards/:cardNo

Returns one card by card number.

### Example

`GET /card-payments/cards/CARD10001`

---

# 18. Cash Payments

## GET /cash-payments

Returns all cash payment records.

### Response

```json
{
  "success": true,
  "data": [
    {
      "payment_id": 9003,
      "receipt_no": "REC10001"
    }
  ]
}
```

## GET /cash-payments/:id

Returns one cash payment by payment ID.

### Example

`GET /cash-payments/9003`

---

# 19. UPI Payments

## GET /upi-payments

Returns all UPI payment records.

### Response

```json
{
  "success": true,
  "data": [
    {
      "payment_id": 9002,
      "upi_id": "arun@upi",
      "upi_app": "Google Pay"
    }
  ]
}
```

## GET /upi-payments/:id

Returns one UPI payment by payment ID.

### Example

`GET /upi-payments/9002`

---

# 20. Dashboard

## GET /dashboard/summary

Returns overall dashboard statistics.

### Response

```json
{
  "success": true,
  "data": {
    "total_customers": 10,
    "total_properties": 6,
    "total_meters": 10,
    "total_bills": 30,
    "total_revenue": "22725.00"
  }
}
```

## GET /dashboard/bill-status

Returns bills grouped by bill status.

### Response

```json
{
  "success": true,
  "data": [
    {
      "bill_status": "Paid",
      "count": 18
    },
    {
      "bill_status": "Pending",
      "count": 8
    }
  ]
}
```

## GET /dashboard/payment-methods

Returns payment statistics grouped by payment mode.

### Response

```json
{
  "success": true,
  "data": [
    {
      "payment_mode": "Card",
      "count": 7,
      "total_amount": "9140.00"
    },
    {
      "payment_mode": "UPI",
      "count": 7,
      "total_amount": "9815.00"
    },
    {
      "payment_mode": "Cash",
      "count": 5,
      "total_amount": "3770.00"
    }
  ]
}
```

---

# 21. Error Responses

## Server Error

```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Resource Not Found

Example:

```json
{
  "success": false,
  "message": "Customer not found"
}
```

## Invalid Request

Example:

```json
{
  "success": false,
  "message": "Customer ID is required"
}
```

---

# 22. Backend and Frontend Rules

- The frontend communicates with the backend using HTTP and JSON.
- The frontend must not connect directly to MySQL.
- The backend communicates with MySQL using `mysql2`.
- Database credentials are stored in `.env`.
- `.env` must not be committed to Git.
- `.env.example` can be committed to Git.
- API field names should not be changed without coordinating with the frontend and database team.
- The example values in this document are sample values only and do not represent actual database records.

---

# 23. Current API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/customers` | Get all customers |
| GET | `/customers/:id` | Get customer by ID |
| POST | `/customers` | Create customer |
| PUT | `/customers/:id` | Update customer |
| DELETE | `/customers/:id` | Delete customer |
| GET | `/properties` | Get all properties |
| GET | `/properties/:id` | Get property by ID |
| GET | `/meters` | Get all meters |
| GET | `/meters/:id` | Get meter by ID |
| GET | `/readings` | Get all meter readings |
| GET | `/readings/:meterId` | Get readings by meter |
| GET | `/services` | Get all utility services |
| GET | `/services/:id` | Get service by ID |
| GET | `/electricity-services` | Get electricity services |
| GET | `/electricity-services/:id` | Get electricity service by ID |
| GET | `/water-services` | Get water services |
| GET | `/water-services/:id` | Get water service by ID |
| GET | `/bills` | Get all bills |
| GET | `/bills/:id` | Get bill by ID |
| GET | `/payments` | Get all payments |
| GET | `/payments/:id` | Get payment by ID |
| GET | `/ownerships` | Get all ownership records |
| GET | `/ownerships/customer/:customerId` | Get ownerships by customer |
| GET | `/ownerships/:customerId/:propertyId` | Get specific ownership |
| GET | `/customer-phones` | Get all customer phone records |
| GET | `/customer-phones/customer/:customerId` | Get phones by customer |
| GET | `/customer-phones/:customerId/:phoneNo` | Get specific phone |
| GET | `/customer-emails` | Get all customer email records |
| GET | `/customer-emails/customer/:customerId` | Get emails by customer |
| GET | `/customer-emails/:customerId/:email` | Get specific email |
| GET | `/property-meters` | Get all property-meter relationships |
| GET | `/property-meters/property/:propertyId` | Get meters by property |
| GET | `/property-meters/meter/:meterId` | Get property by meter |
| GET | `/meter-services` | Get all meter-service relationships |
| GET | `/meter-services/meter/:meterId` | Get services by meter |
| GET | `/meter-services/service/:serviceId` | Get meters by service |
| GET | `/meter-services/:meterId/:serviceId` | Get specific meter-service relationship |
| GET | `/tariffs` | Get all tariffs |
| GET | `/tariffs/:code` | Get tariff by code |
| GET | `/payment-schedules` | Get all payment schedules |
| GET | `/payment-schedules/:sequence` | Get payment schedule by sequence |
| GET | `/card-payments` | Get all card payments |
| GET | `/card-payments/:id` | Get card payment by ID |
| GET | `/card-payments/cards` | Get all cards |
| GET | `/card-payments/cards/:cardNo` | Get card by card number |
| GET | `/cash-payments` | Get all cash payments |
| GET | `/cash-payments/:id` | Get cash payment by ID |
| GET | `/upi-payments` | Get all UPI payments |
| GET | `/upi-payments/:id` | Get UPI payment by ID |
| GET | `/dashboard/summary` | Get dashboard summary |
| GET | `/dashboard/bill-status` | Get bill status statistics |
| GET | `/dashboard/payment-methods` | Get payment method statistics |

---

# 24. Database Coverage

The backend API layer provides access to the project's database entities and relationships, including:

1. CUSTOMER
2. CUSTOMER_PHONE
3. CUSTOMER_EMAIL
4. PROPERTY
5. CUSTOMER_OWNS_PROPERTY
6. METER
7. PROPERTY_INCORPORATE_METER
8. METER_READING
9. UTILITY_SERVICE
10. ELECTRICITY_SERVICE
11. WATER_SERVICE
12. METER_SERVICE
13. TARIFF
14. BILL
15. PAYMENT
16. PAYMENT_SCHEDULE
17. CARD
18. CARD_PAYMENT
19. CASH_PAYMENT
20. UPI_PAYMENT

---

# 25. Backend Architecture

```text
React Frontend
      |
      | HTTP / JSON
      v
Node.js + Express Backend
      |
      | mysql2
      v
MySQL Database
```

The frontend does not connect directly to MySQL.

The backend is responsible for:

- API routing
- Request handling
- Input validation
- Database queries
- JSON responses
- Error handling
- Dashboard queries
- Relationship queries
- Service specialization queries
- Payment specialization queries