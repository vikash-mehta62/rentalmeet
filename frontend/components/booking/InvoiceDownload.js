'use client';

import { Download } from 'lucide-react';

export default function InvoiceDownload({ booking, userRole = 'customer' }) {
  const generateInvoice = () => {
    // Create invoice HTML
    const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - ${booking._id.slice(-8).toUpperCase()}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    .invoice-container { max-width: 800px; margin: 0 auto; border: 2px solid #F59F0A; padding: 30px; }
    .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 30px; border-bottom: 3px solid #F59F0A; padding-bottom: 20px; }
    .logo { font-size: 32px; font-weight: bold; color: #F59F0A; }
    .invoice-title { text-align: right; }
    .invoice-title h1 { font-size: 28px; color: #F59F0A; margin-bottom: 5px; }
    .invoice-title p { color: #666; font-size: 14px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 16px; font-weight: bold; color: #F59F0A; margin-bottom: 10px; border-bottom: 2px solid #F59F0A; padding-bottom: 5px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .info-item { padding: 8px; background: #FFF7ED; border-left: 3px solid #F59F0A; }
    .info-label { font-size: 12px; color: #666; margin-bottom: 3px; }
    .info-value { font-size: 14px; font-weight: 600; color: #333; }
    .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .table th { background: #F59F0A; color: white; padding: 12px; text-align: left; font-size: 14px; }
    .table td { padding: 10px 12px; border-bottom: 1px solid #E5E7EB; font-size: 14px; }
    .table tr:last-child td { border-bottom: none; }
    .total-section { margin-top: 20px; background: #FFF7ED; padding: 15px; border: 2px solid #F59F0A; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
    .total-row.grand { font-size: 18px; font-weight: bold; color: #F59F0A; border-top: 2px solid #F59F0A; padding-top: 12px; margin-top: 8px; }
    .footer { margin-top: 40px; text-align: center; padding-top: 20px; border-top: 2px solid #E5E7EB; color: #666; font-size: 12px; }
    .status-badge { display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .status-paid { background: #D1FAE5; color: #065F46; }
    .status-pending { background: #FEF3C7; color: #92400E; }
    @media print {
      body { padding: 0; }
      .invoice-container { border: none; }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="logo">RentalMeet</div>
        <p style="color: #666; font-size: 14px; margin-top: 5px;">Venue Booking Platform</p>
      </div>
      <div class="invoice-title">
        <h1>INVOICE</h1>
        <p>Invoice #: ${booking._id.slice(-8).toUpperCase()}</p>
        <p>Date: ${new Date(booking.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p class="status-badge status-${booking.paymentStatus}">${booking.paymentStatus.toUpperCase()}</p>
      </div>
    </div>

    <!-- Customer & Venue Info -->
    <div class="info-grid">
      <div class="section">
        <div class="section-title">BILLED TO</div>
        <div class="info-item">
          <div class="info-label">Customer Name</div>
          <div class="info-value">${booking.customer?.name || 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Email</div>
          <div class="info-value">${booking.customer?.email || 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Phone</div>
          <div class="info-value">${booking.customer?.phone || 'N/A'}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">VENUE DETAILS</div>
        <div class="info-item">
          <div class="info-label">Venue Name</div>
          <div class="info-value">${booking.venue?.businessName || 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Location</div>
          <div class="info-value">${booking.venue?.location?.city || 'N/A'}, ${booking.venue?.location?.area || 'N/A'}</div>
        </div>
        <div class="info-item">
          <div class="info-label">Booking Date</div>
          <div class="info-value">${new Date(booking.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>
    </div>

    <!-- Event Details -->
    ${booking.customerDetails ? `
      <div class="section">
        <div class="section-title">EVENT DETAILS</div>
        <div class="info-grid">
          ${booking.customerDetails.eventType ? `
            <div class="info-item">
              <div class="info-label">Event Type</div>
              <div class="info-value">${booking.customerDetails.eventType}</div>
            </div>
          ` : ''}
          ${booking.customerDetails.guestCount ? `
            <div class="info-item">
              <div class="info-label">Guest Count</div>
              <div class="info-value">${booking.customerDetails.guestCount} Guests</div>
            </div>
          ` : ''}
          ${booking.customerDetails.specialRequirements ? `
            <div class="info-item" style="grid-column: 1 / -1;">
              <div class="info-label">Special Requirements</div>
              <div class="info-value">${booking.customerDetails.specialRequirements}</div>
            </div>
          ` : ''}
        </div>
      </div>
    ` : ''}

    <!-- Booking Details -->
    <div class="section">
      <div class="section-title">BOOKING DETAILS</div>
      <table class="table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Quantity</th>
            <th>Rate</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Venue Booking</strong></td>
            <td>${booking.startTime} - ${booking.endTime}</td>
            <td style="text-transform: capitalize;">${booking.bookingType}</td>
            <td style="text-align: right; font-weight: 600;">₹${(booking.priceBreakdown?.basePrice || ((booking.amount || 0) - (booking.amenitiesTotal || 0))).toLocaleString()}</td>
          </tr>
          
          ${booking.selectedAmenities?.basic?.length > 0 ? `
            <tr style="background: #FFF7ED;">
              <td colspan="4" style="font-weight: bold; color: #F59F0A; padding: 8px 12px;">Basic Amenities</td>
            </tr>
            ${booking.selectedAmenities.basic.map(amenity => `
              <tr>
                <td style="padding-left: 24px;">${amenity.name} ${amenity.type === 'Free' ? '<span style="color: #059669; font-size: 11px;">(Free)</span>' : ''}</td>
                <td>${amenity.quantity || 1}</td>
                <td>₹${(amenity.rate || 0).toLocaleString()} ${amenity.rateType || 'Fixed'}</td>
                <td style="text-align: right; font-weight: 600;">₹${(amenity.total || 0).toLocaleString()}</td>
              </tr>
            `).join('')}
          ` : ''}
          
          ${booking.selectedAmenities?.beverages?.length > 0 ? `
            <tr style="background: #FFF7ED;">
              <td colspan="4" style="font-weight: bold; color: #F59F0A; padding: 8px 12px;">Beverages</td>
            </tr>
            ${booking.selectedAmenities.beverages.map(bev => `
              <tr>
                <td style="padding-left: 24px;">${bev.name}${bev.brand ? ` (${bev.brand})` : ''}</td>
                <td>${bev.quantity || 1}</td>
                <td>₹${(bev.ratePerUnit || 0).toLocaleString()}/unit</td>
                <td style="text-align: right; font-weight: 600;">₹${(bev.total || 0).toLocaleString()}</td>
              </tr>
            `).join('')}
          ` : ''}
          
          ${booking.selectedAmenities?.refreshmentFood?.length > 0 ? `
            <tr style="background: #FFF7ED;">
              <td colspan="4" style="font-weight: bold; color: #F59F0A; padding: 8px 12px;">Refreshments & Snacks</td>
            </tr>
            ${booking.selectedAmenities.refreshmentFood.map(food => `
              <tr>
                <td style="padding-left: 24px;">${food.name}</td>
                <td>${food.quantity || 1} plates</td>
                <td>₹${(food.ratePerPlate || 0).toLocaleString()}/plate</td>
                <td style="text-align: right; font-weight: 600;">₹${(food.total || 0).toLocaleString()}</td>
              </tr>
            `).join('')}
          ` : ''}
          
          ${booking.selectedAmenities?.lunchThalis?.length > 0 ? `
            <tr style="background: #FFF7ED;">
              <td colspan="4" style="font-weight: bold; color: #F59F0A; padding: 8px 12px;">Lunch Thalis</td>
            </tr>
            ${booking.selectedAmenities.lunchThalis.map(thali => `
              <tr>
                <td style="padding-left: 24px;">${thali.type}</td>
                <td>${thali.quantity || 1} plates</td>
                <td>₹${(thali.ratePerPlate || 0).toLocaleString()}/plate</td>
                <td style="text-align: right; font-weight: 600;">₹${(thali.total || 0).toLocaleString()}</td>
              </tr>
            `).join('')}
          ` : ''}
        </tbody>
      </table>
    </div>

    <!-- Total Section -->
    <div class="total-section">
      <div class="total-row">
        <span>Venue Rental:</span>
        <span>₹${(booking.priceBreakdown?.basePrice || ((booking.amount || 0) - (booking.amenitiesTotal || 0))).toLocaleString()}</span>
      </div>
      ${booking.amenitiesTotal > 0 ? `
        <div class="total-row">
          <span>Amenities & Services:</span>
          <span>₹${(booking.amenitiesTotal || 0).toLocaleString()}</span>
        </div>
      ` : ''}
      <div class="total-row">
        <span>Subtotal:</span>
        <span>₹${(booking.amount || 0).toLocaleString()}</span>
      </div>
      ${userRole === 'admin' || userRole === 'owner' ? `
        <div class="total-row">
          <span>Platform Commission (${booking.commissionRate}%):</span>
          <span style="color: #9333EA;">- ₹${(booking.commission || 0).toLocaleString()}</span>
        </div>
      ` : ''}
      ${userRole === 'owner' ? `
        <div class="total-row">
          <span>Your Earnings:</span>
          <span style="color: #059669;">₹${(booking.ownerEarnings || 0).toLocaleString()}</span>
        </div>
      ` : ''}
      <div class="total-row grand">
        <span>TOTAL AMOUNT:</span>
        <span>₹${(booking.amount || 0).toLocaleString()}</span>
      </div>
    </div>

    <!-- Payment Details -->
    ${booking.paymentDetails ? `
      <div class="section">
        <div class="section-title">PAYMENT INFORMATION</div>
        <div class="info-grid">
          ${booking.paymentDetails.razorpay_payment_id ? `
            <div class="info-item">
              <div class="info-label">Payment ID</div>
              <div class="info-value" style="font-size: 11px; word-break: break-all;">${booking.paymentDetails.razorpay_payment_id}</div>
            </div>
          ` : ''}
          ${booking.paymentDetails.razorpay_order_id ? `
            <div class="info-item">
              <div class="info-label">Order ID</div>
              <div class="info-value" style="font-size: 11px; word-break: break-all;">${booking.paymentDetails.razorpay_order_id}</div>
            </div>
          ` : ''}
          <div class="info-item">
            <div class="info-label">Payment Status</div>
            <div class="info-value">
              <span class="status-badge status-${booking.paymentStatus}">${booking.paymentStatus.toUpperCase()}</span>
            </div>
          </div>
          ${booking.paymentDetails.paidAt ? `
            <div class="info-item">
              <div class="info-label">Payment Date & Time</div>
              <div class="info-value">${new Date(booking.paymentDetails.paidAt).toLocaleString('en-IN', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</div>
            </div>
          ` : ''}
        </div>
      </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
      <p><strong>Thank you for choosing RentalMeet!</strong></p>
      <p style="margin-top: 10px;">For any queries, contact us at support@rentalmeet.com | +91 9999999999</p>
      <p style="margin-top: 10px; font-size: 11px; color: #999;">
        Booking ID: ${booking._id} | 
        Invoice Generated: ${new Date().toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </p>
      <p style="margin-top: 5px;">This is a computer-generated invoice and does not require a signature.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Create blob and download
    const blob = new Blob([invoiceHTML], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${booking._id.slice(-8).toUpperCase()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={generateInvoice}
      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold transition-colors"
    >
      <Download className="w-4 h-4" />
      Download Invoice
    </button>
  );
}
