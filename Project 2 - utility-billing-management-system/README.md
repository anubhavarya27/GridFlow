# U/BILL — Utility Billing Management System

### A Full-Stack DBMS Application for Utility Billing, Metering, Payments & Controlled Database Operations

**React · Node.js · Express · MySQL · REST API · JWT**

**Repository:** https://github.com/anubhavarya27/utility-billing-management-system

---

## 1. Overview

**U/BILL** is a full-stack, database-driven web application built as an academic **Database Management Systems (DBMS)** project. It models and manages the complete utility billing lifecycle:

```text
Customer → Property → Meter → Meter Reading → Utility Service + Tariff
   → Bill → Payment Schedule → Payment (Card / Cash / UPI)
```

It also covers customers, properties, meters/readings, electricity & water services, tariffs, bills, payment schedules, dashboards, reports, database exploration, JWT authentication/authorization, and **controlled SQL operations with administrator approval**.

Design-to-implementation path:

```text
EER Model → Relational Schema → Normalization / BCNF-Oriented Design → MySQL Database
   → SQL Queries → Node.js + Express REST API → React Frontend → Integrated System
```

**Academic focus:** relational design, keys/constraints, normalization, specialization, SQL, transactions, REST APIs, authentication, authorization, controlled database access.

## 2. Objectives

- Design a realistic relational database for utility billing operations (EER-oriented).
- Implement primary/composite/foreign keys, unique constraints, referential integrity.
- Demonstrate specialization for utility services and payment methods.
- Provide REST APIs + a React interface, with JWT auth and role-based authorization.
- Execute read-only SQL directly via Query Studio; route write SQL through admin approval.
- Use transactions for approved DML batches.
- Provide dashboard, reporting, billing, payment, and metering functionality.

## 3. System Architecture

Layered three-tier architecture:

```text
User / Browser
      ↓
React Frontend
      ↓ HTTP / JSON
Node.js + Express REST API
      ├── Routes
      ├── Controllers
      ├── Authentication / JWT
      ├── Role-Based Authorization
      ├── Query Classification
      └── Transaction Handling
      ↓ mysql2
MySQL Database
```

**Principle:** the frontend never connects directly to MySQL — `Frontend → REST API → Backend → MySQL` — keeping credentials and DB logic server-side.

## 4. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React | User interface |
| Routing | React Router | Page and protected-route navigation |
| Styling | CSS | Application styling |
| Icons | Lucide React | Interface icons |
| Client API | Fetch API | HTTP communication |
| Backend Runtime | Node.js | Server-side JavaScript |
| Backend Framework | Express.js | REST API and middleware |
| Database Driver | mysql2 | MySQL connectivity and pooling |
| Authentication | JWT | Stateless authentication |
| Password Hashing | bcryptjs | Password protection |
| Configuration | dotenv | Environment variables |
| Cross-Origin | CORS | Frontend/backend communication |
| Database | MySQL | Relational data management |
| Version Control | Git / GitHub | Source control & hosting |

## 5. Feature Areas

Core modules: Customer Management, Property Management, Meter & Reading Management, Utility Services (Electricity/Water specialization), Tariffs, Billing, Payments (Card/Cash/UPI specialization), Dashboard, Reports & Analytics, Database Explorer, Operations Hub (Customer 360, Property Portfolio, Meter Monitor, Tariff Lab, Billing Center, Payment Hub).

→ Full field-level breakdown of every module: **[docs/FEATURES.md](docs/FEATURES.md)**

## 6. Query Studio — Controlled SQL Execution

Query Studio lets authenticated users submit SQL directly, while database-changing statements require administrator approval. Classification happens **server-side**, over the complete submission (handles comments, multi-statement batches, and mixed read/write — a mixed batch is classified as `WRITE` in full).

```text
Read-only SQL (SELECT / SHOW / DESCRIBE / EXPLAIN / WITH...SELECT) → Immediate Execution

Write SQL (INSERT / UPDATE / DELETE / REPLACE / MERGE / CREATE / ALTER / DROP /
           TRUNCATE / RENAME / GRANT / REVOKE / CALL / LOAD / IMPORT) → Approval Workflow
```

**Approval lifecycle** (`QUERY_REQUEST` table):

```text
PENDING ──→ APPROVED → EXECUTING → COMPLETED / FAILED
        └──→ REJECTED
```

**Transactions:** approved DML batches run as `BEGIN → execute statements → COMMIT` on success or `ROLLBACK` on any failure. DDL (`CREATE/ALTER/DROP/TRUNCATE/RENAME`) is handled separately, since it may carry database-specific implicit-commit behavior.

→ Query request fields, Processing Queue, and Admin Approvals details: **[docs/FEATURES.md](docs/FEATURES.md)**

## 7. Database Design

20 core domain tables (Customer/Property, Metering, Utility Services, Billing/Payments) plus application tables (`users`, `access_requests`, `QUERY_REQUEST`).

