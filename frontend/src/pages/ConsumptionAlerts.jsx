import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    Cell,
} from "recharts";
import { AlertTriangle, BellRing, CheckCircle2, Eye, RefreshCw, ScanSearch, ShieldAlert, X } from "lucide-react";

import { getAlert, getAlerts, getAlertSummary, getAnalyticsMeters, runAnomalyDetection, updateAlertStatus } from "../services/api";
import { isAdmin } from "../services/auth";
import { axisProps, chartTooltip, date, dateTime, num, pct, qty, statusClass, statusLabel } from "../utils/format";
import "../styles/operations.css";
import "../styles/gridpulse.css";

const TYPE_LABEL = {
    HIGH_CONSUMPTION: "High consumption",
    LOW_CONSUMPTION: "Low consumption",
    DATA_GAP: "Missing readings",
};

/** Consumption Alerts — explainable anomaly alerts from the backend (GET /api/alerts). */
export default function ConsumptionAlerts() {
    const admin = isAdmin();
    const [params] = useSearchParams();
    const [filters, setFilters] = useState({
        severity: "", status: "", meterId: params.get("meterId") || "", from: "", to: "",
    });
    const [alerts, setAlerts] = useState(null);
    const [summary, setSummary] = useState(null);
    const [meters, setMeters] = useState([]);
    const [error, setError] = useState("");
    const [selectedId, setSelectedId] = useState(params.get("alert") || null);
    const [reloadKey, setReloadKey] = useState(0);
    const [detectMsg, setDetectMsg] = useState("");
    const [detecting, setDetecting] = useState(false);

    useEffect(() => {
        let alive = true;
        getAnalyticsMeters().then((m) => alive && setMeters(m)).catch(() => {});
        return () => {
            alive = false;
        };
    }, []);

    useEffect(() => {
        let alive = true;
        Promise.all([getAlerts({ ...filters, limit: 500 }), getAlertSummary()])
            .then(([rows, s]) => {
                if (!alive) return;
                setAlerts(rows);
                setSummary(s);
                setError("");
            })
            .catch((e) => alive && setError(e.message));
        return () => {
            alive = false;
        };
    }, [filters, reloadKey]);

    const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

    async function detect() {
        setDetecting(true);
        setDetectMsg("");
        try {
            const r = await runAnomalyDetection({});
            setDetectMsg(`Evaluated ${r.days_evaluated} meter-day(s) from ${r.from} to ${r.to}: ${r.alerts_created} new alert(s), ${r.duplicates_skipped} already existed.`);
            setReloadKey((k) => k + 1);
        } catch (e) {
            setDetectMsg(e.message);
        } finally {
            setDetecting(false);
        }
    }

    const sev = summary?.by_severity || {};
    const st = summary?.by_status || {};

    return (
        <main className="operations-page">
            <header className="op-header">
                <div>
                    <div className="op-eyebrow"><BellRing size={14} />GRIDPULSE / CONSUMPTION ALERTS</div>
                    <h1>Consumption Alerts</h1>
                    <p>Explainable, rule-based alerts on daily consumption. An alert is an indicator for investigation — not proof of fraud or equipment failure.</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    {admin && (
                        <button className="op-refresh" onClick={detect} disabled={detecting} title="Re-evaluate the last complete days">
                            <ScanSearch size={16} className={detecting ? "spin" : ""} /> {detecting ? "EVALUATING" : "RUN DETECTION"}
                        </button>
                    )}
                    <button className="op-refresh" onClick={() => setReloadKey((k) => k + 1)}>
                        <RefreshCw size={16} /> REFRESH
                    </button>
                </div>
            </header>

            {detectMsg && <div className="gp-success" style={{ margin: "0 0 16px" }}>{detectMsg}</div>}
            {error && <div className="op-error">{error}</div>}

            <div className="gp-kpis">
                <Stat label="Active (not resolved)" value={summary ? summary.active : "—"} icon={BellRing} />
                <Stat label="High severity" value={sev.HIGH ?? 0} icon={ShieldAlert} />
                <Stat label="Moderate / low" value={`${sev.MODERATE ?? 0} / ${sev.LOW ?? 0}`} icon={AlertTriangle} />
                <Stat label="New · reviewed · resolved" value={`${st.NEW ?? 0} · ${st.REVIEWED ?? 0} · ${st.RESOLVED ?? 0}`} icon={CheckCircle2} />
            </div>

            <section className="op-panel">
                <div className="gp-filters">
                    <label className="gp-field"><span>Severity</span>
                        <select value={filters.severity} onChange={set("severity")}>
                            <option value="">All</option><option>HIGH</option><option>MODERATE</option><option>LOW</option>
                        </select>
                    </label>
                    <label className="gp-field"><span>Status</span>
                        <select value={filters.status} onChange={set("status")}>
                            <option value="">All</option><option>NEW</option><option>REVIEWED</option><option>RESOLVED</option>
                        </select>
                    </label>
                    <label className="gp-field"><span>Meter</span>
                        <select value={filters.meterId} onChange={set("meterId")}>
                            <option value="">All meters</option>
                            {meters.map((m) => <option key={m.meter_id} value={m.meter_id}>{m.meter_id} · {m.service_type}</option>)}
                        </select>
                    </label>
                    <label className="gp-field"><span>Reading date from</span><input type="date" value={filters.from} onChange={set("from")} /></label>
                    <label className="gp-field"><span>to</span><input type="date" value={filters.to} onChange={set("to")} /></label>
                    <button className="gp-btn" onClick={() => setFilters({ severity: "", status: "", meterId: "", from: "", to: "" })}>CLEAR</button>
                </div>

                {!alerts ? (
                    <div className="op-loading"><RefreshCw className="spin" size={18} /> Loading alerts…</div>
                ) : alerts.length === 0 ? (
                    <div className="op-empty">No alerts match these filters.</div>
                ) : (
                    <div className="op-table-wrap">
                        <table className="op-table">
                            <thead>
                                <tr>
                                    <th>Alert</th><th>Meter</th><th>Customer / property</th><th>Reading day</th>
                                    <th>Observed</th><th>Historical avg</th><th>Deviation</th><th>Type</th>
                                    <th>Severity</th><th>Status</th><th>Created</th><th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {alerts.map((a) => (
                                    <tr key={a.alert_id} className="gp-row-click" onClick={() => setSelectedId(a.alert_id)}>
                                        <td><b>#{a.alert_id}</b></td>
                                        <td>{a.meter_id}</td>
                                        <td>{a.owner_names || "—"}<br /><small style={{ color: "#526b6e" }}>{a.property_name || ""}</small></td>
                                        <td>{date(a.observation_start)}</td>
                                        <td>{qty(a.observed_consumption, a.unit, 2)}</td>
                                        <td>{qty(a.baseline_average, a.unit, 2)}</td>
                                        <td>{pct(a.deviation_pct)}</td>
                                        <td>{TYPE_LABEL[a.alert_type] || a.alert_type}</td>
                                        <td><span className={`op-badge ${statusClass(a.severity)}`}>{a.severity}</span></td>
                                        <td><span className={`op-badge ${statusClass(a.status)}`}>{a.status}</span></td>
                                        <td>{dateTime(a.created_at)}</td>
                                        <td><Eye size={15} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {selectedId && (
                <AlertDetail
                    id={selectedId}
                    admin={admin}
                    onClose={() => setSelectedId(null)}
                    onChanged={() => setReloadKey((k) => k + 1)}
                />
            )}
        </main>
    );
}

function AlertDetail({ id, admin, onClose, onChanged }) {
    const [alert, setAlert] = useState(null);
    const [error, setError] = useState("");
    const [note, setNote] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let alive = true;
        getAlert(id).then((a) => alive && setAlert(a)).catch((e) => alive && setError(e.message));
        return () => {
            alive = false;
        };
    }, [id]);

    async function change(status) {
        setBusy(true);
        setError("");
        try {
            const updated = await updateAlertStatus(id, status, note.trim() || undefined);
            setAlert((a) => ({ ...a, ...updated }));
            setNote("");
            onChanged();
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    }

    const series = (alert?.series || []).map((p) => ({
        day: p.date.slice(5),
        consumption: p.consumption,
        role: p.role,
    }));

    return (
        <div className="gp-backdrop" onClick={onClose}>
            <div className="gp-modal" onClick={(e) => e.stopPropagation()}>
                <div className="gp-modal-head">
                    <div>
                        <span className="op-eyebrow">ALERT #{id} · METER {alert?.meter_id ?? ""}</span>
                        <h2>{alert ? (TYPE_LABEL[alert.alert_type] || alert.alert_type) : "Loading…"}</h2>
                        {alert && (
                            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                                <span className={`op-badge ${statusClass(alert.severity)}`}>{alert.severity}</span>
                                <span className={`op-badge ${statusClass(alert.status)}`}>{alert.status}</span>
                                <span className="op-badge">{alert.rule_version}</span>
                            </div>
                        )}
                    </div>
                    <button className="gp-btn" onClick={onClose} aria-label="Close"><X size={15} /></button>
                </div>

                {error && <div className="op-error" style={{ margin: 16 }}>{error}</div>}
                {alert && (
                    <div className="gp-panel-body">
                        <div className="gp-chart">
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={series}>
                                    <CartesianGrid stroke="rgba(178,208,212,.06)" vertical={false} />
                                    <XAxis dataKey="day" {...axisProps} minTickGap={12} />
                                    <YAxis {...axisProps} width={50} />
                                    <Tooltip {...chartTooltip} formatter={(v, n, item) => [`${num(v, 3)} ${alert.unit}`, statusLabel(item.payload.role)]} />
                                    {alert.baseline_average !== null && (
                                        <ReferenceLine y={Number(alert.baseline_average)} stroke="#e5bd66" strokeDasharray="4 4"
                                            label={{ value: "baseline", fill: "#e5bd66", fontSize: 10, position: "insideTopRight" }} />
                                    )}
                                    <Bar dataKey="consumption" radius={[2, 2, 0, 0]}>
                                        {series.map((p) => (
                                            <Cell key={p.day} fill={p.role === "OBSERVED" ? "#ef8a80" : p.role === "AFTER" ? "#2b4a4c" : "#377B72"} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            <p className="gp-note" style={{ paddingLeft: 12 }}>
                                Teal: {alert.baseline_window_days}-day baseline window · red: observed day · grey: days after · dashed: trimmed baseline average.
                            </p>
                        </div>

                        <div className="gp-grid-2">
                            <div className="gp-kv" style={{ alignContent: "start" }}>
                                <span>Reading day</span><b>{date(alert.observation_start)}</b>
                                <span>Observed consumption</span><b>{qty(alert.observed_consumption, alert.unit, 3)}</b>
                                <span>Historical average</span><b>{qty(alert.baseline_average, alert.unit, 3)}</b>
                                <span>Deviation</span><b>{pct(alert.deviation_pct)}</b>
                                <span>Baseline</span><b>{alert.baseline_days ? `${alert.baseline_days} days, ${date(alert.baseline_start)} – ${date(alert.baseline_end)}` : "—"}</b>
                                <span>Customer / property</span><b>{alert.owner_names || "—"} · {alert.property_name || "—"}</b>
                                <span>Created</span><b>{dateTime(alert.created_at)}</b>
                                <span>Reviewed</span><b>{alert.reviewed_at ? `${dateTime(alert.reviewed_at)} by ${alert.reviewed_by}` : "—"}</b>
                                <span>Resolved</span><b>{alert.resolved_at ? `${dateTime(alert.resolved_at)} by ${alert.resolved_by}` : "—"}</b>
                            </div>
                            <div>
                                <h4 style={{ margin: "12px 0 6px", fontSize: 13 }}>Explanation</h4>
                                <p className="gp-note">{alert.explanation}</p>
                                <h4 style={{ margin: "12px 0 6px", fontSize: 13 }}>Recommended action</h4>
                                <p className="gp-note">{alert.recommended_action}</p>
                                {alert.status_note && <p className="gp-note">Note: <b>{alert.status_note}</b></p>}
                                <div className="gp-disclaimer">{alert.disclaimer}</div>
                            </div>
                        </div>

                        {alert.status !== "RESOLVED" && (
                            <div style={{ marginTop: 16 }}>
                                <textarea className="gp-textarea" placeholder="Optional note (what was checked, outcome…)" value={note}
                                    onChange={(e) => setNote(e.target.value)} maxLength={1000} disabled={busy} />
                                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10, flexWrap: "wrap" }}>
                                    <Link className="gp-btn" to={`/analytics?meterId=${alert.meter_id}&interval=day`}>OPEN IN ANALYTICS</Link>
                                    {alert.status === "NEW" && (
                                        <button className="gp-btn" disabled={busy} onClick={() => change("REVIEWED")}>MARK REVIEWED</button>
                                    )}
                                    {admin ? (
                                        <button className="gp-btn primary" disabled={busy} onClick={() => change("RESOLVED")}>RESOLVE</button>
                                    ) : (
                                        <span className="gp-note" style={{ alignSelf: "center" }}>Resolving requires an administrator.</span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function Stat({ label, value, icon: Icon }) {
    return (
        <div className="op-stat">
            <div className="op-stat-top"><span>{label}</span><Icon size={17} /></div>
            <strong>{value}</strong>
        </div>
    );
}
