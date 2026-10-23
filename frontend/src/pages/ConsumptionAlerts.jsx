
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Activity,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  Info,
} from "lucide-react";
import { getReadings, getMeters } from "../services/api";
import "../styles/consumption-alerts.css";

function rowsOf(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

function getMeterId(row) {
  return row.meter_id ?? row.meterId ?? row.meter?.meter_id ?? row.meter?.meterId;
}

function getDate(row) {
  return String(
    row.reading_date ?? row.readingDate ?? row.timestamp ?? ""
  ).slice(0, 10);
}

function getValue(row) {
  const value = Number(
    row.reading_value ?? row.readingValue ?? row.value ?? row.reading
  );
  return Number.isFinite(value) ? value : null;
}

function isInvalidStatus(status) {
  if (status == null || String(status).trim() === "") return false;
  return !["valid", "normal", "ok", "success"].includes(
    String(status).trim().toLowerCase()
  );
}

function buildAlerts(readings, meters) {
  const groups = new Map();

  readings.forEach((reading) => {
    const meterId = getMeterId(reading);
    const date = getDate(reading);
    const value = getValue(reading);

    if (meterId == null || !date || value == null) return;

    if (!groups.has(String(meterId))) {
      groups.set(String(meterId), []);
    }
    groups.get(String(meterId)).push({ ...reading, meterId: String(meterId), date, value });
  });

  const alerts = [];

  for (const [meterId, rows] of groups) {
    rows.sort((a, b) => a.date.localeCompare(b.date));

    const deltas = [];
    for (let i = 1; i < rows.length; i += 1) {
      const delta = rows[i].value - rows[i - 1].value;
      if (delta > 0) {
        deltas.push({
          row: rows[i],
          previousDate: rows[i - 1].date,
          delta,
        });
      }
    }

    const baseline = median(deltas.map((item) => item.delta));
    const meter = meters.find(
      (item) => String(item.meter_id ?? item.meterId ?? item.id) === meterId
    );

    rows.forEach((row) => {
      if (isInvalidStatus(row.reading_status ?? row.readingStatus)) {
        alerts.push({
          id: `status-${meterId}-${row.date}`,
          meterId,
          date: row.date,
          severity: "high",
          type: "Reading status",
          value: row.value,
          message: `Reading status is "${row.reading_status ?? row.readingStatus}".`,
          rule: "Non-standard reading status",
        });
      }
    });

    if (deltas.length >= 3 && baseline > 0) {
      deltas.forEach(({ row, previousDate, delta }) => {
        if (delta > baseline * 2) {
          alerts.push({
            id: `spike-${meterId}-${row.date}`,
            meterId,
            date: row.date,
            severity: delta > baseline * 3 ? "high" : "medium",
            type: "Usage spike",
            value: delta,
            message: `Reading increased by ${delta.toLocaleString("en-IN", { maximumFractionDigits: 2 })} since ${previousDate}.`,
            rule: "Interval increase greater than 2× the meter's median positive increase",
          });
        }
      });
    }

    // Keep meter lookup available for future display enhancements.
    void meter;
  }

  return alerts.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return (
      severityOrder[a.severity] - severityOrder[b.severity] ||
      b.date.localeCompare(a.date)
    );
  });
}

