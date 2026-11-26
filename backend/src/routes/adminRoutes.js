const express = require('express');
const {
  adminLogin,
  getDashboardStats,
  getAllBookings,
} = require('../controllers/adminController');
const { authenticateAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', adminLogin);
router.get('/dashboard', authenticateAdmin, getDashboardStats);
router.get('/bookings', authenticateAdmin, getAllBookings);

module.exports = router;
