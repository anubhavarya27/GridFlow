import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
    RefreshCw,
} from "lucide-react";

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
    getDashboardSummary,
    getBillStatus,
    getPaymentMethods,
    getConsumption,
    getRevenue,
    getBills,
    getPayments,
    getConsumptionInsights,
} from "../services/api";

import ProjectedBillPanel from "../components/ProjectedBillPanel";
import { dateTime, money, num, pct, qty, statusClass } from "../utils/format";

import "../styles/dashboard.css";
import "../styles/operations.css";
import "../styles/gridpulse.css";


function Dashboard() {
    const [summary, setSummary] = useState({
        total_customers: 0,
        total_properties: 0,
        total_meters: 0,
        total_bills: 0,
        total_revenue: 0,
    });

    const [billStatus, setBillStatus] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [consumptionData, setConsumptionData] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [recentRecords, setRecentRecords] = useState([]);
    const [insights, setInsights] = useState(null);
    const [insightsError, setInsightsError] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    /* =========================================================
       LOAD DASHBOARD
       ========================================================= */

    const loadDashboard = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const results = await Promise.allSettled([
                getDashboardSummary(),
                getBillStatus(),
                getPaymentMethods(),
                getConsumption(),
                getRevenue(),
                getBills(),
                getPayments(),
                getConsumptionInsights(),
            ]);

            const [
                summaryResult,
                billStatusResult,
                paymentMethodsResult,
                consumptionResult,
                revenueResult,
                billsResult,
                paymentsResult,
                insightsResult,
            ] = results;


            /* -------------------------------------------------
               GRIDPULSE CONSUMPTION INSIGHTS
               ------------------------------------------------- */

            if (insightsResult.status === "fulfilled") {
                setInsights(insightsResult.value);
                setInsightsError("");
            } else {
                setInsightsError(
                    insightsResult.reason?.message ||
                        "Unable to load consumption insights."
                );
            }


            /* -------------------------------------------------
               SUMMARY
               ------------------------------------------------- */

            if (summaryResult.status === "fulfilled") {
                setSummary(
                    firstRow(
                        summaryResult.value
                    )
                );
            } else {
                console.error(
                    "Dashboard summary error:",
                    summaryResult.reason
                );

                setError(
                    "Unable to load dashboard summary. Check that the backend is running."
                );
            }


            /* -------------------------------------------------
               BILL STATUS
               ------------------------------------------------- */

            if (billStatusResult.status === "fulfilled") {
                setBillStatus(
                    normalizeRows(
                        billStatusResult.value
                    )
                );
            } else {
                console.error(
                    "Bill status error:",
                    billStatusResult.reason
                );
            }


            /* -------------------------------------------------
               PAYMENT METHODS
               ------------------------------------------------- */

            if (
                paymentMethodsResult.status ===
                "fulfilled"
            ) {
                setPaymentMethods(
                    normalizeRows(
                        paymentMethodsResult.value
                    )
                );
            } else {
                console.error(
                    "Payment methods error:",
                    paymentMethodsResult.reason
                );
            }


            /* -------------------------------------------------
               CONSUMPTION
               ------------------------------------------------- */

            if (
                consumptionResult.status ===
                "fulfilled"
            ) {
                const data =
                    consumptionResult.value;

                const rows = Array.isArray(data)
                    ? data
                    : data?.monthly_consumption ||
                      [];

                setConsumptionData(
                    rows.map((item) => ({
                        month: formatMonth(
                            item.month
                        ),
                        consumption: Number(
                            item.consumption || 0
                        ),
                    }))
                );
            } else {
                console.error(
                    "Consumption error:",
                    consumptionResult.reason
                );
            }


            /* -------------------------------------------------
               REVENUE
               ------------------------------------------------- */

            if (
                revenueResult.status ===
                "fulfilled"
            ) {
                const rows =
                    normalizeRows(
                        revenueResult.value
                    );

                setRevenueData(
                    rows.map((item) => ({
                        month: formatMonth(
                            item.month
                        ),
                        revenue: Number(
                            item.revenue || 0
                        ),
                    }))
                );
            } else {
                console.error(
                    "Revenue error:",
                    revenueResult.reason
                );
            }


            /* -------------------------------------------------
               RECENT ACTIVITY
               ------------------------------------------------- */

            const bills =
                billsResult.status === "fulfilled"
                    ? normalizeRows(
                          billsResult.value
                      )
                    : [];

            const payments =
                paymentsResult.status === "fulfilled"
                    ? normalizeRows(
                          paymentsResult.value
                      )
                    : [];

            setRecentRecords(
                buildRecentRecords(
                    bills,
                    payments
                )
            );
        } catch (err) {
            console.error(
                "Dashboard loading error:",
                err
            );

            setError(
                "Unable to load dashboard data."
            );
        } finally {
            setLoading(false);
        }
    }, []);


    /* =========================================================
       INITIAL LOAD
       ========================================================= */

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);


    /* =========================================================
       PAYMENT TOTAL
       ========================================================= */

    const totalPayments =
        paymentMethods.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.payment_count ??
                        item.count ??
                        0
                ),
            0
        );


    const paymentPercentage = (item) => {
        const count = Number(
            item.payment_count ??
                item.count ??
                0
        );

        return totalPayments
            ? Math.round(
                  (count / totalPayments) *
                      100
              )
            : 0;
    };


    /* =========================================================
       BILL TOTAL
       ========================================================= */

    const billTotal =
        billStatus.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.bill_count ??
                        item.count ??
                        0
                ),
            0
        );


    /* =========================================================
       LATEST PERIOD
       ========================================================= */

    const latestMonth =
        consumptionData.length > 0
            ? consumptionData[
                  consumptionData.length - 1
              ].month
            : "—";


    /* =========================================================
       RENDER
       ========================================================= */

    return (
        <div className="dashboard">

            {/* =================================================
                TOP BAR
               ================================================= */}

            <div className="dashboard-topbar">

                <div className="billing-cycle">

                    <span>
                        Latest billing period
                    </span>

                    <strong>
                        {latestMonth !== "—"
                            ? latestMonth
                            : "Loading..."}
                    </strong>

                    <span>
                        · Live utility billing data
                    </span>

                </div>


                <div className="topbar-status">

                    <span className="status-pill live">
                        LIVE DATA
                    </span>

                    <button
                        type="button"
                        className="dashboard-refresh"
                        onClick={loadDashboard}
                        disabled={loading}
                        title="Refresh dashboard"
                        aria-label="Refresh dashboard"
                    >
                        <RefreshCw
                            size={14}
                            className={
                                loading
                                    ? "dashboard-spin"
                                    : ""
                            }
                        />
                    </button>

                </div>

            </div>


            <div className="dashboard-content">

                {/* =================================================
                    ERROR
                   ================================================= */}

                {error && (
                    <div
                        style={{
                            marginBottom: "18px",
                            padding: "12px 15px",
                            border:
                                "1px solid rgba(239, 120, 120, 0.25)",
                            background:
                                "rgba(239, 120, 120, 0.06)",
                            color: "#d9a2a2",
                            fontSize: "13px",
                            borderRadius: "6px",
                        }}
                    >
                        {error}
                    </div>
                )}


                {/* =================================================
                    HEADER
                   ================================================= */}

                <div className="dashboard-heading">

                    <div>

                        <span className="eyebrow">
                            CONTROL CENTER
                        </span>

                        <h1>
                            Dashboard
                        </h1>

                    </div>


                    <button
                        type="button"
                        className="export-btn"
                        onClick={() =>
                            exportDashboard(
                                summary,
                                billStatus,
                                paymentMethods,
                                recentRecords,
                                revenueData
                            )
                        }
                    >
                        EXPORT
                    </button>

                </div>


                {/* =================================================
                    KPI ROW
                   ================================================= */}

                <section className="kpi-grid">

                    <KpiCard
                        label="CUSTOMERS"
                        value={
                            loading
                                ? "—"
                                : summary.total_customers
                        }
                        detail="REGISTERED"
                    />

                    <KpiCard
                        label="PROPERTIES"
                        value={
                            loading
                                ? "—"
                                : summary.total_properties
                        }
                        detail="REGISTERED"
                    />

                    <KpiCard
                        label="METERS"
                        value={
                            loading
                                ? "—"
                                : summary.total_meters
                        }
                        detail={
                            loading
                                ? "LOADING"
                                : `${summary.total_bills} TOTAL BILLS`
                        }
                    />

                    <KpiCard
                        label="REVENUE"
                        value={
                            loading
                                ? "—"
                                : `₹${formatMoney(
                                      summary.total_revenue
                                  )}`
                        }
                        detail="PAYMENT TOTAL"
                    />

                </section>


                {/* =================================================
                    GRIDPULSE KPI ROW (consumption intelligence)
                   ================================================= */}

                <GridPulseKpis
                    insights={insights}
                    loading={loading}
                    error={insightsError}
                />

                {/* =================================================
                    MAIN GRID
                   ================================================= */}

                <section className="main-grid">

                    {/* -------------------------------------------------
                        CONSUMPTION
                       ------------------------------------------------- */}

                    <Panel
                        title="Consumption · billed units per month"
                        meta={
                            consumptionData.length
                                ? "LIVE DATA"
                                : "NO DATA"
                        }
                    >

                        {consumptionData.length >
                        0 ? (

                            <ResponsiveContainer
                                width="100%"
                                height={270}
                            >

                                <AreaChart
                                    data={
                                        consumptionData
                                    }
                                >

                                    <defs>

                                        <linearGradient
                                            id="consumptionGradient"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >

                                            <stop
                                                offset="0%"
                                                stopColor="#5FD0BE"
                                                stopOpacity={
                                                    0.28
                                                }
                                            />

                                            <stop
                                                offset="100%"
                                                stopColor="#5FD0BE"
                                                stopOpacity={
                                                    0
                                                }
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
                                            background:
                                                "#0d1214",
                                            border:
                                                "1px solid rgba(178,208,212,.15)",
                                            color:
                                                "#eaf1f1",
                                        }}
                                        formatter={(
                                            value
                                        ) => [
                                            `${Number(
                                                value
                                            ).toLocaleString(
                                                "en-IN"
                                            )} units (kWh + kL)`,
                                            "Billed consumption",
                                        ]}
                                    />


                                    <Area
                                        type="monotone"
                                        dataKey="consumption"
                                        stroke="#5FD0BE"
                                        fill="url(#consumptionGradient)"
                                        strokeWidth={2}
                                    />

                                </AreaChart>

                            </ResponsiveContainer>

                        ) : (

                            <EmptyState
                                text={
                                    loading
                                        ? "Loading consumption data..."
                                        : "No consumption data available"
                                }
                            />

                        )}

                    </Panel>


                    {/* -------------------------------------------------
                        RIGHT STACK
                       ------------------------------------------------- */}

                    <div className="right-stack">

                        {/* BILL STATUS */}

                        <Panel
                            title="Billing status"
                            meta={
                                billTotal
                                    ? `${billTotal} BILLS`
                                    : "NO DATA"
                            }
                        >

                            {billStatus.length >
                            0 ? (

                                <>

                                    <div className="status-bar">

                                        {billStatus.map(
                                            (item) => {

                                                const count =
                                                    Number(
                                                        item.bill_count ??
                                                            item.count ??
                                                            0
                                                    );

                                                return (
                                                    <div
                                                        key={
                                                            item.bill_status
                                                        }
                                                        className={`status-segment ${String(
                                                            item.bill_status
                                                        )
                                                            .toLowerCase()
                                                            .replaceAll(
                                                                " ",
                                                                "-"
                                                            )}`}
                                                        style={{
                                                            flex:
                                                                billTotal
                                                                    ? count /
                                                                      billTotal
                                                                    : 1,
                                                        }}
                                                    />
                                                );
                                            }
                                        )}

                                    </div>


                                    <div className="legend-list">

                                        {billStatus.map(
                                            (item) => (
                                                <div
                                                    key={
                                                        item.bill_status
                                                    }
                                                >

                                                    <span>
                                                        {
                                                            item.bill_status
                                                        }
                                                    </span>

                                                    <b>
                                                        {Number(
                                                            item.bill_count ??
                                                                item.count ??
                                                                0
                                                        )}
                                                    </b>

                                                </div>
                                            )
                                        )}

                                    </div>

                                </>

                            ) : (

                                <EmptyState
                                    text="No billing status data available"
                                />

                            )}

                        </Panel>


                        {/* PAYMENT METHODS */}

                        <Panel
                            title="Payment distribution"
                            meta="MODE"
                        >

                            {paymentMethods.length >
                            0 ? (

                                <div className="distribution">

                                    {paymentMethods.map(
                                        (item) => (
                                            <div
                                                className="distribution-row"
                                                key={
                                                    item.payment_mode
                                                }
                                            >

                                                <span>
                                                    {
                                                        item.payment_mode
                                                    }
                                                </span>


                                                <div className="distribution-track">

                                                    <i
                                                        style={{
                                                            width: `${paymentPercentage(
                                                                item
                                                            )}%`,
                                                        }}
                                                    />

                                                </div>


                                                <b>
                                                    {
                                                        paymentPercentage(
                                                            item
                                                        )
                                                    }
                                                    %
                                                </b>

                                            </div>
                                        )
                                    )}

                                </div>

                            ) : (

                                <EmptyState
                                    text="No payment data available"
                                />

                            )}

                        </Panel>

                    </div>


                    {/* -------------------------------------------------
                        RECENT ACTIVITY
                       ------------------------------------------------- */}

                    <Panel
                        title="Recent activity"
                        meta="LIVE · LAST 6"
                    >

                        {recentRecords.length >
                        0 ? (

                            <div className="records-table">

                                {recentRecords.map(
                                    (record) => (
                                        <div
                                            className="record-row"
                                            key={
                                                record.id
                                            }
                                        >

                                            <span>
                                                {
                                                    record.id
                                                }
                                            </span>


                                            <strong>
                                                {
                                                    record.label
                                                }
                                            </strong>


                                            <span>
                                                {
                                                    record.value
                                                }
                                            </span>


                                            <b
                                                className={`record-tag ${record.status
                                                    .toLowerCase()
                                                    .replaceAll(
                                                        " ",
                                                        "-"
                                                    )}`}
                                            >
                                                {
                                                    record.status
                                                }
                                            </b>

                                        </div>
                                    )
                                )}

                            </div>

                        ) : (

                            <EmptyState
                                text={
                                    loading
                                        ? "Loading recent activity..."
                                        : "No recent activity available"
                                }
                            />

                        )}

                    </Panel>


                    {/* -------------------------------------------------
                        REVENUE
                       ------------------------------------------------- */}

                    <Panel
                        title="Monthly revenue"
                        meta="₹"
                    >

                        {revenueData.length >
                        0 ? (

                            <ResponsiveContainer
                                width="100%"
                                height={270}
                            >

                                <BarChart
                                    data={
                                        revenueData
                                    }
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
                                            background:
                                                "#0d1214",
                                            border:
                                                "1px solid rgba(178,208,212,.15)",
                                            color:
                                                "#eaf1f1",
                                        }}
                                        formatter={(
                                            value
                                        ) => [
                                            `₹${Number(
                                                value
                                            ).toLocaleString(
                                                "en-IN"
                                            )}`,
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

                            <EmptyState
                                text={
                                    loading
                                        ? "Loading revenue data..."
                                        : "No revenue data available"
                                }
                            />

                        )}

                    </Panel>

                </section>

                <section className="gp-grid-2" style={{ marginTop: 20 }}>
                    <AlertPreview insights={insights} />
                    <ProjectedBillPanel title="Projected month-end bill" />
                </section>

            </div>

        </div>
    );
}


