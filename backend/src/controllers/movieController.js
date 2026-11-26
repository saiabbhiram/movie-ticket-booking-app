const pool = require('../config/db');
const { AppError } = require('../middleware/errorHandler');
const { isNonEmptyString, isPositiveInt } = require('../utils/validators');

/**
 * GET /api/movies
 * Optional query filters: search, genre, language, status
 */
async function getAllMovies(req, res, next) {
  try {
    const { search, genre, language, status } = req.query;
    const conditions = [];
    const params = [];

    if (search && search.trim()) {
      conditions.push('title LIKE ?');
      params.push(`%${search.trim()}%`);
    }
    if (genre && genre.trim() && genre !== 'All') {
      conditions.push('genre = ?');
      params.push(genre.trim());
    }
    if (language && language.trim() && language !== 'All') {
      conditions.push('language = ?');
      params.push(language.trim());
    }
    if (status && status.trim() && status !== 'All') {
      conditions.push('status = ?');
      params.push(status.trim());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM movies ${whereClause} ORDER BY status ASC, rating DESC, id DESC`;
    const [movies] = await pool.query(sql, params);

    res.json({ success: true, data: movies });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/movies/:id
 * Returns movie details along with available theatres and showtimes
 */
async function getMovieById(req, res, next) {
  try {
    const movieId = Number(req.params.id);
    if (!isPositiveInt(movieId)) {
      throw new AppError('Invalid movie ID.', 400);
    }

    const [movies] = await pool.query('SELECT * FROM movies WHERE id = ?', [movieId]);
    if (movies.length === 0) {
      throw new AppError('Movie not found.', 404);
    }

    const [shows] = await pool.query(
      `SELECT
         sh.id AS show_id,
         sh.show_date,
         sh.show_time,
         sh.ticket_price,
         sc.id AS screen_id,
         sc.screen_name,
         sc.total_seats,
         t.id AS theatre_id,
         t.theatre_name,
         t.city,
         t.location
       FROM shows sh
       INNER JOIN screens sc ON sh.screen_id = sc.id
       INNER JOIN theatres t ON sc.theatre_id = t.id
       WHERE sh.movie_id = ? AND sh.show_date >= CURDATE()
       ORDER BY sh.show_date ASC, t.theatre_name ASC, sh.show_time ASC`,
      [movieId]
    );

    res.json({
      success: true,
      data: {
        ...movies[0],
        shows,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/movies (Admin only)
 */
async function createMovie(req, res, next) {
  try {
    const {
      title,
      description,
      genre,
      language,
      duration,
      release_date,
      rating = 0,
      poster_url = '',
      status = 'Now Showing',
    } = req.body;

    if (
      !isNonEmptyString(title) ||
      !isNonEmptyString(description) ||
      !isNonEmptyString(genre) ||
      !isNonEmptyString(language) ||
      !isPositiveInt(duration) ||
      !isNonEmptyString(release_date)
    ) {
      throw new AppError(
        'Missing or invalid required fields: title, description, genre, language, duration, release_date.',
        400
      );
    }

    const validStatuses = ['Now Showing', 'Upcoming'];
    if (!validStatuses.includes(status)) {
      throw new AppError("Status must be 'Now Showing' or 'Upcoming'.", 400);
    }

    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 0 || numericRating > 10) {
      throw new AppError('Rating must be between 0 and 10.', 400);
    }

    const [result] = await pool.query(
      `INSERT INTO movies (title, description, genre, language, duration, release_date, rating, poster_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title.trim(),
        description.trim(),
        genre.trim(),
        language.trim(),
        Number(duration),
        release_date.trim(),
        numericRating,
        poster_url ? poster_url.trim() : null,
        status,
      ]
    );

    const [created] = await pool.query('SELECT * FROM movies WHERE id = ?', [result.insertId]);
    res.status(201).json({
      success: true,
      message: 'Movie added successfully.',
      data: created[0],
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/movies/:id (Admin only)
 */
async function updateMovie(req, res, next) {
  try {
    const movieId = Number(req.params.id);
    if (!isPositiveInt(movieId)) {
      throw new AppError('Invalid movie ID.', 400);
    }

    const [existing] = await pool.query('SELECT * FROM movies WHERE id = ?', [movieId]);
    if (existing.length === 0) {
      throw new AppError('Movie not found.', 404);
    }

    const current = existing[0];
    const {
      title = current.title,
      description = current.description,
      genre = current.genre,
      language = current.language,
      duration = current.duration,
      release_date = current.release_date,
      rating = current.rating,
      poster_url = current.poster_url,
      status = current.status,
    } = req.body;

    if (!isNonEmptyString(title) || !isPositiveInt(duration)) {
      throw new AppError('Invalid movie title or duration.', 400);
    }

    await pool.query(
      `UPDATE movies
       SET title = ?, description = ?, genre = ?, language = ?, duration = ?,
           release_date = ?, rating = ?, poster_url = ?, status = ?
       WHERE id = ?`,
      [
        title.trim(),
        String(description).trim(),
        String(genre).trim(),
        String(language).trim(),
        Number(duration),
        String(release_date).trim(),
        Number(rating),
        poster_url ? String(poster_url).trim() : null,
        status,
        movieId,
      ]
    );

    const [updated] = await pool.query('SELECT * FROM movies WHERE id = ?', [movieId]);
    res.json({
      success: true,
      message: 'Movie updated successfully.',
      data: updated[0],
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/movies/:id (Admin only)
 */
async function deleteMovie(req, res, next) {
  try {
    const movieId = Number(req.params.id);
    if (!isPositiveInt(movieId)) {
      throw new AppError('Invalid movie ID.', 400);
    }

    const [result] = await pool.query('DELETE FROM movies WHERE id = ?', [movieId]);
    if (result.affectedRows === 0) {
      throw new AppError('Movie not found.', 404);
    }

    res.json({
      success: true,
      message: 'Movie deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
};
