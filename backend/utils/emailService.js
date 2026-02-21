const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

exports.sendEmail = async (options) => {
  const mailOptions = {
    from: `RentalMeet <${process.env.SMTP_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html
  };
  
  await transporter.sendMail(mailOptions);
};

exports.sendVenueSubmissionEmail = async (ownerEmail, venueName) => {
  const html = `
    <h2>Venue Submission Received</h2>
    <p>Dear Venue Owner,</p>
    <p>Thank you for registering <strong>${venueName}</strong> on RentalMeet.</p>
    <p>Your venue is currently under review. Our team will verify your documents and get back to you within 24-48 hours.</p>
    <p><strong>Next Steps:</strong></p>
    <ul>
      <li>Document Verification: 1-2 days</li>
      <li>Site Visit (if required): 2-3 days</li>
      <li>Listing Activation: 3-5 days</li>
    </ul>
    <p>For any queries, contact us at venues@rentalmeet.com or call 0755-4545348</p>
    <br>
    <p>Best regards,<br>RentalMeet Team</p>
  `;
  
  await this.sendEmail({
    email: ownerEmail,
    subject: 'Venue Submission Received - RentalMeet',
    html
  });
};

exports.sendVenueApprovalEmail = async (ownerEmail, venueName) => {
  const html = `
    <h2>🎉 Venue Approved!</h2>
    <p>Dear Venue Owner,</p>
    <p>Congratulations! Your venue <strong>${venueName}</strong> has been approved and is now live on RentalMeet.</p>
    <p>You can now start receiving bookings. Login to your dashboard to manage your venue.</p>
    <p>Dashboard: <a href="https://rentalmeet.com/owner/dashboard">Click here</a></p>
    <br>
    <p>Best regards,<br>RentalMeet Team</p>
  `;
  
  await this.sendEmail({
    email: ownerEmail,
    subject: 'Venue Approved - RentalMeet',
    html
  });
};

exports.sendVenueRejectionEmail = async (ownerEmail, venueName, reason) => {
  const html = `
    <h2>Venue Registration Update</h2>
    <p>Dear Venue Owner,</p>
    <p>We regret to inform you that your venue <strong>${venueName}</strong> could not be approved at this time.</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>You can resubmit your venue after addressing the issues mentioned above.</p>
    <p>For assistance, contact us at venues@rentalmeet.com or call 0755-4545348</p>
    <br>
    <p>Best regards,<br>RentalMeet Team</p>
  `;
  
  await this.sendEmail({
    email: ownerEmail,
    subject: 'Venue Registration Update - RentalMeet',
    html
  });
};
