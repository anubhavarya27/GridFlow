import { useEffect, useState } from "react";

import {
    BarChart3,
    ClipboardList,
    Database,
    FileText,
    LayoutDashboard,
    Search,
    Settings,
    ShieldCheck,
    Users,
    Building2,
    Gauge,
    Receipt,
    CreditCard,
    Activity,
    BellRing,
    FlaskConical,
} from "lucide-react";

import { NavLink } from "react-router-dom";

import { isAdmin } from "../services/auth";
import { getAlertSummary, getQueryRequests } from "../services/api";


const mainNav = [
    {
        label: "Dashboard",
        path: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Database explorer",
        path: "/database",
        icon: Database,
    },
    {
        label: "Query studio",
        path: "/queries",
        icon: Search,
    },
    {
        label: "Processing",
        path: "/records",
        icon: ClipboardList,
    },
    {
        label: "Reports",
        path: "/reports",
        icon: BarChart3,
    },
];


const intelligenceNav = [
    {
        label: "Consumption Analytics",
        path: "/analytics",
        icon: Activity,
    },
    {
        label: "Consumption Alerts",
        path: "/alerts",
        icon: BellRing,
        badge: "alerts",
    },
    {
        label: "Performance Lab",
        path: "/performance-lab",
        icon: FlaskConical,
    },
];


const operationsNav = [
    {
        label: "Customer 360",
        path: "/customer-360",
        icon: Users,
    },
    {
        label: "Property Portfolio",
        path: "/property-portfolio",
        icon: Building2,
    },
    {
        label: "Meter Monitor",
        path: "/meter-monitor",
        icon: Gauge,
    },
    {
        label: "Tariff Lab",
        path: "/tariff-lab",
        icon: FileText,
    },
    {
        label: "Billing Center",
        path: "/billing-center",
        icon: Receipt,
    },
    {
        label: "Payment Hub",
        path: "/payment-hub",
        icon: CreditCard,
    },
];


function Sidebar() {
    const admin = isAdmin();

    const [pendingCount, setPendingCount] = useState(0);
    const [activeAlerts, setActiveAlerts] = useState(0);


    /* =====================================================
       ACTIVE CONSUMPTION ALERTS (all roles)
       ===================================================== */

    useEffect(() => {
        let mounted = true;

        function loadAlertCount() {
            getAlertSummary()
                .then((s) => mounted && setActiveAlerts(Number(s?.active || 0)))
                .catch(() => {});
        }

        loadAlertCount();
        const interval = setInterval(loadAlertCount, 30000);

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, []);


    /* =====================================================
       LOAD PENDING APPROVAL COUNT
       ===================================================== */

    useEffect(() => {
        if (!admin) {
            setPendingCount(0);
            return;
        }

        let mounted = true;

        async function loadPendingCount() {
            try {
                const data = await getQueryRequests();

                if (!mounted) {
                    return;
                }

                const requests = Array.isArray(data)
                    ? data
                    : [];

                const count = requests.filter(
                    (request) =>
                        String(request.status || "").toUpperCase() ===
                        "PENDING"
                ).length;

                setPendingCount(count);
            } catch (error) {
                console.error(
                    "Failed to load approval count:",
                    error
                );
            }
        }

        loadPendingCount();

        const interval = setInterval(
            loadPendingCount,
            10000
        );

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [admin]);


    return (
        <aside className="sidebar">

            {/* =================================================
                BRAND
               ================================================= */}

            <div className="sidebar-brand">

                <div className="sidebar-logo">
                    <Gauge
                        size={21}
                        strokeWidth={1.8}
                    />
                </div>

                <div>
                    <strong>
                        GridPulse
                    </strong>

                    <span>
                        {admin
                            ? "ADMIN CONSOLE"
                            : "SMART UTILITY BILLING"}
                    </span>
                </div>

            </div>


            {/* =================================================
                NAVIGATION
               ================================================= */}

            <nav className="sidebar-nav">

                {/* =================================================
                    OVERVIEW
                   ================================================= */}

                <div className="nav-group">

                    <span className="nav-label">
                        OVERVIEW
                    </span>

                    {mainNav.map(
                        ({
                            label,
                            path,
                            icon: Icon,
                        }) => (
                            <NavLink
                                key={path}
                                to={path}
                                className={({ isActive }) =>
                                    `side-link ${
                                        isActive
                                            ? "active"
                                            : ""
                                    }`
                                }
                            >
                                <Icon size={15} />

                                <span>
                                    {label}
                                </span>
                            </NavLink>
                        )
                    )}

                </div>


                {/* =================================================
                    CONSUMPTION INTELLIGENCE (GridPulse)
                   ================================================= */}

                <div className="nav-group">

                    <span className="nav-label">
                        INTELLIGENCE
                    </span>

                    {intelligenceNav.map(
                        ({
                            label,
                            path,
                            icon: Icon,
                            badge,
                        }) => (
                            <NavLink
                                key={path}
                                to={path}
                                className={({ isActive }) =>
                                    `side-link ${
                                        isActive
                                            ? "active"
                                            : ""
                                    }`
                                }
                            >
                                <Icon size={15} />

                                <span>
                                    {label}
                                </span>

                                {badge === "alerts" && activeAlerts > 0 && (
                                    <span className="approval-count">
                                        {activeAlerts}
                                    </span>
                                )}
                            </NavLink>
                        )
                    )}

                </div>


                {/* =================================================
                    OPERATIONS
                   ================================================= */}

                <div className="nav-group">

                    <span className="nav-label">
                        OPERATIONS
                    </span>

                    {operationsNav.map(
                        ({
                            label,
                            path,
                            icon: Icon,
                        }) => (
                            <NavLink
                                key={path}
                                to={path}
                                className={({ isActive }) =>
                                    `side-link ${
                                        isActive
                                            ? "active"
                                            : ""
                                    }`
                                }
                            >
                                <Icon size={15} />

                                <span>
                                    {label}
                                </span>
                            </NavLink>
                        )
                    )}

                </div>


                {/* =================================================
                    ADMIN
                   ================================================= */}

                {admin && (
                    <div className="nav-group">

                        <NavLink
                            to="/admin"
                            className={({ isActive }) =>
                                `side-link ${
                                    isActive
                                        ? "active"
                                        : ""
                                }`
                            }
                        >

                            <ShieldCheck size={15} />

                            <span>
                                Approvals
                            </span>

                            {pendingCount > 0 && (
                                <span className="approval-count">
                                    {pendingCount}
                                </span>
                            )}

                        </NavLink>

                    </div>
                )}

            </nav>


            {/* =================================================
                FOOTER
               ================================================= */}

            <div className="sidebar-footer">

                <Settings size={14} />

                <span>
                    {admin
                        ? "ADMIN · GRIDPULSE"
                        : "USER · GRIDPULSE"}
                </span>

            </div>

        </aside>
    );
}


export default Sidebar;