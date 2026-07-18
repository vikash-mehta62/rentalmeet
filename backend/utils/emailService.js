const nodemailer = require('nodemailer');

const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpSecure = process.env.SMTP_SECURE
  ? process.env.SMTP_SECURE === 'true'
  : smtpPort === 465;
const smtpFrom = process.env.SMTP_FROM || process.env.SMTP_USER;

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

exports.sendEmail = async (options) => {
  const mailOptions = {
    from: `RentalMeet <${smtpFrom}>`,
    to: options.email,
    subject: options.subject,
    html: options.html
  };
  
  await transporter.sendMail(mailOptions);
};

exports.sendVenueSubmissionEmail = async (ownerEmail, venueName) => {
  const nextStepsHtml = `
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #ea580c; margin-top: 0; margin-bottom: 12px; font-size: 16px; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Next Steps in Review Process</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: left;">
            <div style="font-weight: 600; color: #1e293b; font-size: 14px;">1. Document Verification</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Our admin team will verify your uploaded documents and details.</div>
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #ea580c; font-size: 14px; width: 100px; vertical-align: middle;">1-2 Days</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: left;">
            <div style="font-weight: 600; color: #1e293b; font-size: 14px;">2. Site Visit (if required)</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">A coordinator might contact you for physical venue verification.</div>
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600; color: #ea580c; font-size: 14px; width: 100px; vertical-align: middle;">2-3 Days</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; text-align: left;">
            <div style="font-weight: 600; color: #1e293b; font-size: 14px;">3. Listing Activation</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Your venue goes live on RentalMeet and you can start accepting bookings!</div>
          </td>
          <td style="padding: 10px 0; text-align: right; font-weight: 600; color: #ea580c; font-size: 14px; width: 100px; vertical-align: middle;">3-5 Days</td>
        </tr>
      </table>
    </div>
  `;

  const html = getHtmlTemplate(
    'Venue Submission Received',
    'Venue Owner',
    `Thank you for registering <strong>${venueName}</strong> on RentalMeet. Your venue is currently under review. Our team will verify your documents and get back to you within 24-48 hours.`,
    null,
    nextStepsHtml
  );
  
  // Create DB Notification
  try {
    const User = require('../models/User');
    const owner = await User.findOne({ email: ownerEmail.toLowerCase().trim() });
    if (owner) {
      const Notification = require('../models/Notification');
      await Notification.create({
        userId: owner._id,
        type: 'general',
        title: 'Venue Registration Under Review',
        body: `Thank you for registering ${venueName}. Your venue is currently under review.`,
        data: { link: '/owner/dashboard' }
      });
      console.log(`[NOTIFICATION] Created submission notification for owner ${ownerEmail}`);
    }
  } catch (notifErr) {
    console.error('[NOTIFICATION] Failed to create submission notification:', notifErr.message);
  }

  // Send Email
  try {
    await this.sendEmail({
      email: ownerEmail,
      subject: 'Venue Submission Received - RentalMeet',
      html
    });
  } catch (emailErr) {
    console.error('[EMAIL] Failed to send submission email:', emailErr.message);
  }
};

exports.sendVenueApprovalEmail = async (ownerEmail, venueName) => {
  const ctaHtml = `
    <div style="text-align: center; margin: 30px 0;">
      <a href="https://rentalmeet.com/owner/dashboard" style="background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(234, 88, 12, 0.2);">Go to Owner Dashboard</a>
    </div>
  `;

  const html = getHtmlTemplate(
    '🎉 Venue Approved!',
    'Venue Owner',
    `Congratulations! Your venue <strong>${venueName}</strong> has been approved and is now live on RentalMeet. You can now start receiving bookings. Login to your dashboard to manage your venue.`,
    null,
    ctaHtml
  );
  
  // Create DB Notification
  try {
    const User = require('../models/User');
    const owner = await User.findOne({ email: ownerEmail.toLowerCase().trim() });
    if (owner) {
      const Notification = require('../models/Notification');
      await Notification.create({
        userId: owner._id,
        type: 'general',
        title: '🎉 Venue Approved!',
        body: `Congratulations! Your venue ${venueName} has been approved and is now live.`,
        data: { link: '/owner/dashboard' }
      });
      console.log(`[NOTIFICATION] Created approval notification for owner ${ownerEmail}`);
    }
  } catch (notifErr) {
    console.error('[NOTIFICATION] Failed to create approval notification:', notifErr.message);
  }

  // Send Email
  try {
    await this.sendEmail({
      email: ownerEmail,
      subject: 'Venue Approved - RentalMeet',
      html
    });
  } catch (emailErr) {
    console.error('[EMAIL] Failed to send approval email:', emailErr.message);
  }
};

