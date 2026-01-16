#!/bin/bash
set -e

echo "🚀 IPAM Kubernetes Deployment Script"
echo "======================================"

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funktion für farbige Ausgabe
info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Prüfe ob kubectl verfügbar ist
if ! command -v kubectl &> /dev/null; then
    error "kubectl ist nicht installiert!"
    exit 1
fi

# Prüfe ob docker verfügbar ist
if ! command -v docker &> /dev/null; then
    error "docker ist nicht installiert!"
    exit 1
fi

# Variablen
REGISTRY="${REGISTRY:-moresophy}"
BACKEND_IMAGE="${REGISTRY}/ipam-backend:latest"
FRONTEND_IMAGE="${REGISTRY}/ipam-frontend:latest"

info "Registry: $REGISTRY"

# 1. Docker Images bauen
info "Baue Backend Image..."
cd backend
docker build -t ipam-backend:latest .
docker tag ipam-backend:latest $BACKEND_IMAGE

info "Baue Frontend Image..."
cd ../frontend
docker build -t ipam-frontend:latest .
docker tag ipam-frontend:latest $FRONTEND_IMAGE

# 2. Images pushen (wenn Registry gesetzt)
if [ "$REGISTRY" != "localhost:5000" ]; then
    info "Pushe Images zu Registry..."
    docker push $BACKEND_IMAGE
    docker push $FRONTEND_IMAGE
fi

cd ..

# 3. Kubernetes Ressourcen deployen
info "Deploye Kubernetes Ressourcen..."

kubectl apply -f k8s/namespace.yaml
info "✓ Namespace erstellt"

kubectl apply -f k8s/secret.yaml
warn "⚠️  WICHTIG: Ändern Sie die Secrets in k8s/secret.yaml für Production!"

kubectl apply -f k8s/configmap.yaml
info "✓ ConfigMap erstellt"

kubectl apply -f k8s/pvc.yaml
info "✓ PersistentVolumeClaim erstellt"

kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/backend-service.yaml
info "✓ Backend deployed"

kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/frontend-service.yaml
info "✓ Frontend deployed"

kubectl apply -f k8s/ingress.yaml
warn "⚠️  Passen Sie die Domain in k8s/ingress.yaml an!"

# 4. Warte auf Pods
info "Warte auf Pod-Start..."
kubectl wait --for=condition=ready pod -l app=ipam-backend -n ipam --timeout=120s
kubectl wait --for=condition=ready pod -l app=ipam-frontend -n ipam --timeout=120s

# 5. Status anzeigen
echo ""
info "Deployment abgeschlossen! 🎉"
echo ""
echo "Status:"
kubectl get pods -n ipam
echo ""
kubectl get svc -n ipam
echo ""
kubectl get ingress -n ipam
echo ""
info "Zugriff auf die Anwendung über die konfigurierte Ingress-Domain"
info "Standard-Login: admin / password"
echo ""
warn "Nächste Schritte:"
echo "  1. Secrets in k8s/secret.yaml ändern"
echo "  2. Domain in k8s/ingress.yaml anpassen"
echo "  3. TLS/HTTPS konfigurieren"
echo "  4. Admin-Passwort ändern"
