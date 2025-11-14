import { useState, useEffect } from 'react';
import defaultConfig from '../../config.json';

const CONFIG_STORAGE_KEY = 'ultra-claude-config-overrides';

/**
 * Hook to manage application configuration
 * Merges config.json with localStorage overrides
 *
 * @returns {Object} { config, updateConfig, resetConfig }
 */
export function useConfig() {
  const [config, setConfig] = useState(() => {
    // Load config on mount
    return loadConfig();
  });

  /**
   * Load config: merge default config.json with localStorage overrides
   */
  function loadConfig() {
    try {
      const overrides = localStorage.getItem(CONFIG_STORAGE_KEY);
      if (!overrides) {
        return defaultConfig;
      }

      const parsedOverrides = JSON.parse(overrides);

      // Deep merge: overrides take precedence
      const merged = {
        ...defaultConfig,
        ...parsedOverrides,
        canvasGrid: {
          ...defaultConfig.canvasGrid,
          ...(parsedOverrides.canvasGrid || {})
        }
      };

      console.log('Config loaded with overrides:', merged);
      return merged;
    } catch (error) {
      console.error('Failed to load config overrides:', error);
      return defaultConfig;
    }
  }

  /**
   * Update configuration
   * Saves to localStorage and updates state
   *
   * @param {Object} updates - Partial config updates
   * @param {boolean} reload - Whether to reload page after update (default: true)
   */
  function updateConfig(updates, reload = true) {
    try {
      // Merge updates with current config
      const newConfig = {
        ...config,
        ...updates,
        canvasGrid: {
          ...config.canvasGrid,
          ...(updates.canvasGrid || {})
        }
      };

      // Save only the overrides (what differs from defaults)
      const overrides = {};

      // Check top-level properties
      Object.keys(newConfig).forEach(key => {
        if (key === 'canvasGrid') return; // Handle separately
        if (JSON.stringify(newConfig[key]) !== JSON.stringify(defaultConfig[key])) {
          overrides[key] = newConfig[key];
        }
      });

      // Check canvasGrid properties
      const gridOverrides = {};
      Object.keys(newConfig.canvasGrid).forEach(key => {
        if (JSON.stringify(newConfig.canvasGrid[key]) !== JSON.stringify(defaultConfig.canvasGrid[key])) {
          gridOverrides[key] = newConfig.canvasGrid[key];
        }
      });

      if (Object.keys(gridOverrides).length > 0) {
        overrides.canvasGrid = gridOverrides;
      }

      // Save to localStorage
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(overrides));
      console.log('Config overrides saved:', overrides);

      // Update state
      setConfig(newConfig);

      // Reload page if requested (needed for config changes to take effect)
      if (reload) {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to update config:', error);
    }
  }

  /**
   * Reset configuration to defaults
   * Clears localStorage overrides and reloads page
   */
  function resetConfig() {
    try {
      localStorage.removeItem(CONFIG_STORAGE_KEY);
      console.log('Config reset to defaults');

      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Failed to reset config:', error);
    }
  }

  return {
    config,
    updateConfig,
    resetConfig,
    hasOverrides: () => {
      return localStorage.getItem(CONFIG_STORAGE_KEY) !== null;
    }
  };
}
