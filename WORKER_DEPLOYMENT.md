# CodedSwitch Worker Deployment

This document explains how to deploy the CodedSwitch AI music generation worker.

## Prerequisites

1. Docker installed locally
2. Render account with API access
3. Redis instance (can be Render's Redis)

## Environment Variables

Ensure these environment variables are set in your Render service:

```
REDIS_URL=redis://user:pass@host:port/db
MODEL_NAME=facebook/musicgen-large
```

## Deployment Steps

### 1. Build and Deploy Manually

1. Build the worker Docker image:
   ```bash
   cd backend
   docker build -f Dockerfile.worker -t codedswitch-worker .
   ```

2. Push to your container registry and update your Render service to use this image.

### 2. Using the Deployment Script

1. Make the script executable:
   ```bash
   chmod +x deploy_worker.sh
   ```

2. Set required environment variables:
   ```bash
   export RENDER_SERVICE_ID=your-service-id
   export RENDER_API_KEY=your-render-api-key
   ```

3. Run the deployment script:
   ```bash
   ./deploy_worker.sh
   ```

## Verifying the Worker

1. Check the logs in your Render dashboard
2. The worker should connect to Redis and start processing jobs
3. Test by submitting a job through the API

## Troubleshooting

### Common Issues

1. **Missing Dependencies**:
   - Ensure all system packages are installed in the Dockerfile
   - Check the build logs for any missing libraries

2. **Redis Connection Issues**:
   - Verify the REDIS_URL is correct
   - Check if the Redis instance is accessible from Render's network

3. **Model Download Failures**:
   - The worker needs internet access to download the model
   - Check network policies in your Render environment

## Monitoring

- Monitor the worker through Render's dashboard
- Set up alerts for worker failures
- Check Redis queue length to ensure jobs are being processed

## Scaling

- To handle more jobs, scale the worker service in Render
- Each worker can process one job at a time
- Consider adding more workers if the queue is consistently growing
