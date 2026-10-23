import { useState } from "react";
import { executeQuery } from "../services/api";
import "../styles/query-studio.css";
import "../styles/query-studio-crud.css";

const sampleQueries = [
    {
        name: "All customers",
        sql: "SELECT * FROM Customer;",
    },
    {
        name: "Bill status",
        sql: "SELECT bill_status, COUNT(*) AS count FROM Bill GROUP BY bill_status;",
    },
    {
        name: "Customer + property join",
        sql: `SELECT
    c.cust_id,
    c.cust_name,
    p.property_name
FROM Customer c
JOIN Customer_Owns_Property cop
    ON c.cust_id = cop.cust_id
JOIN Property p
    ON cop.property_id = p.property_id;`,
    },
    {
        name: "Top consuming meters",
        sql: `SELECT
    meter_id,
    SUM(current_reading - previous_reading) AS total_consumption
FROM Bill
GROUP BY meter_id
ORDER BY total_consumption DESC
LIMIT 10;`,
    },
    {
        name: "Payment methods",
        sql: `SELECT
    payment_mode,
    COUNT(*) AS payment_count,
    SUM(amount) AS total_amount
FROM Payment
GROUP BY payment_mode;`,
    },
    {
        name: "Customer consumption",
        sql: `SELECT
    c.cust_name,
    SUM(
        b.current_reading - b.previous_reading
    ) AS total_consumption
FROM Customer c
JOIN Customer_Owns_Property cop
    ON c.cust_id = cop.cust_id
JOIN Property_Incorporate_Meter pim
    ON cop.property_id = pim.property_id
JOIN Bill b
    ON pim.meter_id = b.meter_id
GROUP BY c.cust_id, c.cust_name
ORDER BY total_consumption DESC;`,
    },
];

// Every table currently in the Utility Billing Management System schema.
const CRUD_TABLES = [
    "Customer",
    "Customer_Phone",
    "Customer_Email",
    "Property",
    "Customer_Owns_Property",
    "Meter",
    "Property_Incorporate_Meter",
    "Meter_Reading",
    "Utility_Service",
    "Electricity_Service",
    "Water_Service",
    "Meter_Service",
    "Tariff",
    "Bill",
    "Payment_Schedule",
    "Payment",
    "Card",
    "Card_Payment",
    "Cash_Payment",
    "UPI_Payment",
];

