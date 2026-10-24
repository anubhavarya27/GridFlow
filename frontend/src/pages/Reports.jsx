import { useEffect, useState } from "react";

import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from "recharts";

import {
    Users,
    Building2,
    Gauge,
    Receipt,
    CreditCard,
    TrendingUp,
    Zap,
} from "lucide-react";

import {
    getReportOverview,
    getMonthlyReport,
    getReportBillStatus,
    getReportPaymentMethods,
    getTopConsumingMeters,
} from "../services/api";

import "../styles/reports.css";

function Reports() {
    const [overview, setOverview] = useState({
        total_customers: 0,
        total_properties: 0,
        total_meters: 0,
        total_bills: 0,
        total_payments: 0,
        total_revenue: 0,
        total_consumption: 0,
    });

    const [monthly, setMonthly] = useState({
        consumption: [],
        revenue: [],
    });

    const [billStatus, setBillStatus] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [topMeters, setTopMeters] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadReports() {
            setLoading(true);
            setError("");

            const results = await Promise.allSettled([
                getReportOverview(),
                getMonthlyReport(),
                getReportBillStatus(),
                getReportPaymentMethods(),
                getTopConsumingMeters(),
            ]);

            const [
                overviewResult,
                monthlyResult,
                billStatusResult,
                paymentMethodsResult,
                topMetersResult,
            ] = results;

            if (overviewResult.status === "fulfilled") {
                setOverview(
                    overviewResult.value || {
                        total_customers: 0,
                        total_properties: 0,
                        total_meters: 0,
                        total_bills: 0,
                        total_payments: 0,
                        total_revenue: 0,
                        total_consumption: 0,
                    }
                );
            } else {
                console.error(
                    "Report overview error:",
                    overviewResult.reason
                );
            }

            if (monthlyResult.status === "fulfilled") {
                setMonthly({
                    consumption:
                        monthlyResult.value?.consumption || [],
                    revenue:
                        monthlyResult.value?.revenue || [],
                });
            } else {
                console.error(
                    "Monthly report error:",
                    monthlyResult.reason
                );
            }

            if (billStatusResult.status === "fulfilled") {
                setBillStatus(
                    Array.isArray(billStatusResult.value)
                        ? billStatusResult.value
                        : []
                );
            } else {
                console.error(
                    "Bill status report error:",
                    billStatusResult.reason
                );
            }

            if (paymentMethodsResult.status === "fulfilled") {
                setPaymentMethods(
                    Array.isArray(paymentMethodsResult.value)
                        ? paymentMethodsResult.value
                        : []
                );
            } else {
                console.error(
                    "Payment method report error:",
                    paymentMethodsResult.reason
                );
            }

            if (topMetersResult.status === "fulfilled") {
                setTopMeters(
                    Array.isArray(topMetersResult.value)
                        ? topMetersResult.value
                        : []
                );
            } else {
                console.error(
                    "Top meters report error:",
                    topMetersResult.reason
                );
            }

            const hasFailure = results.some(
                (result) => result.status === "rejected"
            );

            if (hasFailure) {
                setError(
                    "Some report data could not be loaded."
                );
            }

            setLoading(false);
        }

        loadReports();
    }, []);

    const consumptionData = monthly.consumption.map(
        (item) => ({
            month: formatMonth(item.month),
            consumption: Number(item.consumption || 0),
        })
    );

    const revenueData = monthly.revenue.map(
        (item) => ({
            month: formatMonth(item.month),
            revenue:
                Number(item.revenue || 0) / 100000,
        })
    );

    const totalBillStatus = billStatus.reduce(
        (sum, item) =>
            sum + Number(item.count || 0),
        0
    );

    const totalPaymentCount = paymentMethods.reduce(
        (sum, item) =>
            sum +
            Number(item.payment_count || 0),
        0
    );

    return (
        <div className="reports-page">

            {/* HEADER */}
            <div className="reports-header">
                <div>
                    <span className="eyebrow">
                        ANALYTICS
                    </span>

                    <h1>Reporting Center</h1>

                    <p>
                        Billing, consumption and payment
                        analytics from the utility database.
                    </p>
                </div>

                <div className="reports-live">
                    <span className="status-dot" />
                    LIVE DATA
                </div>
            </div>

            {error && (
                <div className="reports-error">
                    {error}
                </div>
            )}

            {/* KPI ROW */}
            <section className="reports-kpis">

                <ReportStat
                    icon={<Users size={19} />}
                    label="CUSTOMERS"
                    value={
                        loading
                            ? "—"
                            : overview.total_customers
                    }
                />

                <ReportStat
                    icon={<Building2 size={19} />}
                    label="PROPERTIES"
                    value={
                        loading
                            ? "—"
                            : overview.total_properties
                    }
                />

                <ReportStat
                    icon={<Gauge size={19} />}
                    label="METERS"
                    value={
                        loading
                            ? "—"
                            : overview.total_meters
                    }
                />

                <ReportStat
                    icon={<Receipt size={19} />}
                    label="BILLS"
                    value={
                        loading
                            ? "—"
                            : overview.total_bills
                    }
                />

                <ReportStat
                    icon={<CreditCard size={19} />}
                    label="PAYMENTS"
                    value={
                        loading
                            ? "—"
                            : overview.total_payments
                    }
                />

                <ReportStat
                    icon={<TrendingUp size={19} />}
                    label="REVENUE"
                    value={
                        loading
                            ? "—"
                            : `₹${formatMoney(
                                  overview.total_revenue
                              )}`
                    }
                />

                <ReportStat
                    icon={<Zap size={19} />}
                    label="CONSUMPTION"
                    value={
                        loading
                            ? "—"
                            : `${formatNumber(
                                  overview.total_consumption
                              )} kWh`
                    }
                />

            </section>

            {/* CHART GRID */}
            <section className="reports-chart-grid">

                {/* CONSUMPTION */}
                <ReportPanel
                    title="Monthly consumption"
                    meta="kWh"
                >
                    {consumptionData.length ? (
                        <ResponsiveContainer
                            width="100%"
                            height={290}
                        >
                            <AreaChart
                                data={consumptionData}
                            >
                                <defs>
                                    <linearGradient
                                        id="reportConsumptionGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="#5FD0BE"
                                            stopOpacity={0.28}
                                        />

                                        <stop
                                            offset="100%"
                                            stopColor="#5FD0BE"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid
                                    stroke="rgba(178,208,212,.06)"
                                    vertical={false}
                                />

                                <XAxis
                                    dataKey="month"
                                    stroke="#59686B"
                                    tickLine={false}
                                    axisLine={false}
                                    fontSize={10}
                                />

                                <YAxis
                                    stroke="#59686B"
                                    tickLine={false}
                                    axisLine={false}
                                    fontSize={10}
                                />

                                <Tooltip
                                    contentStyle={{
                                        background: "#0d1214",
                                        border:
                                            "1px solid rgba(178,208,212,.15)",
                                        color: "#eaf1f1",
                                    }}
                                />

                                <Area
                                    type="monotone"
                                    dataKey="consumption"
                                    stroke="#5FD0BE"
                                    fill="url(#reportConsumptionGradient)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState text="No consumption data available" />
                    )}
                </ReportPanel>

                {/* REVENUE */}
                <ReportPanel
                    title="Monthly revenue"
                    meta="₹ LAKH"
                >
                    {revenueData.length ? (
                        <ResponsiveContainer
                            width="100%"
                            height={290}
                        >
                            <BarChart
                                data={revenueData}
                            >
                                <CartesianGrid
                                    stroke="rgba(178,208,212,.06)"
                                    vertical={false}
                                />

                                <XAxis
                                    dataKey="month"
                                    stroke="#59686B"
                                    tickLine={false}
                                    axisLine={false}
                                    fontSize={10}
                                />

                                <YAxis
                                    stroke="#59686B"
                                    tickLine={false}
                                    axisLine={false}
                                    fontSize={10}
                                />

                                <Tooltip
                                    contentStyle={{
                                        background: "#0d1214",
                                        border:
                                            "1px solid rgba(178,208,212,.15)",
                                        color: "#eaf1f1",
                                    }}
                                    formatter={(value) => [
                                        `₹${Number(
                                            value
                                        ).toFixed(2)} L`,
                                        "Revenue",
                                    ]}
                                />

                                <Bar
                                    dataKey="revenue"
                                    fill="#377B72"
                                    radius={[
                                        3,
                                        3,
                                        0,
                                        0,
                                    ]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <EmptyState text="No revenue data available" />
                    )}
                </ReportPanel>

            </section>

            {/* LOWER GRID */}
            <section className="reports-lower-grid">

                {/* BILL STATUS */}
                <ReportPanel
                    title="Billing status"
                    meta={`${overview.total_bills} BILLS`}
                >
                    <div className="report-status-list">
                        {billStatus.map((item) => {
                            const percentage =
                                totalBillStatus
                                    ? Math.round(
                                          (Number(
                                              item.count
                                          ) /
                                              totalBillStatus) *
                                              100
                                      )
                                    : 0;

                            return (
                                <div
                                    className="report-status-row"
                                    key={item.bill_status}
                                >
                                    <div className="report-status-name">
                                        <span>
                                            {item.bill_status}
                                        </span>

                                        <strong>
                                            {item.count}
                                        </strong>
                                    </div>

                                    <div className="report-progress">
                                        <i
                                            style={{
                                                width: `${percentage}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ReportPanel>

                {/* PAYMENT METHODS */}
                <ReportPanel
                    title="Payment methods"
                    meta={`${overview.total_payments} PAYMENTS`}
                >
                    <div className="report-status-list">
                        {paymentMethods.map(
                            (item) => {
                                const percentage =
                                    totalPaymentCount
                                        ? Math.round(
                                              (Number(
                                                  item.payment_count
                                              ) /
                                                  totalPaymentCount) *
                                                  100
                                          )
                                        : 0;

                                return (
                                    <div
                                        className="report-status-row"
                                        key={
                                            item.payment_mode
                                        }
                                    >
                                        <div className="report-status-name">
                                            <span>
                                                {
                                                    item.payment_mode
                                                }
                                            </span>

                                            <strong>
                                                {item.payment_count}
                                            </strong>
                                        </div>

                                        <div className="report-progress">
                                            <i
                                                style={{
                                                    width: `${percentage}%`,
                                                }}
                                            />
                                        </div>

                                        <small className="report-amount">
                                            ₹
                                            {formatMoney(
                                                item.total_amount
                                            )}
                                        </small>
                                    </div>
                                );
                            }
                        )}
                    </div>
                </ReportPanel>

            </section>

            {/* TOP METERS */}
            <ReportPanel
                title="Top consuming meters"
                meta="TOP 10"
            >
                <div className="meter-report-table">

                    <div className="meter-report-header">
                        <span>RANK</span>
                        <span>METER ID</span>
                        <span>CONSUMPTION</span>
                    </div>

                    {topMeters.map(
                        (meter, index) => (
                            <div
                                className="meter-report-row"
                                key={meter.meter_id}
                            >
                                <span>
                                    {String(
                                        index + 1
                                    ).padStart(2, "0")}
                                </span>

                                <strong>
                                    MTR-
                                    {meter.meter_id}
                                </strong>

                                <span>
                                    {formatNumber(
                                        meter.total_consumption
                                    )}{" "}
                                    kWh
                                </span>
                            </div>
                        )
                    )}

                </div>
            </ReportPanel>

        </div>
    );
}


/* =========================================================
   STAT
========================================================= */

function ReportStat({
    icon,
    label,
    value,
}) {
    return (
        <div className="report-stat">
            <div className="report-stat-icon">
                {icon}
            </div>

            <span>{label}</span>

            <strong>{value}</strong>
        </div>
    );
}


/* =========================================================
   PANEL
========================================================= */

function ReportPanel({
    title,
    meta,
    children,
}) {
    return (
        <section className="report-panel">
            <div className="report-panel-header">
                <h2>{title}</h2>

                {meta && (
                    <span>{meta}</span>
                )}
            </div>

            {children}
        </section>
    );
}


/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({ text }) {
    return (
        <div className="report-empty">
            {text}
        </div>
    );
}


/* =========================================================
   HELPERS
========================================================= */

function formatMonth(value) {
    if (!value) return "—";

    const date = new Date(
        `${value}-01T00:00:00`
    );

    if (Number.isNaN(date.getTime())) {
        return String(value).toUpperCase();
    }

    return date
        .toLocaleString("en-US", {
            month: "short",
        })
        .toUpperCase();
}

function formatMoney(value) {
    return Number(value || 0).toLocaleString(
        "en-IN"
    );
}

function formatNumber(value) {
    return Number(value || 0).toLocaleString(
        "en-IN",
        {
            maximumFractionDigits: 2,
        }
    );
}

export default Reports;