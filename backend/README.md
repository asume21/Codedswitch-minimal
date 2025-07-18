# CodedSwitch Backend

This folder contains the Flask backend for the CodedSwitch AI-powered music generation API.

## Prerequisites
- Python 3.10+
- Docker (for local Redis)
- Git

## Environment Variables
Create a file named `.env` in this directory and add:
```
DATABASE_URL=sqlite:///codedswitch.db
REDIS_URL=redis://localhost:6379/0
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=you@example.com
MAIL_PASSWORD=yourpassword
ADMIN_EMAIL=you@example.com
MAIL_DEFAULT_SENDER=no-reply@codedswitch.com
Grok_API_Key=your_grok_key
DEFAULT_GROK_MODEL=grok-3-mini
```
Ensure `.gitignore` excludes `.env` and audio cache files (e.g. `*.wav`, `temp/`).

## Setup (Windows PowerShell)
You can use the provided `setup.ps1` script or follow these steps:

1. Create & activate virtual environment:
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```
2. Upgrade pip and install dependencies:
   ```powershell
   python -m pip install --upgrade pip
   python -m pip install -r requirements.txt
   ```
3. (Optional) Start Redis locally:
   ```powershell
   docker run -p 6379:6379 --name redis-local -d redis:7
   ```

## Running the server
```powershell
flask run --port 10000
```

## Worker
In a second shell (with the venv activated), start the RQ worker:
```powershell
python worker.py
```

## Healthcheck
- Visit `http://localhost:10000/api/health` to verify the backend is up.

---

That's it! Now you can interact with `/api/loops`, `/api/generate-music`, `/api/music-file`, and other endpoints.
