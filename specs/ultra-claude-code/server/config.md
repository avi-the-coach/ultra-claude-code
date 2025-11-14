# Config

## Purpose
Server configuration management. Provides centralized configuration for port, host, and other server settings.

---

## Load Configuration

```pseudo
function loadConfig():
    '''
    Loads server configuration from file or environment variables.
    Falls back to defaults if not specified.

    Configuration priority:
    1. Environment variables (highest)
    2. config.json file
    3. Default values (lowest)
    '''

    import os
    import json

    # Try loading from config.json
    fileConfig = {}
    try:
        with open('config.json', 'r') as f:
            fileConfig = json.load(f)
    except FileNotFoundError:
        pass  # Use defaults

    config = {
        'port': int(os.environ.get('PORT', fileConfig.get('port', 3001))),
        'host': os.environ.get('HOST', fileConfig.get('host', 'localhost')),
        'corsOrigin': os.environ.get('CORS_ORIGIN', fileConfig.get('corsOrigin', '*')),
        'socketPath': '/socket.io'
    }

    '''
    Returns: Configuration dict
    '''
    return config
```

---

## Configuration File Format

**File**: `config.json` in server root

```json
{
    "port": 3001,
    "host": "localhost",
    "corsOrigin": "*"
}
```

---

## Configuration Options

### port
- **Type**: Number
- **Default**: 3001
- **Description**: HTTP server port
- **Environment Variable**: `PORT`

### host
- **Type**: String
- **Default**: 'localhost'
- **Description**: Server hostname
- **Environment Variable**: `HOST`

### corsOrigin
- **Type**: String
- **Default**: '*'
- **Description**: CORS allowed origins
- **Environment Variable**: `CORS_ORIGIN`

### socketPath
- **Type**: String
- **Default**: '/socket.io'
- **Description**: Socket.io endpoint path
- **Not configurable**: Fixed value

---

## Usage

```pseudo
# In server.md startServer()
config = loadConfig()
uvicorn.run(app, host=config['host'], port=config['port'])
```

---

## Things to Consider

- **Validation**: Validate port range (1-65535)
- **File location**: Consider different locations for dev vs production
- **Secrets**: Don't store secrets in config file (use env vars)
- **Reload**: Hot-reload config without restart (future)
- **Defaults**: Ensure sane defaults for all values

---

## Links

- [← Back to Server](./server.md)