exports.sendVenueRejectionEmail = async (ownerEmail, venueName, reason) => {
  const rejectionHtml = `
    <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #dc2626; margin-top: 0; margin-bottom: 8px; font-size: 15px; font-weight: 700;">Reason for Rejection</h3>
      <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.5;">${reason}</p>
    </div>
  `;

  const html = getHtmlTemplate(
    'Venue Registration Update',
    'Venue Owner',
    `We regret to inform you that your venue <strong>${venueName}</strong> could not be approved at this time. You can resubmit your venue after addressing the issues mentioned below.`,
    null,
    rejectionHtml
  );
  
  // Create DB Notification
  try {
    const User = require('../models/User');
    const owner = await User.findOne({ email: ownerEmail.toLowerCase().trim() });
    if (owner) {
      const Notification = require('../models/Notification');
      await Notification.create({
        userId: owner._id,
        type: 'general',
        title: 'Venue Registration Update',
        body: `We regret to inform you that your venue ${venueName} could not be approved. Reason: ${reason}`,
        data: { link: '/owner/dashboard' }
      });
      console.log(`[NOTIFICATION] Created rejection notification for owner ${ownerEmail}`);
    }
  } catch (notifErr) {
    console.error('[NOTIFICATION] Failed to create rejection notification:', notifErr.message);
  }

  // Send Email
  try {
    await this.sendEmail({
      email: ownerEmail,
      subject: 'Venue Registration Update - RentalMeet',
      html
    });
  } catch (emailErr) {
    console.error('[EMAIL] Failed to send rejection email:', emailErr.message);
  }
};

