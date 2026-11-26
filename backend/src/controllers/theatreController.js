const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { isNonEmptyString, isPositiveInt } = require('../utils/validators');

/**
 * GET /api/theatres
 * Optional query: ?city=Hyderabad
 */
async function getAllTheatres(req, res, next) {
  try {
    const { city } = req.query;
    const params = [];
    let sql = `
      SELECT t.*,
        (SELECT COUNT(*) FROM screens s WHERE s.theatre_id = t.id) AS screen_count
      FROM theatres t
    `;

    if (city && city.trim() && city !== 'All') {
      sql += ' WHERE t.city = ?';
      params.push(city.trim());
    }
    sql += ' ORDER BY t.city ASC, t.theatre_name ASC';

    const [theatres] = await pool.query(sql, params);

    // Attach screens for each theatre so admin/show forms can select screen_id easily
    const [screens] = await pool.query('SELECT * FROM screens ORDER BY id ASC');
    const screensByTheatre = screens.reduce((acc, sc) => {
      if (!acc[sc.theatre_id]) acc[sc.theatre_id] = [];
      acc[sc.theatre_id].push(sc);
      return acc;
    }, {});

    const enriched = theatres.map((t) => ({
      ...t,
      screens: screensByTheatre[t.id] || [],
    }));

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/theatres/:id
 */
async function getTheatreById(req, res, next) {
  try {
    const theatreId = Number(req.params.id);
    if (!isPositiveInt(theatreId)) {
      throw new AppError('Invalid theatre ID.', 400);
    }

    const [theatres] = await pool.query('SELECT * FROM theatres WHERE id = ?', [theatreId]);
    if (theatres.length === 0) {
      throw new AppError('Theatre not found.', 404);
    }

    const [screens] = await pool.query('SELECT * FROM screens WHERE theatre_id = ?', [theatreId]);
    res.json({
      success: true,
      data: {
        ...theatres[0],
        screens,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/theatres (Admin only)
 * Automatically creates a default Screen 1 with 50 seats (A1-E10) so the theatre
 * can immediately be used for scheduling showtimes.
 */
async function createTheatre(req, res, next) {
  const connection = await pool.getConnection();
  try {
    const {
      theatre_name,
      city,
      location,
      screen_name = 'Screen 1',
    } = req.body;

    if (!isNonEmptyString(theatre_name) || !isNonEmptyString(city) || !isNonEmptyString(location)) {
      throw new AppError('theatre_name, city, and location are required.', 400);
    }

    await connection.beginTransaction();

    const [theatreRes] = await connection.query(
      'INSERT INTO theatres (theatre_name, city, location) VALUES (?, ?, ?)',
      [theatre_name.trim(), city.trim(), location.trim()]
    );
    const theatreId = theatreRes.insertId;

    const [screenRes] = await connection.query(
      'INSERT INTO screens (theatre_id, screen_name, total_seats) VALUES (?, ?, 50)',
      [theatreId, screen_name.trim()]
    );
    const screenId = screenRes.insertId;

    // Generate 50 seats (A1..E10) for the new screen
    const rows = ['A', 'B', 'C', 'D', 'E'];
    const seatValues = [];
    for (const row of rows) {
      const seatType = row === 'A' || row === 'B' ? 'Regular' : row === 'C' || row === 'D' ? 'Premium' : 'VIP';
      for (let col = 1; col <= 10; col++) {
        seatValues.push([screenId, `${row}${col}`, seatType]);
      }
    }
    await connection.query(
      'INSERT INTO seats (screen_id, seat_number, seat_type) VALUES ?',
      [seatValues]
    );

    await connection.commit();

    const [created] = await pool.query('SELECT * FROM theatres WHERE id = ?', [theatreId]);
    const [screens] = await pool.query('SELECT * FROM screens WHERE theatre_id = ?', [theatreId]);

    res.status(201).json({
      success: true,
      message: 'Theatre and default screen created successfully.',
      data: {
        ...created[0],
        screens,
      },
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

module.exports = {
  getAllTheatres,
  getTheatreById,
  createTheatre,
};
