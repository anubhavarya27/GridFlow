# Setup & Installation Reference

Linked from [README.md](../README.md#12-setup--installation). Full prerequisites, environment variables, and platform notes.

## Prerequisites

Install: Node.js, npm, MySQL Community Server, Git, Visual Studio Code.

Verify:
```bash
node -v
npm -v
git --version
```
Make sure MySQL Server is running and accessible on the configured port.

## Environment Variables (`backend/.env`)

Create `backend/.env` using `.env.example` as the configuration reference. Do **not** commit `.env` or database credentials to GitHub.

```text
DB_HOST
DB_USER
DB_PASSWORD
DB_NAME
DB_PORT
PORT
JWT_SECRET
JWT_EXPIRES_IN
ADMIN_USERNAME
ADMIN_PASSWORD_HASH
APPROVAL_PASSWORD_HASH
APPROVAL_TOKEN_EXPIRES_IN
```

## Windows PowerShell Note

If PowerShell blocks `npm.ps1`:
```powershell
npm.cmd install
npm.cmd run dev
```
This is a shell/environment issue and does not change the application.

## Running the Complete Application

Requires MySQL, then the backend, then the frontend, in three terminals:

**Terminal 1 — MySQL:** ensure the server is running.

**Terminal 2 — Backend:**
```bash
cd backend
npm install
node server.js
```

**Terminal 3 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open the frontend URL displayed by the development server. It communicates with `http://localhost:5000/api`.

## End-to-End Workflow

```text
U/BILL → User Authentication → React Application → Express REST API
   ↓
┌─────────────────────┬──────────────────────┐
│ Normal Modules      │ Query Studio         │
│        ↓            │        ↓             │
│      MySQL          │ SQL Classification   │
│                     │    ┌────┴────┐       │
│                     │   READ     WRITE     │
│                     │    ↓         ↓       │
│                     │ Execute   PENDING    │
│                     │            ↓          │
│                     │       Admin Review    │
│                     │        /       \      │
│                     │   APPROVE     REJECT  │
│                     │      ↓                │
│                     │  EXECUTING            │
│                     │   /      \            │
│                     │ COMPLETED FAILED      │
└─────────────────────┴──────────────────────┘
```

## Project Demonstration Flow

A complete academic demonstration can follow:

```text
1. EER Diagram → 2. Relational Schema → 3. Normalization/BCNF → 4. MySQL DB Creation
→ 5. Table & Constraint Creation → 6. Sample Data Insertion → 7. Basic SQL Queries
→ 8. Advanced SQL Queries → 9. Dashboard Queries → 10. Start Backend → 11. Verify REST APIs
→ 12. Start Frontend → 13. Login → 14. Dashboard → 15. Database Explorer
→ 16. Query Studio (SELECT) → 17. Query Studio (INSERT/UPDATE/DELETE/DDL)
→ 18. Processing Queue → 19. Admin Approval/Rejection → 20. Operations Modules
→ 21. Reports & Analytics → 22. Complete Working System
```