const getHtmlTemplate = (title, recipientName, messageText, bookingDetails = null, extraHtml = '') => {
  const year = new Date().getFullYear();
  let detailsHtml = '';

  if (bookingDetails && bookingDetails.length > 0) {
    detailsHtml = `
      <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #ea580c; margin-top: 0; margin-bottom: 15px; font-size: 16px; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Booking Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${bookingDetails.map(detail => `
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 45%; border-bottom: 1px solid #f1f5f9; text-align: left;">${detail.label}</td>
              <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9; ${detail.style || ''}">${detail.value}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 0.5px;">RentalMeet</h1>
      </div>
      
      <!-- Body -->
      <div style="padding: 30px; color: #334155; line-height: 1.6; text-align: left;">
        <h2 style="color: #1e293b; margin-top: 0; font-size: 20px; font-weight: 700; border-left: 4px solid #ea580c; padding-left: 10px; margin-bottom: 20px;">${title}</h2>
        <p style="font-size: 15px; margin-bottom: 15px;">Dear ${recipientName},</p>
        <p style="font-size: 15px; margin-bottom: 15px; color: #475569;">${messageText}</p>
        
        ${detailsHtml}
        ${extraHtml}
        
        <p style="font-size: 15px; margin-top: 25px; color: #64748b;">If you have any questions or require immediate assistance, please do not hesitate to contact our customer success team.</p>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #f1f5f9; padding: 20px; border-radius: 0 0 12px 12px; text-align: center; font-size: 12px; color: #64748b; margin-top: 20px;">
        <p style="margin: 0; font-size: 13px;">For any queries, contact us at <a href="mailto:venues@rentalmeet.com" style="color: #ea580c; text-decoration: none; font-weight: 600;">venues@rentalmeet.com</a> or call <strong>0755-4545348</strong></p>
        <p style="margin: 8px 0 0 0; font-size: 11px;">&copy; ${year} RentalMeet. All rights reserved.</p>
      </div>
    </div>
  `;
};

exports.sendBookingEmail = async (booking, eventType) => {
  try {
    const customerEmail = booking.customer?.email || booking.customerDetails?.email;
    const ownerEmail = booking.venue?.owner?.email;
    const venueName = booking.venue?.businessName || 'Venue';
    const bookingNo = booking.bookingNumber;
    const bookingDateStr = booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('en-IN') : 'N/A';
    const amountStr = `₹${(booking.amount || 0).toLocaleString('en-IN')}`;

    if (!customerEmail && !ownerEmail) {
      console.warn('[EMAIL] No customer or owner email found for booking:', bookingNo);
      return;
    }

    let subject = '';
    let customerHtml = '';
    let ownerHtml = '';

    switch (eventType) {
      case 'created':
        subject = `New Booking Request #${bookingNo} - RentalMeet`;
        customerHtml = getHtmlTemplate(
          'Booking Request Received',
          booking.customer?.name || 'Customer',
          `Your booking request for <strong>${venueName}</strong> has been received and is pending owner confirmation. We will notify you once the venue owner reviews your request.`,
          [
            { label: 'Booking Number', value: `#${bookingNo}` },
            { label: 'Venue Name', value: venueName },
            { label: 'Date', value: bookingDateStr },
            { label: 'Time Slot', value: `${booking.startTime} - ${booking.endTime}` },
            { label: 'Total Amount', value: amountStr, style: 'color: #10b981; font-weight: 700;' }
          ]
        );
        ownerHtml = getHtmlTemplate(
          'New Booking Request Received',
          'Venue Owner',
          `You have received a new booking request for your venue <strong>${venueName}</strong>. Please log in to your dashboard to Accept or Reject this booking before the deadline.`,
          [
            { label: 'Booking Number', value: `#${bookingNo}` },
            { label: 'Customer Name', value: booking.customer?.name || booking.customerDetails?.name || 'N/A' },
            { label: 'Date', value: bookingDateStr },
            { label: 'Time Slot', value: `${booking.startTime} - ${booking.endTime}` },
            { label: 'Your Earnings', value: `₹${(booking.ownerEarnings || 0).toLocaleString('en-IN')}`, style: 'color: #ea580c; font-weight: 700;' }
          ]
        );
        break;

      case 'confirmed':
        subject = `Booking Confirmed #${bookingNo} - RentalMeet`;
        customerHtml = getHtmlTemplate(
          'Booking Confirmed 🎉',
          booking.customer?.name || 'Customer',
          `Great news! Your booking request for <strong>${venueName}</strong> has been confirmed by the venue owner. If you haven't completed your payment, please log in to complete it to secure your slot.`,
          [
            { label: 'Booking Number', value: `#${bookingNo}` },
            { label: 'Venue Name', value: venueName },
            { label: 'Date', value: bookingDateStr },
            { label: 'Time Slot', value: `${booking.startTime} - ${booking.endTime}` },
            { label: 'Total Amount', value: amountStr, style: 'color: #10b981; font-weight: 700;' }
          ]
        );
        ownerHtml = getHtmlTemplate(
          'Booking Confirmed Successfully',
          'Venue Owner',
          `You have successfully confirmed the booking <strong>#${bookingNo}</strong> for <strong>${venueName}</strong>. Details of the booking are outlined below.`,
          [
            { label: 'Booking Number', value: `#${bookingNo}` },
            { label: 'Customer Name', value: booking.customer?.name || 'N/A' },
            { label: 'Date', value: bookingDateStr },
            { label: 'Time Slot', value: `${booking.startTime} - ${booking.endTime}` },
            { label: 'Your Earnings', value: `₹${(booking.ownerEarnings || 0).toLocaleString('en-IN')}`, style: 'color: #ea580c; font-weight: 700;' }
          ]
        );
        break;

      case 'completed':
        subject = `Booking Completed #${bookingNo} - RentalMeet`;
        customerHtml = getHtmlTemplate(
          'Booking Completed',
          booking.customer?.name || 'Customer',
          `Your booking <strong>#${bookingNo}</strong> for <strong>${venueName}</strong> has been marked as completed. Thank you for choosing RentalMeet! We hope you had a great experience.`,
          [
            { label: 'Booking Number', value: `#${bookingNo}` },
            { label: 'Venue Name', value: venueName },
            { label: 'Date', value: bookingDateStr },
            { label: 'Time Slot', value: `${booking.startTime} - ${booking.endTime}` }
          ]
        );
        ownerHtml = getHtmlTemplate(
          'Booking Completed',
          'Venue Owner',
          `The booking <strong>#${bookingNo}</strong> for <strong>${venueName}</strong> has been marked as completed. The earnings have been credited to your venue statistics.`,
          [
            { label: 'Booking Number', value: `#${bookingNo}` },
            { label: 'Date', value: bookingDateStr },
            { label: 'Time Slot', value: `${booking.startTime} - ${booking.endTime}` },
            { label: 'Your Earnings', value: `₹${(booking.ownerEarnings || 0).toLocaleString('en-IN')}`, style: 'color: #ea580c; font-weight: 700;' }
          ]
        );
        break;

      case 'cancelled':
        subject = `Booking Cancelled #${bookingNo} - RentalMeet`;
        const reasonStr = booking.cancellationReason || 'No reason specified';
        customerHtml = getHtmlTemplate(
          'Booking Cancelled',
          booking.customer?.name || 'Customer',
          `We regret to inform you that your booking <strong>#${bookingNo}</strong> for <strong>${venueName}</strong> has been cancelled.<br><br><strong>Reason for cancellation:</strong> ${reasonStr}${booking.refundDetails?.refundAmount > 0 ? `<br><br><span style="color: #10b981; font-weight: 600;">A refund of ₹${booking.refundDetails.refundAmount.toLocaleString('en-IN')} has been initiated to your original payment method.</span>` : ''}`,
          [
            { label: 'Booking Number', value: `#${bookingNo}` },
            { label: 'Venue Name', value: venueName },
            { label: 'Date', value: bookingDateStr },
            { label: 'Time Slot', value: `${booking.startTime} - ${booking.endTime}` }
          ]
        );
        ownerHtml = getHtmlTemplate(
          'Booking Cancelled',
          'Venue Owner',
          `The booking <strong>#${bookingNo}</strong> for your venue <strong>${venueName}</strong> has been cancelled.<br><br><strong>Reason for cancellation:</strong> ${reasonStr}`,
          [
            { label: 'Booking Number', value: `#${bookingNo}` },
            { label: 'Date', value: bookingDateStr },
            { label: 'Time Slot', value: `${booking.startTime} - ${booking.endTime}` }
          ]
        );
        break;

      default:
        return;
    }

    // 1. Generate DB Notifications (Run before sending emails so email failure doesn't block it)
    try {
      const Notification = require('../models/Notification');
      const notificationsToCreate = [];

      let customerTitle = '';
      let customerMsg = '';
      let ownerTitle = '';
      let ownerMsg = '';
      let typeStr = 'general';

      switch (eventType) {
        case 'created':
          customerTitle = 'Booking Request Received';
          customerMsg = `Your booking request for ${venueName} has been received and is pending owner confirmation. Booking No: #${bookingNo}`;
          ownerTitle = 'New Booking Request';
          ownerMsg = `You have received a new booking request for your venue ${venueName}. Booking No: #${bookingNo}`;
          typeStr = 'booking_created';
          break;
        case 'confirmed':
          customerTitle = 'Booking Confirmed 🎉';
          customerMsg = `Great news! Your booking request for ${venueName} has been confirmed by the venue owner. Booking No: #${bookingNo}`;
          ownerTitle = 'Booking Confirmed Successfully';
          ownerMsg = `You have successfully confirmed the booking #${bookingNo} for ${venueName}.`;
          typeStr = 'booking_confirmed';
          break;
        case 'completed':
          customerTitle = 'Booking Completed';
          customerMsg = `Your booking #${bookingNo} for ${venueName} has been marked as completed.`;
          ownerTitle = 'Booking Completed';
          ownerMsg = `The booking #${bookingNo} for ${venueName} has been completed.`;
          typeStr = 'booking_completed';
          break;
        case 'cancelled':
          customerTitle = 'Booking Cancelled';
          customerMsg = `Your booking for ${venueName} has been cancelled. Booking No: #${bookingNo}`;
          ownerTitle = 'Booking Cancelled';
          ownerMsg = `The booking #${bookingNo} for ${venueName} has been cancelled.`;
          typeStr = 'booking_cancelled';
          break;
      }

      // Add customer notification
      const custId = booking.customer?._id || booking.customer;
      if (custId) {
        notificationsToCreate.push({
          userId: custId,
          type: typeStr,
          title: customerTitle,
          body: customerMsg,
          data: { link: '/customer/bookings' }
        });
      }

      // Add owner notification
      const ownerId = booking.venue?.owner?._id || booking.venue?.owner;
      if (ownerId) {
        notificationsToCreate.push({
          userId: ownerId,
          type: typeStr,
          title: ownerTitle,
          body: ownerMsg,
          data: { link: '/owner/bookings' }
        });
      }

      if (notificationsToCreate.length > 0) {
        await Notification.insertMany(notificationsToCreate);
        console.log(`[NOTIFICATION] Created ${notificationsToCreate.length} DB notifications for booking #${bookingNo}`);
      }
    } catch (notifErr) {
      console.error('[NOTIFICATION] Failed to create DB notifications:', notifErr.message);
    }

    // 2. Send Emails (Wrap in try-catch so it is non-blocking)
    try {
      const emailPromises = [];
      if (customerEmail) {
        emailPromises.push(
          this.sendEmail({
            email: customerEmail,
            subject,
            html: customerHtml
          })
        );
      }
      if (ownerEmail) {
        emailPromises.push(
          this.sendEmail({
            email: ownerEmail,
            subject,
            html: ownerHtml
          })
        );
      }

      await Promise.all(emailPromises);
      console.log(`[EMAIL] Sent ${eventType} booking notification emails for #${bookingNo}`);
    } catch (emailErr) {
      console.error(`[EMAIL] Email delivery failed for booking #${bookingNo}:`, emailErr.message);
    }

  } catch (error) {
    console.error(`[EMAIL] Error in sendBookingEmail:`, error.message);
  }
};

