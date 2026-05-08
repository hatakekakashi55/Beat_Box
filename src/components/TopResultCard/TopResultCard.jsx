import React from 'react';
import { IoPlay } from 'react-icons/io5';
import { getHighQualityImage, decodeHTML } from '../../utils/helpers';
import './TopResultCard.css';

export default function TopResultCard({ item, onClick }) {
  if (!item) return null;

  const image = getHighQualityImage(item.image);
  const title = decodeHTML(item.title || item.name || '');
  const description = decodeHTML(item.description || item.primaryArtists || '');
  const type = item.type || 'song';

  // Determine badge label
  const badgeLabel = type === 'artist' ? 'Artist'
    : type === 'album' ? 'Album'
    : type === 'playlist' ? 'Playlist'
    : 'Song';

  return (
    <div className="top-result-card" onClick={onClick} id="top-result-card">
      <div className="top-result-card__image-wrapper">
        <img
          className={`top-result-card__image ${type === 'artist' ? 'top-result-card__image--round' : ''}`}
          src={image}
          alt={title}
          loading="lazy"
        />
      </div>
      <h3 className="top-result-card__title">{title}</h3>
      <p className="top-result-card__description">{description}</p>
      <span className="top-result-card__badge">{badgeLabel}</span>
      <button className="top-result-card__play" aria-label="Play">
        <IoPlay />
      </button>
    </div>
  );
}
