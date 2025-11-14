import { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon, RotateCcw } from 'lucide-react';
import { useConfig } from '../hooks/useConfig';
import './SettingsModal.css';

function SettingsModal({ isOpen, onClose }) {
  const { config, updateConfig, resetConfig, hasOverrides } = useConfig();
  const [localConfig, setLocalConfig] = useState(config);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    setLocalConfig(config);
  }, [config, isOpen]);

  const handleSave = () => {
    setSaveMessage('Settings saved. Reloading page...');
    updateConfig(localConfig, true); // true = reload page
  };

  const handleReset = () => {
    if (confirm('Reset all settings to defaults? This will reload the page.')) {
      resetConfig();
    }
  };

  const handleCancel = () => {
    setLocalConfig(config);
    setSaveMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <SettingsIcon className="modal-icon" />
            <h2>Settings</h2>
          </div>
          <button className="modal-close-btn" onClick={handleCancel}>
            <X />
          </button>
        </div>

        <div className="modal-body">
          {/* Canvas Grid Settings */}
          <div className="settings-section">
            <h3 className="section-title">📐 Canvas Grid</h3>

            <div className="setting-group">
              <label className="setting-label">
                Grid Columns:
              </label>
              <input
                type="number"
                className="setting-input"
                value={localConfig.canvasGrid.columns}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  canvasGrid: {
                    ...localConfig.canvasGrid,
                    columns: parseInt(e.target.value) || 12
                  }
                })}
                min="6"
                max="24"
              />
              <p className="setting-help">
                Number of grid columns (6-24)
              </p>
            </div>

            <div className="setting-group">
              <label className="setting-label">
                Grid Rows:
              </label>
              <input
                type="number"
                className="setting-input"
                value={localConfig.canvasGrid.rows}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  canvasGrid: {
                    ...localConfig.canvasGrid,
                    rows: parseInt(e.target.value) || 8
                  }
                })}
                min="4"
                max="16"
              />
              <p className="setting-help">
                Number of grid rows (4-16)
              </p>
            </div>

            <div className="setting-group">
              <label className="setting-label">
                Cell Minimum Size (px):
              </label>
              <input
                type="number"
                className="setting-input"
                value={localConfig.canvasGrid.cellMinSize}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  canvasGrid: {
                    ...localConfig.canvasGrid,
                    cellMinSize: parseInt(e.target.value) || 50
                  }
                })}
                min="30"
                max="100"
              />
              <p className="setting-help">
                Minimum cell size in pixels (30-100)
              </p>
            </div>

            <div className="setting-group">
              <label className="setting-label">
                Grid Visibility:
              </label>
              <select
                className="setting-select"
                value={localConfig.canvasGrid.gridVisibility}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  canvasGrid: {
                    ...localConfig.canvasGrid,
                    gridVisibility: e.target.value
                  }
                })}
              >
                <option value="always">Always Visible</option>
                <option value="dragging">Show When Dragging</option>
                <option value="never">Never Show</option>
              </select>
              <p className="setting-help">
                When to display grid lines
              </p>
            </div>

            <div className="setting-group">
              <label className="setting-label">
                Snap Threshold (px):
              </label>
              <input
                type="number"
                className="setting-input"
                value={localConfig.canvasGrid.snapThreshold}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  canvasGrid: {
                    ...localConfig.canvasGrid,
                    snapThreshold: parseInt(e.target.value) || 20
                  }
                })}
                min="10"
                max="50"
              />
              <p className="setting-help">
                Pixel distance for snap-to-grid (10-50)
              </p>
            </div>

            <div className="setting-group">
              <label className="setting-label checkbox-label">
                <input
                  type="checkbox"
                  className="setting-checkbox"
                  checked={localConfig.canvasGrid.enablePersistence}
                  onChange={(e) => setLocalConfig({
                    ...localConfig,
                    canvasGrid: {
                      ...localConfig.canvasGrid,
                      enablePersistence: e.target.checked
                    }
                  })}
                />
                Enable Layout Persistence
              </label>
              <p className="setting-help">
                Save layout to localStorage
              </p>
            </div>
          </div>

          {/* App Settings */}
          <div className="settings-section">
            <h3 className="section-title">🔧 Application</h3>

            <div className="setting-group">
              <label className="setting-label">
                Server URL:
              </label>
              <input
                type="url"
                className="setting-input"
                value={localConfig.serverUrl}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  serverUrl: e.target.value
                })}
                placeholder="http://localhost:3002"
              />
              <p className="setting-help">
                Socket.IO server address
              </p>
            </div>

            <div className="setting-group">
              <label className="setting-label">
                Reconnection Attempts:
              </label>
              <input
                type="number"
                className="setting-input"
                value={localConfig.reconnectionAttempts}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  reconnectionAttempts: parseInt(e.target.value) || 5
                })}
                min="1"
                max="10"
              />
              <p className="setting-help">
                Number of reconnection attempts (1-10)
              </p>
            </div>

            <div className="setting-group">
              <label className="setting-label">
                Reconnection Delay (ms):
              </label>
              <input
                type="number"
                className="setting-input"
                value={localConfig.reconnectionDelay}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  reconnectionDelay: parseInt(e.target.value) || 1000
                })}
                min="500"
                max="5000"
                step="100"
              />
              <p className="setting-help">
                Delay between reconnection attempts (500-5000ms)
              </p>
            </div>
          </div>

          {/* Save Message */}
          {saveMessage && (
            <div className="save-message">
              {saveMessage}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={handleSave}>
            Save Settings
          </button>
          {hasOverrides() && (
            <button className="btn btn-warning" onClick={handleReset}>
              <RotateCcw size={16} />
              Reset to Defaults
            </button>
          )}
          <button className="btn btn-secondary" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