function QueryStudio() {
    const [query, setQuery] = useState(sampleQueries[0].sql);
    const [result, setResult] = useState(null);
    const [executed, setExecuted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Generic CRUD state. The same executeQuery() function is used for the
    // generated INSERT/UPDATE/DELETE statements, so the existing backend
    // approval workflow remains the single source of truth.
    const [crudMode, setCrudMode] = useState(null);
    const [crudTable, setCrudTable] = useState(CRUD_TABLES[0]);
    const [crudColumns, setCrudColumns] = useState([]);
    const [crudRecords, setCrudRecords] = useState([]);
    const [crudForm, setCrudForm] = useState({});
    const [selectedRecord, setSelectedRecord] = useState("");
    const [crudLoading, setCrudLoading] = useState(false);
    const [crudError, setCrudError] = useState("");
    const [pendingSubmission, setPendingSubmission] = useState(null);

    async function runReadSql(sql) {
        const data = await executeQuery(sql);
        return extractRows(data);
    }

    function resetCrudState() {
        setCrudColumns([]);
        setCrudRecords([]);
        setCrudForm({});
        setSelectedRecord("");
        setCrudError("");
    }

    async function openCrud(mode) {
        resetCrudState();
        setCrudMode(mode);
        await loadCrudTable(CRUD_TABLES[0], mode);
    }

    function closeCrud() {
        if (crudLoading) return;
        setCrudMode(null);
        setCrudError("");
    }

    async function loadCrudTable(table, mode = crudMode) {
        if (!CRUD_TABLES.includes(table)) {
            setCrudError("Invalid table selected.");
            return;
        }

        setCrudTable(table);
        setCrudLoading(true);
        setCrudError("");
        setSelectedRecord("");
        setCrudForm({});

        try {
            const schemaRows = await runReadSql(
                `SHOW COLUMNS FROM ${quoteIdentifier(table)};`
            );

            if (!schemaRows.length) {
                throw new Error(`No columns found for ${table}.`);
            }

            const normalizedColumns = schemaRows.map(normalizeColumn);
            setCrudColumns(normalizedColumns);

            let records = [];
            if (mode === "edit" || mode === "delete") {
                records = await runReadSql(
                    `SELECT * FROM ${quoteIdentifier(table)} LIMIT 100;`
                );
            }

            setCrudRecords(records);

            if (mode === "add") {
                setCrudForm(createEmptyForm(normalizedColumns, false));
            } else if (records.length > 0) {
                const firstKey = recordKey(records[0], normalizedColumns);
                setSelectedRecord(firstKey);
                setCrudForm({ ...records[0] });
            }
        } catch (err) {
            console.error("CRUD table load failed:", err);
            setCrudError(err.message || `Unable to load ${table}.`);
        } finally {
            setCrudLoading(false);
        }
    }

    function handleCrudTableChange(table) {
        if (!crudMode) return;
        loadCrudTable(table, crudMode);
    }

    function handleCrudFieldChange(field, value) {
        setCrudForm((current) => ({
            ...current,
            [field]: value,
        }));
        setCrudError("");
    }

    function handleRecordChange(key) {
        setSelectedRecord(key);
        const record = crudRecords.find(
            (row) => recordKey(row, crudColumns) === key
        );
        if (record) {
            setCrudForm({ ...record });
        }
        setCrudError("");
    }

    function buildCrudSql() {
        if (!crudTable || !crudColumns.length) {
            throw new Error("Select a valid table first.");
        }

        const keyColumns = getKeyColumns(crudColumns);

        if (crudMode === "add") {
            return buildInsertSql(crudTable, crudColumns, crudForm);
        }

        if (!selectedRecord || !crudRecords.length) {
            throw new Error("Select a record first.");
        }

        const currentRecord = crudRecords.find(
            (row) => recordKey(row, crudColumns) === selectedRecord
        );

        if (!currentRecord) {
            throw new Error("The selected record could not be found.");
        }

        if (!keyColumns.length) {
            throw new Error(
                `${crudTable} has no declared primary key. Edit/delete requires a primary key.`
            );
        }

        if (crudMode === "edit") {
            return buildUpdateSql(
                crudTable,
                crudColumns,
                currentRecord,
                crudForm
            );
        }

        return buildDeleteSql(crudTable, keyColumns, currentRecord);
    }

    async function submitCrud() {
        setCrudLoading(true);
        setCrudError("");
        setPendingSubmission(null);

        try {
            const sql = buildCrudSql();
            const data = await executeQuery(sql);

            // The backend returns PENDING_APPROVAL for every write query.
            if (
                data?.mode === "PENDING_APPROVAL" ||
                data?.status === "PENDING"
            ) {
                setQuery(sql);
                setPendingSubmission({
                    ...data,
                    operation: crudMode?.toUpperCase(),
                    table: crudTable,
                });
                setCrudMode(null);
                setExecuted(false);
                setResult(null);
                return;
            }

            // Defensive fallback if the backend ever returns an immediate
            // execution result for a generated operation.
            setQuery(sql);
            setCrudMode(null);
            setResult(data);
            setExecuted(true);
        } catch (err) {
            console.error("Record operation submission failed:", err);
            setCrudError(
                err.message || "Unable to submit the record operation."
            );
        } finally {
            setCrudLoading(false);
        }
    }

    async function runQuery() {
        if (!query.trim()) {
            setError("Enter a SQL query first.");
            return;
        }

        setLoading(true);
        setExecuted(false);
        setError("");
        setResult(null);
        setPendingSubmission(null);

        try {
            const data = await executeQuery(query.trim());

            if (
                data?.mode === "PENDING_APPROVAL" ||
                data?.status === "PENDING"
            ) {
                setPendingSubmission(data);
                setExecuted(false);
                setResult(null);
            } else {
                setResult(data);
                setExecuted(true);
            }
        } catch (err) {
            console.error("Query execution failed:", err);

            setError(err.message || "Query execution failed.");
        } finally {
            setLoading(false);
        }
    }

    function loadQuery(sql) {
        setQuery(sql);
        setExecuted(false);
        setResult(null);
        setError("");
        setPendingSubmission(null);
    }

    const resultRows = getRows(result);
    const resultColumns = getColumns(result, resultRows);
    const isRowResult = resultRows.length > 0 || resultColumns.length > 0;

    return (
        <div className="query-page">
            <div className="query-header">
                <div>
                    <span className="eyebrow">DATABASE TOOLS</span>
                    <h1>Query Studio</h1>
                    <p>
                        Execute SQL directly against the utility billing database.
                    </p>
                </div>

                <div className="query-mode">
                    <button className="active">SQL</button>
                    <button disabled title="Coming later">
                        NL → SQL
                    </button>
                </div>
            </div>

            <div className="query-layout">
                <aside className="query-sidebar">
                    <span className="query-sidebar-title">SAVED QUERIES</span>

                    {sampleQueries.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => loadQuery(item.sql)}
                        >
                            {item.name}
                        </button>
                    ))}

                    <div className="query-info">
                        <span>DATABASE</span>
                        <strong>utility_billing_db</strong>
                    </div>
                </aside>

                <main className="query-main">
                    <section className="editor-panel">
                        <div className="editor-header">
                            <span>QUERY EDITOR</span>

                            <button
                                className="run-button"
                                onClick={runQuery}
                                disabled={loading}
                            >
                                {loading ? "RUNNING..." : "RUN QUERY"}
                            </button>
                        </div>

                        <div className="crud-toolbar">
                            <div className="crud-toolbar-label">
                                <span>RECORD ACTIONS</span>
                                <small>
                                    All database tables • Admin approval required
                                </small>
                            </div>

                            <div className="crud-toolbar-buttons">
                                <button
                                    type="button"
                                    className="crud-button add"
                                    onClick={() => openCrud("add")}
                                    disabled={loading || crudLoading}
                                >
                                    ＋ Add record
                                </button>

                                <button
                                    type="button"
                                    className="crud-button edit"
                                    onClick={() => openCrud("edit")}
                                    disabled={loading || crudLoading}
                                >
                                    ✎ Edit record
                                </button>

                                <button
                                    type="button"
                                    className="crud-button delete"
                                    onClick={() => openCrud("delete")}
                                    disabled={loading || crudLoading}
                                >
                                    ⌫ Delete record
                                </button>
                            </div>
                        </div>

                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            spellCheck="false"
                            placeholder="Enter SQL query..."
                        />
                    </section>

                    <section className="results-panel">
                        <div className="results-header">
                            <div>
                                <span>RESULTS</span>
                                <strong>
                                    {pendingSubmission
                                        ? "Pending admin approval"
                                        : !executed
                                        ? "No execution"
                                        : loading
                                        ? "Executing..."
                                        : getResultSummary(result)}
                                </strong>
                            </div>

                            {executed && !error && !pendingSubmission && (
                                <span className="success-label">QUERY COMPLETE</span>
                            )}
                        </div>

                        {pendingSubmission ? (
                            <PendingApprovalResult submission={pendingSubmission} />
                        ) : error ? (
                            <div className="results-error">
                                <strong>QUERY ERROR</strong>
                                <span>{error}</span>
                            </div>
                        ) : !executed ? (
                            <div className="results-empty">Run a query to view results.</div>
                        ) : isRowResult ? (
                            <ResultTable rows={resultRows} columns={resultColumns} />
                        ) : (
                            <OperationResult result={result} />
                        )}
                    </section>
                </main>
            </div>

            {crudMode && (
                <CrudModal
                    mode={crudMode}
                    table={crudTable}
                    tables={CRUD_TABLES}
                    columns={crudColumns}
                    records={crudRecords}
                    form={crudForm}
                    selectedRecord={selectedRecord}
                    loading={crudLoading}
                    error={crudError}
                    onTableChange={handleCrudTableChange}
                    onRecordChange={handleRecordChange}
                    onChange={handleCrudFieldChange}
                    onClose={closeCrud}
                    onSubmit={submitCrud}
                />
            )}
        </div>
    );
}

