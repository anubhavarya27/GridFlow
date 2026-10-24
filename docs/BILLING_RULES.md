# Billing rules — actual bills and estimates

## What U/BILL actually had

U/BILL never stored a bill amount. The `BILL` table holds the two register readings and a
`tariff_code`; `TARIFF` holds a single `unit_rate`; each meter's `UTILITY_SERVICE` holds a
`fixed_charge`, a `unit_rate` and a `tax` percentage. The only amount calculation in the
project was in `05_advanced_queries.sql` (#17, #18):

```sql
(b.current_reading - b.previous_reading) * t.unit_rate AS energy_charge
```

The Node API returned no amount at all, so the Billing Center showed "₹0". There are no
slabs, no effective dates and no time-of-day rates anywhere in the data.

## Rule used by GridPulse (`backend/.../service/TariffCalculator.java`)

```text
units          = current_reading − previous_reading                (BILL)
energy charge  = units × TARIFF.unit_rate                          (the bill's tariff)
fixed charge   = UTILITY_SERVICE.fixed_charge                      (the meter's service via METER_SERVICE)
tax            = UTILITY_SERVICE.tax % of (energy charge + fixed charge)
total          = round((energy + fixed) × (1 + tax/100), 2)  HALF_UP
```

* The energy charge is exactly the U/BILL query above.
* Adding the service's `fixed_charge` and `tax` is a **GridPulse interpretation**: those
  attributes exist in the U/BILL model for billing, but no U/BILL code applied them. The
  API therefore returns every component (`energy_charge`, `fixed_charge`, `tax_amount`,
  `total_amount`) and `amount_is_derived: true`, so the energy-only figure is always
  visible as well.
* `TARIFF.unit_rate` is used for the energy charge; `UTILITY_SERVICE.unit_rate` is not used
  (in the sample data the two agree for most meters, but the bill references the tariff).
* All tariffs are **flat** per-unit rates; there is no slab logic because the data model has
  none. If slabs are added later, only `TariffCalculator` changes — forecasts use the same
  method, so estimates stay priced like real bills.
* Example: bill 5001 → 150 kWh × ₹8.50 = ₹1,275.00 + ₹50.00 fixed = ₹1,325.00, tax 5 % =
  ₹66.25, **total ₹1,391.25**. The legacy payment was ₹1,320.00, so the API shows a
  balance due of ₹71.25 (a legacy data inconsistency, reported, not edited).

## Bill generation (`POST /api/bills/generate`, ADMIN)

1. `billing_month` must be the first of a month and not in the future.
2. The bill for month M uses the cycle reading dated **M‑01** as `current_reading` and
   **(M‑1)‑01** as `previous_reading` (U/BILL convention: the 1 Feb read closes January).
3. If a cycle reading is missing, it is created from the interval register at local
   midnight: an exact 00:00 reading → `Valid`; otherwise the latest reading in the previous
   hour → `Estimated`. If neither exists → HTTP 422.
4. Tariff: the request's `tariff_code`, otherwise the meter's latest bill tariff.
5. Readings and bill are inserted in **one transaction**; a duplicate (meter, month) → 409.

## Payments (`POST /api/payments`, ADMIN)

One transaction: insert `PAYMENT` with the next `payment_sequence` for that bill (must
exist in `PAYMENT_SCHEDULE`), insert the matching `CARD_PAYMENT` / `CASH_PAYMENT` /
`UPI_PAYMENT` row, then set the bill to `Paid` when payments cover the derived total,
otherwise `Partially Paid`. A Paid bill rejects further payments (409). Any failure rolls
the whole payment back.

## Projected month-end bill (`GET /api/bills/estimate/{meterId}`)

Estimates are **never written to the `bill` table**; every response has
`is_estimate: true`.

```text
billing period    = current calendar month in Asia/Kolkata (billed on the 1st of next month)
days elapsed      = time from the 1st 00:00 to the latest reading (fractional days)
recorded          = Σ daily interval consumption so far (cagg_meter_daily)
average daily     = recorded / days elapsed
projected         = average daily × days in the month
estimated bill    = TariffCalculator(projected units, tariff of the meter's latest bill,
                                     fixed charge and tax of the meter's service)
```

Example from the brief: 180 units in 15 days of a 30-day period → 12 units/day → 360 units.
(`ForecastCalculatorTest.briefExample_180UnitsIn15DaysOf30_projects360`.)

### Status and data-quality handling

| Situation | Behaviour |
|---|---|
| No readings in the period, or less than 1 day elapsed | `INSUFFICIENT_DATA`, **no number** is returned |
| Reading coverage < 50 % of expected 15-minute readings | `INSUFFICIENT_DATA` |
| Fewer than 3 days elapsed, coverage < 90 %, or a register reset in the period | `LOW_CONFIDENCE` with a warning for each reason |
| Estimated/Invalid readings in the period | warning (status unchanged) |
| Otherwise | `OK` |
| Latest reading is old (meter stopped reporting) | warning with the age of the latest reading |
| Meter has no bill yet (no tariff known) | warning; the meter's `UTILITY_SERVICE.unit_rate` is used as the rate |
| Tariff changed between the last two bills | warning; the latest tariff is used |
| No previous bill | `previous_bill: null`, warning, no comparison |
| Register reset | consumption uses stored interval deltas (after a reset, counted from zero), so no negative or inflated usage; `LOW_CONFIDENCE` |
| Projection below what is already recorded | clamped to the recorded amount |

The response also lists the `assumptions` used (linear extrapolation, tariff rule, estimate
only) so the UI can show them next to the number.
