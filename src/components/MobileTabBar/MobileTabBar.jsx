import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoHome, IoSearch, IoLibrary, IoFilm, IoVideocam } from 'react-icons/io5';
import './MobileTabBar.css';

export default function MobileTabBar({ mode, setMode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const musicTabs = [
    { path: '/', label: 'Home', icon: <IoHome /> },
    { path: '/search', label: 'Search', icon: <IoSearch /> },
    { path: '/library', label: 'Library', icon: <IoLibrary /> },
    { path: '/cuts', label: 'Cuts', icon: <IoVideocam /> },
  ];

  const movieTabs = [
    { path: '/movies', label: 'Movies', icon: <IoFilm /> },
    { path: '/movies/search', label: 'Search', icon: <IoSearch /> },
  ];

  const tabs = mode === 'music' ? musicTabs : movieTabs;

  return (
    <div className="mobile-tab-bar" id="mobile-tab-bar">
      <div className="mobile-tab-bar__inner">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            className={`mobile-tab-bar__item ${location.pathname === tab.path ? 'active' : ''}`}
            onClick={() => navigate(tab.path)}
          >
            <span className="mobile-tab-bar__icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
        <div className="mobile-tab-bar__divider" />
        <button
          className={`mobile-tab-bar__item ${mode === 'music' ? '' : 'active'}`}
          onClick={() => {
            const newMode = mode === 'music' ? 'movies' : 'music';
            setMode(newMode);
            navigate(newMode === 'music' ? '/' : '/movies');
          }}
        >
          <span className="mobile-tab-bar__icon">
            {mode === 'music' ? <IoFilm /> : <IoHome />}
          </span>
          {mode === 'music' ? 'Movies' : 'Music'}
        </button>
      </div>
    </div>
  );
}