/* =========================================================
   GENERIC CRUD HELPERS
========================================================= */

function normalizeColumn(column) {
    return {
        name: column.Field,
        type: column.Type || "varchar(255)",
        nullable: String(column.Null).toUpperCase() === "YES",
        key: String(column.Key || "").toUpperCase(),
        defaultValue: column.Default,
        extra: String(column.Extra || "").toLowerCase(),
    };
}

function getKeyColumns(columns) {
    const primary = columns.filter((column) => column.key === "PRI");
    if (primary.length) return primary;

    // Fallback for unusual schemas: a unique key can still identify a row,
    // but the user is warned if the table truly has no usable key.
    return columns.filter((column) => column.key === "UNI");
}

function isGeneratedColumn(column) {
    return column.extra.includes("auto_increment") || column.extra.includes("generated");
}

function createEmptyForm(columns) {
    return columns.reduce((form, column) => {
        if (!isGeneratedColumn(column)) {
            form[column.name] = "";
        }
        return form;
    }, {});
}

function quoteIdentifier(identifier) {
    return `\`${String(identifier).replace(/`/g, "``")}\``;
}

function sqlString(value) {
    return `'${String(value).replace(/'/g, "''")}'`;
}

function isNumericType(type = "") {
    return /^(tinyint|smallint|mediumint|int|integer|bigint|decimal|numeric|float|double|real|bit)/i.test(
        type
    );
}

