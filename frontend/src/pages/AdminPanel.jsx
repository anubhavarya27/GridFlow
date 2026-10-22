import { useCallback, useEffect, useState } from "react";

import {
    CheckCircle2,
    XCircle,
    Eye,
    Clock3,
    FilePlus2,
    Pencil,
    Trash2,
    RefreshCw,
    AlertCircle,
    Database,
} from "lucide-react";

import "../styles/records.css";

import {
    getQueryRequests,
    approveQueryRequest,
    rejectQueryRequest,
} from "../services/api";


/* =========================================================
   ADMIN APPROVALS
   ========================================================= */

function AdminPanel() {
    const [requests, setRequests] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const [error, setError] = useState("");

    const [selectedRequest, setSelectedRequest] =
        useState(null);

    const [actionLoading, setActionLoading] =
        useState(false);

    const [rejecting, setRejecting] =
        useState(false);

    const [rejectionReason, setRejectionReason] =
        useState("");


    /* =====================================================
       LOAD REQUESTS
       ===================================================== */

    const loadRequests = useCallback(
        async (manual = false) => {
            try {
                if (manual) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError("");

                const data =
                    await getQueryRequests();

                setRequests(
                    Array.isArray(data)
                        ? data
                        : []
                );

            } catch (err) {
                console.error(
                    "Failed to load approval queue:",
                    err
                );

                setError(
                    err.message ||
                        "Unable to load approval queue."
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
        const interval =
            setInterval(() => {
                loadRequests(true);
            }, 15000);

        return () => clearInterval(
            interval
        );
    }, [loadRequests]);


    /* =====================================================
       COUNTS
       ===================================================== */

    const pendingRequests =
        requests.filter(
            (request) =>
                normalizeStatus(
                    request.status
                ) === "PENDING"
        );

    const approvedRequests =
        requests.filter(
            (request) =>
                ["APPROVED", "COMPLETED"].includes(
                    normalizeStatus(
                        request.status
                    )
                )
        );

    const rejectedRequests =
        requests.filter(
            (request) =>
                normalizeStatus(
                    request.status
                ) === "REJECTED"
        );


    /* =====================================================
       APPROVE
       ===================================================== */

    async function handleApprove(
        request
    ) {
        if (
            !request ||
            normalizeStatus(
                request.status
            ) !== "PENDING"
        ) {
            return;
        }

        setActionLoading(true);
        setError("");

        try {
            await approveQueryRequest(
                request.request_id
            );

            setSelectedRequest(null);

            await loadRequests(true);

        } catch (err) {
            console.error(
                "Approval failed:",
                err
            );

            setError(
                err.message ||
                    "Unable to approve request."
            );
        } finally {
            setActionLoading(false);
        }
    }


    /* =====================================================
       REJECT
       ===================================================== */

    async function handleReject(
        request
    ) {
        if (
            !request ||
            normalizeStatus(
                request.status
            ) !== "PENDING"
        ) {
            return;
        }

        if (!rejectionReason.trim()) {
            setError(
                "Enter a rejection reason before rejecting the request."
            );
            return;
        }

        setActionLoading(true);
        setError("");

        try {
            await rejectQueryRequest(
                request.request_id,
                rejectionReason.trim()
            );

            setSelectedRequest(null);
            setRejecting(false);
            setRejectionReason("");

            await loadRequests(true);

        } catch (err) {
            console.error(
                "Rejection failed:",
                err
            );

            setError(
                err.message ||
                    "Unable to reject request."
            );
        } finally {
            setActionLoading(false);
        }
    }


    return (
        <div className="records-page">

            {/* =================================================
                HEADER
               ================================================= */}

            <div className="records-header">

                <div>
                    <span className="eyebrow">
                        ADMINISTRATION
                    </span>

                    <h1>
                        Approvals
                    </h1>

                    <p>
                        Review database change requests
                        submitted by users before execution.
                    </p>
                </div>


                <div className="records-header-actions">

                    <div className="sync-status">
                        <span className="sync-dot" />

                        {pendingRequests.length}{" "}
                        pending
                    </div>


                    <button
                        type="button"
                        className="new-request-btn"
                        onClick={() =>
                            loadRequests(true)
                        }
                        disabled={refreshing}
                    >
                        <RefreshCw
                            size={15}
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

            </div>


            {/* =================================================
                ERROR
               ================================================= */}

            {error && (
                <div className="queue-error">

                    <AlertCircle size={17} />

                    <div>
                        <strong>
                            Approval operation failed
                        </strong>

                        <span>
                            {error}
                        </span>
                    </div>

                </div>
            )}


            {/* =================================================
                SUMMARY
               ================================================= */}

            <div className="request-summary">

                <SummaryCard
                    icon={
                        <Clock3 size={18} />
                    }
                    label="PENDING"
                    value={
                        pendingRequests.length
                    }
                />

                <SummaryCard
                    icon={
                        <CheckCircle2
                            size={18}
                        />
                    }
                    label="COMPLETED"
                    value={
                        approvedRequests.length
                    }
                />

                <SummaryCard
                    icon={
                        <XCircle size={18} />
                    }
                    label="REJECTED"
                    value={
                        rejectedRequests.length
                    }
                />

            </div>


            {/* =================================================
                QUEUE
               ================================================= */}

            <section className="requests-panel">

                <div className="records-panel-heading">

                    <div>
                        <span>
                            ADMIN REVIEW QUEUE
                        </span>

                        <h2>
                            Database change requests
                        </h2>
                    </div>


                    <div className="queue-count">
                        <Database size={14} />
                        {requests.length}{" "}
                        {requests.length === 1
                            ? "request"
                            : "requests"}
                    </div>

                </div>


                {loading ? (

                    <div className="records-empty-state">

                        <RefreshCw
                            size={22}
                            className="processing-spin"
                        />

                        <strong>
                            Loading approval queue...
                        </strong>

                        <span>
                            Fetching requests from
                            the database.
                        </span>

                    </div>

                ) : requests.length === 0 ? (

                    <div className="records-empty-state">

                        <CheckCircle2
                            size={22}
                        />

                        <strong>
                            No requests
                        </strong>

                        <span>
                            There are no database
                            change requests.
                        </span>

                    </div>

                ) : (

                    <div className="requests-table">

                        <div className="request-row request-head">

                            <span>
                                REQUEST
                            </span>

                            <span>
                                ACTION
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
                                ACTIONS
                            </span>

                        </div>


                        {requests.map(
                            (request) => {

                                const status =
                                    normalizeStatus(
                                        request.status
                                    );

                                return (
                                    <div
                                        className="request-row"
                                        key={
                                            request.request_id
                                        }
                                    >

                                        {/* REQUEST */}

                                        <div className="request-main-cell">

                                            <strong>
                                                #
                                                {
                                                    request.request_id
                                                }
                                            </strong>

                                            <small>
                                                {
                                                    getQueryPreview(
                                                        request.sql_query
                                                    )
                                                }
                                            </small>

                                        </div>


                                        {/* ACTION */}

                                        <ActionBadge
                                            action={getSqlAction(
                                                request.sql_query
                                            )}
                                        />


                                        {/* USER */}

                                        <span className="request-user">
                                            {
                                                request.submitted_by_name ||
                                                `User ${request.submitted_by}`
                                            }
                                        </span>


                                        {/* DATE */}

                                        <span className="request-date">
                                            {formatDate(
                                                request.submitted_at
                                            )}
                                        </span>


                                        {/* STATUS */}

                                        <StatusBadge
                                            status={status}
                                        />


                                        {/* ACTIONS */}

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
                                                    size={
                                                        16
                                                    }
                                                />
                                            </button>


                                            {status ===
                                                "PENDING" && (
                                                <>

                                                    <button
                                                        type="button"
                                                        title="Approve"
                                                        className="approve"
                                                        disabled={
                                                            actionLoading
                                                        }
                                                        onClick={() =>
                                                            handleApprove(
                                                                request
                                                            )
                                                        }
                                                    >
                                                        <CheckCircle2
                                                            size={
                                                                16
                                                            }
                                                        />
                                                    </button>


                                                    <button
                                                        type="button"
                                                        title="Reject"
                                                        className="reject"
                                                        disabled={
                                                            actionLoading
                                                        }
                                                        onClick={() => {
                                                            setSelectedRequest(
                                                                request
                                                            );

                                                            setRejecting(
                                                                true
                                                            );

                                                            setRejectionReason(
                                                                ""
                                                            );

                                                            setError(
                                                                ""
                                                            );
                                                        }}
                                                    >
                                                        <XCircle
                                                            size={
                                                                16
                                                            }
                                                        />
                                                    </button>

                                                </>
                                            )}

                                        </div>

                                    </div>
                                );
                            }
                        )}

                    </div>

                )}

            </section>


            {/* =================================================
                DETAILS MODAL
               ================================================= */}

            {selectedRequest && (
                <RequestDetails
                    request={selectedRequest}
                    onClose={() => {
                        if (!actionLoading) {
                            setSelectedRequest(
                                null
                            );

                            setRejecting(
                                false
                            );

                            setRejectionReason(
                                ""
                            );
                        }
                    }}
                    onApprove={() =>
                        handleApprove(
                            selectedRequest
                        )
                    }
                    onReject={() =>
                        setRejecting(true)
                    }
                    rejecting={rejecting}
                    rejectionReason={
                        rejectionReason
                    }
                    setRejectionReason={
                        setRejectionReason
                    }
                    actionLoading={
                        actionLoading
                    }
                    onConfirmReject={() =>
                        handleReject(
                            selectedRequest
                        )
                    }
                />
            )}

        </div>
    );
}


/* =========================================================
   SUMMARY CARD
   ========================================================= */

function SummaryCard({
    icon,
    label,
    value,
}) {
    return (
        <div className="request-summary-card">

            <div className="summary-icon">
                {icon}
            </div>

            <span className="summary-label">
                {label}
            </span>

            <strong className="summary-value">
                {value}
            </strong>

        </div>
    );
}


/* =========================================================
   STATUS
   ========================================================= */

function StatusBadge({
    status,
}) {
    return (
        <span
            className={`request-status ${String(
                status
            ).toLowerCase()}`}
        >
            <span className="status-dot" />

            {formatStatus(status)}
        </span>
    );
}


/* =========================================================
   ACTION BADGE
   ========================================================= */

function ActionBadge({
    action,
}) {
    const icons = {
        CREATE: (
            <FilePlus2 size={12} />
        ),

        INSERT: (
            <FilePlus2 size={12} />
        ),

        UPDATE: (
            <Pencil size={12} />
        ),

        DELETE: (
            <Trash2 size={12} />
        ),
    };

    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                color: "#8eb0ac",
                fontFamily:
                    '"IBM Plex Mono", monospace',
                fontSize: "10px",
                letterSpacing: "0.05em",
            }}
        >
            {icons[action] || (
                <Database size={12} />
            )}

            {action}
        </span>
    );
}


