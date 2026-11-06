const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const offlineBookingController = require('../controllers/offlineBookingController');

// All offline booking routes require authentication as owner, admin, or subadmin
router.use(protect);
router.use(authorize('owner', 'admin', 'subadmin'));

// Customer lookup by 10-digit phone
router.get('/lookup-customer', offlineBookingController.lookupCustomer);

// Check date & slot availability
router.post('/check-availability', offlineBookingController.checkAvailability);

// Dashboard overview & statistics
router.get('/stats', offlineBookingController.getOfflineStats);

// Export reports (CSV)
router.get('/reports/export', offlineBookingController.exportReports);

// Offline bookings CRUD & actions
router.post('/', offlineBookingController.createOfflineBooking);
router.get('/', offlineBookingController.getOfflineBookings);
router.get('/:id', offlineBookingController.getOfflineBookingById);
router.put('/:id', offlineBookingController.updateOfflineBooking);
router.post('/:id/payments', offlineBookingController.recordPayment);
router.post('/:id/cancel', offlineBookingController.cancelOfflineBooking);

module.exports = router;
