import React, { useState, useEffect } from "react";

export default function CategoryPanel({ category, onClose, navigate }) {
  const [answers, setAnswers] = useState(
    category && Array.isArray(category.subcategories)
      ? category.subcategories.reduce((acc, curr) => {
        acc[curr.id] = ""; // Initialize answers with empty strings
        return acc;
      }, {})
      : {}
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    // reset local state whenever the selected category changes
    setAnswers(
      category && Array.isArray(category.subcategories)
        ? category.subcategories.reduce((acc, curr) => {
          acc[curr.id] = "";
          return acc;
        }, {})
        : {}
    );
    setCurrentIndex(0);
    setError("");
    setFinished(false);
  }, [category]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAnswers((prev) => ({ ...prev, [name]: value }));
  };

  // Called when the user submits a single-question form.
  const handleQuestionSubmit = (e) => {
    e.preventDefault();
    if (!category || !Array.isArray(category.subcategories)) return;

    const sub = category.subcategories[currentIndex];
    const val = (answers[sub.id] || "").trim();
    if (!val) {
      setError("Please answer this question before continuing.");
      return;
    }
    setError("");

    if (currentIndex < category.subcategories.length - 1) {
      setCurrentIndex((ci) => ci + 1);
    } else {
      // final submit
      setFinished(true);
      console.log("Final submission with answers:", answers);
    }
  };

  // If no category is selected, render an empty panel to keep DOM present
  if (!category) {
    return <div className="category-panel" aria-hidden="true" />;
  }

  return (
    <div className="category-panel" aria-live="polite" aria-atomic="true">
      <div className="panel-top">
        <div className="panel-head">
          <div>
            <div className="panel-badge">{category.title}</div>
            {category.description && (
              <div className="panel-desc" style={{ marginTop: 8 }}>
                {category.description}
              </div>
            )}
          </div>

          <div>
            <button
              className="btn-close"
              onClick={onClose}
              aria-label="Close subcategory panel"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Render subcategories */}
      <div className="panel-subcategories" role="list" aria-label="Subcategories">
        {(category.id === "site-details" || category.id === "network") ? (
          // Render questions (form) for "Site Details" and "Network" one at a time
          (finished ? (
            <div className="panel-form panel-form--finished">
              <h3>All done — thank you!</h3>
              <p>Here's a summary of your answers:</p>

              {/* Render a Markdown-style summary using the category's subcategory titles */}
              <div className="answers-summary">
                <ul>
                  {category.subcategories.map((sub, idx) => (
                    <li key={sub.id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <strong>{sub.title}:</strong>{" "}
                        {answers[sub.id] === "special-rooms" ? (
                          <>
                            <strong>Special Rooms:</strong> "{answers[`${sub.id}_custom`] || ""}"
                          </>
                        ) : (
                          String(answers[sub.id] ?? "") || <em>—</em>
                        )}
                      </div>
                      <div>
                        <button
                          type="button"
                          className="btn-edit-mini"
                          onClick={() => {
                            // allow editing this specific question
                            setFinished(false);
                            setCurrentIndex(idx);
                            setError("");
                          }}
                          aria-label={`Edit ${sub.title}`}
                        >
                          {/* pencil icon (SVG) — icon-only button */}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="currentColor" />
                            <path d="M20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor" />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="panel-actions" style={{ marginTop: 12, justifyContent: 'flex-start' }}>
                <button
                  type="button"
                  className="btn-back"
                  onClick={() => {
                    // clear answers and restart the form
                    const empty = category.subcategories.reduce((acc, cur) => {
                      acc[cur.id] = "";
                      return acc;
                    }, {});
                    setAnswers(empty);
                    setFinished(false);
                    setCurrentIndex(0);
                    setError("");
                  }}
                >
                  Start Again
                </button>
              </div>

              {/* Removed raw Markdown source per request; only the rendered summary is shown */}
            </div>
          ) : (
            <form className="panel-form" onSubmit={handleQuestionSubmit}>
              {
                // render only the current question
              }
              {category.subcategories && category.subcategories.length > 0 && (
                (() => {
                  const sub = category.subcategories[currentIndex];
                  const isNetwork = category.id === 'network';
                  return (
                    <div key={sub.id} className="form-group">
                      <div className="question-progress" style={{ marginBottom: 24, fontSize: 13, color: 'var(--muted-1)' }}>
                        Question {currentIndex + 1} of {category.subcategories.length}
                      </div>
                      <label htmlFor={sub.id}>{sub.title}</label>
                      {sub.options ? (
                        <div className="choice-container">
                          <div className="choice-list" role="radiogroup" aria-labelledby={sub.id} style={{ marginTop: '16px' }}>
                            {sub.options.map((opt, idx) => {
                              const isObject = typeof opt === 'object';
                              const value = isObject ? opt.value : opt;
                              const label = isObject ? opt.label : opt;
                              const isSelected = answers[sub.id] === value;

                              return (
                                <div key={idx} className="choice-item" style={{ marginBottom: '8px' }}>
                                  <button
                                    type="button"
                                    className={`choice-btn ${isSelected ? 'choice-btn--selected' : ''}`}
                                    onClick={() => {
                                      setAnswers((p) => ({ ...p, [sub.id]: value }));
                                      setError('');
                                    }}
                                    aria-pressed={isSelected}
                                    style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start' }}
                                  >
                                    {label}
                                  </button>
                                  {isObject && opt.hasInput && isSelected && (
                                    <div style={{ marginTop: '8px', paddingLeft: '4px' }}>
                                      <input
                                        type="text"
                                        name={`${sub.id}_custom`}
                                        value={answers[`${sub.id}_custom`] || ""}
                                        onChange={handleInputChange}
                                        placeholder="Please specify details..."
                                        className="custom-input"
                                        autoFocus
                                        style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <>
                          <input
                            type="text"
                            id={sub.id}
                            name={sub.id}
                            value={answers[sub.id] || ""}
                            onChange={handleInputChange}
                            placeholder={sub.description}
                            autoComplete="off"
                            autoFocus
                            style={{ marginTop: '12px' }}
                          />
                        </>
                      )}
                      {error && <div className="form-error">{error}</div>}
                    </div>
                  );
                })()
              )}

              <div className="panel-actions" style={{ justifyContent: currentIndex > 0 ? 'center' : 'flex-start' }}>
                {currentIndex > 0 && (
                  <button
                    type="button"
                    className="btn-back"
                    onClick={() => { setCurrentIndex((ci) => Math.max(0, ci - 1)); setError(""); }}
                  >
                    Back
                  </button>
                )}

                <button type="submit" className="submit-button">
                  {currentIndex < (category.subcategories?.length || 0) - 1 ? 'Next' : 'Finish'}
                </button>
              </div>
            </form>
          ))
        ) : (
          // For other categories, render either a single AI action (security)
          // or the regular subcategory cards for anything else.
          (category.id === 'building-coverage' ? (
            <div className="panel-form panel-form--security">
              {/* Security / Building and Coverage -> Navigate to chat page */}
              <p>Start an interactive session with the NEOM Collaboration Demand Assistant to collect building & coverage requirements.</p>
              <button
                className="btn-primary"
                type="button"
                onClick={() => navigate && navigate('/chat', { state: { category } })}
              >
                Interact with NEOM Collaboration Demand Assistant
              </button>
            </div>
          ) : (
            // Render regular subcategory cards for other non-question categories
            category.subcategories.map((s) => (
              <article
                key={s.id ?? `${category.id}-sub`}
                className="subcat-card"
                role="listitem"
                tabIndex={0}
                aria-label={s.title}
              >
                <div className="subcat-card__meta">
                  <div className="subcat-card__title">{s.title}</div>
                  {s.desc && <div className="subcat-card__desc">{s.desc}</div>}
                </div>

                <div className="subcat-card__actions">
                  <button
                    className="subcat-secondary"
                    onClick={() => alert(`More info: ${s.title}`)}
                    aria-label={`More info about ${s.title}`}
                    type="button"
                  >
                    Info
                  </button>
                  <button
                    className="subcat-open"
                    onClick={() => alert(`Open agent for: ${s.title}`)}
                    aria-label={`Open agent for ${s.title}`}
                    type="button"
                  >
                    Open
                  </button>
                </div>
              </article>
            ))
          ))
        )}
      </div>

      <div className="panel-footer">
        {(category.id === "site-details" || category.id === 'network') && !finished ? (
          <p className="panel-note panel-note--required">Fill in the details for your project site. Each question is required.</p>
        ) : category.id === 'building-coverage' ? null : (
          !finished && <p className="panel-note">Pick a subcategory to get started.</p>
        )}
      </div>
    </div>
  );
}
