# Development & Project Memory

## 📝 Project Overview
**IPAM (IP Address Management System)** is a modern, web-based application for managing hierarchical subnets and IP addresses. It features automated IP assignment, search capabilities, CSV import/export, and is fully localized in German.

## 🛠 Tech Stack

### Backend
- **Framework**: Flask 3.1.0
- **Language**: Python 3.9+
- **Language**: Python 3.9+
- **Database**: SQLite (Development), PostgreSQL (Production)
- **ORM**: SQLAlchemy 2.0
- **Auth**: JWT (Flask-JWT-Extended)
- **Server**: Gunicorn

### Localization (i18n)
The frontend uses `i18next` for internationalization. Translation files are located in `frontend/src/locales/*.json`.
supported languages: `en`, `de`, `es`, `fr`, `ja`, `pt`, `ru`, `zh`.

**Adding a new key:**
1. Add the key and translation to `frontend/src/locales/en.json` (Source of Truth).
2. Add the translation to all other locale files.
3. Use `t('key_name')` in React components.


### Frontend
- **Framework**: React 19
- **Build Tool**: Vite 7.x
- **Styling**: Tailwind CSS v4
- **HTTP Client**: Axios

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes (K8s)
- **CI/CD**: GitLab CI
- **Registry**: Docker Hub (moresophy)

## 📂 Project Structure

```
ip-network/
├── backend/                # Flask Application
│   ├── app.py              # Entry point
│   ├── models.py           # DB Schema
│   ├── routes.py           # API Endpoints
│   ├── requirements.txt    # Python deps
│   └── Dockerfile          # Backend container
├── frontend/               # React Application
│   ├── src/                # Source code
│   ├── package.json        # Node deps
│   └── Dockerfile          # Frontend container
├── k8s/                    # Kubernetes Manifests
│   ├── backend-*.yaml      # Backend resources
│   ├── frontend-*.yaml     # Frontend resources
│   ├── ingress.yaml        # Ingress routing
│   └── secret.yaml         # Sensitive config
├── instance/               # Instance-specific config (Flask)
├── CICD.md                 # CI/CD Documentation
├── README.md               # General Documentation
└── deploy.sh               # Quick deploy script
```

## 🚀 Development Setup

### Local Development

#### Backend
1. Navigate to `backend/`
2. Create venv: `python -m venv venv`
3. Activate: `source venv/bin/activate`
4. Install: `pip install -r requirements.txt`
5. Run: `python app.py` matches `http://127.0.0.1:5000`

#### Frontend
1. Navigate to `frontend/`
2. Install: `npm install`
3. Run: `npm run dev` matches `http://localhost:5173`

### Docker Config

To build manually:
```bash
docker build -t ipam-backend:latest ./backend
docker build -t ipam-frontend:latest ./frontend
```

### Docker Compose
To start the entire environment locally:

```bash
docker compose up -d --build
```


- **Frontend**: http://localhost:8080
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:5000

## 🛠 Helper Scripts (Data Migration)

To assist with migrating legacy data, several helper scripts are available in the root directory:

- **`analyze_excel.py` / `analyze_ods.py`**: Inspects the structure of source spreadsheet files.
- **`convert_excel_to_csv.py`**: Converts multi-table Excel files (like `moresophy.xlsx`) into importable CSVs. Logic includes subnet inference and architecture mapping.
- **`convert_ods_to_csv.py`**: Converts ODS files (like `moresophy_new.ods`) to CSV, filtering for valid entries.

*Note: These scripts require `pandas`, `openpyxl`, and `odfpy`. It is recommended to run them inside the backend container where these dependencies are installed.*


## ☸️ Kubernetes Deployment

See `k8s/README.md` for detailed steps.
- **Namespace**: `ipam`
- **Ingress**: `ipam.example.com` (configurable)
- **Secrets**: Managed via `k8s/secret.yaml`

## 🧠 Memory / Context (Maintenance Notes)

### Discrepancies & TODOs
- **Database**: Default is SQLite. For production, `DATABASE_URI` is set to PostgreSQL in k8s config and docker-compose.

### Infrastructure Details
- **Registry**: Used for image registry (Docker Hub).
- **GitLab CI**: Pushes images to Docker Hub on commit to `main`/`develop`.

### Security
- **Auth**: JWT-based.
- **Secrets**: Kubernetes secrets used for DB and JWT keys.