exports.sendOtpVerificationEmail = async (email, name, otp) => {
  const otpHtml = `
    <div style="text-align: center; margin: 30px 0;">
      <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 14px 18px; display: inline-block; color: #ea580c; text-align: center; font-family: 'Segoe UI', Arial, sans-serif;">
        ${otp}
      </div>
      <p style="margin: 16px 0 0; color: #64748b; font-size: 13px;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
    </div>
  `;

  const html = getHtmlTemplate(
    'Verify Your RentalMeet Account',
    name || 'Customer',
    'Thank you for registering on RentalMeet. Use the OTP below to verify your email address.',
    null,
    otpHtml
  );

  await this.sendEmail({
    email,
    subject: 'RentalMeet Email Verification OTP',
    html
  });
};

exports.sendPasswordResetEmail = async (email, name, otp) => {
  const otpHtml = `
    <div style="text-align: center; margin: 30px 0;">
      <div style="font-size: 28px; font-weight: 700; letter-spacing: 6px; background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 10px; padding: 14px 18px; display: inline-block; color: #9a3412; text-align: center; font-family: 'Segoe UI', Arial, sans-serif;">
        ${otp}
      </div>
      <p style="margin: 16px 0 0; color: #64748b; font-size: 13px;">This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
    </div>
  `;

  const html = getHtmlTemplate(
    'Reset Your RentalMeet Password',
    name || 'User',
    'We received a request to reset your password. Use the OTP below to proceed with the password reset.',
    null,
    otpHtml
  );

  await this.sendEmail({
    email,
    subject: 'RentalMeet Password Reset OTP',
    html
  });
};
