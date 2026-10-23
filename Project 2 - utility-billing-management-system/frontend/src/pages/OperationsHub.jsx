import { useEffect, useMemo, useState } from "react";
import {
    Users, Building2, Gauge, FileText, Receipt, CreditCard,
    RefreshCw, Search, Activity, Wallet, IndianRupee, Droplets,
    Zap, CircleDollarSign, CalendarDays, ArrowUpRight
} from "lucide-react";

import {
    getCustomers, getCustomerPhones, getCustomerEmails,
    getProperties, getOwnerships, getPropertyMeters,
    getMeters, getReadings, getMeterServices,
    getServices, getElectricityServices, getWaterServices,
    getTariffs, getBills, getPayments, getPaymentSchedules,
    getCards, getCardPayments, getCashPayments, getUpiPayments,
} from "../services/api";

import "../styles/operations.css";

const modes = {
    "/customer-360": {
        title: "Customer 360", eyebrow: "OPERATIONS / CUSTOMER INTELLIGENCE",
        icon: Users, subtitle: "A unified view of customer identity, properties, meters, billing and payments."
    },
    "/property-portfolio": {
        title: "Property Portfolio", eyebrow: "OPERATIONS / PROPERTY",
        icon: Building2, subtitle: "Ownership, occupancy and meter relationships across the property portfolio."
    },
    "/meter-monitor": {
        title: "Meter Monitor", eyebrow: "OPERATIONS / METER TELEMETRY",
        icon: Gauge, subtitle: "Meter health, readings, services and consumption across the network."
    },
    "/tariff-lab": {
        title: "Tariff Lab", eyebrow: "OPERATIONS / TARIFF",
        icon: FileText, subtitle: "Inspect utility pricing, fixed charges, tax and tariff configuration."
    },
    "/billing-center": {
        title: "Billing Center", eyebrow: "OPERATIONS / BILLING",
        icon: Receipt, subtitle: "Search and inspect generated bills, readings, tariffs and payment status."
    },
    "/payment-hub": {
        title: "Payment Hub", eyebrow: "OPERATIONS / PAYMENTS",
        icon: CreditCard, subtitle: "Trace payments across bills and Card, Cash and UPI channels."
    },
};

const arr = (v) => Array.isArray(v) ? v : [];
const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const num = (v) => Number(v || 0).toLocaleString("en-IN");
const date = (v) => v ? new Date(v).toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" }) : "—";

function Badge({ children, tone = "neutral" }) {
    return <span className={`op-badge ${tone}`}>{children}</span>;
}

function Stat({ label, value, icon: Icon, sub }) {
    return (
        <div className="op-stat">
            <div className="op-stat-top">
                <span>{label}</span><Icon size={17} />
            </div>
            <strong>{value}</strong>
            {sub && <small>{sub}</small>}
        </div>
    );
}

function Panel({ title, meta, children, className = "" }) {
    return (
        <section className={`op-panel ${className}`}>
            <div className="op-panel-head">
                <div><h3>{title}</h3>{meta && <span>{meta}</span>}</div>
            </div>
            {children}
        </section>
    );
}

function Empty({ text = "No records found" }) {
    return <div className="op-empty">{text}</div>;
}

function Table({ columns, rows, render }) {
    if (!rows.length) return <Empty />;
    return (
        <div className="op-table-wrap">
            <table className="op-table">
                <thead><tr>{columns.map(c => <th key={c}>{c}</th>)}</tr></thead>
                <tbody>{rows.map((row, i) => <tr key={row._key || i}>{render(row, i)}</tr>)}</tbody>
            </table>
        </div>
    );
}

