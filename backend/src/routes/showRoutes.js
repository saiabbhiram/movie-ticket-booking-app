const express = require('express');
const {
  getAllShows,
  searchShows,
  getShowById,
  getShowSeats,
  createShow,
} = require('../controllers/showController');
const { authenticateAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getAllShows);
router.get('/search', searchShows);
router.get('/:id/seats', getShowSeats);
router.get('/:id', getShowById);
router.post('/', authenticateAdmin, createShow);

module.exports = router;
