const express = require('express');
const {
  createBooking,
  getBookingsByEmail,
  getBookingByReference,
  cancelBooking,
} = require('../controllers/bookingController');

const router = express.Router();

router.post('/', createBooking);
router.get('/', getBookingsByEmail);
router.get('/:reference', getBookingByReference);
router.put('/:reference/cancel', cancelBooking);

module.exports = router;
