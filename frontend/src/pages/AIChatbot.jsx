import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AIChatbot.css';

const AIChatbot = () => {
  const [messages, setMessages] = useState([]);
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions] = useState([
    "How should I take my Lisinopril?",
    "I'm feeling a bit dizzy today.",
    "Can I go for a walk now?",
    "When is my next checkup?"
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Try to load chat history from backend when available; fall back to mock data.
    const loadHistory = async () => {
      if (user && user._id) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        try {
          const res = await fetch(`/api/chat/user/${user._id}`, {
            signal: controller.signal,
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          clearTimeout(timeoutId);
          const data = await res.json();
          if (Array.isArray(data)) setMessages(data);
        } catch (err) {
          console.warn('Failed to load chat history from backend:', err && err.message);
        }
      } else {
        // No user id — start fresh
        setMessages([]);
      }
      setLoading(false);
    };

    loadHistory();
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessageStr = input;
    setInput('');
    setIsTyping(true);

    const userId = user?._id || 'static_user';
    const userMessage = {
      sender: 'user',
      message: userMessageStr,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      user: userId
    };

    // Optimistically add user message to UI
    const userTempId = Date.now().toString();
    setMessages(prev => [...prev, { ...userMessage, _id: userTempId }]);

    // Add placeholder bot message to be filled as we stream
    const botTempId = `bot-${Date.now().toString()}`;
    setMessages(prev => [...prev, { sender: 'bot', message: '', timestamp: '', _id: botTempId }]);

    try {
      // Try streaming endpoint first
      const streamRes = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify(userMessage)
      });

      if (streamRes.ok && streamRes.body) {
        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        let fullBotText = '';

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          if (value) {
            const chunk = decoder.decode(value);
            // Try to extract JSON from SSE data: chunks
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonStr = line.replace('data: ', '').trim();
                  if (jsonStr === '[DONE]') continue;
                  const parsed = JSON.parse(jsonStr);
                  fullBotText += parsed.delta || '';
                } catch (e) {
                  // If not JSON, maybe it's raw text
                  fullBotText += line.replace('data: ', '');
                }
              } else if (line.trim() && !line.startsWith('event:')) {
                // Raw fallback for non-SSE formatted chunks
                fullBotText += line;
              }
              
              // Update bot message in-place
              if (fullBotText) {
                setMessages(prev => prev.map(m => m._id === botTempId ? { ...m, message: fullBotText, timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) } : m));
              }
            }
          }
          done = readerDone;
        }

        // After streaming completes, persist conversation
        if (fullBotText) {
          try {
            await fetch('/api/chat', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : ''
              },
              body: JSON.stringify({ ...userMessage, botMessage: fullBotText })
            });
          } catch (err) {
            console.warn('Failed to persist conversation after streaming:', err);
          }
        } else {
          // Remove the empty bot placeholder if no text was received
          setMessages(prev => prev.filter(m => m._id !== botTempId));
        }
      } else {
        // Fallback to non-streaming endpoint
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: JSON.stringify(userMessage)
        });
        if (res.ok) {
          const { userMessage: savedUserMsg, botMessage: savedBotMsg } = await res.json();
          setMessages(prev => {
            // remove temp entries and append saved ones
            const filtered = prev.filter(m => m._id !== userTempId && m._id !== botTempId);
            return [...filtered, savedUserMsg, savedBotMsg];
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClear = async () => {
    if (window.confirm("Are you sure you want to clear your chat history?")) {
      try {
        if (user && user._id && token && token !== 'mock_token') {
          await fetch(`/api/chat/user/${user._id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
        setMessages([]);
      } catch (err) {
        console.error('Failed to clear chat history:', err);
      }
    }
  };

  if (loading) return <div className="chatbot-container" style={{ padding: '32px' }}>Loading chat...</div>;

  return (
    <div className="chatbot-container">
      <header className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div>
            <h1>CareBridge Assistant</h1>
            <p>Your 24/7 AI care companion. Ask questions or report how you're feeling.</p>
          </div>
          <div>
            <button className="btn btn-outline" onClick={handleClear} title="Clear chat history">Clear</button>
          </div>
        </div>
      </header>

      <div className="chat-interface glass-card">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={msg._id || msg.id || `msg-${i}-${msg.timestamp}`} className={`message-wrapper ${msg.sender}`}>
              <div className="message-avatar">
                {msg.sender === 'bot' ? <Bot size={20} /> : <User size={20} />}
              </div>
              <div className="message-content">
                <div className="message-bubble">
                  {msg.message}
                </div>
                <span className="message-time">{msg.timestamp}</span>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="message-wrapper bot">
              <div className="message-avatar">
                <Bot size={20} />
              </div>
              <div className="message-content">
                <div className="message-bubble typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-footer">
          <div className="suggestions-container">
            {suggestions.map((text, i) => (
              <button key={i} className="suggestion-chip" onClick={() => { setInput(text); }}>
                {text}
              </button>
            ))}
          </div>

          <form onSubmit={handleSend} className="chat-input-area">
            <input
              type="text"
              className="input-field chat-input"
              placeholder="Ask CareBridge anything..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
            />
            <button type="submit" className="btn btn-primary send-btn" disabled={!input.trim() || isTyping}>
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};



export default AIChatbot;
