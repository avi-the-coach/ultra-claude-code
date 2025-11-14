import { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon } from 'lucide-react';
import { useEditor } from '../contexts/EditorContext';
import './SettingsModal.css';

function SettingsModal({ isOpen, onClose }) {
  const { settings, setSettings } = useEditor();
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  const handleSave = () => {
    setSettings({
      ...localSettings,
      lastModified: new Date().toISOString()
    });
    onClose();
  };

  const handleCancel = () => {
    setLocalSettings(settings);
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
          <div className="setting-group">
            <label className="setting-label">
              💬 Chat Width (pixels):
            </label>
            <input
              type="number"
              className="setting-input"
              value={localSettings.chatWidth}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                chatWidth: parseInt(e.target.value) || 400
              })}
              min="300"
              max="600"
            />
            <p className="setting-help">
              Between 300 and 600 pixels
            </p>
          </div>

          <div className="setting-group">
            <label className="setting-label">
              📝 Default Prompt Height (pixels):
            </label>
            <input
              type="number"
              className="setting-input"
              value={localSettings.promptHeight}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                promptHeight: parseInt(e.target.value) || 100
              })}
              min="60"
              max="300"
            />
            <p className="setting-help">
              Initial height of input field (60-300 pixels)
            </p>
          </div>

          <div className="setting-group">
            <label className="setting-label">
              🔀 Chat Position:
            </label>
            <select
              className="setting-select"
              value={localSettings.chatOnLeft ? 'left' : 'right'}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                chatOnLeft: e.target.value === 'left'
              })}
            >
              <option value="right">Right Side</option>
              <option value="left">Left Side</option>
            </select>
          </div>

          <div className="setting-group">
            <label className="setting-label">
              🌐 Server URL:
            </label>
            <input
              type="url"
              className="setting-input"
              value={localSettings.serverUrl}
              onChange={(e) => setLocalSettings({
                ...localSettings,
                serverUrl: e.target.value
              })}
              placeholder="http://localhost:3002"
            />
            <p className="setting-help">
              Socket.IO server address (requires page reload)
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary" onClick={handleSave}>
            Save Settings
          </button>
          <button className="btn btn-secondary" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
