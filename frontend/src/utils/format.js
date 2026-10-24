/* Shared formatting helpers for the GridPulse pages (Asia/Kolkata, en-IN). */

const TZ = "Asia/Kolkata";

export const money = (v) =>
    v === null || v === undefined || v === ""
        ? "—"
        : `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const num = (v, digits = 2) =>
    v === null || v === undefined || v === ""
        ? "—"
        : Number(v).toLocaleString("en-IN", { maximumFractionDigits: digits });

export const qty = (v, unit, digits = 2) =>
    v === null || v === undefined || v === "" ? "—" : `${num(v, digits)} ${unit || ""}`.trim();

export const pct = (v) => {
    if (v === null || v === undefined || v === "") return "—";
    const n = Number(v);
    return `${n > 0 ? "+" : ""}${n.toLocaleString("en-IN", { maximumFractionDigits: 1 })}%`;
};

export const date = (v) =>
    v
        ? new Date(v.length === 10 ? `${v}T00:00:00+05:30` : v).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              timeZone: TZ,
          })
        : "—";

export const dateTime = (v) =>
    v
        ? new Date(v).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZone: TZ,
          })
        : "—";

/** YYYY-MM-DD of today in India, for date inputs. */
export const todayIst = () =>
    new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());

export const addDays = (isoDate, days) => {
    const d = new Date(`${isoDate}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
};

export const statusClass = (s) => String(s || "").toLowerCase().replaceAll(" ", "-");

export const statusLabel = (s) => String(s || "—").replaceAll("_", " ");

/** Download rows as a CSV file (client-side, from data already returned by the API). */
export function downloadCsv(filename, header, rows) {
    const escape = (value) => {
        const t = value === null || value === undefined ? "" : String(value);
        return /[",\n]/.test(t) ? `"${t.replaceAll('"', '""')}"` : t;
    };
    const csv = [header, ...rows].map((r) => r.map(escape).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export const chartTooltip = {
    contentStyle: {
        background: "#0d1214",
        border: "1px solid rgba(178,208,212,.15)",
        color: "#eaf1f1",
        fontSize: 12,
    },
    labelStyle: { color: "#9fb8ba" },
    // Recharts colours the value with the series/cell fill by default, which
    // is unreadable for the dark "days after" bars; keep it high-contrast.
    itemStyle: { color: "#eaf1f1" },
};

export const axisProps = {
    stroke: "#59686B",
    tickLine: false,
    axisLine: false,
    fontSize: 10,
};
