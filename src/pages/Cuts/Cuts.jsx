import React, { useState, useEffect, useRef } from 'react';
import { usePlayer } from '../../context/PlayerContext';
import { useNavigate } from 'react-router-dom';
import { searchSongs } from '../../api/saavn';
import { getYouTubeShortUrl } from '../../api/saavn';
import { decodeHTML, getArtistNames } from '../../utils/helpers';
import { 
  IoHeart, 
  IoHeartOutline, 
  IoShareSocial, 
  IoChatbubbleEllipses,
  IoPlay,
  IoMusicalNotes,
  IoArrowBack,
  IoCameraOutline
} from 'react-icons/io5';
import { db } from '../../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './Cuts.css';

function CutItem({ song, isActive }) {
  const [clipId, setClipId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const { toggleLike, isLiked, playSong, userProfile } = usePlayer();
  const liked = isLiked(song?.id);
  const iframeRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!song || !isActive) return;
    let mounted = true;
    
    setLoading(true);
    const songName = decodeHTML(song.name || song.title || '');
    const artistName = getArtistNames(song.artists, song.primaryArtists);

    getYouTubeShortUrl(songName, artistName).then(data => {
      if (mounted) {
        setClipId(data?.videoId);
        setLoading(false);
        setIsPlaying(true);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    return () => { mounted = false; };
  }, [song, isActive]);

  // Handle Play/Pause via YouTube postMessage API
  const togglePlay = (e) => {
    e.stopPropagation();
    if (!iframeRef.current) return;

    const command = isPlaying ? 'pauseVideo' : 'playVideo';
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: command, args: [] }),
      '*'
    );
    setIsPlaying(!isPlaying);
  };

  const handlePostStory = async (e) => {
    e.stopPropagation();
    if (!userProfile) return alert("Login to post stories!");
    if (!clipId) return alert("Video still loading...");

    try {
      await addDoc(collection(db, 'stories'), {
        userId: userProfile.uid,
        userName: userProfile.name,
        userAvatar: userProfile.avatar,
        clipId,
        songName: song.name,
        songImage: song.image?.[1]?.url || song.image?.[0]?.url,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      });
      alert("Added to your story!");
    } catch (err) {
      console.error(err);
      alert("Error posting story.");
    }
  };

  if (!song) return null;

  return (
    <div className="cut-item">
      <div 
        className="cut-bg" 
        style={{ backgroundImage: `url(${song.image?.[2]?.url || song.image?.[0]?.url})` }}
      ></div>
      <div className="cut-bg-overlay"></div>

      {/* Top Header with Back Button */}
      <div className="cut-header-overlay">
        <button className="cut-back-btn" onClick={() => navigate(-1)}>
          <IoArrowBack />
        </button>
        <span className="cut-brand-name">Cuts</span>
      </div>

      {isActive && clipId ? (
        <div className="cut-player-box" onClick={togglePlay}>
          <iframe
            ref={iframeRef}
            className={`cut-iframe ${!isPlaying ? 'paused' : ''}`}
            src={`https://www.youtube-nocookie.com/embed/${clipId}?autoplay=1&mute=0&controls=0&modestbranding=1&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&loop=1&playlist=${clipId}&playsinline=1&enablejsapi=1&origin=${window.location.origin}&vq=hd2160&hd=1`}
            title="Cut"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            frameBorder="0"
          />
          <div className="cut-click-layer"></div>
          
          {!isPlaying && (
            <div className="cut-pause-overlay">
              <IoPlay />
            </div>
          )}
        </div>
      ) : isActive && !loading && !clipId ? (
        <div className="cut-error">
          <p>No video available for this song.</p>
        </div>
      ) : (
        <div className="cut-loading">
          <div className="cut-spinner"></div>
        </div>
      )}

      {/* Social Overlay UI */}
      <div className="cut-overlay-content">
        <div className="cut-bottom-section">
          <div className="cut-song-metadata">
            <div className="cut-user-row">
              <img src={song.image?.[1]?.url || song.image?.[0]?.url} alt="" className="cut-user-avatar" />
              <span className="cut-user-name">BeatBox Official</span>
              <button className="cut-follow-btn">Follow</button>
            </div>
            <h4 className="cut-song-title">{decodeHTML(song.name)}</h4>
            <div className="cut-audio-row">
              <IoMusicalNotes className="music-icon" />
              <div className="marquee">
                <span>{getArtistNames(song.artists, song.primaryArtists)} • {decodeHTML(song.name)}</span>
              </div>
            </div>
          </div>

          <div className="cut-right-actions">
            <div className="cut-action" onClick={handlePostStory}>
              <div className="action-icon-circle story-add">
                <IoCameraOutline />
              </div>
              <span>Story</span>
            </div>

            <div className="cut-action" onClick={(e) => { e.stopPropagation(); toggleLike(song); }}>
              <div className={`action-icon-circle ${liked ? 'liked' : ''}`}>
                {liked ? <IoHeart /> : <IoHeartOutline />}
              </div>
              <span>{liked ? 'Liked' : 'Like'}</span>
            </div>
            
            <div className="cut-action" onClick={(e) => e.stopPropagation()}>
              <div className="action-icon-circle">
                <IoChatbubbleEllipses />
              </div>
              <span>Chat</span>
            </div>

            <div className="cut-action" onClick={(e) => e.stopPropagation()}>
              <div className="action-icon-circle">
                <IoShareSocial />
              </div>
              <span>Share</span>
            </div>

            <div className="cut-action disc-rotation" onClick={(e) => { e.stopPropagation(); playSong(song); }}>
              <img src={song.image?.[0]?.url} alt="" className="cut-spinning-disc" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Cuts() {
  const { recentlyPlayed, likedSongs } = usePlayer();
  const [feed, setFeed] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    async function loadFeed() {
      let baseSongs = [...recentlyPlayed, ...likedSongs];
      if (baseSongs.length < 5) {
        try {
          const res = await searchSongs('tamil latest hits', 50);
          if (res?.results) {
            baseSongs = [...baseSongs, ...res.results];
          }
        } catch (e) {
          console.error(e);
        }
      }

      const unique = [];
      const seen = new Set();
      const shuffled = baseSongs.sort(() => 0.5 - Math.random());
      for (const s of shuffled) {
        if (!seen.has(s.id)) {
          seen.add(s.id);
          unique.push(s);
        }
      }
      setFeed(unique);
    }
    loadFeed();
  }, [recentlyPlayed, likedSongs]);

  const handleScroll = (e) => {
    const container = e.target;
    const itemHeight = container.clientHeight;
    const scrollTop = container.scrollTop;
    const newIndex = Math.round(scrollTop / itemHeight);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  return (
    <div className="cuts-page">
      {feed.length > 0 ? (
        <div 
          className="cuts-feed-container" 
          ref={containerRef}
          onScroll={handleScroll}
        >
          {feed.map((song, index) => (
            <div key={`${song.id}-${index}`} className="cut-wrapper">
              <CutItem 
                song={song} 
                isActive={index === currentIndex} 
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="cuts-loading-feed">
          <div className="cut-spinner"></div>
          <p>Finding new Cuts...</p>
        </div>
      )}
    </div>
  );
}