Major relationship flow:

```text
CUSTOMER → CUSTOMER_OWNS_PROPERTY → PROPERTY → PROPERTY_INCORPORATE_METER → METER
   ├──→ METER_READING
   └──→ METER_SERVICE → UTILITY_SERVICE ──┬──→ ELECTRICITY_SERVICE
                                           └──→ WATER_SERVICE

METER → BILL → PAYMENT
                 ├──→ CARD_PAYMENT → CARD
                 ├──→ CASH_PAYMENT
                 └──→ UPI_PAYMENT
```

→ Full table list, primary/composite/foreign keys, and check constraints: **[docs/DATABASE.md](docs/DATABASE.md)**

## 8. Authentication & Authorization

JWT-based auth with `bcryptjs` password hashing and role-based authorization (`USER`, `ADMIN`).

```text
Login Form → POST /api/auth/login → Backend Credential Verification
   → JWT Token → Authenticated Session → Protected API Requests
```

Plain-text passwords are never returned by the API. The predefined administrator identity is configured via backend environment variables (not created through public registration).

## 9. REST API

| Base Route | Responsibility |
|---|---|
| `/api/auth` | Authentication & approval-password verification |
| `/api/customers`, `/api/properties`, `/api/meters`, `/api/readings` | Core entity operations |
| `/api/services`, `/api/bills`, `/api/payments` | Services, billing, payments |
| `/api/dashboard`, `/api/reports` | Dashboard data & analytics |
| `/api/requests` | General access-request workflow |
| `/api/query` | Query Studio & SQL approval workflow |

→ Full endpoint list, request/response examples: **[docs/API.md](docs/API.md)**

## 10. Frontend Views

```text
Landing → Login → Dashboard
   ├── Database Explorer   ├── Query Studio   ├── Processing   ├── Reports
   └── Operations (Customer 360 / Property Portfolio / Meter Monitor /
                   Tariff Lab / Billing Center / Payment Hub)
          └── Admin → Approvals
```

## 11. Project Structure

Top-level layout: `database/` (SQL scripts), `backend/` (Express API — routes, controllers, middleware), `frontend/` (React app).

→ Full directory tree & SQL script order: **[docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)**

## 12. Setup & Installation

**Prerequisites:** Node.js, npm, MySQL Community Server, Git.

```bash
# 1. Clone
git clone https://github.com/anubhavarya27/utility-billing-management-system.git
cd utility-billing-management-system

# 2. Initialize MySQL (run in order, see docs/PROJECT_STRUCTURE.md)
#    01_create_database.sql → 02_create_tables.sql → 03_insert_data.sql →
#    07_create_access_requests.sql → 08_create_users.sql → 09_create_query_requests.sql

# 3. Backend
cd backend
npm install
cp .env.example .env   # fill in DB_*, PORT, JWT_*, ADMIN_*, APPROVAL_* — see docs/SETUP.md
node server.js          # → http://localhost:5000

# 4. Frontend (new terminal)
cd frontend
npm install
npm run dev              # talks to http://localhost:5000/api
```

→ Full environment variable list, Windows PowerShell notes, and database verification queries: **[docs/SETUP.md](docs/SETUP.md)**

## 13. Security Considerations

- Passwords hashed with `bcryptjs`; JWT-signed authenticated requests.
- Role-based authorization on admin-only APIs.
- Optional second-level approval password + short-lived token for sensitive approvals.
- Server-side SQL classification (read vs. write) — never trusted from the client.
- Parameterized queries where applicable; secrets via environment variables.
- Frontend never receives MySQL credentials or connects to the database directly.

## 14. Testing, DBMS Concepts & Academic Value

→ **[docs/TESTING.md](docs/TESTING.md)** — database/backend/frontend test checklist
→ **[docs/ACADEMIC.md](docs/ACADEMIC.md)** — DBMS concepts demonstrated & learning outcomes

## 15. Team

| Team Member | Registration No. | Role |
|---|---|---|
| **Arya Anubhav** | 25BCE5407 | Frontend Development & System Integration |
| **Tarang Gupta** | 25BCE5383 | Backend & API Development |
| **Amrit Nitin** | 25BCE5385 | Database & SQL Development |

→ Detailed per-member contributions: **[docs/ACADEMIC.md](docs/ACADEMIC.md)**

## 16. Future Enhancements

PDF bill generation · Email/SMS billing notifications · Online payment gateway integration · Advanced usage analytics & trend visualization · Automatic bill generation · Payment reminders · Detailed audit logging · Fine-grained permissions · Swagger/OpenAPI docs · Automated testing · Docker/cloud deployment · Automated backups · Production monitoring.

## License

Developed for **academic and educational purposes**.

**U/BILL — Utility Billing Management System** · React · Node.js · Express · MySQL · REST API · JWT · SQL
