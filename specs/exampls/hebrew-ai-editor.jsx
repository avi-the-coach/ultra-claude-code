import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader, Edit3, FileText, MessageSquare, HelpCircle, X, Upload, File, CheckCircle, Settings, Save, Download, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';

// Chat Component with Selection Indicator - Moved outside to prevent recreation
const ChatComponent = React.memo(({ 
  isDragging, 
  chatWidth,  // Use direct chatWidth prop instead of settings
  chatOnLeft, 
  setIsChatOpen, 
  chatMessagesRef, 
  chatMessages, 
  isProcessingChat, 
  selectedText, 
  getSelectionInfo, 
  chatInputRef, 
  userMessage, 
  setUserMessage, 
  sendChatMessage,
  promptHeight,
  handlePromptTextChange,
  PromptResizerComponent
}) => (
  <div 
    className={`bg-white rounded-t-lg shadow-lg flex flex-col transition-all duration-300 ${
      isDragging ? 'opacity-50 scale-95' : ''
    }`}
    style={{ width: `${chatWidth}px`, minWidth: '250px', maxWidth: '600px' }}
    draggable
    onDragStart={(e) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', 'chat');
    }}
  >
    <div className="p-4 border-b border-gray-200 flex items-center justify-between cursor-move">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-5 h-5 text-purple-600" />
        <h3 className="font-medium text-gray-800">צ'אט AI למסמך</h3>
        <span className="text-xs text-gray-500">(גרור לשינוי מיקום)</span>
      </div>
      <button
        onClick={() => setIsChatOpen(false)}
        className="text-gray-500 hover:text-gray-700 p-1"
      >
        {chatOnLeft ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>

    <div 
      ref={chatMessagesRef}
      className="flex-1 overflow-y-auto p-4 space-y-3"
      style={{ maxHeight: `calc(100vh - 350px - ${promptHeight}px)` }}
    >
      {chatMessages.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>התחל שיחה על המסמך</p>
          <p className="text-sm mt-1">שאל שאלות, בקש עצות או הצע שינויים</p>
        </div>
      ) : (
        chatMessages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
              style={{ 
                direction: /[\u0590-\u05FF]/.test(message.content) ? 'rtl' : 'ltr',
                textAlign: /[\u0590-\u05FF]/.test(message.content) ? 'right' : 'left'
              }}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
              <p className={`text-xs mt-1 opacity-70`}>
                {new Date(message.timestamp).toLocaleTimeString('he-IL')}
              </p>
            </div>
          </div>
        ))
      )}
      
      {isProcessingChat && (
        <div className="flex justify-start">
          <div className="bg-gray-100 text-gray-800 p-3 rounded-lg flex items-center gap-2">
            <Loader className="w-4 h-4 animate-spin" />
            <span className="text-sm">AI חושב...</span>
          </div>
        </div>
      )}
    </div>

    {/* Chat Input with Selection Indicator */}
    <div>
      {/* Selection Indicator */}
      {selectedText && (
        <div className="px-4 py-2 border-t border-gray-200">
          <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
            <div className="flex items-center gap-2 mb-1">
              <MessageSquare className="w-3 h-3 text-yellow-600" />
              <span className="text-yellow-800 font-medium">טקסט נבחר:</span>
            </div>
            <div className="text-yellow-700 text-xs">
              {(() => {
                const selectionInfo = getSelectionInfo();
                return selectionInfo ? (
                  <span>
                    שורה {selectionInfo.start.line}:{selectionInfo.start.char} - שורה {selectionInfo.end.line}:{selectionInfo.end.char} 
                    <span className="mx-2">•</span>
                    {selectionInfo.length} תווים
                  </span>
                ) : null;
              })()}
            </div>
            <div className="text-yellow-600 text-xs mt-1 bg-white p-1 rounded border">
              "{selectedText.substring(0, 60)}{selectedText.length > 60 ? '...' : ''}"
            </div>
          </div>
        </div>
      )}
      
      {/* Prompt Resizer */}
      <PromptResizerComponent />
      
      {/* Prompt Input */}
      <div className="px-4 pb-0 pt-1">
        <div className="flex gap-2 mb-0">
          <textarea
            ref={chatInputRef}
            value={userMessage}
            onChange={handlePromptTextChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (e.shiftKey) {
                  // Shift+Enter: Allow new line (default behavior)
                  return;
                } else {
                  // Enter: Send message
                  e.preventDefault();
                  sendChatMessage();
                }
              }
            }}
            placeholder={selectedText ? "שאל על הטקסט הנבחר..." : "כתוב הודעה"}
            disabled={isProcessingChat}
            className="flex-1 p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-sm resize-none overflow-y-auto"
            style={{ 
              direction: 'rtl',
              height: `${promptHeight}px`
            }}
            autoComplete="off"
          />
          <button
            onClick={sendChatMessage}
            disabled={isProcessingChat || !userMessage.trim()}
            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors self-end"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
));

