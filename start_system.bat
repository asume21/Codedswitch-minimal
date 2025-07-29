@echo off
echo Starting CodedSwitch System...
echo.

echo Starting Backend Server...
cd backend
start "Backend Server" cmd /k "python web_backend.py"
cd ..

echo.
echo Starting Frontend Server...
cd frontend
start "Frontend Server" cmd /k "npm run dev"
cd ..

echo.
echo CodedSwitch System is starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit this script (servers will continue running)
pause > nul 