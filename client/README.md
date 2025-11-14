# Ultra Claude Code - Client

React + Vite client for real-time AI-powered document editing.

## Configuration

All client settings are in `config.json`:

```json
{
  "devPort": 5173,           // Vite dev server port
  "serverUrl": "http://localhost:3002",  // Server URL to connect to
  "reconnectionAttempts": 5,  // Socket.IO reconnection attempts
  "reconnectionDelay": 1000   // Delay between reconnection attempts (ms)
}
```

**Important:**
- `serverUrl` must match your server's host and port (from `server/config.json`)
- `devPort` is only used in development mode
- In production, the client is served from the server's `/static` folder

## Development

### Quick Start

From project root:
```bash
START_DEV.bat
```

This will:
- Read both `server/config.json` and `client/config.json`
- Start server on configured port (default: 3002)
- Start Vite dev server on configured port (default: 5173)
- Open two terminal windows

### Manual Start

```bash
cd client
npm install        # First time only
npm run dev        # Start Vite dev server
```

Then open: `http://localhost:{devPort}`

### Stop Servers

```bash
STOP_DEV.bat       # Stops both server and client
```

## Build for Production

```bash
npm run build
```

This builds the client to `../server/static/` so the server can serve it.

## Project Structure

```
client/
├── config.json           # Client configuration
├── src/
│   ├── config.js         # Config loader (imports config.json)
│   ├── services/
│   │   └── socketService.js   # Socket.IO connection manager
│   ├── hooks/
│   │   └── useSocket.js       # React hook for socket
│   ├── components/       # React components (to be added)
│   └── App.jsx          # Main app component
├── vite.config.js       # Vite config (reads config.json)
└── package.json
```

## Socket.IO Connection

The client automatically connects to the server URL specified in `config.json`:

```javascript
import config from './config.js';

// Connects to config.serverUrl
const { socket, sessionId, isConnected } = useSocket();
```

Connection settings:
- **Auto-reconnection:** Yes
- **Reconnection attempts:** From config
- **Reconnection delay:** From config
- **Transports:** WebSocket (preferred), polling (fallback)

## Changing Server URL

To connect to a different server:

1. Edit `client/config.json`:
   ```json
   {
     "serverUrl": "http://192.168.1.100:3002"
   }
   ```

2. Restart Vite dev server

No code changes needed!
