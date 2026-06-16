const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI;
console.log('Connecting to:', MONGODB_URI);

const User = require('../models/User');
const Venue = require('../models/Venue');
const Booking = require('../models/Booking');
const ServiceBooking = require('../models/ServiceBooking');
const VendorService = require('../models/VendorService');

async function test() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to Database successfully.');

    const dateFilter = { createdAt: { $gte: new Date(0), $lte: new Date() } };

    console.log('1. Fetching all Bookings with populated venue and owner...');
    const allBookings = await Booking.find(dateFilter)
      .populate({
        path: 'venue',
        select: 'businessName location owner',
        populate: { path: 'owner', select: 'name email' }
      })
      .populate('customer', 'name email');
    console.log('Successfully fetched bookings. Count:', allBookings.length);

    console.log('2. Filtering paid bookings...');
    const paidBookings = allBookings.filter(b => b.paymentStatus === 'paid');
    console.log('Paid bookings count:', paidBookings.length);

    console.log('3. Mapping venue records...');
    const venueRecords = paidBookings
      .filter(b => b.status === 'completed')
      .map(b => ({
        id: b._id,
        bookingNumber: b.bookingNumber,
        type: 'venue',
        businessName: b.venue?.businessName || 'N/A',
        partnerName: b.venue?.owner?.name || 'N/A',
        partnerEmail: b.venue?.owner?.email || 'N/A',
        totalAmount: b.amount || 0,
        payoutAmount: b.ownerEarnings || 0,
        settlementStatus: b.settlementStatus || 'unsettled',
        settlementDetails: b.settlementDetails || {},
        completedAt: b.settlementDetails?.settledAt || b.updatedAt,
        createdAt: b.createdAt
      }));
    console.log('Successfully mapped venue records. Count:', venueRecords.length);

    console.log('4. Fetching service bookings...');
    const allSvcBookings = await ServiceBooking.find(dateFilter).populate('vendor', 'name email').populate('service', 'title category');
    const paidSvcBookings = allSvcBookings.filter(b => b.paymentStatus === 'paid');
    console.log('Paid service bookings count:', paidSvcBookings.length);

    console.log('5. Mapping service records...');
    const getSvcPayout = (b) => {
      const total = Number(b.pricing?.total ?? b.amount ?? 0);
      const platformFee = Number(b.pricing?.platformFee ?? 0);
      const platformFeeGST = Number(b.pricing?.platformFeeGST ?? 0);
      return Math.max(0, total - platformFee - platformFeeGST);
    };

    const serviceRecords = paidSvcBookings
      .filter(b => b.status === 'completed')
      .map(b => ({
        id: b._id,
        bookingNumber: b.bookingNumber,
        type: 'service',
        businessName: b.serviceSnapshot?.title || b.service?.title || 'N/A',
        partnerName: b.vendor?.name || 'N/A',
        partnerEmail: b.vendor?.email || 'N/A',
        totalAmount: Number(b.pricing?.total ?? b.amount ?? 0),
        payoutAmount: getSvcPayout(b),
        settlementStatus: b.settlementStatus || 'unsettled',
        settlementDetails: b.settlementDetails || {},
        completedAt: b.settlementDetails?.settledAt || b.updatedAt,
        createdAt: b.createdAt
      }));
    console.log('Successfully mapped service records. Count:', serviceRecords.length);

    const settlementRecords = [...venueRecords, ...serviceRecords]
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    console.log('Successfully merged and sorted records. Count:', settlementRecords.length);

    console.log('6. Running Top Owners by Earnings calculation...');
    const ownerEarningsMap = {};
    paidBookings.forEach(b => {
      const ownerId = b.venue?.owner?._id?.toString() || b.venue?.owner?.toString();
      if (!ownerId) return;
      if (!ownerEarningsMap[ownerId]) ownerEarningsMap[ownerId] = { earnings: 0, bookings: 0 };
      ownerEarningsMap[ownerId].earnings += b.ownerEarnings || 0;
      ownerEarningsMap[ownerId].bookings += 1;
    });
    console.log('ownerIds keys:', Object.keys(ownerEarningsMap));
    const ownerIds = Object.keys(ownerEarningsMap);
    const ownerUsers = ownerIds.length ? await User.find({ _id: { $in: ownerIds } }, 'name email') : [];
    console.log('Successfully fetched owner users. Count:', ownerUsers.length);

  } catch (err) {
    console.error('CRASH ERROR:', err);
  } finally {
    await mongoose.connection.close();
    console.log('Closed Database connection.');
  }
}

test();
