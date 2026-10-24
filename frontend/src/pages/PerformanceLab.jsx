import { useEffect, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { Database, FlaskConical, Play, RefreshCw, Server, Timer } from "lucide-react";

import { getBenchmarkSummary, runBenchmark } from "../services/api";
import { isAdmin } from "../services/auth";
import { axisProps, chartTooltip, dateTime, num, statusClass, statusLabel } from "../utils/format";
import "../styles/operations.css";
import "../styles/gridpulse.css";

const METHOD_LABEL = {
    PG_RAW: "PostgreSQL + TimescaleDB · raw hypertable",
    PG_CAGG: "PostgreSQL + TimescaleDB · continuous aggregate",
    MYSQL_RAW: "MySQL (legacy U/BILL) · raw table",
};
const METHOD_COLOR = { PG_RAW: "#377B72", PG_CAGG: "#5FD0BE", MYSQL_RAW: "#8fa9c4" };

const bytes = (b) => (b === null || b === undefined ? "—" : `${num(b / (1024 * 1024), 1)} MB`);

/**
 * Database Performance Lab.  Every number shown here comes from the backend's
 * runtime measurements (POST /api/benchmark/run); nothing is hard-coded.
 */
export default function PerformanceLab() {
    const admin = isAdmin();
    const [summary, setSummary] = useState(null);
    const [run, setRun] = useState(null);
    const [error, setError] = useState("");
    const [running, setRunning] = useState(false);
    const [repetitions, setRepetitions] = useState(10);
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let alive = true;
        getBenchmarkSummary()
            .then((s) => {
                if (!alive) return;
                setSummary(s);
                setError("");
            })
            .catch((e) => alive && setError(e.message));
        return () => {
            alive = false;
        };
    }, [reloadKey]);

    async function start() {
        setRunning(true);
        setError("");
        try {
            setRun(await runBenchmark(Number(repetitions)));
            setReloadKey((k) => k + 1);
        } catch (e) {
            setError(e.message);
        } finally {
            setRunning(false);
        }
    }

    const env = summary?.environment;
    const latest = run
        ? { ...run, results: { workloads: run.workloads, range: run.range }, environment: run.environment }
        : summary?.latest_run;
    const workloads = latest?.results?.workloads || [];

    return (
        <main className="operations-page">
            <header className="op-header">
                <div>
                    <div className="op-eyebrow"><FlaskConical size={14} />GRIDPULSE / DATABASE PERFORMANCE LAB</div>
                    <h1>Database Performance Lab</h1>
                    <p>Measured comparison of consumption aggregation: raw hypertable vs TimescaleDB continuous aggregate, and the legacy MySQL database.</p>
                </div>
                <button className="op-refresh" onClick={() => setReloadKey((k) => k + 1)}>
                    <RefreshCw size={16} /> REFRESH STATUS
                </button>
            </header>

            {error && <div className="op-error">{error}</div>}

            <div className="gp-grid-2">
                <section className="op-panel">
                    <div className="op-panel-head"><h3><Server size={14} style={{ verticalAlign: -2 }} /> New database · PostgreSQL + TimescaleDB</h3><span>LIVE STATUS</span></div>
                    {!env ? <div className="op-loading">Reading database metadata…</div> : (
                        <div className="gp-panel-body gp-kv" style={{ marginTop: 0 }}>
                            <span>Connection</span><b><span className={`op-badge ${statusClass(env.postgres.status)}`}>{statusLabel(env.postgres.status)}</span></b>
                            <span>Version</span><b className="gp-mono" style={{ fontSize: 10 }}>{(env.postgres.version || "—").split(" on ")[0]}</b>
                            <span>TimescaleDB</span><b>{env.postgres.timescaledb_version || <span className="op-badge timescaledb_not_installed">not installed</span>}</b>
                            <span>Hypertable chunks · size</span><b>{env.postgres.hypertable?.is_hypertable ? `${env.postgres.hypertable.chunks} · ${bytes(env.postgres.hypertable.total_bytes)}` : "—"}</b>
                            <span>Interval readings (all · in range)</span><b>{num(env.postgres.interval_rows, 0)} · {num(env.postgres.range_rows, 0)}</b>
                            <span>Continuous aggregate</span><b><span className={`op-badge ${statusClass(env.postgres.cagg_status)}`}>{statusLabel(env.postgres.cagg_status)}</span></b>
                            <span>Materialized through</span><b>{dateTime(env.postgres.cagg_materialized_through)}</b>
                        </div>
                    )}
                    {env?.postgres?.cagg_message && env.postgres.cagg_status !== "READY" && (
                        <p className="gp-note" style={{ padding: "0 17px 14px" }}>{env.postgres.cagg_message}</p>
                    )}
                </section>

                <section className="op-panel">
                    <div className="op-panel-head"><h3><Database size={14} style={{ verticalAlign: -2 }} /> Old database · MySQL (U/BILL)</h3><span>LIVE STATUS</span></div>
                    {!env ? <div className="op-loading">Reading database metadata…</div> : (
                        <div className="gp-panel-body gp-kv" style={{ marginTop: 0 }}>
                            <span>Connection</span><b><span className={`op-badge ${statusClass(env.mysql.status)}`}>{statusLabel(env.mysql.status)}</span></b>
                            <span>Version</span><b>{env.mysql.version || "—"}</b>
                            <span>Database</span><b>{env.mysql.database || "—"}</b>
                            <span>Interval readings (all · in range)</span><b>{num(env.mysql.interval_rows, 0)} · {num(env.mysql.range_rows, 0)}</b>
                            <span>Data · index size</span><b>{bytes(env.mysql.data_bytes)} · {bytes(env.mysql.index_bytes)}</b>
                            <span>Same dataset as PostgreSQL</span><b>{env.dataset_comparable ? "yes" : <span className="op-badge comparison_unavailable">comparison unavailable</span>}</b>
                        </div>
                    )}
                    {env && (env.mysql.message || !env.dataset_comparable) && (
                        <p className="gp-note" style={{ padding: "0 17px 14px" }}>{env.mysql.message || env.dataset_note}</p>
                    )}
                </section>
            </div>

            <section className="op-panel">
                <div className="op-panel-head"><h3><Timer size={14} style={{ verticalAlign: -2 }} /> Run benchmark</h3>
                    <span>{summary?.range ? `RANGE ${summary.range.start} → ${summary.range.end_exclusive} (${summary.range.days} DAYS, ${summary.range.timezone})` : "NO DATA RANGE"}</span>
                </div>
                <div className="gp-inline-form">
                    <label className="gp-field" style={{ minWidth: 120 }}>
                        <span>Timed repetitions</span>
                        <input type="number" min={3} max={30} value={repetitions} onChange={(e) => setRepetitions(e.target.value)} disabled={!admin || running} />
                    </label>
                    <button className="gp-btn primary" onClick={start} disabled={!admin || running || summary?.running}>
                        <Play size={14} /> {running ? "MEASURING…" : "RUN MEASUREMENT"}
                    </button>
                    {!admin && <span className="gp-note">Only administrators can start a benchmark run.</span>}
                    <span className="gp-note">Runs the fixed workloads in database/benchmark/ on the server. No SQL is accepted from the browser.</span>
                </div>
            </section>

            {!latest ? (
                <section className="op-panel"><div className="op-empty">No benchmark has been run yet.</div></section>
            ) : (
                <>
                    <p className="gp-note" style={{ marginBottom: 12 }}>
                        Showing run <b>#{latest.run_id ?? "—"}</b> · status <span className={`op-badge ${statusClass(latest.status)}`}>{statusLabel(latest.status)}</span>
                        {" "}· {latest.repetitions} timed run(s) + {latest.warmup_runs} warm-up per method · started {dateTime(latest.started_at)}
                    </p>
                    {workloads.map((w) => <Workload key={w.workload} w={w} />)}
                </>
            )}

            <section className="op-panel">
                <div className="op-panel-head"><h3>Methodology</h3><span>READ BEFORE INTERPRETING RESULTS</span></div>
                <ul className="gp-panel-body gp-note" style={{ margin: 0, paddingLeft: 32 }}>
                    {(summary?.methodology || []).map((m) => <li key={m} style={{ marginBottom: 6 }}>{m}</li>)}
                </ul>
            </section>
        </main>
    );
}