/* =========================================================
   KPI CARD
   ========================================================= */

function KpiCard({
    label,
    value,
    detail,
}) {
    return (
        <div className="kpi-card">

            <span>
                {label}
            </span>

            <strong>
                {value}
            </strong>

            <small>
                {detail}
            </small>

        </div>
    );
}


/* =========================================================
   PANEL
   ========================================================= */

function Panel({
    title,
    meta,
    children,
}) {
    return (
        <section className="dashboard-panel">

            <div className="panel-heading">

                <h2>
                    {title}
                </h2>

                {meta && (
                    <span>
                        {meta}
                    </span>
                )}

            </div>

            {children}

        </section>
    );
}


/* =========================================================
   EMPTY STATE
   ========================================================= */

function EmptyState({
    text,
}) {
    return (
        <div
            style={{
                height: "270px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#59686B",
                fontSize: "13px",
            }}
        >
            {text}
        </div>
    );
}


/* =========================================================
   DATA HELPERS
   ========================================================= */

function normalizeRows(data) {
    if (Array.isArray(data)) {
        return data;
    }

    if (
        data &&
        Array.isArray(data.rows)
    ) {
        return data.rows;
    }

    if (
        data &&
        typeof data === "object"
    ) {
        return [data];
    }

    return [];
}


function firstRow(data) {
    return (
        normalizeRows(data)[0] || {
            total_customers: 0,
            total_properties: 0,
            total_meters: 0,
            total_bills: 0,
            total_revenue: 0,
        }
    );
}


