# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-01-16

### Added
- **PostgreSQL Support**: Migrated from SQLite to PostgreSQL for production environments.
    - Updated Docker Compose to include `postgres` service.
    - Added Kubernetes manifests for PostgreSQL deployment (`postgres.yaml`).
- **Data Conversion Tools**: Added Python scripts to convert legacy data formats to IPAM-compatible CSV.
    - `convert_excel_to_csv.py`: Handles multi-table Excel files.
    - `convert_ods_to_csv.py`: Handles ODS spreadsheet files.
- **Extended Architecture Options**: Added support for VM, Virtual, Bare Metal, Container, IoT, and more.
- **UI & UX Improvements**:
    - **Visual Overhaul**: Increased font sizes and heading weights for better readability.
    - **Dark Mode**: Improved contrast with white text for tables.
    - **Layout**: Optimized Subnet column to stack Name and CIDR vertically.
    - **Fixes**: Resolved issue with Import CSV button not responding.

## [1.1.0] - 2026-01-14

### Added
- **CSV Import/Export**: Added capability to export all IP addresses to a CSV file and import them back.
    - `GET /api/export/ips`: Download all IPs as `ipam_export.csv`.
    - `POST /api/import/ips`: Upload a CSV file to bulk add or update IP addresses.
    - Frontend UI: Added "Import CSV" and "Export CSV" options in the settings menu.

## [1.0.0] - 2025-11-21

### Added
- Initial release of IPAM.
- Hierarchical subnet management.
- IPv4 support with automatic validation.
- German localization.
- JWT Authentication.
- Kubernetes deployment manifests.
