import React from 'react';
import { IoPlay } from 'react-icons/io5';
import { getHighQualityImage, decodeHTML } from '../../utils/helpers';
import './AlbumCard.css';

export default function AlbumCard({ album, onClick, style }) {
  if (!album) return null;

  const image = getHighQualityImage(album.image);
  const title = decodeHTML(album.title || album.name || '');
  const artist = decodeHTML(album.artist || album.subtitle || '');
  const year = album.year || '';

  return (
    <div
      className="album-card"
      onClick={() => onClick && onClick(album)}
      style={style}
      id={`album-card-${album.id}`}
    >
      <div className="album-card__image-wrapper">
        <img
          className="album-card__image"
          src={image}
          alt={title}
          loading="lazy"
        />
        <button className="album-card__play" aria-label="Play">
          <IoPlay />
        </button>
      </div>
      <p className="album-card__title">{title}</p>
      <p className="album-card__meta">
        {year ? `${year} • ` : ''}{artist}
      </p>
    </div>
  );
}
