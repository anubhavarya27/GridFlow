import { useEffect, useState } from "react";
import { Calculator } from "lucide-react";

import { getAnalyticsMeters, getBillEstimate } from "../services/api";
import { date, money, num, pct, qty, statusClass, statusLabel } from "../utils/format";

/**
 * Projected month-end bill for one meter, computed by the backend
 * (GET /api/bills/estimate/{meterId}).  Always labelled as an ESTIMATE and never
 * stored as a bill.
 */
export default function ProjectedBillPanel({ initialMeterId, fixedMeter = false, title = "Projected bill" }) {
    const [meters, setMeters] = useState([]);
    const [meterId, setMeterId] = useState(initialMeterId ? String(initialMeterId) : "");
    const [estimate, setEstimate] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        if (fixedMeter) return undefined;
        let alive = true;
        getAnalyticsMeters()
            .then((rows) => {
                if (!alive) return;
                setMeters(rows);
                setMeterId((current) => current || (rows[0] ? String(rows[0].meter_id) : ""));
            })
            .catch((e) => alive && setError(e.message));
        return () => {
            alive = false;
        };
    }, [fixedMeter]);

    useEffect(() => {
        if (!meterId) return undefined;
        let alive = true;
        getBillEstimate(meterId)
            .then((e) => {
                if (!alive) return;
                setEstimate(e);
                setError("");
            })
            .catch((e) => alive && setError(e.message));
        return () => {
            alive = false;
        };
    }, [meterId]);

    const e = estimate && String(estimate.meter_id) === String(meterId) ? estimate : null;
    const bill = e?.estimated_bill;

    return (
        <section className="op-panel">
            <div className="op-panel-head" style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                    <h3>
                        <Calculator size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
                        {title}
                    </h3>
                    <span>MONTH-END PROJECTION · NOT AN ISSUED BILL</span>
                </div>
                {!fixedMeter && (
                    <label className="gp-field" style={{ minWidth: 170 }}>
                        <span>Meter</span>
                        <select value={meterId} onChange={(ev) => setMeterId(ev.target.value)}>
                            {meters.map((m) => (
                                <option key={m.meter_id} value={m.meter_id}>
                                    {m.meter_id} · {m.service_type} · {m.property_name || "—"}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
            </div>

            <div className="gp-panel-body">
                {error && <div className="op-error">{error}</div>}
                {!e && !error && <div className="op-loading">Calculating estimate…</div>}
                {e && (
                    <div className="gp-estimate">
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                            <span className="op-badge estimate">Estimate</span>
                            <span className={`op-badge ${statusClass(e.status)}`}>{statusLabel(e.status)}</span>
                        </div>

                        <div className="gp-estimate-total">
                            <strong>{bill ? money(bill.total_amount) : "—"}</strong>
                            <span className="gp-note">
                                {bill ? "estimated total incl. fixed charge and tax" : "no credible estimate"}
                            </span>
                        </div>

                        <div className="gp-kv">
                            <span>Billing period</span>
                            <b>{date(e.period?.start)} – {date(e.period?.end)}</b>
                            <span>Days elapsed</span>
                            <b>{e.days_elapsed !== undefined ? `${num(e.days_elapsed, 1)} of ${e.period?.days}` : "—"}</b>
                            <span>Recorded consumption</span>
                            <b>{qty(e.recorded_consumption, e.unit)}</b>
                            <span>Average daily consumption</span>
                            <b>{qty(e.average_daily_consumption, e.unit)}</b>
                            <span>Projected month-end consumption</span>
                            <b>{qty(e.projected_consumption, e.unit)}</b>
                            {bill && (
                                <>
                                    <span>Energy · fixed · tax</span>
                                    <b>
                                        {money(bill.energy_charge)} · {money(bill.fixed_charge)} · {money(bill.tax_amount)}
                                    </b>
                                </>
                            )}
                            <span>Tariff</span>
                            <b>
                                {e.tariff?.tariff_code || "service rate"} @ {money(e.tariff?.unit_rate)}/{e.unit}
                            </b>
                            <span>Previous period (actual bill)</span>
                            <b>
                                {e.previous_bill
                                    ? `${money(e.previous_bill.total_amount)} · #${e.previous_bill.bill_id}`
                                    : "not available"}
                            </b>
                            <span>Change vs previous bill</span>
                            <b>{pct(e.change_vs_previous_pct)}</b>
                        </div>

                        {e.warnings?.length > 0 && (
                            <ul className="gp-warnings">
                                {e.warnings.map((w) => (
                                    <li key={w}>{w}</li>
                                ))}
                            </ul>
                        )}
                        <p className="gp-note" style={{ marginTop: 10 }}>
                            Billed in the {date(e.period?.billed_in_billing_month)} billing cycle. Linear projection of
                            this period&apos;s average daily use, priced with the existing tariff rule.
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
