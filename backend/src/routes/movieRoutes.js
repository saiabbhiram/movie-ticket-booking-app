const express = require('express');
const {
  getAllMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
} = require('../controllers/movieController');
const { authenticateAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getAllMovies);
router.get('/:id', getMovieById);
router.post('/', authenticateAdmin, createMovie);
router.put('/:id', authenticateAdmin, updateMovie);
router.delete('/:id', authenticateAdmin, deleteMovie);

module.exports = router;
