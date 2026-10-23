
import { useCallback, useEffect, useState } from "react";
import {
    Activity,
    RefreshCw,
    TrendingUp,
    Gauge,
    CalendarDays,
    AlertCircle,
} from "lucide-react";
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
} from "recharts";

import {
    getConsumption,
    getRevenue,
    getMeters,
    getReadings,
} from "../services/api";

import "../styles/consumption-analytics.css";

function rowsOf(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.content)) return data.content;
    if (Array.isArray(data?.items)) return data.items;
    return [];
}

function formatMonth(value) {
    if (!value) return "Unknown";
    const match = String(value).match(/^(\d{4})-(\d{2})/);
    if (!match) return String(value);

    return new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        1
    ).toLocaleDateString("en-IN", {
        month: "short",
        year: "2-digit",
    });
}

function formatNumber(value) {
    return Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
    });
}

export default function ConsumptionAnalytics() {
    const [consumption, setConsumption] = useState([]);
    const [revenue, setRevenue] = useState([]);
    const [meters, setMeters] = useState([]);
    const [readings, setReadings] = useState([]);

    const [meterId, setMeterId] = useState("all");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState([]);

    const loadData = useCallback(async () => {
        setLoading(true);
        setErrors([]);

        const requests = await Promise.allSettled([
            getConsumption(),
            getRevenue(),
            getMeters(),
            getReadings(),
        ]);

        const setters = [
            setConsumption,
            setRevenue,
            setMeters,
            setReadings,
        ];

        const labels = [
            "Monthly consumption",
            "Monthly revenue",
            "Meters",
            "Meter readings",
        ];

        const failures = [];

        requests.forEach((result, index) => {
            if (result.status === "fulfilled") {
                setters[index](rowsOf(result.value));
            } else {
                console.error(
                    `${labels[index]} request failed:`,
                    result.reason
                );
                failures.push(
                    `${labels[index]}: ${
                        result.reason?.message || "Request failed"
                    }`
                );
            }
        });

        setErrors(failures);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const filteredReadings = readings.filter((reading) => {
        const readingMeterId =
            reading.meter_id ?? reading.meterId;
        const rawDate =
            reading.reading_date ??
            reading.readingDate ??
            reading.timestamp;

        if (meterId !== "all" &&
            String(readingMeterId) !== meterId) {
            return false;
        }

        if (!rawDate) return !fromDate && !toDate;

        const date = String(rawDate).slice(0, 10);

        if (fromDate && date < fromDate) return false;
        if (toDate && date > toDate) return false;

        return true;
    });

    const consumptionData = consumption.map((item) => ({
        month: formatMonth(item.month),
        consumption: Number(item.consumption || 0),
    }));

    const revenueData = revenue.map((item) => ({
        month: formatMonth(item.month),
        revenue: Number(item.revenue || 0),
    }));

    const totalConsumption = consumptionData.reduce(
        (sum, item) => sum + item.consumption,
        0
    );

    const totalRevenue = revenueData.reduce(
        (sum, item) => sum + item.revenue,
        0
    );

    return (
        <main className="analytics-page">
            <header className="analytics-header">
                <div>
                    <div className="analytics-eyebrow">
                        GRIDFLOW / TIME-SERIES INTELLIGENCE
                    </div>
                    <h1>Consumption Analytics</h1>
                    <p>
                        Explore monthly utility consumption,
                        revenue and historical meter readings.
                    </p>
                </div>

                <button
                    className="analytics-refresh"
                    onClick={loadData}
                    disabled={loading}
                >
                    <RefreshCw size={16} />
                    {loading ? "Loading..." : "Refresh"}
                </button>
            </header>

            {errors.length > 0 && (
                <div className="analytics-warning" role="status">
                    <AlertCircle size={18} />
                    <div>
                        <strong>
                            Some analytics data is unavailable
                        </strong>
                        {errors.map((error) => (
                            <p key={error}>{error}</p>
                        ))}
                    </div>
                </div>
            )}

            <section className="analytics-kpis">
                <article className="analytics-card">
                    <span>
                        <Activity size={17} /> Total consumption
                    </span>
                    <strong>
                        {loading
                            ? "—"
                            : `${formatNumber(totalConsumption)} kWh`}
                    </strong>
                    <small>Sum of returned monthly data</small>
                </article>

                <article className="analytics-card">
                    <span>
                        <TrendingUp size={17} /> Total revenue
                    </span>
                    <strong>
                        {loading
                            ? "—"
                            : `₹${formatNumber(totalRevenue)}`}
                    </strong>
                    <small>Sum of returned monthly data</small>
                </article>

                <article className="analytics-card">
                    <span>
                        <Gauge size={17} /> Meters
                    </span>
                    <strong>
                        {loading ? "—" : meters.length}
                    </strong>
                    <small>Records returned by the API</small>
                </article>

                <article className="analytics-card">
                    <span>
                        <CalendarDays size={17} /> Readings
                    </span>
                    <strong>
                        {loading ? "—" : filteredReadings.length}
                    </strong>
                    <small>Records matching the filters</small>
                </article>
            </section>

            <section className="analytics-chart-grid">
                <article className="analytics-panel">
                    <div className="analytics-panel-heading">
                        <div>
                            <h2>Monthly consumption</h2>
                            <p>Consumption reported by the API</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="analytics-empty">
                            Loading consumption...
                        </div>
                    ) : consumptionData.length === 0 ? (
                        <div className="analytics-empty">
                            No consumption data available.
                        </div>
                    ) : (
                        <div className="analytics-chart">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={consumptionData}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="var(--analytics-grid)"
                                    />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="consumption"
                                        name="Consumption"
                                        stroke="#5fd0be"
                                        strokeWidth={2.5}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </article>

                <article className="analytics-panel">
                    <div className="analytics-panel-heading">
                        <div>
                            <h2>Monthly revenue</h2>
                            <p>Payments reported by the API</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="analytics-empty">
                            Loading revenue...
                        </div>
                    ) : revenueData.length === 0 ? (
                        <div className="analytics-empty">
                            No revenue data available.
                        </div>
                    ) : (
                        <div className="analytics-chart">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueData}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="var(--analytics-grid)"
                                    />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value) =>
                                            `₹${formatNumber(value)}`
                                        }
                                    />
                                    <Bar
                                        dataKey="revenue"
                                        name="Revenue"
                                        fill="#f2a93b"
                                        radius={[5, 5, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </article>
            </section>

            <section className="analytics-panel analytics-history">
                <div className="analytics-panel-heading">
                    <div>
                        <h2>Meter reading history</h2>
                        <p>
                            Filter the reading records returned by
                            the current API.
                        </p>
                    </div>
                </div>

                <div className="analytics-filters">
                    <label>
                        Meter
                        <select
                            value={meterId}
                            onChange={(event) =>
                                setMeterId(event.target.value)
                            }
                        >
                            <option value="all">All meters</option>
                            {meters.map((meter) => {
                                const id =
                                    meter.meter_id ?? meter.meterId ?? meter.id;
                                return (
                                    <option key={id} value={String(id)}>
                                        {meter.meter_number ??
                                            meter.meterNumber ??
                                            `Meter ${id}`}
                                    </option>
                                );
                            })}
                        </select>
                    </label>

                    <label>
                        From
                        <input
                            type="date"
                            value={fromDate}
                            max={toDate || undefined}
                            onChange={(event) =>
                                setFromDate(event.target.value)
                            }
                        />
                    </label>

                    <label>
                        To
                        <input
                            type="date"
                            value={toDate}
                            min={fromDate || undefined}
                            onChange={(event) =>
                                setToDate(event.target.value)
                            }
                        />
                    </label>

                    <button
                        className="analytics-clear"
                        onClick={() => {
                            setMeterId("all");
                            setFromDate("");
                            setToDate("");
                        }}
                    >
                        Clear filters
                    </button>
                </div>

                <div className="analytics-table-wrap">
                    <table className="analytics-table">
                        <thead>
                            <tr>
                                <th>Meter ID</th>
                                <th>Reading date</th>
                                <th>Reading value</th>
                                <th>Consumption</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReadings.map((reading, index) => (
                                <tr
                                    key={
                                        reading.reading_no ??
                                        reading.readingNo ??
                                        `${reading.meter_id}-${reading.reading_date}-${index}`
                                    }
                                >
                                    <td>
                                        {reading.meter_id ??
                                            reading.meterId ??
                                            "—"}
                                    </td>
                                    <td>
                                        {reading.reading_date ??
                                            reading.readingDate ??
                                            reading.timestamp ??
                                            "—"}
                                    </td>
                                    <td>
                                        {formatNumber(
                                            reading.reading_value ??
                                            reading.readingValue ??
                                            reading.reading ??
                                            reading.value
                                        )}
                                    </td>
                                    <td>
                                        {reading.consumption == null
                                            ? "—"
                                            : formatNumber(reading.consumption)}
                                    </td>
                                </tr>
                            ))}

                            {!loading && filteredReadings.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="analytics-empty">
                                        No readings match these filters.
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
