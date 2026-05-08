import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IoPlay, IoFilm, IoStar } from 'react-icons/io5';
import { getPosterUrl } from '../../api/tmdb';
import './MovieCard.css';

export default function MovieCard({ item, type = 'movie', style }) {
  const navigate = useNavigate();

  if (!item) return null;

  const title = item.title || item.name || 'Untitled';
  const year = (item.release_date || item.first_air_date || '').split('-')[0];
  const rating = item.vote_average ? item.vote_average.toFixed(1) : null;
  const posterUrl = getPosterUrl(item.poster_path);
  const lang = item.original_language?.toUpperCase() || '';

  const handleClick = () => {
    if (type === 'tv') {
      navigate(`/movies/tv/${item.id}`);
    } else {
      navigate(`/movies/${item.id}`);
    }
  };

  return (
    <div
      className="movie-card"
      onClick={handleClick}
      style={style}
      id={`movie-card-${item.id}`}
    >
      <div className="movie-card__poster-wrapper">
        {posterUrl ? (
          <img
            className="movie-card__poster"
            src={posterUrl}
            alt={title}
            loading="lazy"
          />
        ) : (
          <div className="movie-card__no-poster">
            <IoFilm />
          </div>
        )}

        {rating && rating > 0 && (
          <div className="movie-card__rating">
            <IoStar size={10} /> {rating}
          </div>
        )}

        <div className="movie-card__badges">
          <span className="movie-card__badge movie-card__badge--hd">HD</span>
          <span className={`movie-card__badge movie-card__badge--tamil ${item.original_language === 'ta' ? 'native' : ''}`}>
            {item.original_language === 'ta' ? 'Original' : 'Tamil'}
          </span>
        </div>

        <button className="movie-card__play-btn" aria-label="Watch">
          <IoPlay />
        </button>
      </div>

      <div className="movie-card__info">
        <div className="movie-card__title">{title}</div>
        <div className="movie-card__meta">
          {year && <span className="movie-card__year">{year}</span>}
          {lang && <span className="movie-card__lang">{lang}</span>}
        </div>
      </div>
    </div>
  );
}
