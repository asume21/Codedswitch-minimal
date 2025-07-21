#!/bin/bash

# Exit on error
set -e

# Navigate to frontend directory
echo "=== Preparing frontend build ==="
cd frontend

# Clean up previous build
echo "Cleaning up previous build..."
rm -rf node_modules/.vite
rm -rf dist

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install --force

# Build the frontend
echo "Building frontend..."
npm run build

# Verify build files
echo "Verifying build files..."
if [ ! -f "dist/index.html" ]; then
  echo "Error: Frontend build failed - index.html not found"
  exit 1
fi

# Copy _redirects to dist directory
echo "Copying _redirects file..."
cp public/_redirects dist/

# Navigate back to root directory
cd ..

# Build the Docker image
echo "=== Building backend Docker image ==="
docker build -t codedswitch-backend -f Dockerfile .

# Verify Docker image
if [ $? -ne 0 ]; then
  echo "Error: Docker build failed"
  exit 1
fi

echo "=== Deployment completed successfully! ==="
echo "Frontend built and Docker image created."
echo "To run locally: docker run -p 10000:10000 codedswitch-backend"
echo "To deploy to Render, push to GitHub and let the CI/CD pipeline handle the rest."
