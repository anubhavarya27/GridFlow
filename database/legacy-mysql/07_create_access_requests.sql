USE utility_billing_db;

CREATE TABLE IF NOT EXISTS access_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,

    requested_by VARCHAR(100) NOT NULL,

    operation ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,

    target_table VARCHAR(100) NOT NULL,

    record_id VARCHAR(255) NULL,

    request_data JSON NULL,

    reason VARCHAR(500) NULL,

    status ENUM('PENDING', 'APPROVED', 'REJECTED')
        NOT NULL DEFAULT 'PENDING',

    reviewed_by VARCHAR(100) NULL,

    reviewed_at DATETIME NULL,

    review_comment VARCHAR(500) NULL,

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at DATETIME NOT NULL
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_access_requests_status (status),

    INDEX idx_access_requests_requested_by (requested_by),

    INDEX idx_access_requests_created_at (created_at)
);
