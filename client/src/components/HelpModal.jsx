import { X, HelpCircle } from 'lucide-react';
import './HelpModal.css';

function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <HelpCircle className="modal-icon help-icon" />
            <h2>How to Use</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="modal-body">
          <div className="help-section">
            <h3>Getting Started</h3>
            <ol className="help-steps">
              <li>Type or paste your document in the editor</li>
              <li>Select any text with your mouse</li>
              <li>Open the chat panel and ask questions or request changes</li>
              <li>The AI will respond and can update your document automatically</li>
            </ol>
          </div>

          <div className="help-section">
            <h3>Features</h3>
            <ul className="help-features">
              <li><strong>Real-time Streaming:</strong> See AI responses as they're generated</li>
              <li><strong>Selection Context:</strong> AI can work on selected text or entire document</li>
              <li><strong>RTL Support:</strong> Auto-detects Hebrew/Arabic text direction</li>
              <li><strong>Line Numbers:</strong> Easy reference for specific lines</li>
              <li><strong>Resizable Panels:</strong> Adjust chat width and prompt height</li>
            </ul>
          </div>

          <div className="help-section help-examples">
            <h3>Example Prompts</h3>
            <div className="example-prompts">
              <div className="example-prompt">"Make this more formal"</div>
              <div className="example-prompt">"Summarize the document"</div>
              <div className="example-prompt">"Expand this paragraph"</div>
              <div className="example-prompt">"Fix grammar and spelling"</div>
              <div className="example-prompt">"Translate to English"</div>
            </div>
          </div>

          <div className="help-section">
            <h3>Keyboard Shortcuts</h3>
            <ul className="help-shortcuts">
              <li><kbd>Enter</kbd> - Send message</li>
              <li><kbd>Shift + Enter</kbd> - New line in chat input</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary full-width" onClick={onClose}>
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

export default HelpModal;
