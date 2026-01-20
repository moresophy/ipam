> [!NOTE]
> This project was created with **Vibe-Coding** and **Antigravity** by **Google**.

# IPAM - IP Address Management System 1.2.2

A modern, web-based IP Address Management System with hierarchical subnets, multilingual support (EN, DE, ES, FR, JA, PT, RU, ZH), and Kubernetes deployment. Now with PostgreSQL support!

![IPAM Dashboard](https://img.shields.io/badge/Status-Production%20Ready-green)
![License](https://img.shields.io/badge/License-MIT-blue)
![Python](https://img.shields.io/badge/Python-3.9-blue)
![React](https://img.shields.io/badge/React-18-blue)

## 🌟 Features

### Core Features
- ✅ **Hierarchical Subnets** - Parent/Child relationships with automatic IP assignment
- ✅ **Intelligent IP Management** - Automatic assignment to the most specific subnet
- ✅ **Search & Filter** - Real-time search across all IP fields
- ✅ **Editing** - Inline editing for subnets and IP addresses
- ✅ **Multilingual Support** - Fully localized in English, German, Spanish, French, Japanese, Portuguese, Russian, and Chinese
- ✅ **Subnet Autosort** - Subnets are automatically sorted by IP address for better readability
- ✅ **Modern UI** - Responsive design with Tailwind CSS v4, custom favicon, and clear branding

### Technical Features
- 🔐 **JWT Authentication** - Secure token-based auth
- 🗄️ **SQLite/PostgreSQL** - Flexible database options
- 🐳 **Docker & Kubernetes** - Production-ready containerization
- 🚀 **CI/CD Pipeline** - Automated builds with GitLab
- 📊 **CIDR Validation** - Automatic network validation
- 🔄 **Automatic Reorganization** - IPs are automatically reassigned when new subnets are added
- 📂 **CSV Import/Export** - Bulk import and export of IP data via CSV
- 🐘 **PostgreSQL** - Robust database for production environments
- 🎨 **Dark Mode** - Optimized dark mode with high contrast

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Installation](#installation)
  - [Local Development](#local-development)
  - [Docker](#docker)
  - [Kubernetes](#kubernetes)
- [Usage](#usage)
  - [Create Hierarchical Subnets](#create-hierarchical-subnets)
  - [Automatic IP Assignment](#automatic-ip-assignment)
  - [Search & Filter](#search--filter)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Configuration](#configuration)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- Docker (optional)
- Kubernetes Cluster (optional)

### Local Installation

```bash
# Clone repository
git clone <repository-url>
cd ip-network

# Start Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py

# Start Frontend (new terminal)
cd frontend
npm install
npm run dev
```

**Access:** http://localhost:5173  
**Login:** `admin` / `password`

## 🏗️ Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────┐
│   React SPA     │─────▶│   Flask API      │─────▶│   SQLite    │
│  (Tailwind v4)  │      │  (JWT Auth)      │      │ PostgreSQL  │
└─────────────────┘      └──────────────────┘      └─────────────┘
     Frontend                  Backend                 Database
```

### Tech Stack

**Backend:**
- Flask 3.1.0
- SQLAlchemy 2.0
- Flask-JWT-Extended
- Python 3.9

**Frontend:**
- React 19
- Vite
- Tailwind CSS v4
- Axios

**Deployment:**
- Docker
- Kubernetes
- GitLab CI/CD
- Docker Hub Registry

## 📸 Screenshots

| Light Mode | Dark Mode |
|:---:|:---:|
| ![Dashboard Light](docs/screenshots/dashboard-light.png) | ![Dashboard Dark](docs/screenshots/dashboard-dark.png) |

<div align="center">
  <img src="docs/screenshots/settings.png" alt="Settings" width="500" />
  <p><i>Flexible Settings & Configuration</i></p>
</div>

## 💻 Installation

### Local Development

#### Backend Setup

```bash
cd backend

# Create Virtual Environment
python -m venv venv
source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt

# Configure Environment Variables
cp .env.example .env
# Edit .env with your values

# Initialize Database & Start Server
python app.py
```

Backend running at: http://127.0.0.1:5000

#### Frontend Setup

```bash
cd frontend

# Install Dependencies
npm install

# Start Development Server
npm run dev
```

Frontend running at: http://localhost:5173

### Docker

```bash
# Build Backend Image
cd backend
docker build -t ipam-backend:latest .

# Build Frontend Image
cd ../frontend
docker build -t ipam-frontend:latest .
```

### Docker Compose

For a complete local environment including PostgreSQL database:

```bash
# Start Backend, Frontend and PostgreSQL Database
docker compose up -d --build
```

This starts:
- **Frontend**: http://localhost:8080
- **Backend**: http://localhost:5000
- **PostgreSQL**: Port 5432


### Kubernetes

See [k8s/README.md](k8s/README.md) for detailed instructions.

**Quick Deploy:**
```bash
./deploy.sh
```

## 📖 Usage

### Create Hierarchical Subnets

1. **Create Main Network:**
   - Click "+" next to "Subnets"
   - Name: "Main Network"
   - CIDR: "10.0.0.0/8"
   - Description: "Main Network"

2. **Create Sub-subnet:**
   - Click on the Main Network
   - Click the green "+" next to the subnet
   - Name: "Development"
   - CIDR: "10.10.0.0/16"
   - Description: "Dev Env"
   - Automatically assigned as child

3. **Add IP Address:**
   - Select a subnet
   - Click "Add IP Address"
   - IP is automatically assigned to the most specific subnet

### Automatic IP Assignment

The system automatically assigns IPs to the **most specific (smallest) matching subnet**:

```
Example:
- Main Network: 10.0.0.0/8
- Sub-subnet: 10.10.0.0/16
- IP 10.10.5.1 → automatically assigned to 10.10.0.0/16
```

If you later create an even more specific subnet (e.g., 10.10.5.0/24), the IPs will be automatically moved there!

### Search & Filter

Use the search field above the IP table to search by:
- IP Address
- DNS Name
- Architecture
- Function
- Subnet Name or CIDR

## 🔌 API Documentation

### Authentication

```bash
# Registration
POST /api/auth/register
{
  "username": "admin",
  "password": "password"
}

# Login
POST /api/auth/login
{
  "username": "admin",
  "password": "password"
}
# Returns: { "access_token": "..." }

# User Info
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

### Subnets

```bash
# Get all subnets
GET /api/subnets
Headers: Authorization: Bearer <token>

# Create subnet
POST /api/subnets
{
  "name": "Production",
  "cidr": "192.168.1.0/24",
  "description": "Production Network",
  "parent_id": null  # Optional
}

# Edit subnet
PUT /api/subnets/<id>
{
  "name": "Updated Name",
  "description": "Updated Description"
}

# Delete subnet
DELETE /api/subnets/<id>
```

### IP Addresses

```bash
# Get IPs of a subnet (incl. child subnets)
GET /api/subnets/<subnet_id>/ips

# Add IP
POST /api/ips
{
  "subnet_id": 1,
  "ip_address": "192.168.1.10",
  "dns_name": "server.local",
  "architecture": "VM",
  "function": "Webserver"
}

# Edit IP
PUT /api/ips/<id>
{
  "dns_name": "updated-server.local",
  "architecture": "Kubernetes",
  "function": "API Server"
}

# Delete IP
DELETE /api/ips/<id>
```

### CSV Import/Export

```bash
# Export all IPs
GET /api/export/ips
# Returns: ipam_export.csv

# Import IPs
POST /api/import/ips
Content-Type: multipart/form-data
file: <csv_file>
# Returns: { "success_count": 5, "errors": [] }
```

## 🚢 Deployment

### Production Deployment with Kubernetes

1. **Build and push images:**
   ```bash
   # Automatically via GitLab CI/CD
   git push origin main
   
   # Or manually
   ./deploy.sh
   ```

2. **Configure Secrets:**
   ```bash
   # Docker Registry Secret (if private)
   kubectl create secret docker-registry regcred \
     --docker-server=https://index.docker.io/v1/ \
     --docker-username=<user> \
     --docker-password=<pass> \
     -n ipam
   
   # Adjust App Secrets
   vim k8s/secret.yaml
   ```

3. **Deploy:**
   ```bash
   kubectl apply -f k8s/
   ```

4. **Check Status:**
   ```bash
   kubectl get pods -n ipam
   kubectl get svc -n ipam
   kubectl get ingress -n ipam
   ```

### GitLab CI/CD

The pipeline automatically builds on every push to `main` or `develop`:

- Backend Image → `moresophy/ipam-backend:latest`
- Frontend Image → `moresophy/ipam-frontend:latest`

See [CICD.md](CICD.md) for details.

## ⚙️ Configuration

### Backend (.env)

```bash
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URI=sqlite:///ipam.db
# Or PostgreSQL:
# DATABASE_URI=postgresql://user:pass@host:5432/ipam
```

### Frontend (Vite)

API URL is configured in `frontend/src/api.js`:
```javascript
baseURL: 'http://127.0.0.1:5000/api'
```

For Production: Via Ingress Routing `/api` → Backend Service

## 🛠️ Development

### Project Structure

```
ip-network/
├── backend/
│   ├── app.py              # Flask App Entry Point
│   ├── models.py           # SQLAlchemy Models
│   ├── routes.py           # API Routes
│   ├── requirements.txt    # Python Dependencies
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/     # React Components
│   │   ├── context/        # Auth Context
│   │   ├── api.js          # Axios Instance
│   │   └── App.jsx
│   ├── package.json
│   └── Dockerfile
├── k8s/                    # Kubernetes Manifests
├── .gitlab-ci.yml          # CI/CD Pipeline
└── deploy.sh               # Deployment Script
```

### Database Schema

```sql
-- User
CREATE TABLE user (
    id INTEGER PRIMARY KEY,
    username VARCHAR(80) UNIQUE,
    password_hash VARCHAR(255)
);

-- Subnet (hierarchical)
CREATE TABLE subnet (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100),
    cidr VARCHAR(20) UNIQUE,
    description VARCHAR(200),
    parent_id INTEGER REFERENCES subnet(id)
);

-- IP Address
CREATE TABLE ip_address (
    id INTEGER PRIMARY KEY,
    subnet_id INTEGER REFERENCES subnet(id),
    ip_address VARCHAR(20),
    dns_name VARCHAR(100),
    architecture VARCHAR(50),
    function VARCHAR(100)
);
```

### Run Tests

```bash
# Backend Tests (TODO)
cd backend
pytest

# Frontend Tests (TODO)
cd frontend
npm test
```

## 🐛 Troubleshooting

### Backend does not start

```bash
# Check Python Version
python --version  # Should be 3.9+

# Check Dependencies
pip install -r requirements.txt

# Check Logs
python app.py
```

### Frontend shows no data

```bash
# Check if Backend is running
curl http://127.0.0.1:5000/api/auth/me

# Check Browser Console
# Open DevTools (F12) → Console

# Check API URL in frontend/src/api.js
```

### Kubernetes Pod does not start

```bash
# Show Logs
kubectl logs -n ipam -l app=ipam-backend
kubectl describe pod -n ipam -l app=ipam-backend

# Check Events
kubectl get events -n ipam --sort-by='.lastTimestamp'
```

### Database Backup

```bash
# SQLite Backup
cp backend/ipam.db backend/ipam_backup_$(date +%Y%m%d).db

# Kubernetes Backup
BACKEND_POD=$(kubectl get pod -n ipam -l app=ipam-backend -o jsonpath='{.items[0].metadata.name}')
kubectl cp ipam/$BACKEND_POD:/data/ipam.db ./backup.db
```

## 📚 Further Documentation

- [Kubernetes Deployment Guide](k8s/README.md)
- [CI/CD Pipeline Setup](CICD.md)
- [Walkthrough](walkthrough.md)

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

- Developed with ❤️ for efficient IP management

## 🙏 Acknowledgements

- Flask & SQLAlchemy Community
- React & Vite Teams
- Tailwind CSS
- Kubernetes Community

---

**Status:** Production Ready ✅  
**Version:** 1.2.2  
**Last Update:** January 2026
