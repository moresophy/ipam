# Development & Project Notes

## Project Overview

**IPAM** is a web-based IP Address Management system with a Flask REST API backend and React SPA frontend. It supports hierarchical subnet management with intelligent IP auto-assignment, multilingual UI, and CSV import/export.

## Tech Stack

### Backend
- **Framework**: Flask 3.1.0
- **Language**: Python 3.9+
- **Database**: SQLite (dev), PostgreSQL 15 (production)
- **ORM**: SQLAlchemy 2.0
- **Auth**: Flask-JWT-Extended (JWT tokens stored in `localStorage`)
- **Server**: Gunicorn (production), Flask dev server (local)

### Frontend
- **Framework**: React 19
- **Build**: Vite 7.x
- **Styling**: Tailwind CSS v4
- **HTTP**: Axios — JWT attached via request interceptor in `api.js`
- **i18n**: i18next with browser language detector (8 languages: EN, DE, ES, FR, JA, PT, RU, ZH)

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes (namespace: `ipam`)
- **CI/CD**: GitLab CI → Docker Hub (`moresophy`)
- **Registry**: `moresophy/ipam-backend`, `moresophy/ipam-frontend`

## Local Development

### Backend

```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python app.py   # http://127.0.0.1:5000, SQLite
```

Environment variables (`.env`, not committed):
- `DATABASE_URI` — PostgreSQL URI for production; defaults to SQLite
- `JWT_SECRET_KEY` — required for JWT signing
- `FLASK_DEBUG` — set to `true` to enable debug mode

### Frontend

```bash
cd frontend
npm install
npm run dev     # http://localhost:5173
npm run build   # production build → dist/
npm run lint    # ESLint
```

### Docker Compose (full stack)

```bash
docker compose up -d --build
# Frontend: http://localhost:8080
# Backend:  http://localhost:5000
# PostgreSQL: port 5432 (user: ipam / ipam_password)
```

## Key Business Logic

### IP Auto-Assignment (`routes.py → add_ip`)
When adding an IP address, the backend recursively searches the subnet hierarchy and assigns the IP to the **most specific (highest prefix length) subnet** that contains it — regardless of which subnet the user selected.

### IP Reassignment on Subnet Creation (`routes.py → create_subnet`)
When a new subnet is created, all existing subnets are checked with `ipaddress.subnet_of()`. Any IPs in a containing subnet that now fall within the new, more specific subnet are moved there automatically. This works for any depth, including root subnets.

### Subnet Tree (unlimited depth)
`Dashboard.jsx` builds the subnet tree with a recursive `buildTree(parentId)` function. There is no depth limit.

## i18n

Translation source of truth: `frontend/src/locales/en.json`.

When adding a new UI string:
1. Add to `en.json`
2. Add to all 7 other locale files (`de`, `es`, `fr`, `ja`, `pt`, `ru`, `zh`)
3. Use `const { t } = useTranslation()` → `t('key_name')` in components

## Data Migration Scripts

Legacy data can be migrated with the root-level helper scripts:
- `analyze_excel.py` / `analyze_ods.py` — inspect source file structure
- `convert_excel_to_csv.py` — convert multi-table Excel to importable CSV
- `convert_ods_to_csv.py` — convert ODS to CSV

These require `pandas`, `openpyxl`, and `odfpy`. Run inside the backend container where these are available.

## Architecture Badges

The IP table displays architecture type as a colored badge. The mapping is defined in `Dashboard.jsx → ARCH_BADGE`. Supported types: VM, Virtual, Bare Metal, Kubernetes, Docker, Container, LXC, Gateway, Router, Switch, Firewall, Load Balancer, Wifi, NFS, Storage, Printer, IoT Device, Server.

## UI Skills

Three design skill files are installed at `.agents/skills/`:
- `frontend-design/` — typography, color, motion, spatial composition guidelines
- `ui-ux-pro-max/` — 99 UX rules across 10 priority categories (accessibility, forms, animation, etc.)
- `web-design-guidelines/` — fetches Vercel's web interface guidelines for file audits

Consult these when doing any frontend or design work.

## Known Issues

### PostgreSQL "Directory not empty"
Set `PGDATA=/var/lib/postgresql/data/pgdata` (a subdirectory) to avoid collision with `lost+found` on Kubernetes volumes.

### Login fails in Kubernetes
Frontend `api.js` must use a relative path (`baseURL: '/api'`), not a hardcoded backend URL. Ingress routes `/api` to the backend service.

### Health checks
Use `/api/health` for liveness/readiness probes — it returns 200 without authentication. `/api/auth/me` returns 401 and causes pod restart loops.

### Browser console errors
Errors from `background.js` or WebSocket connections are usually from browser extensions. Test in incognito before debugging.

## Testing

No automated tests currently exist. Manual testing via the Docker Compose stack. A future test suite should cover:
- IP auto-assignment edge cases (overlapping CIDRs, root subnet creation)
- CSV import validation
- JWT token expiry handling
