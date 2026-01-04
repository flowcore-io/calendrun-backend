# Kubernetes Configuration

⚠️ **Note**: The actual Kubernetes deployment manifests are managed in the [`flowcore-io/public-customer-sites-manifests`](https://github.com/flowcore-io/public-customer-sites-manifests) repository, as referenced in `flowcore.deployment.json`.

This folder contains utility scripts and reference files for managing Kubernetes secrets and configuration.

## Files

- **`create-secret.sh`** - Script to create the `calendrun-backend-credentials` secret in Kubernetes. This matches the secret name used in the actual deployment manifest.
- **`secret.yaml.example`** - Example Kubernetes secret manifest for reference (not used for deployment).

## Usage

To create or update the backend secrets:

```bash
cd backend/k8s
./create-secret.sh
```

This will prompt for:
- Database URL
- Flowcore API Key
- Backend API Key

The secret will be created in the `public-sites` namespace with the name `calendrun-backend-credentials`.

