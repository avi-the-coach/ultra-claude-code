"""
Configuration loader for Ultra Claude Code server.

Loads configuration from:
1. Environment variables (highest priority)
2. config.json file
3. Default values (lowest priority)
"""

import os
import json
from pathlib import Path


def loadConfig():
    """
    Loads server configuration from file or environment variables.
    Falls back to defaults if not specified.

    Configuration priority:
    1. Environment variables (highest)
    2. config.json file
    3. Default values (lowest)

    Returns:
        dict: Configuration dictionary with keys: port, host, corsOrigin, socketPath, editor-agent-instructions
    """
    # Try loading from config.json
    fileConfig = {}
    config_path = Path(__file__).parent / 'config.json'

    try:
        with open(config_path, 'r') as f:
            fileConfig = json.load(f)
    except FileNotFoundError:
        pass  # Use defaults
    except json.JSONDecodeError as e:
        print(f"Warning: config.json has invalid JSON: {e}")
        pass  # Use defaults

    # Build config with priority: env vars > file > defaults
    config = {
        'port': int(os.environ.get('PORT', fileConfig.get('port', 3001))),
        'host': os.environ.get('HOST', fileConfig.get('host', 'localhost')),
        'corsOrigin': os.environ.get('CORS_ORIGIN', fileConfig.get('corsOrigin', '*')),
        'socketPath': '/socket.io',  # Fixed value, not configurable
        'editor-agent-instructions': fileConfig.get('editor-agent-instructions', 'instructions/agent-instructions.md')
    }

    return config
