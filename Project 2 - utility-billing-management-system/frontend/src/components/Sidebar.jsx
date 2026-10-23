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
} from "lucide-react";

import { NavLink } from "react-router-dom";

import { isAdmin } from "../services/auth";
import { getQueryRequests } from "../services/api";


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
                        U/BILL
                    </strong>

                    <span>
                        {admin
                            ? "ADMIN CONSOLE"
                            : "UTILITY SYSTEM"}
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
                        ? "ADMIN · U/BILL"
                        : "USER · U/BILL"}
                </span>

            </div>

        </aside>
    );
}


export default Sidebar;