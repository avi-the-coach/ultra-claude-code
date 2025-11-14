@echo off
REM Ultra Claude Code - Stop Development Servers
REM Reads config files to get ports

echo.
echo ========================================
echo  Ultra Claude Code - Stop Dev Servers
echo ========================================
echo.

REM Read server config
for /f "delims=" %%i in ('powershell -Command "(Get-Content '%~dp0server\config.json' | ConvertFrom-Json).port"') do set SERVER_PORT=%%i

REM Read client config
for /f "delims=" %%i in ('powershell -Command "(Get-Content '%~dp0client\config.json' | ConvertFrom-Json).devPort"') do set CLIENT_PORT=%%i

echo Configuration:
echo   Server Port: %SERVER_PORT%
echo   Client Port: %CLIENT_PORT%
echo.

REM Find and kill server
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%SERVER_PORT% ^| findstr LISTENING') do (
    echo Stopping Server on port %SERVER_PORT% (PID: %%a)...
    taskkill /PID %%a /F >nul 2>&1
    if %errorlevel% equ 0 (
        echo [STOPPED] Server
    )
)

REM Find and kill Vite
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%CLIENT_PORT% ^| findstr LISTENING') do (
    echo Stopping Vite on port %CLIENT_PORT% (PID: %%a)...
    taskkill /PID %%a /F >nul 2>&1
    if %errorlevel% equ 0 (
        echo [STOPPED] Vite
    )
)

echo.
echo All dev servers stopped.
echo.
pause
