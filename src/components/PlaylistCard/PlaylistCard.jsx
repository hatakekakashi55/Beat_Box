import React from 'react';
import { IoPlay } from 'react-icons/io5';
import { getHighQualityImage, decodeHTML } from '../../utils/helpers';
import './PlaylistCard.css';

export default function PlaylistCard({ playlist, onClick, style }) {
  if (!playlist) return null;

  const image = getHighQualityImage(playlist.image);
  const title = decodeHTML(playlist.title || playlist.name || '');
  const desc = decodeHTML(playlist.description || playlist.subtitle || '');

  return (
    <div
      className="playlist-card"
      onClick={() => onClick && onClick(playlist)}
      style={style}
      id={`playlist-card-${playlist.id}`}
    >
      <div className="playlist-card__image-wrapper">
        <img
          className="playlist-card__image"
          src={image}
          alt={title}
          loading="lazy"
        />
        <button className="playlist-card__play" aria-label="Play">
          <IoPlay />
        </button>
      </div>
      <p className="playlist-card__title">{title}</p>
      <p className="playlist-card__desc">{desc}</p>
    </div>
  );
}
