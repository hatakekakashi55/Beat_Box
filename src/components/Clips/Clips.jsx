import React from 'react';
import { IoClose } from 'react-icons/io5';
import { getYouTubeShortUrl } from '../../api/saavn';
import { getArtistNames, decodeHTML } from '../../utils/helpers';
import './Clips.css';

export default function Clips({ song, clipId, onClose }) {
  if (!song) return null;

  return (
    <div className="clips-container">
      {/* Blurred Background */}
      <div 
        className="clips-bg" 
        style={{ backgroundImage: `url(${song.image?.[2]?.url || song.image?.[0]?.url})` }}
      ></div>
      <div className="clips-bg-overlay"></div>

      <div className="clips-header">
        <span className="clips-title">Clips</span>
      </div>

      <button className="clips-close-btn" onClick={onClose} aria-label="Close Clips">
        <IoClose />
      </button>

      <div className="clips-video-wrapper">
        {clipId ? (
          <div className="clips-player-box">
            <iframe
              className="clips-iframe"
              src={`https://www.youtube-nocookie.com/embed/${clipId}?autoplay=1&mute=1&controls=0&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&loop=1&playlist=${clipId}&playsinline=1`}
              title="Spotify Clip"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              frameBorder="0"
            />
            {/* Invisible overlay to block ALL interactions with iframe */}
            <div className="clips-iframe-overlay"></div>
            
            {/* Custom Overlay Controls */}
            <div className="clips-overlay-ui">
              <div className="clips-song-info">
                <img src={song.image?.[1]?.url || song.image?.[0]?.url} alt="" className="clips-song-img" />
                <div className="clips-song-text">
                  <h4>{decodeHTML(song.name)}</h4>
                  <p>{getArtistNames(song.artists, song.primaryArtists)}</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="clips-error">
            <p>No clip available for this track.</p>
          </div>
        )}
      </div>
    </div>
  );
}
