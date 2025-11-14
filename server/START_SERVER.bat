@echo off
cd /d "%~dp0"

REM Extract port and host from config.json
for /f "tokens=2 delims=:, " %%a in ('findstr /C:"\"port\"" config.json') do set PORT=%%a
for /f "tokens=2 delims=:, " %%a in ('findstr /C:"\"host\"" config.json') do set HOST=%%a

REM Remove quotes from HOST
set HOST=%HOST:"=%

echo.
echo ============================================================
echo   Starting Ultra Claude Code Server
echo ============================================================
echo.
echo Configuration from config.json:
echo   Host: %HOST%
echo   Port: %PORT%
echo.
echo Server will start on: http://%HOST%:%PORT%
echo Socket.io endpoint: ws://%HOST%:%PORT%/socket.io
echo.
echo Press Ctrl+C to stop the server
echo.

python server.py

pause
