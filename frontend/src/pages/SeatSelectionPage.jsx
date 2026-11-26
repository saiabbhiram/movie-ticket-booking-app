import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchShowSeats } from '../services/api';
import SeatGrid from '../components/SeatGrid';

export default function SeatSelectionPage() {
  const { showId } = useParams();
  const navigate = useNavigate();
  const [show, setShow] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchShowSeats(showId)
      .then((res) => {
        if (active) {
          setShow(res.data.data.show);
          setSeats(res.data.data.seats || []);
        }
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || 'Failed to load seats.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [showId]);

  const handleToggleSeat = (seat) => {
    if (seat.is_booked) return;
    setSelectedSeats((prev) => {
      const exists = prev.some((s) => s.id === seat.id);
      if (exists) {
        return prev.filter((s) => s.id !== seat.id);
      }
      return [...prev, seat];
    });
  };

  const handleProceed = () => {
    if (!show || selectedSeats.length === 0) return;
    navigate(`/book/${show.id}`, {
      state: {
        show,
        selectedSeats,
      },
    });
  };

  if (loading) {
    return (
      <div className="container section">
        <p style={{ color: 'var(--text-secondary)' }}>Loading seat map...</p>
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="container section">
        <div className="alert alert-error">{error || 'Show not found.'}</div>
      </div>
    );
  }

  const ticketPrice = Number(show.ticket_price);
  const totalAmount = ticketPrice * selectedSeats.length;

  return (
    <div className="container section">
      <div className="section-header">
        <div>
          <h1 className="section-title">{show.movie_title}</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
            {show.theatre_name} ({show.location}, {show.city}) &bull; {show.screen_name} &bull;{' '}
            {show.show_date} at {show.show_time.slice(0, 5)}
          </p>
        </div>
      </div>

      <div className="seat-layout-wrap">
        <div className="panel">
          <SeatGrid
            seats={seats}
            selectedSeatIds={selectedSeats.map((s) => s.id)}
            onToggleSeat={handleToggleSeat}
          />
        </div>

        <div className="panel">
          <h2 style={{ marginBottom: 16 }}>Booking Summary</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.95rem' }}>
            <div>
              <strong>Movie:</strong> {show.movie_title}
            </div>
            <div>
              <strong>Theatre:</strong> {show.theatre_name}
            </div>
            <div>
              <strong>Date &amp; Time:</strong> {show.show_date} &bull; {show.show_time.slice(0, 5)}
            </div>
            <div>
              <strong>Price per Seat:</strong> ₹{ticketPrice.toFixed(2)}
            </div>
            <div>
              <strong>Selected Seats ({selectedSeats.length}):</strong>{' '}
              {selectedSeats.length > 0
                ? selectedSeats.map((s) => s.seat_number).join(', ')
                : 'None selected'}
            </div>
            <hr style={{ borderColor: 'var(--border-color)', margin: '8px 0' }} />
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              Total Amount: <span style={{ color: 'var(--accent-red)' }}>₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 20 }}
            disabled={selectedSeats.length === 0}
            onClick={handleProceed}
          >
            Proceed to Booking
          </button>
        </div>
      </div>
    </div>
  );
}
