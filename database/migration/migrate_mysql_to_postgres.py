#!/usr/bin/env python3
"""
GridPulse — migrate the legacy U/BILL MySQL database to PostgreSQL/TimescaleDB
=============================================================================

Copies the live contents of the legacy MySQL database (utility_billing_db) into
the GridPulse PostgreSQL database created by database/postgres/0*.sql, inside a
single PostgreSQL transaction, and then verifies the result against MySQL.

The MySQL database is only READ.  It is never modified or dropped.

  python3 migrate_mysql_to_postgres.py migrate [--replace] [--include-app-tables] [--include-interval]
  python3 migrate_mysql_to_postgres.py verify  [--include-interval]

Connection settings come from environment variables (no credentials in code):
  MYSQL_HOST (localhost)  MYSQL_PORT (3306)  MYSQL_USER (root)
  MYSQL_PASSWORD          MYSQL_DATABASE (utility_billing_db)
  PGHOST (localhost)      PGPORT (5432)      PGUSER (gridpulse_app)
  PGPASSWORD              PGDATABASE (gridpulse)

Requirements:  pip install PyMySQL psycopg[binary]

Verification (both sub-commands):
  1. row counts per table, MySQL vs PostgreSQL
  2. a SHA-256 fingerprint of every row of every domain table (values
     normalised: decimals, dates, NULLs), MySQL vs PostgreSQL
  3. bill totals (units billed) and payment totals, per bill
  4. referential integrity in PostgreSQL (orphan checks, although the FKs
     already enforce it)
Exit status 0 = everything matches, 1 = a check failed (migrate rolls back).
"""

from __future__ import annotations

import argparse
import datetime as dt
import decimal
import hashlib
import json
import os
import sys

try:
    import pymysql
    import psycopg
except ImportError as exc:  # pragma: no cover
    sys.exit(f"Missing driver ({exc.name}). Install with: pip install PyMySQL 'psycopg[binary]'")

# (mysql table, postgres table, columns, primary key) in FK dependency order.
DOMAIN_TABLES = [
    ("Customer", "customer", ["cust_id", "cust_name", "apartment", "flat_no", "city", "dob"], ["cust_id"]),
    ("Customer_Phone", "customer_phone", ["cust_id", "phone_no"], ["cust_id", "phone_no"]),
    ("Customer_Email", "customer_email", ["cust_id", "email"], ["cust_id", "email"]),
    ("Property", "property", ["property_id", "property_name", "occupancy_status"], ["property_id"]),
    ("Customer_Owns_Property", "customer_owns_property",
     ["cust_id", "property_id", "ownership_date", "ownership_type"], ["cust_id", "property_id"]),
    ("Meter", "meter", ["meter_id", "capacity", "installation_date", "meter_status"], ["meter_id"]),
    ("Property_Incorporate_Meter", "property_incorporate_meter", ["property_id", "meter_id"], ["meter_id"]),
    ("Meter_Reading", "meter_reading",
     ["meter_id", "reading_no", "reading_date", "reading_value", "reading_status"], ["meter_id", "reading_no"]),
    ("Utility_Service", "utility_service", ["service_id", "fixed_charge", "unit_rate", "tax"], ["service_id"]),
    ("Electricity_Service", "electricity_service", ["service_id", "voltage_level"], ["service_id"]),
    ("Water_Service", "water_service", ["service_id", "water_source"], ["service_id"]),
    ("Meter_Service", "meter_service", ["meter_id", "service_id"], ["meter_id", "service_id"]),
    ("Tariff", "tariff", ["tariff_code", "unit_rate"], ["tariff_code"]),
    ("Bill", "bill", ["meter_id", "billing_month", "bill_id", "billing_date", "previous_reading",
                      "current_reading", "tariff_code", "bill_status"], ["meter_id", "billing_month"]),
    ("Payment_Schedule", "payment_schedule", ["payment_sequence", "payment_due_date"], ["payment_sequence"]),
    ("Payment", "payment", ["bill_id", "payment_sequence", "payment_id", "payment_date", "amount",
                            "payment_mode"], ["bill_id", "payment_sequence"]),
    ("Card", "card", ["card_no", "bank_name"], ["card_no"]),
    ("Card_Payment", "card_payment", ["payment_id", "card_no"], ["payment_id"]),
    ("Cash_Payment", "cash_payment", ["payment_id", "receipt_no"], ["payment_id"]),
    ("UPI_Payment", "upi_payment", ["payment_id", "upi_id", "upi_app"], ["payment_id"]),
]

INTERVAL_TABLE = ("meter_interval_reading", "meter_interval_reading",
                  ["meter_id", "reading_time", "register_value", "interval_consumption", "interval_minutes",
                   "reading_quality", "register_reset", "data_source"], ["meter_id", "reading_time"])


