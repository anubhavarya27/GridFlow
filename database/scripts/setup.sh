#!/usr/bin/env bash
# =====================================================================
# GridPulse database setup (Linux / macOS / Git Bash).  Run from database/:
#   docker compose up -d && ./scripts/setup.sh
# Steps: generate SIMULATED dataset -> load into TimescaleDB -> refresh
# continuous aggregates -> validate -> load the same interval data into
# the legacy MySQL database for the Performance Lab.
# Optional: END=2026-10-24T00:00 ./scripts/setup.sh  (fixed dataset end)
# =====================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

PY=${PYTHON:-python3}
echo "== 1/5 generating SIMULATED dataset"
if [ -n "${END:-}" ]; then "$PY" generator/generate_dataset.py --end "$END"; else "$PY" generator/generate_dataset.py; fi

echo "== 2/5 waiting for containers"
for svc in timescaledb mysql; do
  for i in $(seq 1 60); do
    status=$(docker inspect -f '{{.State.Health.Status}}' "gridpulse-$( [ $svc = mysql ] && echo legacy-mysql || echo timescaledb )" 2>/dev/null || true)
    [ "$status" = healthy ] && break
    sleep 2
  done
  echo "   $svc: ${status:-unknown}"
done

echo "== 3/5 loading TimescaleDB"
docker compose exec -T -w /gridpulse/generated timescaledb \
  psql -v ON_ERROR_STOP=1 -U postgres -d gridpulse -f /gridpulse/scripts/load_generated_postgres.sql
docker compose exec -T timescaledb \
  psql -v ON_ERROR_STOP=1 -U postgres -d gridpulse -f /gridpulse/postgres/09_post_load.sql

echo "== 4/5 validating"
docker compose exec -T timescaledb \
  psql -U postgres -d gridpulse -f /gridpulse/postgres/99_validation.sql

echo "== 5/5 loading the benchmark table in legacy MySQL"
docker compose exec -T -w /gridpulse/generated mysql sh -c \
  'mysql --local-infile=1 -uroot -p"$MYSQL_ROOT_PASSWORD" utility_billing_db < /gridpulse/scripts/load_generated_mysql.sql'

echo "Done. Start the backend (backend/README.md) and open the frontend."