function formatMonth(value) {
    if (!value) {
        return "—";
    }

    const date =
        new Date(
            `${value}-01T00:00:00`
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return String(
            value
        ).toUpperCase();
    }

    // The time series now spans several years, so the label carries the
    // year (JAN 25, JAN 26) to keep each month distinct on the chart axis.
    return date
        .toLocaleString(
            "en-US",
            {
                month: "short",
                year: "2-digit",
            }
        )
        .toUpperCase();
}


/* =========================================================
   RECENT ACTIVITY
   ========================================================= */

function buildRecentRecords(
    bills,
    payments
) {
    const billRecords =
        bills.map(
            (bill) => ({
                id: `BILL-${bill.bill_id}`,

                label:
                    `MTR-${bill.meter_id}`,

                value:
                    `${Math.max(
                        0,
                        Number(
                            bill.current_reading ||
                                0
                        ) -
                            Number(
                                bill.previous_reading ||
                                    0
                            )
                    ).toLocaleString("en-IN", { maximumFractionDigits: 2 })} ${bill.unit || "units"}`,

                status:
                    String(
                        bill.bill_status ||
                            "UNKNOWN"
                    ).toUpperCase(),

                date:
                    bill.billing_date ||
                    bill.billing_month ||
                    "",
            })
        );


    const paymentRecords =
        payments.map(
            (payment) => ({
                id: `PAY-${payment.payment_id}`,

                label:
                    `PAYMENT · ${
                        payment.payment_mode ||
                        "UNKNOWN"
                    }`,

                value:
                    `₹${formatMoney(
                        payment.amount
                    )}`,

                status: "RECEIVED",

                date:
                    payment.payment_date ||
                    "",
            })
        );


    return [
        ...billRecords,
        ...paymentRecords,
    ]
        .sort(
            (a, b) =>
                new Date(
                    b.date || 0
                ) -
                new Date(
                    a.date || 0
                )
        )
        .slice(0, 6);
}


