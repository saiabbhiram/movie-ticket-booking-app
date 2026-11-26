const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { isNonEmptyString, isPositiveInt, isPositiveNumber } = require('../utils/validators');

const SHOW_BASE_SELECT = `
  SELECT
    sh.id,
    sh.movie_id,
    sh.screen_id,
    sh.show_date,
    sh.show_time,
    sh.ticket_price,
    m.title AS movie_title,
    m.genre,
    m.language,
    m.duration,
    m.poster_url,
    sc.screen_name,
    sc.total_seats,
    t.id AS theatre_id,
    t.theatre_name,
    t.city,
    t.location
  FROM shows sh
  INNER JOIN movies m ON sh.movie_id = m.id
  INNER JOIN screens sc ON sh.screen_id = sc.id
  INNER JOIN theatres t ON sc.theatre_id = t.id
`;

/**
 * GET /api/shows
 */
async function getAllShows(req, res, next) {
  try {
    const [shows] = await pool.query(
      `${SHOW_BASE_SELECT} ORDER BY sh.show_date ASC, sh.show_time ASC`
    );
    res.json({ success: true, data: shows });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/shows/search
 * Query params: movieId, city, theatreId, date
 */
async function searchShows(req, res, next) {
  try {
    const { movieId, city, theatreId, date } = req.query;
    const conditions = ['sh.show_date >= CURDATE()'];
    const params = [];

    if (movieId && isPositiveInt(movieId)) {
      conditions.push('sh.movie_id = ?');
      params.push(Number(movieId));
    }
    if (city && city.trim() && city !== 'All') {
      conditions.push('t.city = ?');
      params.push(city.trim());
    }
    if (theatreId && isPositiveInt(theatreId)) {
      conditions.push('t.id = ?');
      params.push(Number(theatreId));
    }
    if (date && date.trim()) {
      conditions.push('sh.show_date = ?');
      params.push(date.trim());
    }

    const sql = `${SHOW_BASE_SELECT} WHERE ${conditions.join(' AND ')} ORDER BY sh.show_date ASC, t.theatre_name ASC, sh.show_time ASC`;
    const [shows] = await pool.query(sql, params);
    res.json({ success: true, data: shows });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/shows/:id
 */
async function getShowById(req, res, next) {
  try {
    const showId = Number(req.params.id);
    if (!isPositiveInt(showId)) {
      throw new AppError('Invalid show ID.', 400);
    }

    const [shows] = await pool.query(`${SHOW_BASE_SELECT} WHERE sh.id = ?`, [showId]);
    if (shows.length === 0) {
      throw new AppError('Show not found.', 404);
    }

    res.json({ success: true, data: shows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/shows/:id/seats
 * Returns all seats for the show's screen along with live booking availability.
 */
async function getShowSeats(req, res, next) {
  try {
    const showId = Number(req.params.id);
    if (!isPositiveInt(showId)) {
      throw new AppError('Invalid show ID.', 400);
    }

    const [shows] = await pool.query(`${SHOW_BASE_SELECT} WHERE sh.id = ?`, [showId]);
    if (shows.length === 0) {
      throw new AppError('Show not found.', 404);
    }
    const show = shows[0];

    const [seats] = await pool.query(
      `SELECT
         s.id,
         s.screen_id,
         s.seat_number,
         s.seat_type,
         CASE WHEN bs.id IS NOT NULL THEN 1 ELSE 0 END AS is_booked
       FROM seats s
       LEFT JOIN booking_seats bs
         ON s.id = bs.seat_id AND bs.show_id = ?
       WHERE s.screen_id = ?
       ORDER BY LEFT(s.seat_number, 1) ASC, CAST(SUBSTRING(s.seat_number, 2) AS UNSIGNED) ASC`,
      [showId, show.screen_id]
    );

    res.json({
      success: true,
      data: {
        show,
        seats: seats.map((seat) => ({
          ...seat,
          is_booked: Boolean(seat.is_booked),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/shows (Admin only)
 */
async function createShow(req, res, next) {
  try {
    const { movie_id, screen_id, show_date, show_time, ticket_price } = req.body;

    if (
      !isPositiveInt(movie_id) ||
      !isPositiveInt(screen_id) ||
      !isNonEmptyString(show_date) ||
      !isNonEmptyString(show_time) ||
      !isPositiveNumber(ticket_price)
    ) {
      throw new AppError(
        'movie_id, screen_id, show_date, show_time, and positive ticket_price are required.',
        400
      );
    }

    const [result] = await pool.query(
      `INSERT INTO shows (movie_id, screen_id, show_date, show_time, ticket_price)
       VALUES (?, ?, ?, ?, ?)`,
      [Number(movie_id), Number(screen_id), show_date.trim(), show_time.trim(), Number(ticket_price)]
    );

    const [created] = await pool.query(`${SHOW_BASE_SELECT} WHERE sh.id = ?`, [result.insertId]);
    res.status(201).json({
      success: true,
      message: 'Showtime created successfully.',
      data: created[0],
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return next(new AppError('A show is already scheduled for this screen at the same date and time.', 409));
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return next(new AppError('Invalid movie_id or screen_id.', 400));
    }
    next(err);
  }
}

module.exports = {
  getAllShows,
  searchShows,
  getShowById,
  getShowSeats,
  createShow,
};
