import { useState } from "react";
import { FilePlus2, Wallet } from "lucide-react";

import { generateBill, recordPayment } from "../services/api";
import { money, todayIst } from "../utils/format";
import "../styles/gridpulse.css";

/**
 * ADMIN: generate a bill from billing-cycle readings (POST /api/bills/generate).
 * The backend validates the month, derives missing cycle readings from the
 * interval register and writes reading + bill in one transaction.
 */
export function GenerateBillForm({ meters, onDone }) {
    const [meterId, setMeterId] = useState("");
    const [month, setMonth] = useState(todayIst().slice(0, 7));
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);

    async function submit(e) {
        e.preventDefault();
        setBusy(true);
        setMessage(null);
        try {
            const bill = await generateBill({ meter_id: Number(meterId), billing_month: `${month}-01` });
            setMessage({ ok: true, text: `Bill #${bill.bill_id} created for meter ${bill.meter_id}: ${bill.units} ${bill.unit || "units"}, total ${money(bill.total_amount)}.` });
            onDone?.();
        } catch (err) {
            setMessage({ ok: false, text: err.message });
        } finally {
            setBusy(false);
        }
    }

    return (
        <section className="op-panel">
            <div className="op-panel-head"><h3><FilePlus2 size={14} style={{ verticalAlign: -2 }} /> Generate bill</h3>
                <span>ADMIN · USES CYCLE READINGS DATED (M-1)-01 AND M-01 · TRANSACTIONAL</span></div>
            <form className="gp-inline-form" onSubmit={submit}>
                <label className="gp-field"><span>Meter</span>
                    <select value={meterId} onChange={(e) => setMeterId(e.target.value)} required>
                        <option value="">Select…</option>
                        {meters.map((m) => <option key={m.meter_id} value={m.meter_id}>{m.meter_id} · {m.meter_status}</option>)}
                    </select>
                </label>
                <label className="gp-field"><span>Billing month</span>
                    <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} required />
                </label>
                <button className="gp-btn primary" disabled={busy || !meterId}>{busy ? "GENERATING…" : "GENERATE BILL"}</button>
            </form>
            {message && <div className={message.ok ? "gp-success" : "op-error"} style={message.ok ? {} : { margin: "0 17px 14px" }}>{message.text}</div>}
        </section>
    );
}

/**
 * ADMIN: record a payment with its Card / Cash / UPI details (POST /api/payments).
 * The backend writes payment + specialization row and updates the bill status in
 * one transaction.
 */
export function RecordPaymentForm({ bills, cards, onDone }) {
    const open = bills.filter((b) => b.bill_status !== "Paid");
    const [billId, setBillId] = useState("");
    const [mode, setMode] = useState("UPI");
    const [amount, setAmount] = useState("");
    const [details, setDetails] = useState({ card_no: "", receipt_no: "", upi_id: "", upi_app: "Google Pay" });
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null);

    function pickBill(id) {
        setBillId(id);
        const b = open.find((x) => String(x.bill_id) === String(id));
        if (b?.balance_due !== undefined) setAmount(String(b.balance_due));
    }

    async function submit(e) {
        e.preventDefault();
        setBusy(true);
        setMessage(null);
        try {
            const body = { bill_id: Number(billId), amount, payment_mode: mode, payment_date: todayIst(), ...details };
            const r = await recordPayment(body);
            setMessage({ ok: true, text: `Payment #${r.payment.payment_id} recorded. Bill #${r.bill.bill_id} is now ${r.bill.bill_status}.` });
            setBillId("");
            setAmount("");
            onDone?.();
        } catch (err) {
            setMessage({ ok: false, text: err.message });
        } finally {
            setBusy(false);
        }
    }

    const set = (k) => (e) => setDetails((d) => ({ ...d, [k]: e.target.value }));

    return (
        <section className="op-panel">
            <div className="op-panel-head"><h3><Wallet size={14} style={{ verticalAlign: -2 }} /> Record payment</h3>
                <span>ADMIN · PAYMENT + CARD/CASH/UPI ROW + BILL STATUS IN ONE TRANSACTION</span></div>
            <form className="gp-inline-form" onSubmit={submit}>
                <label className="gp-field" style={{ minWidth: 230 }}><span>Bill</span>
                    <select value={billId} onChange={(e) => pickBill(e.target.value)} required>
                        <option value="">Select an unpaid bill…</option>
                        {open.map((b) => (
                            <option key={b.bill_id} value={b.bill_id}>
                                #{b.bill_id} · meter {b.meter_id} · {String(b.billing_month).slice(0, 7)} · due {money(b.balance_due)}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="gp-field" style={{ minWidth: 110 }}><span>Amount (₹)</span>
                    <input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
                </label>
                <label className="gp-field" style={{ minWidth: 100 }}><span>Mode</span>
                    <select value={mode} onChange={(e) => setMode(e.target.value)}>
                        <option>UPI</option><option>Card</option><option>Cash</option>
                    </select>
                </label>
                {mode === "Card" && (
                    <label className="gp-field"><span>Card</span>
                        <select value={details.card_no} onChange={set("card_no")} required>
                            <option value="">Select…</option>
                            {cards.map((c) => <option key={c.card_no} value={c.card_no}>{c.card_no} · {c.bank_name}</option>)}
                        </select>
                    </label>
                )}
                {mode === "Cash" && (
                    <label className="gp-field"><span>Receipt no.</span><input value={details.receipt_no} onChange={set("receipt_no")} required maxLength={50} /></label>
                )}
                {mode === "UPI" && (
                    <>
                        <label className="gp-field"><span>UPI ID</span><input value={details.upi_id} onChange={set("upi_id")} required maxLength={100} placeholder="name@upi" /></label>
                        <label className="gp-field"><span>UPI app</span>
                            <select value={details.upi_app} onChange={set("upi_app")}><option>Google Pay</option><option>PhonePe</option><option>Paytm</option></select>
                        </label>
                    </>
                )}
                <button className="gp-btn primary" disabled={busy || !billId}>{busy ? "SAVING…" : "RECORD PAYMENT"}</button>
            </form>
            {message && <div className={message.ok ? "gp-success" : "op-error"} style={message.ok ? {} : { margin: "0 17px 14px" }}>{message.text}</div>}
        </section>
    );
}