function isBooleanType(type = "") {
    return /^(tinyint\(1\)|boolean|bool)$/i.test(type);
}

function sqlLiteral(value, column, { allowBlankNull = true } = {}) {
    const raw = value === null || value === undefined ? "" : String(value);
    const trimmed = raw.trim();

    if (trimmed === "") {
        if (allowBlankNull && column.nullable) return "NULL";
        throw new Error(`${column.name} is required.`);
    }

    if (isBooleanType(column.type)) {
        const normalized = trimmed.toLowerCase();
        if (["true", "1", "yes"].includes(normalized)) return "1";
        if (["false", "0", "no"].includes(normalized)) return "0";
        throw new Error(`${column.name} must be true/false or 1/0.`);
    }

    if (isNumericType(column.type)) {
        const number = Number(trimmed);
        if (!Number.isFinite(number)) {
            throw new Error(`${column.name} must be a valid number.`);
        }
        return String(number);
    }

    return sqlString(raw);
}

function buildInsertSql(table, columns, form) {
    const insertColumns = [];
    const values = [];

    for (const column of columns) {
        if (isGeneratedColumn(column)) continue;

        const raw = form[column.name];
        const trimmed = raw === null || raw === undefined ? "" : String(raw).trim();

        // Let MySQL use a declared default when the user leaves that optional
        // field blank. For nullable fields with no default, use NULL.
        if (trimmed === "" && column.defaultValue !== null && column.defaultValue !== undefined) {
            continue;
        }

        insertColumns.push(quoteIdentifier(column.name));
        values.push(sqlLiteral(raw, column));
    }

    if (!insertColumns.length) {
        throw new Error("Enter at least one value for the new record.");
    }

    return `INSERT INTO ${quoteIdentifier(table)}\n    (${insertColumns.join(", ")})\nVALUES\n    (${values.join(", ")});`;
}