function Workload({ w }) {
    const measured = w.methods.filter((m) => m.stats);
    const chart = measured.map((m) => ({ method: m.method, median: m.stats.median_ms }));
    return (
        <section className="op-panel">
            <div className="op-panel-head"><h3>Workload · {w.workload}</h3><span>{w.description?.toUpperCase()}</span></div>
            <div className="op-table-wrap">
                <table className="op-table">
                    <thead>
                        <tr><th>Method</th><th>Status</th><th>Median</th><th>Mean</th><th>Min</th><th>Max</th><th>p95</th>
                            <th>Samples</th><th>Rows</th><th>Equivalent to PG raw</th><th>DB execution (EXPLAIN)</th></tr>
                    </thead>
                    <tbody>
                        {w.methods.map((m) => (
                            <tr key={m.method}>
                                <td><b>{METHOD_LABEL[m.method] || m.method}</b>{m.engine && m.engine.includes("TEST MODE") && <><br /><small style={{ color: "#e5bd66" }}>{m.engine}</small></>}</td>
                                <td><span className={`op-badge ${statusClass(m.status)}`}>{statusLabel(m.status)}</span></td>
                                <td>{m.stats ? `${num(m.stats.median_ms, 3)} ms` : "—"}</td>
                                <td>{m.stats ? `${num(m.stats.mean_ms, 3)} ms` : "—"}</td>
                                <td>{m.stats ? `${num(m.stats.min_ms, 3)} ms` : "—"}</td>
                                <td>{m.stats ? `${num(m.stats.max_ms, 3)} ms` : "—"}</td>
                                <td>{m.stats ? `${num(m.stats.p95_ms, 3)} ms` : "—"}</td>
                                <td>{m.stats ? m.stats.samples : "—"}</td>
                                <td>{m.result_rows ?? "—"}</td>
                                <td>{m.method === "PG_RAW" ? (m.stats ? "baseline" : "—")
                                    : m.equivalence ? (m.equivalence.equivalent ? "yes" : `NO (${m.equivalence.mismatch_count} mismatches)`) : "—"}</td>
                                <td>{m.plan?.execution_ms !== undefined ? `${num(m.plan.execution_ms, 3)} ms` : m.plan?.text ? "see plan" : "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {w.methods.filter((m) => !m.stats && m.reason).map((m) => (
                <p key={m.method} className="gp-note" style={{ padding: "8px 17px 0" }}><b>{m.method}:</b> {m.reason}</p>
            ))}

            <div className="gp-grid-2" style={{ padding: "8px 17px 14px" }}>
                <div>
                    {chart.length > 0 ? (
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={chart} layout="vertical">
                                <CartesianGrid stroke="rgba(178,208,212,.06)" horizontal={false} />
                                <XAxis type="number" {...axisProps} unit=" ms" />
                                <YAxis type="category" dataKey="method" {...axisProps} width={90} />
                                <Tooltip {...chartTooltip} formatter={(v) => [`${num(v, 3)} ms`, "Median (measured)"]} />
                                <Bar dataKey="median" radius={[0, 3, 3, 0]}>
                                    {chart.map((c) => <Cell key={c.method} fill={METHOD_COLOR[c.method]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <div className="op-empty">Nothing was measured for this workload.</div>}
                </div>
                <div>
                    <h4 style={{ margin: "6px 0 8px", fontSize: 13 }}>Comparisons</h4>
                    {w.comparisons.map((c) => (
                        <div key={`${c.baseline}-${c.candidate}`} className="gp-note" style={{ marginBottom: 8 }}>
                            <b>{c.candidate}</b> vs <b>{c.baseline}</b>:{" "}
                            {c.valid
                                ? <>median {num(c.candidate_median_ms, 3)} ms vs {num(c.baseline_median_ms, 3)} ms → <b>×{num(c.speedup, 2)}</b> ({num(c.latency_reduction_pct, 1)}% lower latency); faster: {c.faster}</>
                                : <span style={{ color: "#c9a96b" }}>not reported — {c.reason}</span>}
                        </div>
                    ))}
                </div>
            </div>

            {w.methods.filter((m) => m.sql).map((m) => (
                <details key={m.method} className="gp-details" style={{ padding: "0 17px 10px" }}>
                    <summary>{m.method} · QUERY ({m.query_file}) AND PLAN</summary>
                    <pre className="gp-pre">{m.sql}</pre>
                    {m.plan?.text && <><p className="gp-note">{m.plan.format} — executed once, separately from the timed runs:</p><pre className="gp-pre">{m.plan.text}</pre></>}
                    {m.plan?.error && <p className="gp-note">Plan unavailable: {m.plan.error}</p>}
                </details>
            ))}
        </section>
    );
}
