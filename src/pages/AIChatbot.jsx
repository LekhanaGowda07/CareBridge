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
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (user && token) {
      fetch(`/api/chat/user/${user._id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          setMessages(data);
          setLoading(false);
        })
        .catch(err => console.error(err));
    }
  }, [user, token]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const userMessageStr = input;
    setInput('');
    setIsTyping(true);

    const userMessage = {
      sender: 'user',
      message: userMessageStr,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      user: user._id
    };

    // Optimistically add user message to UI
    setMessages(prev => [...prev, { ...userMessage, _id: Date.now().toString() }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userMessage)
      });
      if (res.ok) {
        const { userMessage: savedUserMsg, botMessage: savedBotMsg } = await res.json();
        // Replace optimistic message and add bot response
        setMessages(prev => {
          const filtered = prev.filter(m => m.sender !== 'user' || m.message !== userMessageStr);
          return [...filtered, savedUserMsg, savedBotMsg];
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  if (loading) return <div className="chatbot-container" style={{ padding: '32px' }}>Loading chat...</div>;

  return (
    <div className="chatbot-container">
      <header className="page-header">
        <div>
          <h1>CareBridge Assistant</h1>
          <p>Your 24/7 AI care companion. Ask questions or report how you're feeling.</p>
        </div>
      </header>

      <div className="chat-interface glass-card">
        <div className="chat-messages">
          {messages.map(msg => (
            <div key={msg._id} className={`message-wrapper ${msg.sender}`}>
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

        <form onSubmit={handleSend} className="chat-input-area">
          <input
            type="text"
            className="input-field chat-input"
            placeholder="Type your message here..."
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
  );
};



export default AIChatbot;