def mysql_conn():
    return pymysql.connect(
        host=os.getenv("MYSQL_HOST", "localhost"),
        port=int(os.getenv("MYSQL_PORT", "3306")),
        user=os.getenv("MYSQL_USER", "root"),
        password=os.getenv("MYSQL_PASSWORD", ""),
        database=os.getenv("MYSQL_DATABASE", "utility_billing_db"),
        charset="utf8mb4",
    )


def pg_conn():
    return psycopg.connect(
        host=os.getenv("PGHOST", "localhost"),
        port=int(os.getenv("PGPORT", "5432")),
        user=os.getenv("PGUSER", "gridpulse_app"),
        password=os.getenv("PGPASSWORD", ""),
        dbname=os.getenv("PGDATABASE", "gridpulse"),
    )


def norm(v):
    """Normalise a value so that MySQL and PostgreSQL rows compare equal."""
    if v is None:
        return None
    if isinstance(v, decimal.Decimal):
        return format(v.normalize(), "f") if v != 0 else "0"
    if isinstance(v, dt.datetime):
        if v.tzinfo is not None:
            v = v.astimezone(dt.timezone.utc).replace(tzinfo=None)
        return v.isoformat(sep=" ")
    if isinstance(v, (dt.date,)):
        return v.isoformat()
    if isinstance(v, bool):
        return int(v)
    return v


def fetch_rows(cur, table, cols, order):
    cur.execute(f"SELECT {', '.join(cols)} FROM {table} ORDER BY {', '.join(order)}")
    return cur.fetchall()


def fingerprint(rows):
    h = hashlib.sha256()
    for r in rows:
        h.update(json.dumps([norm(v) for v in r], default=str).encode())
        h.update(b"\n")
    return h.hexdigest()


def mysql_table_exists(mcur, name):
    mcur.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = %s",
                 (name,))
    return mcur.fetchone()[0] == 1


def verify(mysql, pg, tables) -> bool:
    ok = True
    print(f"{'table':32} {'mysql':>9} {'postgres':>9}  fingerprint")
    with mysql.cursor() as mcur, pg.cursor() as pcur:
        pcur.execute("SET TIME ZONE 'UTC'")
        for mtable, ptable, cols, pk in tables:
            if not mysql_table_exists(mcur, mtable):
                print(f"{ptable:32} {'absent':>9} {'-':>9}  skipped")
                continue
            mrows = fetch_rows(mcur, mtable, cols, pk)
            prows = fetch_rows(pcur, ptable, cols, pk)
            same = fingerprint(mrows) == fingerprint(prows)
            ok &= same and len(mrows) == len(prows)
            print(f"{ptable:32} {len(mrows):>9} {len(prows):>9}  {'MATCH' if same else 'DIFFERENT'}")

        # Bill and payment totals, per bill.
        mcur.execute("SELECT b.bill_id, b.current_reading - b.previous_reading, COALESCE(SUM(p.amount), 0) "
                     "FROM Bill b LEFT JOIN Payment p ON p.bill_id = b.bill_id GROUP BY b.bill_id, 2 ORDER BY 1")
        mb = [tuple(norm(x) for x in r) for r in mcur.fetchall()]
        pcur.execute("SELECT b.bill_id, b.current_reading - b.previous_reading, COALESCE(SUM(p.amount), 0) "
                     "FROM bill b LEFT JOIN payment p ON p.bill_id = b.bill_id GROUP BY b.bill_id, 2 ORDER BY 1")
        pb = [tuple(norm(x) for x in r) for r in pcur.fetchall()]
        same = mb == pb
        ok &= same
        print(f"{'per-bill units and payment totals':32} {len(mb):>9} {len(pb):>9}  {'MATCH' if same else 'DIFFERENT'}")

        # Orphans in PostgreSQL (FKs should make these zero).
        orphan_sql = {
            "payment without bill": "SELECT COUNT(*) FROM payment p LEFT JOIN bill b USING (bill_id) WHERE b.bill_id IS NULL",
            "bill without meter": "SELECT COUNT(*) FROM bill b LEFT JOIN meter m USING (meter_id) WHERE m.meter_id IS NULL",
            "reading without meter": "SELECT COUNT(*) FROM meter_reading r LEFT JOIN meter m USING (meter_id) WHERE m.meter_id IS NULL",
            "card_payment without payment": "SELECT COUNT(*) FROM card_payment c LEFT JOIN payment p USING (payment_id) WHERE p.payment_id IS NULL",
        }
        for label, sql in orphan_sql.items():
            pcur.execute(sql)
            n = pcur.fetchone()[0]
            ok &= n == 0
            print(f"{'orphans: ' + label:32} {'':>9} {n:>9}  {'OK' if n == 0 else 'FAIL'}")
    print("\nVERIFICATION", "PASSED" if ok else "FAILED")
    return ok


