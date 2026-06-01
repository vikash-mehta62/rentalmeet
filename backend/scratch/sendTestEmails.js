const path = require('path');
// Load environment variables from backend/.env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const emailService = require('../utils/emailService');

const targetEmail = 'vikasmaheshwari6267@gmail.com';

async function run() {
  console.log('=== STARTING EMAIL TEMPLATE VERIFICATION TEST ===');
  console.log(`Target Email: ${targetEmail}`);
  console.log(`SMTP Host: ${process.env.SMTP_HOST}`);
  console.log(`SMTP User: ${process.env.SMTP_USER}`);

  try {
    // 1. Send OTP Verification Email
    console.log('Sending OTP Verification Email...');
    await emailService.sendOtpVerificationEmail(targetEmail, 'Vikas Maheshwari', '482910');

    // 2. Send Password Reset Email
    console.log('Sending Password Reset Email...');
    await emailService.sendPasswordResetEmail(targetEmail, 'Vikas Maheshwari', '920184');

    // 3. Send Venue Submission Email
    console.log('Sending Venue Submission Received Email...');
    await emailService.sendVenueSubmissionEmail(targetEmail, 'Premium Banquet Hall');

    // 4. Send Venue Approval Email
    console.log('Sending Venue Approval Email...');
    await emailService.sendVenueApprovalEmail(targetEmail, 'Premium Banquet Hall');

    // 5. Send Venue Rejection Email
    console.log('Sending Venue Rejection Email...');
    await emailService.sendVenueRejectionEmail(targetEmail, 'Premium Banquet Hall', 'The venue GST document copy was blurry and could not be verified. Please upload a clear scanned PDF/image.');

    // 6. Send Booking Emails (mock booking)
    const mockBooking = {
      bookingNumber: 'RM-BKG-2026-0482',
      bookingDate: new Date(),
      startTime: '10:00 AM',
      endTime: '06:00 PM',
      amount: 15000,
      ownerEarnings: 13500,
      cancellationReason: 'Customer requested cancellation due to personal scheduling conflict.',
      refundDetails: {
        refundAmount: 15000
      },
      customer: {
        name: 'Vikas Maheshwari',
        email: targetEmail
      },
      venue: {
        businessName: 'Premium Banquet Hall',
        owner: {
          name: 'Vikas Owner',
          email: targetEmail
        }
      }
    };

    console.log('Sending Booking Created Email...');
    await emailService.sendBookingEmail(mockBooking, 'created');

    console.log('Sending Booking Confirmed Email...');
    await emailService.sendBookingEmail(mockBooking, 'confirmed');

    console.log('Sending Booking Completed Email...');
    await emailService.sendBookingEmail(mockBooking, 'completed');

    console.log('Sending Booking Cancelled Email...');
    await emailService.sendBookingEmail(mockBooking, 'cancelled');

    console.log('=== ALL TEST EMAILS SENT SUCCESSFULLY! ===');
  } catch (error) {
    console.error('=== TEST EMAIL SENDING FAILED ===', error);
  }
}

run();
