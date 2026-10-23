# GridFlow PostgreSQL Database

## Schema
`001_schema.sql` contains an initial PostgreSQL adaptation of the original MySQL table definitions.

The original SQL files are preserved in `database/` for reference.

## Validation
Run `database/tests/001_validate_schema.sql` after applying the schema.
It should find 20 application tables.

## Remaining work
- Validate the schema against a running PostgreSQL instance.
- Port sample data and reporting queries to PostgreSQL.
- Replace MySQL-specific DATE_FORMAT expressions.
- Evaluate TimescaleDB support for meter readings.
