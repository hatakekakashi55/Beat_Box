import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

export default function SplashScreen({ onComplete }) {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFade(true);
      setTimeout(onComplete, 800); // Wait for fade out animation
    }, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`splash-screen ${fade ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <div className="splash-logo-wrapper">
          <img src="/beatbox_logo.png" alt="BeatBox Logo" className="splash-logo" />
          <div className="music-bars">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <h1 className="splash-title">
          <span>B</span>
          <span>E</span>
          <span>A</span>
          <span>T</span>
          <span className="separator">-</span>
          <span>B</span>
          <span>O</span>
          <span>X</span>
        </h1>
        <p className="splash-tagline">Premium Music Experience</p>
      </div>
    </div>
  );
}
