# GridPulse features

What each module does, where it lives, and which API it uses. U/BILL modules are kept
and now run on the Java backend and PostgreSQL; GridPulse additions are marked **NEW**.

## Navigation

| Group | Pages |
|---|---|
| Overview | Dashboard · Database Explorer · Query Studio · Processing · Reports |
| Intelligence **NEW** | Consumption Analytics · Consumption Alerts (badge = active alerts) · Performance Lab |
| Operations | Customer 360 · Property Portfolio · Meter Monitor · Tariff Lab · Billing Center · Payment Hub |
| Admin | Approvals (ADMIN only, badge = pending requests) |

The visual identity is unchanged: dark dashboard, teal accents, compact mono labels,
cards, tables and Recharts charts.

## Preserved U/BILL modules

| Module | What it shows / does | Changes in GridPulse |
|---|---|---|
| Landing, Login | marketing page, USER/ADMIN sign-in toggle | rebranded; login checked by the Java backend |
| Dashboard | customers, properties, meters, revenue KPIs; monthly billed consumption; billing status; payment distribution; recent activity; monthly revenue; CSV export | 4 new KPIs, alert preview, projected-bill panel (below); month labels carry the year |
| Database Explorer | browse all 20 domain tables | unchanged UI, PostgreSQL data |
| Query Studio | run SQL, saved queries, Add/Edit/Delete record forms that generate SQL | reads are sandboxed; writes queue for approval; schema lookup via `/query/schema/{table}` |
| Processing | the user's own submitted requests and their status | — |
| Reports | overview, monthly revenue + consumption, bill status, payment methods, top meters | — |
| Customer 360 | customer profile, phones, emails, properties, meters, bills, payments | bill amounts now real (were ₹0) |
| Property Portfolio | properties, occupancy, meters, owners | — |
| Meter Monitor | meter table | **meter detail panel** (below) |
| Tariff Lab | tariffs and utility services | — |
| Billing Center | bill register with search | derived amounts and paid totals, projected-bill panel, **Generate bill** (ADMIN) |
| Payment Hub | payment register | **Record payment** (ADMIN) |
| Approvals | review queue for Query Studio writes | approval password required for every approve/reject; FAILED badge |

## Enhanced dashboard **NEW**

Four extra KPIs from `GET /api/dashboard/consumption-insights` (never hard-coded):

1. **Month-to-date consumption** — per service (electricity kWh, water kL; never added together).
2. **Change vs same span last month** — e.g. 1–23 Oct vs 1–23 Sep.
3. **Estimated month-end bill** — sum of per-meter projections, labelled ESTIMATE.
4. **Active consumption alerts** — NEW + REVIEWED.

Plus an alert preview (meter, severity, observed, deviation, link) and the projected-bill panel.

## Consumption Analytics **NEW** (`/analytics`)

* Meter selector (shows service, property, owners) or a whole service type.
* From/to dates; aggregation hour / day / week / month.
* Line chart; gaps appear as breaks, not zeros.
* KPIs: total, average per interval, peak interval, change vs previous equal-length period.
* Current vs previous period bar chart.
* "How these numbers are computed" panel (cumulative register, interval deltas, IST buckets, units).
* Historical readings table from the hypertable (register, interval use, interval length,
  quality, reset flag, data source) with paging.
* CSV export of the filtered series. URL parameters (`?meterId=1002&interval=day&from=…`) let
  other pages deep-link to a preselected meter.

## Explainable anomaly detection **NEW**

Implemented in `AnomalyRules` (pure, unit-tested) and `AnomalyDetectionService`.

For each meter and each local day:

1. **Data quality first.** If fewer than 90 % of the expected 15-minute readings arrived →
   `DATA_GAP` (LOW) and consumption is not judged. Days with a register reset or a catch-up
   reading after a gap (> 60 min) are skipped — their totals are not comparable.
2. **Baseline:** the previous 28 days of the same meter, excluding the day being evaluated and
   excluding days that failed rule 1. At least 14 eligible days, otherwise no judgement.
3. **Robust mean:** 10 % trimmed mean, so one earlier spike does not inflate the baseline.
4. **Deviation** = (observed − baseline) / baseline × 100. Zero baseline → undefined → skipped.
5. **Classification** (configurable, `gridpulse.alerts.*`):

