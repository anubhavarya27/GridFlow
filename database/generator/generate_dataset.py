#!/usr/bin/env python3
"""
GridPulse synthetic dataset generator  (SIMULATED DATA — not real meter data)
=============================================================================

Generates reproducible 15-minute smart-meter interval readings for the ten
legacy U/BILL meters, plus the billing-cycle readings, bills and payments
that follow from them.  Every generated interval row carries
data_source = 'SIMULATED'.

The legacy U/BILL data stays the source of truth:
  * the register at 2025-01-01 / 2025-02-01 / 2025-03-01 00:00 IST equals the
    legacy METER_READING values exactly (anchors), so the generated time series
    is consistent with the legacy bills for January-March 2025;
  * new bills follow the legacy convention: the bill for billing_month M uses
    the cycle read dated M-01 as current_reading and (M-1)-01 as
    previous_reading;
  * payment amounts use the derived bill amount documented in
    docs/BILLING_RULES.md (same formula as backend TariffCalculator):
        total = round((units * tariff.unit_rate + fixed_charge) * (1 + tax/100), 2)

Only the Python standard library is used.  Output goes to database/generated/
(git-ignored):

  interval_readings.csv   -> meter_interval_reading (PostgreSQL hypertable and
                             the MySQL benchmark table)
  cycle_readings.csv      -> meter_reading   (reading_no >= 4)
  bills.csv               -> bill            (bill_id >= 5031)
  payments.csv, card_payments.csv, cash_payments.csv, upi_payments.csv
  manifest.json           -> parameters, row counts, checksums, injected events

Reproducibility: same --seed, --start and --end  =>  byte-identical output.

Usage:
  python3 database/generator/generate_dataset.py --end 2026-10-24T00:00
  python3 database/generator/generate_dataset.py            # end = now (IST, floored to 15 min)
"""

from __future__ import annotations

import argparse
import csv
import calendar
import hashlib
import json
import math
import os
import random
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP

IST = timezone(timedelta(hours=5, minutes=30))
UTC = timezone.utc
INTERVAL_MIN = 15
SLOTS_PER_DAY = 24 * 60 // INTERVAL_MIN  # 96

# ---------------------------------------------------------------------------
# Legacy U/BILL reference data (mirrors database/postgres/06_legacy_data.sql).
# 99_validation.sql verifies that the generated register matches the legacy
# cycle readings, so a drift between this table and the SQL seed is detected.
# ---------------------------------------------------------------------------
SERVICES = {  # service_id: (type, fixed_charge, unit_rate, tax%)
    1: ("Electricity", Decimal("50.00"), Decimal("8.5000"), Decimal("5.00")),
    2: ("Water", Decimal("30.00"), Decimal("6.0000"), Decimal("5.00")),
    3: ("Electricity", Decimal("40.00"), Decimal("7.0000"), Decimal("5.00")),
    4: ("Water", Decimal("25.00"), Decimal("5.5000"), Decimal("5.00")),
}
TARIFFS = {
    "ELEC-A": Decimal("8.5000"),
    "ELEC-B": Decimal("7.0000"),
    "WATER-A": Decimal("6.0000"),
    "WATER-B": Decimal("5.5000"),
}


@dataclass
class MeterSpec:
    meter_id: int
    service_id: int
    tariff_code: str
    anchors: tuple  # register at 2025-01-01, 2025-02-01, 2025-03-01 (legacy reads 1..3)
    upi_id: str     # owner's UPI handle (legacy upi_payment values) for UPI payments
    service_type: str = field(init=False)

    def __post_init__(self):
        self.service_type = SERVICES[self.service_id][0]


