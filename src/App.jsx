import React, { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen/SplashScreen';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import Navbar from './components/Navbar/Navbar';
import Player from './components/Player/Player';
import QueuePanel from './components/QueuePanel/QueuePanel';
import MobileTabBar from './components/MobileTabBar/MobileTabBar';

/* Music Pages */
import Home from './pages/Home/Home';
import Search from './pages/Search/Search';
import Library from './pages/Library/Library';
import LikedSongs from './pages/LikedSongs/LikedSongs';
import RecentlyPlayed from './pages/RecentlyPlayed/RecentlyPlayed';
import CategoryView from './pages/CategoryView/CategoryView';
import Cuts from './pages/Cuts/Cuts';
import UserProfile from './pages/UserProfile/UserProfile';
import Chat from './pages/Chat/Chat';
import ChatList from './pages/ChatList/ChatList';
import AlbumDetail from './pages/AlbumDetail/AlbumDetail';
import PlaylistDetail from './pages/PlaylistDetail/PlaylistDetail';

/* Movie Pages */
import MoviesHome from './pages/MoviesHome/MoviesHome';
import MovieDetail from './pages/MovieDetail/MovieDetail';
import MovieSearch from './pages/MovieSearch/MovieSearch';
import TVDetail from './pages/TVDetail/TVDetail';
import TVShows from './pages/TVShows/TVShows';
import TrendingMovies from './pages/TrendingMovies/TrendingMovies';
import Login from './pages/Login/Login';
import SettingsModal from './components/SettingsModal/SettingsModal';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

import { usePlayer } from './context/PlayerContext';
import { getHighQualityImage } from './utils/helpers';
import { wakeUpBackend } from './api/saavn';
import './App.css';

function AppContent() {
  const location = useLocation();
  const { currentSong, showQueue, showSettings, toggleSettings, toggleQueue } = usePlayer();
  const [mode, setMode] = useState('music'); // 'music' | 'movies'
  const [showSplash, setShowSplash] = useState(true);

  // ✅ Direct Firebase auth check — PlayerContext-ஐ நம்பாம
  const [firebaseUser, setFirebaseUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user ?? null); // null = not logged in
    });
    return unsubscribe;
  }, []);

  const ambientBg = currentSong
    ? `url(${getHighQualityImage(currentSong.image)})`
    : 'none';

  // Wake up Render backend on initial load
  useEffect(() => {
    wakeUpBackend();
  }, []);

  // 1. Wait for Firebase to check the user session
  if (firebaseUser === undefined) {
    return <SplashScreen onComplete={() => {}} />;
  }

  const hasOnboarded = !!localStorage.getItem('uxbeat_languages');

  // 2. If session check is done and no user (or user hasn't finished onboarding), show Login
  if (!firebaseUser || !hasOnboarded) {
    return <Login />;
  }

  const isCutsPage = location.pathname === '/cuts';

  return (
    <div className="app" id="app">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      {/* Sidebar - Hide on Cuts */}
      {!isCutsPage && <Sidebar mode={mode} setMode={setMode} />}

      {/* Main Area */}
      <div className="app__main-wrapper">
        {/* Content + Queue */}
        <div className="app__content-area">
          <div className="app__main-content" id="main-content" style={{ paddingBottom: isCutsPage ? 0 : undefined }}>
            {/* Ambient Glow */}
            {currentSong && !isCutsPage && (
              <div
                className="app__ambient"
                style={{ backgroundImage: ambientBg, backgroundSize: 'cover', backgroundPosition: 'center' }}
              />
            )}

            {/* Navbar - Hide on Cuts */}
            {!isCutsPage && <Navbar />}

            {/* All Routes */}
            <Routes>
              {/* Music Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/library" element={<Library />} />
              <Route path="/cuts" element={<Cuts />} />
              <Route path="/liked" element={<LikedSongs />} />
              <Route path="/recent" element={<RecentlyPlayed />} />
              <Route path="/category/:query" element={<CategoryView />} />
              <Route path="/album/:id" element={<AlbumDetail />} />
              <Route path="/playlist/:id" element={<PlaylistDetail />} />
              <Route path="/user/:id" element={<UserProfile />} />
              <Route path="/chat/:id" element={<Chat />} />
              <Route path="/chats" element={<ChatList />} />

              {/* Movie Routes */}
              <Route path="/movies" element={<MoviesHome />} />
              <Route path="/movies/search" element={<MovieSearch />} />
              <Route path="/movies/trending" element={<TrendingMovies />} />
              <Route path="/movies/tv" element={<TVShows />} />
              <Route path="/movies/:id" element={<MovieDetail />} />
              <Route path="/movies/tv/:id" element={<TVDetail />} />
            </Routes>
          </div>
        </div>

        {/* Mobile Tab Bar - Hide on Cuts */}
        {!isCutsPage && <MobileTabBar mode={mode} setMode={setMode} />}

        {/* Player Bar */}
        <Player />

        {/* Overlay Modals & Panels at root level to prevent stacking context bugs */}
        {showQueue && <QueuePanel />}
        {showSettings && <SettingsModal onClose={() => toggleSettings()} />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppContent />
  );
}
