# API reference

The complete GridPulse REST API contract — every endpoint with method, parameters, request
bodies, response examples, error codes and authorization — is in
**[API_CONTRACT.md](API_CONTRACT.md)**.

Quick map:

| Base route | Responsibility |
|---|---|
| `/api/auth`, `/api/health`, `/api/audit/approvals` | login, approval-password check, health, approval audit |
| `/api/customers`, `/api/properties`, `/api/meters`, `/api/readings`, `/api/services`, `/api/tariffs`, … | U/BILL records (same paths and row shapes) |
| `/api/bills`, `/api/payments` | bills with derived amounts, bill generation, payments, **estimates** |
| `/api/dashboard`, `/api/reports` | U/BILL dashboard and report aggregates + consumption insights |
| `/api/analytics` | time-series consumption analytics (TimescaleDB continuous aggregates) |
| `/api/alerts` | explainable consumption alerts and their lifecycle |
| `/api/query`, `/api/requests` | Query Studio and approval workflows |
| `/api/benchmark` | Database Performance Lab |
