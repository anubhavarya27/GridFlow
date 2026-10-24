# U/BILL baseline and GridPulse migration plan

Phase 1–2 report, written from the source code in the uploaded archive (branch `main`,
commit `2459879`), not from the README alone.

## 1. What U/BILL actually was

| Layer | Found in the code |
|---|---|
| Frontend | React 19 + Vite 8, React Router 7, Recharts 3, lucide-react, plain CSS per page (`styles/*.css`). 9 working pages (Operations Hub serves six routes); `Profile.jsx`, `mockData.js` and six shared components (`ChartCard`, `DataTable`, `Navbar`, `PageHeader`, `StatCard`, `StatusBadge`) were empty files. API base URL hard-coded to `http://localhost:5000/api`. |
| Backend | Node.js + Express 5, mysql2 pool with `multipleStatements: true`, JWT + bcryptjs. 24 route files, ~76 endpoints, almost all `GET`. |
| Database | MySQL 8, scripts 01–09: 20 domain tables + `users`, `access_requests`, `QUERY_REQUEST`; 3 readings per meter; 30 bills; 19 payments. |

## 2. Features: implemented vs documented

| Feature | Status in U/BILL |
|---|---|
| Read views of all 20 tables, dashboard, reports | implemented |
| Customer create/update/delete | implemented, **without authentication** |
| Bill generation, payment recording, reading capture, tariff management | **documented only** (no endpoints) |
| Bill amount | **not computed** — Billing Center summed a non-existent `total_amount` (₹0) |
| Query Studio read/write split + approval workflow | implemented |
| Approval password | page gate only; **query approvals did not verify it** |
| Access-request workflow (`/api/requests`) | backend only, no UI |
| Registration | public endpoint |
| Authorization on data routes | **none** — every CRUD/dashboard route was public |

Other defects found: upper-case table names in controllers (`FROM CUSTOMER`) break on
case-sensitive MySQL installs; Query Studio reads ran on the full-privilege pool with
multi-statements enabled; payment 9008 is UPI but has a card row; legacy payments do not
match any amount formula; a global `.paid` CSS rule from the landing page stretched status
tags; operations pages had no base font (fell back to serif).

`backend/.env` in the archive contained real secrets (DB password, JWT secret, bcrypt
hashes). They were not copied anywhere; `.env` stays git-ignored.

## 3. Reused as-is or with small changes

All pages, styles, routing, the sidebar, `services/api.js` function names and the
`{success, data, message}` contract; the 20-table design with its keys and constraints; the
sample data; the Query Studio classification idea and request lifecycle; dashboard/report
SQL (ported to PostgreSQL syntax).

## 4. Changes made

**Java/JDBC:** Spring Boot 3 app in `backend/` replacing Express; controllers per area;
services for business rules; `JdbcTemplate` repositories with parameterized SQL; HikariCP;
programmatic transactions; global exception handler; HMAC session tokens; centralized demo
credential store; approval service with audit and lock-out; same port and paths.

**TimescaleDB:** PostgreSQL schema conversion; `meter_interval_reading` hypertable;
hourly/daily continuous aggregates with refresh policies; least-privilege roles; migration
and validation scripts; reproducible simulated dataset; fixed benchmark SQL for both engines.

**Frontend:** Consumption Analytics, Consumption Alerts and Performance Lab pages; dashboard
KPIs + alert preview + projected bill; meter detail; bill generation and payment forms;
approval password per action; rebrand.

## 5. Risks identified up front

| Risk | Mitigation |
|---|---|
| TimescaleDB unique-key rule vs `METER_READING(meter_id, reading_no)` | separate hypertable for interval data |
| Cumulative registers summed by mistake | store interval deltas; tests compare with register differences |
| UTC vs IST day boundaries | `time_bucket(..., 'Asia/Kolkata')` |
| Mixing kWh and kL | per-service totals; API refuses mixed selections |
| No bill amount in the model | derived rule, documented, components returned separately |
| Misleading benchmark | fixed SQL, equivalence check, warm-ups, measured-only, status instead of numbers |
| Query Studio privilege escalation | PostgreSQL-aware classifier, read-only transactions, restricted roles, no DDL |
| Environment without TimescaleDB / Maven Central | test-only shim, verification harness, honest status reporting |

## 6. Phased plan (as executed)

1. Inspect source and report (this file) — done.
2. Target architecture ([ARCHITECTURE.md](ARCHITECTURE.md)) — done.
3. Schema + data migration (`database/`) — done; TimescaleDB scripts await a real server.
4. Java/JDBC connectivity — done (verified on PostgreSQL 16).
5. Port the U/BILL REST API — done, same paths and shapes.
6. Consumption analytics — done.
7. Anomaly detection + alerts — done.
8. Predictive billing — done.
9. Frontend additions — done.
10. Performance Lab — done; only the MySQL side measured here.
11. Tests, docs, demo — done ([TESTING.md](TESTING.md), [DEMO_SCRIPT.md](DEMO_SCRIPT.md)).
