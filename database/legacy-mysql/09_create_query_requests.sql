USE utility_billing_db;

CREATE TABLE IF NOT EXISTS QUERY_REQUEST (
    request_id INT AUTO_INCREMENT PRIMARY KEY,

    submitted_by INT NOT NULL,

    reviewed_by INT NULL,

    sql_query TEXT NOT NULL,

    query_type VARCHAR(30) NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',

    submitted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    reviewed_at DATETIME NULL,

    rejection_reason VARCHAR(500) NULL,

    execution_result TEXT NULL,

    CONSTRAINT fk_query_request_submitted_by
        FOREIGN KEY (submitted_by)
        REFERENCES users(user_id),

    CONSTRAINT fk_query_request_reviewed_by
        FOREIGN KEY (reviewed_by)
        REFERENCES users(user_id)
);