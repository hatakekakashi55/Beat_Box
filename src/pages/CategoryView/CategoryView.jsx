import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { searchSongs, searchAlbums } from '../../api/saavn';
import { usePlayer } from '../../context/PlayerContext';
import SongRow from '../../components/SongRow/SongRow';
import AlbumCard from '../../components/AlbumCard/AlbumCard';
import Loader from '../../components/Loader/Loader';
import { filterByLanguage } from '../../utils/userTaste';
import { getHighQualityImage } from '../../utils/helpers';
import { IoPlay, IoShuffle, IoGrid, IoList } from 'react-icons/io5';
import './CategoryView.css';

export default function CategoryView() {
  const { query } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const title = location.state?.title || decodeURIComponent(query);
  const sortBy = location.state?.sortBy || null;
  // If navigated from an album section, show albums instead of songs
  const useAlbums = location.state?.useAlbums || false;

  const [songs, setSongs] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState(useAlbums ? 'albums' : 'songs');
  const { playSong } = usePlayer();

  useEffect(() => {
    let mounted = true;
    setSongs([]);
    setAlbums([]);
    setPage(1);
    setLoading(true);

    async function load() {
      try {
        if (viewMode === 'albums') {
          const data = await searchAlbums(decodeURIComponent(query), 40);
          if (mounted && data?.results) {
            setAlbums(data.results);
          }
        } else {
          const data = await searchSongs(decodeURIComponent(query), 50, 1, sortBy);
          if (mounted && data?.results) {
            const filtered = filterByLanguage(data.results);
            setSongs(filtered);
          }
        }
      } catch (err) {
        console.error('Failed to load category:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [query, viewMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load more songs (pagination — only in songs mode)
  useEffect(() => {
    if (page === 1) return;
    let mounted = true;
    async function loadMore() {
      try {
        const data = await searchSongs(decodeURIComponent(query), 50, page, sortBy);
        if (mounted && data?.results) {
          const filtered = filterByLanguage(data.results);
          setSongs(prev => [...prev, ...filtered]);
        }
      } catch {}
    }
    loadMore();
    return () => { mounted = false; };
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlayAll = () => {
    if (songs.length > 0) playSong(songs[0], songs, 0);
  };

  const handleShufflePlay = () => {
    if (songs.length > 0) {
      const shuffled = [...songs].sort(() => Math.random() - 0.5);
      playSong(shuffled[0], shuffled, 0);
    }
  };

  if (loading && songs.length === 0 && albums.length === 0) return <Loader />;

  const bannerImage = viewMode === 'albums' 
    ? (albums[0]?.image ? getHighQualityImage(albums[0].image) : '/placeholder.jpg')
    : (songs[0]?.image ? getHighQualityImage(songs[0].image) : '/placeholder.jpg');

  return (
    <div className="category-view animate-fade-in">
      <div className="category-view__header">
        <div
          className="category-view__header-bg"
          style={{ backgroundImage: `url(${bannerImage})` }}
        />
        <div className="category-view__header-content">
          <img className="category-view__cover" src={bannerImage} alt={title} />
          <div className="category-view__info">
            <span className="category-view__badge">{viewMode === 'albums' ? 'Albums' : 'Playlist'}</span>
            <h1 className="category-view__title">{title}</h1>
            <p className="category-view__desc">
              {viewMode === 'albums'
                ? `${albums.length} albums found`
                : `Tune into the hottest tracks! Over ${songs.length} songs.`}
            </p>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="category-view__actions">
        {viewMode === 'songs' && (
          <>
            <button className="category-view__play-btn" onClick={handlePlayAll}><IoPlay /></button>
            <button className="category-view__shuffle-btn" onClick={handleShufflePlay}><IoShuffle /></button>
          </>
        )}
        {/* Toggle: Albums ↔ Songs */}
        <div className="category-view__toggle">
          <button
            className={`category-view__toggle-btn${viewMode === 'albums' ? ' active' : ''}`}
            onClick={() => setViewMode('albums')}
          >
            <IoGrid size={14} /> Albums
          </button>
          <button
            className={`category-view__toggle-btn${viewMode === 'songs' ? ' active' : ''}`}
            onClick={() => setViewMode('songs')}
          >
            <IoList size={14} /> Songs
          </button>
        </div>
      </div>

      {/* Albums grid */}
      {viewMode === 'albums' && (
        <div className="category-view__albums-grid">
          {albums.map((album, i) => (
            <AlbumCard
              key={`${album.id}-${i}`}
              album={album}
              onClick={(a) => navigate(`/album/${a.id}`)}
            />
          ))}
          {albums.length === 0 && !loading && (
            <p style={{ color: 'rgba(255,255,255,0.5)', padding: '32px 0' }}>No albums found.</p>
          )}
        </div>
      )}

      {/* Songs list */}
      {viewMode === 'songs' && (
        <>
          <div className="category-view__list">
            {songs.map((song, idx) => (
              <SongRow
                key={`${song.id}-${idx}`}
                song={song}
                index={idx}
                queue={songs}
              />
            ))}
          </div>
          <div className="category-view__load-more">
            <button className="glass-btn" onClick={() => setPage(p => p + 1)}>
              Load More Songs
            </button>
          </div>
        </>
      )}
    </div>
  );
}
