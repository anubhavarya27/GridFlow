# DBMS Concepts, Academic Value & Team Contributions

Linked from [README.md](../README.md). Sections marked **GridPulse** were added in the TimescaleDB/Java upgrade.

## DBMS Concepts Demonstrated

**Database Design:** EER-oriented modeling, relational schema design, entities, attributes, relationships, cardinality, specialization.

**Keys:** primary keys, composite keys, unique identifiers, foreign keys.

**Integrity:** referential integrity, NOT NULL constraints, UNIQUE constraints, foreign-key constraints, relationship-table design, CHECK constraints.

**Specialization:**
```text
UTILITY_SERVICE
├── ELECTRICITY_SERVICE
└── WATER_SERVICE

PAYMENT
├── CARD_PAYMENT
├── CASH_PAYMENT
└── UPI_PAYMENT
```

**SQL:** SELECT, INSERT, UPDATE, DELETE, JOIN, GROUP BY, HAVING, aggregate functions, filtering, sorting, subqueries, CTE-based reads, reporting queries.

**Transactions:** BEGIN, COMMIT, ROLLBACK, DML batch execution.

**Application Integration:** REST APIs, connection pooling, authentication, authorization, query classification, approval workflows, React/Java/PostgreSQL integration.

**GridPulse — time-series DBMS concepts:** hypertables and chunk partitioning, time bucketing in a local time zone, continuous (incrementally maintained) materialized aggregates with refresh policies and real-time aggregation, cumulative-register to interval-delta modelling, data-quality flags.

**GridPulse — JDBC:** `DataSource`/HikariCP connection pooling, `JdbcTemplate` with prepared statements, programmatic transactions (`TransactionTemplate`), row locking (`SELECT … FOR UPDATE`), read-only transactions, `SET LOCAL ROLE` for least privilege, statement timeouts.

**GridPulse — migration and measurement:** MySQL → PostgreSQL type and constraint mapping, verified data copy (row counts, row fingerprints, business totals, orphan checks), controlled query benchmarking (warm-ups, medians, equivalence checks, EXPLAIN ANALYZE).

## Query Studio as a DBMS Demonstration

Query Studio creates a controlled boundary: `Data Retrieval → Data Modification → Administrative Review → SQL Execution → Execution-Result Recording`. Instead of every statement executing immediately, read-only SQL executes immediately while write SQL goes through an approval workflow — also demonstrating transaction processing for approved DML.

## Academic Value & Learning Outcomes

Complete path demonstrated (U/BILL): `EER Model → Relational Schema → Keys & Constraints → SQL → MySQL Database → Node.js/Express API → Authentication/Authorization → React Frontend → Controlled Database Operations`.

GridPulse extends it: `MySQL schema → PostgreSQL schema → TimescaleDB hypertable + continuous aggregates → Java/Spring Boot JDBC API → analytics, explainable alerts, predictive billing → measured database comparison`.

Practical experience gained: relational database design, EER modeling, schema mapping, normalization concepts, primary/composite/foreign keys, referential integrity, SQL, transaction processing, REST API development, React frontend development, frontend/backend integration, JWT authentication, password hashing, role-based authorization, controlled database access, Git/GitHub collaboration, full-stack application development.

## Team Contributions

| Team Member | Registration No. | Role |
|---|---|---|
| **Arya Anubhav** | 25BCE5407 | Frontend Development & System Integration |
| **Tarang Gupta** | 25BCE5383 | Backend & API Development |
| **Amrit Nitin** | 25BCE5385 | Database & SQL Development |

**Arya Anubhav — Frontend & Integration:** (U/BILL) React frontend development, user interface implementation, navigation, user interaction flows, frontend/API integration, application interface.

**Tarang Gupta — Backend & API:** (U/BILL) Node.js backend, Express REST APIs, controllers and routes, JWT authentication, role-based authorization, Query Studio, SQL classification, query approval workflow, transaction handling, backend/database integration.

**Amrit Nitin — Database & SQL:** (U/BILL) MySQL schema, database design, tables and relationships, keys and constraints, sample data, SQL scripts (basic & advanced queries), dashboard queries, workflow tables.

## Git & Collaboration

Developed collaboratively using Git and GitHub:
```text
main
├── frontend
├── backend
└── database
```
This lets team members work independently on assigned layers while integrating through a common repository, following a standard development methodology: Requirement Analysis → EER/Conceptual Design → Relational Schema → SQL Implementation → Sample Data → Backend API Development → Authentication & Authorization → Frontend Development → Frontend/Backend Integration → Query Studio & Approval Workflow → Testing & Validation.
