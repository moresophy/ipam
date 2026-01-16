# GitLab CI/CD Pipeline für IPAM

Diese Pipeline baut automatisch die Docker-Images für Backend und Frontend und pusht sie zu Harbor.

## Voraussetzungen

### GitLab CI/CD Variablen

Folgende Variablen müssen in GitLab unter **Settings → CI/CD → Variables** konfiguriert werden:

| Variable | Typ | Wert | Beschreibung |
|----------|-----|------|--------------|
| `CI_REGISTRY_USER` | Variable | Your Docker Hub Username | Registry Username |
| `CI_REGISTRY_PASSWORD` | Masked | Your Docker Hub Password/Token | Registry Password |

### Docker Hub Repository

Stellen Sie sicher, dass die folgenden Repositories in Docker Hub existieren:
- `moresophy/ipam-backend`
- `moresophy/ipam-frontend`

Falls nicht, erstellen Sie die Repositories in Docker Hub.

## Pipeline-Übersicht

Die Pipeline besteht aus einer **Build-Stage** mit zwei parallelen Jobs:

### 1. `backend-build`
- Baut das Backend Docker-Image
- Context: `backend/`
- Dockerfile: `backend/Dockerfile`
- Tags:
  - `$CI_COMMIT_SHA` - Git Commit Hash
  - `latest` - Neueste Version
  - `$CI_COMMIT_REF_SLUG` - Branch-Name (z.B. `main`, `develop`)

### 2. `frontend-build`
- Baut das Frontend Docker-Image
- Context: `frontend/`
- Dockerfile: `frontend/Dockerfile`
- Tags:
  - `$CI_COMMIT_SHA` - Git Commit Hash
  - `latest` - Neueste Version
  - `$CI_COMMIT_REF_SLUG` - Branch-Name (z.B. `main`, `develop`)

## Trigger-Bedingungen

Die Pipeline läuft nur bei:
- Commits auf `main` Branch
- Commits auf `develop` Branch
- Git Tags

## Image-Tags

Nach einem erfolgreichen Build sind die Images unter folgenden Tags verfügbar:

```bash
# Backend
moresophy/ipam-backend:latest
moresophy/ipam-backend:abc1234  # Commit SHA
moresophy/ipam-backend:main     # Branch name

# Frontend
moresophy/ipam-frontend:latest
moresophy/ipam-frontend:abc1234  # Commit SHA
moresophy/ipam-frontend:main     # Branch name
```

## Verwendung in Kubernetes

Nach dem Build können Sie die Images in Kubernetes verwenden:

```yaml
# backend-deployment.yaml
spec:
  containers:
  - name: backend
    image: moresophy/ipam-backend:latest
    # oder spezifischer:
    # image: moresophy/ipam-backend:abc1234

# frontend-deployment.yaml
spec:
  containers:
  - name: frontend
    image: moresophy/ipam-frontend:latest
```

## Manuelle Pipeline-Ausführung

```bash
# Pipeline manuell triggern
git commit --allow-empty -m "Trigger CI/CD"
git push origin main
```

## Troubleshooting

- Prüfen Sie die Docker-Credentials in GitLab CI/CD Variablen
- Stellen Sie sicher, dass der User Schreibrechte auf das Repository hat

### Pipeline schlägt fehl: "repository does not exist"
- Erstellen Sie das Repository `moresophy/ipam-backend` in Docker Hub
- Oder passen Sie `CI_REGISTRY_IMAGE_BACKEND` und `CI_REGISTRY_IMAGE_FRONTEND` in `.gitlab-ci.yml` an

### Image Pull schlägt in Kubernetes fehl
- Erstellen Sie ein Image Pull Secret:
  ```bash
  kubectl create secret docker-registry regcred \
    --docker-server=https://index.docker.io/v1/ \
    --docker-username=<username> \
    --docker-password=<password> \
    -n ipam
  ```
- Fügen Sie es zum Deployment hinzu:
  ```yaml
  spec:
    imagePullSecrets:
    - name: regcred
  ```

## Erweiterte Konfiguration

### Nur bestimmte Branches bauen

```yaml
only:
  - main
  - /^release-.*$/  # Alle release-* Branches
```

### Build-Cache aktivieren

Kaniko unterstützt Layer-Caching:

```yaml
script:
  - /kaniko/executor 
    --cache=true
    --cache-repo=$CI_REGISTRY_IMAGE_BACKEND/cache
    ...
```

### Multi-Arch Builds

Für ARM64 und AMD64:

```yaml
script:
  - /kaniko/executor 
    --customPlatform=linux/amd64
    --customPlatform=linux/arm64
    ...
```

## Pipeline-Status

Sie können den Pipeline-Status in GitLab unter **CI/CD → Pipelines** einsehen.
