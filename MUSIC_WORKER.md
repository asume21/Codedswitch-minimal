# Music Generation Worker

This service handles background music generation tasks using Facebook's MusicGen model. It's designed to run as a separate worker process that processes jobs from a Redis queue.

## Features

- Asynchronous music generation using MusicGen
- Health check endpoint at `/health`
- Graceful shutdown handling
- Automatic reconnection to Redis
- Resource monitoring and limits
- Logging and error tracking

## Prerequisites

- Docker and Docker Compose
- At least 8GB of RAM (16GB recommended)
- At least 2 CPU cores (4+ recommended)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_URL` | Redis connection URL | `redis://redis:6379/0` |
| `RQ_REDIS_URL` | RQ Redis connection URL | Same as `REDIS_URL` |
| `PYTHONUNBUFFERED` | Enable unbuffered Python output | `1` |
| `PYTHONPATH` | Python path | `/app` |
| `PYTORCH_ENABLE_MPS_FALLBACK` | Enable MPS fallback for PyTorch | `1` |
| `PYTORCH_CUDA_ALLOC_CONF` | PyTorch CUDA memory config | `max_split_size_mb:128` |
| `OMP_NUM_THREADS` | Number of OpenMP threads | `1` |

## Running with Docker Compose

The recommended way to run the worker is using Docker Compose:

```bash
docker-compose up -d worker
```

This will start the worker along with its dependencies (Redis).

## Health Checks

The worker exposes a health check endpoint at `http://localhost:8080/health` that returns:

```json
{
  "status": "healthy",
  "timestamp": 1625097600.123456,
  "worker_count": 1,
  "queue_size": 0
}
```

## Monitoring

### Logs

View worker logs:

```bash
docker-compose logs -f worker
```

### Redis Queue

Connect to Redis CLI:

```bash
docker-compose exec redis redis-cli
```

List queues:
```
KEYS rq:queue:*
```

View jobs in queue:
```
LRANGE rq:queue:default 0 -1
```

## Development

### Building the Image

```bash
docker-compose build worker
```

### Running Tests

```bash
docker-compose run --rm worker pytest tests/
```

## Deployment

### Render.com

1. Push your code to a Git repository
2. Create a new Web Service on Render
3. Connect your repository
4. Select Docker as the environment
5. Use the following settings:
   - Build Command: `docker build -f backend/Dockerfile.worker -t music-worker .`
   - Start Command: `python worker.py`
   - Health Check Path: `/health`
   - Instance Type: Standard (2GB RAM minimum)

### Kubernetes

See the `kubernetes/` directory for example Kubernetes manifests.

## Troubleshooting

### Worker Not Starting

1. Check Redis connection:
   ```bash
   docker-compose exec redis redis-cli ping
   ```
   Should return `PONG`

2. Check worker logs:
   ```bash
   docker-compose logs worker
   ```

### High Memory Usage

If the worker is using too much memory:

1. Reduce the number of concurrent workers
2. Decrease the `PYTORCH_CUDA_ALLOC_CONF` value
3. Increase the container memory limit in `docker-compose.yml`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
