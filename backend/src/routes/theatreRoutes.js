const express = require('express');
const {
  getAllTheatres,
  getTheatreById,
  createTheatre,
} = require('../controllers/theatreController');
const { authenticateAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getAllTheatres);
router.get('/:id', getTheatreById);
router.post('/', authenticateAdmin, createTheatre);

module.exports = router;
