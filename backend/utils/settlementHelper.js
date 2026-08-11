const Razorpay = require('razorpay');
const Booking = require('../models/Booking');
const ServiceBooking = require('../models/ServiceBooking');
const pushService = require('./pushNotificationService');
const VendorProfile = require('../models/VendorProfile');
const { decrypt } = require('./encryption');
const { calculateVenueOwnerPayout } = require('./venuePricing');
const { ensureRazorpayLinkedAccount } = require('./razorpayAccountHelper');

const getRazorpayErrorInfo = (err) => {
  const error = err?.error || err?.response?.data?.error || {};
  const statusCode = err?.statusCode || err?.response?.status;
  const description = error.description || err?.description || err?.message || (typeof err === 'string' ? err : '') || 'Unknown Razorpay error';
  const context = [
    statusCode ? `status ${statusCode}` : null,
    error.code ? `code ${error.code}` : null,
    error.field ? `field ${error.field}` : null,
    error.reason ? `reason ${error.reason}` : null,
    error.step ? `step ${error.step}` : null
  ].filter(Boolean).join(', ');

  return {
    message: context ? `${description} (${context})` : description,
    raw: JSON.stringify({ statusCode, error, message: err?.message }, null, 2)
  };
};

const isValidIFSC = (ifsc) => {
  return typeof ifsc === 'string' && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim().toUpperCase());
};

const calculateVenuePayout = (booking) => {
  return calculateVenueOwnerPayout(booking);
};

const calculateServicePayout = (booking) => {
  const pricing = booking.pricing || {};
  const subtotal = pricing.subtotal || 0;
  const serviceCGST = pricing.serviceCGST || pricing.serviceCgst || (pricing.cgstPct ? Math.round(subtotal * pricing.cgstPct / 100) : 0);
  const serviceSGST = pricing.serviceSGST || pricing.serviceSgst || (pricing.sgstPct ? Math.round(subtotal * pricing.sgstPct / 100) : 0);
  const serviceTotal = subtotal + serviceCGST + serviceSGST;
  const discount = booking.coupon?.discountAmount || pricing.discount || 0;
  // phase2 work: check for coupon sponsorship type
  // const isVendorSponsored = booking.coupon?.isVendorSponsored || false;
  // if (isVendorSponsored) {
  //   return Math.round(Math.max(0, serviceTotal - discount));
  // } else {
  //   return Math.round(serviceTotal);
  // }
  return Math.round(Math.max(0, serviceTotal - discount));
};

