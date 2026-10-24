# GridPulse REST API contract

Base URL: `http://localhost:5000/api` (same as U/BILL; override in the frontend with
`VITE_API_BASE_URL`). JSON in, JSON out. Implemented by the Spring Boot backend in
`backend/src/main/java/com/gridpulse/controller`.

## Conventions

**Envelope** (unchanged from U/BILL):

```json
{ "success": true,  "data": { ... }, "message": "optional" }
{ "success": false, "message": "Human-readable reason", "details": { "optional": "context" } }
```

**Authentication:** every route except `POST /auth/login` and `GET /health` needs
`Authorization: Bearer <token>`. Tokens are HMAC-SHA256 signed by the server, carry the
user id, username and role, and expire after `GRIDPULSE_TOKEN_TTL_MINUTES` (120).
Editing the role inside a token breaks the signature → 401.

**Roles:** `USER` — read access to all billing data, analytics and alerts, may submit
Query Studio writes for approval and mark alerts REVIEWED. `ADMIN` — everything, plus all
data changes, approvals (with the separate approval password), alert resolution,
detection runs and benchmarks. The demo has no customer-scoped accounts (U/BILL's
`users` table was never linked to `CUSTOMER`); `USER` is a read-only staff role, so no
endpoint takes a customer id from the client to decide what someone may see.

**Errors:**

| Status | When |
|---|---|
| 400 | missing/invalid parameter (non-numeric id, bad date, unknown interval, mixed kWh/kL meters …) |
| 401 | no token, bad signature, expired token, wrong username/password |
| 403 | authenticated but not ADMIN, or wrong/missing approval password |
| 404 | record not found, unknown `/api/...` route (JSON, never HTML) |
| 409 | state conflict (bill already exists, request not PENDING, alert already RESOLVED, benchmark already running) or a database constraint violation |
| 410 | `POST /auth/register` (disabled) |
| 422 | business rule (register lower than previous without reset, no tariff, missing cycle reading) |
| 429 | 5 wrong approval passwords within 10 minutes |
| 500 / 503 | unexpected error / database unavailable; generic message, no stack trace or SQL |

Dates are `YYYY-MM-DD`; instants are ISO-8601 with the IST offset (`2026-10-24T00:00+05:30`).

---

## 1. Auth and system

| Method | Path | Auth | Body / params | Notes |
|---|---|---|---|---|
| POST | `/auth/login` | public | `{username, password, role?}` | if `role` (USER/ADMIN, from the login toggle) is sent it must match the account, otherwise 401 |
| GET | `/auth/me` | any | — | identity from the token |
| POST | `/auth/register` | any | — | **410 Gone** — registration removed |
| POST | `/auth/verify-approval` | ADMIN | `{approvalPassword}` | unlocks the Approvals page in the UI; audited; does **not** replace the per-action check |
| GET | `/health` | public | — | `{service, database: UP/DOWN, timescaledb: version or NOT_INSTALLED}` |
| GET | `/audit/approvals` | ADMIN | — | recent `approval_audit` rows (no passwords) |

```http
POST /api/auth/login
{"username":"admin","password":"admin123","role":"ADMIN"}
```
```json
{"success":true,"data":{"token":"djF8MXxhZG1pbnxBRE1JTnwxNzk…","expiresAt":"2026-10-24T04:54:45+05:30",
 "user":{"user_id":1,"username":"admin","role":"ADMIN"}}}
```
Wrong password → `401 {"success":false,"message":"Invalid username or password"}`.
The password is never returned.

## 2. Preserved U/BILL endpoints (same paths, same row shapes)

All `GET`, any authenticated role. Column names are the U/BILL column names.