METERS = [
    MeterSpec(1001, 1, "ELEC-A", (1200, 1350, 1510), "arun@upi"),
    MeterSpec(1002, 2, "WATER-A", (800, 920, 1050), "arun@upi"),
    MeterSpec(1003, 1, "ELEC-A", (2100, 2270, 2445), "rahul@upi"),
    MeterSpec(1004, 2, "WATER-A", (1800, 1940, 2090), "rahul@upi"),
    MeterSpec(1005, 3, "ELEC-B", (3200, 3450, 3710), "karthik@upi"),
    MeterSpec(1006, 4, "WATER-B", (2500, 2690, 2890), "karthik@upi"),
    MeterSpec(1007, 1, "ELEC-A", (1500, 1640, 1790), "vijay@upi"),
    MeterSpec(1008, 2, "WATER-A", (950, 1070, 1200), "vijay@upi"),
    MeterSpec(1009, 1, "ELEC-A", (4000, 4260, 4540), "sanjay@upi"),
    MeterSpec(1010, 2, "WATER-A", (500, 620, 750), "sanjay@upi"),
]
LEGACY_CARDS = ["CARD10001", "CARD10002", "CARD10003", "CARD10004"]
FIRST_GENERATED_BILL_ID = 5031      # legacy bills are 5001..5030
FIRST_GENERATED_PAYMENT_ID = 9020   # legacy payments are 9001..9019
FIRST_GENERATED_READING_NO = 4      # legacy cycle reads are 1..3
ANCHOR_MONTHS = [date(2025, 1, 1), date(2025, 2, 1), date(2025, 3, 1)]

# ---------------------------------------------------------------------------
# Injected events.  These are the ground truth for the anomaly-detection
# acceptance test: detection must flag these and nothing else.
# (meter_id, local date, daily multiplier, expected alert)
# ---------------------------------------------------------------------------
ANOMALIES = [
    (1003, date(2025, 6, 14), 2.8, "HIGH_CONSUMPTION/HIGH"),
    (1005, date(2025, 9, 3), 1.7, "HIGH_CONSUMPTION/MODERATE"),
    (1008, date(2025, 11, 20), 3.2, "HIGH_CONSUMPTION/HIGH"),
    (1001, date(2026, 2, 11), 2.1, "HIGH_CONSUMPTION/HIGH"),
    (1006, date(2026, 5, 8), 1.7, "HIGH_CONSUMPTION/MODERATE"),
    (1009, date(2026, 8, 22), 0.12, "LOW_CONSUMPTION/MODERATE"),
    (1002, date(2026, 10, 12), 2.6, "HIGH_CONSUMPTION/HIGH"),
    (1007, date(2026, 10, 19), 1.75, "HIGH_CONSUMPTION/MODERATE"),
]
# Missing readings: (meter_id, gap start local, gap end local) — readings with
# start <= t < end are dropped; the next reading carries the whole register delta.
GAPS = [
    (1004, datetime(2025, 8, 10, 9, 0, tzinfo=IST), datetime(2025, 8, 10, 15, 0, tzinfo=IST)),
    (1010, datetime(2026, 3, 3, 0, 0, tzinfo=IST), datetime(2026, 3, 4, 0, 0, tzinfo=IST)),
]
# Readings flagged 'Estimated' (meter_id, start local, end local).
ESTIMATED = [
    (1006, datetime(2026, 1, 15, 10, 0, tzinfo=IST), datetime(2026, 1, 15, 12, 0, tzinfo=IST)),
]


def money(v: Decimal) -> Decimal:
    return v.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def derived_bill_total(units: Decimal, tariff_code: str, service_id: int) -> Decimal:
    """Same rule as backend TariffCalculator (flat tariff, fixed charge, tax %)."""
    _, fixed, _, tax = SERVICES[service_id]
    energy = units * TARIFFS[tariff_code]
    return money((energy + fixed) * (Decimal(1) + tax / Decimal(100)))


def add_month(d: date, n: int = 1) -> date:
    y, m = divmod(d.month - 1 + n, 12)
    return date(d.year + y, m + 1, 1)


def diurnal_weights(service_type: str) -> list[float]:
    """Relative consumption per 15-minute slot of the day (slot 0 = 00:00-00:15)."""
    w = []
    for slot in range(SLOTS_PER_DAY):
        h = slot * INTERVAL_MIN / 60.0
        if service_type == "Electricity":
            v = 0.55
            v += 0.85 * math.exp(-((h - 7.5) ** 2) / 2.0)    # morning peak
            v += 1.30 * math.exp(-((h - 20.0) ** 2) / 3.0)   # evening peak
            v += 0.25 * math.exp(-((h - 14.0) ** 2) / 6.0)   # afternoon cooling
        else:
            v = 0.12
            v += 2.20 * math.exp(-((h - 7.0) ** 2) / 1.5)    # morning water use
            v += 1.40 * math.exp(-((h - 19.5) ** 2) / 2.0)   # evening water use
        w.append(v)
    s = sum(w)
    return [x / s for x in w]


