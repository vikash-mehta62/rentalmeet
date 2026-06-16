const Liability = require('../models/Liability');
const User = require('../models/User');

/**
 * Automatically creates a Platform GST Liability entry when a Booking (venue) or ServiceBooking (service) is completed.
 * 
 * @param {Object} booking - The Booking or ServiceBooking document instance
 * @param {string} bookingType - Type of booking: 'venue' or 'service'
 * @param {string} [userId] - The ID of the user who performed the completion action
 * @returns {Promise<Object|null>} The created Liability document or null if skipped/failed
 */
async function createPlatformGSTLiability(booking, bookingType, userId) {
  try {
    if (!booking) {
      console.error('[LIABILITY_HELPER] No booking document provided.');
      return null;
    }

    const bookingId = booking._id;
    const bookingNumber = booking.bookingNumber;

    // 1. Check if a liability entry already exists for this booking to prevent duplicate entries
    let existingLiability = null;
    if (bookingType === 'venue') {
      existingLiability = await Liability.findOne({ booking: bookingId });
    } else if (bookingType === 'service') {
      existingLiability = await Liability.findOne({ serviceBooking: bookingId });
    }

    if (existingLiability) {
      console.log(`[LIABILITY_HELPER] Liability already exists for booking ${bookingNumber}. Skipping.`);
      return existingLiability;
    }

    // 2. Resolve Platform GST Amount
    let platformGST = 0;
    let platformFee = 0;

    if (bookingType === 'venue') {
      platformGST = booking.priceBreakdown?.platformFeeGST || 
                    ((booking.platformInvoice?.cgst || 0) + (booking.platformInvoice?.sgst || 0)) || 
                    0;
      platformFee = booking.priceBreakdown?.platformFee || booking.platformInvoice?.platformFee || 0;
    } else if (bookingType === 'service') {
      platformGST = booking.pricing?.platformFeeGST || 0;
      platformFee = booking.pricing?.platformFee || 0;
    }

    // Round GST and platform fee to 2 decimal places for accuracy
    platformGST = Math.round(platformGST * 100) / 100;
    platformFee = Math.round(platformFee * 100) / 100;

    // If there is no platform GST liability, we don't need to create a liability record
    if (platformGST <= 0) {
      console.log(`[LIABILITY_HELPER] Platform GST for booking ${bookingNumber} is ₹${platformGST}. Skipping creation.`);
      return null;
    }

    // 3. Resolve creator user (required by Liability schema)
    let creatorId = userId;
    if (!creatorId) {
      // Find the first admin user in the system as a fallback creator
      const adminUser = await User.findOne({ role: 'admin' });
      if (adminUser) {
        creatorId = adminUser._id;
      } else {
        // Fallback to any user if no admin exists
        const anyUser = await User.findOne({});
        if (anyUser) {
          creatorId = anyUser._id;
        } else {
          console.error('[LIABILITY_HELPER] No users found in database to assign as creator.');
          return null;
        }
      }
    }

    // 4. Calculate Pay By Date: 20th of the following month (standard GST filing deadline in India)
    const payByDate = new Date();
    payByDate.setMonth(payByDate.getMonth() + 1);
    payByDate.setDate(20);
    payByDate.setHours(23, 59, 59, 999);

    // 5. Setup titles & remarks based on booking type
    const capitalizedType = bookingType.charAt(0).toUpperCase() + bookingType.slice(1);
    const title = `Platform GST - ${capitalizedType} Booking ${bookingNumber}`;
    const remark = `Automatically generated platform GST liability for completed ${capitalizedType} Booking ${bookingNumber}. Platform Fee: ₹${platformFee.toLocaleString('en-IN')}, Platform GST: ₹${platformGST.toLocaleString('en-IN')}.`;

    // 6. Create the liability
    const liability = await Liability.create({
      title,
      totalAmount: platformGST,
      paidAmount: 0,
      payByDate,
      remark,
      createdBy: creatorId,
      booking: bookingType === 'venue' ? bookingId : undefined,
      serviceBooking: bookingType === 'service' ? bookingId : undefined
    });

    console.log(`[LIABILITY_HELPER] Successfully created GST liability for booking ${bookingNumber}: ₹${platformGST}`);
    return liability;
  } catch (error) {
    console.error(`[LIABILITY_HELPER] Error creating platform GST liability:`, error);
    return null;
  }
}

module.exports = {
  createPlatformGSTLiability
};
