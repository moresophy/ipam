# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-04-01

### Added
- **Toast notification system**: All `alert()` dialogs replaced with a professional bottom-right toast system (auto-dismiss after 4 s, success/error/info variants with icons, `aria-live` region for screen readers).
- **Accessibility**: Added `aria-label` to all icon-only buttons (theme toggle, logout, settings, import/export, edit/add/delete in the subnet tree).
- **Loading states on forms**: Subnet and IP modal submit buttons are now disabled and show `…` during async API calls.
- **Escape key to close modals**: All modals (subnet, IP, delete confirmation, settings) close on `Escape`.

### Fixed
- **Backend – IP reassignment on subnet creation**: Root-level subnets never triggered IP reassignment (guarded by `if new_subnet.parent_id`). Rewritten to use `ipaddress.subnet_of()` across all existing subnets regardless of depth.
- **Backend – subnet tree unlimited depth**: `organizeSubnets` only built two levels (children of top-level). Replaced with a recursive `buildTree(parentId)` that handles arbitrary nesting.
- **Backend – N+1 queries**: Fixed in `get_ips`, `import_ips`, and `export_ips` by loading all subnets once and building a lookup dict.
- **Backend – numeric IP sort**: IPs in `get_ips` and `export_ips` are now sorted by numeric value (`ipaddress.ip_address()`), not lexicographically.
- **Backend – CIDR normalization**: `ip_network(cidr, strict=False)` normalises host bits on subnet creation.
- **Backend – debug mode**: Removed `debug=True` hardcode; now reads `FLASK_DEBUG` env var.
- **Backend – security**: Removed `print()` statements in `login()` that leaked password hashes to stdout. Translated all German API error messages to English.
- **Frontend – stale closure in context menu**: `useEffect` listener was re-registered on every context menu state change. Fixed with functional `setState` and `[]` dependency array.
- **Frontend – O(1) subnet lookups**: `subnetById` Map (useMemo) replaces `Array.find()` in `getSubnetPath`.
- **Frontend – memoization**: `filteredIps` and `subnetPath` wrapped in `useMemo`.
- **Frontend – lazy state init**: `ThemeContext` and `SettingsModal` use `useState(() => localStorage.getItem(...))` to avoid reading localStorage on every render.
- **Frontend – ESLint**: Fixed unused `err` catch variables and `react-refresh/only-export-components` warnings.

### Changed
- **UI redesign – Dashboard**: Dark sidebar (`slate-900`), breadcrumb navigation, compact IP table with semantic architecture badge colors, sticky table header, professional modals.
- **UI redesign – Login**: Split layout (dark branding panel left, form right), password show/hide toggle, loading state on submit.
- **UI redesign – SettingsModal**: Section headers, scrollable content area, feedback messages as colored boxes.

## [1.2.3] - 2026-01-21

### Fixed
- Updated browser title to "IPAM" and added favicon.
- Subnet sorting by IP address for better readability.
- Various UI polish improvements.

## [1.2.2] - 2026-01-20

### Added
- Subnet auto-sorting by IP address.
- UI polish across the dashboard.

## [1.2.1] - 2026-01-19

### Fixed
- Use relative `/api` path in frontend (fixes login in Kubernetes).
- Updated CORS settings for Kubernetes ingress.

## [1.2.0] - 2026-01-16

### Added
- **PostgreSQL Support**: Migrated from SQLite to PostgreSQL for production environments.
- **Data Conversion Tools**: `convert_excel_to_csv.py`, `convert_ods_to_csv.py` for legacy data migration.
- **Extended Architecture Options**: VM, Virtual, Bare Metal, Container, IoT Device, and more.
- **UI & UX Improvements**: Increased font sizes, improved dark mode contrast, optimised subnet column layout.

## [1.1.0] - 2026-01-14

### Added
- **CSV Import/Export**: `GET /api/export/ips` and `POST /api/import/ips`. Frontend UI in settings menu.

## [1.0.0] - 2025-11-21

### Added
- Initial release: hierarchical subnet management, IPv4 support, JWT authentication, German localization, Kubernetes manifests.
