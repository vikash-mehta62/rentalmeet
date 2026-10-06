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
    const isServiceBooking = !booking.venue && (booking.service || booking.serviceSnapshot || booking.vendor || booking.customerInfo);
    const providerLabel = isServiceBooking ? 'Service Vendor' : 'Venue Owner';
    const itemLabel = isServiceBooking ? 'Service Name' : 'Venue Name';
    const itemType = isServiceBooking ? 'service' : 'venue';
    const reviewerLabel = isServiceBooking ? 'service vendor' : 'venue owner';

    const customerEmail = booking.customer?.email || booking.customerDetails?.email || booking.customerInfo?.email;
    const providerEmail = isServiceBooking ? booking.vendor?.email : booking.venue?.owner?.email;
    const customerName = booking.customer?.name || booking.customerDetails?.name || booking.customerInfo?.name || 'Customer';
    const businessName = isServiceBooking
      ? (booking.service?.title || booking.serviceSnapshot?.title || booking.title || 'Service')
      : (booking.venue?.businessName || 'Venue');
    const bookingNo = booking.bookingNumber || booking.quotationNumber || booking._id?.toString()?.slice(-8)?.toUpperCase() || 'N/A';
    const bookingDate = booking.bookingDate || booking.eventDate;
    const bookingDateStr = bookingDate ? new Date(bookingDate).toLocaleDateString('en-IN') : 'N/A';
    const serviceTime = String(booking.customerInfo?.notes || '').match(/Preferred Time:\s*([^|]+)/i)?.[1]?.trim();
    const timeSlot = isServiceBooking ? (serviceTime || 'N/A') : `${booking.startTime || 'N/A'} - ${booking.endTime || 'N/A'}`;
    const amount = Number(booking.amount ?? booking.pricing?.total ?? 0);
    const amountStr = `₹${amount.toLocaleString('en-IN')}`;
    const serviceVendorEarnings = Math.max(
      Number(booking.pricing?.total ?? booking.amount ?? 0) -
      Number(booking.pricing?.platformFee ?? 0) -
      Number(booking.pricing?.platformFeeGST ?? 0),
      0
    );
    const providerEarnings = isServiceBooking
      ? Number(booking.settlementDetails?.amount ?? serviceVendorEarnings)
      : Number(booking.ownerEarnings || 0);
    const providerEarningsStr = `₹${providerEarnings.toLocaleString('en-IN')}`;

    if (!customerEmail && !providerEmail) {
      console.warn(`[EMAIL] No customer or ${isServiceBooking ? 'vendor' : 'owner'} email found for booking:`, bookingNo);
      return;
    }

    const bookingDetails = [
      { label: 'Booking Number', value: `#${bookingNo}` },
      { label: itemLabel, value: businessName },
      { label: 'Date', value: bookingDateStr },
      { label: 'Time Slot', value: timeSlot }
    ];

    const customerDetails = [
      ...bookingDetails,
      { label: 'Total Amount', value: amountStr, style: 'color: #10b981; font-weight: 700;' }
    ];

    const providerDetails = [
      { label: 'Booking Number', value: `#${bookingNo}` },
      { label: 'Customer Name', value: customerName },
      { label: 'Date', value: bookingDateStr },
      { label: 'Time Slot', value: timeSlot },
      { label: 'Your Earnings', value: providerEarningsStr, style: 'color: #ea580c; font-weight: 700;' }
    ];

    let subject = '';
    let customerHtml = '';
    let providerHtml = '';
    let customerTitle = '';
    let customerMsg = '';
    let providerTitle = '';
    let providerMsg = '';
    let typeStr = 'general';

    switch (eventType) {
      case 'enquiry':
        subject = `New Service Enquiry #${bookingNo} - RentalMeet`;
        customerTitle = 'Service Enquiry Received';
        customerMsg = `Your enquiry for ${businessName} has been received. Enquiry No: #${bookingNo}`;
        providerTitle = 'New Service Enquiry';
        providerMsg = `You have received a new service enquiry for ${businessName}. Enquiry No: #${bookingNo}`;
        typeStr = 'booking_created';
        customerHtml = getHtmlTemplate(
          customerTitle,
          customerName,
          `Your enquiry for <strong>${businessName}</strong> has been received. The service vendor can review the enquiry and contact you for the next step.`,
          customerDetails
        );
        providerHtml = getHtmlTemplate(
          providerTitle,
          providerLabel,
          `You have received a new enquiry for your service <strong>${businessName}</strong>. Please review the customer details in your vendor dashboard.`,
          providerDetails
        );
        break;

      case 'created':
        subject = `New Booking Request #${bookingNo} - RentalMeet`;
        customerTitle = 'Booking Request Received';
        customerMsg = `Your booking request for ${businessName} has been received and is pending ${reviewerLabel} confirmation. Booking No: #${bookingNo}`;
        providerTitle = 'New Booking Request';
        providerMsg = `You have received a new booking request for ${businessName}. Booking No: #${bookingNo}`;
        typeStr = 'booking_created';
        customerHtml = getHtmlTemplate(
          customerTitle,
          customerName,
          `Your booking request for <strong>${businessName}</strong> has been received and is pending ${reviewerLabel} confirmation. We will notify you once it is reviewed.`,
          customerDetails
        );
        providerHtml = getHtmlTemplate(
          'New Booking Request Received',
          providerLabel,
          `You have received a new booking request for your ${itemType} <strong>${businessName}</strong>. Please log in to your dashboard to review this booking before the deadline.`,
          providerDetails
        );
        break;

      case 'confirmed':
        subject = `Booking Confirmed #${bookingNo} - RentalMeet`;
        customerTitle = 'Booking Confirmed 🎉';
        customerMsg = `Great news! Your booking request for ${businessName} has been confirmed. Booking No: #${bookingNo}`;
        providerTitle = 'Booking Confirmed Successfully';
        providerMsg = `You have successfully confirmed booking #${bookingNo} for ${businessName}.`;
        typeStr = 'booking_confirmed';
        customerHtml = getHtmlTemplate(
          customerTitle,
          customerName,
          `Great news! Your booking request for <strong>${businessName}</strong> has been confirmed.`,
          customerDetails
        );
        providerHtml = getHtmlTemplate(
          providerTitle,
          providerLabel,
          `You have successfully confirmed the booking <strong>#${bookingNo}</strong> for <strong>${businessName}</strong>.`,
          providerDetails
        );
        break;

      case 'completed':
        subject = `Booking Completed #${bookingNo} - RentalMeet`;
        customerTitle = 'Booking Completed';
        customerMsg = `Your booking #${bookingNo} for ${businessName} has been marked as completed.`;
        providerTitle = 'Booking Completed';
        providerMsg = `The booking #${bookingNo} for ${businessName} has been completed.`;
        typeStr = 'booking_completed';
        customerHtml = getHtmlTemplate(
          customerTitle,
          customerName,
          `Your booking <strong>#${bookingNo}</strong> for <strong>${businessName}</strong> has been marked as completed. Thank you for choosing RentalMeet.`,
          bookingDetails
        );
        providerHtml = getHtmlTemplate(
          providerTitle,
          providerLabel,
          `The booking <strong>#${bookingNo}</strong> for <strong>${businessName}</strong> has been marked as completed. Settlement will be processed as configured.`,
          providerDetails
        );
        break;

      case 'cancelled': {
        subject = `Booking Cancelled #${bookingNo} - RentalMeet`;
        const reasonStr = booking.cancellationReason || 'No reason specified';
        const refundText = booking.refundDetails?.refundAmount > 0
          ? `<br><br><span style="color: #10b981; font-weight: 600;">A refund of ₹${Number(booking.refundDetails.refundAmount || 0).toLocaleString('en-IN')} has been initiated to your original payment method.</span>`
          : '';
        customerTitle = 'Booking Cancelled';
        customerMsg = `Your booking for ${businessName} has been cancelled. Booking No: #${bookingNo}`;
        providerTitle = 'Booking Cancelled';
        providerMsg = `The booking #${bookingNo} for ${businessName} has been cancelled.`;
        typeStr = 'booking_cancelled';
        customerHtml = getHtmlTemplate(
          customerTitle,
          customerName,
          `We regret to inform you that your booking <strong>#${bookingNo}</strong> for <strong>${businessName}</strong> has been cancelled.<br><br><strong>Reason for cancellation:</strong> ${reasonStr}${refundText}`,
          bookingDetails
        );
        providerHtml = getHtmlTemplate(
          providerTitle,
          providerLabel,
          `The booking <strong>#${bookingNo}</strong> for your ${itemType} <strong>${businessName}</strong> has been cancelled.<br><br><strong>Reason for cancellation:</strong> ${reasonStr}`,
          bookingDetails
        );
        break;
      }

      case 'modified':
        subject = `Booking Modified #${bookingNo} - RentalMeet`;
        customerTitle = 'Booking Modified';
        customerMsg = `Your booking #${bookingNo} for ${businessName} has been updated.`;
        providerTitle = 'Booking Modified';
        providerMsg = `The booking #${bookingNo} for ${businessName} has been updated.`;
        typeStr = 'booking_modified';
        customerHtml = getHtmlTemplate(
          customerTitle,
          customerName,
          `Your booking <strong>#${bookingNo}</strong> for <strong>${businessName}</strong> has been updated.`,
          customerDetails
        );
        providerHtml = getHtmlTemplate(
          providerTitle,
          providerLabel,
          `The booking <strong>#${bookingNo}</strong> for <strong>${businessName}</strong> has been updated. Please review the latest details in your dashboard.`,
          providerDetails
        );
        break;

      case 'approve_soon':
        subject = `Booking Confirmation Deadline Extended #${bookingNo} - RentalMeet`;
        customerTitle = 'Confirmation Deadline Extended';
        customerMsg = `The confirmation window for booking #${bookingNo} has been extended by the ${reviewerLabel}.`;
        providerTitle = 'Confirmation Deadline Extended';
        providerMsg = `You extended the confirmation window for booking #${bookingNo}.`;
        typeStr = 'booking_approve_soon';
        customerHtml = getHtmlTemplate(
          customerTitle,
          customerName,
          `The ${reviewerLabel} needs more time. The confirmation window for your booking <strong>#${bookingNo}</strong> has been extended.`,
          customerDetails
        );
        providerHtml = getHtmlTemplate(
          providerTitle,
          providerLabel,
          `You extended the confirmation window for booking <strong>#${bookingNo}</strong> for <strong>${businessName}</strong>.`,
          providerDetails
        );
        break;

      default:
        return;
    }

    try {
      const Notification = require('../models/Notification');
      const notificationsToCreate = [];
      const custId = booking.customer?._id || booking.customer;
      const providerId = isServiceBooking
        ? (booking.vendor?._id || booking.vendor)
        : (booking.venue?.owner?._id || booking.venue?.owner);
      const customerLink = isServiceBooking ? '/customer/service-bookings' : '/customer/bookings';
      const providerLink = isServiceBooking ? '/vendor/bookings' : '/owner/bookings';

      if (custId) {
        notificationsToCreate.push({
          userId: custId,
          type: typeStr,
          title: customerTitle,
          body: customerMsg,
          data: { link: customerLink, bookingId: booking._id, bookingNumber: bookingNo }
        });
      }

      if (providerId) {
        notificationsToCreate.push({
          userId: providerId,
          type: typeStr,
          title: providerTitle,
          body: providerMsg,
          data: { link: providerLink, bookingId: booking._id, bookingNumber: bookingNo }
        });
      }

      if (notificationsToCreate.length > 0) {
        await Notification.insertMany(notificationsToCreate);
        console.log(`[NOTIFICATION] Created ${notificationsToCreate.length} DB notifications for booking #${bookingNo}`);
      }
    } catch (notifErr) {
      console.error('[NOTIFICATION] Failed to create DB notifications:', notifErr.message);
    }

    try {
      const emailPromises = [];
      if (customerEmail && customerHtml) {
        emailPromises.push(exports.sendEmail({ email: customerEmail, subject, html: customerHtml }));
      }
      if (providerEmail && providerHtml) {
        emailPromises.push(exports.sendEmail({ email: providerEmail, subject, html: providerHtml }));
      }

      if (emailPromises.length > 0) {
        await Promise.all(emailPromises);
        console.log(`[EMAIL] Sent ${eventType} booking notification emails for #${bookingNo}`);
      }
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

exports.sendVenueOwnerWelcomeCredentialsEmail = async ({
  ownerEmail,
  ownerName,
  venueName,
  ambassadorName,
  ambassadorPhone,
  loginEmail,
  temporaryPassword,
  isNewAccount
}) => {
  const baseUrl = process.env.FRONTEND_URL || 'https://rentalmeet.com';
  const loginUrl = `${baseUrl}/login?role=owner`;
  const websiteUrl = baseUrl;
  const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.rentalmeetapp';
  const appStoreUrl = 'https://apps.apple.com/in/app/rentalmeet/id6785021879';
  const year = new Date().getFullYear();

  const bannerUrl = process.env.EMAIL_BANNER_URL || 'https://rentalmeet.s3.ap-south-1.amazonaws.com/public/email-assets/1791308539809-4f38d355-141f-4a7e-b655-5130dca67d65.png';

  const passwordDisplay = temporaryPassword || 'आपका मौजूदा पासवर्ड';

  const html = `
<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>बधाई हो! आपका वेन्यू अब RentalMeet पर लाइव है!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans Devanagari', 'Mangal', Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 25px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.07); border: 1px solid #e2e8f0;">
          
          <!-- Brand Header Banner Image -->
          <tr>
            <td style="padding: 0; background-color: #ffffff; text-align: center; border-radius: 16px 16px 0 0; overflow: hidden;">
              <a href="${websiteUrl}" target="_blank" style="display: block; text-decoration: none;">
                <img 
                  src="${bannerUrl}" 
                  alt="RentalMeet - Book Your Premium Meeting Venues..! Find. Compare. Book." 
                  width="640" 
                  style="width: 100%; max-width: 640px; height: auto; display: block; border: 0; outline: none; margin: 0 auto;"
                />
              </a>
              <div style="background-color: #fff7ed; padding: 10px 18px; border-bottom: 1px solid #fed7aa; color: #ea580c; font-size: 13.5px; font-weight: 800; letter-spacing: 0.5px; text-align: center;">
                🎉 वेन्यू लाइव सूचना • Venue Owner Portal
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 28px 24px 28px; text-align: left;">

              <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1.4;">
                🎉 बधाई हो! आपका वेन्यू अब RentalMeet पर लाइव है!
              </h2>

              <p style="margin: 0 0 14px 0; font-size: 16px; font-weight: 700; color: #ea580c;">
                प्रिय ${ownerName || 'Venue Owner'},
              </p>

              <p style="margin: 0 0 16px 0; font-size: 15px; color: #334155; line-height: 1.7;">
                हमें आपको यह बताते हुए बेहद खुशी हो रही है कि आपका शानदार वेन्यू <strong style="color: #0f172a; font-size: 16px;">"${venueName || 'Venue'}"</strong> अब <strong style="color: #ea580c;">RentalMeet</strong> प्लेटफॉर्म पर ग्राहकों को जानकारी (information) सुविधा देने की दृष्टि से लाइव कर दिया गया है।
              </p>

              <p style="margin: 0 0 24px 0; font-size: 15px; color: #334155; line-height: 1.7;">
                यदि आप अपने वेन्यू की विजिबिलिटी को और अधिक बढ़ाना चाहते हैं और सीधे <strong>RentalMeet</strong> के माध्यम से <strong>ऑनलाइन बुकिंग (Online Bookings)</strong> प्राप्त करना चाहते हैं, जिससे आपके वेन्यू की आय में ओर अधिक बढ़ोतरी हो, तो आज ही <strong>RentalMeet</strong> पर लॉगिन करके अपने वेन्यू की प्रोफाइल (Venue Profile) को कंप्लीट करें। प्रोफाइल कंप्लीट होने के बाद आपका वेन्यू <strong style="background-color: #dcfce7; color: #15803d; padding: 2px 8px; border-radius: 6px; border: 1px solid #86efac; font-size: 14px;">"Verified Category"</strong> में आ जाएगा।
              </p>

              <!-- RentalMeet Benefits Box -->
              <div style="background: linear-gradient(145deg, #f0fdf4 0%, #eafaf1 100%); border: 1.5px solid #86efac; border-radius: 14px; padding: 20px 22px; margin: 0 0 28px 0;">
                <div style="font-size: 16px; font-weight: 800; color: #166534; margin-bottom: 14px;">
                  ⭐ RentalMeet से जुड़ने के फायदे (सब कुछ बिल्कुल FREE):
                </div>

                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="padding: 6px 0; vertical-align: top; width: 20px; font-size: 15px; color: #16a34a;">•</td>
                    <td style="padding: 6px 0; font-size: 14px; color: #1f2937; line-height: 1.6;">
                      <strong style="color: #166534;">100% निशुल्क प्रोफाइल:</strong> आप अपनी वेन्यू प्रोफाइल को बिल्कुल फ्री (Free) में कंप्लीट कर सकते हैं।
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; vertical-align: top; width: 20px; font-size: 15px; color: #16a34a;">•</td>
                    <td style="padding: 6px 0; font-size: 14px; color: #1f2937; line-height: 1.6;">
                      <strong style="color: #166534;">कोई कमीशन नहीं:</strong> RentalMeet के माध्यम से होने वाली वेन्यू बुकिंग पर आपसे <strong style="color: #ea580c;">₹0 (कोई भी कमीशन)</strong> नहीं लिया जाएगा।
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; vertical-align: top; width: 20px; font-size: 15px; color: #16a34a;">•</td>
                    <td style="padding: 6px 0; font-size: 14px; color: #1f2937; line-height: 1.6;">
                      <strong style="color: #166534;">कोई मासिक सब्सक्रिप्शन नहीं:</strong> इस प्लेटफॉर्म का उपयोग करने के लिए आपको कोई भी मंथली सब्सक्रिप्शन या हिडन चार्ज नहीं देना है।
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; vertical-align: top; width: 20px; font-size: 15px; color: #16a34a;">•</td>
                    <td style="padding: 6px 0; font-size: 14px; color: #1f2937; line-height: 1.6;">
                      <strong style="color: #166534;">समर्पित डैशबोर्ड (Dedicated Dashboard):</strong> आपके वेन्यू को मैनेज करने के लिए एक <strong>एडवांस्ड डैशबोर्ड</strong> मिलेगा। जिससे कि आप आसानी से अपनी बुकिंग्स (Bookings), ग्राहक (Customers), वेन्यू डिटेल्स (Photos, Pricing, Amenities etc) और अपनी कमाई (Revenue) को ट्रैक और मैनेज कर सकते हैं।
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Complete Profile & Credentials Intro -->
              <h3 style="margin: 0 0 8px 0; font-size: 17px; font-weight: 800; color: #0f172a;">
                🎯 अपनी प्रोफाइल अभी कंप्लीट करें:
              </h3>
              <p style="margin: 0 0 18px 0; font-size: 14px; color: #475569; line-height: 1.6;">
                इसके लिए आप <strong>RentalMeet</strong> वेबसाइट पर विजिट करें या <strong>Google Play Store / App Store</strong> से <strong>RentalMeet App</strong> डाउनलोड करें और नीचे दिए गए लॉगिन क्रेडेंशियल के माध्यम से अपने Venue Dashboard में लॉगिन करें:
              </p>

              <!-- Credentials Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(145deg, #fffbeb 0%, #fef3c7 100%); border: 2px solid #f59e0b; border-radius: 14px; margin: 0 0 20px 0; overflow: hidden; box-shadow: 0 2px 10px rgba(245, 158, 11, 0.12);">
                <tr>
                  <td style="padding: 22px 24px;">
                    <div style="font-size: 15px; font-weight: 800; color: #92400e; margin-bottom: 14px;">
                      🔐 आपके लॉगिन क्रेडेंशियल (Login Credentials)
                    </div>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px;">
                      <tr>
                        <td style="padding: 8px 0; color: #78350f; font-weight: 700; width: 140px; vertical-align: middle;">
                          • लॉगिन पोर्टल:
                        </td>
                        <td style="padding: 8px 0;">
                          <a href="${loginUrl}" target="_blank" style="color: #ea580c; font-weight: 800; font-size: 15px; text-decoration: underline;">
                            rentalmeet.com
                          </a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #78350f; font-weight: 700; vertical-align: middle;">
                          • लॉगिन ईमेल ID:
                        </td>
                        <td style="padding: 8px 0;">
                          <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 15px; font-weight: 800; color: #0f172a; background-color: #ffffff; padding: 5px 12px; border-radius: 6px; border: 1px solid #fcd34d; display: inline-block;">
                            ${loginEmail}
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #78350f; font-weight: 700; vertical-align: middle;">
                          • पासवर्ड:
                        </td>
                        <td style="padding: 8px 0;">
                          <span style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 16px; font-weight: 900; color: #b45309; background-color: #ffffff; padding: 5px 14px; border-radius: 6px; border: 1.5px dashed #f59e0b; letter-spacing: 1px; display: inline-block;">
                            ${passwordDisplay}
                          </span>
                        </td>
                      </tr>
                    </table>

                    <!-- Note: Email only -->
                    <div style="margin-top: 16px; padding: 10px 14px; background-color: #ffffff; border-radius: 8px; border-left: 4px solid #ea580c;">
                      <p style="margin: 0; font-size: 12.5px; color: #9a3412; line-height: 1.5; font-weight: 600;">
                        ⚠️ (नोट: सुरक्षा कारणों से कृपया हमेशा अपनी रजिस्टर्ड ईमेल आईडी से ही साइन-इन करें। लॉगिन के लिए मोबाइल नंबर मान्य नहीं है।)
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Main Login Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); color: #ffffff; font-weight: 800; font-size: 16px; padding: 14px 38px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 14px rgba(234, 88, 12, 0.35);">
                      🔑 लॉगिन करें और प्रोफाइल पूरी करें &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Support Assistance -->
              <div style="background-color: #f1f5f9; border-radius: 10px; padding: 14px 18px; margin: 0 0 22px 0;">
                <p style="margin: 0; font-size: 14px; color: #334155; line-height: 1.6;">
                  📞 <strong>यदि आपको वेन्यू प्रोफाइल कंप्लीट करने में कोई समस्या आती है</strong>, तो कृप्या आप हमारी ऑनबोर्डिंग टीम से <strong><a href="tel:07554545348" style="color: #ea580c; text-decoration: none; font-weight: 700;">0755-4545348</a></strong> या <strong><a href="tel:9893072872" style="color: #ea580c; text-decoration: none; font-weight: 700;">9893072872</a></strong> पर संपर्क कर सकते हैं।
                </p>
              </div>

              <!-- Motivational Tagline -->
              <div style="text-align: center; font-weight: 800; color: #ea580c; font-size: 15px; margin: 18px 0 24px 0; padding: 10px; background-color: #fff7ed; border-radius: 8px;">
                ✨ आज ही बिना किसी खर्च के आपके वेन्यू को वेरीफाइड करें और आपकी कमाई बढ़ाएं! ✨
              </div>

              <!-- Sign-off -->
              <p style="margin: 0 0 20px 0; font-size: 14.5px; color: #334155; line-height: 1.6;">
                धन्यवाद एवं शुभकामनाएँ,<br/>
                <strong style="color: #0f172a; font-size: 15px;">टीम RentalMeet</strong>
              </p>

              <!-- App Download & Website Links Buttons -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0 10px 0;">
                <tr>
                  <td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 4px 6px;">
                          <a href="${websiteUrl}" target="_blank" style="display: inline-block; background-color: #0f172a; color: #ffffff; font-weight: 700; font-size: 13px; padding: 10px 18px; border-radius: 8px; text-decoration: none;">
                            🌐 Website Visit
                          </a>
                        </td>
                        <td style="padding: 4px 6px;">
                          <a href="${playStoreUrl}" target="_blank" style="display: inline-block; background-color: #047857; color: #ffffff; font-weight: 700; font-size: 13px; padding: 10px 18px; border-radius: 8px; text-decoration: none;">
                            📱 Google Play Store
                          </a>
                        </td>
                        <td style="padding: 4px 6px;">
                          <a href="${appStoreUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-weight: 700; font-size: 13px; padding: 10px 18px; border-radius: 8px; text-decoration: none;">
                            🍎 Apple App Store
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Disclaimer Section -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 28px; text-align: left;">
              <div style="font-size: 12.5px; font-weight: 800; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">
                📌 डिस्क्लेमर (Disclaimer):
              </div>
              <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.6; font-style: italic;">
                कृपया ध्यान दें कि RentalMeet पर आपके वेन्यू से संबंधित शुरुआती जानकारी और फोटोग्राफ सार्वजनिक रूप से उपलब्ध माध्यमों (जैसे गूगल) से केवल ग्राहकों को सूचना देने के उद्देश्य (Information Purpose) से लिए गए हैं। यदि आप इस जानकारी में कोई बदलाव करना चाहते हैं, इसे अपडेट करना चाहते हैं या प्लेटफॉर्म से हटाना चाहते हैं, तो कृपया ऊपर दिए गए क्रेडेंशियल से लॉगिन करके अपनी प्रोफाइल को अपडेट या डिलीट कर सकते है या हमारी सपोर्ट टीम से संपर्क करें।
              </p>
              <div style="margin-top: 14px; text-align: center; font-size: 11px; color: #94a3b8;">
                &copy; ${year} RentalMeet. All rights reserved. • Bhopal, MP, India
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    await exports.sendEmail({
      email: ownerEmail,
      subject: `🎉 बधाई हो! आपका वेन्यू अब RentalMeet पर लाइव है!`,
      html
    });
    console.log(`[EMAIL] Sent Owner welcome & credentials email in Hindi to ${ownerEmail}`);
    return { success: true };
  } catch (err) {
    console.error(`[EMAIL] Failed to send owner credentials email to ${ownerEmail}:`, err.message);
    throw err;
  }
};