| Path | Data |
|---|---|
| `/dashboard/summary` | `{total_customers, total_properties, total_meters, total_bills, total_revenue}` |
| `/dashboard/bill-status` | `[{bill_status, bill_count}]` |
| `/dashboard/payment-methods` | `[{payment_mode, payment_count, total_amount}]` |
| `/dashboard/consumption` | `{total_consumption, monthly_consumption:[{month:"YYYY-MM", consumption}]}` (billed units) |
| `/dashboard/revenue` | `[{month, revenue}]` |
| `/dashboard/top-meters`, `/dashboard/customer-summary`, `/dashboard/service-distribution`, `/dashboard/meter-status` | as U/BILL |
| `/reports/overview`, `/reports/monthly`, `/reports/bill-status`, `/reports/payment-methods`, `/reports/top-meters` | as U/BILL |
| `/customers`, `/customers/{id}` | customer rows |
| `/properties`, `/properties/{id}` | |
| `/meters`, `/meters/{id}` | |
| `/readings`, `/readings/{meterId}` | billing-cycle readings (`meter_reading`) |
| `/services`, `/services/{id}`, `/electricity-services[/{id}]`, `/water-services[/{id}]` | |
| `/tariffs`, `/tariffs/{code}` | |
| `/bills`, `/bills/{id}` | U/BILL columns **plus** derived `service_type, unit, units, unit_rate, energy_charge, fixed_charge, tax_percent, tax_amount, total_amount, amount_paid, balance_due, amount_is_derived` |
| `/payments`, `/payments/{id}` | with `payment_due_date` |
| `/payment-schedules[/{sequence}]` | |
| `/card-payments`, `/card-payments/{id}`, `/card-payments/cards`, `/card-payments/cards/{cardNo}` | |
| `/cash-payments[/{id}]`, `/upi-payments[/{id}]` | |
| `/ownerships`, `/ownerships/customer/{customerId}`, `/ownerships/{customerId}/{propertyId}` | |
| `/customer-phones…`, `/customer-emails…`, `/property-meters…`, `/meter-services…` | same sub-paths as U/BILL |

Customer writes (U/BILL had them unauthenticated) are now **ADMIN only**:

| Method | Path | Body |
|---|---|---|
| POST | `/customers` | `{cust_id, cust_name, apartment?, flat_no?, city, dob}` → 201 |
| PUT | `/customers/{id}` | same fields except `cust_id` |
| DELETE | `/customers/{id}` | cascades to phones/emails/ownership (U/BILL FK rules); 404 if missing |

Example `GET /bills/5001`:
```json
{"success":true,"data":{"meter_id":1001,"billing_month":"2025-01-01","bill_id":5001,"billing_date":"2025-01-31",
 "previous_reading":1050,"current_reading":1200,"tariff_code":"ELEC-A","bill_status":"Paid",
 "service_type":"Electricity","unit":"kWh","units":150,"unit_rate":8.5,"energy_charge":1275.0,
 "fixed_charge":50.0,"tax_percent":5,"tax_amount":66.25,"total_amount":1391.25,
 "amount_paid":1320,"balance_due":71.25,"amount_is_derived":true}}
```

## 3. Billing operations (new)

| Method | Path | Auth | Body | Result |
|---|---|---|---|---|
| POST | `/bills/generate` | ADMIN | `{meter_id, billing_month:"YYYY-MM-01", tariff_code?}` | 201 + bill; one transaction (cycle readings + bill). 409 duplicate, 422 missing data |
| POST | `/payments` | ADMIN | `{bill_id, amount, payment_mode:"Card"/"Cash"/"UPI", payment_date?, card_no? \| receipt_no? \| upi_id?+upi_app?}` | 201 + payment; bill status updated in the same transaction |
| POST | `/readings` | ADMIN | `{meter_id, reading_date, reading_value, reading_status?}` | billing-cycle reading with next `reading_no` |
| POST | `/readings/interval` | ADMIN | `{meter_id, reading_time:"2026-10-24T10:15:00+05:30", register_value, reading_quality?, register_reset?}` | interval consumption derived from previous register; lower register → 422 unless `register_reset:true` |
| GET | `/bills/estimate/{meterId}` | any | — | projected bill (below) |
| GET | `/bills/estimates` | any | — | estimates for all meters + totals |

`GET /bills/estimate/1001` (abridged):
```json
{"success":true,"data":{"is_estimate":true,"meter_id":1001,"service_type":"Electricity","unit":"kWh",
 "period":{"start":"2026-10-01","end":"2026-10-31","days":31,"billed_in_billing_month":"2026-11-01"},
 "status":"OK","as_of":"2026-10-24T00:00+05:30","days_elapsed":23.0,"recorded_consumption":109.56,
 "readings_received":2209,"readings_expected":2209,"coverage":1.0,"average_daily_consumption":4.763,
 "projected_consumption":147.668,
 "tariff":{"tariff_code":"ELEC-A","unit_rate":8.5,"fixed_charge":50.0,"tax_percent":5.0},
 "estimated_bill":{"units":147.668,"energy_charge":1255.18,"fixed_charge":50.0,"tax_amount":65.26,"total_amount":1370.44},
 "previous_bill":{"bill_id":5211,"billing_month":"2026-10-01","consumption":156.28,"total_amount":1447.3,"bill_status":"Paid"},
 "change_vs_previous_pct":-5.31,"warnings":[],
 "assumptions":["Average daily consumption so far continues for the rest of the period (linear extrapolation).",
   "Priced with the existing tariff rule: units x tariff rate + fixed charge, plus tax %.",
   "Estimate only — it is never written to the bills table."]}}
```
With too little data: `"status":"INSUFFICIENT_DATA"`, no `estimated_bill`, and a warning
explaining why. Rules: [BILLING_RULES.md](BILLING_RULES.md).