function buildUpdateSql(table, columns, currentRecord, form) {
    const keyColumns = getKeyColumns(columns);
    const assignments = [];

    for (const column of columns) {
        if (column.key === "PRI" || column.key === "UNI") continue;
        if (isGeneratedColumn(column)) continue;

        const before = normalizeComparable(currentRecord[column.name], column);
        const after = normalizeComparable(form[column.name], column);

        if (before !== after) {
            assignments.push(
                `${quoteIdentifier(column.name)} = ${sqlLiteral(form[column.name], column)}`
            );
        }
    }

    if (!assignments.length) {
        throw new Error("No changes detected in the selected record.");
    }

    const where = keyColumns.map((column) => {
        const value = currentRecord[column.name];
        return `${quoteIdentifier(column.name)} = ${sqlLiteral(value, column, {
            allowBlankNull: false,
        })}`;
    });

    return `UPDATE ${quoteIdentifier(table)}\nSET\n    ${assignments.join(",\n    ")}\nWHERE ${where.join(" AND ")};`;
}

function buildDeleteSql(table, keyColumns, record) {
    const where = keyColumns.map((column) => {
        const value = record[column.name];

        if (value === null || value === undefined) {
            return `${quoteIdentifier(column.name)} IS NULL`;
        }

        return `${quoteIdentifier(column.name)} = ${sqlLiteral(value, column, {
            allowBlankNull: false,
        })}`;
    });

    return `DELETE FROM ${quoteIdentifier(table)}\nWHERE ${where.join(" AND ")};`;
}

function normalizeComparable(value, column) {
    if (value === null || value === undefined) return "__NULL__";
    if (/date|time|year/i.test(column.type)) return String(value).slice(0, 19);
    return String(value);
}

function recordKey(record, columns) {
    const keyColumns = getKeyColumns(columns);
    if (!keyColumns.length) return JSON.stringify(record);

    return keyColumns
        .map((column) => `${column.name}=${record[column.name] ?? "NULL"}`)
        .join("|#|");
}

function extractRows(data) {
    if (!data) return [];
    if (Array.isArray(data.rows)) return data.rows;
    if (Array.isArray(data.result)) return flattenResultRows(data.result);
    if (Array.isArray(data.executionResult?.rows)) return data.executionResult.rows;
    return [];
}

function flattenResultRows(result) {
    if (!result.length) return [];

    if (result.every((item) => item && typeof item === "object" && !Array.isArray(item))) {
        return result;
    }

    for (const part of result) {
        if (Array.isArray(part) && part.length && typeof part[0] === "object") {
            return part;
        }
    }

    return [];
}

/* =========================================================
   CRUD MODAL
========================================================= */

