import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';

export default function ChatPage({ darkMode, setDarkMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const category = location.state?.category;

  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]); // All conversation messages
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0); // Track question progress
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Apply theme changes to body
  useEffect(() => {
    const applyThemeWithTransition = (toDark) => {
      const prefersReduced =
        window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const body = document.body;

      if (prefersReduced) {
        body.classList.toggle("dark", toDark);
        localStorage.setItem("theme", toDark ? "dark" : "light");
        return;
      }

      body.classList.add("theme-transition");
      if (toDark) {
        body.classList.add("dark");
      } else {
        setTimeout(() => body.classList.remove("dark"), 50);
      }

      localStorage.setItem("theme", toDark ? "dark" : "light");
      setTimeout(() => body.classList.remove("theme-transition"), 260);
    };

    applyThemeWithTransition(darkMode);
  }, [darkMode]);

  const API_BASE = (typeof window !== 'undefined' && window.location.hostname === 'localhost') ? 'http://localhost:8000' : 'http://localhost:8000';

  // Start conversation automatically on mount
  useEffect(() => {
    startConversation();
  }, []);

  async function startConversation() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/start`, { method: 'POST' });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setSessionId(data.session_id);
      setProgress(data.progress || 0);
      // Add initial agent message to conversation
      if (data.agent_message) {
        setMessages([{
          role: 'assistant',
          content: data.agent_message,
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e) {
    e?.preventDefault();
    if (!inputValue.trim() || loading) return;
    if (!sessionId) {
      setError('Session not initialized. Please refresh the page.');
      return;
    }

    const userMessage = inputValue.trim();
    setInputValue('');
    setError("");

    // Add user message immediately
    setMessages((prev) => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }]);

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/chat/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Server error (${res.status}): ${txt}`);
      }
      const data = await res.json();

      // Update progress
      setProgress(data.progress || 0);

      // Add agent response to conversation
      if (data.agent_message) {
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: data.agent_message,
          timestamp: new Date().toISOString(),
          isDone: data.status === 'done'
        }]);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  function resetConversation() {
    setMessages([]);
    setInputValue('');
    setError('');
    setProgress(0);
    startConversation();
  }

  const openSummary = () => {
    if (sessionId) {
      window.open(`/summary/${sessionId}`, '_blank');
    }
  };

  const generateBoQ = () => {
    if (sessionId) {
      window.open(`/create/boq/${sessionId}`, '_blank');
    }
  };

  return (
    <div className="chatgpt-container">
      {/* ChatGPT-style Header */}
      <header className="chatgpt-header">
        <div className="chatgpt-header-left">
          <button
            className="chatgpt-back-btn"
            onClick={() => navigate('/')}
            title="Back to Home"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="chatgpt-logo-container">
            <img
              src="/images/logo-neom1.png"
              alt="Neom Logo"
              className="chatgpt-header-logo"
            />
            <span className="chatgpt-header-neom-text">NEOM</span>
          </div>
        </div>

        <div className="chatgpt-header-title">
          <h1>NEOM Demand Agent</h1>
        </div>

        <div className="chatgpt-header-actions">
          <button
            className="chatgpt-theme-toggle"
            onClick={() => setDarkMode((d) => !d)}
            title={darkMode ? "Light mode" : "Dark mode"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
          <button
            className="chatgpt-new-chat-btn"
            onClick={resetConversation}
            title="New conversation"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="chat-progress-container">
        <div className="chat-progress-bar">
          <div
            className="chat-progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="chat-progress-text">
          {progress}% Complete
        </div>
      </div>

      {/* ChatGPT-style Messages Area */}
      <main className="chatgpt-main">
        <div className="chatgpt-messages">
          {messages.length === 0 && !loading ? (
            <div className="chatgpt-empty-state">
              <div className="chatgpt-empty-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h2>How can I help you today?</h2>
              <p>{category?.description || 'Start chatting with the AI agent'}</p>
            </div>
          ) : (
            <>
              {messages.map((msg, index) => (
                <div key={index} className={`chatgpt-message ${msg.role}`}>
                  <div className="chatgpt-message-avatar" style={{ visibility: msg.isDone ? 'hidden' : 'visible' }}>
                    {msg.role === 'assistant' ? (
                      <svg width="24" height="24" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        {/* Antenna */}
                        <line x1="16" y1="2" x2="16" y2="5" />
                        <circle cx="16" cy="3.5" r="1.2" />
                        {/* Head */}
                        <rect x="8" y="7" width="16" height="14" rx="2" />
                        {/* Left Ear */}
                        <circle cx="5" cy="13" r="2" />
                        {/* Right Ear */}
                        <circle cx="27" cy="13" r="2" />
                        {/* Left Eye */}
                        <circle cx="12" cy="12" r="1.5" />
                        {/* Right Eye */}
                        <circle cx="20" cy="12" r="1.5" />
                        {/* Mouth */}
                        <line x1="12" y1="17" x2="20" y2="17" />
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    )}
                  </div>
                  <div className="chatgpt-message-content">
                    {msg.role === 'assistant' ? (
                      <div className="chatgpt-markdown">
                        {msg.isDone ? (
                          <div className="chat-done-actions">
                            <button onClick={openSummary} className="action-btn summary-btn">
                              View Response Summary
                            </button>
                            <button onClick={generateBoQ} className="action-btn boq-btn">
                              Generate BoQ
                            </button>
                          </div>
                        ) : (
                          <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                            {msg.content.replace(/^Done\s*[:\-]?/i, '').replace(/^\s*\[ASK\s+Q\d+\]\s*/i, '').replace(/(\*\*[^*]+\*\*)\s*[:\-]\s*/, '$1\n\n').trim()}
                          </ReactMarkdown>
                        )}
                      </div>
                    ) : (
                      <div className="chatgpt-text">
                        {msg.content}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="chatgpt-message assistant">
                  <div className="chatgpt-message-avatar">
                    <svg width="24" height="24" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      {/* Antenna */}
                      <line x1="16" y1="2" x2="16" y2="5" />
                      <circle cx="16" cy="3.5" r="1.2" />
                      {/* Head */}
                      <rect x="8" y="7" width="16" height="14" rx="2" />
                      {/* Left Ear */}
                      <circle cx="5" cy="13" r="2" />
                      {/* Right Ear */}
                      <circle cx="27" cy="13" r="2" />
                      {/* Left Eye */}
                      <circle cx="12" cy="12" r="1.5" />
                      {/* Right Eye */}
                      <circle cx="20" cy="12" r="1.5" />
                      {/* Mouth */}
                      <line x1="12" y1="17" x2="20" y2="17" />
                    </svg>
                  </div>
                  <div className="chatgpt-message-content">
                    <div className="chatgpt-typing">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </main>

      {/* ChatGPT-style Input Area */}
      <footer className="chatgpt-footer">
        <form onSubmit={sendMessage} className="chatgpt-input-form">
          <div className="chatgpt-input-wrapper">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder="Type your message here..."
              rows="1"
              disabled={loading}
              className="chatgpt-input"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || loading}
              className="chatgpt-send-btn"
              title="Send message"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
          {error && <div className="chatgpt-error">{error}</div>}
        </form>
        <div className="chatgpt-footer-note">
          Press Enter to send, Shift+Enter for new line
        </div>
      </footer>
    </div>
  );
}
