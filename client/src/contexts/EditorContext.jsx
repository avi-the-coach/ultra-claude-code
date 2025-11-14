import { createContext, useState, useContext } from 'react';

const EditorContext = createContext();

export function EditorProvider({ children }) {
  const [content, setContent] = useState('');
  const [filename, setFilename] = useState('untitled.txt');
  const [selection, setSelection] = useState({ start: 0, end: 0, text: '' });
  const [settings, setSettings] = useState({
    chatWidth: 400,
    promptHeight: 100,
    chatOnLeft: false,
    serverUrl: 'http://localhost:3002',
    lastModified: new Date().toISOString()
  });

  return (
    <EditorContext.Provider
      value={{
        content,
        setContent,
        filename,
        setFilename,
        selection,
        setSelection,
        settings,
        setSettings
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return context;
}
