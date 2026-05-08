import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IoHeart, IoTime, IoMusicalNotes } from 'react-icons/io5';
import { usePlayer } from '../../context/PlayerContext';
import './Library.css';

export default function Library() {
  const navigate = useNavigate();
  const { likedSongs, recentlyPlayed } = usePlayer();

  const libraryItems = [
    {
      id: 'liked',
      name: 'Liked Songs',
      count: `${likedSongs.length} songs`,
      icon: <IoHeart />,
      color: 'linear-gradient(135deg, #7c3aed, #a855f7)',
      path: '/liked',
    },
    {
      id: 'recent',
      name: 'Recently Played',
      count: `${recentlyPlayed.length} songs`,
      icon: <IoTime />,
      color: 'linear-gradient(135deg, #059669, #34d399)',
      path: '/recent',
    },
    {
      id: 'all',
      name: 'All Songs',
      count: 'Browse all music',
      icon: <IoMusicalNotes />,
      color: 'linear-gradient(135deg, #2563eb, #60a5fa)',
      path: '/search',
    },
  ];

  return (
    <div className="library-page" id="library-page">
      <div className="library-page__header">
        <h1 className="library-page__title">Your Library</h1>
        <p className="library-page__subtitle">Your personal music collection</p>
      </div>

      <div className="library-page__cards">
        {libraryItems.map((item) => (
          <button
            key={item.id}
            className="library-card"
            onClick={() => navigate(item.path)}
            id={`library-${item.id}`}
          >
            <div className="library-card__icon" style={{ background: item.color }}>
              {item.icon}
            </div>
            <div className="library-card__info">
              <div className="library-card__name">{item.name}</div>
              <div className="library-card__count">{item.count}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
