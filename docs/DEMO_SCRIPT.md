# Demonstration script (≈ 15 minutes)

Before the evaluation: `docker compose up -d` (database/), `mvn spring-boot:run` (backend/),
`npm run dev` (frontend/). Open `http://localhost:5173`. Check `/api/health` shows the
TimescaleDB version. Have a second browser window ready for the `user` account.

| # | Time | Show | Say |
|---|---|---|---|
| 1 | 1 min | Landing page → architecture diagram in `docs/ARCHITECTURE.md` | "GridPulse is U/BILL upgraded: same React UI, Java Spring Boot + JDBC backend, PostgreSQL with TimescaleDB." |
| 2 | 1 min | Login as `user`/`user123`. Point out: no Approvals link. Try a wrong password first. | "Credentials are checked by the backend; the role is inside a signed token, so editing browser storage gives nothing." |
| 3 | 2 min | Dashboard: original KPIs + the four new ones, alert preview, projected bill (ESTIMATE tag) | "Month-to-date is per service — kWh and kL are never added. The estimate is linear extrapolation priced with the tariff rule and never stored as a bill." |
| 4 | 2 min | Consumption Analytics: meter 1002 (water), daily, last 30 days → switch to hourly for 2 days → monthly for a year → Export CSV | "Readings are cumulative registers; we store interval deltas and sum those. Daily and hourly come from continuous aggregates — the `source` field in the API says which." |
| 5 | 2 min | Consumption Alerts: filter severity HIGH, open a water-meter alert → chart with dashed baseline → explanation → mark Reviewed | "Trimmed 28-day baseline, the day itself excluded, +100 % = HIGH. It is a reason to investigate, not proof of a leak or fraud." |
| 6 | 1 min | Meter Monitor → click 1001 → detail panel → "Consumption Analytics" link | |
| 7 | 1 min | Query Studio: run `SELECT * FROM bill WHERE meter_id = 1001;` then submit `UPDATE tariff SET unit_rate = 8.6 WHERE tariff_code = 'ELEC-A';` → PENDING | "Reads are one statement in a read-only transaction under a restricted role; writes need approval." |
| 8 | 2 min | Switch to `admin`/`admin123` → Approvals → asks for approval password → try `admin123` (refused) → `admin1234` → approve the tariff request → COMPLETED. Show `GET /api/audit/approvals` | "The approval password is checked on the server for every action, separately from the login, and every attempt is audited without storing the password." |
| 9 | 1 min | Alerts → resolve the reviewed alert (admin only) | |
| 10 | 2 min | Performance Lab → status cards (versions, row counts, sizes) → Run (10 reps) → tables, equivalence, plans, methodology | "Same 350k readings in both databases, same query semantics, warm-ups excluded, medians from real timings, speed-up shown only when results are equivalent." |
| 11 | 30 s | `psql … -c "SELECT * FROM timescaledb_information.continuous_aggregates"` and `\d+ meter_interval_reading` | hypertable + caggs exist |

## Likely questions

* **Why two reading tables?** Hypertable unique keys must include the time column; keeping
  `METER_READING (meter_id, reading_no)` unchanged preserves U/BILL's identity rule.
* **Why plain-text passwords?** Required by the brief for a controlled demo; documented as
  unsuitable for production; passwords never leave the server.
* **Is TimescaleDB faster?** Only the Performance Lab numbers on this machine answer that;
  we don't claim it in general.
* **What if data is missing?** Analytics shows gaps, alerts raise DATA_GAP instead of judging,
  forecasts return LOW_CONFIDENCE or INSUFFICIENT_DATA instead of a number.
