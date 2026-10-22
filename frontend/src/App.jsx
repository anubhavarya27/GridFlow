import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    useLocation,
} from "react-router-dom";
import { useState } from "react";
import OperationsHub from "./pages/OperationsHub";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DatabaseExplorer from "./pages/DatabaseExplorer";
import QueryStudio from "./pages/QueryStudio";
import RecordManagement from "./pages/RecordManagement";
import AdminPanel from "./pages/AdminPanel";
import Reports from "./pages/Reports";

import AppLayout from "./layouts/AppLayout";

import {
    getSession,
    isAdmin,
    verifyApproval,
} from "./services/auth";


/* =========================================================
   PROTECTED ROUTE
   ========================================================= */

function ProtectedRoute({ children }) {
    const location = useLocation();
    const session = getSession();

    if (!session || !session.token) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    return children;
}


/* =========================================================
   ADMIN ROUTE
   ========================================================= */

function AdminRoute({ children }) {
    const location = useLocation();
    const session = getSession();

    if (!session || !session.token) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location }}
            />
        );
    }

    if (!isAdmin()) {
        return (
            <Navigate
                to="/dashboard"
                replace
            />
        );
    }

    return children;
}


/* =========================================================
   ADMIN APPROVAL PASSWORD ROUTE
   ========================================================= */

function ApprovalPasswordRoute() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [verified, setVerified] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        setError("");

        if (!password) {
            setError("Enter the approval password.");
            return;
        }

        setLoading(true);

        const result = await verifyApproval(password);

        if (!result.success) {
            setError(
                result.message ||
                    "Approval verification failed."
            );

            setPassword("");
            setLoading(false);
            return;
        }

        /*
         * verifyApproval() stores the short-lived
         * approval token returned by the backend.
         */
        setVerified(true);
        setPassword("");
        setLoading(false);
    }

    /*
     * Approval password successfully verified.
     */
    if (verified) {
        return <AdminPanel />;
    }

    return (
        <div
            style={{
                minHeight: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "420px",
                    padding: "32px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "#111617",
                    borderRadius: "12px",
                }}
            >
                <span
                    style={{
                        fontSize: "11px",
                        letterSpacing: "0.12em",
                        color: "#9aa5a6",
                    }}
                >
                    RESTRICTED AREA
                </span>

                <h1
                    style={{
                        margin: "8px 0 10px",
                        color: "#eaf1f1",
                    }}
                >
                    Approval Access
                </h1>

                <p
                    style={{
                        marginBottom: "24px",
                        color: "#8f9a9b",
                        fontSize: "14px",
                        lineHeight: 1.6,
                    }}
                >
                    Enter the approval password to access
                    administrative record approvals.
                </p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={password}
                        onChange={(event) =>
                            setPassword(event.target.value)
                        }
                        placeholder="Approval password"
                        autoFocus
                        disabled={loading}
                        style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "12px 14px",
                            background: "#0b0f10",
                            border:
                                "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            color: "#eaf1f1",
                            outline: "none",
                            marginBottom: "12px",
                        }}
                    />

                    {error && (
                        <p
                            style={{
                                color: "#ff6b6b",
                                fontSize: "13px",
                                margin: "0 0 12px",
                            }}
                        >
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "12px",
                            border: "none",
                            borderRadius: "8px",
                            cursor: loading
                                ? "not-allowed"
                                : "pointer",
                            fontWeight: 600,
                            opacity: loading ? 0.7 : 1,
                        }}
                    >
                        {loading
                            ? "VERIFYING..."
                            : "UNLOCK APPROVALS"}
                    </button>
                </form>
            </div>
        </div>
    );
}


/* =========================================================
   APP
   ========================================================= */

function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* PUBLIC */}
                <Route
                    path="/"
                    element={<Landing />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />


                {/* AUTHENTICATED USERS */}
                <Route
                    element={
                        <ProtectedRoute>
                            <AppLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/customer-360" element={<ProtectedRoute><OperationsHub /></ProtectedRoute>} />
<Route path="/property-portfolio" element={<ProtectedRoute><OperationsHub /></ProtectedRoute>} />
<Route path="/meter-monitor" element={<ProtectedRoute><OperationsHub /></ProtectedRoute>} />
<Route path="/tariff-lab" element={<ProtectedRoute><OperationsHub /></ProtectedRoute>} />
<Route path="/billing-center" element={<ProtectedRoute><OperationsHub /></ProtectedRoute>} />
<Route path="/payment-hub" element={<ProtectedRoute><OperationsHub /></ProtectedRoute>} />

                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />

                    <Route
                        path="/database"
                        element={<DatabaseExplorer />}
                    />

                    <Route
                        path="/queries"
                        element={<QueryStudio />}
                    />

                    <Route
                        path="/records"
                        element={<RecordManagement />}
                    />

                    <Route
                        path="/reports"
                        element={<Reports />}
                    />


                    {/* ADMIN + SECOND APPROVAL PASSWORD */}
                    <Route
                        path="/admin"
                        element={
                            <AdminRoute>
                                <ApprovalPasswordRoute />
                            </AdminRoute>
                        }
                    />

                </Route>


                {/* FALLBACK */}
                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/"
                            replace
                        />
                    }
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;