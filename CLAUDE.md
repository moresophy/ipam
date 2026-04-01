# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IPAM is a full-stack IP Address Management web application with a Flask REST API backend and React SPA frontend, supporting hierarchical subnet management with intelligent IP auto-assignment.

## Development Commands

### Backend (Flask)
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python app.py                # Dev server on http://127.0.0.1:5000 (debug mode, SQLite)
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev                  # Vite dev server on http://localhost:5173
npm run build                # Production build → dist/
npm run lint                 # ESLint
npm run preview              # Preview production build locally
```

### Full Stack (Docker Compose)
```bash
docker compose up -d --build
# Backend: http://localhost:5000
# Frontend: http://localhost:8080
# PostgreSQL: localhost:5432 (user: ipam, pass: ipam_password)
```

### Kubernetes
```bash
./deploy.sh                  # Quick deployment
kubectl apply -f k8s/        # Manual deployment (namespace: ipam)
```

## Architecture

### Data Flow
```
React SPA (port 5173/8080)
  → /api prefix (Axios + JWT interceptor)
  → Flask REST API (port 5000)
  → SQLAlchemy ORM
  → SQLite (dev) / PostgreSQL 15 (production)
```

### Backend Structure
- [backend/app.py](backend/app.py) — Flask app factory, CORS setup (`origins: "*"`)
- [backend/models.py](backend/models.py) — SQLAlchemy models: `User`, `Subnet` (with `parent_id` for hierarchy), `IPAddress`
- [backend/routes.py](backend/routes.py) — All REST endpoints: `/api/auth`, `/api/subnets`, `/api/ips`, `/api/import`, `/api/export`, `/api/health`
- [backend/entrypoint.sh](backend/entrypoint.sh) — DB init, default admin user creation, then gunicorn

### Frontend Structure
- [frontend/src/api.js](frontend/src/api.js) — Axios instance; attaches JWT from localStorage on every request
- [frontend/src/context/AuthContext.jsx](frontend/src/context/AuthContext.jsx) — JWT token state and login/logout logic
- [frontend/src/context/ThemeContext.jsx](frontend/src/context/ThemeContext.jsx) — Light/dark mode toggle
- [frontend/src/components/Dashboard.jsx](frontend/src/components/Dashboard.jsx) — Main app (~900 lines): subnet tree, IP table, modals, CSV import/export, context menu, toast notifications
- [frontend/src/components/Login.jsx](frontend/src/components/Login.jsx) — Split-layout login page
- [frontend/src/components/SettingsModal.jsx](frontend/src/components/SettingsModal.jsx) — Language, default CIDR, password change
- [frontend/src/i18n.js](frontend/src/i18n.js) — i18next config with browser language detector

### Key Business Logic (in `routes.py`)

**Intelligent IP Assignment:** When adding an IP, the backend recursively searches the subnet hierarchy (from the specified subnet down through all children) and assigns the IP to the **most specific (smallest prefix)** subnet that contains it.

**Automatic IP Reassignment on Subnet Creation:** When a new subnet is created, the backend uses `ipaddress.subnet_of()` to find ALL existing subnets that contain the new one (not just the parent chain), then moves any IPs from those containing subnets that fall within the new CIDR. Works for root subnets and any nesting depth.

### Frontend Patterns

- `subnetById = useMemo(() => new Map(...))` — O(1) subnet lookups used throughout
- Toast notifications via `showToast(message, type)` — `useCallback`, state array with auto-dismiss timeout
- `ARCH_BADGE` map at module level — semantic badge colors per device type
- `MODAL_INPUT` / `MODAL_LABEL` — shared CSS string constants for form fields
- Subnet tree: recursive `buildTree(parentId)` inside `useMemo` — unlimited depth

### UI Skills

Design skill files at `.agents/skills/` — consult when doing frontend work:
- `ui-ux-pro-max/` — 99 UX rules (accessibility CRITICAL, forms, animation)
- `frontend-design/` — typography, color, motion guidelines
- `web-design-guidelines/` — fetches Vercel guidelines from GitHub for file audits

## Data Model

```
User: id, username, password_hash (pbkdf2:sha256)

Subnet: id, name, cidr (unique, e.g. "10.0.0.0/8"), description, parent_id → Subnet
        relationships: subnets (children), ips (cascade delete)

IPAddress: id, subnet_id → Subnet, ip_address, dns_name, architecture, function
```

## i18n

8 supported languages: EN, DE, ES, FR, JA, PT, RU, ZH. Translation files are in [frontend/src/locales/](frontend/src/locales/). `en.json` is the source of truth. When adding new UI strings:
1. Add key/value to `en.json`
2. Add to all other 7 locale files
3. Use `const { t } = useTranslation()` → `t('key_name')` in components

## Environment & Configuration

Backend reads from `.env` (not committed). Key variables:
- `DATABASE_URI` — defaults to SQLite; set to PostgreSQL URI for production
- `JWT_SECRET_KEY` — required for JWT signing

In Kubernetes, secrets are in [k8s/secret.yaml](k8s/secret.yaml) (base64-encoded).

## Known Issues

- **PostgreSQL "Directory not empty"**: Set `PGDATA=/var/lib/postgresql/data/pgdata` (subdirectory of mount point)
- **Login fails in K8s**: Frontend must use relative `/api` path, not hardcoded backend URL
- **Health checks**: Use `/api/health` (no auth required), not `/api/auth/me`
- **Browser console errors**: Often from browser extensions; test in incognito before debugging

## Testing

No automated tests exist currently. Manual testing is done via Docker Compose stack.
