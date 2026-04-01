# IPAM Kubernetes Deployment

This directory contains all Kubernetes manifests for the IPAM deployment.

## Prerequisites

- Kubernetes cluster (v1.20+)
- `kubectl` configured
- Ingress controller (e.g. nginx-ingress)
- Docker for image builds

## Deployment Steps

### 1. Build and push Docker images

```bash
docker build -t moresophy/ipam-backend:latest ./backend
docker build -t moresophy/ipam-frontend:latest ./frontend
docker push moresophy/ipam-backend:latest
docker push moresophy/ipam-frontend:latest
```

### 2. Configure secrets

Edit `k8s/secret.yaml` with base64-encoded values:

```bash
# Generate secure secrets
python3 -c "import secrets; print(secrets.token_hex(32))"
echo -n "your-value" | base64
```

Key secrets to set:
- `JWT_SECRET_KEY` — JWT signing key
- `SECRET_KEY` — Flask session key
- `DATABASE_URI` — PostgreSQL connection string

### 3. Configure Ingress

In `k8s/ingress.yaml`:
- Replace `ipam.example.com` with your domain
- Adjust `ingressClassName` to match your ingress controller
- Optionally enable TLS/HTTPS

### 4. Deploy

```bash
# Deploy all resources at once
kubectl apply -f k8s/

# Or in order (first time)
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/pvc.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/ingress.yaml
```

### 5. Verify

```bash
kubectl get pods -n ipam
kubectl get svc -n ipam
kubectl get ingress -n ipam
kubectl logs -n ipam -l app=ipam-backend
```

**Default login:** `admin` / `password` — change immediately after first login.

## Scaling

```bash
# Scale frontend (stateless)
kubectl scale deployment ipam-frontend -n ipam --replicas=3

# Backend: only scale with PostgreSQL — SQLite supports a single replica only
```

## Database Backup & Restore

```bash
BACKEND_POD=$(kubectl get pod -n ipam -l app=ipam-backend -o jsonpath='{.items[0].metadata.name}')

# Backup
kubectl cp ipam/$BACKEND_POD:/data/ipam.db ./ipam-backup-$(date +%Y%m%d).db

# Restore
kubectl cp ./ipam-backup.db ipam/$BACKEND_POD:/data/ipam.db
kubectl rollout restart deployment ipam-backend -n ipam
```

## Manifest Reference

| File | Kind | Description |
|------|------|-------------|
| `namespace.yaml` | Namespace | `ipam` namespace |
| `secret.yaml` | Secret | DB URI, JWT/Flask keys |
| `configmap.yaml` | ConfigMap | Non-sensitive env vars |
| `pvc.yaml` | PVC | Persistent storage for SQLite |
| `backend-deployment.yaml` | Deployment | Flask API (1 replica) |
| `backend-service.yaml` | Service | Backend ClusterIP |
| `frontend-deployment.yaml` | Deployment | React SPA via nginx (2 replicas) |
| `frontend-service.yaml` | Service | Frontend ClusterIP |
| `ingress.yaml` | Ingress | HTTP(S) routing, `/api` → backend |

## Known Issues

### PostgreSQL "Directory not empty"
Set `PGDATA=/var/lib/postgresql/data/pgdata` (a subdirectory of the mount point) so PostgreSQL does not encounter the `lost+found` directory on first init.

### Health check endpoint
Liveness/readiness probes must target `/api/health` (no auth required), **not** `/api/auth/me` (returns 401 → pod restart loop).

### Troubleshooting

```bash
# Backend logs
kubectl logs -n ipam -l app=ipam-backend

# Describe pod
kubectl describe pod -n ipam -l app=ipam-backend

# Check ingress
kubectl describe ingress -n ipam ipam-ingress

# Full teardown
kubectl delete namespace ipam
```
