@echo off
echo ============================================
echo   PlaceCloud Development Server Launcher
echo ============================================
echo.

:: Check backend venv
if not exist "backend\venv\Scripts\activate.bat" (
    echo [ERROR] Backend venv not found. Run: cd backend ^&^& python -m venv venv ^&^& venv\Scripts\activate ^&^& pip install -r requirements.txt
    pause
    exit /b 1
)

:: Check node_modules
if not exist "frontend\node_modules" (
    echo [ERROR] Frontend node_modules not found. Run: cd frontend ^&^& npm install
    pause
    exit /b 1
)

echo Starting Backend (FastAPI on port 8000)...
start "PlaceCloud Backend" cmd /k "cd /d %~dp0backend && venv\Scripts\activate && python -m uvicorn app.main:app --reload --port 8000 --host 0.0.0.0"

:: Small delay so backend starts first
timeout /t 2 /nobreak >nul

echo Starting Frontend (Vite on port 5173)...
start "PlaceCloud Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ============================================
echo  Both servers are starting in new windows.
echo  Backend:  http://localhost:8000
echo  API Docs: http://localhost:8000/docs
echo  Frontend: http://localhost:5173
echo ============================================
echo.
echo  Demo Credentials:
echo  Admin:   superadmin@placecloud.edu / Admin@123
echo  TPO:     tpo@placecloud.edu / Tpo@123
echo  Student: student@placecloud.edu / Student@123
echo ============================================
echo.
pause
