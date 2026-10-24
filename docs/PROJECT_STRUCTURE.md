# Project structure

One local Git repository with three application folders. `docs/` holds documentation only.

```text
GridPulse/
├── frontend/                     React 19 + Vite (U/BILL UI, extended)
│   ├── .env.example              VITE_API_BASE_URL
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── App.jsx               routes (public, authenticated, admin)
│       ├── layouts/AppLayout.jsx
│       ├── components/
│       │   ├── Sidebar.jsx            Overview · Intelligence · Operations · Admin
│       │   ├── ProjectedBillPanel.jsx NEW  estimate card (dashboard, billing, meter)
│       │   ├── MeterInsightsPanel.jsx NEW  meter detail
│       │   └── BillingActions.jsx     NEW  generate bill / record payment forms (ADMIN)
│       ├── pages/
│       │   ├── Landing, Login, Dashboard, DatabaseExplorer, QueryStudio,
│       │   │   RecordManagement (Processing), Reports, OperationsHub (6 routes), AdminPanel
│       │   ├── ConsumptionAnalytics.jsx  NEW
│       │   ├── ConsumptionAlerts.jsx     NEW
│       │   └── PerformanceLab.jsx        NEW
│       ├── services/  api.js · auth.js · config.js
│       ├── utils/format.js         number/date/unit formatting, chart tooltip style
│       └── styles/                 U/BILL CSS + gridpulse.css
│
├── backend/                      Java 17 · Spring Boot 3 · JDBC
│   ├── pom.xml
│   ├── .env.example
│   ├── README.md
│   ├── scripts/api-smoke-test.mjs   end-to-end HTTP checks against a running backend
│   └── src/
│       ├── main/java/com/gridpulse/
│       │   ├── GridPulseApplication.java
│       │   ├── config/        WebConfig (CORS, interceptor), TimeConfig
│       │   ├── security/      DemoCredentialStore, TokenService, AuthInterceptor, AuthUser, Role
│       │   ├── controller/    Auth, Record (U/BILL entities), Dashboard, Report, Billing,
│       │   │                  Analytics, Alert, Query, AccessRequest, Benchmark, System
│       │   ├── service/       TariffCalculator, BillingService, ConsumptionService,
│       │   │                  AnomalyRules, AnomalyDetectionService, AlertService,
│       │   │                  ForecastCalculator, BillForecastService, DashboardService,
│       │   │                  SqlClassifier, QueryStudioService, ApprovalService,
│       │   │                  AccessRequestService, BenchmarkStats, BenchmarkService
│       │   ├── repository/    RecordRepository, ReportingRepository, BillingRepository,
│       │   │                  AnalyticsRepository, AlertRepository, AppRepository (JdbcTemplate)
│       │   ├── dto/           MeterProfile, BucketStat
│       │   └── common/        ApiResponse, ApiException, GlobalExceptionHandler, Params, Rows
│       ├── main/resources/application.properties
│       └── test/              unit tests (service, security) + integration tests (real DB)
│
├── database/                     PostgreSQL 16 + TimescaleDB, legacy MySQL, data tooling
│   ├── docker-compose.yml        timescale/timescaledb:2.17.2-pg16 + mysql:8.0
│   ├── .env.example
│   ├── README.md
│   ├── postgres/                 00 roles/DB → 01 extension → 02 schema → 03 app tables →
│   │                             04 hypertable → 05 continuous aggregates → 06 legacy data →
│   │                             07 views → 08 Query Studio privileges → 09 post-load → 99 validation
│   ├── legacy-mysql/             original U/BILL scripts 01–09 + 10 benchmark table
│   ├── migration/migrate_mysql_to_postgres.py
│   ├── generator/generate_dataset.py   reproducible SIMULATED readings, bills, payments
│   ├── benchmark/                fixed Performance Lab SQL (pg raw, pg cagg, mysql raw × daily, monthly)
│   ├── scripts/                  setup.sh, setup.ps1, load_generated_{postgres,mysql}.sql
│   └── docker/                   container init scripts
│
├── docs/                         architecture, database, API, features, setup, testing, demo
├── .gitignore                    Node, Java/Maven, Python, IDE, logs, builds, dumps, .env, keys
├── .gitattributes                LF endings for .sh/.sql/.py
└── README.md
```

Generated, git-ignored: `frontend/node_modules`, `frontend/dist`, `backend/target`,
`database/generated/` (CSV dataset), every `.env`.
