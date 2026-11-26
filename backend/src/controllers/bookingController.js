const crypto = require('crypto');
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { isNonEmptyString, isValidEmail, isPositiveInt } = require('../utils/validators');

function generateBookingReference() {
  return `CB-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

const BOOKING_SELECT = `
  SELECT
    b.id,
    b.booking_reference,
    b.customer_name,
    b.customer_email,
    b.customer_phone,
    b.show_id,
    b.total_seats,
    b.total_amount,
    b.booking_status,
    b.created_at,
    sh.show_date,
    sh.show_time,
    sh.ticket_price,
    m.id AS movie_id,
    m.title AS movie_title,
    m.poster_url,
    m.language,
    m.duration,
    sc.screen_name,
    t.theatre_name,
    t.city,
    t.location,
    GROUP_CONCAT(s.seat_number ORDER BY LEFT(s.seat_number, 1), CAST(SUBSTRING(s.seat_number, 2) AS UNSIGNED) SEPARATOR ', ') AS seat_numbers
  FROM bookings b
  INNER JOIN shows sh ON b.show_id = sh.id
  INNER JOIN movies m ON sh.movie_id = m.id
  INNER JOIN screens sc ON sh.screen_id = sc.id
  INNER JOIN theatres t ON sc.theatre_id = t.id
  LEFT JOIN booking_seats bs ON b.id = bs.booking_id
  LEFT JOIN seats s ON bs.seat_id = s.id
`;

/**
 * POST /api/bookings
 * Transactional booking creation with row-level locking to prevent double booking.
 */
async function createBooking(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      show_id,
      seat_ids,
    } = req.body;

    if (!isNonEmptyString(customer_name) || !isValidEmail(customer_email) || !isNonEmptyString(customer_phone)) {
      throw new AppError('Valid customer_name, customer_email, and customer_phone are required.', 400);
    }
    if (!isPositiveInt(show_id)) {
      throw new AppError('Valid show_id is required.', 400);
    }
    if (!Array.isArray(seat_ids) || seat_ids.length === 0) {
      throw new AppError('Please select at least one seat.', 400);
    }

    const uniqueSeatIds = [...new Set(seat_ids.map(Number))];
    if (uniqueSeatIds.some((id) => !isPositiveInt(id))) {
      throw new AppError('Invalid seat ID in selection.', 400);
    }

    await connection.beginTransaction();

    // 1. Lock the show row
    const [shows] = await connection.query(
      'SELECT id, screen_id, ticket_price, show_date, show_time FROM shows WHERE id = ? FOR UPDATE',
      [Number(show_id)]
    );
    if (shows.length === 0) {
      throw new AppError('Show not found.', 404);
    }
    const show = shows[0];

    // 2. Verify all selected seats belong to this show's screen and lock them
    const [validSeats] = await connection.query(
      'SELECT id, seat_number FROM seats WHERE screen_id = ? AND id IN (?) FOR UPDATE',
      [show.screen_id, uniqueSeatIds]
    );
    if (validSeats.length !== uniqueSeatIds.length) {
      throw new AppError('One or more selected seats do not belong to this screen.', 400);
    }

    // 3. Check if any of these seats are already booked for this show (row-level lock)
    const [alreadyBooked] = await connection.query(
      'SELECT seat_id FROM booking_seats WHERE show_id = ? AND seat_id IN (?) FOR UPDATE',
      [show.id, uniqueSeatIds]
    );
    if (alreadyBooked.length > 0) {
      throw new AppError('One or more selected seats are already booked. Please choose different seats.', 409);
    }

    // 4. Compute totals & generate unique booking reference
    const ticketPrice = Number(show.ticket_price);
    const totalSeats = uniqueSeatIds.length;
    const totalAmount = Number((ticketPrice * totalSeats).toFixed(2));
    const bookingReference = generateBookingReference();

    const [bookingResult] = await connection.query(
      `INSERT INTO bookings
        (booking_reference, customer_name, customer_email, customer_phone, show_id, total_seats, total_amount, booking_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')`,
      [
        bookingReference,
        customer_name.trim(),
        customer_email.trim().toLowerCase(),
        customer_phone.trim(),
        show.id,
        totalSeats,
        totalAmount,
      ]
    );

    const bookingId = bookingResult.insertId;
    const bookingSeatRows = uniqueSeatIds.map((seatId) => [
      bookingId,
      show.id,
      seatId,
      ticketPrice,
    ]);

    await connection.query(
      'INSERT INTO booking_seats (booking_id, show_id, seat_id, ticket_price) VALUES ?',
      [bookingSeatRows]
    );

    await connection.commit();

    const [createdRows] = await pool.query(
      `${BOOKING_SELECT} WHERE b.id = ? GROUP BY b.id`,
      [bookingId]
    );

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      data: createdRows[0],
    });
  } catch (err) {
    await connection.rollback();
    if (err.code === 'ER_DUP_ENTRY') {
      return next(new AppError('Seat was just booked by another user. Please select another seat.', 409));
    }
    next(err);
  } finally {
    connection.release();
  }
}