export default function OperationsHub() {
    const path = window.location.pathname;
    const config = modes[path] || modes["/customer-360"];
    const Icon = config.icon;

    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [selected, setSelected] = useState(null);

    const loaders = useMemo(() => ({
        customers: getCustomers, phones: getCustomerPhones, emails: getCustomerEmails,
        properties: getProperties, ownerships: getOwnerships, propertyMeters: getPropertyMeters,
        meters: getMeters, readings: getReadings, meterServices: getMeterServices,
        services: getServices, electricity: getElectricityServices, water: getWaterServices,
        tariffs: getTariffs, bills: getBills, payments: getPayments,
        schedules: getPaymentSchedules, cards: getCards, cardPayments: getCardPayments,
        cashPayments: getCashPayments, upiPayments: getUpiPayments,
    }), []);

    const load = async () => {
        setLoading(true); setError("");
        try {
            const entries = await Promise.all(
                Object.entries(loaders).map(async ([key, fn]) => {
                    try { return [key, arr(await fn())]; }
                    catch { return [key, []]; }
                })
            );
            setData(Object.fromEntries(entries));
        } catch (e) {
            setError(e.message || "Unable to load operations data.");
        } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const d = data;
    const q = search.trim().toLowerCase();

    const filtered = (rows, fields) => !q ? rows : rows.filter(r =>
        fields.some(f => String(r?.[f] ?? "").toLowerCase().includes(q))
    );

    const customers = filtered(d.customers || [], ["cust_id","cust_name","apartment","flat_no","city"]);
    const properties = filtered(d.properties || [], ["property_id","property_name","occupancy_status"]);
    const meters = filtered(d.meters || [], ["meter_id","meter_status"]);
    const readings = filtered(d.readings || [], ["meter_id","reading_no","reading_status"]);
    const tariffs = filtered(d.tariffs || [], ["tariff_code"]);
    const bills = filtered(d.bills || [], ["bill_id","meter_id","billing_month","tariff_code","bill_status"]);
    const payments = filtered(d.payments || [], ["payment_id","bill_id","payment_mode"]);

    const ownershipFor = id => (d.ownerships || []).filter(x => String(x.cust_id) === String(id));
    const propertyMetersFor = id => (d.propertyMeters || []).filter(x => String(x.property_id) === String(id));
    const meterReadingsFor = id => (d.readings || []).filter(x => String(x.meter_id) === String(id));
    const billsForMeter = id => (d.bills || []).filter(x => String(x.meter_id) === String(id));
    const paymentsForBill = id => (d.payments || []).filter(x => String(x.bill_id) === String(id));

    const renderCustomer = () => {
        const c = selected || customers[0];
        if (!c) return <Empty text="No customers available" />;
        const owned = ownershipFor(c.cust_id);
        const props = owned.map(o => (d.properties || []).find(p => String(p.property_id) === String(o.property_id))).filter(Boolean);
        const metersForCustomer = props.flatMap(p => propertyMetersFor(p.property_id)).map(pm =>
            (d.meters || []).find(m => String(m.meter_id) === String(pm.meter_id))
        ).filter(Boolean);
        const customerBills = metersForCustomer.flatMap(m => billsForMeter(m.meter_id));
        const customerPayments = customerBills.flatMap(b => paymentsForBill(b.bill_id));
        const phones = (d.phones || []).filter(x => String(x.cust_id) === String(c.cust_id));
        const emails = (d.emails || []).filter(x => String(x.cust_id) === String(c.cust_id));
        return <div className="op-detail-grid">
            <Panel title="Customer profile" meta={`CUSTOMER #${c.cust_id}`}>
                <div className="op-profile"><div className="op-avatar">{String(c.cust_name || "?").slice(0,1)}</div>
                    <div><h2>{c.cust_name}</h2><p>{c.apartment || "—"} · Flat {c.flat_no || "—"}</p><p>{c.city || "—"} · DOB {date(c.dob)}</p></div>
                </div>
                <div className="op-kv"><span>Phone</span><b>{phones.map(x=>x.phone_no).join(", ") || "—"}</b><span>Email</span><b>{emails.map(x=>x.email).join(", ") || "—"}</b></div>
            </Panel>
            <Panel title="Customer footprint" meta="LIVE RELATIONSHIPS">
                <div className="mini-stats"><div><b>{props.length}</b><span>Properties</span></div><div><b>{metersForCustomer.length}</b><span>Meters</span></div><div><b>{customerBills.length}</b><span>Bills</span></div><div><b>{money(customerPayments.reduce((s,p)=>s+Number(p.amount||0),0))}</b><span>Payments</span></div></div>
            </Panel>
            <Panel title="Properties & meters" className="wide">
                {!props.length ? <Empty /> : <div className="op-cards">{props.map(p => <div className="op-rel-card" key={p.property_id}><div><b>{p.property_name}</b><Badge tone={String(p.occupancy_status).toLowerCase()}>{p.occupancy_status}</Badge></div><small>PROPERTY #{p.property_id}</small><p>Meters: {propertyMetersFor(p.property_id).map(x=>x.meter_id).join(", ") || "None"}</p></div>)}</div>}
            </Panel>
            <Panel title="Recent billing" meta={`${customerBills.length} BILLS`} className="wide">
                <Table columns={["Bill","Meter","Month","Amount","Status"]} rows={customerBills.slice(0,12)} render={b=><><td>#{b.bill_id}</td><td>{b.meter_id}</td><td>{date(b.billing_month)}</td><td>{money(b.total_amount)}</td><td><Badge tone={String(b.bill_status||"").toLowerCase()}>{b.bill_status || "—"}</Badge></td></>} />
            </Panel>
        </div>;
    };

    const content = {
        "/customer-360": <div className="op-two"><Panel title="Customer directory" meta={`${customers.length} RECORDS`}><div className="op-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search customers..." /></div><div className="op-list">{customers.map(c=><button className={`op-list-item ${selected?.cust_id===c.cust_id?"active":""}`} key={c.cust_id} onClick={()=>setSelected(c)}><span className="op-avatar sm">{String(c.cust_name||"?").slice(0,1)}</span><span><b>{c.cust_name}</b><small>#{c.cust_id} · {c.apartment || "—"} · {c.flat_no || "—"}</small></span><ArrowUpRight size={15}/></button>)}</div></Panel><div>{renderCustomer()}</div></div>,

        "/property-portfolio": <><div className="op-stats"><Stat label="Properties" value={num(properties.length)} icon={Building2}/><Stat label="Occupied" value={num(properties.filter(p=>String(p.occupancy_status).toLowerCase()==="occupied").length)} icon={Users}/><Stat label="Meters linked" value={num((d.propertyMeters||[]).length)} icon={Gauge}/><Stat label="Ownership links" value={num((d.ownerships||[]).length)} icon={Activity}/></div><Panel title="Property portfolio" meta="PROPERTY → OWNERSHIP → METER"><Table columns={["ID","Property","Occupancy","Meters","Owners"]} rows={properties} render={p=><><td>#{p.property_id}</td><td><b>{p.property_name}</b></td><td><Badge tone={String(p.occupancy_status||"").toLowerCase()}>{p.occupancy_status}</Badge></td><td>{propertyMetersFor(p.property_id).map(x=>x.meter_id).join(", ")||"—"}</td><td>{(d.ownerships||[]).filter(x=>String(x.property_id)===String(p.property_id)).map(x=>x.cust_id).join(", ")||"—"}</td></>}/></Panel></>,

        "/meter-monitor": <><div className="op-stats"><Stat label="Meters" value={num(meters.length)} icon={Gauge}/><Stat label="Active" value={num(meters.filter(m=>String(m.meter_status).toLowerCase()==="active").length)} icon={Activity}/><Stat label="Readings" value={num(readings.length)} icon={FileText}/><Stat label="Avg. reading" value={num(readings.length ? readings.reduce((s,r)=>s+Number(r.reading_value||0),0)/readings.length : 0)} icon={Zap}/></div><Panel title="Meter monitor" meta="LIVE DATABASE RECORDS"><Table columns={["Meter","Status","Capacity","Installed","Latest reading","Consumption"]} rows={meters} render={m=>{const rs=meterReadingsFor(m.meter_id).sort((a,b)=>new Date(b.reading_date)-new Date(a.reading_date));const bs=billsForMeter(m.meter_id);const consumption=bs.reduce((s,b)=>s+Number(b.current_reading||0)-Number(b.previous_reading||0),0);return <><td><b>{m.meter_id}</b></td><td><Badge tone={String(m.meter_status||"").toLowerCase()}>{m.meter_status}</Badge></td><td>{m.capacity ?? "—"}</td><td>{date(m.installation_date)}</td><td>{rs[0]?.reading_value ?? "—"} <small>{rs[0] ? date(rs[0].reading_date):""}</small></td><td>{num(consumption)} units</td></>}}/></Panel></>,

        "/tariff-lab": <><div className="op-stats"><Stat label="Tariffs" value={num(tariffs.length)} icon={FileText}/><Stat label="Utility services" value={num((d.services||[]).length)} icon={Activity}/><Stat label="Electricity" value={num((d.electricity||[]).length)} icon={Zap}/><Stat label="Water" value={num((d.water||[]).length)} icon={Droplets}/></div><Panel title="Tariff configuration" meta="READ-ONLY INSPECTION"><Table columns={["Tariff","Unit rate","Service","Fixed charge","Tax"]} rows={tariffs} render={t=>{const s=(d.services||[]).find(x=>String(x.service_id)===String(t.service_id)) || (d.services||[])[tariffs.indexOf(t) % Math.max(1,(d.services||[]).length)];return <><td><b>{t.tariff_code}</b></td><td>{money(t.unit_rate)}</td><td>{s ? `Service #${s.service_id}`:"—"}</td><td>{money(s?.fixed_charge)}</td><td>{s?.tax ?? "—"}%</td></>}}/></Panel></>,

        "/billing-center": <><div className="op-stats"><Stat label="Bills" value={num(bills.length)} icon={Receipt}/><Stat label="Paid" value={num(bills.filter(b=>String(b.bill_status).toLowerCase()==="paid").length)} icon={CircleDollarSign}/><Stat label="Pending" value={num(bills.filter(b=>String(b.bill_status).toLowerCase()==="pending").length)} icon={CalendarDays}/><Stat label="Billed amount" value={money(bills.reduce((s,b)=>s+Number(b.total_amount||b.amount||0),0))} icon={IndianRupee}/></div><Panel title="Billing center" meta="BILL REGISTER"><div className="op-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search bill, meter, month or status..." /></div><Table columns={["Bill","Meter","Month","Readings","Tariff","Status"]} rows={bills} render={b=><><td><b>#{b.bill_id}</b></td><td>{b.meter_id}</td><td>{date(b.billing_month)}</td><td>{b.previous_reading ?? "—"} → {b.current_reading ?? "—"}</td><td>{b.tariff_code || "—"}</td><td><Badge tone={String(b.bill_status||"").toLowerCase()}>{b.bill_status}</Badge></td></>}/></Panel></>,

        "/payment-hub": <><div className="op-stats"><Stat label="Payments" value={num(payments.length)} icon={CreditCard}/><Stat label="Collected" value={money(payments.reduce((s,p)=>s+Number(p.amount||0),0))} icon={Wallet}/><Stat label="Card" value={num(payments.filter(p=>String(p.payment_mode).toLowerCase()==="card").length)} icon={CreditCard}/><Stat label="UPI" value={num(payments.filter(p=>String(p.payment_mode).toLowerCase()==="upi").length)} icon={IndianRupee}/></div><Panel title="Payment hub" meta="PAYMENT REGISTER"><div className="op-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search payment, bill or mode..." /></div><Table columns={["Payment","Bill","Date","Amount","Mode","Due date"]} rows={payments} render={p=><><td><b>#{p.payment_id}</b></td><td>#{p.bill_id}</td><td>{date(p.payment_date)}</td><td>{money(p.amount)}</td><td><Badge tone={String(p.payment_mode||"").toLowerCase()}>{p.payment_mode}</Badge></td><td>{date(p.payment_due_date)}</td></>}/></Panel></>,
    }[path] || null;

    return <main className="operations-page">
        <header className="op-header">
            <div><div className="op-eyebrow"><Icon size={14}/>{config.eyebrow}</div><h1>{config.title}</h1><p>{config.subtitle}</p></div>
            <button className="op-refresh" onClick={load} disabled={loading}><RefreshCw size={16} className={loading?"spin":""}/> {loading?"SYNCING":"REFRESH"}</button>
        </header>
        {error && <div className="op-error">{error}</div>}
        {loading && !Object.keys(data).length ? <div className="op-loading"><RefreshCw className="spin" size={20}/> Loading live records…</div> : content}
    </main>;
}
