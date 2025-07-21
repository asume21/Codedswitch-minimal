#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment process..."

# Build the frontend
echo "🔨 Building frontend..."
cd frontend
npm install
npm run build

# Copy _redirects file to dist directory
echo "📝 Copying _redirects file..."
cp _redirects dist/

# Build the Docker image
echo "🐳 Building Docker image..."
cd ..
docker build -t codedswitch -f Dockerfile.backend .

echo "✅ Deployment build complete!"
echo "To run locally: docker run -p 10000:10000 codedswitch"
echo "To deploy to Render, push to GitHub and let the CI/CD pipeline handle the rest."
