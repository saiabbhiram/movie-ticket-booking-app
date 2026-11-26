export default function SeatGrid({ seats, selectedSeatIds, onToggleSeat }) {
  // Group seats by row letter (e.g., A, B, C, D, E)
  const rowsMap = seats.reduce((acc, seat) => {
    const rowLetter = seat.seat_number.charAt(0);
    if (!acc[rowLetter]) acc[rowLetter] = [];
    acc[rowLetter].push(seat);
    return acc;
  }, {});

  const rowLetters = Object.keys(rowsMap).sort();

  return (
    <div>
      <div className="screen-curve">All Eyes This Way &bull; Screen</div>

      <div className="seat-grid">
        {rowLetters.map((rowLetter) => (
          <div key={rowLetter} className="seat-row">
            <span className="seat-row-label">{rowLetter}</span>
            {rowsMap[rowLetter].map((seat) => {
              const isSelected = selectedSeatIds.includes(seat.id);
              const statusClass = seat.is_booked
                ? 'booked'
                : isSelected
                ? 'selected'
                : 'available';

              return (
                <button
                  key={seat.id}
                  type="button"
                  disabled={seat.is_booked}
                  className={`seat-btn ${statusClass}`}
                  title={`${seat.seat_number} (${seat.seat_type})${seat.is_booked ? ' - Booked' : ''}`}
                  onClick={() => onToggleSeat(seat)}
                >
                  {seat.seat_number}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="seat-legend">
        <div className="legend-item">
          <span className="legend-box" style={{ background: 'var(--seat-available)' }} />
          Available
        </div>
        <div className="legend-item">
          <span className="legend-box" style={{ background: 'var(--seat-selected)' }} />
          Selected
        </div>
        <div className="legend-item">
          <span className="legend-box" style={{ background: 'var(--seat-booked)' }} />
          Booked
        </div>
      </div>
    </div>
  );
}
