-- =====================================================================
-- GridPulse | 07_views.sql
-- ---------------------------------------------------------------------
-- Helper views used by the backend.  Plain PostgreSQL.
-- =====================================================================

\set ON_ERROR_STOP on
SET ROLE gridpulse_app;

-- ----------------------------------------------------------------------
-- v_meter_profile
--   One row per meter with its utility service, the derived service type
--   (supertype/subtype specialization), its measurement unit, property
--   and owners.
--
--   Units: the U/BILL model stores no unit of measure.  GridPulse uses
--   kWh for ELECTRICITY_SERVICE meters and kL (kilolitres) for
--   WATER_SERVICE meters; documented in docs/DATABASE_MIGRATION.md.
--
--   METER_SERVICE is M:N.  Every legacy meter has exactly one service; if
--   a meter ever has several, the lowest service_id is used here and
--   service_count > 1 lets the backend warn about it.
-- ----------------------------------------------------------------------
CREATE OR REPLACE VIEW v_meter_profile AS
WITH ranked_service AS (
    SELECT
        ms.meter_id,
        ms.service_id,
        COUNT(*) OVER (PARTITION BY ms.meter_id)                     AS service_count,
        ROW_NUMBER() OVER (PARTITION BY ms.meter_id ORDER BY ms.service_id) AS rn
    FROM meter_service ms
),
owners AS (
    SELECT
        pim.meter_id,
        STRING_AGG(c.cust_name, ', ' ORDER BY cop.ownership_date, c.cust_id) AS owner_names,
        MIN(c.cust_id)                                                      AS primary_cust_id
    FROM property_incorporate_meter pim
    JOIN customer_owns_property cop ON cop.property_id = pim.property_id
    JOIN customer c                 ON c.cust_id = cop.cust_id
    GROUP BY pim.meter_id
)
SELECT
    m.meter_id,
    m.meter_status,
    m.capacity,
    m.installation_date,
    pim.property_id,
    p.property_name,
    o.owner_names,
    o.primary_cust_id,
    rs.service_id,
    COALESCE(rs.service_count, 0)  AS service_count,
    CASE
        WHEN es.service_id IS NOT NULL THEN 'Electricity'
        WHEN ws.service_id IS NOT NULL THEN 'Water'
        ELSE 'Other'
    END                            AS service_type,
    CASE
        WHEN es.service_id IS NOT NULL THEN 'kWh'
        WHEN ws.service_id IS NOT NULL THEN 'kL'
        ELSE 'units'
    END                            AS unit,
    es.voltage_level,
    ws.water_source,
    us.fixed_charge,
    us.unit_rate                   AS service_unit_rate,
    us.tax
FROM meter m
LEFT JOIN property_incorporate_meter pim ON pim.meter_id = m.meter_id
LEFT JOIN property p                     ON p.property_id = pim.property_id
LEFT JOIN owners o                       ON o.meter_id = m.meter_id
LEFT JOIN ranked_service rs              ON rs.meter_id = m.meter_id AND rs.rn = 1
LEFT JOIN utility_service us             ON us.service_id = rs.service_id
LEFT JOIN electricity_service es         ON es.service_id = rs.service_id
LEFT JOIN water_service ws               ON ws.service_id = rs.service_id;

\echo 'Views created. Next: 08_query_studio_privileges.sql'
