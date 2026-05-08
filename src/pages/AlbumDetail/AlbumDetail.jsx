import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAlbumById } from '../../api/saavn';
import { usePlayer } from '../../context/PlayerContext';
import { getHighQualityImage, decodeHTML } from '../../utils/helpers';
import SongRow from '../../components/SongRow/SongRow';
import Loader from '../../components/Loader/Loader';
import { IoArrowBack, IoPlay, IoTimeOutline, IoMusicalNotes } from 'react-icons/io5';
import './AlbumDetail.css';

export default function AlbumDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayer();
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    async function fetchAlbum() {
      setLoading(true);
      try {
        const data = await getAlbumById(id);
        setAlbum(data);
      } catch (err) {
        console.error('Failed to fetch album:', err);
      }
      setLoading(false);
    }
    fetchAlbum();
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [id]);

  if (loading) return <div className="album-detail-page"><Loader /></div>;
  if (!album) return <div className="album-detail-page"><p>Album not found</p></div>;

  const songs = album.songs || [];
  const artwork = getHighQualityImage(album.image);
  const title = decodeHTML(album.name || album.title);
  const artist = album.primaryArtists || album.artist || 'Various Artists';
  const year = album.year || '';

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs, 0);
    }
  };

  return (
    <div className="album-detail-page" id="album-detail">
      {/* Dynamic Background */}
      <div className="album-detail__bg" style={{ backgroundImage: `url(${artwork})` }} />
      <div className="album-detail__overlay" />

      {/* Sticky Header */}
      <div className={`album-detail__sticky-header ${isScrolled ? 'visible' : ''}`}>
        <button className="album-detail__back-small" onClick={() => navigate(-1)}>
          <IoArrowBack size={20} />
        </button>
        <span className="album-detail__sticky-title">{title}</span>
        {songs.length > 0 && (
          <button className="album-detail__play-small" onClick={handlePlayAll}>
            <IoPlay size={20} />
          </button>
        )}
      </div>

      {/* Header / Banner */}
      <div className="album-detail__header">
        <button className="album-detail__back" onClick={() => navigate(-1)}>
          <IoArrowBack size={24} />
        </button>
        
        <div className="album-detail__info">
          <div className="album-detail__artwork-wrap">
            <img src={artwork} alt={title} className="album-detail__artwork" />
          </div>
          <div className="album-detail__meta">
            <span className="album-detail__type">ALBUM</span>
            <h1 className="album-detail__title">{title}</h1>
            <div className="album-detail__artist-row">
              <img src={artwork} className="album-detail__mini-artist-img" alt="" />
              <span className="album-detail__artist-name">{artist}</span>
              {year && <span className="album-detail__dot">•</span>}
              {year && <span className="album-detail__year">{year}</span>}
              <span className="album-detail__dot">•</span>
              <span className="album-detail__count">{songs.length} songs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="album-detail__actions">
        <button className="album-detail__play-btn" onClick={handlePlayAll}>
          <IoPlay size={24} />
        </button>
      </div>

      {/* List Header */}
      <div className="album-detail__list-header">
        <div className="col-idx">#</div>
        <div className="col-title">Title</div>
        <div className="col-album">Album</div>
        <div className="col-time"><IoTimeOutline size={18} /></div>
      </div>

      {/* Songs List */}
      <div className="album-detail__songs">
        {songs.length > 0 ? (
          songs.map((song, i) => (
            <SongRow 
              key={song.id} 
              song={song} 
              index={i} 
              queue={songs} 
              showAlbum={false}
            />
          ))
        ) : (
          <div className="album-detail__empty">
            <IoMusicalNotes size={48} />
            <p>No songs found in this album</p>
          </div>
        )}
      </div>
    </div>
  );
}
