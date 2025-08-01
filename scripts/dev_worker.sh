#!/bin/bash
# Development script for the music generation worker
# Usage: ./scripts/dev_worker.sh [command]

set -e

# Default values
REDIS_CONTAINER="codedswitch-redis-1"
WORKER_CONTAINER="codedswitch-worker-1"
NETWORK="codedswitch_default"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not running"
  exit 1
fi

# Function to start services
start_services() {
  echo "Starting Redis and Worker services..."
  docker-compose up -d redis worker
  
  # Wait for Redis to be ready
  echo -n "Waiting for Redis to be ready..."
  until docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; do
    echo -n "."
    sleep 1
  done
  echo -e "\nRedis is ready!"
  
  # Show worker logs
  echo -e "\nWorker logs (Ctrl+C to stop):\n"
  docker-compose logs -f worker
}

# Function to stop services
stop_services() {
  echo "Stopping services..."
  docker-compose stop worker redis
  docker-compose rm -f worker
}

# Function to restart services
restart_services() {
  stop_services
  start_services
}

# Function to run tests
run_tests() {
  echo "Running tests..."
  docker-compose run --rm worker \
    python -m pytest tests/ -v --cov=worker --cov-report=term-missing
}

# Function to open a shell in the worker container
shell() {
  docker-compose exec worker /bin/bash
}

# Function to show logs
logs() {
  docker-compose logs -f worker
}

# Function to show help
show_help() {
  echo "Usage: ./scripts/dev_worker.sh [command]"
  echo ""
  echo "Commands:"
  echo "  start     Start Redis and Worker services"
  echo "  stop      Stop services"
  echo "  restart   Restart services"
  echo "  test      Run tests"
  echo "  shell     Open a shell in the worker container"
  echo "  logs      Show worker logs"
  echo "  help      Show this help message"
  echo ""
  echo "If no command is provided, 'start' will be used."
}

# Parse command
case "$1" in
  start)
    start_services
    ;;
  stop)
    stop_services
    ;;
  restart)
    restart_services
    ;;
  test)
    run_tests
    ;;
  shell)
    shell
    ;;
  logs)
    logs
    ;;
  help|--help|-h)
    show_help
    ;;
  *)
    if [ -z "$1" ]; then
      start_services
    else
      echo "Unknown command: $1"
      show_help
      exit 1
    fi
    ;;
esac

exit 0
