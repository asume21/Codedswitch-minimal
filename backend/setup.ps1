# setup.ps1
# Powershell script to bootstrap backend development environment.

# 1. Create virtual environment
python -m venv .venv

# 2. Activate virtual environment (PowerShell)
# .\.venv\Scripts\Activate.ps1

# 3. Upgrade pip and install dependencies
.\.venv\Scripts\python -m pip install --upgrade pip
.\.venv\Scripts\python -m pip install -r requirements.txt

# 4. (Optional) Start Redis locally for testing
# docker run -p 6379:6379 --name redis-local -d redis:7

Write-Host "✅ Backend setup complete. To start working:"
Write-Host "   .\.venv\Scripts\Activate.ps1"
Write-Host "   flask run --port 10000"
