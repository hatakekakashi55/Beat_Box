import React from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { IoClose, IoCloudOfflineOutline, IoLogOutOutline, IoInformationCircleOutline } from 'react-icons/io5';
import AboutModal from '../AboutModal/AboutModal';
import './SettingsModal.css';

export default function SettingsModal({ onClose }) {
  const { 
    userProfile, logout, dataSaver, toggleDataSaver,
    audioQuality, crossfade, gapless,
    dispatch 
  } = usePlayer();

  const [showAbout, setShowAbout] = React.useState(false);

  const handleLogout = () => {
    logout();
    onClose();
  };

  const setQuality = (q) => {
    dispatch({ type: 'SET_AUDIO_QUALITY', payload: q });
  };

  const toggleCrossfade = () => dispatch({ type: 'TOGGLE_CROSSFADE' });
  const toggleGapless = () => dispatch({ type: 'TOGGLE_GAPLESS' });

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={e => e.stopPropagation()}>
        <div className="settings-modal__header">
          <h2>Settings</h2>
          <button className="settings-modal__close" onClick={onClose} aria-label="Close">
            <IoClose size={24} />
          </button>
        </div>

        <div className="settings-modal__content">
          {userProfile && (
            <div className="settings-modal__profile">
              <img src={userProfile.avatar} alt="Profile" className="settings-modal__avatar" />
              <div className="settings-modal__user-info">
                <h3>{userProfile.name}</h3>
                <p>{userProfile.email}</p>
              </div>
            </div>
          )}

          <div className="settings-modal__section">
            <h3 className="settings-modal__section-title">Audio Quality & Playback</h3>
            
            {/* Audio Quality */}
            <div className="settings-modal__item">
              <div className="settings-modal__item-info">
                <div className="settings-modal__item-title">
                   Streaming Quality
                </div>
                <div className="settings-modal__item-desc">
                  Choose between 160kbps (Standard) and 320kbps (Premium).
                </div>
              </div>
              <div className="settings-modal__quality-btns">
                <button 
                  className={`quality-btn ${audioQuality === '160kbps' ? 'active' : ''}`}
                  onClick={() => setQuality('160kbps')}
                >
                  160k
                </button>
                <button 
                  className={`quality-btn ${audioQuality === '320kbps' ? 'active' : ''}`}
                  onClick={() => setQuality('320kbps')}
                >
                  320k
                </button>
              </div>
            </div>

            {/* Data Saver */}
            <div className="settings-modal__item">
              <div className="settings-modal__item-info">
                <div className="settings-modal__item-title">
                  <IoCloudOfflineOutline size={20} /> Data Saver
                </div>
                <div className="settings-modal__item-desc">
                  Override quality to 48kbps on mobile data.
                </div>
              </div>
              <label className="settings-modal__switch">
                <input type="checkbox" checked={dataSaver} onChange={toggleDataSaver} />
                <span className="settings-modal__slider"></span>
              </label>
            </div>

            {/* Crossfade */}
            <div className="settings-modal__item">
              <div className="settings-modal__item-info">
                <div className="settings-modal__item-title">
                   Crossfade
                </div>
                <div className="settings-modal__item-desc">
                  Smoothly fade between tracks.
                </div>
              </div>
              <label className="settings-modal__switch">
                <input type="checkbox" checked={crossfade} onChange={toggleCrossfade} />
                <span className="settings-modal__slider"></span>
              </label>
            </div>

            {/* Gapless */}
            <div className="settings-modal__item">
              <div className="settings-modal__item-info">
                <div className="settings-modal__item-title">
                   Gapless Playback
                </div>
                <div className="settings-modal__item-desc">
                  Pre-load next song for no silence.
                </div>
              </div>
              <label className="settings-modal__switch">
                <input type="checkbox" checked={gapless} onChange={toggleGapless} />
                <span className="settings-modal__slider"></span>
              </label>
            </div>
          </div>
          
          <div className="settings-modal__section" style={{ marginTop: 'auto', gap: '10px', display: 'flex', flexDirection: 'column' }}>
            <button className="settings-modal__about-btn" onClick={() => setShowAbout(true)}>
              <IoInformationCircleOutline size={20} /> About BeatBox
            </button>
            <button className="settings-modal__logout-btn" onClick={handleLogout}>
              <IoLogOutOutline size={20} /> Log Out
            </button>
          </div>
        </div>
      </div>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}
