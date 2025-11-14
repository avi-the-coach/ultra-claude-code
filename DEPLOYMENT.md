# Ultra Claude Code - Deployment Guide

## Overview

This guide covers the **Hybrid Approach** for deploying Ultra Claude Code:
- **Development**: Separate servers (server + Vite) for fast HMR
- **Production**: Single server serving both React app and Socket.IO

---

## Architecture

### Development Mode
```
┌──────────────────┐         ┌──────────────────┐
│  Vite Dev Server │         │   FastAPI Server │
│   (Port 5173)    │────────▶│   (Port 3002)    │
│   - React HMR    │  Proxy  │   - Socket.IO    │
│   - Fast reload  │         │   - Claude SDK   │
└──────────────────┘         └──────────────────┘
         │
         │ Access
         ▼
    http://localhost:5173
```

### Production Mode (Hybrid)
```
┌────────────────────────────────────────┐
│         FastAPI Server (3002)          │
│                                        │
│  ┌─────────────┐   ┌────────────────┐ │
│  │ Static Files│   │   Socket.IO    │ │
│  │  (React)    │   │  (Claude SDK)  │ │
│  │             │   │                │ │
│  │  GET /      │   │ /socket.io     │ │
│  └─────────────┘   └────────────────┘ │
└────────────────────────────────────────┘
         │
         │ Access
         ▼
    http://localhost:3002
```

---

## Prerequisites

### Server
- Python 3.11+
- Claude Code subscription
- No API key needed

### Client
- Node.js 18+
- npm or yarn

---

## Initial Setup

### 1. Clone/Setup Project

```bash
cd C:\Users\aviba\Documents\Automation\ultra-claude-code
```

### 2. Setup Server

```bash
cd server

# Install Python dependencies
pip install -r requirements.txt

# Test server
python server.py
# Should start on http://localhost:3002
# Press Ctrl+C to stop
```

### 3. Setup Client

```bash
cd ../client

# Install dependencies
npm install

# Test dev server
npm run dev
# Should start on http://localhost:5173
# Press Ctrl+C to stop
```

---

## Development Workflow

### Start Development Environment

**Terminal 1 - Server:**
```bash
cd C:\Users\aviba\Documents\Automation\ultra-claude-code\server
python server.py
```

**Terminal 2 - Client:**
```bash
cd C:\Users\aviba\Documents\Automation\ultra-claude-code\client
npm run dev
```

**Access:**
- Open browser: `http://localhost:5173`
- Vite proxies Socket.IO to server (3002)
- Hot Module Replacement enabled

### Development Benefits
✅ Fast HMR (instant code updates)
✅ React DevTools work
✅ No build step needed
✅ Separate concerns (frontend/backend)

---

## Production Build

### Step 1: Build Client

```bash
cd C:\Users\aviba\Documents\Automation\ultra-claude-code\client

# Build for production
npm run build

# Output: ../server/static/ folder created
```

**What happens:**
- Vite builds optimized React app
- Outputs to `server/static/` directory
- Minified JS/CSS
- Asset fingerprinting

### Step 2: Verify Build

```bash
# Check if static folder exists
dir ..\server\static

# Should see:
#   - index.html
#   - assets/ folder with JS/CSS
```

### Step 3: Run Production Server

```bash
cd ..\server

# Start server
python server.py
# OR
START_SERVER.bat
```

**Access:**
- Open browser: `http://localhost:3002`
- Server serves React app at `/`
- Server serves Socket.IO at `/socket.io`
- Single process, no Vite needed

### Production Benefits
✅ Single server process
✅ One command to start
✅ No CORS issues
✅ Simpler for end users
✅ Single port (3002)

---

## Server Implementation Changes

### Update server.py

Add static file serving capability:

```python
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# ... existing code ...

# Static files for production (React build)
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

    @app.get("/")
    async def serve_client():
        """Serve React app"""
        index_path = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"message": "Client not built. Run: cd ../client && npm run build"}

    # Catch-all route for React Router (SPA support)
    @app.get("/{full_path:path}")
    async def serve_client_routes(full_path: str):
        """Serve React app for all routes"""
        # Don't catch API routes
        if full_path.startswith("health") or full_path.startswith("socket.io"):
            return {"error": "Not found"}

        index_path = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"error": "Client not found"}
```

**Key Points:**
- Only mounts static if `static/` folder exists
- Serves `index.html` at root `/`
- Catch-all route for React Router (SPA support)
- Doesn't interfere with existing routes (`/health`, `/socket.io`)

---

## Client Implementation Changes

### Update vite.config.js

Configure proxy and build output:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3002',
        ws: true,  // Enable WebSocket proxying
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: '../server/static',  // Build to server folder
    emptyOutDir: true
  }
})
```

**Key Points:**
- Proxy `/socket.io` to server in development
- Build output directly to `server/static/`
- Empty directory before build

### Update Socket.IO Connection

Auto-detect environment:

```javascript
// src/services/socketService.js

