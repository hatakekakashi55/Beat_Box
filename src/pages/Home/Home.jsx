/**
 * Home.jsx — Spotify-style Personalized Home
 *
 * How it works (just like real Spotify):
 *  1. Reads user's recentlyPlayed + likedSongs from PlayerContext
 *  2. Runs buildTasteProfile() to detect fav artists, moods, language
 *  3. Generates personalised sections via getPersonalisedSections()
 *  4. Album sections → fetch real albums using searchAlbums() → click → /album/:id → see all songs
 *  5. Song sections  → fetch songs with filterByLanguage() to strip non-Tamil results
 *  6. "Made For You" artist albums always appear at the top (if history exists)
 *  7. Jump Back In → recently played songs (quick pill row)
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchSongs, searchAlbums } from '../../api/saavn';
import { usePlayer } from '../../context/PlayerContext';
import AlbumCard from '../../components/AlbumCard/AlbumCard';
import SongCard from '../../components/SongCard/SongCard';
import Stories from '../../components/Stories/Stories';
import SectionHeader from '../../components/SectionHeader/SectionHeader';
import Loader from '../../components/Loader/Loader';
import { getMediumQualityImage, decodeHTML, getHighQualityImage } from '../../utils/helpers';
import { buildTasteProfile, getPersonalisedSections, filterByLanguage } from '../../utils/userTaste';
import './Home.css';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning ☀️';
  if (hour < 17) return 'Good Afternoon 🌤️';
  return 'Good Evening 🌙';
}

// ── Spotify "Made For You" curated album playlists (always show, cover from real album art) ──
const FEATURED_PLAYLISTS = [
  { id: 'anirudh_top',    title: 'Anirudh Hits',         desc: 'Best of Anirudh Ravichander',         query: 'anirudh ravichander album' },
  { id: 'arrahman_top',   title: 'A.R. Rahman',          desc: 'Timeless Rahman albums',              query: 'ar rahman tamil album' },
  { id: 'yuvan_top',      title: 'Yuvan Shankar Raja',   desc: 'The Yuvan touch',                     query: 'yuvan shankar raja album' },
  { id: 'harris_top',     title: 'Harris Jayaraj',       desc: 'Harris magic collection',             query: 'harris jayaraj album' },
  { id: 'imman_top',      title: 'D. Imman Albums',      desc: 'D. Imman\'s best scores',             query: 'd imman album' },
  { id: 'ilaiyaraaja_top',title: 'Ilaiyaraaja Classics', desc: 'Legends never die',                   query: 'ilaiyaraaja album' },
  { id: 'kuthu_pl',       title: 'Item Vibezzz 🔥',      desc: 'Kuthu songs for party nights',        query: 'tamil kuthu party album' },
  { id: 'melody_pl',      title: 'Tamil Melody Mix',     desc: 'Pure melody vibes',                   query: 'tamil melody album' },
  { id: 'trending_new',   title: 'New Releases 2025',    desc: 'What\'s hot right now',               query: 'new tamil album 2025' },
  { id: 'vijay_pl',       title: 'Thalapathy Vijay',     desc: 'Vijay mass + melody',                 query: 'vijay thalapathy album' },
  { id: 'ajith_pl',       title: 'Thala Ajith',          desc: 'Ajith hits collection',               query: 'ajith kumar album' },
  { id: 'gvprakash_pl',   title: 'G.V. Prakash',         desc: 'GV\'s musical journey',              query: 'gv prakash kumar album' },
];

export default function Home() {
  const navigate = useNavigate();
  const { recentlyPlayed, likedSongs, playSong } = usePlayer();

  const [sections, setSections] = useState({});   // key → songs[]  or  albums[]
  const [featuredCovers, setFeaturedCovers] = useState({}); // playlist id → image
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  // Build taste profile from user history
  const tasteProfile = useMemo(
    () => buildTasteProfile(recentlyPlayed, likedSongs),
    [recentlyPlayed.length, likedSongs.length] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Get personalised sections list (changes based on profile)
  const allSections = useMemo(
    () => getPersonalisedSections(tasteProfile),
    [tasteProfile] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Load sections (priority: first 4 quick, rest lazy) ──
  useEffect(() => {
    mountedRef.current = true;
    setSections({});
    setLoading(true);

    const priority = allSections.slice(0, 4);
    const rest = allSections.slice(4);
    const preferredLang = tasteProfile?.topLanguage || 'tamil';

    async function fetchSection(section) {
      try {
        if (section.type === 'album') {
          const data = await searchAlbums(section.query, 12);
          const results = data?.results || [];
          if (mountedRef.current && results.length > 0) {
            setSections(prev => ({ ...prev, [section.key]: { type: 'album', items: results } }));
          }
        } else {
          const data = await searchSongs(section.query, 12);
          const results = filterByLanguage(data?.results || [], preferredLang);
          if (mountedRef.current && results.length > 0) {
            setSections(prev => ({ ...prev, [section.key]: { type: 'song', items: results } }));
          }
        }
      } catch (err) {
        console.warn(`[Home] Section "${section.key}" failed:`, err.message);
      }
    }

    async function loadAll() {
      // Priority batch — sequential for reliability
      for (const s of priority) {
        if (!mountedRef.current) return;
        await fetchSection(s);
        // Small delay to prevent rate limiting
        await new Promise(r => setTimeout(r, 300));
      }
      if (mountedRef.current) setLoading(false);

      // Lazy-load the rest in parallel batches of 2 (smaller batches to be safe)
      for (let i = 0; i < rest.length; i += 2) {
        if (!mountedRef.current) return;
        await Promise.all(rest.slice(i, i + 2).map(fetchSection));
        // Delay between batches
        await new Promise(r => setTimeout(r, 500));
      }
    }

    loadAll();

    return () => { mountedRef.current = false; };
  }, [allSections.map(s => s.key).join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load featured playlist covers (real album art from API) ──
  useEffect(() => {
    let mounted = true;
    async function loadCovers() {
      for (let i = 0; i < FEATURED_PLAYLISTS.length; i += 2) {
        if (!mounted) break;
        await Promise.all(
          FEATURED_PLAYLISTS.slice(i, i + 2).map(async (pl) => {
            try {
              const data = await searchAlbums(pl.query, 1);
              const first = data?.results?.[0];
              if (mounted && first?.image) {
                setFeaturedCovers(prev => ({ ...prev, [pl.id]: first.image }));
              }
            } catch {}
          })
        );
        // Delay to prevent 429
        await new Promise(r => setTimeout(r, 400));
      }
    }
    loadCovers();
    return () => { mounted = false; };
  }, []);

  const quickPicks = recentlyPlayed.slice(0, 6);
  const hasProfile = !!tasteProfile && tasteProfile.totalSongs >= 3;

  const handleAlbumClick = (album) => {
    if (album?.id) navigate(`/album/${album.id}`);
  };

  return (
    <div className="home" id="home-page">
      <Stories />

      {/* ── Greeting ── */}
      <h2 className="home__greeting">{getGreeting()}</h2>

      {/* ── Jump Back In (recently played) ── */}
      {quickPicks.length > 0 && (
        <div className="home__section">
          <SectionHeader title="🔄 Jump Back In" actionLabel="See all" onAction={() => navigate('/recent')} />
          <div className="home__quick-picks">
            {quickPicks.map((song) => (
              <button
                key={song.id}
                className="home__quick-pick"
                onClick={() => playSong(song, quickPicks, quickPicks.indexOf(song))}
              >
                <img
                  className="home__quick-pick-image"
                  src={getMediumQualityImage(song.image)}
                  alt={decodeHTML(song.name)}
                />
                <span className="home__quick-pick-name">{decodeHTML(song.name)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Hero Banner ── */}
      <div className="home__hero" id="home-hero">
        <div className="home__hero-orb home__hero-orb--1" />
        <div className="home__hero-orb home__hero-orb--2" />
        <span className="home__hero-badge">
          {hasProfile ? '🎯 Personalised For You' : '✨ Tamil Music Hub'}
        </span>
        <h1 className="home__hero-title">
          Feel the <span>Beat</span>,<br />
          Live the Music.
        </h1>
        <p className="home__hero-subtitle">
          {hasProfile
            ? `Based on your taste — ${tasteProfile.topArtists.slice(0, 2).map(a => a.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')).join(', ')} & more.`
            : 'Stream 320kbps Tamil hits — Anirudh, A.R. Rahman & more. Ad-free!'}
        </p>
      </div>

      {/* ── Featured Playlists (Spotify-style album grid) ── */}
      <div className="home__section">
        <SectionHeader title="🎵 Featured Albums" />
        <div className="home__playlist-grid">
          {FEATURED_PLAYLISTS.map((pl) => {
            const rawImage = featuredCovers[pl.id];
            const cover = rawImage ? getHighQualityImage(rawImage) : '';
            return (
              <div
                key={pl.id}
                className="spotify-card"
                onClick={() => navigate(`/category/${encodeURIComponent(pl.query)}`, {
                  state: { title: pl.title, useAlbums: true }
                })}
              >
                <div className="spotify-card__img-container">
                  {cover ? (
                    <img src={cover} alt={pl.title} className="spotify-card__img" loading="lazy" />
                  ) : (
                    <div className="spotify-card__placeholder"><span>🎵</span></div>
                  )}
                  <div className="spotify-card__play">
                    <span style={{ marginLeft: '4px', fontSize: '18px' }}>▶</span>
                  </div>
                </div>
                <h4 className="spotify-card__title">{pl.title}</h4>
                <p className="spotify-card__desc">{pl.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {loading && Object.keys(sections).length === 0 && <Loader />}

      {/* ── Dynamic Sections (Albums + Songs) ── */}
      {allSections.map((section) => {
        const sectionData = sections[section.key];
        if (!sectionData || sectionData.items.length === 0) return null;

        return (
          <div
            className={`home__section${section.personalised ? ' home__section--personalised' : ''}`}
            key={section.key}
            id={`section-${section.key}`}
          >
            {section.type === 'album' ? (
              <>
                <SectionHeader
                  title={section.title}
                  actionLabel="Show all"
                  onAction={() =>
                    navigate(`/category/${encodeURIComponent(section.query)}`, {
                      state: { title: section.title, useAlbums: true }
                    })
                  }
                  badge={section.personalised ? 'For You' : null}
                />
                <div className="home__grid">
                  {sectionData.items.slice(0, 12).map((album, i) => (
                    <AlbumCard
                      key={`${album.id || 'album'}-${i}`}
                      album={album}
                      onClick={handleAlbumClick}
                      style={{ animationDelay: `${i * 40}ms` }}
                    />
                  ))}
                </div>
              </>
            ) : (
              <>
                <SectionHeader
                  title={section.title}
                  actionLabel="Show all"
                  onAction={() =>
                    navigate(`/category/${encodeURIComponent(section.query)}`, {
                      state: { title: section.title }
                    })
                  }
                  badge={section.personalised ? 'For You' : null}
                />
                <div className="home__grid">
                  {sectionData.items.slice(0, 12).map((song, i) => (
                    <SongCard
                      key={`${song.id || 'song'}-${i}`}
                      song={song}
                      queue={sectionData.items}
                      index={i}
                      style={{ animationDelay: `${i * 40}ms` }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
