import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import '../styles/summaryPage.css';
import '../styles/chatPage.css';

export default function BoQPage({ darkMode, setDarkMode }) {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [boqData, setBoqData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleExport = () => {
        if (!boqData.headers || !boqData.rows) return;

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();

        // Prepare data: headers + rows
        // For BoQ, we need to handle HTML content in cells (like <br>) if we want clean text
        // But for simplicity, we'll just dump the raw text first. 
        // Ideally, we should strip HTML tags for Excel.

        const cleanRows = boqData.rows.map(row =>
            row.map(cell => cell.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''))
        );

        const data = [
            boqData.headers,
            ...cleanRows
        ];

        const ws = XLSX.utils.aoa_to_sheet(data);

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "Bill of Quantities");

        // Generate Excel file
        XLSX.writeFile(wb, "Bill_of_Quantities.xlsx");
    };

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

    useEffect(() => {
        const fetchBoQ = async () => {
            try {
                const res = await fetch(`http://localhost:8000/create_boq/${sessionId}`, {
                    method: 'POST',
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.detail || 'Failed to generate BoQ');
                }

                if (data.agent_message) {
                    parseBoQ(data.agent_message);
                } else {
                    setError('No BoQ data available.');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchBoQ();
    }, [sessionId]);

    const parseBoQ = (markdown) => {
        // Basic Markdown Table Parser
        const lines = markdown.trim().split('\n');
        const rows = [];

        // Filter out separator lines
        const dataLines = lines.filter(line =>
            line.trim().startsWith('|') && !line.includes('---')
        );

        if (dataLines.length > 0) {
            // Headers
            const headers = dataLines[0]
                .split('|')
                .map(cell => cell.trim())
                .filter(cell => cell !== '');

            // Find the index of "Budgetary Pricing per unit" column
            const budgetaryPricingIndex = headers.findIndex(h =>
                h.toLowerCase().includes('budgetary pricing per unit')
            );

            // Find the index of "Qty/Value" column
            const qtyValueIndex = headers.findIndex(h =>
                h.toLowerCase().includes('qty') || h.toLowerCase().includes('value')
            );

            // Insert "Total Budgetary Pricing" header after "Budgetary Pricing per unit"
            if (budgetaryPricingIndex !== -1) {
                headers.splice(budgetaryPricingIndex + 1, 0, 'Total Budgetary Pricing');
            }

            // Data rows
            for (let i = 1; i < dataLines.length; i++) {
                const cleanCells = dataLines[i]
                    .split('|')
                    .slice(1, -1)
                    .map(c => c.trim().replace(/\*\*/g, '')); // Remove markdown bold

                if (cleanCells.length > 0) {
                    // Calculate Total Budgetary Pricing if both columns exist
                    if (budgetaryPricingIndex !== -1 && qtyValueIndex !== -1) {
                        const qtyValue = parseFloat(cleanCells[qtyValueIndex]?.replace(/[^0-9.-]/g, '') || 0);
                        const budgetaryPrice = parseFloat(cleanCells[budgetaryPricingIndex]?.replace(/[^0-9.-]/g, '') || 0);
                        const product = qtyValue * budgetaryPrice;

                        // Display "-" if the product is NaN or if either value is 0
                        // Otherwise, show whole numbers without decimals, or with decimals only if non-zero
                        let totalBudgetaryPricing = '-';
                        if (!isNaN(product) && product !== 0) {
                            totalBudgetaryPricing = product % 1 === 0 ? product.toString() : product.toFixed(2);
                        }

                        // Insert the calculated value after budgetary pricing column
                        cleanCells.splice(budgetaryPricingIndex + 1, 0, totalBudgetaryPricing);
                    }

                    rows.push(cleanCells);
                }
            }

            setBoqData({ headers, rows });
        } else {
            setError("BoQ format not recognized as a table.");
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
                            Generating Bill of Quantities
                        </h2>
                        <p style={{
                            color: darkMode ? '#9ca3af' : '#6b7280',
                            fontSize: '14px',
                            margin: 0
                        }}>
                            Please wait while we prepare your BoQ...
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
                            Error Generating BoQ
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

            <main className="summary-content" style={{ padding: '40px', overflowY: 'auto' }}>
                <div className="summary-inner-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <h2 style={{ marginBottom: '20px', color: darkMode ? '#fff' : '#333' }}>Bill of Quantities</h2>
                    <table className="summary-table">
                        <thead>
                            <tr>
                                {boqData.headers?.map((header, i) => (
                                    <th key={i}>{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {boqData.rows?.map((row, i) => (
                                <tr key={i}>
                                    {row.map((cell, j) => (
                                        <td key={j} dangerouslySetInnerHTML={{ __html: cell.replace(/<br>/g, '<br/>') }}></td>
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