def seasonal_factor(service_type: str, d: date) -> float:
    doy = d.timetuple().tm_yday
    if service_type == "Electricity":   # Chennai: summer peak around mid-May
        return 1.0 + 0.22 * math.cos(2 * math.pi * (doy - 135) / 365.0)
    return 1.0 + 0.08 * math.cos(2 * math.pi * (doy - 120) / 365.0)


def weekday_factor(service_type: str, d: date) -> float:
    weekend = d.weekday() >= 5
    if service_type == "Electricity":
        return 1.08 if weekend else 0.97
    return 1.05 if weekend else 0.98


def floor_15(dt: datetime) -> datetime:
    return dt.replace(minute=dt.minute - dt.minute % INTERVAL_MIN, second=0, microsecond=0)


def parse_end(value: str | None) -> datetime:
    if not value:
        return floor_15(datetime.now(IST))
    dt = datetime.fromisoformat(value)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=IST)
    return floor_15(dt.astimezone(IST))


def utc_text(dt: datetime) -> str:
    return dt.astimezone(UTC).strftime("%Y-%m-%d %H:%M:%S")


def milli_to_text(m: int) -> str:
    return f"{m // 1000}.{m % 1000:03d}"


def generate(seed: int, start: datetime, end: datetime, out_dir: str) -> dict:
    os.makedirs(out_dir, exist_ok=True)
    rng = random.Random(seed)
    anomaly_by_key = {(m, d): mult for m, d, mult, _ in ANOMALIES}

    interval_path = os.path.join(out_dir, "interval_readings.csv")
    interval_rows = 0
    consumption_checksum: dict[int, int] = {}
    cycle_registers: dict[tuple[int, date], int] = {}

    with open(interval_path, "w", newline="") as f:
        wr = csv.writer(f, lineterminator="\n")
        wr.writerow(["meter_id", "reading_time", "register_value", "interval_consumption",
                     "interval_minutes", "reading_quality", "register_reset", "data_source"])

        for spec in METERS:
            mrng = random.Random(f"{seed}-{spec.meter_id}")
            weights = diurnal_weights(spec.service_type)
            jan = spec.anchors[1] - spec.anchors[0]
            feb = spec.anchors[2] - spec.anchors[1]
            season_jan = seasonal_factor(spec.service_type, date(2025, 1, 15))
            base_daily = (jan + feb) / 59.0 / season_jan

            # 1) Build per-slot increments (float) for the whole period.
            times: list[datetime] = []
            incs: list[float] = []
            t = start + timedelta(minutes=INTERVAL_MIN)
            day_cache: dict[date, float] = {}
            while t <= end:
                slot_start = t - timedelta(minutes=INTERVAL_MIN)
                d = slot_start.date()
                if d not in day_cache:
                    daily = base_daily * seasonal_factor(spec.service_type, d) \
                        * weekday_factor(spec.service_type, d) * mrng.lognormvariate(0, 0.07)
                    daily *= anomaly_by_key.get((spec.meter_id, d), 1.0)
                    day_cache[d] = daily
                slot = (slot_start.hour * 60 + slot_start.minute) // INTERVAL_MIN
                incs.append(day_cache[d] * weights[slot] * mrng.uniform(0.85, 1.15))
                times.append(t)
                t += timedelta(minutes=INTERVAL_MIN)

            # 2) Convert to integer milli-units, scaling the anchored months
            #    (Jan, Feb 2025) so the register hits the legacy reads exactly,
            #    and rounding every later month-start register to 0.01 so the
            #    billing-cycle read (NUMERIC(12,2)) equals the interval register.
            milli = [max(0, int(round(x * 1000))) for x in incs]
            for k in range(2):  # Jan and Feb 2025
                a, b = ANCHOR_MONTHS[k], ANCHOR_MONTHS[k + 1]
                a_t = datetime(a.year, a.month, a.day, tzinfo=IST)
                b_t = datetime(b.year, b.month, b.day, tzinfo=IST)
                idx = [i for i, tt in enumerate(times) if a_t < tt <= b_t]
                target = (spec.anchors[k + 1] - spec.anchors[k]) * 1000
                raw = sum(incs[i] for i in idx)
                scaled_milli = [incs[i] * target / raw for i in idx]
                ints = [int(round(x)) for x in scaled_milli]
                diff = target - sum(ints)
                biggest = max(range(len(idx)), key=lambda j: ints[j])
                ints[biggest] += diff
                for j, i in enumerate(idx):
                    milli[i] = ints[j]

            register = spec.anchors[0] * 1000
            registers = []
            for i, tt in enumerate(times):
                register += milli[i]
                local = tt.astimezone(IST)
                if local.day == 1 and local.hour == 0 and local.minute == 0 and local.date() >= date(2025, 4, 1):
                    rem = register % 10
                    if rem and milli[i] >= rem:
                        milli[i] -= rem
                        register -= rem
                registers.append(register)

            # 3) Apply gaps and quality flags, then write rows.
            gaps = [(g0, g1) for m, g0, g1 in GAPS if m == spec.meter_id]
            est = [(e0, e1) for m, e0, e1 in ESTIMATED if m == spec.meter_id]

            def in_gap(tt):
                return any(g0 <= tt < g1 for g0, g1 in gaps)

            def is_est(tt):
                return any(e0 <= tt < e1 for e0, e1 in est)

            # first reading (start) — anchor, no interval
            wr.writerow([spec.meter_id, utc_text(start), milli_to_text(spec.anchors[0] * 1000),
                         r"\N", r"\N", "Valid", 0, "SIMULATED"])
            interval_rows += 1
            cycle_registers[(spec.meter_id, start.date())] = spec.anchors[0] * 1000
            prev_t, prev_reg = start, spec.anchors[0] * 1000
            total = 0
            for i, tt in enumerate(times):
                local = tt.astimezone(IST)
                if local.hour == 0 and local.minute == 0 and local.day == 1:
                    cycle_registers[(spec.meter_id, local.date())] = registers[i]
                if in_gap(tt):
                    continue
                delta = registers[i] - prev_reg
                minutes = int((tt - prev_t).total_seconds() // 60)
                wr.writerow([spec.meter_id, utc_text(tt), milli_to_text(registers[i]),
                             milli_to_text(delta), minutes,
                             "Estimated" if is_est(tt) else "Valid", 0, "SIMULATED"])
                interval_rows += 1
                total += delta
                prev_t, prev_reg = tt, registers[i]
            consumption_checksum[spec.meter_id] = total

    # ------------------------------------------------------------------
    # Billing-cycle readings, bills and payments
    # ------------------------------------------------------------------
    end_month = date(end.year, end.month, 1)
    cycle_rows, bill_rows, pay_rows, card_rows, cash_rows, upi_rows = [], [], [], [], [], []
    bill_id = FIRST_GENERATED_BILL_ID
    payment_id = FIRST_GENERATED_PAYMENT_ID
    receipt_no = 20001
    month = date(2025, 4, 1)
    reading_no = {m.meter_id: FIRST_GENERATED_READING_NO for m in METERS}
    while month <= end_month:
        prev_month = add_month(month, -1)
        for spec in METERS:
            cur = cycle_registers.get((spec.meter_id, month))
            prev = cycle_registers.get((spec.meter_id, prev_month))
            if cur is None or prev is None:
                continue
            cur_val = Decimal(cur) / 1000
            prev_val = Decimal(prev) / 1000
            cycle_rows.append([spec.meter_id, reading_no[spec.meter_id], month.isoformat(),
                               f"{cur_val:.2f}", "Valid"])
            reading_no[spec.meter_id] += 1

            last_day = date(month.year, month.month, calendar.monthrange(month.year, month.month)[1])
            units = cur_val - prev_val
            total = derived_bill_total(units, spec.tariff_code, spec.service_id)

            months_old = (end_month.year - month.year) * 12 + end_month.month - month.month
            roll = rng.random()
            if months_old == 0:
                status = "Pending"
            elif months_old == 1:
                status = "Paid" if roll < 0.7 else "Overdue"
            else:
                status = "Paid" if roll < 0.97 else "Partially Paid"

            pay_date = last_day + timedelta(days=rng.randint(3, 9))
            if status in ("Paid", "Partially Paid") and pay_date > end.date():
                status = "Pending"

            bill_rows.append([spec.meter_id, month.isoformat(), bill_id, last_day.isoformat(),
                              f"{prev_val:.2f}", f"{cur_val:.2f}", spec.tariff_code, status])

            if status in ("Paid", "Partially Paid"):
                amount = total if status == "Paid" else money(total / 2)
                r = rng.random()
                mode = "UPI" if r < 0.45 else ("Card" if r < 0.80 else "Cash")
                pay_rows.append([bill_id, 1, payment_id, pay_date.isoformat(), f"{amount:.2f}", mode])
                if mode == "Card":
                    card_rows.append([payment_id, rng.choice(LEGACY_CARDS)])
                elif mode == "Cash":
                    cash_rows.append([payment_id, f"REC{receipt_no}"])
                    receipt_no += 1
                else:
                    upi_rows.append([payment_id, spec.upi_id, rng.choice(["Google Pay", "PhonePe", "Paytm"])])
                payment_id += 1
            bill_id += 1
        month = add_month(month, 1)

    def write(name, header, rows):
        with open(os.path.join(out_dir, name), "w", newline="") as fh:
            w = csv.writer(fh, lineterminator="\n")
            w.writerow(header)
            w.writerows(rows)

    write("cycle_readings.csv", ["meter_id", "reading_no", "reading_date", "reading_value", "reading_status"], cycle_rows)
    write("bills.csv", ["meter_id", "billing_month", "bill_id", "billing_date", "previous_reading",
                        "current_reading", "tariff_code", "bill_status"], bill_rows)
    write("payments.csv", ["bill_id", "payment_sequence", "payment_id", "payment_date", "amount", "payment_mode"], pay_rows)
    write("card_payments.csv", ["payment_id", "card_no"], card_rows)
    write("cash_payments.csv", ["payment_id", "receipt_no"], cash_rows)
    write("upi_payments.csv", ["payment_id", "upi_id", "upi_app"], upi_rows)

    sha = hashlib.sha256()
    with open(interval_path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            sha.update(chunk)

    manifest = {
        "dataset": "GridPulse SIMULATED smart-meter dataset",
        "warning": "Synthetic data generated for demonstration. Not real customer consumption.",
        "seed": seed,
        "start_local": start.isoformat(),
        "end_local": end.isoformat(),
        "interval_minutes": INTERVAL_MIN,
        "time_convention": "reading_time is the END of the interval it reports (interval-ending)",
        "meters": [m.meter_id for m in METERS],
        "row_counts": {
            "interval_readings": interval_rows,
            "cycle_readings": len(cycle_rows),
            "bills": len(bill_rows),
            "payments": len(pay_rows),
            "card_payments": len(card_rows),
            "cash_payments": len(cash_rows),
            "upi_payments": len(upi_rows),
        },
        "total_interval_consumption_by_meter": {str(k): milli_to_text(v) for k, v in consumption_checksum.items()},
        "interval_readings_sha256": sha.hexdigest(),
        "injected_anomalies": [
            {"meter_id": m, "date": d.isoformat(), "multiplier": mult, "expected": exp}
            for m, d, mult, exp in ANOMALIES if start.date() <= d <= end.date()
        ],
        "injected_gaps": [
            {"meter_id": m, "from_local": a.isoformat(), "to_local": b.isoformat()} for m, a, b in GAPS
        ],
        "estimated_readings": [
            {"meter_id": m, "from_local": a.isoformat(), "to_local": b.isoformat()} for m, a, b in ESTIMATED
        ],
    }
    with open(os.path.join(out_dir, "manifest.json"), "w") as fh:
        json.dump(manifest, fh, indent=2)
    return manifest


def main() -> None:
    here = os.path.dirname(os.path.abspath(__file__))
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--seed", type=int, default=20250101)
    ap.add_argument("--end", help="end timestamp, local IST, e.g. 2026-10-24T00:00 (default: now)")
    ap.add_argument("--out", default=os.path.join(here, "..", "generated"))
    args = ap.parse_args()
    start = datetime(2025, 1, 1, 0, 0, tzinfo=IST)
    end = parse_end(args.end)
    if end <= start + timedelta(days=62):
        raise SystemExit("--end must be at least two months after 2025-01-01")
    manifest = generate(args.seed, start, end, os.path.abspath(args.out))
    print(json.dumps({"out": os.path.abspath(args.out), **manifest["row_counts"],
                      "end_local": manifest["end_local"]}, indent=2))


if __name__ == "__main__":
    main()
