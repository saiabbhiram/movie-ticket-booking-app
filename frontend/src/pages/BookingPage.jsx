import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { createBooking } from '../services/api';

export default function BookingPage() {
  const { showId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const stateData = location.state || {};
  const show = stateData.show;
  const selectedSeats = stateData.selectedSeats || [];

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  if (!show || selectedSeats.length === 0) {
    return (
      <div className="container section">
        <div className="panel">
          <h2 style={{ marginBottom: 10 }}>No Seats Selected</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Please select your seats before proceeding to booking.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate(`/shows/${showId}/seats`)}
          >
            Go to Seat Selection
          </button>
        </div>
      </div>
    );
  }

  const ticketPrice = Number(show.ticket_price);
  const totalAmount = ticketPrice * selectedSeats.length;

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await createBooking({
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        show_id: Number(show.id),
        seat_ids: selectedSeats.map((s) => s.id),
      });
      setConfirmedBooking(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedBooking) {
    return (
      <div className="container section">
        <div className="panel" style={{ maxWidth: 680, margin: '0 auto' }}>
          <div className="alert alert-success">
            <strong>Booking Confirmed!</strong> Your tickets have been reserved.
          </div>

          <h1 style={{ marginBottom: 8 }}>Booking Reference: {confirmedBooking.booking_reference}</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            Keep this reference number handy to view or cancel your booking in My Bookings.
          </p>

          <div style={{ display: 'grid', gap: 10, fontSize: '0.98rem', marginBottom: 24 }}>
            <div><strong>Customer:</strong> {confirmedBooking.customer_name} ({confirmedBooking.customer_email})</div>
            <div><strong>Movie:</strong> {confirmedBooking.movie_title}</div>
            <div><strong>Theatre:</strong> {confirmedBooking.theatre_name}, {confirmedBooking.location}</div>
            <div><strong>Screen:</strong> {confirmedBooking.screen_name}</div>
            <div><strong>Date &amp; Time:</strong> {confirmedBooking.show_date} at {confirmedBooking.show_time.slice(0, 5)}</div>
            <div><strong>Seats:</strong> {confirmedBooking.seat_numbers}</div>
            <div><strong>Total Paid:</strong> ₹{Number(confirmedBooking.total_amount).toFixed(2)}</div>
            <div><strong>Status:</strong> {confirmedBooking.booking_status}</div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/my-bookings" className="btn btn-primary">
              Go to My Bookings
            </Link>
            <Link to="/" className="btn btn-secondary">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container section">
      <div className="section-header">
        <h1 className="section-title">Complete Your Booking</h1>
      </div>

      <div className="seat-layout-wrap">
        <form className="panel" onSubmit={handleConfirmBooking}>
          <h2 style={{ marginBottom: 18 }}>Customer Details</h2>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="customerName">Full Name</label>
            <input
              id="customerName"
              type="text"
              className="form-control"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="customerEmail">Email Address</label>
            <input
              id="customerEmail"
              type="email"
              className="form-control"
              required
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="customerPhone">Phone Number</label>
            <input
              id="customerPhone"
              type="tel"
              className="form-control"
              required
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="9876543210"
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
            {submitting ? 'Confirming Booking...' : 'Confirm Booking'}
          </button>
        </form>

        <div className="panel">
          <h2 style={{ marginBottom: 16 }}>Ticket Summary</h2>
          <div style={{ display: 'grid', gap: 10, fontSize: '0.95rem' }}>
            <div><strong>Movie:</strong> {show.movie_title}</div>
            <div><strong>Theatre:</strong> {show.theatre_name} ({show.city})</div>
            <div><strong>Show Date:</strong> {show.show_date}</div>
            <div><strong>Showtime:</strong> {show.show_time.slice(0, 5)}</div>
            <div><strong>Selected Seats:</strong> {selectedSeats.map((s) => s.seat_number).join(', ')}</div>
            <div><strong>Number of Tickets:</strong> {selectedSeats.length}</div>
            <hr style={{ borderColor: 'var(--border-color)', margin: '8px 0' }} />
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              Total Amount: <span style={{ color: 'var(--accent-red)' }}>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
