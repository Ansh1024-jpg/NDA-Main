import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import StarBackground from "./StarBackground";

export default function HomePage({ darkMode, setDarkMode }) {
  const navigate = useNavigate();

  const applyThemeWithTransition = (toDark) => {
    // ... existing logic ...
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

  useEffect(() => {
    applyThemeWithTransition(darkMode);
  }, [darkMode]);

  const handleStartChat = () => {
    navigate("/selection");
  };

  return (
    <div className="app-wrapper">
      <StarBackground />
      {/* ---------- Header ---------- */}
      <header className="site-header">
        <div className="container header-inner">
          <div className="brand" role="banner">
            <div className="brand__logo" aria-hidden="true">
              <img
                src="/images/logo-neom1.png"
                alt="NEOM Logo"
                width="36"
                height="36"
                style={{ objectFit: "contain" }}
              />
              <span>NEOM</span>
            </div>
            <div className="brand__text">
              <div className="brand__title">NEOM Demand Agent</div>
              <div className="brand__subtitle">Powered by AI</div>
            </div>
          </div>

          <nav className="header-actions" aria-label="Top actions">
            <button
              className="theme-toggle"
              onClick={() => setDarkMode((d) => !d)}
              title={darkMode ? "Change to Light Mode" : "Change to Dark Mode"}
              aria-pressed={darkMode}
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </nav>
        </div>
      </header>

      <main className="container main-content">
        <div className="ai-agent-hero">
          <div className="ai-agent-content">
            <h1 className="ai-agent-title">
              Welcome to NEOM Demand Agent
            </h1>
            <p className="ai-agent-description">
              Streamline your infrastructure planning through guided conversations
              and automatically generate detailed requirements for your collaboration needs.
            </p>
            {/* <div className="ai-agent-features">
              <div className="feature-item">
                <span className="feature-icon">💬</span>
                <span className="feature-text">Natural Conversation</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <span className="feature-text">Instant Responses</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <span className="feature-text">Accurate Information</span>
              </div>
            </div> */}
            <button
              className="ai-agent-cta"
              onClick={handleStartChat}
              aria-label="Start conversation with AI assistant"
            >
              <span className="cta-icon">🤖</span>
              <span className="cta-text">Start Conversation</span>
              <span className="cta-arrow">→</span>
            </button>
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <div className="footer-inner container">
          <div className="copyright">
            © {new Date().getFullYear()} TATA Consultancy Services
          </div>
          <div className="footer-links">
            <a href="#help">Help</a>
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