| Deviation | Alert type | Severity |
|---|---|---|
| ≥ +100 % | HIGH_CONSUMPTION | HIGH |
| +50 % … < +100 % | HIGH_CONSUMPTION | MODERATE |
| ≤ −70 % | LOW_CONSUMPTION | MODERATE |
| coverage < 90 % | DATA_GAP | LOW |

Each alert stores the observed value, baseline, window, deviation, thresholds and rule
version, a plain-language **explanation** and a **recommended action** that depends on the
service (leaks/taps for water; appliances/wiring for electricity). Daily totals are only
compared with daily totals of the same meter, never with monthly bills.

Duplicates are impossible: `UNIQUE (meter_id, observation_start, alert_type)`; re-running
detection is safe. Detection runs at startup (look-back 730 days), hourly for the last 3 days,
and on demand (`POST /api/alerts/detect`, ADMIN).

**Limitations:** thresholds are illustrative starting values, not standards; weekly/seasonal
patterns are not modelled (a 28-day baseline partly absorbs them); a gradual change slowly
becomes the new baseline. **An alert is an indicator for investigation, not proof of fraud or
equipment failure** — the UI shows this on every alert.

## Consumption Alerts **NEW** (`/alerts`)

* Summary cards: active, HIGH, MODERATE/LOW, NEW · REVIEWED · RESOLVED.
* Filters: severity, status, meter, reading-date range.
* Table: ID, meter, customer/property, reading day, observed, historical average, deviation,
  type, severity, status, created.
* Detail modal: bar chart of the baseline window, the observed day and following days with
  the baseline line, explanation, recommended action, timeline (created/reviewed/resolved by).
* Lifecycle NEW → REVIEWED → RESOLVED with an optional note, persisted in the database.
  USER may mark REVIEWED; RESOLVED needs ADMIN. **Run detection** button for ADMIN.

## Predictive billing **NEW**

`ProjectedBillPanel` on the Dashboard, Billing Center and Meter Monitor, backed by
`GET /api/bills/estimate/{meterId}`: billing period, days elapsed, recorded consumption,
average per day, projected consumption, energy/fixed/tax breakdown, tariff, previous actual
bill and change, status (OK / LOW_CONFIDENCE / INSUFFICIENT_DATA) and warnings. Dashed border
and an ESTIMATE tag distinguish it from issued bills. Rules: [BILLING_RULES.md](BILLING_RULES.md).

## Meter detail **NEW** (Meter Monitor → click a meter)

Current-period consumption, last 30 days (total and daily average), latest alert with
severity/status, status and capacity, 30-day daily chart, recent interval readings, the
projected bill, and a **Consumption Analytics** link with the meter preselected.

## Database Performance Lab **NEW** (`/performance-lab`)

Live status of the new (PostgreSQL + TimescaleDB) and old (MySQL) databases, a run button
(ADMIN; 3–30 repetitions), per-workload tables of measured statistics, result equivalence,
median chart, comparisons (only when valid), the SQL and query plans, and the methodology.
See [PERFORMANCE_LAB.md](PERFORMANCE_LAB.md).

## Query Studio and approvals

```text
Read  (SELECT / WITH … SELECT / VALUES / TABLE / EXPLAIN / SHOW / DESCRIBE)
      → one statement → read-only transaction as gridpulse_query_reader → rows (≤ 1,000, 5 s)
Write (INSERT / UPDATE / DELETE / MERGE, incl. data-modifying CTEs and mixed batches)
      → QUERY_REQUEST PENDING → ADMIN + approval password → one transaction as
        gridpulse_query_writer → COMPLETED, or FAILED with full rollback
Refused: DDL, GRANT/REVOKE, COPY, DO/CALL, SET/RESET, BEGIN/COMMIT, dangerous functions
```

The classifier understands PostgreSQL lexing (E-strings, quoted identifiers, nested
comments) and refuses dollar quoting, so a statement cannot hide inside a string. Every
approval attempt is audited.

## Authentication (academic demo)

Two fixed accounts, compared in **plain text** as the brief requires — **not suitable for
production**: `user` / `user123` (USER), `admin` / `admin123` (ADMIN), and the separate
approval password `admin1234`. Values come from configuration, never from the frontend
bundle, and are never returned, logged or stored. See [SETUP.md](SETUP.md#security-notes).
