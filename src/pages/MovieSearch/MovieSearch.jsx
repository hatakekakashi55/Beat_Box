import React, { useState, useEffect, useCallback } from 'react';
import { searchMulti } from '../../api/tmdb';
import SearchBar from '../../components/SearchBar/SearchBar';
import MovieCard from '../../components/MovieCard/MovieCard';
import Loader from '../../components/Loader/Loader';
import { debounce } from '../../utils/helpers';
import '../Search/Search.css';

export default function MovieSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const performSearch = useCallback(
    debounce(async (q) => {
      if (!q || q.trim().length < 2) { setResults([]); setLoading(false); return; }
      setLoading(true);
      try {
        const data = await searchMulti(q);
        setResults((data?.results || []).filter(r => r.media_type === 'movie' || r.media_type === 'tv'));
      } catch (err) { console.error('Search error:', err); }
      setLoading(false);
    }, 400),
    []
  );

  useEffect(() => { performSearch(query); }, [query, performSearch]);

  return (
    <div className="search-page" id="movie-search-page">
      <div className="search-page__bar">
        <SearchBar value={query} onChange={setQuery} placeholder="Search movies, TV shows..." />
      </div>

      {!query && (
        <h2 className="search-page__browse-title">🎬 Search Movies & Web Series</h2>
      )}

      {loading && <Loader />}

      {results.length > 0 && (
        <div className="search-page__grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))' }}>
          {results.map((item, i) => (
            <MovieCard
              key={item.id}
              item={item}
              type={item.media_type || 'movie'}
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      )}

      {query && !loading && results.length === 0 && (
        <div className="search-page__no-results">
          <div className="search-page__no-results-text">No results found</div>
          <div className="search-page__no-results-hint">Try different keywords</div>
        </div>
      )}
    </div>
  );
}