/* =========================================================
   DETAILS
   ========================================================= */

function RequestDetails({
    request,
    onClose,
    onApprove,
    onReject,
    rejecting,
    rejectionReason,
    setRejectionReason,
    actionLoading,
    onConfirmReject,
}) {
    const status =
        normalizeStatus(
            request.status
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
                            DATABASE CHANGE REQUEST
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
                        className="modal-close-btn"
                        onClick={onClose}
                        disabled={actionLoading}
                    >
                        ×
                    </button>

                </div>


                {/* META */}

                <div className="request-detail-grid">

                    <DetailItem
                        label="Action"
                        value={getSqlAction(
                            request.sql_query
                        )}
                    />

                    <DetailItem
                        label="Query type"
                        value={
                            request.query_type ||
                            "WRITE"
                        }
                    />

                    <DetailItem
                        label="Status"
                        value={formatStatus(
                            request.status
                        )}
                    />

                    <DetailItem
                        label="Submitted by"
                        value={
                            request.submitted_by_name ||
                            `User ${request.submitted_by}`
                        }
                    />

                    <DetailItem
                        label="Submitted"
                        value={formatDate(
                            request.submitted_at
                        )}
                    />

                    <DetailItem
                        label="Reviewed by"
                        value={
                            request.reviewed_by_name ||
                            "—"
                        }
                    />

                </div>


                {/* SQL */}

                <div className="request-detail-section">

                    <span>
                        SQL QUERY
                    </span>

                    <pre>
                        {
                            request.sql_query ||
                            "No SQL available."
                        }
                    </pre>

                </div>


                {/* EXECUTION RESULT */}

                {request.execution_result && (
                    <div className="request-detail-section">

                        <span>
                            EXECUTION RESULT
                        </span>

                        <pre>
                            {
                                request.execution_result
                            }
                        </pre>

                    </div>
                )}


                {/* REJECTION REASON */}

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


                {/* REJECTION FORM */}

                {rejecting &&
                    status === "PENDING" && (
                        <div className="request-detail-section">

                            <span>
                                REJECTION REASON
                            </span>

                            <textarea
                                value={
                                    rejectionReason
                                }
                                onChange={(
                                    event
                                ) =>
                                    setRejectionReason(
                                        event.target.value
                                    )
                                }
                                placeholder="Explain why this query is being rejected..."
                                rows={4}
                                disabled={
                                    actionLoading
                                }
                                style={{
                                    width: "100%",
                                    boxSizing:
                                        "border-box",
                                    resize:
                                        "vertical",
                                    padding:
                                        "12px 14px",
                                    border:
                                        "1px solid rgba(255,255,255,0.08)",
                                    borderRadius:
                                        "8px",
                                    background:
                                        "#080d0e",
                                    color:
                                        "#dce7e5",
                                    fontFamily:
                                        '"IBM Plex Sans", sans-serif',
                                    fontSize:
                                        "13px",
                                    outline:
                                        "none",
                                }}
                            />

                        </div>
                    )}


                {/* ACTIONS */}

                <div className="modal-actions">

                    <button
                        type="button"
                        className="cancel-btn"
                        onClick={onClose}
                        disabled={
                            actionLoading
                        }
                    >
                        Close
                    </button>


                    {status ===
                        "PENDING" &&
                        !rejecting && (
                            <>
                                <button
                                    type="button"
                                    className="submit-request-btn"
                                    onClick={
                                        onApprove
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                >
                                    <CheckCircle2
                                        size={
                                            15
                                        }
                                    />

                                    {actionLoading
                                        ? "PROCESSING..."
                                        : "APPROVE"}
                                </button>

                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={
                                        onReject
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                >
                                    <XCircle
                                        size={
                                            15
                                        }
                                    />

                                    REJECT
                                </button>
                            </>
                        )}


                    {status ===
                        "PENDING" &&
                        rejecting && (
                            <>
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() =>
                                        setRejectionReason(
                                            ""
                                        )
                                    }
                                    disabled={
                                        actionLoading
                                    }
                                >
                                    Clear
                                </button>

                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={
                                        onConfirmReject
                                    }
                                    disabled={
                                        actionLoading ||
                                        !rejectionReason.trim()
                                    }
                                    style={{
                                        color:
                                            "#ea7b83",
                                        borderColor:
                                            "rgba(234,123,131,0.25)",
                                    }}
                                >
                                    <XCircle
                                        size={
                                            15
                                        }
                                    />

                                    {actionLoading
                                        ? "REJECTING..."
                                        : "CONFIRM REJECT"}
                                </button>
                            </>
                        )}

                </div>

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
                {String(
                    label
                ).toUpperCase()}
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

function normalizeStatus(
    status
) {
    return String(
        status || "PENDING"
    )
        .trim()
        .toUpperCase();
}


function formatStatus(
    status
) {
    return normalizeStatus(
        status
    )
        .toLowerCase()
        .replace(
            /(^\w|\s\w)/g,
            (match) =>
                match.toUpperCase()
        );
}


function formatDate(
    value
) {
    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
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


function getQueryPreview(
    sql
) {
    if (!sql) {
        return "No SQL available";
    }

    const clean =
        String(sql)
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    return clean.length > 70
        ? `${clean.slice(
              0,
              70
          )}...`
        : clean;
}


function getSqlAction(
    sql
) {
    if (!sql) {
        return "WRITE";
    }

    const match =
        String(sql)
            .trim()
            .match(
                /^(INSERT|UPDATE|DELETE|REPLACE|MERGE|CREATE|ALTER|DROP|TRUNCATE|RENAME|GRANT|REVOKE|CALL|LOAD|IMPORT)\b/i
            );

    return match
        ? match[1].toUpperCase()
        : "WRITE";
}


export default AdminPanel;