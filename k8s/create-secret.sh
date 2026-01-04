#!/bin/bash
# Script to create calendrun-backend-credentials secret in Kubernetes
# Usage: ./create-secret.sh
# NOTE: This matches the actual deployment manifest in public-customer-sites-manifests

set -e

NAMESPACE="public-sites"
SECRET_NAME="calendrun-backend-credentials"

echo "Creating secret: $SECRET_NAME in namespace: $NAMESPACE"
echo ""
echo "Please provide the following values:"
echo ""

read -sp "Database URL: " DATABASE_URL
echo ""
read -sp "Flowcore API Key: " FLOWCORE_API_KEY
echo ""
read -sp "Backend API Key: " BACKEND_API_KEY
echo ""

kubectl create secret generic "$SECRET_NAME" \
  --namespace="$NAMESPACE" \
  --from-literal=database-url="$DATABASE_URL" \
  --from-literal=flowcore-api-key="$FLOWCORE_API_KEY" \
  --from-literal=backend-api-key="$BACKEND_API_KEY" \
  --dry-run=client -o yaml | kubectl apply -f -

echo ""
echo "✅ Secret '$SECRET_NAME' created successfully in namespace '$NAMESPACE'"
echo ""
echo "To verify: kubectl get secret $SECRET_NAME -n $NAMESPACE"
echo "To view keys: kubectl get secret $SECRET_NAME -n $NAMESPACE -o jsonpath='{.data}' | jq 'keys'"

