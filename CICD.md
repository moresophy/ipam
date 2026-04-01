# GitLab CI/CD Pipeline for IPAM

This pipeline automatically builds Docker images for the backend and frontend and pushes them to Docker Hub.

## Prerequisites

### GitLab CI/CD Variables

Configure the following variables under **Settings → CI/CD → Variables**:

| Variable | Type | Value | Description |
|----------|------|-------|-------------|
| `CI_REGISTRY_USER` | Variable | Your Docker Hub username | Registry username |
| `CI_REGISTRY_PASSWORD` | Masked | Your Docker Hub password/token | Registry password |

### Docker Hub Repositories

Ensure the following repositories exist in Docker Hub:
- `moresophy/ipam-backend`
- `moresophy/ipam-frontend`

## Pipeline Overview

The pipeline has a single **build stage** with two parallel jobs:

### 1. `backend-build`
- Builds the backend Docker image
- Context: `backend/`
- Tags: `$CI_COMMIT_SHA`, `latest`, `$CI_COMMIT_REF_SLUG`

### 2. `frontend-build`
- Builds the frontend Docker image
- Context: `frontend/`
- Tags: `$CI_COMMIT_SHA`, `latest`, `$CI_COMMIT_REF_SLUG`

## Trigger Conditions

The pipeline runs on:
- Commits to `main` branch
- Commits to `develop` branch
- Git tags

## Image Tags

After a successful build:

```bash
# Backend
moresophy/ipam-backend:latest
moresophy/ipam-backend:1.3.0      # Semantic version tag
moresophy/ipam-backend:abc1234    # Commit SHA

# Frontend
moresophy/ipam-frontend:latest
moresophy/ipam-frontend:1.3.0
moresophy/ipam-frontend:abc1234
```

## Manual Build & Push

```bash
# Build and push both images
docker build -t moresophy/ipam-backend:latest -t moresophy/ipam-backend:1.3.0 ./backend
docker build -t moresophy/ipam-frontend:latest -t moresophy/ipam-frontend:1.3.0 ./frontend
docker push moresophy/ipam-backend:latest
docker push moresophy/ipam-backend:1.3.0
docker push moresophy/ipam-frontend:latest
docker push moresophy/ipam-frontend:1.3.0
```

## Usage in Kubernetes

```yaml
# backend-deployment.yaml
spec:
  containers:
  - name: backend
    image: moresophy/ipam-backend:latest

# frontend-deployment.yaml
spec:
  containers:
  - name: frontend
    image: moresophy/ipam-frontend:latest
```

## Troubleshooting

### Pipeline fails: "repository does not exist"
Create `moresophy/ipam-backend` and `moresophy/ipam-frontend` on Docker Hub, or update the image names in `.gitlab-ci.yml`.

### Image pull fails in Kubernetes
```bash
kubectl create secret docker-registry regcred \
  --docker-server=https://index.docker.io/v1/ \
  --docker-username=<username> \
  --docker-password=<password> \
  -n ipam
```

Add to deployment:
```yaml
spec:
  imagePullSecrets:
  - name: regcred
```

## Advanced Configuration

### Cache between builds (Kaniko)

```yaml
script:
  - /kaniko/executor
    --cache=true
    --cache-repo=moresophy/ipam-backend/cache
    ...
```

### Multi-arch builds

```yaml
script:
  - /kaniko/executor
    --customPlatform=linux/amd64
    --customPlatform=linux/arm64
    ...
```