def migrate(args) -> int:
    tables = list(DOMAIN_TABLES) + ([INTERVAL_TABLE] if args.include_interval else [])
    mysql, pg = mysql_conn(), pg_conn()
    try:
        with mysql.cursor() as mcur, pg.cursor() as pcur:
            pcur.execute("SET TIME ZONE 'UTC'")  # MySQL interval DATETIMEs are UTC
            if args.replace:
                targets = [t[1] for t in tables]
                if args.include_app_tables:
                    targets += ["query_request", "access_requests", "app_users"]
                pcur.execute("TRUNCATE " + ", ".join(targets) + " CASCADE")
            for mtable, ptable, cols, pk in tables:
                if not mysql_table_exists(mcur, mtable):
                    print(f"skip {mtable}: not present in MySQL")
                    continue
                rows = fetch_rows(mcur, mtable, cols, pk)
                if ptable == "meter_interval_reading":
                    rows = [r[:6] + (bool(r[6]),) + r[7:] for r in rows]
                with pcur.copy(f"COPY {ptable} ({', '.join(cols)}) FROM STDIN") as cp:
                    for r in rows:
                        cp.write_row(r)
                print(f"copied {len(rows):>8} rows  {mtable} -> {ptable}")

            if args.include_app_tables:
                migrate_app_tables(mcur, pcur)

        print()
        if not verify(mysql, pg, tables):
            pg.rollback()
            print("Rolled back: PostgreSQL is unchanged.")
            return 1
        pg.commit()
        print("Committed. Next: psql -f database/postgres/09_post_load.sql")
        return 0
    finally:
        mysql.close()
        pg.close()


def migrate_app_tables(mcur, pcur):
    """users -> app_users (identity only; password hashes are NOT copied),
    access_requests and QUERY_REQUEST with their original IDs."""
    if mysql_table_exists(mcur, "users"):
        mcur.execute("SELECT user_id, username, role, created_at, updated_at FROM users ORDER BY user_id")
        for r in mcur.fetchall():
            pcur.execute("INSERT INTO app_users (user_id, username, role, created_at, updated_at) "
                         "VALUES (%s, %s, %s, %s, %s) ON CONFLICT (username) DO NOTHING", r)
        pcur.execute("SELECT setval(pg_get_serial_sequence('app_users', 'user_id'), "
                     "GREATEST(COALESCE(MAX(user_id), 0), 1)) FROM app_users")
    if mysql_table_exists(mcur, "access_requests"):
        mcur.execute("SELECT request_id, requested_by, operation, target_table, record_id, request_data, reason, "
                     "status, reviewed_by, reviewed_at, review_comment, created_at, updated_at FROM access_requests")
        for r in mcur.fetchall():
            pcur.execute("INSERT INTO access_requests (request_id, requested_by, operation, target_table, record_id, "
                         "request_data, reason, status, reviewed_by, reviewed_at, review_comment, created_at, "
                         "updated_at) VALUES (%s,%s,%s,%s,%s,%s::jsonb,%s,%s,%s,%s,%s,%s,%s)", r)
        pcur.execute("SELECT setval(pg_get_serial_sequence('access_requests', 'request_id'), "
                     "GREATEST(COALESCE(MAX(request_id), 0), 1)) FROM access_requests")
    if mysql_table_exists(mcur, "QUERY_REQUEST"):
        mcur.execute("SELECT request_id, submitted_by, reviewed_by, sql_query, query_type, status, submitted_at, "
                     "reviewed_at, rejection_reason, execution_result FROM QUERY_REQUEST")
        for r in mcur.fetchall():
            pcur.execute("INSERT INTO query_request (request_id, submitted_by, reviewed_by, sql_query, query_type, "
                         "status, submitted_at, reviewed_at, rejection_reason, execution_result) "
                         "VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)", r)
        pcur.execute("SELECT setval(pg_get_serial_sequence('query_request', 'request_id'), "
                     "GREATEST(COALESCE(MAX(request_id), 0), 1)) FROM query_request")
    print("copied application tables (users without password hashes, access_requests, QUERY_REQUEST)")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    m = sub.add_parser("migrate", help="copy MySQL -> PostgreSQL, verify, commit or roll back")
    m.add_argument("--replace", action="store_true", help="TRUNCATE the target tables first")
    m.add_argument("--include-app-tables", action="store_true", help="also copy users/access_requests/QUERY_REQUEST")
    m.add_argument("--include-interval", action="store_true", help="also copy meter_interval_reading if present")
    v = sub.add_parser("verify", help="compare MySQL and PostgreSQL without changing anything")
    v.add_argument("--include-interval", action="store_true")
    args = ap.parse_args()
    if args.cmd == "migrate":
        return migrate(args)
    tables = list(DOMAIN_TABLES) + ([INTERVAL_TABLE] if args.include_interval else [])
    mysql, pg = mysql_conn(), pg_conn()
    try:
        return 0 if verify(mysql, pg, tables) else 1
    finally:
        mysql.close()
        pg.close()


if __name__ == "__main__":
    sys.exit(main())