/**
 * GET /api/bookings?email=user@example.com
 */
async function getBookingsByEmail(req, res, next) {
  try {
    const { email } = req.query;
    if (!isValidEmail(email)) {
      throw new AppError('Please provide a valid email query parameter.', 400);
    }

    const [rows] = await pool.query(
      `${BOOKING_SELECT} WHERE b.customer_email = ? GROUP BY b.id ORDER BY b.created_at DESC`,
      [email.trim().toLowerCase()]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/bookings/:reference
 */
async function getBookingByReference(req, res, next) {
  try {
    const { reference } = req.params;
    if (!isNonEmptyString(reference)) {
      throw new AppError('Booking reference is required.', 400);
    }

    const [rows] = await pool.query(
      `${BOOKING_SELECT} WHERE b.booking_reference = ? GROUP BY b.id`,
      [reference.trim().toUpperCase()]
    );

    if (rows.length === 0) {
      throw new AppError('Booking not found.', 404);
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/bookings/:reference/cancel
 * Cancels a booking inside a transaction and releases all associated seats.
 */
async function cancelBooking(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const { reference } = req.params;
    if (!isNonEmptyString(reference)) {
      throw new AppError('Booking reference is required.', 400);
    }

    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT b.id, b.booking_status, sh.show_date, sh.show_time
       FROM bookings b
       INNER JOIN shows sh ON b.show_id = sh.id
       WHERE b.booking_reference = ? FOR UPDATE`,
      [reference.trim().toUpperCase()]
    );

    if (rows.length === 0) {
      throw new AppError('Booking not found.', 404);
    }

    const booking = rows[0];
    if (booking.booking_status === 'CANCELLED') {
      throw new AppError('This booking is already cancelled.', 400);
    }

    // Check if showtime has already passed
    const showDateTime = new Date(`${booking.show_date}T${booking.show_time}`);
    if (!Number.isNaN(showDateTime.getTime()) && showDateTime <= new Date()) {
      throw new AppError('Cannot cancel booking after the showtime has started.', 400);
    }

    await connection.query(
      "UPDATE bookings SET booking_status = 'CANCELLED' WHERE id = ?",
      [booking.id]
    );

    // Release associated seats so they become available again
    await connection.query('DELETE FROM booking_seats WHERE booking_id = ?', [booking.id]);

    await connection.commit();

    const [updatedRows] = await pool.query(
      `${BOOKING_SELECT} WHERE b.id = ? GROUP BY b.id`,
      [booking.id]
    );

    res.json({
      success: true,
      message: 'Booking cancelled and seats released successfully.',
      data: updatedRows[0],
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

module.exports = {
  createBooking,
  getBookingsByEmail,
  getBookingByReference,
  cancelBooking,
};