/* =========================================================
   FORMATTERS
   ========================================================= */

function formatMoney(value) {
    return Number(
        value || 0
    ).toLocaleString(
        "en-IN"
    );
}


/* =========================================================
   EXPORT
   ========================================================= */

function exportDashboard(
    summary,
    billStatus,
    paymentMethods,
    recentRecords,
    revenueData
) {
    const rows = [
        [
            "GRIDPULSE DASHBOARD"
        ],

        [],

        [
            "Metric",
            "Value"
        ],

        [
            "Customers",
            summary.total_customers
        ],

        [
            "Properties",
            summary.total_properties
        ],

        [
            "Meters",
            summary.total_meters
        ],

        [
            "Bills",
            summary.total_bills
        ],

        [
            "Revenue",
            summary.total_revenue
        ],

        [],

        [
            "Recent Activity"
        ],

        [
            "ID",
            "Label",
            "Value",
            "Status"
        ],

        ...recentRecords.map(
            (record) => [
                record.id,
                record.label,
                record.value,
                record.status,
            ]
        ),

        [],

        [
            "Monthly Revenue"
        ],

        [
            "Month",
            "Revenue"
        ],

        ...revenueData.map(
            (item) => [
                item.month,
                item.revenue,
            ]
        ),

        [],

        [
            "Payment Methods"
        ],

        [
            "Method",
            "Count"
        ],

        ...paymentMethods.map(
            (item) => [
                item.payment_mode,
                item.payment_count ??
                    item.count ??
                    0,
            ]
        ),

        [],

        [
            "Billing Status"
        ],

        [
            "Status",
            "Count"
        ],

        ...billStatus.map(
            (item) => [
                item.bill_status,
                item.bill_count ??
                    item.count ??
                    0,
            ]
        ),
    ];


    const csv =
        rows
            .map(
                (row) =>
                    row
                        .map(
                            (cell) =>
                                `"${String(
                                    cell ??
                                        ""
                                ).replace(
                                    /"/g,
                                    '""'
                                )}"`
                        )
                        .join(",")
            )
            .join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;",
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );

    link.href = url;

    link.download =
        `gridpulse-dashboard-${new Date()
            .toISOString()
            .slice(0, 10)}.csv`;

    document.body.appendChild(
        link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
        url
    );
}


