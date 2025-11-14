@echo off
REM Ultra Claude Code - Development Environment Startup Script
REM Reads config files and checks what's running, starts only what's needed

echo.
echo ========================================
echo  Ultra Claude Code - Dev Startup
echo ========================================
echo.

REM Read server config
for /f "delims=" %%i in ('powershell -Command "(Get-Content '%~dp0server\config.json' | ConvertFrom-Json).port"') do set SERVER_PORT=%%i
for /f "delims=" %%i in ('powershell -Command "(Get-Content '%~dp0server\config.json' | ConvertFrom-Json).host"') do set SERVER_HOST=%%i

REM Read client config
for /f "delims=" %%i in ('powershell -Command "(Get-Content '%~dp0client\config.json' | ConvertFrom-Json).devPort"') do set CLIENT_PORT=%%i
for /f "delims=" %%i in ('powershell -Command "(Get-Content '%~dp0client\config.json' | ConvertFrom-Json).serverUrl"') do set SERVER_URL=%%i

echo Configuration:
echo   Server: %SERVER_HOST%:%SERVER_PORT%
echo   Client: localhost:%CLIENT_PORT%
echo   Server URL: %SERVER_URL%
echo.

REM Check if server is running
netstat -ano | findstr :%SERVER_PORT% | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo [OK] Server already running on port %SERVER_PORT%
    set SERVER_RUNNING=1
) else (
    echo [--] Server not running - will start
    set SERVER_RUNNING=0
)

REM Check if Vite is running
netstat -ano | findstr :%CLIENT_PORT% | findstr LISTENING >nul
if %errorlevel% equ 0 (
    echo [OK] Vite already running on port %CLIENT_PORT%
    set VITE_RUNNING=1
) else (
    echo [--] Vite not running - will start
    set VITE_RUNNING=0
)

echo.

REM Start server if needed
if %SERVER_RUNNING% equ 0 (
    echo Starting Server in new terminal...
    start "Ultra Claude Server" cmd /k "cd /d %~dp0server && python server.py"
    timeout /t 2 /nobreak >nul
    echo [STARTED] Server terminal opened
)

REM Start Vite if needed
if %VITE_RUNNING% equ 0 (
    echo Starting Vite in new terminal...
    start "Ultra Claude Client (Vite)" cmd /k "cd /d %~dp0client && npm run dev"
    timeout /t 2 /nobreak >nul
    echo [STARTED] Vite terminal opened
)

echo.
echo ========================================
echo  Status Summary
echo ========================================
if %SERVER_RUNNING% equ 1 if %VITE_RUNNING% equ 1 (
    echo Both services were already running!
) else if %SERVER_RUNNING% equ 0 if %VITE_RUNNING% equ 0 (
    echo Both services started in new terminals
) else (
    echo Started missing service(s)
)

echo.
echo Server:  http://%SERVER_HOST%:%SERVER_PORT%
echo Client:  http://localhost:%CLIENT_PORT%
echo.
echo Press any key to exit this window...
echo (The dev servers will keep running)
pause >nul
