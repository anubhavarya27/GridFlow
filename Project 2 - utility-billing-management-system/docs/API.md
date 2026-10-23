# REST API Reference

Linked from [README.md](../README.md#9-rest-api). Full endpoint list and request/response examples.

## Core Data APIs

```text
GET/POST/PUT/DELETE  /api/customers
GET/POST/PUT/DELETE  /api/properties
GET/POST/PUT         /api/meters
GET/POST             /api/readings
GET                   /api/services
GET                   /api/electricity-services
GET                   /api/water-services
GET                   /api/tariffs
GET/POST/PUT         /api/bills
GET/POST             /api/payments
GET                   /api/payment-schedules
GET                   /api/ownerships
GET                   /api/customer-phones
GET                   /api/customer-emails
GET                   /api/property-meters
GET                   /api/meter-services
GET                   /api/card-payments
GET                   /api/cash-payments
GET                   /api/upi-payments
```

## Dashboard APIs

```text
GET /api/dashboard
GET /api/dashboard/summary
GET /api/dashboard/consumption
GET /api/dashboard/revenue
GET /api/dashboard/bill-status
GET /api/dashboard/payment-methods
```

## Reporting APIs

```text
GET /api/reports/overview
GET /api/reports/monthly
GET /api/reports/bill-status
GET /api/reports/payment-methods
GET /api/reports/top-meters
```

## Query Studio APIs

```text
POST /api/query
GET  /api/query/requests
GET  /api/query/requests/:id
POST /api/query/requests/:id/approve
POST /api/query/requests/:id/reject
```

## Authentication APIs

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/verify-approval
```

### Login

```http
POST /api/auth/login
```
```json
{
  "username": "testuser",
  "password": "test123",
  "role": "USER"
}
```
A successful login returns a JWT token.

### Registration

```http
POST /api/auth/register
```
Normal registration creates a `USER` account. The predefined administrator username is reserved and cannot be registered through this endpoint.

### Approval Verification

```http
POST /api/auth/verify-approval
```
Verifies the administrator's second approval password and returns a short-lived approval token.

## Query Studio API Details

### Execute or Submit Query

```http
POST /api/query
```
```json
{
  "query": "SELECT * FROM CUSTOMER LIMIT 3"
}
```
Read-only queries execute immediately; write queries are stored as approval requests.

### List / Get Query Requests

```http
GET /api/query/requests
GET /api/query/requests/:id
```

### Approve Query Request

```http
POST /api/query/requests/:id/approve
```
Administrator access required.

### Reject Query Request

```http
POST /api/query/requests/:id/reject
```
Administrator access required.
```json
{
  "rejectionReason": "Operation is not required for the current task."
}
```

## API Response Format

Success:
```json
{ "success": true, "data": {} }
```

Error:
```json
{ "success": false, "message": "Descriptive error message" }
```
