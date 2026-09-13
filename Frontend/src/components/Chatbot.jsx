import React, { useState, useRef, useEffect } from 'react';
import './Chatbot.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Hello! I'm your eco-assistant. How can I help you today?", isBot: true }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const toggleChat = () => setIsOpen(!isOpen);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = inputValue.trim();
    const newMessages = [...messages, { text: userMsg, isBot: false }];
    setMessages(newMessages);
    setInputValue('');
    
    // Add a "typing" indicator
    setMessages(prev => [...prev, { text: "...", isBot: true, isTyping: true }]);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/api/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMsg,
          history: messages.slice(-5) // Send last 5 messages for context
        })
      });

      const data = await response.json();
      
      // Remove typing indicator and add real response
      setMessages(prev => {
        const filtered = prev.filter(m => !m.isTyping);
        if (data.success) {
          return [...filtered, { text: data.data.text, isBot: true }];
        } else {
          return [...filtered, { text: "I'm having trouble connecting to my brain. Try again later!", isBot: true }];
        }
      });
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages(prev => [
        ...prev.filter(m => !m.isTyping),
        { text: "I'm offline right now. Check your internet connection!", isBot: true }
      ]);
    }
  };

  return (
    <div className="chatbot-container">
      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <h4>Eco Assistant</h4>
            <button className="chatbot-close" onClick={toggleChat}>&times;</button>
          </div>
          
          <div className="chatbot-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`message-wrapper ${msg.isBot ? 'bot' : 'user'}`}>
                <div className={`message-bubble ${msg.isBot ? 'bot-bubble' : 'user-bubble'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="chatbot-input-form" onSubmit={handleSend}>
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask me anything..." 
              className="chatbot-input"
            />
            <button type="submit" className="chatbot-send">Send</button>
          </form>
        </div>
      )}

      {!isOpen && (
        <button className="chatbot-toggle-btn" onClick={toggleChat} title="Need help?">
          💬 Help
        </button>
      )}
    </div>
  );
};

export default Chatbot;