exports.settleBooking = async (bookingId, bookingType, manualOptions = null) => {
  console.log(`[SETTLEMENT] 🔄 Starting payout settlement for ${bookingType} booking ID: ${bookingId}`);

  try {
    let booking;
    let payoutAmount = 0;
    let bankDetails = null;
    let beneficiaryUser = null;
    let vendorProfile = null;

    if (bookingType === 'venue') {
      booking = await Booking.findById(bookingId).populate({
        path: 'venue',
        populate: { path: 'owner' }
      });

      if (!booking) {
        throw new Error('Venue booking not found');
      }

      payoutAmount = calculateVenuePayout(booking);

      // ownerEarnings ko bhi same payout ke saath sync rakho
      booking.ownerEarnings = payoutAmount;

      beneficiaryUser = booking.venue?.owner;
      bankDetails = booking.venue?.bankDetails;
    } else if (bookingType === 'service') {
      booking = await ServiceBooking.findById(bookingId).populate('vendor');

      if (!booking) {
        throw new Error('Service booking not found');
      }

      payoutAmount = calculateServicePayout(booking);

      // agar ServiceBooking me vendorEarnings/ownerEarnings field hai to sync ho jayega
      if ('vendorEarnings' in booking) {
        booking.vendorEarnings = payoutAmount;
      }

      if ('ownerEarnings' in booking) {
        booking.ownerEarnings = payoutAmount;
      }

      beneficiaryUser = booking.vendor;

      if (beneficiaryUser) {
        vendorProfile = await VendorProfile.findOne({ user: beneficiaryUser._id });
        bankDetails = vendorProfile?.bankDetails;
      }
    } else {
      throw new Error(`Invalid booking type: ${bookingType}`);
    }

    const triggerPush = async (b) => {
      try {
        const isSuccess = b.settlementStatus === 'settled';
        await pushService.sendSettlementPushNotification(
          b,
          bookingType,
          isSuccess,
          {
            amount: payoutAmount,
            remarks: b.settlementDetails?.remarks
          }
        );
      } catch (err) {
        console.error('[SETTLEMENT] Settlement push notification error:', err.message);
      }
    };

    if (booking.status !== 'completed') {
      throw new Error(`Booking status must be 'completed' to settle. Current: ${booking.status}`);
    }

    if (booking.paymentStatus !== 'paid') {
      throw new Error(`Booking must be paid to settle. Current payment status: ${booking.paymentStatus}`);
    }

    if (booking.settlementStatus === 'settled') {
      console.log(`[SETTLEMENT] ⏭️ Booking ${booking.bookingNumber} is already settled.`);
      return booking;
    }

    if (manualOptions && manualOptions.method === 'manual') {
      booking.settlementStatus = 'settled';
      booking.settlementDetails = {
        transactionId: manualOptions.transactionId || `MAN-TXN-${Date.now()}`,
        settledAt: new Date(),
        amount: payoutAmount,
        remarks: manualOptions.remarks || 'Settled manually by administrator.',
        settlementMethod: 'manual'
      };

      await booking.save();
      console.log(`[SETTLEMENT] ✅ Manually settled booking ${booking.bookingNumber} with amount ₹${payoutAmount}`);
      
      // If venue booking, credit 25% profit share to ambassador (if listed via ambassador within 12 months)
      if (bookingType === 'venue') {
        try {
          const { processBookingProfitShare } = require('./ambassadorRewardHelper');
          await processBookingProfitShare(booking);
        } catch (ambErr) {
          console.error('[AMBASSADOR] Error processing booking profit share:', ambErr.message);
        }
      }

      await triggerPush(booking);
      return booking;
    }

    if (!bankDetails) {
      booking.settlementStatus = 'failed';
      booking.settlementDetails = {
        amount: payoutAmount,
        remarks: 'Settlement Failed: No bank details linked to venue owner or vendor profile.',
        settledAt: new Date()
      };

      await booking.save();
      console.log(`[SETTLEMENT] ❌ Settlement failed for ${booking.bookingNumber}: Missing bank details.`);
      await triggerPush(booking);
      return booking;
    }

    let rawAccountNumber = bankDetails.accountNumber || bankDetails.accountNumberCard;
    const ifsc = (bankDetails.ifscCode || bankDetails.ifsc || '').trim().toUpperCase();
    const holderName = bankDetails.accountHolderName;

    if (bookingType === 'venue' && rawAccountNumber) {
      try {
        rawAccountNumber = decrypt(rawAccountNumber);
      } catch (decErr) {
        console.warn(`[SETTLEMENT] Account number decryption failed:`, decErr.message);
      }
    }

    if (!rawAccountNumber || !ifsc || !holderName) {
      booking.settlementStatus = 'failed';
      booking.settlementDetails = {
        amount: payoutAmount,
        remarks: `Settlement Failed: Incomplete bank details. (Account: ${rawAccountNumber ? 'Provided' : 'Missing'}, IFSC: ${ifsc ? 'Provided' : 'Missing'}, Holder: ${holderName ? 'Provided' : 'Missing'})`,
        settledAt: new Date()
      };

      await booking.save();
      console.log(`[SETTLEMENT] ❌ Settlement failed for ${booking.bookingNumber}: Incomplete bank details.`);
      await triggerPush(booking);
      return booking;
    }

    if (!isValidIFSC(ifsc)) {
      booking.settlementStatus = 'failed';
      booking.settlementDetails = {
        amount: payoutAmount,
        remarks: `Settlement Failed: Invalid IFSC code format (${ifsc}).`,
        settledAt: new Date()
      };

      await booking.save();
      console.log(`[SETTLEMENT] ❌ Settlement failed for ${booking.bookingNumber}: Invalid IFSC ${ifsc}.`);
      await triggerPush(booking);
      return booking;
    }

    const settlementBankDetails = {
      ...bankDetails,
      accountNumber: rawAccountNumber,
      accountNumberCard: rawAccountNumber,
      ifscCode: ifsc,
      ifsc,
      accountHolderName: holderName
    };

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    const isSandbox = !razorpayKeyId || razorpayKeyId.startsWith('rzp_test_');

    if (isSandbox) {
      const mockTxnId = `SIM-SETTLE-${bookingType.slice(0, 3).toUpperCase()}-${Date.now()}`;

      booking.settlementStatus = 'settled';
      booking.settlementDetails = {
        transactionId: mockTxnId,
        settledAt: new Date(),
        amount: payoutAmount,
        remarks: `[SIMULATION] Payout of ₹${payoutAmount.toFixed(2)} automatically settled to ${holderName} (${bankDetails.bankName || 'Bank'}, A/C: ...${rawAccountNumber.slice(-4)}, IFSC: ${ifsc}).`,
        settlementMethod: 'automatic'
      };

      await booking.save();
      console.log(`[SETTLEMENT] ✅ [SIMULATION] Automatic settlement completed for ${booking.bookingNumber}`);
      await triggerPush(booking);
      return booking;
    }

    try {
      const razorpay = new Razorpay({
        key_id: razorpayKeyId,
        key_secret: razorpayKeySecret
      });

      console.log(`[SETTLEMENT] 🌐 Live Razorpay API transaction initiated for ${booking.bookingNumber}. Amount: ₹${payoutAmount}`);

      if (!booking.paymentDetails?.razorpay_payment_id) {
        throw new Error('No Razorpay payment ID found on booking.');
      }

      const linkedAccountId = await ensureRazorpayLinkedAccount({
        razorpay,
        bookingType,
        beneficiaryUser,
        venue: bookingType === 'venue' ? booking.venue : null,
        vendorProfile,
        bankDetails,
        settlementBankDetails
      });

      const transferResponse = await razorpay.payments.transfer(
        booking.paymentDetails.razorpay_payment_id,
        {
          transfers: [
            {
              account: linkedAccountId,
              amount: Math.round(payoutAmount * 100),
              currency: 'INR',
              notes: {
                bookingNumber: booking.bookingNumber,
                payoutType: bookingType
              }
            }
          ]
        }
      );

      const transfer = transferResponse.items?.[0] || {};

      booking.settlementStatus = 'settled';
      booking.settlementDetails = {
        transactionId: transfer.id || `TXN-ROUTE-${Date.now()}`,
        settledAt: new Date(),
        amount: payoutAmount,
        remarks: `Successfully settled via Razorpay Route to Linked Account ${linkedAccountId}.`,
        settlementMethod: 'automatic'
      };

      await booking.save();
      console.log(`[SETTLEMENT] ✅ Live settlement transfer successful for ${booking.bookingNumber}`);
      
      // If venue booking, credit 25% profit share to ambassador (if listed via ambassador within 12 months)
      if (bookingType === 'venue') {
        try {
          const { processBookingProfitShare } = require('./ambassadorRewardHelper');
          await processBookingProfitShare(booking);
        } catch (ambErr) {
          console.error('[AMBASSADOR] Error processing booking profit share:', ambErr.message);
        }
      }

      await triggerPush(booking);
      return booking;
    } catch (apiErr) {
      const razorpayError = getRazorpayErrorInfo(apiErr);
      console.error(`[SETTLEMENT] ❌ Razorpay transfer failed for ${booking.bookingNumber}:`, razorpayError.message);
      console.error(`[SETTLEMENT] Razorpay error raw:`, razorpayError.raw);

      booking.settlementStatus = 'failed';
      booking.settlementDetails = {
        amount: payoutAmount,
        remarks: `Razorpay API Error: ${razorpayError.message}`,
        settledAt: new Date()
      };

      await booking.save();
      await triggerPush(booking);
      return booking;
    }
  } catch (err) {
    console.error(`[SETTLEMENT] 💥 Unexpected settlement process error:`, err.message);
    throw err;
  }
};
