import React from 'react';
import {
  IoClose,
  IoMusicalNotesOutline,
  IoPersonOutline,
  IoDiscOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoStarOutline,
  IoLanguageOutline,
} from 'react-icons/io5';
import { getHighQualityImage, decodeHTML, getArtistNames, formatDuration, formatPlayCount } from '../../utils/helpers';
import './SongDetails.css';

export default function SongDetails({ song, onClose }) {
  if (!song) return null;

  const image = getHighQualityImage(song.image);
  const title = decodeHTML(song.name || song.title || '');
  const artist = getArtistNames(song.artists, song.primaryArtists);
  const album = decodeHTML(song.album?.name || song.album || '');
  const year = song.year || song.releaseDate || '';
  const duration = formatDuration(song.duration);
  const playCount = song.playCount ? formatPlayCount(song.playCount) : null;
  const language = song.language ? song.language.charAt(0).toUpperCase() + song.language.slice(1) : '';
  const label = song.label || '';
  const hasLyrics = song.hasLyrics === 'true' || song.hasLyrics === true;

  const details = [
    { icon: <IoPersonOutline />, label: 'Artist', value: artist },
    { icon: <IoDiscOutline />, label: 'Album', value: album },
    { icon: <IoCalendarOutline />, label: 'Year', value: year },
    { icon: <IoTimeOutline />, label: 'Duration', value: duration },
    { icon: <IoLanguageOutline />, label: 'Language', value: language },
    { icon: <IoStarOutline />, label: 'Plays', value: playCount },
    { icon: <IoMusicalNotesOutline />, label: 'Label', value: label },
  ].filter(d => d.value);

  return (
    <div className="song-details-overlay" onClick={onClose}>
      <div className="song-details" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button className="song-details__close" onClick={onClose} aria-label="Close">
          <IoClose />
        </button>

        {/* Artwork */}
        <div className="song-details__art-wrapper">
          <img className="song-details__art" src={image} alt={title} />
          <div className="song-details__art-glow" style={{ backgroundImage: `url(${image})` }} />
        </div>

        {/* Title */}
        <h2 className="song-details__title">{title}</h2>
        <p className="song-details__subtitle">{artist}</p>

        {/* Lyrics badge */}
        {hasLyrics && (
          <span className="song-details__lyrics-badge">♪ Lyrics Available</span>
        )}

        {/* Info List */}
        <div className="song-details__info-list">
          {details.map((detail, i) => (
            <div key={i} className="song-details__info-row">
              <div className="song-details__info-icon">{detail.icon}</div>
              <div className="song-details__info-label">{detail.label}</div>
              <div className="song-details__info-value">{detail.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
