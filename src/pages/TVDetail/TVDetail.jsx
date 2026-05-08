import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { IoPlay, IoStar, IoCalendar, IoGlobe } from 'react-icons/io5';
import { getTVDetails, getTVSeasonDetails, getBackdropUrl, getPosterUrl, getTvEmbedUrl } from '../../api/tmdb';
import MovieCard from '../../components/MovieCard/MovieCard';
import Loader from '../../components/Loader/Loader';
import '../MovieDetail/MovieDetail.css';

export default function TVDetail() {
  const { id } = useParams();
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [activeServer, setActiveServer] = useState('vidlink');

  useEffect(() => {
    let mounted = true;
    async function fetchShow() {
      setLoading(true);
      setShowPlayer(false);
      try {
        const data = await getTVDetails(id);
        if (mounted) {
          setShow(data);
          if (data.seasons?.length > 0) {
            const firstSeason = data.seasons.find(s => s.season_number > 0) || data.seasons[0];
            setSelectedSeason(firstSeason.season_number);
          }
        }
      } catch (err) { console.error('Failed to fetch TV show:', err); }
      if (mounted) setLoading(false);
    }
    fetchShow();
    return () => { mounted = false; };
  }, [id]);

  useEffect(() => {
    if (!show || !selectedSeason) return;
    let mounted = true;
    async function fetchEpisodes() {
      try {
        const data = await getTVSeasonDetails(id, selectedSeason);
        if (mounted) setEpisodes(data?.episodes || []);
      } catch (err) { console.error('Failed to fetch episodes:', err); }
    }
    fetchEpisodes();
    return () => { mounted = false; };
  }, [id, selectedSeason, show]);

  if (loading) return <div className="movie-detail"><Loader /></div>;
  if (!show) return <div className="movie-detail"><p>Show not found</p></div>;

  const rating = show.vote_average?.toFixed(1);
  const year = show.first_air_date?.split('-')[0];
  const seasons = show.seasons?.filter(s => s.season_number > 0) || [];
  const similar = show.similar?.results?.slice(0, 8) || [];
  const languages = show.spoken_languages?.map(l => l.english_name).join(', ') || 'N/A';

  return (
    <div className="movie-detail" id="tv-detail-page">
      <div className="movie-detail__backdrop">
        {show.backdrop_path ? (
          <img className="movie-detail__backdrop-img" src={getBackdropUrl(show.backdrop_path)} alt="" />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--bg-elevated)' }} />
        )}
        <div className="movie-detail__backdrop-gradient" />
      </div>

      <div className="movie-detail__info">
        {show.poster_path && (
          <img className="movie-detail__poster" src={getPosterUrl(show.poster_path)} alt={show.name} />
        )}
        <div className="movie-detail__meta">
          <h1 className="movie-detail__title">{show.name}</h1>
          {show.tagline && <p className="movie-detail__tagline">"{show.tagline}"</p>}
          <div className="movie-detail__stats">
            {rating > 0 && <span className="movie-detail__stat"><IoStar color="#ffc107" /> <span className="movie-detail__stat-highlight">{rating}</span>/10</span>}
            {year && <span className="movie-detail__stat"><IoCalendar /> {year}</span>}
            <span className="movie-detail__stat">{seasons.length} Season{seasons.length !== 1 ? 's' : ''}</span>
            <span className="movie-detail__stat">
              <IoGlobe /> {show.original_language?.toUpperCase()}
              <span className="movie-detail__lang-tag">({languages})</span>
            </span>
          </div>
          <div className="movie-detail__genres">
            {show.genres?.map(g => <span key={g.id} className="movie-detail__genre">{g.name}</span>)}
          </div>
          {show.overview && <p className="movie-detail__overview">{show.overview}</p>}
          
          <div className="movie-detail__actions">
            <button className="movie-detail__watch-btn" onClick={() => setShowPlayer(true)} id="watch-tv-btn">
              <IoPlay size={20} /> Watch S{selectedSeason} E{selectedEpisode}
            </button>

            {showPlayer && (
              <div className="movie-detail__server-select">
                <span className="server-label">Change Server:</span>
                <button 
                  className={`server-btn ${activeServer === 'vidlink' ? 'active' : ''}`}
                  onClick={() => setActiveServer('vidlink')}
                >Server 1</button>
                <button 
                  className={`server-btn ${activeServer === 'vidsrc_me' ? 'active' : ''}`}
                  onClick={() => setActiveServer('vidsrc_me')}
                >Server 2</button>
                <button 
                  className={`server-btn ${activeServer === 'superembed' ? 'active' : ''}`}
                  onClick={() => setActiveServer('superembed')}
                >Server 3</button>
                <button 
                  className={`server-btn ${activeServer === 'autoembed' ? 'active' : ''}`}
                  onClick={() => setActiveServer('autoembed')}
                >Server 4</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPlayer && (
        <div className="movie-detail__player" id="tv-player">
          <div className="player-header">
            <p>Playing S{selectedSeason} E{selectedEpisode} from {activeServer === 'vidlink' ? 'Server 1 (VidLink)' : activeServer === 'vidsrc_icu' ? 'Server 2 (VidSrc)' : activeServer === 'embed_su' ? 'Server 3 (EmbedSU)' : 'Server 4 (MultiEmbed)'}. If Tamil not working, switch server.</p>
          </div>
          <iframe 
            src={getTvEmbedUrl(show.id, selectedSeason, selectedEpisode, activeServer)} 
            title={show.name} 
            allowFullScreen 
            allow="autoplay; encrypted-media" 
            referrerPolicy="origin"
          />
        </div>
      )}

      {/* Season & Episode Selector */}
      {seasons.length > 0 && (
        <div className="movie-detail__section">
          <h3 className="movie-detail__section-title">Seasons & Episodes</h3>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {seasons.map(s => (
              <button key={s.season_number} onClick={() => { setSelectedSeason(s.season_number); setSelectedEpisode(1); }}
                style={{
                  padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                  background: selectedSeason === s.season_number ? 'var(--brand-movie)' : 'var(--glass-bg)',
                  color: selectedSeason === s.season_number ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--glass-border)', transition: 'all 0.2s',
                }}>
                S{s.season_number}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {episodes.map(ep => (
              <button key={ep.episode_number} onClick={() => { setSelectedEpisode(ep.episode_number); setShowPlayer(true); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px',
                  borderRadius: 10, background: selectedEpisode === ep.episode_number ? 'var(--glass-bg-hover)' : 'transparent',
                  border: '1px solid transparent', textAlign: 'left', transition: 'all 0.2s',
                }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-subdued)', minWidth: 28 }}>E{ep.episode_number}</span>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ep.name}</div>
                  {ep.runtime && <span style={{ fontSize: 11, color: 'var(--text-subdued)' }}>{ep.runtime}m</span>}
                </div>
                <IoPlay size={16} style={{ color: 'var(--brand-movie)', opacity: 0.7 }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {similar.length > 0 && (
        <div className="movie-detail__section">
          <h3 className="movie-detail__section-title">Similar Shows</h3>
          <div className="movie-detail__similar-grid">
            {similar.map((m, i) => <MovieCard key={m.id} item={m} type="tv" style={{ animationDelay: `${i * 50}ms` }} />)}
          </div>
        </div>
      )}
    </div>
  );
}
