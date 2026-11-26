import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchMovieById } from '../services/api';
import fallbackPoster from '../assets/poster-fallback.svg';

export default function MovieDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedDate, setSelectedDate] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchMovieById(id)
      .then((res) => {
        if (active) setMovie(res.data.data);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Failed to load movie details.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="container section">
        <p style={{ color: 'var(--text-secondary)' }}>Loading movie details...</p>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="container section">
        <div className="alert alert-error">{error || 'Movie not found.'}</div>
      </div>
    );
  }

  const shows = movie.shows || [];
  const cities = ['All', ...new Set(shows.map((s) => s.city))];
  const dates = ['All', ...new Set(shows.map((s) => s.show_date))];

  const filteredShows = shows.filter((s) => {
    const matchCity = selectedCity === 'All' || s.city === selectedCity;
    const matchDate = selectedDate === 'All' || s.show_date === selectedDate;
    return matchCity && matchDate;
  });

  // Group shows by Theatre + Date
  const groupedByTheatre = filteredShows.reduce((acc, show) => {
    const key = `${show.theatre_id}-${show.show_date}`;
    if (!acc[key]) {
      acc[key] = {
        theatre_name: show.theatre_name,
        city: show.city,
        location: show.location,
        show_date: show.show_date,
        shows: [],
      };
    }
    acc[key].shows.push(show);
    return acc;
  }, {});

  return (
    <div className="container section">
      <div className="panel movie-details-hero">
        <img
          className="movie-details-poster"
          src={movie.poster_url || fallbackPoster}
          alt={movie.title}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = fallbackPoster;
          }}
        />

        <div>
          <span
            className={`movie-status-badge ${movie.status === 'Now Showing' ? 'badge-now' : 'badge-upcoming'}`}
            style={{ position: 'static', display: 'inline-block', marginBottom: 12 }}
          >
            {movie.status}
          </span>
          <h1 style={{ fontSize: '2.2rem', marginBottom: 10 }}>{movie.title}</h1>

          <div className="tag-list">
            <span className="tag">{movie.genre}</span>
            <span className="tag">{movie.language}</span>
            <span className="tag">{movie.duration} mins</span>
            <span className="tag">Release: {movie.release_date}</span>
            {Number(movie.rating) > 0 && <span className="tag">★ {Number(movie.rating).toFixed(1)} / 10</span>}
          </div>

          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{movie.description}</p>

          {shows.length > 0 && (
            <a href="#showtimes-section" className="btn btn-primary">
              Book Tickets
            </a>
          )}
        </div>
      </div>

      <section id="showtimes-section" className="section">
        <div className="section-header">
          <h2 className="section-title">Available Theatres &amp; Showtimes</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <select
              className="form-select"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
            >
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'All Cities' : c}
                </option>
              ))}
            </select>

            <select
              className="form-select"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            >
              {dates.map((d) => (
                <option key={d} value={d}>
                  {d === 'All' ? 'All Dates' : d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {Object.values(groupedByTheatre).length === 0 ? (
          <div className="panel">
            <p style={{ color: 'var(--text-secondary)' }}>
              No showtimes available for this movie yet.
            </p>
          </div>
        ) : (
          Object.values(groupedByTheatre).map((group, idx) => (
            <div key={idx} className="theatre-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <h3>{group.theatre_name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {group.location}, {group.city}
                  </p>
                </div>
                <span className="tag">Date: {group.show_date}</span>
              </div>

              <div className="showtime-list">
                {group.shows.map((show) => (
                  <button
                    key={show.show_id}
                    type="button"
                    className="showtime-pill"
                    onClick={() => navigate(`/shows/${show.show_id}/seats`)}
                  >
                    <strong>{show.show_time.slice(0, 5)}</strong>
                    <small>
                      {show.screen_name} &bull; ₹{Number(show.ticket_price).toFixed(0)}
                    </small>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
