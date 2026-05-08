import React, { useState, useEffect } from 'react';
import { getTrendingMovies, getTrendingTV } from '../../api/tmdb';
import MovieCard from '../../components/MovieCard/MovieCard';
import SectionHeader from '../../components/SectionHeader/SectionHeader';
import Loader from '../../components/Loader/Loader';
import '../MoviesHome/MoviesHome.css';

export default function TrendingMovies() {
  const [movies, setMovies] = useState([]);
  const [tvShows, setTvShows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [m, t] = await Promise.all([getTrendingMovies('week'), getTrendingTV('week')]);
        if (mounted) {
          setMovies(m?.results || []);
          setTvShows(t?.results || []);
        }
      } catch (err) { console.error('Trending error:', err); }
      if (mounted) setLoading(false);
    }
    loadData();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="movies-home" id="trending-page">
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, marginBottom: 24 }}>🔥 Trending</h1>

      {loading && <Loader />}

      {movies.length > 0 && (
        <div className="movies-home__section">
          <SectionHeader title="🎬 Trending Movies" />
          <div className="movies-home__grid">
            {movies.map((movie, i) => (
              <MovieCard key={movie.id} item={movie} style={{ animationDelay: `${i * 50}ms` }} />
            ))}
          </div>
        </div>
      )}

      {tvShows.length > 0 && (
        <div className="movies-home__section">
          <SectionHeader title="📺 Trending TV Shows" />
          <div className="movies-home__grid">
            {tvShows.map((show, i) => (
              <MovieCard key={show.id} item={show} type="tv" style={{ animationDelay: `${i * 50}ms` }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