export default Dashboard;


/* =========================================================
   GRIDPULSE KPIs
   ========================================================= */

function GridPulseKpis({ insights, loading, error }) {
    const elec = insights?.consumption_by_service?.find((s) => s.service_type === "Electricity");
    const water = insights?.consumption_by_service?.find((s) => s.service_type === "Water");
    const est = insights?.estimated_month_end_bill;
    const highAlerts = (insights?.alert_preview || []).filter((a) => a.severity === "HIGH").length;
    const dash = loading && !insights ? "—" : null;

    if (error && !insights) {
        return (
            <div className="op-error" style={{ marginTop: 18 }}>
                Consumption intelligence unavailable: {error}
            </div>
        );
    }

    return (
        <section className="kpi-grid" style={{ marginTop: 18 }}>
            <KpiCard
                label="MONTH-TO-DATE · ELECTRICITY"
                value={dash || qty(elec?.month_to_date, elec?.unit, 0)}
                detail={water ? `WATER ${qty(water.month_to_date, water.unit, 1)} · AS OF ${dateTime(insights?.as_of)}` : ""}
            />
            <KpiCard
                label="CHANGE VS SAME SPAN LAST MONTH"
                value={dash || pct(elec?.change_pct)}
                detail={water ? `ELECTRICITY · WATER ${pct(water.change_pct)}` : ""}
            />
            <KpiCard
                label="ESTIMATED MONTH-END BILL"
                value={dash || money(est?.estimated_total_amount)}
                detail={est ? `ESTIMATE · ${est.meters_estimated} METERS${est.meters_insufficient_data ? ` · ${est.meters_insufficient_data} INSUFFICIENT DATA` : ""}` : ""}
            />
            <KpiCard
                label="ACTIVE CONSUMPTION ALERTS"
                value={dash || num(insights?.active_alerts, 0)}
                detail={insights ? `${highAlerts} HIGH IN PREVIEW · NOT YET RESOLVED` : ""}
            />
        </section>
    );
}