const HebrewAIEditor = () => {
  const [content, setContent] = useState('כתוב כאן את המאמר או הפוסט שלך...\n\nאתה יכול לבחור כל פסקה או טקסט ולשאל את הבינה המלאכותית שאלות או לבקש ממנה לעזור לך לשפר, להרחיב, לקצר או לערוך אותו.\n\nפשוט בחר טקסט וכתוב הוראות בצ\'אט.');
  const [selectedText, setSelectedText] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });
  
  // Filename state
  const [fileName, setFileName] = useState('מסמך-חדש');
  const [isEditingFilename, setIsEditingFilename] = useState(false);
  
  // Word count function
  const getWordCount = () => {
    if (!content.trim()) return 0;
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  };
  
  // File picker states
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  
  // Settings management states
  const [settings, setSettings] = useState({
    "link-2-fb": "",
    "chat-width": 350,
    "context-window": 1000,
    "prompt-height": 40,
    lastModified: new Date().toISOString()
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [fbLink, setFbLink] = useState('');
  const [chatWidth, setChatWidth] = useState(350);
  const [contextWindow, setContextWindow] = useState(1000);
  
  // Chat states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [userMessage, setUserMessage] = useState('');
  const [isProcessingChat, setIsProcessingChat] = useState(false);
  const [chatOnLeft, setChatOnLeft] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Resizer states
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  
  // Prompt resizer states
  const [isResizingPrompt, setIsResizingPrompt] = useState(false);
  const [startY, setStartY] = useState(0);
  const [promptHeight, setPromptHeight] = useState(40); // Start with 1 line height
  const [startPromptHeight, setStartPromptHeight] = useState(40);
  
  const textAreaRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const chatInputRef = useRef(null);

  // Handle text selection - SIMPLE AND CLEAN
  const handleSelection = () => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);

    if (selected.trim() && selected.length > 0) {
      setSelectedText(selected);
      setSelectionRange({ start, end });
    } else {
      setSelectedText('');
      setSelectionRange({ start: 0, end: 0 });
    }
  };

  // Clear selection manually
  const clearSelection = () => {
    setSelectedText('');
    setSelectionRange({ start: 0, end: 0 });
  };

  // Resizer functions
  const handleResizerMouseDown = (e) => {
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(settings['chat-width']);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;
    
    // Fix RTL direction logic
    const deltaX = chatOnLeft ? (startX - e.clientX) : (e.clientX - startX);
    const newWidth = Math.max(250, Math.min(600, startWidth + deltaX));
    
    setSettings(prev => ({
      ...prev,
      'chat-width': newWidth
    }));
    setChatWidth(newWidth);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  // Add global mouse events for resizing
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, startX, startWidth, chatOnLeft]);

  // Add global mouse events for prompt resizing
  useEffect(() => {
    if (isResizingPrompt) {
      document.addEventListener('mousemove', handlePromptMouseMove);
      document.addEventListener('mouseup', handlePromptMouseUp);
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handlePromptMouseMove);
        document.removeEventListener('mouseup', handlePromptMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizingPrompt, startY, startPromptHeight]);

  // Resizer Component
  const ResizerComponent = () => (
    <div
      className={`w-1 bg-gray-300 hover:bg-blue-500 cursor-col-resize transition-colors relative group ${
        isResizing ? 'bg-blue-500' : ''
      }`}
      onMouseDown={handleResizerMouseDown}
      style={{ minHeight: '100%' }}
    >
      <div className="absolute inset-0 w-3 -translate-x-1 group-hover:bg-blue-200 group-hover:opacity-30 transition-all"></div>
    </div>
  );

  // Prompt Resizer functions
  const handlePromptResizerMouseDown = (e) => {
    setIsResizingPrompt(true);
    setStartY(e.clientY);
    setStartPromptHeight(promptHeight);
    e.preventDefault();
  };

  const handlePromptMouseMove = (e) => {
    if (!isResizingPrompt) return;
    
    // Calculate new height (dragging up decreases Y, so we subtract)
    const deltaY = startY - e.clientY;
    const newHeight = Math.max(40, Math.min(200, startPromptHeight + deltaY)); // Min 1 line, max ~5 lines
    
    setPromptHeight(newHeight);
  };

  const handlePromptMouseUp = () => {
    setIsResizingPrompt(false);
  };

  // Handle text change and auto-expansion
  const handlePromptTextChange = (e) => {
    setUserMessage(e.target.value);
    
    // Auto-expand on Enter
    const lines = e.target.value.split('\n').length;
    const calculatedHeight = Math.min(200, Math.max(40, lines * 24)); // 24px per line
    setPromptHeight(calculatedHeight);
  };

  // Prompt Resizer Component
  const PromptResizerComponent = () => (
    <div
      className={`h-1 bg-gray-300 hover:bg-blue-500 cursor-row-resize transition-colors relative group w-full ${
        isResizingPrompt ? 'bg-blue-500' : ''
      }`}
      onMouseDown={handlePromptResizerMouseDown}
    >
      <div className="absolute inset-0 h-3 -translate-y-1 group-hover:bg-blue-200 group-hover:opacity-30 transition-all"></div>
    </div>
  );

  // Get line and character position from text index
  const getTextPosition = (index) => {
    const textUpToIndex = content.substring(0, index);
    const lines = textUpToIndex.split('\n');
    const line = lines.length;
    const char = lines[lines.length - 1].length + 1;
    return { line, char };
  };

  // Get selection position info
  const getSelectionInfo = () => {
    if (!selectedText || selectionRange.start === selectionRange.end) return null;
    
    const startPos = getTextPosition(selectionRange.start);
    const endPos = getTextPosition(selectionRange.end);
    
    return {
      text: selectedText,
      start: startPos,
      end: endPos,
      length: selectedText.length
    };
  };

  // Chat functions with selection context
  const sendChatMessage = async () => {
    if (!userMessage.trim() || isProcessingChat) return;

    const selectionInfo = getSelectionInfo();
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
      selectedText: selectionInfo
    };

    const updatedMessages = [...chatMessages, newUserMessage];
    setChatMessages(updatedMessages);
    setUserMessage('');
    setIsProcessingChat(true);

    try {
      let contextMessage = `המידע הבא כולל שיחה עם המשתמש ותוכן מסמך:

מסמך נוכחי:
"""
${content}
"""`;

      if (selectionInfo) {
        contextMessage += `

טקסט נבחר כרגע:
"""
${selectionInfo.text}
"""
מיקום: שורה ${selectionInfo.start.line}, תו ${selectionInfo.start.char} עד שורה ${selectionInfo.end.line}, תו ${selectionInfo.end.char}`;
      }

      contextMessage += `

שיחה עדכנית:
${JSON.stringify(updatedMessages.slice(-5), null, 2)}

אתה עוזר חכם לעריכת מסמכים בעברית.

חשוב: השב רק בפורמט JSON הבא!

אם המשתמש מבקש לעדכן טקסט נבחר:
{"chat_response": "תגובתך", "selected_text_update": "טקסט מעודכן"}

אם המשתמש מבקש לעדכן את כל המסמך:
{"chat_response": "תגובתך", "document_update": "מסמך מעודכן"}

אם אין עדכון נדרש:
{"chat_response": "תגובתך"}

השב רק JSON ללא טקסט נוסף!`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: "אתה עוזר לעריכת מסמכים. תמיד השב רק בפורמט JSON תקין ללא טקסט נוסף. אם יש טקסט נבחר ומבקשים לעדכן: {\"chat_response\": \"תגובה\", \"selected_text_update\": \"טקסט חדש\"}. אם אין טקסט נבחר ומבקשים לעדכן: {\"chat_response\": \"תגובה\", \"document_update\": \"מסמך מעודכן שלם\"}. אם רק דיון ללא עדכון: {\"chat_response\": \"תגובה\"}",
          messages: [
            {
              role: "user",
              content: `המסמך הנוכחי:
${content}

${selectionInfo ? `טקסט נבחר: "${selectionInfo.text}"` : 'אין טקסט נבחר - אם יש עדכון, עדכן את כל המסמך'}

השיחה המלאה: ${JSON.stringify(updatedMessages, null, 2)}

השב רק JSON!`
            }
          ]
        })
      });

      const data = await response.json();
      let aiResponse = data.content[0].text;
      
      let parsedResponse;
      let chatResponseText = "";
      
      console.log('🔍 התגובה הגולמית מה-AI:', aiResponse);
      
      try {
        // Clean the response more aggressively
        let cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        // Extract JSON from response that might have text before it
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[0];
          console.log('✅ נמצא JSON:', cleanedResponse);
        }
        
        parsedResponse = JSON.parse(cleanedResponse);
        chatResponseText = parsedResponse.chat_response || "קיבלתי את הבקשה שלך.";
        console.log('✅ JSON פורסר בהצלחה:', parsedResponse);
      } catch (e) {
        console.log('❌ כשל בפרסור JSON:', e.message);
        console.log('🔍 נסיון לחלץ בדרך אחרת...');
        
        // Try a more aggressive approach - look for chat_response value
        const chatResponseMatch = aiResponse.match(/"chat_response"\s*:\s*"([^"]*)"/) || 
                                 aiResponse.match(/'chat_response'\s*:\s*'([^']*)'/) ||
                                 aiResponse.match(/chat_response.*?:\s*["']([^"']*)/);
        
        if (chatResponseMatch) {
          chatResponseText = chatResponseMatch[1];
          console.log('✅ נמצא chat_response:', chatResponseText);
          
          // Try to extract update fields too
          const selectedUpdateMatch = aiResponse.match(/"selected_text_update"\s*:\s*"([^"]*)"/) ||
                                    aiResponse.match(/'selected_text_update'\s*:\s*'([^']*)'/) ||
                                    aiResponse.match(/selected_text_update.*?:\s*["']([^"']*)/);
          
          const documentUpdateMatch = aiResponse.match(/"document_update"\s*:\s*"([^"]*)"/) ||
                                    aiResponse.match(/'document_update'\s*:\s*'([^']*)'/) ||
                                    aiResponse.match(/document_update.*?:\s*["']([^"']*)/);
          
          parsedResponse = {
            selected_text_update: selectedUpdateMatch ? selectedUpdateMatch[1] : "",
            document_update: documentUpdateMatch ? documentUpdateMatch[1] : ""
          };
          
          console.log('✅ חולץ עדכונים:', parsedResponse);
        } else {
          // Last resort - show the raw response but clean it up
          console.log('❌ לא הצלחתי לחלץ כלום, מציג תגובה גולמית');
          chatResponseText = "מצטער, הייתה בעיה בעיבוד התגובה. אנא נסה שוב.";
          parsedResponse = {
            selected_text_update: "",
            document_update: ""
          };
        }
      }

      const aiMessage = {
        role: 'assistant',
        content: chatResponseText,
        timestamp: new Date().toISOString()
      };

      setChatMessages(prev => [...prev, aiMessage]);

      // Handle updates - SMART REPLACEMENT
      if (parsedResponse.selected_text_update && parsedResponse.selected_text_update.trim() && selectionInfo) {
        // Replace only selected text and fix line breaks
        const fixedUpdate = parsedResponse.selected_text_update.replace(/\\n/g, '\n');
        const newContent = content.substring(0, selectionRange.start) + 
                          fixedUpdate + 
                          content.substring(selectionRange.end);
        setContent(newContent);
        console.log('📄 טקסט נבחר עודכן על ידי AI');
        setSelectedText('');
        setSelectionRange({ start: 0, end: 0 });
      } else if (parsedResponse.document_update && parsedResponse.document_update.trim()) {
        // Fix line breaks in full document update
        const fixedContent = parsedResponse.document_update.replace(/\\n/g, '\n');
        setContent(fixedContent);
        console.log('📄 מסמך שלם עודכן על ידי AI');
      }

    } catch (error) {
      console.error('❌ שגיאה בצ\'אט:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'מצטער, יש בעיה בחיבור. אנא נסה שוב.',
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessingChat(false);
      setTimeout(() => {
        if (chatInputRef.current) {
          chatInputRef.current.focus();
        }
      }, 100);
    }
  };

  // Drag and Drop functions
  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', 'chat');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    setChatOnLeft(!chatOnLeft);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Settings functions
  const saveSettings = () => {
    const updatedSettings = {
      "link-2-fb": fbLink,
      "chat-width": chatWidth,
      "context-window": contextWindow,
      "prompt-height": promptHeight,
      "chat-on-left": chatOnLeft,
      lastModified: new Date().toISOString()
    };
    setSettings(updatedSettings);
    setShowSettingsModal(false);
    console.log('⚙️ הגדרות נשמרו:', updatedSettings);
  };

  // Save/Load functions with settings
  const saveContentToFile = () => {
    const documentData = {
      content: content,
      conversation: chatMessages,
      timestamp: new Date().toISOString(),
      fileName: fileName,
      settings: {
        "link-2-fb": fbLink,
        "chat-width": chatWidth,
        "context-window": contextWindow,
        "prompt-height": promptHeight,
        "chat-on-left": chatOnLeft,
        lastModified: new Date().toISOString()
      }
    };
    
    const contentBlob = new Blob([JSON.stringify(documentData, null, 2)], {
      type: 'application/json;charset=utf-8'
    });
    
    const url = URL.createObjectURL(contentBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('💾 מסמך עם שיחה והגדרות נשמר');
  };

  const loadContentFromFile = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const loadedData = JSON.parse(e.target.result);
          if (loadedData.content !== undefined) {
            // Fix line breaks when loading content
            const fixedContent = loadedData.content.replace(/\\n/g, '\n');
            setContent(fixedContent);
            setChatMessages(loadedData.conversation || []);
            setFileName(loadedData.fileName || file.name.replace('.json', '') || 'מסמך-נטען');
            
            if (loadedData.settings) {
              const savedSettings = loadedData.settings;
              setFbLink(savedSettings['link-2-fb'] || '');
              setChatWidth(savedSettings['chat-width'] || 350);
              setContextWindow(savedSettings['context-window'] || 1000);
              setPromptHeight(savedSettings['prompt-height'] || 40);
              setChatOnLeft(savedSettings['chat-on-left'] !== undefined ? savedSettings['chat-on-left'] : false);
              
              setSettings({
                "link-2-fb": savedSettings['link-2-fb'] || '',
                "chat-width": savedSettings['chat-width'] || 350,
                "context-window": savedSettings['context-window'] || 1000,
                "prompt-height": savedSettings['prompt-height'] || 40,
                "chat-on-left": savedSettings['chat-on-left'] !== undefined ? savedSettings['chat-on-left'] : false,
                lastModified: savedSettings.lastModified || new Date().toISOString()
              });
            }
            
            console.log('📄 מסמך עם שיחה והגדרות נטען');
          } else {
            // Fix line breaks for plain text files too
            const fixedContent = e.target.result.replace(/\\n/g, '\n');
            setContent(fixedContent);
            setFileName(file.name.replace('.json', '') || 'מסמך-נטען');
          }
        } catch (error) {
          // Fix line breaks for files that failed to parse as JSON
          const fixedContent = e.target.result.replace(/\\n/g, '\n');
          setContent(fixedContent);
          setFileName(file.name.replace('.json', '') || 'מסמך-נטען');
        }
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  // Scroll chat to bottom
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6 relative">
          <div className="absolute top-4 left-4 flex gap-2">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="bg-gray-100 text-gray-600 p-2 rounded-full hover:bg-gray-200 transition-colors"
              title="הגדרות ומידע מערכת"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setShowHelpModal(true)}
              className="bg-blue-100 text-blue-600 p-2 rounded-full hover:bg-blue-200 transition-colors"
              title="עזרה והוראות שימוש"
            >
              <HelpCircle className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`p-2 rounded-full transition-colors ${
                isChatOpen 
                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                  : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
              }`}
              title={isChatOpen ? 'סגור צ\'אט' : 'פתח צ\'אט AI'}
            >
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <Edit3 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">עורך טקסט חכם עם בינה מלאכותית</h1>
          </div>
          <p className="text-gray-600 text-lg">
            כתוב מאמרים ופוסטים בעברית עם עזרת בינה מלאכותית. בחר טקסט וצ'אט עם הAI
          </p>
        </div>

        {/* Main Content Area */}
        <div className="flex gap-0" style={{ height: 'calc(100vh - 200px)' }}>
          {/* Chat on Left */}
          {chatOnLeft && isChatOpen && (
            <>
              <ChatComponent
                isDragging={isDragging}
                chatWidth={chatWidth}
                chatOnLeft={chatOnLeft}
                setIsChatOpen={setIsChatOpen}
                chatMessagesRef={chatMessagesRef}
                chatMessages={chatMessages}
                isProcessingChat={isProcessingChat}
                selectedText={selectedText}
                getSelectionInfo={getSelectionInfo}
                chatInputRef={chatInputRef}
                userMessage={userMessage}
                setUserMessage={setUserMessage}
                sendChatMessage={sendChatMessage}
                promptHeight={promptHeight}
                handlePromptTextChange={handlePromptTextChange}
                PromptResizerComponent={PromptResizerComponent}
              />
              <ResizerComponent />
            </>
          )}

          {/* Editor Area */}
          <div 
            className={`flex-1 bg-white rounded-lg shadow-lg p-6 relative transition-all duration-300 ${
              isDragging ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''
            } ${isChatOpen ? (chatOnLeft ? 'mr-0' : 'ml-0') : ''}`}
            style={{ 
              marginLeft: chatOnLeft && isChatOpen ? '0' : '0',
              marginRight: !chatOnLeft && isChatOpen ? '0' : '0'
            }}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-600" />
                {isEditingFilename ? (
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => {
                      // Only allow valid filename characters
                      const sanitized = e.target.value.replace(/[<>:"/\\|?*]/g, '');
                      setFileName(sanitized);
                    }}
                    onBlur={() => setIsEditingFilename(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setIsEditingFilename(false);
                      }
                    }}
                    className="text-gray-700 font-medium bg-transparent border-b-2 border-blue-500 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <span 
                    className="text-gray-700 font-medium cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => setIsEditingFilename(true)}
                    title="לחץ לעריכת שם הקובץ"
                  >
                    {fileName}.json
                  </span>
                )}
                <span className="text-gray-500 text-sm">
                  ({getWordCount()} מילים)
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={saveContentToFile}
                  className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  <Save className="w-4 h-4" />
                  שמור
                </button>
                
                <label className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm cursor-pointer">
                  <Upload className="w-4 h-4" />
                  טען
                  <input
                    type="file"
                    accept=".txt,.md,.json,.html,.rtf"
                    onChange={loadContentFromFile}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            </div>
            
            {/* Editor with Line Numbers */}
            <div className="flex" style={{ height: 'calc(100% - 80px)' }}>
              {/* Line Numbers */}
              <div 
                className="bg-gray-50 border-r border-gray-200 text-xs text-gray-500 font-mono min-w-[50px] overflow-hidden"
                style={{ 
                  direction: 'ltr',
                  paddingTop: '1rem', // Match textarea padding
                  paddingRight: '0.5rem',
                  paddingLeft: '0.25rem'
                }}
              >
                {content.split('\n').map((_, index) => (
                  <div 
                    key={index} 
                    className="text-right"
                    style={{ 
                      height: '1.5rem', // Match textarea line-height
                      lineHeight: '1.5rem',
                      fontSize: '0.75rem'
                    }}
                  >
                    {index + 1}
                  </div>
                ))}
              </div>
              
              <textarea
                ref={textAreaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onMouseUp={handleSelection}
                onKeyUp={handleSelection}
                onBlur={(e) => {
                  // Don't clear selection when losing focus to chat
                  // Only handle selection changes when actually interacting with textarea
                }}
                className="flex-1 resize-none focus:border-blue-500 focus:outline-none border-2 border-gray-200 rounded-r-lg"
                style={{ 
                  direction: 'rtl', 
                  textAlign: 'right',
                  fontFamily: 'Arial, sans-serif',
                  fontSize: '1.125rem', // 18px
                  lineHeight: '1.5rem', // 24px - match line numbers
                  padding: '1rem',
                  margin: 0,
                  border: 'none',
                  borderLeft: '2px solid #e5e7eb',
                  borderRadius: '0 0.5rem 0.5rem 0'
                }}
                placeholder="התחל לכתוב כאן..."
              />
            </div>
          </div>

          {/* Chat on Right */}
          {!chatOnLeft && isChatOpen && (
            <>
              <ResizerComponent />
              <ChatComponent
                isDragging={isDragging}
                chatWidth={chatWidth}
                chatOnLeft={chatOnLeft}
                setIsChatOpen={setIsChatOpen}
                chatMessagesRef={chatMessagesRef}
                chatMessages={chatMessages}
                isProcessingChat={isProcessingChat}
                selectedText={selectedText}
                getSelectionInfo={getSelectionInfo}
                chatInputRef={chatInputRef}
                userMessage={userMessage}
                setUserMessage={setUserMessage}
                sendChatMessage={sendChatMessage}
                promptHeight={promptHeight}
                handlePromptTextChange={handlePromptTextChange}
                PromptResizerComponent={PromptResizerComponent}
              />
            </>
          )}
        </div>

        {/* Help Modal */}
        {showHelpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-6 m-4 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">איך להשתמש</h2>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2 text-gray-700">
                  <p><span className="font-bold">1.</span> כתוב טקסט בעורך</p>
                  <p><span className="font-bold">2.</span> בחר טקסט עם העכבר</p>
                  <p><span className="font-bold">3.</span> שאל שאלות או בקש שינויים בצ'אט</p>
                  <p><span className="font-bold">4.</span> הטקסט הנבחר יתעדכן אוטומטית</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-blue-800 font-medium mb-2">דוגמאות למה לכתוב בצ'אט:</p>
                  <p className="text-blue-700 text-sm">
                    "הרחב את הפסקה הזו" • "קצר את זה" • "שפר את הסגנון" • "תרגם לאנגלית"
                  </p>
                </div>

                <div className="text-center">
                  <button
                    onClick={() => setShowHelpModal(false)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    הבנתי!
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-2xl p-6 m-4 max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  הגדרות מערכת
                </h2>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    🔗 לינק לפייסבוק:
                  </label>
                  <input
                    type="url"
                    value={fbLink}
                    onChange={(e) => setFbLink(e.target.value)}
                    placeholder="https://www.facebook.com/..."
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    💬 רוחב צ'אט (פיקסלים):
                  </label>
                  <input
                    type="number"
                    value={chatWidth}
                    onChange={(e) => setChatWidth(parseInt(e.target.value) || 350)}
                    min="300"
                    max="500"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    בין 300 ל-500 פיקסלים
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    🧠 חלון הקשר שיחה (מילים):
                  </label>
                  <input
                    type="number"
                    value={contextWindow}
                    onChange={(e) => setContextWindow(parseInt(e.target.value) || 1000)}
                    min="500"
                    max="5000"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    מספר מילים לשמירה בזיכרון השיחה (500-5000)
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    📝 גובה ברירת מחדל לשדה פרומפט (פיקסלים):
                  </label>
                  <input
                    type="number"
                    value={promptHeight}
                    onChange={(e) => setPromptHeight(parseInt(e.target.value) || 40)}
                    min="40"
                    max="200"
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    גובה התחלתי של שדה הכתיבה (40-200 פיקסלים)
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    🔀 מיקום צ'אט:
                  </label>
                  <select
                    value={chatOnLeft ? 'left' : 'right'}
                    onChange={(e) => setChatOnLeft(e.target.value === 'left')}
                    className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="right">צד ימין</option>
                    <option value="left">צד שמאל</option>
                  </select>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={saveSettings}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    שמור
                  </button>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    בטל
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HebrewAIEditor;