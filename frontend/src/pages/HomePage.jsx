import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchMovies } from '../services/api';
import MovieCard from '../components/MovieCard';
import fallbackPoster from '../assets/poster-fallback.svg';

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetchMovies()
      .then((res) => {
        if (active) setMovies(res.data.data || []);
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
  }, []);

  const nowShowing = movies.filter((m) => m.status === 'Now Showing');
  const upcoming = movies.filter((m) => m.status === 'Upcoming');
  const featured = nowShowing.slice(0, 4);
  const heroMovie = featured[0];

  return (
    <div>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="hero-badge">Now Booking Across Hyderabad</span>
            <h1>Experience Cinema Like Never Before</h1>
            <p>
              Book tickets for the latest blockbusters at AMB Cinemas, PVR Cinemas, INOX, and Asian
              Cinemas with real-time seat selection and instant confirmation.
            </p>
            <div className="hero-actions">
              <Link to="/movies" className="btn btn-primary">
                Explore All Movies
              </Link>
              <Link to="/showtimes" className="btn btn-secondary">
                Browse Theatres &amp; Shows
              </Link>
            </div>
          </div>

          {heroMovie && (
            <div className="hero-poster-card">
              <img
                src={heroMovie.poster_url || fallbackPoster}
                alt={heroMovie.title}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = fallbackPoster;
                }}
              />
              <div>
                <span className="hero-badge" style={{ marginBottom: 8 }}>
                  Featured Release
                </span>
                <h2 style={{ marginBottom: 6 }}>{heroMovie.title}</h2>
                <p style={{ fontSize: '0.9rem', marginBottom: 12 }}>
                  {heroMovie.genre} &bull; {heroMovie.language} &bull; {heroMovie.duration} mins
                </p>
                <p style={{ fontSize: '0.85rem', marginBottom: 16 }}>
                  {heroMovie.description.slice(0, 120)}...
                </p>
                <Link to={`/movies/${heroMovie.id}`} className="btn btn-primary btn-sm">
                  Book Now
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="container">
        {error && <div className="alert alert-error" style={{ marginTop: 24 }}>{error}</div>}
        {loading && <p style={{ padding: '40px 0', color: 'var(--text-secondary)' }}>Loading movies...</p>}

        {!loading && featured.length > 0 && (
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">Featured Movies</h2>
              <Link to="/movies" className="btn btn-secondary btn-sm">
                View All
              </Link>
            </div>
            <div className="movies-grid">
              {featured.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </section>
        )}

        {!loading && nowShowing.length > 0 && (
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">Now Showing</h2>
            </div>
            <div className="movies-grid">
              {nowShowing.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </section>
        )}

        {!loading && upcoming.length > 0 && (
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">Upcoming Movies</h2>
            </div>
            <div className="movies-grid">
              {upcoming.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
