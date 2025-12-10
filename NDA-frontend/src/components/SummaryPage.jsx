import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import '../styles/summaryPage.css';
import '../styles/chatPage.css'; // Import chat styles for navbar

export default function SummaryPage({ darkMode, setDarkMode }) {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleExport = () => {
    if (!summaryData.headers || !summaryData.rows) return;

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();

    // Prepare data: headers + rows
    const data = [
      summaryData.headers,
      ...summaryData.rows
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Summary");

    // Generate Excel file
    XLSX.writeFile(wb, "Project_Requirements_Summary.xlsx");
  };

  // Apply theme changes to body (copied from ChatPage)
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

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`http://localhost:8000/session/${sessionId}`);
        if (!res.ok) throw new Error('Failed to load session');
        const data = await res.json();

        if (data.next_response) {
          parseSummary(data.next_response);
        } else {
          setError('No summary available yet.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  const parseSummary = (markdown) => {
    // Basic Markdown Table Parser
    // Assumes format: | Col1 | Col2 | Col3 |
    const lines = markdown.trim().split('\n');
    const rows = [];

    // Filter out separator lines (e.g., |---|---|)
    const dataLines = lines.filter(line =>
      line.trim().startsWith('|') && !line.includes('---')
    );

    if (dataLines.length > 0) {
      // Headers are usually the first line
      const headers = dataLines[0]
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell !== '');

      // Data rows
      for (let i = 1; i < dataLines.length; i++) {
        const cells = dataLines[i]
          .split('|')
          .map(cell => cell.trim())
          .filter((cell, index, arr) => {
            // Filter out empty strings from start/end split if they are empty
            // But keep empty cells in the middle
            if (index === 0 && cell === '') return false;
            if (index === arr.length - 1 && cell === '') return false;
            return true;
          });

        // Sometimes split creates an empty first/last element depending on implementation
        // Let's just grab the inner content
        const cleanCells = dataLines[i]
          .split('|')
          .slice(1, -1) // Remove first and last empty strings from | start and end
          .map(c => c.trim().replace(/\*\*/g, '')); // Remove markdown bold syntax

        if (cleanCells.length > 0) {
          rows.push(cleanCells);
        }
      }

      setSummaryData({ headers, rows });
    } else {
      // Fallback if not a table
      setError("Summary format not recognized as a table.");
    }
  };

  if (loading) {
    return (
      <div className="chatgpt-container">
        <header className="chatgpt-header">
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
        <main className="summary-content" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 80px)'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '40px',
            borderRadius: '16px',
            background: darkMode
              ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(6, 182, 212, 0.1))'
              : 'linear-gradient(135deg, rgba(79, 70, 229, 0.05), rgba(6, 182, 212, 0.05))',
            border: `1px solid ${darkMode ? 'rgba(79, 70, 229, 0.2)' : 'rgba(79, 70, 229, 0.1)'}`,
            boxShadow: darkMode
              ? '0 8px 32px rgba(0, 0, 0, 0.3)'
              : '0 8px 32px rgba(79, 70, 229, 0.1)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 24px',
              position: 'relative'
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                border: '4px solid transparent',
                borderTopColor: '#4f46e5',
                borderRightColor: '#06b6d4',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <div style={{
                position: 'absolute',
                top: '8px',
                left: '8px',
                width: 'calc(100% - 16px)',
                height: 'calc(100% - 16px)',
                border: '3px solid transparent',
                borderBottomColor: '#4f46e5',
                borderLeftColor: '#06b6d4',
                borderRadius: '50%',
                animation: 'spin-reverse 0.75s linear infinite'
              }}></div>
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              background: 'linear-gradient(90deg, #4f46e5, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '12px'
            }}>
              Loading Response Summary
            </h2>
            <p style={{
              color: darkMode ? '#9ca3af' : '#6b7280',
              fontSize: '14px',
              margin: 0
            }}>
              Please wait while we prepare your summary...
            </p>
          </div>
        </main>
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes spin-reverse {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
        `}</style>
      </div>
    );
  }
  if (error) {
    return (
      <div className="chatgpt-container">
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
        <main className="summary-content" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 80px)'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '40px',
            borderRadius: '16px',
            background: darkMode
              ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.1), rgba(239, 68, 68, 0.1))'
              : 'linear-gradient(135deg, rgba(220, 38, 38, 0.05), rgba(239, 68, 68, 0.05))',
            border: `1px solid ${darkMode ? 'rgba(220, 38, 38, 0.2)' : 'rgba(220, 38, 38, 0.1)'}`,
            boxShadow: darkMode
              ? '0 8px 32px rgba(0, 0, 0, 0.3)'
              : '0 8px 32px rgba(220, 38, 38, 0.1)'
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 24px',
              borderRadius: '50%',
              background: darkMode ? 'rgba(220, 38, 38, 0.2)' : 'rgba(220, 38, 38, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#dc2626',
              marginBottom: '12px'
            }}>
              Error Loading Summary
            </h2>
            <p style={{
              color: darkMode ? '#9ca3af' : '#6b7280',
              fontSize: '14px',
              margin: 0
            }}>
              {error}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="chatgpt-container"> {/* Reuse chat container for layout/theme */}
      {/* Navbar reused from ChatPage */}
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
          {/* New Chat button removed as requested */}
        </div>
      </header>

      <main className="summary-content" style={{ padding: '40px', overflowY: 'auto' }}>
        <div className="summary-inner-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '20px', color: darkMode ? '#fff' : '#333' }}>Response Summary</h2>
          <table className="summary-table">
            <thead>
              <tr>
                {summaryData.headers?.map((header, i) => (
                  <th key={i}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summaryData.rows?.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleExport}
              className="action-btn"
              style={{
                background: 'linear-gradient(90deg, #4f46e5, #06b6d4)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.2)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(79, 70, 229, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(79, 70, 229, 0.2)';
              }}
            >
              Export to Excel
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
