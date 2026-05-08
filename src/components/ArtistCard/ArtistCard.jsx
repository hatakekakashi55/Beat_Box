import React from 'react';
import { IoPlay } from 'react-icons/io5';
import { getHighQualityImage, decodeHTML } from '../../utils/helpers';
import './ArtistCard.css';

export default function ArtistCard({ artist, onClick, style }) {
  if (!artist) return null;

  const image = getHighQualityImage(artist.image);
  const name = decodeHTML(artist.title || artist.name || '');

  return (
    <div
      className="artist-card"
      onClick={() => onClick && onClick(artist)}
      style={style}
      id={`artist-card-${artist.id}`}
    >
      <div className="artist-card__image-wrapper">
        <img
          className="artist-card__image"
          src={image}
          alt={name}
          loading="lazy"
        />
        <button className="artist-card__play" aria-label="Play">
          <IoPlay />
        </button>
      </div>
      <p className="artist-card__name">{name}</p>
      <p className="artist-card__label">Artist</p>
    </div>
  );
}
