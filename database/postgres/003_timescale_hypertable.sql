-- GridFlow migration 003: convert meter_reading to a hypertable.
-- Requires TimescaleDB and the existing GridFlow schema.

CREATE EXTENSION IF NOT EXISTS timescaledb;

DO $migration$
DECLARE
    is_hypertable BOOLEAN;
    pk_columns TEXT[];
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM timescaledb_information.hypertables
        WHERE hypertable_schema = 'public'
          AND hypertable_name = 'meter_reading'
    ) INTO is_hypertable;

    IF NOT is_hypertable THEN
        SELECT array_agg(a.attname ORDER BY k.ordinality)
        INTO pk_columns
        FROM pg_constraint c
        CROSS JOIN LATERAL unnest(c.conkey)
            WITH ORDINALITY AS k(attnum, ordinality)
        JOIN pg_attribute a
          ON a.attrelid = c.conrelid AND a.attnum = k.attnum
        WHERE c.contype = 'p'
          AND c.conrelid = 'public.meter_reading'::regclass;

        IF pk_columns = ARRAY['meter_id', 'reading_no']::TEXT[] THEN
            ALTER TABLE public.meter_reading
                DROP CONSTRAINT meter_reading_pkey;
            ALTER TABLE public.meter_reading
                ADD CONSTRAINT meter_reading_pkey
                PRIMARY KEY (meter_id, reading_no, reading_date);
        ELSIF pk_columns IS DISTINCT FROM
              ARRAY['meter_id', 'reading_no', 'reading_date']::TEXT[] THEN
            RAISE EXCEPTION 'Unexpected meter_reading primary key: %', pk_columns;
        END IF;

        PERFORM create_hypertable(
            'public.meter_reading',
            by_range('reading_date', INTERVAL '1 month'),
            if_not_exists => TRUE
        );
    END IF;
END
$migration$;
