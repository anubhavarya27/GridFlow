    import { useEffect, useMemo, useState } from "react";
    import {
        getCustomers,
        getProperties,
        getMeters,
        getReadings,
        getServices,
        getTariffs,
        getBills,
        getPayments,
        getOwnerships,
        getPropertyMeters,
        getMeterServices,
        getCustomerPhones,
        getCustomerEmails,
        getPaymentSchedules,
        getCards,
        getCardPayments,
        getCashPayments,
        getUpiPayments,
        getWaterServices,
        getElectricityServices,
    } from "../services/api";

    import "../styles/database-explorer.css";

    const TABLES = [
        "CUSTOMER",
        "CUSTOMER_PHONE",
        "CUSTOMER_EMAIL",
        "PROPERTY",
        "CUSTOMER_OWNS_PROPERTY",
        "METER",
        "PROPERTY_INCORPORATE_METER",
        "METER_READING",
        "UTILITY_SERVICE",
        "ELECTRICITY_SERVICE",
        "WATER_SERVICE",
        "METER_SERVICE",
        "TARIFF",
        "BILL",
        "PAYMENT_SCHEDULE",
        "PAYMENT",
        "CARD",
        "CARD_PAYMENT",
        "CASH_PAYMENT",
        "UPI_PAYMENT",
    ];

    const TABLE_CONFIG = {
        ELECTRICITY_SERVICE: {
        label: "Electricity Services",
        columns: ["service_id", "voltage_level"],
        load: getElectricityServices,
    },

    WATER_SERVICE: {
        label: "Water Services",
        columns: ["service_id", "water_source"],
        load: getWaterServices,
    },
        CUSTOMER_PHONE: {
        label: "Customer Phones",
        columns: ["cust_id", "phone_no"],
        load: getCustomerPhones,
    },

    CUSTOMER_EMAIL: {
        label: "Customer Emails",
        columns: ["cust_id", "email"],
        load: getCustomerEmails,
    },

    PAYMENT_SCHEDULE: {
        label: "Payment Schedules",
        columns: ["payment_sequence", "payment_due_date"],
        load: getPaymentSchedules,
    },

    CARD: {
        label: "Cards",
        columns: ["card_no", "bank_name"],
        load: getCards,
    },

    CARD_PAYMENT: {
        label: "Card Payments",
        columns: ["payment_id", "card_no"],
        load: getCardPayments,
    },

    CASH_PAYMENT: {
        label: "Cash Payments",
        columns: ["payment_id", "receipt_no"],
        load: getCashPayments,
    },

    UPI_PAYMENT: {
        label: "UPI Payments",
        columns: ["payment_id", "upi_id", "upi_app"],
        load: getUpiPayments,
    },
        CUSTOMER: {
            label: "Customers",
            columns: ["cust_id", "cust_name", "apartment", "flat_no", "city", "dob"],
            load: getCustomers,
        },
        PROPERTY: {
            label: "Properties",
            columns: ["property_id", "property_name", "occupancy_status"],
            load: getProperties,
        },
        METER: {
            label: "Meters",
            columns: ["meter_id", "capacity", "installation_date", "meter_status"],
            load: getMeters,
        },
        METER_READING: {
            label: "Meter Readings",
            columns: [
                "meter_id",
                "reading_no",
                "reading_date",
                "reading_value",
                "reading_status",
            ],
            load: getReadings,
        },
        UTILITY_SERVICE: {
            label: "Utility Services",
            columns: ["service_id", "fixed_charge", "unit_rate", "tax"],
            load: getServices,
        },
        TARIFF: {
            label: "Tariffs",
            columns: ["tariff_code", "unit_rate"],
            load: getTariffs,
        },
        BILL: {
            label: "Bills",
            columns: [
                "meter_id",
                "billing_month",
                "bill_id",
                "billing_date",
                "previous_reading",
                "current_reading",
                "tariff_code",
                "bill_status",
            ],
            load: getBills,
        },
        PAYMENT: {
            label: "Payments",
            columns: [
                "bill_id",
                "payment_sequence",
                "payment_id",
                "payment_date",
                "amount",
                "payment_mode",
                "payment_due_date",
            ],
            load: getPayments,
        },
        CUSTOMER_OWNS_PROPERTY: {
            label: "Ownership",
            columns: [
                "cust_id",
                "property_id",
                "ownership_date",
                "ownership_type",
            ],
            load: getOwnerships,
        },
        PROPERTY_INCORPORATE_METER: {
            label: "Property / Meter",
            columns: ["property_id", "meter_id"],
            load: getPropertyMeters,
        },
        METER_SERVICE: {
            label: "Meter / Service",
            columns: ["meter_id", "service_id"],
            load: getMeterServices,
        },
    };

    const LOCAL_DATA = {
        CUSTOMER: [
            {
                cust_id: 1,
                cust_name: "Arun Kumar",
                apartment: "Green Valley Apartments",
                flat_no: "A-101",
                city: "Chennai",
                dob: "1998-05-12",
            },
            {
                cust_id: 2,
                cust_name: "Priya Sharma",
                apartment: "Green Valley Apartments",
                flat_no: "A-102",
                city: "Chennai",
                dob: "1995-08-21",
            },
            {
                cust_id: 3,
                cust_name: "Rahul Menon",
                apartment: "Lake View Residency",
                flat_no: "B-201",
                city: "Chennai",
                dob: "1992-03-15",
            },
            {
                cust_id: 4,
                cust_name: "Sneha Reddy",
                apartment: "Lake View Residency",
                flat_no: "B-202",
                city: "Chennai",
                dob: "1997-11-02",
            },
            {
                cust_id: 5,
                cust_name: "Karthik Raj",
                apartment: "Sunrise Towers",
                flat_no: "C-301",
                city: "Chennai",
                dob: "1990-07-18",
            },
        ],

        PROPERTY: [
            {
                property_id: 101,
                property_name: "Green Valley Apartments",
                occupancy_status: "Occupied",
            },
            {
                property_id: 102,
                property_name: "Lake View Residency",
                occupancy_status: "Occupied",
            },
            {
                property_id: 103,
                property_name: "Sunrise Towers",
                occupancy_status: "Occupied",
            },
            {
                property_id: 104,
                property_name: "Palm Grove",
                occupancy_status: "Occupied",
            },
            {
                property_id: 105,
                property_name: "City Heights",
                occupancy_status: "Occupied",
            },
            {
                property_id: 106,
                property_name: "Maple Residency",
                occupancy_status: "Vacant",
            },
        ],

        METER: [
            {
                meter_id: 1001,
                capacity: 5,
                installation_date: "2020-07-01",
                meter_status: "Active",
            },
            {
                meter_id: 1002,
                capacity: 5,
                installation_date: "2020-07-02",
                meter_status: "Active",
            },
            {
                meter_id: 1003,
                capacity: 7.5,
                installation_date: "2019-09-01",
                meter_status: "Active",
            },
            {
                meter_id: 1004,
                capacity: 7.5,
                installation_date: "2019-09-02",
                meter_status: "Active",
            },
            {
                meter_id: 1005,
                capacity: 10,
                installation_date: "2018-12-01",
                meter_status: "Active",
            },
        ],

        METER_READING: [
            {
                meter_id: 1001,
                reading_no: 1,
                reading_date: "2025-01-01",
                reading_value: 1200,
                reading_status: "Valid",
            },
            {
                meter_id: 1001,
                reading_no: 2,
                reading_date: "2025-02-01",
                reading_value: 1350,
                reading_status: "Valid",
            },
            {
                meter_id: 1001,
                reading_no: 3,
                reading_date: "2025-03-01",
                reading_value: 1510,
                reading_status: "Valid",
            },
            {
                meter_id: 1002,
                reading_no: 1,
                reading_date: "2025-01-01",
                reading_value: 800,
                reading_status: "Valid",
            },
        ],

        BILL: [
            {
                meter_id: 1001,
                billing_month: "2025-01-01",
                bill_id: 5001,
                billing_date: "2025-01-31",
                previous_reading: 1050,
                current_reading: 1200,
                tariff_code: "ELEC-A",
                bill_status: "Paid",
            },
            {
                meter_id: 1001,
                billing_month: "2025-02-01",
                bill_id: 5002,
                billing_date: "2025-02-28",
                previous_reading: 1200,
                current_reading: 1350,
                tariff_code: "ELEC-A",
                bill_status: "Paid",
            },
            {
                meter_id: 1001,
                billing_month: "2025-03-01",
                bill_id: 5003,
                billing_date: "2025-03-31",
                previous_reading: 1350,
                current_reading: 1510,
                tariff_code: "ELEC-A",
                bill_status: "Pending",
            },
        ],

        PAYMENT: [
            {
                bill_id: 5001,
                payment_sequence: 1,
                payment_id: 9001,
                payment_date: "2025-02-05",
                amount: 1320,
                payment_mode: "Card",
                payment_due_date: "2025-02-10",
            },
            {
                bill_id: 5002,
                payment_sequence: 1,
                payment_id: 9002,
                payment_date: "2025-03-05",
                amount: 1320,
                payment_mode: "UPI",
                payment_due_date: "2025-02-10",
            },
            {
                bill_id: 5004,
                payment_sequence: 1,
                payment_id: 9003,
                payment_date: "2025-02-06",
                amount: 630,
                payment_mode: "Cash",
                payment_due_date: "2025-02-10",
            },
        ],

        CUSTOMER_OWNS_PROPERTY: [
            {
                cust_id: 1,
                property_id: 101,
                ownership_date: "2020-06-15",
                ownership_type: "Owner",
            },
            {
                cust_id: 2,
                property_id: 101,
                ownership_date: "2022-03-10",
                ownership_type: "Co-Owner",
            },
        ],

        PROPERTY_INCORPORATE_METER: [
            {
                property_id: 101,
                meter_id: 1001,
            },
            {
                property_id: 101,
                meter_id: 1002,
            },
        ],

        METER_SERVICE: [
            {
                meter_id: 1001,
                service_id: 1,
            },
            {
                meter_id: 1002,
                service_id: 2,
            },
        ],

        UTILITY_SERVICE: [
            {
                service_id: 1,
                fixed_charge: 50,
                unit_rate: 8.5,
                tax: 5,
            },
            {
                service_id: 2,
                fixed_charge: 30,
                unit_rate: 6,
                tax: 5,
            },
        ],

        TARIFF: [
            {
                tariff_code: "ELEC-A",
                unit_rate: 8.5,
            },
            {
                tariff_code: "ELEC-B",
                unit_rate: 7,
            },
            {
                tariff_code: "WATER-A",
                unit_rate: 6,
            },
            {
                tariff_code: "WATER-B",
                unit_rate: 5.5,
            },
        ],
    };

    function DatabaseExplorer() {
        const [activeTable, setActiveTable] = useState("CUSTOMER");
        const [activeTab, setActiveTab] = useState("tables");
        const [records, setRecords] = useState([]);
        const [loading, setLoading] = useState(false);
        const [search, setSearch] = useState("");

        const config = TABLE_CONFIG[activeTable];

        useEffect(() => {
            async function loadTable() {
                if (!config?.load) {
                    setRecords([]);
                    return;
                }

                try {
        setLoading(true);

        const data = await config?.load?.();

        setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
        console.error(`Failed to load ${activeTable}:`, error);
        setRecords([]);
    } finally {
        setLoading(false);
    }
            }

            loadTable();
        }, [activeTable, config]);

        const filteredRecords = useMemo(() => {
            if (!search.trim()) return records;

            const term = search.toLowerCase();

            return records.filter((row) =>
                Object.values(row).some((value) =>
                    String(value).toLowerCase().includes(term)
                )
            );
        }, [records, search]);

        return (
            <div className="database-page">
                <div className="database-header">
                    <div>
                        <span className="eyebrow">DATABASE</span>
                        <h1>Database Explorer</h1>
                        <p>
                            Inspect tables, records and relationships in the
                            utility billing database.
                        </p>
                    </div>

                    <div className="database-tabs">
    {["tables", "records"].map((tab) => (
        <button
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
        >
            {tab.toUpperCase()}
        </button>
    ))}
</div>
                </div>

                {activeTab === "schema" ? (
                    <SchemaView />
                ) : (
                    <div className="database-layout">
                        <aside className="table-list">
                            <div className="table-list-heading">
                                TABLES <span>{TABLES.length}</span>
                            </div>

                            {TABLES.map((table) => (
                                <button
                                    key={table}
                                    className={activeTable === table ? "active" : ""}
                                    onClick={() => {
                                        setActiveTable(table);
                                        setActiveTab("tables");
                                        setSearch("");
                                    }}
                                >
                                    <span className="table-dot" />
                                    {table}
                                </button>
                            ))}
                        </aside>

                        <section className="table-view">
                            <div className="table-toolbar">
                                <div>
                                    <span className="table-kicker">TABLE</span>
                                    <h2>{activeTable}</h2>
                                </div>

                                <input
                                    type="text"
                                    placeholder="Search records..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <div className="table-meta">
                                <span>
                                    {filteredRecords.length} record
                                    {filteredRecords.length !== 1 ? "s" : ""}
                                </span>

                                <span>{config?.columns?.length || 0} columns</span>
                            </div>

                            <div className="data-table-wrapper">
                                {loading ? (
                                    <div className="database-loading">
                                        Loading records...
                                    </div>
                                ) : config ? (
                                    <table className="db-table">
                                        <thead>
                                            <tr>
                                                {config.columns.map((column) => (
                                                    <th key={column}>{column}</th>
                                                ))}
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {filteredRecords.map((row, index) => (
                                                <tr key={index}>
                                                    {config.columns.map((column) => (
                                                        <td key={column}>
                                                            {formatValue(row[column])}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div className="database-empty">
                                        No API endpoint configured for this
                                        table yet.
                                    </div>
                                )}

                                {!loading &&
                                    config &&
                                    filteredRecords.length === 0 && (
                                        <div className="database-empty">
                                            No records found.
                                        </div>
                                    )}
                            </div>
                        </section>
                    </div>
                )}
            </div>
        );
    }

    function SchemaView() {
        return (
            <div className="schema-view">
                <div className="schema-node customer">
                    <strong>CUSTOMER</strong>
                    <span>PK · cust_id</span>
                    <span>cust_name</span>
                    <span>city</span>
                    <span>dob</span>
                </div>

                <div className="schema-line line-a" />

                <div className="schema-node property">
                    <strong>PROPERTY</strong>
                    <span>PK · property_id</span>
                    <span>property_name</span>
                    <span>occupancy_status</span>
                </div>

                <div className="schema-line line-b" />

                <div className="schema-node meter">
                    <strong>METER</strong>
                    <span>PK · meter_id</span>
                    <span>capacity</span>
                    <span>meter_status</span>
                </div>

                <div className="schema-line line-c" />

                <div className="schema-node bill">
                    <strong>BILL</strong>
                    <span>PK · meter_id</span>
                    <span>PK · billing_month</span>
                    <span>bill_id</span>
                    <span>tariff_code</span>
                </div>

                <div className="schema-line line-d" />

                <div className="schema-node payment">
                    <strong>PAYMENT</strong>
                    <span>PK · bill_id</span>
                    <span>PK · payment_sequence</span>
                    <span>payment_id</span>
                    <span>payment_mode</span>
                </div>
            </div>
        );
    }

    function formatValue(value) {
        if (value === null || value === undefined) return "—";

        if (typeof value === "number") {
            return value.toLocaleString("en-IN");
        }

        return String(value);
    }

    export default DatabaseExplorer;