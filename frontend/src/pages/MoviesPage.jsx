import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchMovies } from '../services/api';
import MovieCard from '../components/MovieCard';

export default function MoviesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [genre, setGenre] = useState('All');
  const [language, setLanguage] = useState('All');
  const [status, setStatus] = useState('All');

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchMovies({ search, genre, language, status })
      .then((res) => {
        if (active) {
          setMovies(res.data.data || []);
          setError('');
        }
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Failed to load movies.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [search, genre, language, status]);

  const handleSearchChange = (value) => {
    setSearch(value);
    if (value.trim()) {
      setSearchParams({ search: value.trim() });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="container section">
      <div className="section-header">
        <h1 className="section-title">All Movies</h1>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          className="form-control"
          placeholder="Search by movie name..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          style={{ flex: 1, minWidth: 220 }}
        />

        <select className="form-select" value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="All">All Genres</option>
          <option value="Action">Action</option>
          <option value="Drama">Drama</option>
          <option value="Thriller">Thriller</option>
          <option value="Sci-Fi">Sci-Fi</option>
          <option value="Comedy">Comedy</option>
        </select>

        <select className="form-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="All">All Languages</option>
          <option value="Telugu">Telugu</option>
          <option value="Hindi">Hindi</option>
          <option value="Tamil">Tamil</option>
          <option value="Kannada">Kannada</option>
          <option value="English">English</option>
        </select>

        <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="All">All Statuses</option>
          <option value="Now Showing">Now Showing</option>
          <option value="Upcoming">Upcoming</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p style={{ color: 'var(--text-secondary)' }}>Loading movies...</p>}

      {!loading && movies.length === 0 && (
        <div className="panel">
          <p>No movies matched your search or filter criteria.</p>
        </div>
      )}

      {!loading && movies.length > 0 && (
        <div className="movies-grid">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