## 4. Consumption analytics (new)

| Method | Path | Params | Notes |
|---|---|---|---|
| GET | `/analytics/meters` | — | meter profiles: property, owners, service type, unit (kWh/kL), latest reading |
| GET | `/analytics/consumption` | `meterId` **or** `serviceType` (ELECTRICITY/WATER), `from`, `to` (inclusive local dates; defaults: hour → last 2 days, day → 30 days, week → 12 weeks, month → 12 months), `interval` = `hour` \| `day` \| `week` \| `month` | series + summary; too many buckets → 400; a meter of the other service type → 400 (kWh and kL are never added) |
| GET | `/analytics/comparison` | same filters, `from`, `to` | current vs equally long previous period |
| GET | `/analytics/readings` | `meterId` (required), `from`, `to` (default last 7 days), `limit` (default 200, max 1000), `offset` | raw interval readings, newest first, with `total` |
| GET | `/meters/{id}/insights` | — | meter detail: recent readings, 30-day daily series, current-period total, latest alert, estimate |
| GET | `/dashboard/consumption-insights` | — | month-to-date per service, change vs same span last month, estimated month-end bill (sum), active alerts + preview |

`GET /analytics/consumption?meterId=1001&from=2026-10-01&to=2026-10-03&interval=day`:
```json
{"success":true,"data":{"meter_ids":[1001],"service_type":"Electricity","unit":"kWh","interval":"day",
 "from":"2026-10-01","to":"2026-10-03","timezone":"Asia/Kolkata","source":"cagg_meter_daily",
 "series":[{"period_start":"2026-10-01T00:00+05:30","label":"01 Oct 2026","consumption":4.703,"reading_count":96,
            "missing":false,"non_valid_readings":0,"has_reset":false,"max_interval_minutes":15}, "…"],
 "summary":{"total_consumption":14.526,"average_per_interval":4.842,"intervals_with_data":3,
            "intervals_in_range":3,"reading_count":288,
            "peak":{"period_start":"2026-10-03T00:00+05:30","label":"03 Oct 2026","consumption":5.122}}}}
```
Buckets without readings are returned with `"consumption": null, "missing": true` — never 0.

`GET /analytics/comparison?meterId=1001&from=2026-10-01&to=2026-10-07`:
```json
{"success":true,"data":{"meter_ids":[1001],"unit":"kWh","days":7,
 "current":{"from":"2026-10-01","to":"2026-10-07","total_consumption":34.309,"days_with_data":7},
 "previous":{"from":"2026-09-24","to":"2026-09-30","total_consumption":35.394,"days_with_data":7},
 "change_pct":-3.07,"comparable":true}}
```

## 5. Consumption alerts (new)

| Method | Path | Auth | Params / body | Notes |
|---|---|---|---|---|
| GET | `/alerts` | any | `severity` (LOW/MODERATE/HIGH), `meterId`, `status` (NEW/REVIEWED/RESOLVED), `from`, `to` (observation day), `limit` | newest observation first |
| GET | `/alerts/summary` | any | — | `{active, by_status, by_severity, by_type}` |
| GET | `/alerts/{id}` | any | — | alert + `series` (baseline window, observed day, following days) + `disclaimer` |
| PATCH | `/alerts/{id}/status` | REVIEWED: any; RESOLVED: ADMIN | `{status:"REVIEWED"\|"RESOLVED", note?}` | persisted with who/when; RESOLVED is final (409 afterwards) |
| POST | `/alerts/detect` | ADMIN | `{from?, to?, meterId?}` | re-runs detection; duplicates prevented by `UNIQUE (meter_id, observation_start, alert_type)` |

