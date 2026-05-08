import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { IoSearch, IoSettingsOutline, IoChatbubblesOutline } from 'react-icons/io5';
import { usePlayer } from '../../context/PlayerContext';
import SettingsModal from '../SettingsModal/SettingsModal';
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile, toggleSettings } = usePlayer();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;
    const handleScroll = () => setScrolled(mainContent.scrollTop > 40);
    mainContent.addEventListener('scroll', handleScroll);
    return () => mainContent.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = location.pathname === '/';

  return (
    <header className={`navbar ${scrolled ? 'scrolled' : ''}`} id="navbar">
      {/* Left: Search */}
      <button
        className="navbar__icon-btn"
        onClick={() => navigate('/search')}
        id="nav-search-btn"
        aria-label="Search"
      >
        <IoSearch />
      </button>

      {/* Center: For You label */}
      <div className="navbar__center">
        {isHome ? <span className="navbar__for-you">For You</span> : null}
      </div>

      {/* Right: Settings + Profile */}
      <div className="navbar__right">
        <button className="navbar__icon-btn" onClick={() => navigate('/chats')} aria-label="Chats">
          <IoChatbubblesOutline />
        </button>
        <button className="navbar__icon-btn" onClick={() => toggleSettings()} aria-label="Settings">
          <IoSettingsOutline />
        </button>
        <button className="navbar__profile-btn" id="profile-btn" onClick={() => userProfile && navigate(`/user/${userProfile.uid}`)} aria-label="User profile">
          {userProfile?.avatar ? (
            <img src={userProfile.avatar} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
          ) : (
            'U'
          )}
        </button>
      </div>
    </header>
  );
}
