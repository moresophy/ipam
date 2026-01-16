# IPAM Kubernetes Deployment

Dieses Verzeichnis enthält alle Kubernetes-Manifeste für das IPAM-Deployment.

## Voraussetzungen

- Kubernetes Cluster (v1.20+)
- kubectl konfiguriert
- Ingress Controller (z.B. nginx-ingress)
- Docker für Image-Builds

## Deployment-Schritte

### 1. Docker Images bauen

```bash
# Backend Image
cd backend
docker build -t ipam-backend:latest .

# Frontend Image
cd ../frontend
docker build -t ipam-frontend:latest .
```

### 2. Images in Registry pushen (optional)

Wenn Sie eine Container Registry verwenden:

```bash
# Tag images
docker tag ipam-backend:latest your-registry/ipam-backend:latest
docker tag ipam-frontend:latest your-registry/ipam-frontend:latest

# Push
docker push your-registry/ipam-backend:latest
docker push your-registry/ipam-frontend:latest
```

Dann in den Deployment-Dateien die `image:` Zeilen anpassen.

### 3. Secrets anpassen

**WICHTIG**: Ändern Sie die Secrets in `k8s/secret.yaml`:

```bash
# Generiere sichere Secrets
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Tragen Sie die generierten Werte in `secret.yaml` ein.

### 4. Ingress-Konfiguration anpassen

In `k8s/ingress.yaml`:
- Ändern Sie `ipam.example.com` zu Ihrer Domain
- Passen Sie `ingressClassName` an Ihren Ingress Controller an
- Optional: Aktivieren Sie TLS/HTTPS

### 5. Deployment ausführen

```bash
# Alle Ressourcen deployen
kubectl apply -f k8s/

# Oder einzeln in der richtigen Reihenfolge:
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

### 6. Status überprüfen

```bash
# Pods anzeigen
kubectl get pods -n ipam

# Services anzeigen
kubectl get svc -n ipam

# Ingress anzeigen
kubectl get ingress -n ipam

# Logs anzeigen
kubectl logs -n ipam -l app=ipam-backend
kubectl logs -n ipam -l app=ipam-frontend
```

## Zugriff auf die Anwendung

Nach erfolgreichem Deployment:

- **URL**: http://ipam.example.com (oder Ihre konfigurierte Domain)
- **Standard-Login**: admin / password (sollte nach erstem Login geändert werden!)

## Skalierung

```bash
# Frontend skalieren
kubectl scale deployment ipam-frontend -n ipam --replicas=3

# Backend skalieren (Achtung: SQLite unterstützt nur 1 Replica!)
# Für mehrere Backend-Replicas auf PostgreSQL umstellen
```

## Backup der Datenbank

```bash
# Pod-Name ermitteln
BACKEND_POD=$(kubectl get pod -n ipam -l app=ipam-backend -o jsonpath='{.items[0].metadata.name}')

# Datenbank kopieren
kubectl cp ipam/$BACKEND_POD:/data/ipam.db ./ipam-backup-$(date +%Y%m%d).db
```

## Restore der Datenbank

```bash
# Datenbank wiederherstellen
kubectl cp ./ipam-backup.db ipam/$BACKEND_POD:/data/ipam.db

# Pod neu starten
kubectl rollout restart deployment ipam-backend -n ipam
```

## Migration zu PostgreSQL

Für Production-Umgebungen wird PostgreSQL empfohlen:

1. PostgreSQL in Kubernetes deployen (oder externe Instanz verwenden)
2. `configmap.yaml` anpassen:
   ```yaml
   DATABASE_URI: "postgresql://user:password@postgres-service:5432/ipam"
   ```
3. Backend neu deployen

## Troubleshooting

### Backend startet nicht
```bash
kubectl logs -n ipam -l app=ipam-backend
kubectl describe pod -n ipam -l app=ipam-backend
```

### Frontend zeigt Fehler
```bash
# Prüfen ob Backend erreichbar ist
kubectl exec -n ipam -it deployment/ipam-frontend -- wget -O- http://ipam-backend:5000/api/auth/me
```

### Ingress funktioniert nicht
```bash
kubectl describe ingress -n ipam ipam-ingress
# Prüfen Sie Ingress Controller Logs
```

## Deinstallation

```bash
# Alle Ressourcen löschen
kubectl delete namespace ipam
```

## Ressourcen-Übersicht

| Ressource | Typ | Beschreibung |
|-----------|-----|--------------|
| namespace.yaml | Namespace | IPAM Namespace |
| secret.yaml | Secret | Sensitive Konfiguration |
| configmap.yaml | ConfigMap | Umgebungsvariablen |
| pvc.yaml | PVC | Persistenter Speicher für DB |
| backend-deployment.yaml | Deployment | Backend (1 Replica) |
| backend-service.yaml | Service | Backend ClusterIP |
| frontend-deployment.yaml | Deployment | Frontend (2 Replicas) |
| frontend-service.yaml | Service | Frontend ClusterIP |
| ingress.yaml | Ingress | HTTP(S) Routing |
