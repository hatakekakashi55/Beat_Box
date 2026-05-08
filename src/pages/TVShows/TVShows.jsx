import React, { useState, useEffect } from 'react';
import { getTamilTVShows, getLatestTamilTV, getTrendingTV } from '../../api/tmdb';
import MovieCard from '../../components/MovieCard/MovieCard';
import SectionHeader from '../../components/SectionHeader/SectionHeader';
import Loader from '../../components/Loader/Loader';
import '../MoviesHome/MoviesHome.css';

export default function TVShows() {
  const [sections, setSections] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [tamilTV, latestTV, trendingTV] = await Promise.all([
          getTamilTVShows(),
          getLatestTamilTV(),
          getTrendingTV('week'),
        ]);
        if (mounted) {
          setSections({
            tamilTV: tamilTV?.results || [],
            latestTV: latestTV?.results || [],
            trendingTV: trendingTV?.results || [],
          });
        }
      } catch (err) { console.error('Failed to load TV shows:', err); }
      if (mounted) setLoading(false);
    }
    loadData();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="movies-home" id="tv-shows-page">
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, marginBottom: 24 }}>📺 Web Series</h1>

      {loading && <Loader />}

      {sections.tamilTV?.length > 0 && (
        <div className="movies-home__section">
          <SectionHeader title="🎭 Tamil Web Series" />
          <div className="movies-home__grid">
            {sections.tamilTV.slice(0, 12).map((show, i) => (
              <MovieCard key={show.id} item={show} type="tv" style={{ animationDelay: `${i * 50}ms` }} />
            ))}
          </div>
        </div>
      )}

      {sections.trendingTV?.length > 0 && (
        <div className="movies-home__section">
          <SectionHeader title="🔥 Trending Shows" />
          <div className="movies-home__grid">
            {sections.trendingTV.slice(0, 12).map((show, i) => (
              <MovieCard key={show.id} item={show} type="tv" style={{ animationDelay: `${i * 50}ms` }} />
            ))}
          </div>
        </div>
      )}

      {sections.latestTV?.length > 0 && (
        <div className="movies-home__section">
          <SectionHeader title="✨ Latest Tamil Shows" />
          <div className="movies-home__grid">
            {sections.latestTV.slice(0, 12).map((show, i) => (
              <MovieCard key={show.id} item={show} type="tv" style={{ animationDelay: `${i * 50}ms` }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
