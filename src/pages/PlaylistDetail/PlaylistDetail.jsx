import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPlaylistById } from '../../api/saavn';
import { usePlayer } from '../../context/PlayerContext';
import { getHighQualityImage, decodeHTML } from '../../utils/helpers';
import SongRow from '../../components/SongRow/SongRow';
import Loader from '../../components/Loader/Loader';
import { IoArrowBack, IoPlay, IoTimeOutline, IoMusicalNotes } from 'react-icons/io5';
import '../AlbumDetail/AlbumDetail.css'; // Reusing AlbumDetail styles since the layout is identical

export default function PlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playSong } = usePlayer();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlaylist() {
      setLoading(true);
      try {
        const data = await getPlaylistById(id);
        setPlaylist(data);
      } catch (err) {
        console.error('Failed to fetch playlist:', err);
      }
      setLoading(false);
    }
    fetchPlaylist();
  }, [id]);

  if (loading) return <div className="album-detail-page"><Loader /></div>;
  if (!playlist) return <div className="album-detail-page"><p>Playlist not found</p></div>;

  const songs = playlist.songs || [];
  const artwork = getHighQualityImage(playlist.image);
  const title = decodeHTML(playlist.name || playlist.title);
  const subtitle = playlist.subtitle || playlist.fanCount ? `${playlist.fanCount} Fans` : 'Curated Playlist';

  const handlePlayAll = () => {
    if (songs.length > 0) {
      playSong(songs[0], songs, 0);
    }
  };

  return (
    <div className="album-detail-page" id="playlist-detail">
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
            <span className="album-detail__type">PLAYLIST</span>
            <h1 className="album-detail__title">{title}</h1>
            <div className="album-detail__artist-row">
              <span className="album-detail__artist-name">{subtitle}</span>
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
              showAlbum={true}
            />
          ))
        ) : (
          <div className="album-detail__empty">
            <IoMusicalNotes size={48} />
            <p>No songs found in this playlist</p>
          </div>
        )}
      </div>
    </div>
  );
}