export default function ConsumptionAlerts() {
  const [readings, setReadings] = useState([]);
  const [meters, setMeters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [severity, setSeverity] = useState("all");
  const [meterId, setMeterId] = useState("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([getReadings(), getMeters()]);
      const failures = [];

      if (results[0].status === "fulfilled") {
        setReadings(rowsOf(results[0].value));
      } else {
        failures.push("Meter readings could not be loaded.");
      }

      if (results[1].status === "fulfilled") {
        setMeters(rowsOf(results[1].value));
      } else {
        failures.push("Meter details could not be loaded.");
      }

      if (failures.length) setError(failures.join(" "));
    } catch {
      setError("Unable to load consumption data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const alerts = useMemo(
    () => buildAlerts(readings, meters),
    [readings, meters]
  );

  const filteredAlerts = alerts.filter((alert) => {
    if (severity !== "all" && alert.severity !== severity) return false;
    if (meterId !== "all" && alert.meterId !== meterId) return false;
    return true;
  });

  const highCount = alerts.filter((a) => a.severity === "high").length;
  const mediumCount = alerts.filter((a) => a.severity === "medium").length;

  return (
    <main className="alerts-page">
      <header className="alerts-header">
        <div>
          <div className="alerts-eyebrow">GRIDFLOW / CONSUMPTION MONITORING</div>
          <h1>Consumption Alerts</h1>
          <p>
            Review unusual meter-reading changes and non-standard reading statuses.
          </p>
        </div>
        <button
          className="alerts-refresh"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw size={16} />
          {loading ? "Loading..." : "Refresh data"}
        </button>
      </header>

      <div className="alerts-method-note">
        <Info size={18} />
        <div>
          <strong>Rule-based screening — not an ML prediction</strong>
          <p>
            Usage spikes are flagged when the increase between consecutive
            readings exceeds twice the meter's median positive increase.
            At least three positive intervals are required for a meter.
            Results depend on the readings returned by the current API.
          </p>
        </div>
      </div>

      {error && (
        <div className="alerts-error" role="status">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <section className="alerts-kpis">
        <article className="alerts-kpi">
          <span><Activity size={17} /> Detected alerts</span>
          <strong>{loading ? "—" : alerts.length}</strong>
          <small>Derived from returned readings</small>
        </article>
        <article className="alerts-kpi alerts-kpi-high">
          <span><ShieldAlert size={17} /> High severity</span>
          <strong>{loading ? "—" : highCount}</strong>
          <small>Requires review</small>
        </article>
        <article className="alerts-kpi alerts-kpi-medium">
          <span><AlertTriangle size={17} /> Medium severity</span>
          <strong>{loading ? "—" : mediumCount}</strong>
          <small>Potential usage spikes</small>
        </article>
        <article className="alerts-kpi">
          <span><CheckCircle2 size={17} /> Readings analysed</span>
          <strong>{loading ? "—" : readings.length}</strong>
          <small>Records received from the API</small>
        </article>
      </section>

      <section className="alerts-panel">
        <div className="alerts-panel-heading">
          <div>
            <h2>Alert register</h2>
            <p>Filter and inspect detected conditions.</p>
          </div>
          <span className="alerts-count">{filteredAlerts.length} results</span>
        </div>

        <div className="alerts-filters">
          <label>
            Severity
            <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
              <option value="all">All severities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
            </select>
          </label>
          <label>
            Meter
            <select value={meterId} onChange={(e) => setMeterId(e.target.value)}>
              <option value="all">All meters</option>
              {meters.map((meter) => {
                const id = meter.meter_id ?? meter.meterId ?? meter.id;
                return (
                  <option key={id} value={String(id)}>
                    Meter {id}
                  </option>
                );
              })}
            </select>
          </label>
          <button
            className="alerts-clear"
            onClick={() => {
              setSeverity("all");
              setMeterId("all");
            }}
          >
            Clear filters
          </button>
        </div>

        <div className="alerts-table-wrap">
          <table className="alerts-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Meter</th>
                <th>Date</th>
                <th>Alert type</th>
                <th>Details</th>
                <th>Detection rule</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.map((alert) => (
                <tr key={alert.id}>
                  <td>
                    <span className={`severity-pill severity-${alert.severity}`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td>{alert.meterId}</td>
                  <td>{alert.date}</td>
                  <td>{alert.type}</td>
                  <td>{alert.message}</td>
                  <td>{alert.rule}</td>
                </tr>
              ))}
              {!loading && filteredAlerts.length === 0 && (
                <tr>
                  <td colSpan="6" className="alerts-empty">
                    {error
                      ? "Alerts cannot be derived until readings load successfully."
                      : readings.length === 0
                        ? "No reading data was returned by the API."
                        : "No alerts match the current rules and filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
