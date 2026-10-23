# Project Structure

Linked from [README.md](../README.md#11-project-structure). Full directory tree and SQL script order.

```text
utility-billing-management-system/
│
├── README.md
├── .gitignore
│
├── database/
│   ├── 01_create_database.sql
│   ├── 02_create_tables.sql
│   ├── 03_insert_data.sql
│   ├── 04_basic_queries.sql
│   ├── 05_advanced_queries.sql
│   ├── 06_dashboard_queries.sql
│   ├── 07_create_access_requests.sql
│   ├── 08_create_users.sql
│   └── 09_create_query_requests.sql
│
├── backend/
│   ├── package.json
│   ├── server.js
│   ├── .env.example
│   │
│   ├── config/
│   │   └── database.js
│   │
│   ├── routes/
│   │   ├── customerRoutes.js
│   │   ├── propertyRoutes.js
│   │   ├── meterRoutes.js
│   │   ├── serviceRoutes.js
│   │   ├── billRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── readingRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── queryRoutes.js
│   │   ├── requestRoutes.js
│   │   └── authRoutes.js
│   │
│   ├── controllers/
│   │   ├── customerController.js
│   │   ├── propertyController.js
│   │   ├── meterController.js
│   │   ├── serviceController.js
│   │   ├── billController.js
│   │   ├── paymentController.js
│   │   ├── dashboardController.js
│   │   ├── readingController.js
│   │   ├── reportController.js
│   │   ├── queryController.js
│   │   ├── requestController.js
│   │   └── authController.js
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   │
│   └── utils/
│       └── auth.js
│
└── frontend/
    ├── package.json
    ├── index.html
    └── src/
        ├── components/
        ├── layouts/
        ├── pages/
        │   ├── Landing.jsx
        │   ├── Login.jsx
        │   ├── Dashboard.jsx
        │   ├── DatabaseExplorer.jsx
        │   ├── QueryStudio.jsx
        │   ├── RecordManagement.jsx
        │   ├── AdminPanel.jsx
        │   ├── OperationsHub.jsx
        │   └── Reports.jsx
        │
        ├── services/
        │   ├── api.js
        │   └── auth.js
        │
        ├── styles/
        │   ├── dashboard.css
        │   ├── database-explorer.css
        │   ├── operations.css
        │   ├── query-studio.css
        │   ├── query-studio-crud.css
        │   └── reports.css
        │
        ├── App.jsx
        └── main.jsx
```

## SQL Script Organization

| File | Purpose |
|---|---|
| `01_create_database.sql` | Creates the project database |
| `02_create_tables.sql` | Creates the core relational schema |
| `03_insert_data.sql` | Inserts sample data |
| `04_basic_queries.sql` | Basic SQL queries |
| `05_advanced_queries.sql` | Advanced SQL queries |
| `06_dashboard_queries.sql` | Dashboard and reporting queries |
| `07_create_access_requests.sql` | General access-request workflow |
| `08_create_users.sql` | Application users table |
| `09_create_query_requests.sql` | Query Studio approval table |
