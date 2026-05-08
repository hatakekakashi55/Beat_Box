import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { IoPlay, IoStar, IoCalendar, IoTime, IoGlobe } from 'react-icons/io5';
import { getMovieDetails, getBackdropUrl, getPosterUrl, getMovieEmbedUrl } from '../../api/tmdb';
import MovieCard from '../../components/MovieCard/MovieCard';
import Loader from '../../components/Loader/Loader';
import './MovieDetail.css';

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const [activeServer, setActiveServer] = useState('vidlink'); // vidlink | vidsrc_icu | embed_su | multiembed

  useEffect(() => {
    let mounted = true;
    async function fetchMovie() {
      setLoading(true);
      setShowPlayer(false);
      try {
        const data = await getMovieDetails(id);
        if (mounted) setMovie(data);
      } catch (err) {
        console.error('Failed to fetch movie:', err);
      }
      if (mounted) setLoading(false);
    }
    fetchMovie();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div className="movie-detail"><Loader /></div>;
  if (!movie) return <div className="movie-detail"><p>Movie not found</p></div>;

  const rating = movie.vote_average?.toFixed(1);
  const year = movie.release_date?.split('-')[0];
  const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : null;
  const cast = movie.credits?.cast?.slice(0, 10) || [];
  const similar = movie.similar?.results?.slice(0, 8) || movie.recommendations?.results?.slice(0, 8) || [];
  const languages = movie.spoken_languages?.map(l => l.english_name).join(', ') || 'N/A';

  return (
    <div className="movie-detail" id="movie-detail-page">
      {/* Backdrop */}
      <div className="movie-detail__backdrop">
        {movie.backdrop_path ? (
          <img className="movie-detail__backdrop-img" src={getBackdropUrl(movie.backdrop_path)} alt="" />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--bg-elevated)' }} />
        )}
        <div className="movie-detail__backdrop-gradient" />
      </div>

      {/* Info */}
      <div className="movie-detail__info">
        {movie.poster_path && (
          <img className="movie-detail__poster" src={getPosterUrl(movie.poster_path)} alt={movie.title} />
        )}
        <div className="movie-detail__meta">
          <h1 className="movie-detail__title">{movie.title}</h1>
          {movie.tagline && <p className="movie-detail__tagline">"{movie.tagline}"</p>}

          <div className="movie-detail__stats">
            {rating > 0 && (
              <span className="movie-detail__stat">
                <IoStar color="#ffc107" /> <span className="movie-detail__stat-highlight">{rating}</span>/10
              </span>
            )}
            {year && <span className="movie-detail__stat"><IoCalendar /> {year}</span>}
            {runtime && <span className="movie-detail__stat"><IoTime /> {runtime}</span>}
            <span className="movie-detail__stat" title={`Available in: ${languages}`}>
              <IoGlobe /> {movie.original_language?.toUpperCase()}
              <span className="movie-detail__lang-tag">({languages})</span>
            </span>
          </div>

          <div className="movie-detail__genres">
            {movie.genres?.map(g => (
              <span key={g.id} className="movie-detail__genre">{g.name}</span>
            ))}
          </div>

          {movie.overview && <p className="movie-detail__overview">{movie.overview}</p>}

          <div className="movie-detail__actions">
            <button className="movie-detail__watch-btn" onClick={() => setShowPlayer(true)} id="watch-movie-btn">
              <IoPlay size={20} /> Watch Now
            </button>

            {showPlayer && (
              <div className="movie-detail__server-select">
                <span className="server-label">Change Server:</span>
                <button 
                  className={`server-btn ${activeServer === 'vidlink' ? 'active' : ''}`}
                  onClick={() => setActiveServer('vidlink')}
                >Server 1</button>
                <button 
                  className={`server-btn ${activeServer === 'vidsrc_icu' ? 'active' : ''}`}
                  onClick={() => setActiveServer('vidsrc_icu')}
                >Server 2</button>
                <button 
                  className={`server-btn ${activeServer === 'embed_su' ? 'active' : ''}`}
                  onClick={() => setActiveServer('embed_su')}
                >Server 3</button>
                <button 
                  className={`server-btn ${activeServer === 'multiembed' ? 'active' : ''}`}
                  onClick={() => setActiveServer('multiembed')}
                >Server 4</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Player */}
      {showPlayer && (
        <div className="movie-detail__player" id="movie-player">
          <div className="player-header">
            <p>Playing from {activeServer === 'vidlink' ? 'Server 1 (VidLink)' : activeServer === 'vidsrc_icu' ? 'Server 2 (VidSrc)' : activeServer === 'embed_su' ? 'Server 3 (EmbedSU)' : 'Server 4 (MultiEmbed)'}. If Tamil not working, switch server.</p>
          </div>
          <iframe
            key={`${movie.id}-${activeServer}`}
            src={getMovieEmbedUrl(movie.id, activeServer)}
            title={movie.title}
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture; web-share"
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        </div>
      )}

      {/* Cast */}
      {cast.length > 0 && (
        <div className="movie-detail__section">
          <h3 className="movie-detail__section-title">Cast</h3>
          <div className="movie-detail__cast-grid">
            {cast.map((person) => (
              <div key={person.id} className="movie-detail__cast-card">
                {person.profile_path ? (
                  <img className="movie-detail__cast-img" src={getPosterUrl(person.profile_path, 'w185')} alt={person.name} />
                ) : (
                  <div className="movie-detail__cast-img" style={{ background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'var(--text-subdued)' }}>👤</div>
                )}
                <div className="movie-detail__cast-name">{person.name}</div>
                <div className="movie-detail__cast-role">{person.character}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Similar Movies */}
      {similar.length > 0 && (
        <div className="movie-detail__section">
          <h3 className="movie-detail__section-title">Similar Movies</h3>
          <div className="movie-detail__similar-grid">
            {similar.map((m, i) => (
              <MovieCard key={m.id} item={m} style={{ animationDelay: `${i * 50}ms` }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
