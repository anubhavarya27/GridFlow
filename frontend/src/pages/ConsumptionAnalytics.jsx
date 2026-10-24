import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
} from "recharts";
import { Activity, BarChart3, Download, Gauge, RefreshCw, TrendingUp } from "lucide-react";

import { getAnalyticsMeters, getConsumptionComparison, getConsumptionSeries, getIntervalReadings } from "../services/api";
import {
    addDays,
    axisProps,
    chartTooltip,
    dateTime,
    downloadCsv,
    num,
    pct,
    qty,
    statusClass,
    todayIst,
} from "../utils/format";
import "../styles/operations.css";
import "../styles/gridpulse.css";

const INTERVALS = [
    { value: "hour", label: "Hourly", days: 2 },
    { value: "day", label: "Daily", days: 30 },
    { value: "week", label: "Weekly", days: 84 },
    { value: "month", label: "Monthly", days: 365 },
];
const PAGE = 50;

/**
 * Consumption Analytics — historical consumption per meter or per utility service,
 * from the TimescaleDB continuous aggregates (GET /api/analytics/*).
 */
export default function ConsumptionAnalytics() {
    const [params, setParams] = useSearchParams();
    const [meters, setMeters] = useState([]);
    const [selection, setSelection] = useState(params.get("meterId") ? `m:${params.get("meterId")}` : "");
    const [interval, setIntervalValue] = useState(params.get("interval") || "day");
    const [to, setTo] = useState(params.get("to") || todayIst());
    const [from, setFrom] = useState(params.get("from") || addDays(todayIst(), -29));
    const [series, setSeries] = useState(null);
    const [comparison, setComparison] = useState(null);
    const [readings, setReadings] = useState(null);
    const [page, setPage] = useState(0);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let alive = true;
        getAnalyticsMeters()
            .then((rows) => {
                if (!alive) return;
                setMeters(rows);
                setSelection((cur) => cur || (rows[0] ? `m:${rows[0].meter_id}` : "s:ELECTRICITY"));
            })
            .catch((e) => alive && setError(e.message));
        return () => {
            alive = false;
        };
    }, []);

    const filter = useMemo(() => {
        if (selection.startsWith("m:")) return { meterId: selection.slice(2) };
        if (selection.startsWith("s:")) return { serviceType: selection.slice(2) };
        return null;
    }, [selection]);

    useEffect(() => {
        if (!filter) return undefined;
        let alive = true;
        Promise.all([
            getConsumptionSeries({ ...filter, from, to, interval }),
            getConsumptionComparison({ ...filter, from, to }),
        ])
            .then(([s, c]) => {
                if (!alive) return;
                setSeries(s);
                setComparison(c);
                setError("");
                setLoading(false);
            })
            .catch((e) => {
                if (!alive) return;
                setError(e.message);
                setSeries(null);
                setComparison(null);
                setLoading(false);
            });
        return () => {
            alive = false;
        };
    }, [filter, from, to, interval, reloadKey]);

    useEffect(() => {
        if (!filter?.meterId) return undefined;
        let alive = true;
        getIntervalReadings({ meterId: filter.meterId, from, to, limit: PAGE, offset: page * PAGE })
            .then((r) => alive && setReadings(r))
            .catch(() => alive && setReadings(null));
        return () => {
            alive = false;
        };
    }, [filter, from, to, page, reloadKey]);

    function update(next) {
        setLoading(true);
        setPage(0);
        const merged = { selection, interval, from, to, ...next };
        if (next.selection !== undefined) {
            setSelection(next.selection);
            setReadings(null);
        }
        if (next.interval !== undefined) setIntervalValue(next.interval);
        if (next.from !== undefined) setFrom(next.from);
        if (next.to !== undefined) setTo(next.to);
        const p = { interval: merged.interval, from: merged.from, to: merged.to };
        if (merged.selection.startsWith("m:")) p.meterId = merged.selection.slice(2);
        setParams(p, { replace: true });
    }

    function changeInterval(value) {
        const preset = INTERVALS.find((i) => i.value === value);
        update({ interval: value, from: addDays(to, -(preset.days - 1)) });
    }

    const unit = series?.unit || "";
    const chartData = (series?.series || []).map((p) => ({ label: p.label, consumption: p.consumption, missing: p.missing }));
    const summary = series?.summary;
    const missing = chartData.filter((p) => p.missing).length;
    const meterLabel = (m) => `${m.meter_id} · ${m.service_type} (${m.unit}) · ${m.property_name || "—"}`;
    const selectedMeter = meters.find((m) => `m:${m.meter_id}` === selection);

    function exportCsv() {
        if (!series) return;
        downloadCsv(
            `gridpulse-consumption-${filter.meterId || filter.serviceType}-${interval}-${from}-${to}.csv`,
            ["period_start", "label", `consumption_${unit}`, "reading_count", "missing"],
            series.series.map((p) => [p.period_start, p.label, p.consumption ?? "", p.reading_count, p.missing])
        );
    }

    return (
        <main className="operations-page">
            <header className="op-header">
                <div>
                    <div className="op-eyebrow"><Activity size={14} />GRIDPULSE / CONSUMPTION ANALYTICS</div>
                    <h1>Consumption Analytics</h1>
                    <p>Interval consumption from smart-meter readings, aggregated by TimescaleDB continuous aggregates.</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button className="op-refresh" onClick={exportCsv} disabled={!series}>
                        <Download size={16} /> EXPORT CSV
                    </button>
                    <button className="op-refresh" onClick={() => { setLoading(true); setReloadKey((k) => k + 1); }}>
                        <RefreshCw size={16} className={loading ? "spin" : ""} /> REFRESH
                    </button>
                </div>
            </header>

            <section className="op-panel">
                <div className="gp-filters">
                    <label className="gp-field" style={{ minWidth: 280 }}>
                        <span>Meter / utility service</span>
                        <select value={selection} onChange={(e) => update({ selection: e.target.value })}>
                            <optgroup label="All meters of a service">
                                <option value="s:ELECTRICITY">All electricity meters (kWh)</option>
                                <option value="s:WATER">All water meters (kL)</option>
                            </optgroup>
                            <optgroup label="Single meter">
                                {meters.map((m) => (
                                    <option key={m.meter_id} value={`m:${m.meter_id}`}>{meterLabel(m)}</option>
                                ))}
                            </optgroup>
                        </select>
                    </label>
                    <label className="gp-field">
                        <span>Aggregation</span>
                        <select value={interval} onChange={(e) => changeInterval(e.target.value)}>
                            {INTERVALS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
                        </select>
                    </label>
                    <label className="gp-field">
                        <span>From</span>
                        <input type="date" value={from} max={to} onChange={(e) => e.target.value && update({ from: e.target.value })} />
                    </label>
                    <label className="gp-field">
                        <span>To</span>
                        <input type="date" value={to} min={from} max={todayIst()} onChange={(e) => e.target.value && update({ to: e.target.value })} />
                    </label>
                    {selectedMeter && (
                        <span className="gp-note">Owner: <b>{selectedMeter.owner_names || "—"}</b></span>
                    )}
                </div>
            </section>

            {error && <div className="op-error">{error}</div>}

            <div className="gp-kpis">
                <Kpi label="Total consumption" icon={Gauge} value={qty(summary?.total_consumption, unit, 2)}
                    sub={series ? `${series.from} → ${series.to}` : ""} />
                <Kpi label={`Average per ${interval}`} icon={BarChart3} value={qty(summary?.average_per_interval, unit, 3)}
                    sub={summary ? `${summary.intervals_with_data} of ${summary.intervals_in_range} intervals with data` : ""} />
                <Kpi label="Peak interval" icon={TrendingUp} value={qty(summary?.peak?.consumption, unit, 3)}
                    sub={summary?.peak?.label || "—"} />
                <Kpi label="vs previous period" icon={Activity} value={pct(comparison?.change_pct)}
                    sub={comparison ? `${comparison.previous.from} → ${comparison.previous.to}` : ""} />
            </div>

            <section className="op-panel">
                <div className="op-panel-head">
                    <h3>Consumption · {unit} per {interval}</h3>
                    <span>SOURCE {String(series?.source || "").toUpperCase()} · {missing ? `${missing} INTERVAL(S) WITHOUT READINGS (GAPS)` : "NO GAPS"}</span>
                </div>
                {loading && !series ? (
                    <div className="op-loading"><RefreshCw className="spin" size={18} /> Loading consumption…</div>
                ) : !summary || summary.intervals_with_data === 0 ? (
                    <div className="op-empty">No readings in this range.</div>
                ) : (
                    <div className="gp-chart">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid stroke="rgba(178,208,212,.06)" vertical={false} />
                                <XAxis dataKey="label" {...axisProps} minTickGap={24} />
                                <YAxis {...axisProps} width={56} />
                                <Tooltip {...chartTooltip} formatter={(v) => [v === null ? "no readings" : `${num(v, 3)} ${unit}`, "Consumption"]} />
                                <Line type="monotone" dataKey="consumption" stroke="#5FD0BE" strokeWidth={2} dot={chartData.length < 40} connectNulls={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </section>

            <div className="gp-grid-2">
                <section className="op-panel">
                    <div className="op-panel-head">
                        <h3>Current vs previous period</h3>
                        <span>EQUAL-LENGTH PERIOD IMMEDIATELY BEFORE · DAILY AGGREGATE</span>
                    </div>
                    {comparison ? (
                        <div className="gp-chart">
                            <ResponsiveContainer width="100%" height={210}>
                                <BarChart data={[
                                    { name: `Previous (${comparison.previous.from} → ${comparison.previous.to})`, value: comparison.previous.total_consumption },
                                    { name: `Current (${comparison.current.from} → ${comparison.current.to})`, value: comparison.current.total_consumption },
                                ]}>
                                    <CartesianGrid stroke="rgba(178,208,212,.06)" vertical={false} />
                                    <XAxis dataKey="name" {...axisProps} />
                                    <YAxis {...axisProps} width={56} />
                                    <Tooltip {...chartTooltip} formatter={(v) => [`${num(v)} ${unit}`, "Consumption"]} />
                                    <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                                        <Cell fill="#2c5f5b" />
                                        <Cell fill="#5FD0BE" />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            {!comparison.comparable && (
                                <p className="gp-note" style={{ padding: "0 17px" }}>
                                    Not every day of both periods has readings; the comparison is indicative only.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="op-empty">—</div>
                    )}
                </section>

                <section className="op-panel">
                    <div className="op-panel-head">
                        <h3>How these numbers are computed</h3>
                        <span>SEMANTICS</span>
                    </div>
                    <div className="gp-panel-body gp-note">
                        <p>Meters report a <b>cumulative register</b>. Each reading stores the delta from the previous
                            reading; analytics <b>sum those deltas</b>, never the register values.</p>
                        <p>Periods are local time (Asia/Kolkata). A reading counts toward the period of its timestamp
                            (interval-ending convention).</p>
                        <p>Electricity is measured in <b>kWh</b>, water in <b>kL</b>; they are never added together.</p>
                        <p>Intervals without readings are shown as gaps, not as zero.</p>
                    </div>
                </section>
            </div>

            <section className="op-panel">
                <div className="op-panel-head">
                    <h3>Historical meter readings</h3>
                    <span>RAW HYPERTABLE ROWS · NEWEST FIRST {readings ? `· ${num(readings.total, 0)} READINGS IN RANGE` : ""}</span>
                </div>
                {!filter?.meterId ? (
                    <div className="op-empty">Select a single meter to see its readings.</div>
                ) : !readings ? (
                    <div className="op-loading">Loading readings…</div>
                ) : readings.rows.length === 0 ? (
                    <div className="op-empty">No readings in this range.</div>
                ) : (
                    <>
                        <div className="op-table-wrap">
                            <table className="op-table">
                                <thead>
                                    <tr>
                                        <th>Reading time (IST)</th><th>Register</th><th>Interval consumption</th>
                                        <th>Interval</th><th>Quality</th><th>Reset</th><th>Source</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {readings.rows.map((r) => (
                                        <tr key={r.reading_time}>
                                            <td>{dateTime(r.reading_time)}</td>
                                            <td><b>{num(r.register_value, 3)}</b></td>
                                            <td>{qty(r.interval_consumption, unit, 3)}</td>
                                            <td>{r.interval_minutes ? `${r.interval_minutes} min` : "first"}</td>
                                            <td><span className={`op-badge ${statusClass(r.reading_quality === "Valid" ? "ok" : "moderate")}`}>{r.reading_quality}</span></td>
                                            <td>{r.register_reset ? "yes" : "—"}</td>
                                            <td>{r.data_source}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="gp-pager">
                            <span>{page * PAGE + 1}–{Math.min((page + 1) * PAGE, readings.total)} of {num(readings.total, 0)}</span>
                            <span style={{ display: "flex", gap: 8 }}>
                                <button className="gp-btn" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>NEWER</button>
                                <button className="gp-btn" disabled={(page + 1) * PAGE >= readings.total} onClick={() => setPage((p) => p + 1)}>OLDER</button>
                            </span>
                        </div>
                    </>
                )}
            </section>
        </main>
    );
}

function Kpi({ label, value, icon: Icon, sub }) {
    return (
        <div className="op-stat">
            <div className="op-stat-top"><span>{label}</span><Icon size={17} /></div>
            <strong>{value}</strong>
            {sub && <small>{sub}</small>}
        </div>
    );
}
