const express = require('express');
const {
  getPendingVenues,
  approveVenue,
  rejectVenue,
  suspendVenue,
  getCommissionSettings,
  updateCommissionRate,
  getEarningsReport,
  getDashboardStats
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes are admin only
router.use(protect);
router.use(authorize('admin'));

router.get('/venues/pending', getPendingVenues);
router.put('/venues/:id/approve', approveVenue);
router.put('/venues/:id/reject', rejectVenue);
router.put('/venues/:id/suspend', suspendVenue);

router.route('/commission')
  .get(getCommissionSettings)
  .put(updateCommissionRate);

router.get('/earnings', getEarningsReport);
router.get('/stats', getDashboardStats);

module.exports = router;
