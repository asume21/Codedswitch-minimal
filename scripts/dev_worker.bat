@echo off
:: Development script for the music generation worker (Windows)
:: Usage: scripts\dev_worker.bat [command]

setlocal enabledelayedexpansion

:: Default values
set REDIS_CONTAINER=codedswitch-redis-1
set WORKER_CONTAINER=codedswitch-worker-1
set NETWORK=codedswitch_default

:: Check if Docker is running
docker info >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: Docker is not running or not in the PATH
    exit /b 1
)

:start_services
    echo Starting Redis and Worker services...
    call docker-compose up -d redis worker
    
    echo Waiting for Redis to be ready...
    :wait_for_redis
    docker-compose exec -T redis redis-cli ping >nul 2>&1
    if %ERRORLEVEL% neq 0 (
        timeout /t 1 >nul
        goto :wait_for_redis
    )
    echo Redis is ready!
    
    echo.
    echo Worker logs (Ctrl+C to stop):
    echo -----------------------------
    call docker-compose logs -f worker
    goto :eof

:stop_services
    echo Stopping services...
    call docker-compose stop worker redis
    call docker-compose rm -f worker
    goto :eof

:restart_services
    call :stop_services
    call :start_services
    goto :eof

:run_tests
    echo Running tests...
    call docker-compose run --rm worker python -m pytest tests/ -v --cov=worker --cov-report=term-missing
    goto :eof

:shell
    call docker-compose exec worker cmd /c "cmd"
    goto :eof

:logs
    call docker-compose logs -f worker
    goto :eof

:show_help
    echo Usage: scripts\dev_worker.bat [command]
    echo.
    echo Commands:
    echo   start     Start Redis and Worker services
    echo   stop      Stop services
    echo   restart   Restart services
    echo   test      Run tests
    echo   shell     Open a command prompt in the worker container
    echo   logs      Show worker logs
    echo   help      Show this help message
    echo.
    echo If no command is provided, 'start' will be used.
    goto :eof

:: Main script
if "%~1"=="" (
    call :start_services
    goto :eof
)

if "%~1"=="start" call :start_services
if "%~1"=="stop" call :stop_services
if "%~1"=="restart" call :restart_services
if "%~1"=="test" call :run_tests
if "%~1"=="shell" call :shell
if "%~1"=="logs" call :logs
if "%~1"=="help" call :show_help

:: If we get here, the command wasn't recognized
if not "%~1"=="" (
    echo Unknown command: %~1
    call :show_help
    exit /b 1
)

exit /b 0
