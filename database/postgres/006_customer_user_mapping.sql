-- Link application users to customer records.
-- Existing users remain unmapped until explicitly assigned.
-- Administrators do not require a customer mapping.

ALTER TABLE app_user
    ADD COLUMN IF NOT EXISTS cust_id INT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_app_user_customer'
          AND conrelid = 'app_user'::regclass
    ) THEN
        ALTER TABLE app_user
            ADD CONSTRAINT fk_app_user_customer
            FOREIGN KEY (cust_id)
            REFERENCES Customer(cust_id)
            ON UPDATE CASCADE
            ON DELETE RESTRICT;
    END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_app_user_cust_id
    ON app_user(cust_id)
    WHERE cust_id IS NOT NULL;

ALTER TABLE app_user
    ADD CONSTRAINT chk_app_user_customer_mapping
    CHECK (role = 'ADMIN' OR cust_id IS NOT NULL)
    NOT VALID;
