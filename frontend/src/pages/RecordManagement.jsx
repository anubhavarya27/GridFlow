import { useCallback, useEffect, useState } from "react";
import {
    Clock3,
    CheckCircle2,
    XCircle,
    Eye,
    RefreshCw,
    X,
    AlertCircle,
    LoaderCircle,
    Database,
} from "lucide-react";

import "../styles/records.css";
import { getQueryRequests } from "../services/api";


function RecordManagement() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);


    /* =====================================================
       LOAD REQUESTS
       ===================================================== */

    const loadRequests = useCallback(
        async (manualRefresh = false) => {
            try {
                if (manualRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError("");

                const data = await getQueryRequests();

                const nextRequests = Array.isArray(data)
                    ? data
                    : [];

                setRequests(nextRequests);
                setLastUpdated(new Date());

            } catch (err) {
                console.error(
                    "Failed to load processing queue:",
                    err
                );

                setError(
                    err.message ||
                        "Failed to load processing queue."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        []
    );


    /* =====================================================
       INITIAL LOAD
       ===================================================== */

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);


    /* =====================================================
       AUTO REFRESH
       ===================================================== */

    useEffect(() => {
        const interval = setInterval(() => {
            loadRequests();
        }, 15000);

        return () => clearInterval(interval);
    }, [loadRequests]);


    /* =====================================================
       COUNTS
       ===================================================== */

    const pending = requests.filter(
        (request) =>
            normalizeStatus(request.status) === "PENDING"
    ).length;

    const executing = requests.filter(
        (request) =>
            normalizeStatus(request.status) === "EXECUTING"
    ).length;

    const completed = requests.filter(
        (request) =>
            normalizeStatus(request.status) === "COMPLETED"
    ).length;

    const rejected = requests.filter(
        (request) =>
            normalizeStatus(request.status) === "REJECTED"
    ).length;


    return (
        <div className="records-page">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="records-header">

                <div className="records-header-copy">
                    <span className="eyebrow">
                        OPERATIONS
                    </span>

                    <h1>Processing</h1>

                    <p>
                        Track database change requests currently
                        under processing and review.
                    </p>
                </div>


                <div className="records-header-actions">

                    <div className="sync-status">
                        <span className="sync-dot" />

                        <span>
                            {lastUpdated
                                ? `Last synced ${formatTime(
                                      lastUpdated
                                  )}`
                                : "Waiting for sync"}
                        </span>
                    </div>

                    <button
                        className="new-request-btn refresh-btn"
                        type="button"
                        onClick={() =>
                            loadRequests(true)
                        }
                        disabled={refreshing}
                    >
                        <RefreshCw
                            size={17}
                            className={
                                refreshing
                                    ? "processing-spin"
                                    : ""
                            }
                        />

                        {refreshing
                            ? "REFRESHING..."
                            : "REFRESH QUEUE"}
                    </button>

                </div>

            </header>


            {/* =================================================
                STATUS CARDS
            ================================================= */}

            <div className="request-summary">

                <StatusCard
                    icon={<Clock3 size={20} />}
                    label="PENDING"
                    value={pending}
                    tone="pending"
                    description="Awaiting administrator review"
                />

                <StatusCard
                    icon={
                        <LoaderCircle size={20} />
                    }
                    label="EXECUTING"
                    value={executing}
                    tone="executing"
                    description="Currently being processed"
                />

                <StatusCard
                    icon={
                        <CheckCircle2 size={20} />
                    }
                    label="COMPLETED"
                    value={completed}
                    tone="completed"
                    description="Successfully executed"
                />

                <StatusCard
                    icon={<XCircle size={20} />}
                    label="REJECTED"
                    value={rejected}
                    tone="rejected"
                    description="Declined by administrator"
                />

            </div>


            {/* =================================================
                QUEUE
            ================================================= */}

            <section className="requests-panel">

                <div className="records-panel-heading">

                    <div>
                        <span>
                            PROCESSING QUEUE
                        </span>

                        <h2>
                            Recent requests
                        </h2>
                    </div>

                    <div className="queue-count">
                        <Database size={15} />
                        {requests.length}{" "}
                        {requests.length === 1
                            ? "request"
                            : "requests"}
                    </div>

                </div>


                {/* ERROR */}

                {error && (
                    <div className="queue-error">
                        <AlertCircle size={17} />

                        <div>
                            <strong>
                                Queue unavailable
                            </strong>

                            <span>
                                {error}
                            </span>
                        </div>
                    </div>
                )}


                {/* LOADING */}

                {loading ? (

                    <div className="records-empty-state">

                        <RefreshCw
                            size={22}
                            className="processing-spin"
                        />

                        <strong>
                            Loading processing queue...
                        </strong>

                        <span>
                            Fetching the latest database
                            requests.
                        </span>

                    </div>

                ) : requests.length === 0 ? (

                    <div className="records-empty-state">

                        <CheckCircle2 size={22} />

                        <strong>
                            Queue is clear
                        </strong>

                        <span>
                            No database change requests
                            have been submitted.
                        </span>

                    </div>

                ) : (

                    <div className="requests-table">

                        <div className="request-row request-head">

                            <span>
                                REQUEST
                            </span>

                            <span>
                                TYPE
                            </span>

                            <span>
                                SUBMITTED BY
                            </span>

                            <span>
                                DATE
                            </span>

                            <span>
                                STATUS
                            </span>

                            <span>
                                ACTION
                            </span>

                        </div>


                        {requests.map(
                            (request) => (
                                <div
                                    className="request-row"
                                    key={
                                        request.request_id
                                    }
                                >

                                    <div className="request-main-cell">

                                        <strong>
                                            #
                                            {
                                                request.request_id
                                            }
                                        </strong>

                                        <small>
                                            {getQueryPreview(
                                                request.sql_query
                                            )}
                                        </small>

                                    </div>


                                    <span className="request-type">
                                        {request.query_type ||
                                            "WRITE"}
                                    </span>


                                    <span className="request-user">
                                        {
                                            request.submitted_by_name ||
                                            `User ${request.submitted_by}`
                                        }
                                    </span>


                                    <span className="request-date">
                                        {formatDate(
                                            request.submitted_at
                                        )}
                                    </span>


                                    <StatusBadge
                                        status={
                                            request.status
                                        }
                                    />


                                    <div className="request-actions">

                                        <button
                                            type="button"
                                            title="View request"
                                            onClick={() =>
                                                setSelectedRequest(
                                                    request
                                                )
                                            }
                                        >
                                            <Eye
                                                size={17}
                                            />
                                        </button>

                                    </div>

                                </div>
                            )
                        )}

                    </div>

                )}

            </section>


            {/* =================================================
                REQUEST DETAILS
            ================================================= */}

            {selectedRequest && (
                <RequestDetailsModal
                    request={selectedRequest}
                    onClose={() =>
                        setSelectedRequest(null)
                    }
                />
            )}

        </div>
    );
}


/* =========================================================
   STATUS CARD
   ========================================================= */

function StatusCard({
    icon,
    label,
    value,
    tone,
    description,
}) {
    return (
        <div
            className={`request-summary-card ${tone}`}
        >
            <div className="summary-card-top">

                <div className="summary-icon">
                    {icon}
                </div>

                <span className="summary-label">
                    {label}
                </span>

            </div>

            <strong className="summary-value">
                {value}
            </strong>

            <span className="summary-description">
                {description}
            </span>
        </div>
    );
}


/* =========================================================
   STATUS BADGE
   ========================================================= */

function StatusBadge({ status }) {
    const normalized =
        normalizeStatus(status);

    return (
        <span
            className={`request-status ${normalized.toLowerCase()}`}
        >
            <span className="status-dot" />
            {formatStatus(normalized)}
        </span>
    );
}


/* =========================================================
   REQUEST DETAILS MODAL
   ========================================================= */

function RequestDetailsModal({
    request,
    onClose,
}) {
    const executionResult =
        parseExecutionResult(
            request.execution_result
        );

    return (
        <div
            className="modal-backdrop"
            onClick={onClose}
        >
            <div
                className="request-modal"
                onClick={(event) =>
                    event.stopPropagation()
                }
            >

                <div className="modal-heading">

                    <div>
                        <span>
                            QUERY REQUEST
                        </span>

                        <h2>
                            #
                            {
                                request.request_id
                            }
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="modal-close-btn"
                    >
                        <X size={18} />
                    </button>

                </div>


                <div className="request-detail-grid">

                    <DetailItem
                        label="QUERY TYPE"
                        value={
                            request.query_type ||
                            "WRITE"
                        }
                    />

                    <DetailItem
                        label="STATUS"
                        value={
                            formatStatus(
                                request.status
                            )
                        }
                    />

                    <DetailItem
                        label="SUBMITTED BY"
                        value={
                            request.submitted_by_name ||
                            `User ${request.submitted_by}`
                        }
                    />

                    <DetailItem
                        label="SUBMITTED"
                        value={
                            formatDate(
                                request.submitted_at
                            )
                        }
                    />

                    <DetailItem
                        label="REVIEWED BY"
                        value={
                            request.reviewed_by_name ||
                            "—"
                        }
                    />

                    <DetailItem
                        label="REVIEWED"
                        value={
                            request.reviewed_at
                                ? formatDate(
                                      request.reviewed_at
                                  )
                                : "—"
                        }
                    />

                </div>


                <div className="request-detail-section">

                    <span>
                        SQL QUERY
                    </span>

                    <pre>
                        {request.sql_query ||
                            "No SQL available."}
                    </pre>

                </div>


                {request.rejection_reason && (
                    <div className="request-detail-section">

                        <span>
                            REJECTION REASON
                        </span>

                        <div className="request-detail-message">

                            <AlertCircle
                                size={16}
                            />

                            <p>
                                {
                                    request.rejection_reason
                                }
                            </p>

                        </div>

                    </div>
                )}


                {executionResult && (
                    <div className="request-detail-section">

                        <span>
                            EXECUTION RESULT
                        </span>

                        <pre>
                            {typeof executionResult ===
                            "string"
                                ? executionResult
                                : JSON.stringify(
                                      executionResult,
                                      null,
                                      2
                                  )}
                        </pre>

                    </div>
                )}

            </div>
        </div>
    );
}


/* =========================================================
   DETAIL ITEM
   ========================================================= */

function DetailItem({
    label,
    value,
}) {
    return (
        <div>
            <span>
                {label}
            </span>

            <strong>
                {value}
            </strong>
        </div>
    );
}


/* =========================================================
   HELPERS
   ========================================================= */

function normalizeStatus(status) {
    return String(
        status || "PENDING"
    ).toUpperCase();
}


function formatStatus(status) {
    const normalized =
        normalizeStatus(status);

    return normalized
        .toLowerCase()
        .replace(
            /(^\w|\s\w)/g,
            (match) =>
                match.toUpperCase()
        );
}


function formatDate(value) {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }
    );
}


function formatTime(value) {
    const date =
        value instanceof Date
            ? value
            : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "just now";
    }

    return date.toLocaleTimeString(
        "en-IN",
        {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }
    );
}


function getQueryPreview(sql) {
    if (!sql) {
        return "No query";
    }

    const cleaned = String(sql)
        .replace(/\s+/g, " ")
        .trim();

    if (cleaned.length <= 68) {
        return cleaned;
    }

    return `${cleaned.slice(0, 68)}...`;
}


function parseExecutionResult(value) {
    if (!value) {
        return null;
    }

    if (typeof value !== "string") {
        return value;
    }

    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}


export default RecordManagement;