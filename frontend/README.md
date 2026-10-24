# GridPulse — frontend

React 19 + Vite 8 + React Router 7 + Recharts 3 + lucide-react. This is the U/BILL user
interface, kept in the same visual style and extended with the GridPulse pages.

```bash
npm install
npm run dev        # http://localhost:5173 (expects the backend on http://localhost:5000/api)
npm run build      # production bundle in dist/
npm run lint
```

Optional `frontend/.env` (copy `.env.example`): `VITE_API_BASE_URL=http://localhost:5000/api`.

| Route | Page |
|---|---|
| `/`, `/login` | Landing, sign-in (USER / ADMIN toggle) |
| `/dashboard` | KPIs, consumption insights, alert preview, projected bill |
| `/analytics` | Consumption Analytics (accepts `?meterId=&interval=&from=&to=`) |
| `/alerts` | Consumption Alerts and alert detail |
| `/performance-lab` | Database Performance Lab |
| `/database`, `/queries`, `/records`, `/reports` | Database Explorer, Query Studio, Processing, Reports |
| `/customer-360`, `/property-portfolio`, `/meter-monitor`, `/tariff-lab`, `/billing-center`, `/payment-hub` | Operations pages |
| `/admin` | Approvals (ADMIN, approval password) |

All data comes from the backend (`src/services/api.js`); nothing is hard-coded. The role
stored in the browser only decides which buttons are shown — the backend authorizes every
request. See the repository [README](../README.md) and [docs/FEATURES.md](../docs/FEATURES.md).
