# Testing checklist

Legend: ✅ verified in the development environment · ⏳ needs a real TimescaleDB server
(blocked here, see [TIMESCALEDB.md](TIMESCALEDB.md)) · 🔧 not run here (tool unavailable) ·
👤 manual check during the demo.

## What was actually run (24 Oct 2026)

| Suite | Environment | Result |
|---|---|---|
| Backend unit + integration tests (JUnit 5, 18 classes) | PostgreSQL 16.15 **without TimescaleDB** + test-only shim; MySQL 8.0.46; 634,450 simulated readings | **120 / 120 passed** |
| `backend/scripts/api-smoke-test.mjs` against the running API | same | **44 / 45 passed**; the one failure is the expected "TimescaleDB extension is active" check |
| Migration script `migrate --replace` (+ `--include-app-tables`) and `verify`, live MySQL → fresh PostgreSQL DB | MySQL 8.0.46 → PostgreSQL 16.15 | **VERIFICATION PASSED** (20/20 tables, 30/30 bills, 0 orphans) |
| Frontend `npm run build` | Node 22, Vite 8 | ✅ builds; ESLint shows only the findings already present in U/BILL (none in new files) |
| Browser walk-through (Playwright, Chromium) as admin and as user | Vite dev server + API | ✅ all pages render with live data, no console errors except intentional 401/403 checks |

**How the backend was run here:** Maven Central was unreachable, so Spring Boot could not
be downloaded. The services, repositories and controllers were compiled against locally
available Spring Framework JARs and served by a small verification harness that routes
HTTP requests to the **real controller classes** using their mapping annotations, with the
real services and repositories on a real PostgreSQL database. Three Spring-Boot-only classes
— `GridPulseApplication`, `WebConfig` (CORS + interceptor registration) and
`AuthInterceptor` — were therefore **not compiled or started here** (the harness mimics
their behaviour). 🔧 Run `mvn spring-boot:run` and the smoke test once on a machine with
Maven Central access to close this gap.

## Acceptance criteria

### Existing functionality
| Check | How | Status |
|---|---|---|
| Frontend loads | `npm run dev`, open `/` and `/login` | ✅ |
| Login with `user`/`user123` and `admin`/`admin123`; invalid credentials rejected | smoke test, `SecurityUnitTest`, browser | ✅ |
| Customer, property, meter, reading, bill, payment views | `LegacyEndpointsIntegrationTest.everyRecordQueryExecutes`, `legacyRowShapesAreKept`; browser | ✅ |
| Dashboard statistics come from the database | `dashboardAndReportAggregatesMatchTheDatabase` | ✅ |
| Frontend calls only endpoints that exist | every `api.js` function exercised in the browser run; unknown routes → JSON 404 | ✅ |
| Bill generation and payments are transactional | `BillingIntegrationTest.billGenerationRecreatesTheSameBillInOneTransaction`, `paymentUpdatesBillStatusAndRollsBackOnError` | ✅ |

### Database migration
| Check | Status |
|---|---|
| Tables and constraints created (`02`, `03`, `06`–`08`) | ✅ on PostgreSQL 16 |
| Data migrated / generated; row counts and relationships verified | ✅ migration script; generator loaded into both DBs |
| `CREATE EXTENSION timescaledb`, hypertable, continuous aggregates, refresh policies (`01`, `04`, `05`, `09`) | ⏳ |
| `99_validation.sql` has no FAIL | ⏳ (TimescaleDB rows FAIL without the extension, by design) |

### Analytics
| Check | Test | Status |
|---|---|---|
| Daily and monthly totals correct; cumulative registers converted to interval consumption | `dailySeriesMatchesRawIntervalSumsAndIsNotASumOfRegisters`, `cumulativeRegisterDeltaEqualsSumOfIntervals`, `hourlyWeeklyAndMonthlyAggregationsAreConsistent` | ✅ (shim) · ⏳ on real caggs |
| Date filters; invalid input rejected | `invalidRequestsAreRejected` | ✅ |
| Current vs previous period | `comparisonUsesTheEquallyLongPreviousPeriod` | ✅ |
| Missing data shown as gaps | `periodsWithoutDataAreMarkedMissingNotZero`, `gapDayIsReportedWithFewerReadings` | ✅ |
| kWh and kL never mixed | `serviceTypeAggregatesOnlyMetersOfThatType`, smoke test | ✅ |

