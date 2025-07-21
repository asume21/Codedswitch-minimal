#!/bin/bash
# Script to deploy the worker to Render

# Exit on error
set -e

# Check for required environment variables
if [ -z "$RENDER_SERVICE_ID" ] || [ -z "$RENDER_API_KEY" ]; then
  echo "Error: RENDER_SERVICE_ID and RENDER_API_KEY must be set"
  exit 1
fi

# Build the worker Docker image
docker build -f backend/Dockerfile.worker -t codedswitch-worker .

# Save the image to a tarball
docker save -o worker.tar codedswitch-worker

# Upload to Render using their API
echo "Deploying worker to Render..."
curl -sSf -X POST \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/octet-stream" \
  --data-binary @worker.tar \
  "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys"

echo "\nWorker deployment started successfully!"
