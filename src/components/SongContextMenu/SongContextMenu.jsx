import React, { useState } from 'react';
import {
  IoClose,
  IoAddCircleOutline,
  IoShareSocialOutline,
  IoInformationCircleOutline,
  IoHeartOutline,
  IoHeart,
  IoRadioOutline,
  IoListOutline,
  IoPersonOutline,
  IoAlbumsOutline,
} from 'react-icons/io5';
import { usePlayer } from '../../context/PlayerContext';
import { shareSong } from '../../utils/shareSong';
import { decodeHTML, getHighQualityImage, getArtistNames } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';
import './SongContextMenu.css';

export default function SongContextMenu({ song, onClose, onShowDetails }) {
  const navigate = useNavigate();
  const { addToQueue, toggleLike, isLiked, playSong } = usePlayer();
  const [toast, setToast] = useState('');

  if (!song) return null;

  const liked = isLiked(song.id);
  const image = getHighQualityImage(song.image);
  const title = decodeHTML(song.name || song.title || '');
  const artist = getArtistNames(song.artists, song.primaryArtists);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const actions = [
    {
      icon: liked ? <IoHeart /> : <IoHeartOutline />,
      label: liked ? 'Remove from Liked' : 'Like',
      className: liked ? 'liked' : '',
      onClick: () => {
        toggleLike(song);
        showToast(liked ? 'Removed from Liked Songs' : 'Added to Liked Songs');
      },
    },
    {
      icon: <IoAddCircleOutline />,
      label: 'Add to Queue',
      onClick: () => {
        addToQueue(song);
        showToast('Added to queue');
        setTimeout(onClose, 500);
      },
    },
    {
      icon: <IoRadioOutline />,
      label: 'Go to Song Radio',
      onClick: () => {
        // Play this song and let suggestions continue from here
        playSong(song, [song], 0);
        showToast('Starting song radio...');
        setTimeout(onClose, 500);
      },
    },
    {
      icon: <IoAlbumsOutline />,
      label: 'View Album',
      onClick: () => {
        if (song.album?.id) {
          onClose();
          navigate(`/album/${song.album.id}`);
        } else {
          showToast('Album info not available');
        }
      },
    },
    {
      icon: <IoShareSocialOutline />,
      label: 'Share',
      onClick: async () => {
        const result = await shareSong(song);
        if (result === 'copied') showToast('Link copied to clipboard!');
        else if (result) showToast('Shared!');
      },
    },
    {
      icon: <IoInformationCircleOutline />,
      label: 'Song Info',
      onClick: () => {
        onClose();
        onShowDetails?.(song);
      },
    },
  ];

  return (
    <div className="song-context-overlay" onClick={onClose}>
      <div className="song-context" onClick={(e) => e.stopPropagation()}>
        {/* Song Preview */}
        <div className="song-context__preview">
          <img className="song-context__image" src={image} alt={title} />
          <div className="song-context__meta">
            <p className="song-context__title">{title}</p>
            <p className="song-context__artist">{artist}</p>
          </div>
          <button className="song-context__close" onClick={onClose} aria-label="Close">
            <IoClose />
          </button>
        </div>

        {/* Actions */}
        <div className="song-context__actions">
          {actions.map((action, i) => (
            <button
              key={i}
              className={`song-context__action ${action.className || ''}`}
              onClick={action.onClick}
            >
              <span className="song-context__action-icon">{action.icon}</span>
              <span className="song-context__action-label">{action.label}</span>
            </button>
          ))}
        </div>

        {/* Toast */}
        {toast && (
          <div className="song-context__toast">{toast}</div>
        )}
      </div>
    </div>
  );
}