### Anomaly detection
| Check | Test | Status |
|---|---|---|
| Normal readings raise no alert | `normalDayRaisesNoAlert` | ✅ |
| Injected anomalies (generator manifest) found exactly | `fullHistoryDetectionFindsExactlyTheInjectedEvents` | ✅ |
| Deviation formula, thresholds, zero baseline, trimmed mean, own day excluded | `AnomalyRulesTest` (15 tests) | ✅ |
| No duplicates on re-run | `reRunningDetectionCreatesNoDuplicates` | ✅ |
| Status changes persist; RESOLVED needs ADMIN | API + browser | ✅ |

### Predictive billing
| Check | Test | Status |
|---|---|---|
| Uses the existing tariff logic | `forecastUsesRecordedConsumptionAndExistingTariff`, `TariffCalculatorTest` | ✅ |
| Brief example 180 units / 15 of 30 days → 360 | `ForecastCalculatorTest` | ✅ |
| Never written to `bill` | integration test checks bill count unchanged | ✅ |
| Insufficient data, early period, gaps, reset | `ForecastCalculatorTest`, `periodWithoutReadingsIsInsufficient`, `firstHoursOfAPeriodAreInsufficient` | ✅ |
| Labelled as estimate in API and UI | smoke test, screenshots | ✅ |

### Performance Lab
| Check | Test | Status |
|---|---|---|
| Statistics come from samples; equivalence within tolerance; speed-up only when equivalent | `BenchmarkStatsTest` | ✅ |
| MySQL and PostgreSQL workloads return equivalent results | `mysqlAndPostgresWorkloadsReturnEquivalentMeasuredResults` (on the shim, test mode) | ✅ |
| Without TimescaleDB nothing is measured or claimed | `withoutTimescaleNothingIsMeasuredOrClaimed`, UI | ✅ |
| MySQL missing / unreachable → "Not configured" / "Connection failed", no secrets | two integration tests | ✅ |
| ADMIN only, repetitions bounded | `onlyAdminsCanRunAndRepetitionsAreBounded` | ✅ |
| Real raw-vs-cagg and MySQL-vs-TimescaleDB timings | — | ⏳ |

### Security
| Check | Test | Status |
|---|---|---|
| No credentials in source; `.env` ignored | `git ls-files`, `.gitignore` | ✅ (demo passwords appear only in `.env.example`, tests and docs, as the brief requires) |
| Parameterized SQL | code review: repositories use `?` placeholders only | ✅ |
| USER cannot call ADMIN APIs (also with a tampered browser role or forged token) | smoke test (5 endpoints → 403, forged role → 401), browser with edited localStorage | ✅ |
| Approval password required, separate from admin login, wrong one changes nothing, audited, lock-out | `QueryStudioIntegrationTest` (5 tests), smoke test | ✅ |
| Query Studio cannot write directly, read app tables, run DDL or dangerous functions | `SqlClassifierTest` (40+ cases), `readPathCannotTouchApplicationTablesOrWrite`, `writerRoleCannotModifyApplicationTables` | ✅ |
| Benchmark accepts no SQL | API takes only `repetitions` | ✅ |

## Manual demo checks 👤

1. Sign in as `user`: no Approvals link; Performance Lab "Run" returns "Administrator access is required".
2. Sign in as `admin`: Approvals asks for `admin1234`; entering `admin123` is refused.
3. Submit `UPDATE tariff SET unit_rate = 8.6 WHERE tariff_code = 'ELEC-A'` as user → PENDING;
   approve as admin with the approval password → COMPLETED; Tariff Lab shows 8.6.
4. Alerts → open an alert → chart shows the spike against the dashed baseline → mark Reviewed
   (user) → Resolved (admin) → refresh: status persists.
5. Analytics → meter 1002, daily, last 30 days → export CSV.
6. `/api/health` shows the TimescaleDB version (on the Docker setup).