function CrudModal({
    mode,
    table,
    tables,
    columns,
    records,
    form,
    selectedRecord,
    loading,
    error,
    onTableChange,
    onRecordChange,
    onChange,
    onClose,
    onSubmit,
}) {
    const isAdd = mode === "add";
    const isEdit = mode === "edit";
    const isDelete = mode === "delete";
    const keyColumns = getKeyColumns(columns);

    const title = isAdd
        ? "Add record"
        : isEdit
        ? "Edit record"
        : "Delete record";

    const actionText = isAdd
        ? "Submit for approval"
        : isEdit
        ? "Submit changes"
        : "Submit deletion";

    const editableColumns = columns.filter(
        (column) =>
            !isGeneratedColumn(column) &&
            !(isEdit && (column.key === "PRI" || column.key === "UNI"))
    );

    return (
        <div
            className="crud-overlay"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <div className="crud-modal">
                <div className="crud-modal-header">
                    <div>
                        <span className="crud-eyebrow">
                            {table.toUpperCase()} / RECORD ACTION
                        </span>
                        <h2>{title}</h2>
                        <p>
                            This creates an SQL request and sends it through the existing
                            admin approval workflow. The database is not changed yet.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="crud-close"
                        onClick={onClose}
                        disabled={loading}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <div className="crud-select-row">
                    <label>
                        <span>TABLE</span>
                        <select
                            value={table}
                            onChange={(e) => onTableChange(e.target.value)}
                            disabled={loading}
                        >
                            {tables.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </label>

                    {(isEdit || isDelete) && (
                        <label>
                            <span>RECORD</span>
                            <select
                                value={selectedRecord}
                                onChange={(e) => onRecordChange(e.target.value)}
                                disabled={loading || !records.length}
                            >
                                {!records.length ? (
                                    <option value="">No records found</option>
                                ) : (
                                    records.map((record) => (
                                        <option
                                            key={recordKey(record, columns)}
                                            value={recordKey(record, columns)}
                                        >
                                            {recordLabel(record, columns)}
                                        </option>
                                    ))
                                )}
                            </select>
                        </label>
                    )}
                </div>

                {loading && (
                    <div className="crud-loading">Loading table structure and records…</div>
                )}

                {!loading && !keyColumns.length && (isEdit || isDelete) && (
                    <div className="crud-warning">
                        This table has no declared primary/unique key available for a safe
                        edit/delete operation.
                    </div>
                )}

                {!loading && columns.length > 0 && (
                    <div className="crud-form-grid">
                        {isDelete ? (
                            <div className="crud-delete-preview">
                                <div className="crud-preview-label">SELECTED RECORD</div>
                                <div className="crud-preview-table-wrap">
                                    <table>
                                        <thead>
                                            <tr>
                                                {columns.map((column) => (
                                                    <th key={column.name}>{column.name}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {records
                                                .filter(
                                                    (record) =>
                                                        recordKey(record, columns) === selectedRecord
                                                )
                                                .slice(0, 1)
                                                .map((record) => (
                                                    <tr key={recordKey(record, columns)}>
                                                        {columns.map((column) => (
                                                            <td key={column.name}>
                                                                {formatValue(record[column.name])}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="crud-danger-note">
                                    The selected record will only be deleted after an administrator
                                    approves the generated DELETE statement.
                                </div>
                            </div>
                        ) : (
                            editableColumns.map((column) => {
                                const value = form[column.name] ?? "";
                                const disabled =
                                    isEdit &&
                                    (column.key === "PRI" || column.key === "UNI");

                                return (
                                    <CrudField
                                        key={column.name}
                                        column={column}
                                        value={value}
                                        disabled={disabled}
                                        onChange={onChange}
                                    />
                                );
                            })
                        )}
                    </div>
                )}

                {isEdit && (
                    <div className="crud-help">
                        Primary/unique key fields identify the record and are read-only during
                        edit. Composite keys are supported automatically.
                    </div>
                )}

                {error && <div className="crud-error">{error}</div>}

                <div className="crud-modal-actions">
                    <button
                        type="button"
                        className="crud-cancel"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className={`crud-submit ${isDelete ? "danger" : ""}`}
                        onClick={onSubmit}
                        disabled={loading || !columns.length || ((isEdit || isDelete) && !selectedRecord)}
                    >
                        {loading ? "Submitting…" : actionText}
                    </button>
                </div>
            </div>
        </div>
    );
}

function CrudField({ column, value, disabled, onChange }) {
    const inputType = getInputType(column.type);
    const isLongText = /text|blob|json/i.test(column.type);

    return (
        <label className="crud-field">
            <span>
                {column.name}
                {column.nullable ? "" : " *"}
            </span>

            {isLongText ? (
                <textarea
                    value={value ?? ""}
                    onChange={(e) => onChange(column.name, e.target.value)}
                    disabled={disabled}
                    placeholder={column.type}
                />
            ) : (
                <input
                    type={inputType}
                    value={formatInputValue(value, inputType)}
                    onChange={(e) => onChange(column.name, e.target.value)}
                    disabled={disabled}
                    placeholder={column.type}
                    step={inputType === "number" ? "any" : undefined}
                />
            )}

            <small>
                {column.type}
                {column.key === "PRI" ? " • PRIMARY KEY" : ""}
                {column.key === "UNI" ? " • UNIQUE" : ""}
                {column.defaultValue !== null && column.defaultValue !== undefined
                    ? ` • default ${column.defaultValue}`
                    : ""}
            </small>
        </label>
    );
}

function getInputType(type = "") {
    if (isNumericType(type)) return "number";
    if (/^date$/i.test(type)) return "date";
    if (/datetime|timestamp/i.test(type)) return "datetime-local";
    if (/^time/i.test(type)) return "time";
    return "text";
}

function formatInputValue(value, inputType) {
    if (value === null || value === undefined) return "";
    const stringValue = String(value);
    if (inputType === "datetime-local") return stringValue.slice(0, 16).replace(" ", "T");
    return stringValue;
}

function recordLabel(record, columns) {
    const keyColumns = getKeyColumns(columns);
    if (keyColumns.length) {
        return keyColumns
            .map((column) => `${column.name}: ${formatValue(record[column.name])}`)
            .join(" • ");
    }

    const firstColumn = columns[0];
    return firstColumn
        ? `${firstColumn.name}: ${formatValue(record[firstColumn.name])}`
        : "Record";
}

/* =========================================================
   RESULTS
========================================================= */

function PendingApprovalResult({ submission }) {
    return (
        <div className="pending-result">
            <span className="pending-badge">PENDING APPROVAL</span>
            <strong>
                {submission.operation
                    ? `${submission.operation} request submitted`
                    : "Write request submitted"}
            </strong>
            <span>
                {submission.table ? `${submission.table} will be changed only after approval.` : "The database has not been changed yet."}
                An administrator must approve this request before the stored SQL is executed.
            </span>
            {submission.requestId && (
                <code>REQUEST #{submission.requestId}</code>
            )}
        </div>
    );
}

function ResultTable({ rows, columns }) {
    return (
        <div className="query-results-wrapper">
            <table className="query-results">
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th key={column}>{column}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {columns.map((column) => (
                                <td key={column}>{formatValue(row[column])}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function OperationResult({ result }) {
    const affectedRows = getAffectedRows(result);
    const insertId = getInsertId(result);

    return (
        <div className="operation-result">
            <div className="operation-result-title">
                QUERY EXECUTED SUCCESSFULLY
            </div>
            <div className="operation-result-grid">
                <div>
                    <span>OPERATION</span>
                    <strong>DML / DDL</strong>
                </div>
                <div>
                    <span>AFFECTED ROWS</span>
                    <strong>{affectedRows}</strong>
                </div>
                {insertId !== null && (
                    <div>
                        <span>INSERT ID</span>
                        <strong>{insertId}</strong>
                    </div>
                )}
            </div>
        </div>
    );
}

/* =========================================================
   RESULT HELPERS
========================================================= */

function getRows(result) {
    return extractRows(result);
}

function getColumns(result, rows) {
    if (rows.length > 0) return Object.keys(rows[0]);

    if (Array.isArray(result?.fields) && result.fields.length > 0) {
        return result.fields.map((field) => field.name || field.orgName || "column");
    }

    if (Array.isArray(result?.executionResult?.fields) && result.executionResult.fields.length > 0) {
        return result.executionResult.fields.map((field) => field.name || field.orgName || "column");
    }

    return [];
}

function getAffectedRows(result) {
    if (!result) return 0;
    if (typeof result.affectedRows === "number") return result.affectedRows;
    if (typeof result.executionResult?.affectedRows === "number") return result.executionResult.affectedRows;
    if (typeof result.result?.affectedRows === "number") return result.result.affectedRows;
    return 0;
}

function getInsertId(result) {
    if (!result) return null;
    if (typeof result.insertId === "number" && result.insertId > 0) return result.insertId;
    if (typeof result.executionResult?.insertId === "number" && result.executionResult.insertId > 0) {
        return result.executionResult.insertId;
    }
    if (typeof result.result?.insertId === "number" && result.result.insertId > 0) return result.result.insertId;
    return null;
}

function getResultSummary(result) {
    const rows = getRows(result);
    if (rows.length > 0) return `${rows.length} rows`;

    const affectedRows = getAffectedRows(result);
    if (affectedRows > 0) return `${affectedRows} affected`;

    return "Query complete";
}

function formatValue(value) {
    if (value === null || value === undefined) return "—";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
}

export default QueryStudio;
