import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Activity, X } from "lucide-react";

import { getMeterInsights } from "../services/api";
import { axisProps, chartTooltip, date, dateTime, num, pct, qty, statusClass } from "../utils/format";
import ProjectedBillPanel from "./ProjectedBillPanel";
import "../styles/gridpulse.css";

/** Meter Monitor detail (GET /api/meters/{id}/insights). */
export default function MeterInsightsPanel({ meterId, onClose }) {
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let alive = true;
        getMeterInsights(meterId)
            .then((d) => {
                if (!alive) return;
                setData(d);
                setError("");
            })
            .catch((e) => alive && setError(e.message));
        return () => {
            alive = false;
        };
    }, [meterId]);

    const meter = data?.meter;
    const unit = meter?.unit;
    const daily = (data?.daily_last_30_days?.series || []).map((p) => ({ label: p.label.slice(0, 6), consumption: p.consumption }));
    const alert = data?.latest_alert;

    return (
        <section className="op-panel">
            <div className="op-panel-head" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                    <h3>Meter {meterId} · {meter ? `${meter.service_type} (${unit})` : "…"}</h3>
                    <span>{meter ? `${meter.property_name || "—"} · ${meter.owner_names || "—"} · LATEST READING ${dateTime(meter.latest_reading_time)}` : "LOADING"}</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <Link className="gp-btn" to={`/analytics?meterId=${meterId}&interval=day`}><Activity size={13} /> CONSUMPTION ANALYTICS</Link>
                    <button className="gp-btn" onClick={onClose} aria-label="Close"><X size={14} /></button>
                </div>
            </div>
            {error && <div className="op-error" style={{ margin: 16 }}>{error}</div>}
            {!data && !error && <div className="op-loading">Loading meter details…</div>}
            {data && (
                <>
                    <div className="op-stats" style={{ padding: "14px 17px 0" }}>
                        <div className="op-stat">
                            <div className="op-stat-top"><span>Current period</span></div>
                            <strong>{qty(data.current_period.consumption_to_date, unit, 1)}</strong>
                            <small>since {date(data.current_period.start)}</small>
                        </div>
                        <div className="op-stat">
                            <div className="op-stat-top"><span>Last 30 days</span></div>
                            <strong>{qty(data.daily_last_30_days.summary.total_consumption, unit, 1)}</strong>
                            <small>avg {qty(data.daily_last_30_days.summary.average_per_interval, unit, 2)}/day</small>
                        </div>
                        <div className="op-stat">
                            <div className="op-stat-top"><span>Latest alert</span></div>
                            <strong style={{ fontSize: 16 }}>
                                {alert ? <span className={`op-badge ${statusClass(alert.severity)}`}>{alert.severity}</span> : "none"}
                                {alert && <> <span className={`op-badge ${statusClass(alert.status)}`}>{alert.status}</span></>}
                            </strong>
                            <small>{alert ? `${date(alert.observation_start)} · ${pct(alert.deviation_pct)}` : "no alerts for this meter"}</small>
                        </div>
                        <div className="op-stat">
                            <div className="op-stat-top"><span>Status · capacity</span></div>
                            <strong style={{ fontSize: 18 }}>{meter.meter_status}</strong>
                            <small>capacity {num(meter.capacity)}</small>
                        </div>
                    </div>

                    <div className="gp-grid-2" style={{ padding: "0 17px" }}>
                        <div>
                            <div className="gp-chart">
                                <ResponsiveContainer width="100%" height={210}>
                                    <AreaChart data={daily}>
                                        <defs>
                                            <linearGradient id={`mtr-${meterId}`} x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#5FD0BE" stopOpacity={0.28} />
                                                <stop offset="100%" stopColor="#5FD0BE" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid stroke="rgba(178,208,212,.06)" vertical={false} />
                                        <XAxis dataKey="label" {...axisProps} minTickGap={18} />
                                        <YAxis {...axisProps} width={44} />
                                        <Tooltip {...chartTooltip} formatter={(v) => [v === null ? "no readings" : `${num(v, 3)} ${unit}`, "Daily consumption"]} />
                                        <Area type="monotone" dataKey="consumption" stroke="#5FD0BE" fill={`url(#mtr-${meterId})`} strokeWidth={2} connectNulls={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="op-table-wrap">
                                <table className="op-table">
                                    <thead><tr><th>Recent reading (IST)</th><th>Register</th><th>Interval use</th><th>Quality</th></tr></thead>
                                    <tbody>
                                        {(data.recent_readings || []).map((r) => (
                                            <tr key={r.reading_time}>
                                                <td>{dateTime(r.reading_time)}</td>
                                                <td><b>{num(r.register_value, 3)}</b></td>
                                                <td>{qty(r.interval_consumption, unit, 3)}</td>
                                                <td>{r.reading_quality}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <ProjectedBillPanel initialMeterId={meterId} fixedMeter title="Estimated bill" />
                    </div>
                </>
            )}
        </section>
    );
}
