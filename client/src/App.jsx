import { useState, useEffect, useRef } from 'react';
import { useSocket } from './hooks/useSocket';
import { EditorProvider } from './contexts/EditorContext';
import { Settings, HelpCircle, MessageCircle } from 'lucide-react';
import Canvas from './components/Canvas';
import SettingsModal from './components/SettingsModal';
import HelpModal from './components/HelpModal';
import config from '../config.json';
import './App.css';

// Default layout (layout data only, no component metadata)
const defaultLayout = [
  {
    id: 'editor-1',
    type: 'Editor',
    gridPos: { x: 0, y: 0, w: 6, h: 8 },
    visible: true
  },
  {
    id: 'chat-1',
    type: 'Chat',
    gridPos: { x: 6, y: 0, w: 6, h: 8 },
    visible: true
  }
];

const LAYOUT_STORAGE_KEY = 'ultra-claude-canvas-layout';
const LAYOUT_VERSION = 1;

// Load layout from localStorage
const loadLayout = () => {
  if (!config.canvasGrid?.enablePersistence) {
    console.log('Layout persistence is disabled');
    return null;
  }

  try {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved);

    // Check version
    if (parsed.version !== LAYOUT_VERSION) {
      console.warn('Layout version mismatch, ignoring saved layout');
      return null;
    }

    // Merge saved layout with defaults (in case new components were added)
    // Only layout data is stored/merged - metadata comes from components
    const merged = defaultLayout.map(defaultItem => {
      const savedItem = parsed.layout.find(c => c.id === defaultItem.id);
      if (savedItem) {
        return {
          id: defaultItem.id,
          type: defaultItem.type,
          gridPos: savedItem.gridPos,
          visible: savedItem.visible
        };
      }
      return defaultItem;
    });

    console.log('Layout loaded from localStorage:', merged);
    return merged;
  } catch (error) {
    console.error('Failed to load layout:', error);
    return null;
  }
};

// Save layout to localStorage (layout data only, no metadata)
const saveLayout = (layoutData) => {
  if (!config.canvasGrid?.enablePersistence) return;

  try {
    const toSave = {
      version: LAYOUT_VERSION,
      timestamp: new Date().toISOString(),
      layout: layoutData.map(item => ({
        id: item.id,
        type: item.type,
        gridPos: item.gridPos,
        visible: item.visible
      }))
    };

    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(toSave));
    console.log('Layout saved to localStorage');
  } catch (error) {
    console.error('Failed to save layout:', error);
  }
};

function App() {
  const { socket, sessionId, isConnected } = useSocket();
  const [layout, setLayout] = useState(() => loadLayout() || defaultLayout);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const saveTimeoutRef = useRef(null);

  // Save layout to localStorage (debounced)
  useEffect(() => {
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout to save after 500ms
    saveTimeoutRef.current = setTimeout(() => {
      saveLayout(layout);
    }, 500);

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [layout]);

  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout);
  };

  const toggleChat = () => {
    setLayout(prev => prev.map(item =>
      item.type === 'Chat' ? { ...item, visible: !item.visible } : item
    ));
  };

  return (
    <EditorProvider>
      <div className="app-container">
        <header className="app-header">
          <div className="header-left">
            <h1>Ultra Claude Code</h1>
            <div className="connection-indicator">
              <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
              <span className="status-text">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
              {sessionId && (
                <span className="session-id">Session: {sessionId.substring(0, 8)}</span>
              )}
            </div>
          </div>

          <div className="header-actions">
            <button
              className="header-btn"
              onClick={() => setShowSettings(true)}
              title="Settings"
            >
              <Settings size={20} />
            </button>
            <button
              className="header-btn"
              onClick={() => setShowHelp(true)}
              title="Help"
            >
              <HelpCircle size={20} />
            </button>
            <button
              className={`header-btn ${layout.find(item => item.type === 'Chat')?.visible ? 'active' : ''}`}
              onClick={toggleChat}
              title="Toggle Chat"
            >
              <MessageCircle size={20} />
            </button>
          </div>
        </header>
        <main className="app-main">
          <Canvas
            initialLayout={layout}
            socket={socket}
            sessionId={sessionId}
            onLayoutChange={handleLayoutChange}
          />
        </main>

        {/* Modals */}
        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />
      </div>
    </EditorProvider>
  );
}

export default App;
