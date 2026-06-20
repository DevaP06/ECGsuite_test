#!/bin/bash
# Deploy the ECG storage Cloud Function
# Prerequisites: gcloud CLI authenticated, GCS bucket created
#
# Usage: ./deploy.sh <BUCKET_NAME> [INTERNAL_API_KEY]
#
# Example:
#   ./deploy.sh ecgenius-ecg-uploads my-secret-key

BUCKET_NAME=$1
INTERNAL_KEY=$2

if [ -z "$BUCKET_NAME" ]; then
  echo "Usage: ./deploy.sh <BUCKET_NAME> [INTERNAL_API_KEY]"
  exit 1
fi

ENV_VARS="GCS_BUCKET_NAME=$BUCKET_NAME"
if [ -n "$INTERNAL_KEY" ]; then
  ENV_VARS="$ENV_VARS,INTERNAL_API_KEY=$INTERNAL_KEY"
fi

gcloud functions deploy ecg-storage \
  --runtime=nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point=ecgStorage \
  --region=asia-south1 \
  --memory=256MB \
  --timeout=60s \
  --set-env-vars="$ENV_VARS" \
  --source=.
