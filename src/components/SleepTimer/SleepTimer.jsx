import React, { useState, useEffect, useRef } from 'react';
import { IoMoon, IoClose, IoTimeOutline } from 'react-icons/io5';
import { usePlayer } from '../../context/PlayerContext';
import './SleepTimer.css';

const PRESETS = [
  { label: '5 min', minutes: 5 },
  { label: '10 min', minutes: 10 },
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '45 min', minutes: 45 },
  { label: '1 hour', minutes: 60 },
  { label: '2 hours', minutes: 120 },
];

export default function SleepTimer({ onClose }) {
  const { togglePlay, isPlaying } = usePlayer();
  const [active, setActive] = useState(false);
  const [remaining, setRemaining] = useState(0); // seconds
  const timerRef = useRef(null);

  useEffect(() => {
    if (!active || remaining <= 0) return;

    timerRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          // Time's up — pause playback
          clearInterval(timerRef.current);
          setActive(false);
          if (isPlaying) togglePlay();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [active, remaining > 0]);

  const startTimer = (minutes) => {
    setRemaining(minutes * 60);
    setActive(true);
  };

  const cancelTimer = () => {
    clearInterval(timerRef.current);
    setActive(false);
    setRemaining(0);
  };

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="sleep-timer-overlay" onClick={onClose}>
      <div className="sleep-timer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sleep-timer__header">
          <div className="sleep-timer__header-left">
            <IoMoon className="sleep-timer__moon-icon" />
            <h3 className="sleep-timer__title">Sleep Timer</h3>
          </div>
          <button className="sleep-timer__close" onClick={onClose} aria-label="Close">
            <IoClose />
          </button>
        </div>

        {/* Active Timer */}
        {active && remaining > 0 && (
          <div className="sleep-timer__active">
            <div className="sleep-timer__countdown">
              <IoTimeOutline className="sleep-timer__clock-icon" />
              <span className="sleep-timer__time">{formatTime(remaining)}</span>
            </div>
            <p className="sleep-timer__active-label">Music will stop in</p>
            <button className="sleep-timer__cancel-btn" onClick={cancelTimer}>
              Cancel Timer
            </button>
          </div>
        )}

        {/* Presets */}
        {!active && (
          <div className="sleep-timer__presets">
            <p className="sleep-timer__subtitle">Stop music after</p>
            {PRESETS.map(preset => (
              <button
                key={preset.minutes}
                className="sleep-timer__preset"
                onClick={() => startTimer(preset.minutes)}
              >
                {preset.label}
              </button>
            ))}
            <button
              className="sleep-timer__preset sleep-timer__preset--end"
              onClick={() => {
                // End of current song
                // We'll set a very short timer that the context handles
                startTimer(0.1); // ~6 seconds (we'll refine)
              }}
            >
              End of track
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