/* =========================================================
   ALERT PREVIEW
   ========================================================= */

function AlertPreview({ insights }) {
    const rows = insights?.alert_preview || [];
    return (
        <section className="op-panel">
            <div className="op-panel-head" style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                    <h3>Consumption alerts</h3>
                    <span>MOST SEVERE ACTIVE ALERTS · INDICATORS FOR INVESTIGATION</span>
                </div>
                <Link className="gp-btn" to="/alerts">ALL ALERTS</Link>
            </div>
            {rows.length === 0 ? (
                <div className="op-empty">{insights ? "No active alerts." : "Loading alerts…"}</div>
            ) : (
                <div className="op-table-wrap">
                    <table className="op-table">
                        <thead>
                            <tr><th>Meter</th><th>Severity</th><th>Observed</th><th>Deviation</th><th></th></tr>
                        </thead>
                        <tbody>
                            {rows.map((a) => (
                                <tr key={a.alert_id}>
                                    <td><b>MTR-{a.meter_id}</b><br /><small style={{ color: "#526b6e" }}>{a.alert_type.replaceAll("_", " ").toLowerCase()}</small></td>
                                    <td><span className={`op-badge ${statusClass(a.severity)}`}>{a.severity}</span></td>
                                    <td>{qty(a.observed_consumption, a.unit, 2)}</td>
                                    <td>{a.deviation_pct === null ? "—" : `${pct(a.deviation_pct)} vs avg`}</td>
                                    <td><Link to={`/alerts?alert=${a.alert_id}`} style={{ color: "#5FD0BE", fontSize: 11 }}>OPEN</Link></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
