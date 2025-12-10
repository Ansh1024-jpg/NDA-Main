import React, { useMemo } from 'react';
import '../styles/animations.css'; // Ensure animations are loaded

const StarBackground = () => {
  const generateBoxShadow = (n) => {
    let value = '';
    for (let i = 0; i < n; i++) {
      // Use window.innerWidth * 1.5 to ensure coverage on wide screens, defaults to 2500 if server-side
      const x = Math.floor(Math.random() * 2500); 
      const y = Math.floor(Math.random() * 2000);
      value += `${x}px ${y}px var(--star-color)`;
      if (i < n - 1) {
        value += ', ';
      }
    }
    return value;
  };

  const shadowSmall = useMemo(() => generateBoxShadow(700), []);
  const shadowMedium = useMemo(() => generateBoxShadow(200), []);
  const shadowBig = useMemo(() => generateBoxShadow(100), []);

  return (
    <div className="star-background-wrapper">
      <div id="stars" style={{ '--star-shadow': shadowSmall }}></div>
      <div id="stars2" style={{ '--star-shadow': shadowMedium }}></div>
      <div id="stars3" style={{ '--star-shadow': shadowBig }}></div>
    </div>
  );
};

export default StarBackground;
