import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./components/HomePage";
import ChatPage from "./components/ChatPage";
import SummaryPage from "./components/SummaryPage";
import SelectionPage from "./components/SelectionPage";
import BoQPage from "./components/BoQPage";

import StarBackground from "./components/StarBackground";

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize theme synchronously from localStorage or system preference
    try {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
    } catch (e) {
      // ignore (e.g., during SSR or unusual env)
    }
    return (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  });

  // No separate mount loader — darkMode is initialized synchronously so
  // the effect below will run once with the correct value.

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="/selection" element={<SelectionPage darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="/chat" element={<ChatPage darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="/summary/:sessionId" element={<SummaryPage darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="/create/boq/:sessionId" element={<BoQPage darkMode={darkMode} setDarkMode={setDarkMode} />} />
      </Routes>
    </>
  );
}
