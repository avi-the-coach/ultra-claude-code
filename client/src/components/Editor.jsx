import { useState, useRef } from 'react';
import { useEditor } from '../contexts/EditorContext';
import { FileText, Save, Upload } from 'lucide-react';
import './Editor.css';

function Editor() {
  const { content, setContent, filename, setFilename, selection, setSelection, settings, setSettings } = useEditor();
  const [isEditingFilename, setIsEditingFilename] = useState(false);
  const textAreaRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  const handleFilenameChange = (e) => {
    // Only allow valid filename characters
    const sanitized = e.target.value.replace(/[<>:"/\\|?*]/g, '');
    setFilename(sanitized);
  };

  // Handle text selection
  const handleSelection = () => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    if (selectedText.trim() && selectedText.length > 0) {
      setSelection({ start, end, text: selectedText });
    } else {
      setSelection({ start: 0, end: 0, text: '' });
    }
  };

  // Get word count
  const getWordCount = () => {
    if (!content.trim()) return 0;
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  // Detect if content is RTL (Hebrew/Arabic)
  const isRTL = /[\u0590-\u05FF\u0600-\u06FF]/.test(content);

  // Save document to JSON file
  const handleSave = () => {
    const documentData = {
      content: content,
      filename: filename,
      timestamp: new Date().toISOString(),
      settings: settings
    };

    const blob = new Blob([JSON.stringify(documentData, null, 2)], {
      type: 'application/json;charset=utf-8'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('💾 Document saved');
  };

  // Load document from JSON file
  const handleLoad = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loadedData = JSON.parse(e.target.result);

        if (loadedData.content !== undefined) {
          setContent(loadedData.content);
          setFilename(loadedData.filename || file.name.replace('.json', '') || 'loaded-document');

          if (loadedData.settings) {
            setSettings({
              ...settings,
              ...loadedData.settings,
              lastModified: new Date().toISOString()
            });
          }

          console.log('📄 Document loaded');
        } else {
          // Plain text file
          setContent(e.target.result);
          setFilename(file.name.replace(/\.(txt|json)$/, '') || 'loaded-document');
        }
      } catch (error) {
        console.error('Error loading file:', error);
        // Fallback to plain text
        setContent(e.target.result);
        setFilename(file.name.replace(/\.(txt|json)$/, '') || 'loaded-document');
      }
    };
    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
  };

  return (
    <div className="editor-container">
      <div className="editor-header">
        <div className="editor-title-section">
          <FileText className="file-icon" />
          {isEditingFilename ? (
            <input
              type="text"
              className="filename-edit-input"
              value={filename}
              onChange={handleFilenameChange}
              onBlur={() => setIsEditingFilename(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingFilename(false);
                }
              }}
              autoFocus
            />
          ) : (
            <span
              className="filename-display"
              onClick={() => setIsEditingFilename(true)}
              title="Click to edit filename"
            >
              {filename}
            </span>
          )}
          <span className="word-count">({getWordCount()} words)</span>
        </div>
        <div className="editor-actions">
          <button className="editor-btn editor-btn-save" onClick={handleSave} title="Save document">
            <Save size={16} />
            <span>Save</span>
          </button>
          <label className="editor-btn editor-btn-load" title="Load document">
            <Upload size={16} />
            <span>Load</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.json"
              onChange={handleLoad}
              style={{ display: 'none' }}
            />
          </label>
          <span className="stat">
            Characters: <strong>{content.length}</strong>
          </span>
        </div>
      </div>

      <div className="editor-content-wrapper">
        {/* Line Numbers */}
        <div className="line-numbers">
          {content.split('\n').map((_, index) => (
            <div key={index} className="line-number">
              {index + 1}
            </div>
          ))}
        </div>

        {/* Text Area */}
        <textarea
          ref={textAreaRef}
          className="editor-textarea"
          value={content}
          onChange={handleContentChange}
          onMouseUp={handleSelection}
          onKeyUp={handleSelection}
          placeholder="Start typing your document here..."
          spellCheck="false"
          style={{
            direction: isRTL ? 'rtl' : 'ltr',
            textAlign: isRTL ? 'right' : 'left'
          }}
        />
      </div>
    </div>
  );
}

export default Editor;
