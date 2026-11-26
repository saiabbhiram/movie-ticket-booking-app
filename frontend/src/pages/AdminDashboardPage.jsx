import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createMovie,
  createShow,
  createTheatre,
  deleteMovie,
  fetchAdminBookings,
  fetchAdminDashboard,
  fetchMovies,
  fetchShows,
  fetchTheatres,
  updateMovie,
} from '../services/api';

const EMPTY_MOVIE = {
  title: '',
  description: '',
  genre: 'Action',
  language: 'Telugu',
  duration: 150,
  release_date: '',
  rating: 8.0,
  poster_url: '',
  status: 'Now Showing',
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('movies');
  const [stats, setStats] = useState(null);
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [shows, setShows] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Movie form state
  const [movieForm, setMovieForm] = useState(EMPTY_MOVIE);
  const [editingMovieId, setEditingMovieId] = useState(null);

  // Theatre form state
  const [theatreForm, setTheatreForm] = useState({
    theatre_name: '',
    city: 'Hyderabad',
    location: '',
    screen_name: 'Screen 1',
  });

  // Show form state
  const [showForm, setShowForm] = useState({
    movie_id: '',
    screen_id: '',
    show_date: '',
    show_time: '18:00',
    ticket_price: 250,
  });

  const loadAllAdminData = async () => {
    try {
      const [statsRes, moviesRes, theatresRes, showsRes, bookingsRes] = await Promise.all([
        fetchAdminDashboard(),
        fetchMovies(),
        fetchTheatres(),
        fetchShows(),
        fetchAdminBookings(),
      ]);
      setStats(statsRes.data.data);
      setMovies(moviesRes.data.data || []);
      setTheatres(theatresRes.data.data || []);
      setShows(showsRes.data.data || []);
      setBookings(bookingsRes.data.data || []);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('cinebook_admin_token');
        navigate('/admin/login');
      } else {
        setError(err.response?.data?.message || 'Failed to load admin data.');
      }
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('cinebook_admin_token')) {
      navigate('/admin/login');
      return;
    }
    loadAllAdminData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('cinebook_admin_token');
    localStorage.removeItem('cinebook_admin_user');
    navigate('/admin/login');
  };

  const handleSaveMovie = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      if (editingMovieId) {
        await updateMovie(editingMovieId, movieForm);
        setMessage('Movie updated successfully.');
      } else {
        await createMovie(movieForm);
        setMessage('Movie added successfully.');
      }
      setMovieForm(EMPTY_MOVIE);
      setEditingMovieId(null);
      await loadAllAdminData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save movie.');
    }
  };

  const handleEditMovie = (movie) => {
    setEditingMovieId(movie.id);
    setMovieForm({
      title: movie.title,
      description: movie.description,
      genre: movie.genre,
      language: movie.language,
      duration: movie.duration,
      release_date: movie.release_date,
      rating: movie.rating,
      poster_url: movie.poster_url || '',
      status: movie.status,
    });
    setActiveTab('movies');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteMovie = async (id) => {
    if (!window.confirm('Delete this movie and its associated shows?')) return;
    setError('');
    setMessage('');
    try {
      await deleteMovie(id);
      setMessage('Movie deleted successfully.');
      await loadAllAdminData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete movie.');
    }
  };

  const handleAddTheatre = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await createTheatre(theatreForm);
      setMessage('Theatre added successfully.');
      setTheatreForm({ theatre_name: '', city: 'Hyderabad', location: '', screen_name: 'Screen 1' });
      await loadAllAdminData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add theatre.');
    }
  };

  const handleAddShow = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await createShow({
        ...showForm,
        show_time: showForm.show_time.length === 5 ? `${showForm.show_time}:00` : showForm.show_time,
      });
      setMessage('Showtime scheduled successfully.');
      setShowForm({ movie_id: '', screen_id: '', show_date: '', show_time: '18:00', ticket_price: 250 });
      await loadAllAdminData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to schedule showtime.');
    }
  };

  const allScreens = theatres.flatMap((t) =>
    (t.screens || []).map((s) => ({
      ...s,
      label: `${t.theatre_name} (${t.city}) - ${s.screen_name}`,
    }))
  );

  return (
    <div className="container section">
      <div className="section-header">
        <h1 className="section-title">Admin Dashboard</h1>
        <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Total Bookings</div>
            <div className="stat-value">{stats.total_bookings}</div>
          </div>
          <div className="stat-card">
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Total Revenue</div>
            <div className="stat-value">₹{Number(stats.total_revenue).toFixed(2)}</div>
          </div>
          <div className="stat-card">
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Total Movies</div>
            <div className="stat-value">{stats.total_movies}</div>
          </div>
          <div className="stat-card">
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Total Theatres</div>
            <div className="stat-value">{stats.total_theatres}</div>
          </div>
        </div>
      )}

      <div className="tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'movies' ? 'active' : ''}`}
          onClick={() => setActiveTab('movies')}
        >
          Manage Movies
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'theatres' ? 'active' : ''}`}
          onClick={() => setActiveTab('theatres')}
        >
          Manage Theatres
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'shows' ? 'active' : ''}`}
          onClick={() => setActiveTab('shows')}
        >
          Manage Showtimes
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          All Bookings
        </button>
      </div>

      {activeTab === 'movies' && (
        <div style={{ display: 'grid', gap: 24 }}>
          <form className="panel" onSubmit={handleSaveMovie}>
            <h2 style={{ marginBottom: 16 }}>
              {editingMovieId ? 'Update Movie' : 'Add New Movie'}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <div className="form-group">
                <label>Title</label>
                <input
                  className="form-control"
                  required
                  value={movieForm.title}
                  onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Genre</label>
                <input
                  className="form-control"
                  required
                  value={movieForm.genre}
                  onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Language</label>
                <input
                  className="form-control"
                  required
                  value={movieForm.language}
                  onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Duration (mins)</label>
                <input
                  type="number"
                  className="form-control"
                  required
                  min="1"
                  value={movieForm.duration}
                  onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Release Date</label>
                <input
                  type="date"
                  className="form-control"
                  required
                  value={movieForm.release_date}
                  onChange={(e) => setMovieForm({ ...movieForm, release_date: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Rating (0 - 10)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  className="form-control"
                  value={movieForm.rating}
                  onChange={(e) => setMovieForm({ ...movieForm, rating: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  className="form-select"
                  value={movieForm.status}
                  onChange={(e) => setMovieForm({ ...movieForm, status: e.target.value })}
                >
                  <option value="Now Showing">Now Showing</option>
                  <option value="Upcoming">Upcoming</option>
                </select>
              </div>
              <div className="form-group">
                <label>Poster Image URL</label>
                <input
                  className="form-control"
                  value={movieForm.poster_url}
                  onChange={(e) => setMovieForm({ ...movieForm, poster_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                className="form-control"
                rows="3"
                required
                value={movieForm.description}
                onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary">
                {editingMovieId ? 'Update Movie' : 'Add Movie'}
              </button>
              {editingMovieId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditingMovieId(null);
                    setMovieForm(EMPTY_MOVIE);
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>

          <div className="panel table-responsive">
            <h2 style={{ marginBottom: 14 }}>All Movies ({movies.length})</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Genre</th>
                  <th>Language</th>
                  <th>Status</th>
                  <th>Rating</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {movies.map((m) => (
                  <tr key={m.id}>
                    <td>{m.id}</td>
                    <td>{m.title}</td>
                    <td>{m.genre}</td>
                    <td>{m.language}</td>
                    <td>{m.status}</td>
                    <td>{m.rating}</td>
                    <td style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleEditMovie(m)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDeleteMovie(m.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'theatres' && (
        <div style={{ display: 'grid', gap: 24 }}>
          <form className="panel" onSubmit={handleAddTheatre}>
            <h2 style={{ marginBottom: 16 }}>Add New Theatre</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <div className="form-group">
                <label>Theatre Name</label>
                <input
                  className="form-control"
                  required
                  value={theatreForm.theatre_name}
                  onChange={(e) => setTheatreForm({ ...theatreForm, theatre_name: e.target.value })}
                  placeholder="e.g. Cinepolis"
                />
              </div>
              <div className="form-group">
                <label>City</label>
                <input
                  className="form-control"
                  required
                  value={theatreForm.city}
                  onChange={(e) => setTheatreForm({ ...theatreForm, city: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  className="form-control"
                  required
                  value={theatreForm.location}
                  onChange={(e) => setTheatreForm({ ...theatreForm, location: e.target.value })}
                  placeholder="e.g. Kukatpally"
                />
              </div>
              <div className="form-group">
                <label>Default Screen Name</label>
                <input
                  className="form-control"
                  required
                  value={theatreForm.screen_name}
                  onChange={(e) => setTheatreForm({ ...theatreForm, screen_name: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary">
              Add Theatre
            </button>
          </form>

          <div className="panel table-responsive">
            <h2 style={{ marginBottom: 14 }}>Theatres ({theatres.length})</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Theatre Name</th>
                  <th>City</th>
                  <th>Location</th>
                  <th>Screens</th>
                </tr>
              </thead>
              <tbody>
                {theatres.map((t) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>{t.theatre_name}</td>
                    <td>{t.city}</td>
                    <td>{t.location}</td>
                    <td>{(t.screens || []).map((s) => `${s.screen_name} (${s.total_seats} seats)`).join(', ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'shows' && (
        <div style={{ display: 'grid', gap: 24 }}>
          <form className="panel" onSubmit={handleAddShow}>
            <h2 style={{ marginBottom: 16 }}>Schedule New Showtime</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <div className="form-group">
                <label>Movie</label>
                <select
                  className="form-select"
                  required
                  value={showForm.movie_id}
                  onChange={(e) => setShowForm({ ...showForm, movie_id: e.target.value })}
                >
                  <option value="">Select Movie</option>
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Theatre &amp; Screen</label>
                <select
                  className="form-select"
                  required
                  value={showForm.screen_id}
                  onChange={(e) => setShowForm({ ...showForm, screen_id: e.target.value })}
                >
                  <option value="">Select Screen</option>
                  {allScreens.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Show Date</label>
                <input
                  type="date"
                  className="form-control"
                  required
                  value={showForm.show_date}
                  onChange={(e) => setShowForm({ ...showForm, show_date: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Show Time</label>
                <input
                  type="time"
                  className="form-control"
                  required
                  value={showForm.show_time}
                  onChange={(e) => setShowForm({ ...showForm, show_time: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Ticket Price (₹)</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  required
                  value={showForm.ticket_price}
                  onChange={(e) => setShowForm({ ...showForm, ticket_price: e.target.value })}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary">
              Add Showtime
            </button>
          </form>

          <div className="panel table-responsive">
            <h2 style={{ marginBottom: 14 }}>Scheduled Showtimes ({shows.length})</h2>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Movie</th>
                  <th>Theatre</th>
                  <th>Screen</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {shows.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.movie_title}</td>
                    <td>{s.theatre_name}</td>
                    <td>{s.screen_name}</td>
                    <td>{s.show_date}</td>
                    <td>{s.show_time.slice(0, 5)}</td>
                    <td>₹{Number(s.ticket_price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="panel table-responsive">
          <h2 style={{ marginBottom: 14 }}>All Customer Bookings ({bookings.length})</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Email</th>
                <th>Movie</th>
                <th>Theatre</th>
                <th>Show</th>
                <th>Seats</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td><strong>{b.booking_reference}</strong></td>
                  <td>{b.customer_name}</td>
                  <td>{b.customer_email}</td>
                  <td>{b.movie_title}</td>
                  <td>{b.theatre_name}</td>
                  <td>{b.show_date} {b.show_time.slice(0, 5)}</td>
                  <td>{b.seat_numbers || `${b.total_seats} (Released)`}</td>
                  <td>₹{Number(b.total_amount).toFixed(2)}</td>
                  <td>{b.booking_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
