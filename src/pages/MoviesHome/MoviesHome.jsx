import React, { useState, useEffect } from 'react';
import {
  getTamilMovies, getLatestTamilMovies, getTopRatedTamilMovies,
  getTamilTVShows, getTamilMoviesByGenre, tmdbFetch, searchMovies,
  getPosterUrl
} from '../../api/tmdb';
import MovieCard from '../../components/MovieCard/MovieCard';
import SectionHeader from '../../components/SectionHeader/SectionHeader';
import Loader from '../../components/Loader/Loader';
import './MoviesHome.css';

const MOVIE_BUNDLES = [
  { id: 'marvel', title: 'Marvel Multiverse (Tamil)', desc: 'Marvel Cinematic Universe in Tamil.', with_genres: '28,12,878', colorClass: 'red-gold-glow' },
  { id: 'romance', title: 'Love & Melodies', desc: 'Heart-touching Tamil romantic stories.', with_genres: '10749', colorClass: 'soft-pink-liquid' },
  { id: 'adventure', title: 'Adventure Quest', desc: 'Thrilling Tamil adventure movies.', with_genres: '12', colorClass: 'jungle-green-glow' },
  { id: 'horror', title: 'Midnight Horror', desc: 'Spooky Tamil horror films.', with_genres: '27', colorClass: 'dark-smoke-crimson' },
  { id: 'anime', title: 'Anime (Tamil Dubbed)', desc: 'Top Anime dubbed in Tamil.', with_genres: '16', colorClass: 'cyan-neon-liquid' },
];

export default function MoviesHome() {
  const [sections, setSections] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSections() {
      setLoading(true);
      try {
        // Core Tamil Sections
        const [trending, latest, tv] = await Promise.all([
          getTamilMovies().catch(e => { console.error(e); return { results: [] }; }),
          getLatestTamilMovies().catch(e => { console.error(e); return { results: [] }; }),
          getTamilTVShows().catch(e => { console.error(e); return { results: [] }; })
        ]);

        // Bundle Sections (Marvel, Romance, Adventure, Horror, Anime)
        const bundleResults = await Promise.all(MOVIE_BUNDLES.map(async (bundle) => {
          try {
            let data;
            if (bundle.id === 'marvel') {
              data = await searchMovies('Avengers Tamil');
            } else if (bundle.id === 'anime') {
              data = await tmdbFetch('/discover/movie', {
                with_genres: '16',
                with_keywords: '210024', // Anime keyword
                sort_by: 'popularity.desc'
              });
            } else {
              data = await getTamilMoviesByGenre(bundle.with_genres);
            }
            return { id: bundle.id, results: data?.results || [] };
          } catch (e) { return { id: bundle.id, results: [] }; }
        }));

        if (mounted) {
          const bundleMap = {};
          bundleResults.forEach(b => bundleMap[b.id] = b.results);

          // Safe & Tamil Filter Logic
          const filterSafe = (list) => (list || []).filter(item => {
            const title = (item.title || item.name || '').toLowerCase();
            const adultKeywords = ['anaagarigam', 'shanthi appuram', 'sexy', 'hot', 'adult', 'b-grade', 'mallu', 'aunty'];
            const isSuggestive = adultKeywords.some(kw => title.includes(kw));
            
            // Release Date Check
            const releaseDate = item.release_date || item.first_air_date;
            const isReleased = !releaseDate || new Date(releaseDate) <= new Date();

            // Tamil Check: Native Tamil or Known Dubbed Categories
            const isNativeTamil = item.original_language === 'ta';
            const isKnownDubbed = title.includes('tamil') || item.genre_ids?.includes(16) || item.genre_ids?.includes(28); // Anime or Action usually dubbed

            return !item.adult && !isSuggestive && isReleased && (isNativeTamil || isKnownDubbed);
          });

          setSections({
            trending: filterSafe(trending?.results),
            latest: filterSafe(latest?.results),
            tv: filterSafe(tv?.results),
            marvel: bundleMap.marvel, // Marvel is usually safe
            romance: filterSafe(bundleMap.romance),
            adventure: bundleMap.adventure,
            horror: filterSafe(bundleMap.horror),
            anime: bundleMap.anime
          });
        }
      } catch (err) {
        console.error('Failed to load movies:', err);
      }
      if (mounted) setLoading(false);
    }

    loadSections();
    return () => { mounted = false; };
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="movies-home" id="movies-home">
      {/* Hero */}
      <div className="movies-home__hero">
        <div className="movies-home__hero-content">
          <span className="movies-home__hero-badge">🎬 Tamil Movie Hub</span>
          <h1 className="movies-home__hero-title">
            Tamil <span>Premium</span><br />Streaming
          </h1>
          <p className="movies-home__hero-subtitle">
            HD Movies & Web Series with zero ads. Marvel Multiverse, Anime & Blockbusters—all in Tamil Audio.
          </p>
        </div>
      </div>

      <div className="movies-home__content">
        {/* Bundles Grid (Spotify Style) */}
        <div className="movies-home__section">
          <SectionHeader title="Top Collections" />
          <div className="movies-home__bundle-grid">
            {MOVIE_BUNDLES.map((bundle) => {
              const firstMovie = sections[bundle.id]?.[0];
              const coverImage = firstMovie ? getPosterUrl(firstMovie.poster_path, 'w500') : '';
              return (
                <div key={bundle.id} className={`bundle-card ${bundle.colorClass}`}>
                  <div className="bundle-card__img-container">
                    {coverImage ? (
                      <img src={coverImage} alt={bundle.title} className="bundle-card__img" loading="lazy" />
                    ) : (
                      <div className="bundle-card__placeholder">🎬</div>
                    )}
                    <div className="bundle-card__badges">
                      <span className="bundle-badge hd">HD</span>
                      <span className="bundle-badge audio">Tamil</span>
                    </div>
                  </div>
                  <div className="bundle-card__content">
                    <h4 className="bundle-card__title">{bundle.title}</h4>
                    <p className="bundle-card__desc">{bundle.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Traditional Rows */}
        <div className="movies-home__section">
          <SectionHeader title="🔥 Trending Now" />
          <div className="movies-home__grid">
            {sections.trending?.slice(0, 10).map((movie, i) => (
              <MovieCard key={movie.id} item={movie} style={{ animationDelay: `${i * 50}ms` }} />
            ))}
          </div>
        </div>

        <div className="movies-home__section">
          <SectionHeader title="✨ Recently Released" />
          <div className="movies-home__grid">
            {sections.latest?.slice(0, 10).map((movie, i) => (
              <MovieCard key={movie.id} item={movie} style={{ animationDelay: `${i * 50}ms` }} />
            ))}
          </div>
        </div>

        <div className="movies-home__section">
          <SectionHeader title="📺 Tamil Web Series" />
          <div className="movies-home__grid">
            {sections.tv?.slice(0, 10).map((show, i) => (
              <MovieCard key={show.id} item={show} type="tv" style={{ animationDelay: `${i * 50}ms` }} />
            ))}
          </div>
        </div>

        {/* Categorized Rows for Bundles */}
        {MOVIE_BUNDLES.map(bundle => (
          <div key={bundle.id} className="movies-home__section">
            <SectionHeader title={bundle.title} />
            <div className="movies-home__grid">
              {sections[bundle.id]?.slice(0, 10).map((movie, i) => (
                <MovieCard key={movie.id} item={movie} style={{ animationDelay: `${i * 50}ms` }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
