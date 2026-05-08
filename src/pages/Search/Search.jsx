import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { globalSearch, searchSongs, searchAlbums, searchArtists, searchPlaylists } from '../../api/saavn';
import { db } from '../../firebase';
import { collection, query as firestoreQuery, getDocs, orderBy, startAt, endAt } from 'firebase/firestore';
import { usePlayer } from '../../context/PlayerContext';
import SearchBar from '../../components/SearchBar/SearchBar';
import FilterTabs from '../../components/FilterTabs/FilterTabs';
import TopResultCard from '../../components/TopResultCard/TopResultCard';
import ArtistCard from '../../components/ArtistCard/ArtistCard';
import AlbumCard from '../../components/AlbumCard/AlbumCard';
import PlaylistCard from '../../components/PlaylistCard/PlaylistCard';
import SongRow from '../../components/SongRow/SongRow';
import RecentSearches from '../../components/RecentSearches/RecentSearches';
import SectionHeader from '../../components/SectionHeader/SectionHeader';
import Loader from '../../components/Loader/Loader';
import { IoSearch, IoMusicalNotesOutline } from 'react-icons/io5';
import { debounce, getHighQualityImage, decodeHTML } from '../../utils/helpers';
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} from '../../utils/recentSearches';
import './Search.css';

/* ── Genre Browse Cards ── */
const GENRES = [
  { name: 'Tamil Hits', query: 'tamil hits 2026', color: 'linear-gradient(135deg, #e91e63, #9c27b0)', emoji: '🎵' },
  { name: 'Bollywood', query: 'bollywood hits', color: 'linear-gradient(135deg, #ff9800, #f44336)', emoji: '🎬' },
  { name: 'Hip Hop', query: 'hip hop tamil', color: 'linear-gradient(135deg, #607d8b, #263238)', emoji: '🎤' },
  { name: 'Romantic', query: 'romantic love songs tamil', color: 'linear-gradient(135deg, #e91e63, #ff5252)', emoji: '❤️' },
  { name: 'Devotional', query: 'devotional songs tamil', color: 'linear-gradient(135deg, #ff6f00, #ffd600)', emoji: '🙏' },
  { name: 'Chill Vibes', query: 'chill vibes lofi', color: 'linear-gradient(135deg, #00bcd4, #009688)', emoji: '🌊' },
  { name: 'Party', query: 'party dance kuthu songs', color: 'linear-gradient(135deg, #7c4dff, #448aff)', emoji: '🎉' },
  { name: 'Classical', query: 'carnatic classical', color: 'linear-gradient(135deg, #795548, #4e342e)', emoji: '🎻' },
  { name: 'Melody', query: 'melody hits tamil', color: 'linear-gradient(135deg, #1de9b6, #00bfa5)', emoji: '💕' },
  { name: 'Rock', query: 'rock music english', color: 'linear-gradient(135deg, #d32f2f, #b71c1c)', emoji: '🎸' },
  { name: 'Telugu', query: 'telugu hit songs', color: 'linear-gradient(135deg, #4caf50, #2e7d32)', emoji: '🌟' },
  { name: 'Punjabi', query: 'punjabi hits 2025', color: 'linear-gradient(135deg, #ff7043, #d84315)', emoji: '🔥' },
  { name: '90s Hits', query: 'tamil 90s songs', color: 'linear-gradient(135deg, #ab47bc, #7b1fa2)', emoji: '📻' },
  { name: 'Workout', query: 'workout motivational songs', color: 'linear-gradient(135deg, #f57c00, #e65100)', emoji: '💪' },
  { name: 'Sleep', query: 'sleep calm music', color: 'linear-gradient(135deg, #1a237e, #283593)', emoji: '🌙' },
  { name: 'Indie', query: 'indie tamil music', color: 'linear-gradient(135deg, #00897b, #004d40)', emoji: '🎧' },
];

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [recentSearchList, setRecentSearchList] = useState(getRecentSearches());
  const { playSong } = usePlayer();

  /* ── Debounced Search ── */
  const performSearch = useCallback(
    debounce(async (q) => {
      if (!q || q.trim().length < 2) {
        setResults(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [global, songs] = await Promise.all([
          globalSearch(q),
          searchSongs(q, 30),
        ]);

        setResults({
          topQuery: global?.topQuery?.results?.[0] || null,
          songs: songs?.results || [],
          albums: global?.albums?.results || [],
          artists: global?.artists?.results || [],
          playlists: global?.playlists?.results || [],
          users: [], // Populate below
        });

        // Search Firebase Users
        try {
          const usersRef = collection(db, 'users');
          const qLower = q.toLowerCase();
          const usersSnap = await getDocs(usersRef);
          const matchedUsers = [];
          usersSnap.forEach(doc => {
            const data = doc.data();
            if (data.name?.toLowerCase().includes(qLower) || data.email?.toLowerCase().includes(qLower)) {
              matchedUsers.push({ id: doc.id, ...data });
            }
          });
          setResults(prev => ({ ...prev, users: matchedUsers }));
        } catch (fbErr) {
          console.error('Firebase search error:', fbErr);
        }

        // Save to recent searches on successful search
        addRecentSearch(q);
        setRecentSearchList(getRecentSearches());
      } catch (err) {
        console.error('Search error:', err);
      }
      setLoading(false);
    }, 400),
    []
  );

  useEffect(() => {
    performSearch(query);
  }, [query, performSearch]);

  /* ── Tab change loads more data for that specific type ── */
  const handleTabChange = useCallback(async (tab) => {
    setActiveTab(tab);
    if (!query || query.trim().length < 2) return;

    // If switching to a specific tab, load more results for that type
    if (tab === 'albums' && (!results?.albums || results.albums.length < 5)) {
      const data = await searchAlbums(query, 30);
      setResults(prev => ({ ...prev, albums: data?.results || prev?.albums || [] }));
    }
    if (tab === 'artists' && (!results?.artists || results.artists.length < 5)) {
      const data = await searchArtists(query, 30);
      setResults(prev => ({ ...prev, artists: data?.results || prev?.artists || [] }));
    }
    if (tab === 'playlists' && (!results?.playlists || results.playlists.length < 5)) {
      const data = await searchPlaylists(query, 30);
      setResults(prev => ({ ...prev, playlists: data?.results || prev?.playlists || [] }));
    }
  }, [query, results]);

  /* ── Recent Search Handlers ── */
  const handleRecentSelect = (q) => {
    setQuery(q);
    setActiveTab('all');
  };

  const handleRecentRemove = (q) => {
    removeRecentSearch(q);
    setRecentSearchList(getRecentSearches());
  };

  const handleRecentClear = () => {
    clearRecentSearches();
    setRecentSearchList([]);
  };

  /* ── Genre Click ── */
  const handleGenreClick = (genreQuery) => {
    setQuery(genreQuery);
    setActiveTab('all');
  };

  /* ── Play Helpers ── */
  const handlePlaySong = (song, songList, idx) => {
    playSong(song, songList, idx);
  };

  const handleArtistClick = (artist) => {
    setQuery(decodeHTML(artist.title || artist.name || ''));
    setActiveTab('songs');
  };

  const handleAlbumClick = (album) => {
    navigate(`/album/${album.id}`);
  };

  const handlePlaylistClick = (playlist) => {
    navigate(`/playlist/${playlist.id}`);
  };

  /* ── Computed ── */
  const topResult = results?.topQuery;
  const hasResults = results && (
    results.songs.length > 0 ||
    results.albums.length > 0 ||
    results.artists.length > 0 ||
    results.playlists.length > 0 ||
    results.users.length > 0
  );

  return (
    <div className="search-page" id="search-page">
      {/* Search Bar */}
      <div className="search-page__bar">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="What do you want to listen to?"
        />
      </div>

      {/* ── No query: Browse mode ── */}
      {!query && (
        <>
          {/* Recent Searches */}
          <RecentSearches
            searches={recentSearchList}
            onSelect={handleRecentSelect}
            onRemove={handleRecentRemove}
            onClear={handleRecentClear}
          />

          {/* Genre Browse */}
          <h2 className="search-page__browse-title">Browse All</h2>
          <div className="search-page__genres" id="genre-grid">
            {GENRES.map((genre) => (
              <div
                key={genre.name}
                className="search-page__genre-card"
                style={{ background: genre.color }}
                onClick={() => handleGenreClick(genre.query)}
                id={`genre-${genre.name.toLowerCase().replace(/\s/g, '-')}`}
              >
                <span className="search-page__genre-emoji">{genre.emoji}</span>
                <span className="search-page__genre-name">{genre.name}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Loading */}
      {loading && <Loader />}

      {/* ── Results ── */}
      {results && !loading && (
        <div className="search-page__results" id="search-results">
          {/* Filter Tabs */}
          <FilterTabs activeTab={activeTab} onTabChange={handleTabChange} />

          {/* ════════════════ ALL TAB ════════════════ */}
          {activeTab === 'all' && hasResults && (
            <>
              {/* Top Result + Songs Row (side by side on desktop) */}
              <div className="search-page__top-section">
                {/* Top Result */}
                {topResult && (
                  <div className="search-page__top-result-col">
                    <SectionHeader title="Top Result" />
                    <TopResultCard
                      item={topResult}
                      onClick={() => {
                        if (topResult.type === 'album') {
                          handleAlbumClick(topResult);
                        } else if (topResult.type === 'artist') {
                          handleArtistClick(topResult);
                        } else if (topResult.type === 'playlist') {
                          handlePlaylistClick(topResult);
                        } else if (results.songs[0]) {
                          handlePlaySong(results.songs[0], results.songs, 0);
                        }
                      }}
                    />
                  </div>
                )}

                {/* Songs List (top 4) */}
                {results.songs.length > 0 && (
                  <div className="search-page__songs-col">
                    <SectionHeader title="Songs" />
                    <div className="search-page__song-list">
                      {results.songs.slice(0, 4).map((song, i) => (
                        <SongRow
                          key={`${song.id}-${i}`}
                          song={song}
                          index={i}
                          queue={results.songs}
                          showAlbum={false}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Artists Section — Horizontal Scroll */}
              {results.artists.length > 0 && (
                <div className="search-page__section">
                  <SectionHeader title="Artists" />
                  <div className="search-page__horizontal-scroll">
                    {results.artists.slice(0, 8).map((artist, i) => (
                      <ArtistCard
                        key={artist.id}
                        artist={artist}
                        onClick={handleArtistClick}
                        style={{ animationDelay: `${i * 50}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Albums Section — Horizontal Scroll */}
              {results.albums.length > 0 && (
                <div className="search-page__section">
                  <SectionHeader title="Albums" />
                  <div className="search-page__horizontal-scroll">
                    {results.albums.slice(0, 8).map((album, i) => (
                      <AlbumCard
                        key={album.id}
                        album={album}
                        onClick={handleAlbumClick}
                        style={{ animationDelay: `${i * 50}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Playlists Section — Horizontal Scroll */}
              {results.playlists.length > 0 && (
                <div className="search-page__section">
                  <SectionHeader title="Playlists" />
                  <div className="search-page__horizontal-scroll">
                    {results.playlists.slice(0, 8).map((pl, i) => (
                      <PlaylistCard
                        key={`${pl.id}-${i}`}
                        playlist={pl}
                        onClick={handlePlaylistClick}
                        style={{ animationDelay: `${i * 50}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* More Songs — Below fold */}
              {results.songs.length > 4 && (
                <div className="search-page__section">
                  <SectionHeader title="More Songs" />
                  <div className="search-page__song-list">
                    {results.songs.slice(4, 20).map((song, i) => (
                      <SongRow
                        key={`${song.id}-${i + 4}`}
                        song={song}
                        index={i + 4}
                        queue={results.songs}
                        showAlbum={true}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ════════════════ SONGS TAB ════════════════ */}
          {activeTab === 'songs' && (
            <div className="search-page__section">
              {results.songs.length > 0 ? (
                <div className="search-page__song-list">
                  {results.songs.map((song, i) => (
                    <SongRow
                      key={`${song.id}-${i}`}
                      song={song}
                      index={i}
                      queue={results.songs}
                      showAlbum={true}
                    />
                  ))}
                </div>
              ) : (
                <NoResults type="songs" />
              )}
            </div>
          )}

          {/* ════════════════ ARTISTS TAB ════════════════ */}
          {activeTab === 'artists' && (
            <div className="search-page__section">
              {results.artists.length > 0 ? (
                <div className="search-page__card-grid search-page__card-grid--artists">
                  {results.artists.map((artist, i) => (
                    <ArtistCard
                      key={`${artist.id}-${i}`}
                      artist={artist}
                      onClick={handleArtistClick}
                      style={{ animationDelay: `${i * 50}ms` }}
                    />
                  ))}
                </div>
              ) : (
                <NoResults type="artists" />
              )}
            </div>
          )}

          {/* ════════════════ ALBUMS TAB ════════════════ */}
          {activeTab === 'albums' && (
            <div className="search-page__section">
              {results.albums.length > 0 ? (
                <div className="search-page__card-grid">
                  {results.albums.map((album, i) => (
                    <AlbumCard
                      key={`${album.id}-${i}`}
                      album={album}
                      onClick={handleAlbumClick}
                      style={{ animationDelay: `${i * 50}ms` }}
                    />
                  ))}
                </div>
              ) : (
                <NoResults type="albums" />
              )}
            </div>
          )}

          {/* ════════════════ PLAYLISTS TAB ════════════════ */}
          {activeTab === 'playlists' && (
            <div className="search-page__section">
              {results.playlists.length > 0 ? (
                <div className="search-page__card-grid">
                  {results.playlists.map((pl, i) => (
                    <PlaylistCard
                      key={`${pl.id}-${i}`}
                      playlist={pl}
                      onClick={handlePlaylistClick}
                      style={{ animationDelay: `${i * 50}ms` }}
                    />
                  ))}
                </div>
              ) : (
                <NoResults type="playlists" />
              )}
            </div>
          )}

          {/* ════════════════ USERS TAB ════════════════ */}
          {activeTab === 'users' && (
            <div className="search-page__section">
              {results.users && results.users.length > 0 ? (
                <div className="search-page__card-grid search-page__card-grid--users">
                  {results.users.map((user, i) => (
                    <div 
                      key={user.id} 
                      className="search-user-card"
                      onClick={() => navigate(`/user/${user.id}`)}
                    >
                      <img src={user.avatar} alt={user.name} />
                      <div className="search-user-info">
                        <h4>{user.name}</h4>
                        <p>{user.email}</p>
                      </div>
                      <button className="search-user-follow">View</button>
                    </div>
                  ))}
                </div>
              ) : (
                <NoResults type="users" />
              )}
            </div>
          )}

          {/* No results at all */}
          {!hasResults && (
            <NoResults type="results" />
          )}
        </div>
      )}
    </div>
  );
}

/* ── No Results Component ── */
function NoResults({ type }) {
  return (
    <div className="search-page__no-results">
      <div className="search-page__no-results-icon">
        <IoMusicalNotesOutline />
      </div>
      <div className="search-page__no-results-text">
        No {type} found
      </div>
      <div className="search-page__no-results-hint">
        Try different keywords or check spelling
      </div>
    </div>
  );
}