const getServerUrl = () => {
  // Works in both dev and production
  return window.location.origin;
};

const socket = io(getServerUrl(), {
  transports: ['websocket', 'polling']
});
```

**Why this works:**
- **Development**: `window.location.origin` = `http://localhost:5173`, Vite proxies to 3002
- **Production**: `window.location.origin` = `http://localhost:3002`, direct connection

---

## Update START_SERVER.bat

Check if client is built:

```bat
@echo off
cd /d "%~dp0"

REM Check if client is built
if not exist "static\index.html" (
    echo.
    echo ============================================================
    echo   WARNING: Client not built!
    echo ============================================================
    echo.
    echo The React client hasn't been built yet.
    echo You can either:
    echo   1. Use development mode: cd ..\client ^&^& npm run dev
    echo   2. Build for production: cd ..\client ^&^& npm run build
    echo.
    echo Server will start but client won't be available at /
    echo.
    pause
)

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
```

---

## Distribution

### For End Users

**Package includes:**
1. `server/` folder with all files
2. `server/static/` with built React app
3. `requirements.txt`
4. `START_SERVER.bat`

**User instructions:**
```bash
# 1. Install Python dependencies
cd server
pip install -r requirements.txt

# 2. Start server
START_SERVER.bat

# 3. Open browser
http://localhost:3002
```

**No client development tools needed** - just Python!

---

## Troubleshooting

### Issue: Client not found at `/`

**Symptom:** Server starts but shows "Client not built" message

**Fix:**
```bash
cd client
npm run build
cd ../server
python server.py
```

### Issue: Socket.IO connection failed

**Symptom:** Client shows "Disconnected" or connection errors

**Fix:**
1. Ensure server is running on port 3002
2. Check server console for errors
3. Try: `tasklist | findstr python` to check if server is running

### Issue: Port 3002 already in use

**Fix:**
```bash
# Find process using port 3002
netstat -ano | findstr :3002

# Kill process (use PID from above)
taskkill /PID <pid> /F

# Or change port in server/config.json
```

### Issue: Vite proxy not working

**Symptom:** 404 errors on `/socket.io` in development

**Fix:**
1. Ensure server is running on 3002
2. Check `vite.config.js` proxy configuration
3. Restart Vite dev server

### Issue: React Router 404 in production

**Symptom:** Direct URL navigation shows 404

**Fix:** Ensure catch-all route is implemented in `server.py` (see above)

---

## Testing

### Test Development Mode

```bash
# Terminal 1
cd server && python server.py

# Terminal 2
cd client && npm run dev

# Open: http://localhost:5173
# Test: Send chat message, see streaming
```

### Test Production Mode

```bash
# Build
cd client && npm run build

# Start
cd ../server && python server.py

# Open: http://localhost:3002
# Test: Same as dev mode
```

---

## Performance

### Development
- Fast HMR (<100ms updates)
- Instant code feedback
- No build step

### Production
- Optimized bundle (minified)
- Asset fingerprinting
- Gzip compression (if enabled)
- Single port, reduced overhead

---

## Security

### Local-Only Application
- Runs on `localhost` only
- No external network access
- No authentication needed
- Security boundary: local machine

### Production Considerations
If deploying externally (not recommended):
- Add authentication
- Use HTTPS
- Configure CORS properly
- Rate limiting

---

## Next Steps

1. **Implement Server Changes**:
   - Add static file serving to `server.py`
   - Update `START_SERVER.bat` with client check

2. **Implement Client Changes**:
   - Configure `vite.config.js` with proxy and build path
   - Update Socket.IO connection to auto-detect URL

3. **Test Development Workflow**:
   - Start both servers
   - Verify HMR works
   - Test Socket.IO connection

4. **Test Production Build**:
   - Build client
   - Start server
   - Verify everything works on 3002

5. **Create Distribution Package**:
   - Build client
   - Package server folder
   - Write user instructions

---

## Summary

**Hybrid Approach Benefits:**

| Aspect | Development | Production |
|--------|-------------|------------|
| **Speed** | ⚡ Fast HMR | ⚡ No build needed |
| **Ports** | 2 (5173, 3002) | 1 (3002) |
| **Processes** | 2 | 1 |
| **Complexity** | Medium | Low |
| **User** | Developer | End user |
| **CORS** | Via proxy | No issues |

**This is the best of both worlds!** 🎉

---

## Links

- [Server README](./server/README.md) - Server documentation
- [Client README](./client/README.md) - Client documentation (TBD)
- [Architecture Spec](./specs/architecture-spec.md) - Technical details
- [Socket Integration](./specs/ultra-claude-code/client/socket-integration.md) - Socket.IO guide
