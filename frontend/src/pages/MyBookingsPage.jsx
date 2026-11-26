import { useState } from 'react';
import {
  cancelBooking,
  fetchBookingByReference,
  fetchBookingsByEmail,
} from '../services/api';

export default function MyBookingsPage() {
  const [searchMode, setSearchMode] = useState('reference');
  const [query, setQuery] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (searchMode === 'reference') {
        const res = await fetchBookingByReference(query.trim());
        setBookings(res.data.data ? [res.data.data] : []);
      } else {
        const res = await fetchBookingsByEmail(query.trim());
        setBookings(res.data.data || []);
      }
    } catch (err) {
      setBookings([]);
      setError(err.response?.data?.message || 'No matching bookings found.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (reference) => {
    if (!window.confirm(`Cancel booking ${reference} and release its seats?`)) return;
    setError('');
    setMessage('');

    try {
      const res = await cancelBooking(reference);
      setMessage(res.data.message);
      setBookings((prev) =>
        prev.map((b) => (b.booking_reference === reference ? res.data.data : b))
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  return (
    <div className="container section">
      <div className="section-header">
        <h1 className="section-title">My Bookings</h1>
      </div>

      <form className="filter-bar" onSubmit={handleSearch}>
        <select
          className="form-select"
          value={searchMode}
          onChange={(e) => setSearchMode(e.target.value)}
        >
          <option value="reference">Booking Reference</option>
          <option value="email">Email Address</option>
        </select>

        <input
          type={searchMode === 'email' ? 'email' : 'text'}
          className="form-control"
          style={{ flex: 1, minWidth: 240 }}
          placeholder={
            searchMode === 'reference'
              ? 'Enter booking reference (e.g. CB-DEMO01)'
              : 'Enter email (e.g. aarav@example.com)'
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          required
        />

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Searching...' : 'Find Bookings'}
        </button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}

      {bookings.length > 0 && (
        <div style={{ display: 'grid', gap: 16 }}>
          {bookings.map((booking) => (
            <div key={booking.id} className="panel">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div>
                  <h3>{booking.movie_title}</h3>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Reference: <strong>{booking.booking_reference}</strong>
                  </span>
                </div>
                <span
                  className="tag"
                  style={{
                    color: booking.booking_status === 'CONFIRMED' ? '#4ade80' : '#fca5a5',
                    borderColor: booking.booking_status === 'CONFIRMED' ? '#22c55e' : '#ef4444',
                  }}
                >
                  {booking.booking_status}
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 10,
                  fontSize: '0.92rem',
                  marginBottom: 16,
                }}
              >
                <div><strong>Customer:</strong> {booking.customer_name}</div>
                <div><strong>Theatre:</strong> {booking.theatre_name} ({booking.city})</div>
                <div><strong>Date &amp; Time:</strong> {booking.show_date} &bull; {booking.show_time.slice(0, 5)}</div>
                <div>
                  <strong>Seats:</strong>{' '}
                  {booking.seat_numbers || `${booking.total_seats} seat(s) (Released)`}
                </div>
                <div><strong>Total Amount:</strong> ₹{Number(booking.total_amount).toFixed(2)}</div>
              </div>

              {booking.booking_status === 'CONFIRMED' && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => handleCancel(booking.booking_reference)}
                >
                  Cancel Booking
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
