const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const { isNonEmptyString } = require('../utils/validators');

/**
 * POST /api/admin/login
 */
async function adminLogin(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!isNonEmptyString(username) || !isNonEmptyString(password)) {
      throw new AppError('Username and password are required.', 400);
    }

    const [admins] = await pool.query('SELECT * FROM admin WHERE username = ?', [username.trim()]);
    if (admins.length === 0) {
      throw new AppError('Invalid username or password.', 401);
    }

    const admin = admins[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      throw new AppError('Invalid username or password.', 401);
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: 'admin' },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: 'Admin login successful.',
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/dashboard (Admin only)
 */
async function getDashboardStats(req, res, next) {
  try {
    const [[movieStats]] = await pool.query('SELECT COUNT(*) AS total_movies FROM movies');
    const [[theatreStats]] = await pool.query('SELECT COUNT(*) AS total_theatres FROM theatres');
    const [[showStats]] = await pool.query('SELECT COUNT(*) AS total_shows FROM shows');
    const [[bookingStats]] = await pool.query(`
      SELECT
        COUNT(*) AS total_bookings,
        SUM(CASE WHEN booking_status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed_bookings,
        SUM(CASE WHEN booking_status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_bookings,
        COALESCE(SUM(CASE WHEN booking_status = 'CONFIRMED' THEN total_amount ELSE 0 END), 0) AS total_revenue
      FROM bookings
    `);

    res.json({
      success: true,
      data: {
        total_movies: Number(movieStats.total_movies),
        total_theatres: Number(theatreStats.total_theatres),
        total_shows: Number(showStats.total_shows),
        total_bookings: Number(bookingStats.total_bookings),
        confirmed_bookings: Number(bookingStats.confirmed_bookings || 0),
        cancelled_bookings: Number(bookingStats.cancelled_bookings || 0),
        total_revenue: Number(bookingStats.total_revenue || 0),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/bookings (Admin only)
 */
async function getAllBookings(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT
        b.*,
        sh.show_date,
        sh.show_time,
        m.title AS movie_title,
        t.theatre_name,
        t.city,
        sc.screen_name,
        GROUP_CONCAT(s.seat_number ORDER BY LEFT(s.seat_number, 1), CAST(SUBSTRING(s.seat_number, 2) AS UNSIGNED) SEPARATOR ', ') AS seat_numbers
      FROM bookings b
      INNER JOIN shows sh ON b.show_id = sh.id
      INNER JOIN movies m ON sh.movie_id = m.id
      INNER JOIN screens sc ON sh.screen_id = sc.id
      INNER JOIN theatres t ON sc.theatre_id = t.id
      LEFT JOIN booking_seats bs ON b.id = bs.booking_id
      LEFT JOIN seats s ON bs.seat_id = s.id
      GROUP BY b.id
      ORDER BY b.created_at DESC
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  adminLogin,
  getDashboardStats,
  getAllBookings,
};
