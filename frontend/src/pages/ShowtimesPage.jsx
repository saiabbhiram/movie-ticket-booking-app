import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMovies, fetchTheatres, searchShows } from '../services/api';

export default function ShowtimesPage() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [shows, setShows] = useState([]);
  const [city, setCity] = useState('Hyderabad');
  const [movieId, setMovieId] = useState('');
  const [theatreId, setTheatreId] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchMovies({ status: 'Now Showing' }), fetchTheatres()])
      .then(([moviesRes, theatresRes]) => {
        setMovies(moviesRes.data.data || []);
        setTheatres(theatresRes.data.data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    searchShows({ city, movieId, theatreId, date })
      .then((res) => setShows(res.data.data || []))
      .catch(() => setShows([]))
      .finally(() => setLoading(false));
  }, [city, movieId, theatreId, date]);

  const cities = ['All', ...new Set(theatres.map((t) => t.city))];

  return (
    <div className="container section">
      <div className="section-header">
        <h1 className="section-title">Theatre &amp; Showtime Selection</h1>
      </div>

      <div className="filter-bar">
        <select className="form-select" value={city} onChange={(e) => setCity(e.target.value)}>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c === 'All' ? 'All Cities' : c}
            </option>
          ))}
        </select>

        <select className="form-select" value={theatreId} onChange={(e) => setTheatreId(e.target.value)}>
          <option value="">All Theatres</option>
          {theatres.map((t) => (
            <option key={t.id} value={t.id}>
              {t.theatre_name} ({t.location})
            </option>
          ))}
        </select>

        <select className="form-select" value={movieId} onChange={(e) => setMovieId(e.target.value)}>
          <option value="">All Movies</option>
          {movies.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="form-control"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading showtimes...</p>
      ) : shows.length === 0 ? (
        <div className="panel">
          <p style={{ color: 'var(--text-secondary)' }}>No showtimes match your selected filters.</p>
        </div>
      ) : (
        <div className="movies-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {shows.map((show) => (
            <div key={show.id} className="theatre-card" style={{ marginBottom: 0 }}>
              <h3 style={{ marginBottom: 4 }}>{show.movie_title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 10 }}>
                {show.language} &bull; {show.genre}
              </p>
              <p style={{ fontWeight: 600 }}>{show.theatre_name}</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
                {show.location}, {show.city} &bull; {show.screen_name}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#4ade80' }}>
                    {show.show_date} &bull; {show.show_time.slice(0, 5)}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    ₹{Number(show.ticket_price).toFixed(2)} / seat
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate(`/shows/${show.id}/seats`)}
                >
                  Select Seats
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