Alert object (abridged):
```json
{"alert_id":42,"meter_id":1002,"alert_type":"HIGH_CONSUMPTION","severity":"HIGH",
 "observation_start":"2026-10-12T00:00+05:30","observed_consumption":9.487,"baseline_average":4.038,
 "deviation_pct":134.97,"baseline_days":28,"baseline_start":"2026-09-14","baseline_end":"2026-10-11","unit":"kL",
 "explanation":"Consumption on 12 Oct 2026 was 9.487 kL, 134.97% above this meter's baseline of 4.038 kL per day (trimmed mean of 28 complete days, 2026-09-14 to 2026-10-11). Rule: deviation >= +100% is HIGH.",
 "recommended_action":"Check the property for leaks, running taps or overflowing tanks, and verify the meter reading on site before contacting the customer.",
 "status":"NEW","rule_version":"daily-trimmed-mean-v1","created_at":"…","property_name":"Green Valley Apartments",
 "owner_names":"Arun Kumar, Priya Sharma"}
```
Rules: [FEATURES.md → anomaly detection](FEATURES.md#explainable-anomaly-detection-new).

## 6. Query Studio and approvals

| Method | Path | Auth | Body | Result |
|---|---|---|---|---|
| POST | `/query` | any | `{query}` | read → `200 {mode:"EXECUTED", queryType:"SELECT", rows, fields, truncated}`; write → `202 {mode:"PENDING_APPROVAL", requestId, status:"PENDING"}`; DDL/unsafe → 400 |
| GET | `/query/schema/{table}` | any | — | MySQL `SHOW COLUMNS`-shaped rows (`Field, Type, Null, Key, Default, Extra`) for the 20 domain tables |
| GET | `/query/requests` | any | — | ADMIN: all; USER: own |
| GET | `/query/requests/{id}` | any | — | 404 if not visible to the caller |
| POST | `/query/requests/{id}/approve` | ADMIN | `{approvalPassword}` | runs the stored SQL in one transaction → COMPLETED or FAILED (rolled back) |
| POST | `/query/requests/{id}/reject` | ADMIN | `{approvalPassword, rejectionReason}` | REJECTED |
| GET | `/requests`, `/requests/{id}` | any | — | access requests (ADMIN all, USER own) |
| POST | `/requests` | any | `{operation, target_table, record_id?, request_data?, reason?}` | 201 PENDING |
| PUT | `/requests/{id}/approve` · `/reject` | ADMIN | `{approvalPassword, review_comment?}` | |

Approval rules: the approval password (`admin1234` in the demo) is checked **before** any
change and is different from the admin login password; using `admin123` → 403. Each attempt
is written to `approval_audit` (action, target, outcome, admin, time — never the password).
Read SQL runs as `gridpulse_query_reader` in a read-only transaction (one statement, 5 s,
1,000 rows). Approved writes run as `gridpulse_query_writer` (INSERT/UPDATE/DELETE on domain
tables only). DDL, GRANT/REVOKE, COPY, DO/CALL, SET/RESET, transaction control and dangerous
functions (`pg_read_file`, `pg_sleep`, `set_config`, `query_to_xml`, …) are refused.

## 7. Database Performance Lab

| Method | Path | Auth | Body | Result |
|---|---|---|---|---|
| GET | `/benchmark/summary` | any | — | live status of both databases (versions, row counts, sizes, TimescaleDB/cagg state, dataset comparability) + latest stored run |
| POST | `/benchmark/run` | ADMIN | `{repetitions}` (3–30, default 10) | runs the fixed workloads, stores and returns the run; 409 if a run is in progress |

No SQL is accepted. Method statuses and methodology: [PERFORMANCE_LAB.md](PERFORMANCE_LAB.md).

---

### Changes from the U/BILL contract

| U/BILL | GridPulse | Reason |
|---|---|---|
| CRUD/dashboard routes public | token required everywhere except login/health | data protection |
| `POST /auth/register` | 410 | fixed demo accounts only |
| `verify-approval` returned an approval token stored in localStorage | returns `{verified:true}`; every approve/reject sends the password | backend-enforced per action |
| `POST /query/requests/{id}/approve` had no second check | requires `approvalPassword` | brief requirement |
| Query Studio executed approved DDL | DDL refused | schema changes belong in `database/postgres` |
| `/bills` had no amount | derived amount fields added | Billing Center showed ₹0 |
| `SHOW COLUMNS` via `/query` | `/query/schema/{table}` (and `DESCRIBE` translated) | PostgreSQL has no `SHOW COLUMNS` |
