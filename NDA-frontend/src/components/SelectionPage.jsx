import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/chatPage.css'; // Reuse chat page header styles
import '../styles/selectionPage.css'; // Import AFTER chatPage.css to allow overrides
import StarBackground from './StarBackground';

export default function SelectionPage({ darkMode, setDarkMode }) {
    const navigate = useNavigate();

    // Apply theme changes to body (consistent with other pages)
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

    const handleTileClick = (option) => {
        if (option === 'Collaboration Service') {
            navigate('/chat');
        }
        // "Network" and "Printer" do nothing as per requirements
    };

    return (
        <div className="chatgpt-container">
            <StarBackground />
            {/* Navbar reused from ChatPage/SummaryPage */}
            <header className="chatgpt-header">
                <button
                    className="chatgpt-back-btn"
                    onClick={() => navigate('/')}
                    title="Back to Home"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </button>

                <div className="chatgpt-header-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <img
                        src="/images/logo-neom.webp"
                        alt="Neom Logo"
                        style={{ height: '40px', width: 'auto' }}
                    />
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
                </div>
            </header>

            <main className="selection-content">
                <div className="selection-container">
                    <div className="welcome-message">
                        <h1 className="ai-agent-title">
                            Welcome to NEOM Demand Agent!
                        </h1>
                        <p className="ai-agent-description">
                            I'm your dedicated assistant, here to help you gather the right data for seamless infrastructure planning.
                        </p>
                        <p className="instruction">
                            Please choose the service you'd like to explore:
                        </p>
                    </div>

                    <div className="tiles-container">
                        <div
                            className="tile active"
                            onClick={() => handleTileClick('Network')}
                        >
                            <h3>Network</h3>
                        </div>

                        <div
                            className="tile active"
                            onClick={() => handleTileClick('Collaboration Service')}
                        >
                            <h3>Collaboration Service</h3>
                        </div>

                        <div
                            className="tile active"
                            onClick={() => handleTileClick('Printer')}
                        >
                            <h3>Printer</h3>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
