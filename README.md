> [!NOTE]
> This project was created with **Vibe-Coding** and **Antigravity** by **Google**.

# IPAM — IP Address Management System 1.3.0

A modern, web-based IP Address Management system with hierarchical subnets, multilingual support (EN, DE, ES, FR, JA, PT, RU, ZH), and Kubernetes deployment.

![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![License](https://img.shields.io/badge/License-MIT-blue)
![Python](https://img.shields.io/badge/Python-3.9-blue)
![React](https://img.shields.io/badge/React-19-blue)

## Features

### Core
- **Hierarchical Subnets** — unlimited parent/child depth, recursive tree view
- **Intelligent IP Assignment** — automatically assigns IPs to the most specific matching subnet
- **IP Auto-Reassignment** — when a more specific subnet is created, IPs migrate to it automatically
- **Search & Filter** — real-time search across IP, DNS name, architecture, function, subnet
- **CSV Import/Export** — bulk import and export of IP data
- **Multilingual** — 8 languages: EN, DE, ES, FR, JA, PT, RU, ZH

### UI
- **Professional dark sidebar** with resizable pane and breadcrumb navigation
- **Toast notifications** — all actions give non-blocking feedback (auto-dismiss, success/error)
- **Semantic architecture badges** — color-coded by device type (VM, Kubernetes, Firewall, etc.)
- **Dark mode** — system-aware, toggleable
- **Accessible** — `aria-label` on all icon-only buttons, keyboard-navigable modals (Escape to close)

### Technical
- **JWT Authentication** — token-based, stored in `localStorage`
- **SQLite / PostgreSQL** — SQLite for development, PostgreSQL 15 for production
- **Docker & Kubernetes** — production-ready containerization
- **GitLab CI/CD** — automated image builds pushed to Docker Hub (`moresophy`)

## Screenshots

| Light Mode | Dark Mode |
|:---:|:---:|
| ![Dashboard Light](images/dashboard-light.png) | ![Dashboard Dark](images/dashboard-dark.png) |

![Login](images/login.png)

## Quick Start

### Prerequisites
- Python 3.9+, Node.js 18+, Docker (optional)

### Local

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python app.py           # http://127.0.0.1:5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev             # http://localhost:5173
```

**Login:** `admin` / `password`

### Docker Compose

```bash
docker compose up -d --build
# Frontend: http://localhost:8080
# Backend:  http://localhost:5000
```

### Kubernetes

```bash
./deploy.sh
# or
kubectl apply -f k8s/
```

See [k8s/README.md](k8s/README.md) for details.

## Architecture

```
React SPA (port 5173 / 8080)
  → /api prefix  (Axios + JWT interceptor)
  → Flask REST API (port 5000)
  → SQLAlchemy ORM
  → SQLite (dev) / PostgreSQL 15 (prod)
```

**Backend:** Flask 3.1.0, SQLAlchemy 2.0, Flask-JWT-Extended, Gunicorn  
**Frontend:** React 19, Vite, Tailwind CSS v4, Axios, i18next

## API Reference

### Authentication

```bash
POST /api/auth/login          # { username, password } → { access_token }
GET  /api/auth/me             # requires Bearer token
POST /api/auth/change-password
GET  /api/health              # public, used for health checks
```

### Subnets

```bash
GET    /api/subnets
POST   /api/subnets           # { name, cidr, description, parent_id }
PUT    /api/subnets/<id>      # { name, description }
DELETE /api/subnets/<id>
```

### IP Addresses

```bash
GET    /api/subnets/<id>/ips  # includes IPs from child subnets, sorted numerically
POST   /api/ips               # { subnet_id, ip_address, dns_name, architecture, function }
PUT    /api/ips/<id>
DELETE /api/ips/<id>
```

### Import / Export

```bash
GET  /api/export/ips          # returns ipam_export.csv
POST /api/import/ips          # multipart/form-data, field: file (.csv)
```

## Configuration

### Backend (`.env`)

```bash
DATABASE_URI=sqlite:///ipam.db    # or postgresql://user:pass@host:5432/ipam
JWT_SECRET_KEY=change-me
SECRET_KEY=change-me
FLASK_DEBUG=false
```

### Docker Compose

The compose file sets `FLASK_DEBUG=1` and connects to the included PostgreSQL service. For production, use the Kubernetes manifests with proper secrets.

## Deployment

### Build & push images

```bash
docker build -t moresophy/ipam-backend:latest -t moresophy/ipam-backend:1.3.0 ./backend
docker build -t moresophy/ipam-frontend:latest -t moresophy/ipam-frontend:1.3.0 ./frontend
docker push moresophy/ipam-backend:latest && docker push moresophy/ipam-backend:1.3.0
docker push moresophy/ipam-frontend:latest && docker push moresophy/ipam-frontend:1.3.0
```

CI/CD via GitLab pushes `latest` and the commit SHA on every merge to `main`. See [CICD.md](CICD.md).

## Troubleshooting

| Problem | Fix |
|---------|-----|
| PostgreSQL "Directory not empty" | Set `PGDATA=/var/lib/postgresql/data/pgdata` |
| Login fails in Kubernetes | `api.js` must use relative `/api` path, not hardcoded URL |
| Health check 401 loop | Probe `/api/health`, not `/api/auth/me` |
| Browser console errors | Test in incognito — likely browser extensions |

## Further Documentation

- [Kubernetes Deployment Guide](k8s/README.md)
- [CI/CD Pipeline](CICD.md)
- [Development Notes](DEVELOPMENT.md)
- [Changelog](CHANGELOG.md)

## License

MIT
