import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  IoMusicalNotes, IoHome, IoSearch, IoLibrary, IoHeart, IoTime,
  IoFilm, IoTv, IoFlame, IoSparkles, IoVideocam
} from 'react-icons/io5';
import { usePlayer } from '../../context/PlayerContext';
import { getMediumQualityImage, decodeHTML, getArtistNames } from '../../utils/helpers';
import './Sidebar.css';

const musicNavItems = [
  { path: '/', label: 'Home', icon: <IoHome /> },
  { path: '/search', label: 'Search', icon: <IoSearch /> },
  { path: '/library', label: 'Your Library', icon: <IoLibrary /> },
];

const movieNavItems = [
  { path: '/movies', label: 'Movies Home', icon: <IoFilm /> },
  { path: '/movies/search', label: 'Search Movies', icon: <IoSearch /> },
  { path: '/movies/trending', label: 'Trending', icon: <IoFlame /> },
  { path: '/movies/tv', label: 'Web Series', icon: <IoTv /> },
];

export default function Sidebar({ mode, setMode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { recentlyPlayed, likedSongs } = usePlayer();

  const navItems = mode === 'music' ? musicNavItems : movieNavItems;

  return (
    <aside className="sidebar" id="sidebar">
      {/* Logo */}
      <div className="sidebar__logo" id="sidebar-logo">
        <img src="/beatbox_logo.png" alt="BeatBox Logo" className="sidebar__logo-image" />
      </div>

      {/* Mode Switcher */}
      <div className="sidebar__mode" id="mode-switcher">
        <button
          className={`sidebar__mode-btn music ${mode === 'music' ? 'active' : ''}`}
          onClick={() => { setMode('music'); navigate('/'); }}
          id="mode-music"
        >
          <IoMusicalNotes size={14} /> Music
        </button>
        <button
          className={`sidebar__mode-btn movies ${mode === 'movies' ? 'active' : ''}`}
          onClick={() => { setMode('movies'); navigate('/movies'); }}
          id="mode-movies"
        >
          <IoFilm size={14} /> Movies
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav" id="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.path}
            className={`sidebar__nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            id={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
          >
            <span className="sidebar__nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar__divider" />

      {/* Quick Access (Music mode only) */}
      {mode === 'music' && (
        <nav className="sidebar__nav">
          <button
            className={`sidebar__nav-item ${location.pathname === '/cuts' ? 'active' : ''}`}
            onClick={() => navigate('/cuts')}
            id="nav-cuts"
          >
            <span className="sidebar__nav-icon"><IoVideocam /></span>
            Cuts
          </button>
          <button
            className={`sidebar__nav-item ${location.pathname === '/recent' ? 'active' : ''}`}
            onClick={() => navigate('/recent')}
            id="nav-recently-played"
          >
            <span className="sidebar__nav-icon"><IoTime /></span>
            Recently Played
          </button>
        </nav>
      )}

      <div className="sidebar__divider" />

      {/* Recently Played Library */}
      <div className="sidebar__library" id="sidebar-library">
        <div className="sidebar__library-header">
          <span className="sidebar__library-title">
            {mode === 'music' ? 'Recent' : 'Watchlist'}
          </span>
        </div>
        {mode === 'music' && recentlyPlayed.slice(0, 6).map((song) => (
          <button
            key={song.id}
            className="sidebar__library-item"
            onClick={() => navigate(`/`)}
          >
            <img
              className="sidebar__library-item-img"
              src={getMediumQualityImage(song.image)}
              alt={decodeHTML(song.name)}
              loading="lazy"
            />
            <div className="sidebar__library-item-info">
              <div className="sidebar__library-item-name">{decodeHTML(song.name)}</div>
              <div className="sidebar__library-item-meta">{getArtistNames(song.artists, song.primaryArtists)}</div>
            </div>
          </button>
        ))}
        {mode === 'music' && recentlyPlayed.length === 0 && (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-subdued)', fontSize: 11 }}>
            Songs you play will appear here
          </div>
        )}
        {mode === 'movies' && (
          <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-subdued)', fontSize: 11 }}>
            <IoSparkles size={20} style={{ marginBottom: 8, opacity: 0.4 }} /><br />
            Browse Tamil movies & web series
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sidebar__footer">
        <div className="sidebar__footer-text">BeatBox v2.0 • Music + Movies</div>
      </div>
    </aside>
  );
}
