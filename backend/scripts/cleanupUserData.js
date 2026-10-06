/**
 * Reusable User Cleanup Script for RentalMeet
 * 
 * Usage:
 *   node scripts/cleanupUserData.js <email>
 *   node scripts/cleanupUserData.js <email> --dry-run
 * 
 * Example:
 *   node scripts/cleanupUserData.js tatkalkhabar24@gmail.com
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');

// Import all relevant models
const User = require('../models/User');
const Venue = require('../models/Venue');
const Booking = require('../models/Booking');
const AmbassadorProfile = require('../models/AmbassadorProfile');
const AmbassadorPayout = require('../models/AmbassadorPayout');
const AmbassadorReward = require('../models/AmbassadorReward');
const VendorProfile = require('../models/VendorProfile');
const VendorService = require('../models/VendorService');
const ServiceBooking = require('../models/ServiceBooking');
const Review = require('../models/Review');
const VenueReview = require('../models/VenueReview');
const VenueEnquiry = require('../models/VenueEnquiry');
const QuotationDownload = require('../models/QuotationDownload');
const ServiceQuotationDownload = require('../models/ServiceQuotationDownload');
const OtpVerification = require('../models/OtpVerification');
const Notification = require('../models/Notification');
const SessionLog = require('../models/SessionLog');

async function cleanupUser(targetEmail, isDryRun = false) {
  if (!targetEmail) {
    console.error('❌ Error: Email address is required.');
    console.log('Usage: node scripts/cleanupUserData.js <email> [--dry-run]');
    process.exit(1);
  }

  const cleanEmail = targetEmail.trim().toLowerCase();
  console.log('====================================================');
  console.log(`   USER DATA CLEANUP: ${cleanEmail}`);
  console.log(`   MODE: ${isDryRun ? '🔍 DRY RUN (Preview only)' : '🗑️ LIVE DELETE'}`);
  console.log('====================================================\n');

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }

  const makeOrQuery = (clauses) => {
    const valid = clauses.filter(Boolean);
    return valid.length > 0 ? { $or: valid } : { _id: null };
  };

  try {
    const emailRegex = new RegExp('^' + cleanEmail + '$', 'i');

    // 1. Find User
    const user = await User.findOne({ email: emailRegex });
    const userIds = user ? [user._id] : [];
    const userPhone = user?.phone ? user.phone.trim() : null;

    console.log('1. User Account:');
    if (user) {
      console.log(`   Found: ${user.name} | Role: ${user.role} | ID: ${user._id} | Phone: ${user.phone || 'N/A'}`);
    } else {
      console.log(`   No User document with email "${cleanEmail}" (will check other collections by email).`);
    }

    // 2. Find Venues
    const venueFilter = makeOrQuery([
      userIds.length > 0 ? { owner: { $in: userIds } } : null,
      { 'ownerInfo.email': emailRegex }
    ]);
    const venues = await Venue.find(venueFilter).lean();
    const venueIds = venues.map(v => v._id);
    console.log(`\n2. Venues (${venues.length} found):`);
    venues.forEach(v => console.log(`   • ${v.businessName} (SKU: ${v.sku}, ID: ${v._id})`));

    // 3. Find Bookings
    const bookingFilter = makeOrQuery([
      userIds.length > 0 ? { customer: { $in: userIds } } : null,
      venueIds.length > 0 ? { venue: { $in: venueIds } } : null,
      { 'customerDetails.email': emailRegex }
    ]);
    const bookings = await Booking.find(bookingFilter).lean();
    console.log(`\n3. Bookings (${bookings.length} found)`);

    // 4. Ambassador Data
    const ambProfiles = await AmbassadorProfile.find(makeOrQuery([
      userIds.length > 0 ? { user: { $in: userIds } } : null,
      { email: emailRegex }
    ])).lean();
    const ambProfileIds = ambProfiles.map(a => a._id);
    const ambPayouts = await AmbassadorPayout.find(makeOrQuery([
      userIds.length > 0 ? { ambassador: { $in: userIds } } : null,
      ambProfileIds.length > 0 ? { ambassadorProfile: { $in: ambProfileIds } } : null
    ])).lean();
    const ambRewards = await AmbassadorReward.find(makeOrQuery([
      userIds.length > 0 ? { ambassador: { $in: userIds } } : null
    ])).lean();
    console.log(`\n4. Ambassador Profiles: ${ambProfiles.length}, Payouts: ${ambPayouts.length}, Rewards: ${ambRewards.length}`);

    // 5. Vendor Data
    const vendorProfiles = await VendorProfile.find(makeOrQuery([
      userIds.length > 0 ? { user: { $in: userIds } } : null,
      { email: emailRegex }
    ])).lean();
    const vendorServices = await VendorService.find(makeOrQuery([
      userIds.length > 0 ? { vendor: { $in: userIds } } : null,
      { 'contactInfo.email': emailRegex }
    ])).lean();
    const serviceBookings = await ServiceBooking.find(makeOrQuery([
      userIds.length > 0 ? { customer: { $in: userIds } } : null,
      { 'customerInfo.email': emailRegex }
    ])).lean();
    console.log(`\n5. Vendor Profiles: ${vendorProfiles.length}, Services: ${vendorServices.length}, Service Bookings: ${serviceBookings.length}`);

    // 6. Quotation Downloads, Reviews, Enquiries, OTPs
    const quotations = await QuotationDownload.find(makeOrQuery([
      userIds.length > 0 ? { user: { $in: userIds } } : null,
      { email: emailRegex }
    ])).lean();
    const serviceQuotations = await ServiceQuotationDownload.find(makeOrQuery([
      userIds.length > 0 ? { user: { $in: userIds } } : null,
      { email: emailRegex }
    ])).lean();
    const reviews = await Review.find(makeOrQuery([
      userIds.length > 0 ? { user: { $in: userIds } } : null
    ])).lean();
    const venueReviews = await VenueReview.find(makeOrQuery([
      userIds.length > 0 ? { user: { $in: userIds } } : null
    ])).lean();
    const enquiries = await VenueEnquiry.find(makeOrQuery([
      userIds.length > 0 ? { user: { $in: userIds } } : null,
      { email: emailRegex }
    ])).lean();
    const otps = await OtpVerification.find({ email: emailRegex }).lean();
    const notifications = userIds.length > 0 ? await Notification.find({ recipient: { $in: userIds } }).lean() : [];
    const sessionLogs = userIds.length > 0 ? await SessionLog.find({ user: { $in: userIds } }).lean() : [];

    console.log(`\n6. Other Related Records:`);
    console.log(`   • Quotation Downloads: ${quotations.length}`);
    console.log(`   • Service Quotations: ${serviceQuotations.length}`);
    console.log(`   • Reviews: ${reviews.length + venueReviews.length}`);
    console.log(`   • Venue Enquiries: ${enquiries.length}`);
    console.log(`   • OTP Verifications: ${otps.length}`);
    console.log(`   • Notifications: ${notifications.length}`);
    console.log(`   • Session Logs: ${sessionLogs.length}`);

    if (isDryRun) {
      console.log('\n🔍 DRY RUN COMPLETE: No data was removed.');
      await mongoose.disconnect();
      return;
    }

    // --- EXECUTE REMOVAL ---
    console.log('\n--- DELETING RECORDS ---');

    if (venues.length > 0) {
      const delVenues = await Venue.deleteMany(venueFilter);
      console.log(`✅ Deleted ${delVenues.deletedCount} Venues`);
    }
    if (bookings.length > 0) {
      const delBookings = await Booking.deleteMany(bookingFilter);
      console.log(`✅ Deleted ${delBookings.deletedCount} Bookings`);
    }
    if (ambProfiles.length > 0) {
      const delAmb = await AmbassadorProfile.deleteMany({
        $or: [
          ...(userIds.length > 0 ? [{ user: { $in: userIds } }] : []),
          { email: emailRegex }
        ]
      });
      console.log(`✅ Deleted ${delAmb.deletedCount} Ambassador Profiles`);
    }
    if (ambPayouts.length > 0) {
      const delPayouts = await AmbassadorPayout.deleteMany({
        $or: [
          ...(userIds.length > 0 ? [{ ambassador: { $in: userIds } }] : []),
          ...(ambProfileIds.length > 0 ? [{ ambassadorProfile: { $in: ambProfileIds } }] : [])
        ]
      });
      console.log(`✅ Deleted ${delPayouts.deletedCount} Ambassador Payouts`);
    }
    if (ambRewards.length > 0) {
      const delRewards = await AmbassadorReward.deleteMany({
        $or: [
          ...(userIds.length > 0 ? [{ ambassador: { $in: userIds } }] : [])
        ]
      });
      console.log(`✅ Deleted ${delRewards.deletedCount} Ambassador Rewards`);
    }
    if (vendorProfiles.length > 0) {
      const delVendors = await VendorProfile.deleteMany({
        $or: [
          ...(userIds.length > 0 ? [{ user: { $in: userIds } }] : []),
          { email: emailRegex }
        ]
      });
      console.log(`✅ Deleted ${delVendors.deletedCount} Vendor Profiles`);
    }
    if (vendorServices.length > 0) {
      const delServices = await VendorService.deleteMany({
        $or: [
          ...(userIds.length > 0 ? [{ vendor: { $in: userIds } }] : []),
          { 'contactInfo.email': emailRegex }
        ]
      });
      console.log(`✅ Deleted ${delServices.deletedCount} Vendor Services`);
    }
    if (serviceBookings.length > 0) {
      const delServiceBookings = await ServiceBooking.deleteMany({
        $or: [
          ...(userIds.length > 0 ? [{ customer: { $in: userIds } }] : []),
          { 'customerInfo.email': emailRegex }
        ]
      });
      console.log(`✅ Deleted ${delServiceBookings.deletedCount} Service Bookings`);
    }
    if (quotations.length > 0) {
      const delQuotations = await QuotationDownload.deleteMany({
        $or: [
          ...(userIds.length > 0 ? [{ user: { $in: userIds } }] : []),
          { email: emailRegex }
        ]
      });
      console.log(`✅ Deleted ${delQuotations.deletedCount} Quotation Downloads`);
    }
    if (serviceQuotations.length > 0) {
      const delServiceQuotations = await ServiceQuotationDownload.deleteMany({
        $or: [
          ...(userIds.length > 0 ? [{ user: { $in: userIds } }] : []),
          { email: emailRegex }
        ]
      });
      console.log(`✅ Deleted ${delServiceQuotations.deletedCount} Service Quotations`);
    }
    if (reviews.length > 0) {
      const delReviews = await Review.deleteMany({ user: { $in: userIds } });
      console.log(`✅ Deleted ${delReviews.deletedCount} Reviews`);
    }
    if (venueReviews.length > 0) {
      const delVenueReviews = await VenueReview.deleteMany({ user: { $in: userIds } });
      console.log(`✅ Deleted ${delVenueReviews.deletedCount} Venue Reviews`);
    }
    if (enquiries.length > 0) {
      const delEnquiries = await VenueEnquiry.deleteMany({
        $or: [
          ...(userIds.length > 0 ? [{ user: { $in: userIds } }] : []),
          { email: emailRegex }
        ]
      });
      console.log(`✅ Deleted ${delEnquiries.deletedCount} Venue Enquiries`);
    }
    if (otps.length > 0) {
      const delOtps = await OtpVerification.deleteMany({ email: emailRegex });
      console.log(`✅ Deleted ${delOtps.deletedCount} OTP Verifications`);
    }
    if (notifications.length > 0) {
      const delNotifs = await Notification.deleteMany({ recipient: { $in: userIds } });
      console.log(`✅ Deleted ${delNotifs.deletedCount} Notifications`);
    }
    if (sessionLogs.length > 0) {
      const delSessions = await SessionLog.deleteMany({ user: { $in: userIds } });
      console.log(`✅ Deleted ${delSessions.deletedCount} Session Logs`);
    }

    // Finally delete User
    if (user) {
      const delUser = await User.deleteOne({ _id: user._id });
      console.log(`✅ Deleted User Account "${user.name}" (${cleanEmail})`);
    } else {
      const delUsers = await User.deleteMany({ email: emailRegex });
      if (delUsers.deletedCount > 0) {
        console.log(`✅ Deleted ${delUsers.deletedCount} User Accounts matching ${cleanEmail}`);
      }
    }

    console.log('\n====================================================');
    console.log(`🎉 SUCCESS: All data for ${cleanEmail} has been completely removed!`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Error during cleanup:', err);
  } finally {
    await mongoose.disconnect();
  }
}

// Read email from CLI args
const args = process.argv.slice(2);
const targetEmail = args.find(a => !a.startsWith('--')) || 'tatkalkhabar24@gmail.com';
const isDryRun = args.includes('--dry-run');

cleanupUser(targetEmail, isDryRun);
