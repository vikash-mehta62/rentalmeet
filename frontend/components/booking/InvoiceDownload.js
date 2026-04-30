'use client';

import React from 'react';
import { FileText } from 'lucide-react';

export default function InvoiceDownload({ booking, userRole = 'customer' }) {
  if (!booking || booking.status === 'cancelled') return null;

  const [settings, setSettings] = React.useState(null);
  const [loading, setLoading] = React.useState({ venue: false, platform: false });

  React.useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues/platform-settings/public`)
      .then(r => r.json()).then(d => { if (d.success) setSettings(d.settings); }).catch(() => {});
  }, []);

  const fmt = (n) => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const fmtDT = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  const pb = booking?.priceBreakdown || {};
  const subtotal      = pb.subtotal ?? booking?.ownerEarnings ?? 0;
  const venueCGST     = pb.venueCGST ?? (pb.gst ? pb.gst / 2 : 0);
  const venueSGST     = pb.venueSGST ?? (pb.gst ? pb.gst / 2 : 0);
  const venueCGSTRate = pb.venueCGSTRate ?? 9;
  const venueSGSTRate = pb.venueSGSTRate ?? 9;
  const venueTotal    = subtotal + venueCGST + venueSGST;
  const platformFee   = pb.platformFee ?? 0;
  const pfRate        = pb.platformFeeRate ?? 5;
  const pfCGST        = pb.platformFeeCGST ?? (pb.platformFeeGST ? pb.platformFeeGST / 2 : 0);
  const pfSGST        = pb.platformFeeSGST ?? (pb.platformFeeGST ? pb.platformFeeGST / 2 : 0);
  const pfCGSTRate    = pb.platformFeeCGSTRate ?? 9;
  const pfSGSTRate    = pb.platformFeeSGSTRate ?? 9;
  const pfTotal       = pb.platformFeeTotal ?? (platformFee + pfCGST + pfSGST);
  const discount      = pb.discount ?? 0;
  const bookingRef    = booking?.bookingNumber || booking?._id?.slice(-8).toUpperCase() || 'N/A';
  const logoUrl       = `${window?.location?.origin || ''}/logo.png`;

  // Convert image URL to base64
  const toBase64 = (url) => new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      c.getContext('2d').drawImage(img, 0, 0);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

  const generatePDF = async (type) => {
    setLoading(p => ({ ...p, [type]: true }));
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const logoB64 = await toBase64(logoUrl);
      const sigB64 = type === 'venue' && settings?.gstInvoiceSignature
        ? await toBase64(settings.gstInvoiceSignature)
        : type === 'platform' && settings?.platformInvoiceSignature
        ? await toBase64(settings.platformInvoiceSignature)
        : null;

      const html = type === 'venue' ? buildVenueHTML(logoB64, sigB64) : buildPlatformHTML(logoB64, sigB64);

      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;z-index:-1';
      container.innerHTML = html;
      document.body.appendChild(container);

      await new Promise(r => setTimeout(r, 300));

      const canvas = await html2canvas(container, {
        scale: 2, useCORS: true, allowTaint: true,
        backgroundColor: '#ffffff', logging: false,
        width: 794, windowWidth: 794
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;

      // If content > 1 page, split
      const pageH = pdf.internal.pageSize.getHeight();
      if (pdfH <= pageH) {
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);
      } else {
        let yPos = 0;
        while (yPos < pdfH) {
          if (yPos > 0) pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, -yPos, pdfW, pdfH);
          yPos += pageH;
        }
      }

      const filename = type === 'venue'
        ? `VenueInvoice-${bookingRef}.pdf`
        : `PlatformInvoice-${bookingRef}.pdf`;
      pdf.save(filename);
    } catch (e) {
      console.error('PDF error:', e);
      alert('PDF generation failed. Please try again.');
    } finally {
      setLoading(p => ({ ...p, [type]: false }));
    }
  };

  const commonCSS = `
    *{margin:0;padding:0;box-sizing:border-box}
    body,div{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1f2937;-webkit-print-color-adjust:exact}
    .wrap{width:794px;background:#fff;padding:32px 36px}
    .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}
    .logo-img{height:44px;object-fit:contain}
    .brand-sub{font-size:9px;color:#6b7280;margin-top:2px}
    .inv-right{text-align:right}
    .inv-title{font-size:20px;font-weight:800;letter-spacing:1px;margin-bottom:3px}
    .inv-no{font-size:10px;color:#6b7280;margin-bottom:1px}
    .badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:9px;font-weight:700;letter-spacing:.5px;margin-top:4px}
    .badge-paid{background:#d1fae5;color:#065f46}
    .badge-pending{background:#fef3c7;color:#92400e}
    .badge-refunded{background:#e0e7ff;color:#3730a3}
    .divider{height:3px;border-radius:2px;margin-bottom:16px}
    .two-col{display:flex;gap:12px;margin-bottom:16px}
    .card{flex:1;border-radius:8px;padding:12px;border:1px solid}
    .card-title{font-size:8px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid}
    .card-row{margin-bottom:5px}
    .card-label{font-size:8px;color:#9ca3af;margin-bottom:1px}
    .card-val{font-size:10px;font-weight:600;color:#111827}
    table{width:100%;border-collapse:collapse;margin-bottom:14px}
    th{padding:7px 9px;text-align:left;font-size:8px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#fff}
    td{padding:6px 9px;border-bottom:1px solid #f3f4f6;font-size:10px;vertical-align:top}
    .right{text-align:right}
    .totals{border-radius:8px;padding:12px 14px;margin-bottom:14px}
    .tot-row{display:flex;justify-content:space-between;padding:3px 0;font-size:10px}
    .tot-sep{border-top:1px solid rgba(0,0,0,.1);margin-top:5px;padding-top:6px}
    .tot-grand{font-size:13px;font-weight:800;border-top:2px solid rgba(0,0,0,.15);margin-top:5px;padding-top:7px}
    .note{border-radius:6px;padding:9px 11px;font-size:9px;margin-bottom:12px;border:1px solid}
    .sig-area{display:flex;justify-content:flex-end;margin-bottom:12px}
    .sig-box{text-align:center;min-width:130px}
    .sig-img{height:44px;margin-bottom:3px;object-fit:contain}
    .sig-line{border-top:1px solid #374151;padding-top:3px;font-size:8px;font-weight:600;color:#374151}
    .footer{text-align:center;font-size:8px;color:#9ca3af;padding-top:8px;border-top:1px solid #e5e7eb}
  `;

  const buildVenueHTML = (logoB64, sigB64) => {
    const amenRows = [];
    const basic = (booking?.selectedAmenities?.basic || []).filter(a => a.type === 'Paid' && a.total > 0);
    const bev = booking?.selectedAmenities?.beverages || [];
    const food = booking?.selectedAmenities?.refreshmentFood || [];
    const thalis = booking?.selectedAmenities?.lunchThalis || [];
    const add = (booking?.selectedAmenities?.additional || []).filter(a => a.total > 0);
    [...basic, ...bev, ...food, ...thalis, ...add].forEach(a => {
      const name = a.name || a.thaliType || 'Item';
      const qty = a.quantity || 1;
      const rate = a.rate || a.ratePerUnit || a.ratePerPlate || a.charges || 0;
      const total = a.total || 0;
      amenRows.push(`<tr><td style="padding-left:18px">${name}</td><td>${qty}</td><td class="right">₹${fmt(rate)}</td><td class="right">₹${fmt(total)}</td></tr>`);
    });

    return `<div class="wrap" style="font-family:'Segoe UI',Arial,sans-serif">
      <style>${commonCSS}</style>
      <div class="hdr">
        <div>
          ${logoB64 ? `<img src="${logoB64}" class="logo-img" alt="RentalMeet"/>` : `<div style="font-size:20px;font-weight:800;color:#F59E0B">RentalMeet</div>`}
          <div class="brand-sub">Book Your Premium Meeting Venue</div>
          <div style="font-size:9px;color:#6b7280;margin-top:2px">support@rentalmeet.com</div>
        </div>
        <div class="inv-right">
          <div class="inv-title" style="color:#F59E0B">TAX INVOICE</div>
          <div class="inv-no">Invoice No: <strong>${bookingRef}</strong></div>
          <div class="inv-no">Date: ${fmtDate(booking?.createdAt)}</div>
          <span class="badge badge-${booking?.paymentStatus||'pending'}">${(booking?.paymentStatus||'pending').toUpperCase()}</span>
        </div>
      </div>
      <div class="divider" style="background:linear-gradient(90deg,#F59E0B,#FCD34D)"></div>

      <div class="two-col">
        <div class="card" style="background:#fffbeb;border-color:#fde68a">
          <div class="card-title" style="color:#92400e;border-color:#fde68a">Billed To</div>
          <div class="card-row"><div class="card-label">Customer Name</div><div class="card-val">${booking?.customer?.name||booking?.customerDetails?.name||'N/A'}</div></div>
          <div class="card-row"><div class="card-label">Email</div><div class="card-val">${booking?.customer?.email||booking?.customerDetails?.email||'N/A'}</div></div>
          <div class="card-row"><div class="card-label">Phone</div><div class="card-val">${booking?.customerDetails?.phone||booking?.customer?.phone||'N/A'}</div></div>
          ${booking?.customerDetails?.eventType?`<div class="card-row"><div class="card-label">Event Type</div><div class="card-val">${booking.customerDetails.eventType}</div></div>`:''}
          ${booking?.customerDetails?.guestCount?`<div class="card-row"><div class="card-label">Guests</div><div class="card-val">${booking.customerDetails.guestCount}</div></div>`:''}
        </div>
        <div class="card" style="background:#fffbeb;border-color:#fde68a">
          <div class="card-title" style="color:#92400e;border-color:#fde68a">Supplier (Venue)</div>
          <div class="card-row"><div class="card-label">Venue Name</div><div class="card-val">${booking?.venue?.businessName||'N/A'}</div></div>
          <div class="card-row"><div class="card-label">Location</div><div class="card-val">${booking?.venue?.location?.city||''}${booking?.venue?.location?.area?', '+booking.venue.location.area:''}</div></div>
          <div class="card-row"><div class="card-label">GSTIN</div><div class="card-val">${booking?.venue?.documents?.gstNumber||'Not Available'}</div></div>
          <div class="card-row"><div class="card-label">HSN Code</div><div class="card-val">9973</div></div>
          <div class="card-row"><div class="card-label">Booking Date</div><div class="card-val">${fmtDate(booking?.bookingDate)}</div></div>
          <div class="card-row"><div class="card-label">Time Slot</div><div class="card-val">${booking?.startTime||''} – ${booking?.endTime||''} (${booking?.bookingType||''})</div></div>
        </div>
      </div>

      <table>
        <thead><tr style="background:#F59E0B">
          <th>Description</th><th>Qty</th><th class="right">Rate</th><th class="right">Amount</th>
        </tr></thead>
        <tbody>
          <tr><td><strong>Venue Rental – ${booking?.venue?.businessName||''}</strong><br><span style="font-size:8px;color:#6b7280">${fmtDate(booking?.bookingDate)} | ${booking?.startTime||''} – ${booking?.endTime||''}</span></td><td style="text-transform:capitalize">${booking?.bookingType||''}</td><td class="right">—</td><td class="right"><strong>₹${fmt(pb.basePrice||0)}</strong></td></tr>
          ${amenRows.length ? `<tr style="background:#fef9c3"><td colspan="4" style="font-size:8px;font-weight:700;color:#92400e;padding:4px 9px">AMENITIES & SERVICES</td></tr>${amenRows.join('')}` : ''}
          ${pb.amenitiesTotal>0?`<tr style="background:#f9fafb"><td colspan="3"><strong>Amenities Subtotal</strong></td><td class="right"><strong>₹${fmt(pb.amenitiesTotal)}</strong></td></tr>`:''}
        </tbody>
      </table>

      <div class="totals" style="background:#fffbeb;border:1px solid #fde68a">
        <div class="tot-row"><span>Taxable Value (Subtotal)</span><span>₹${fmt(subtotal)}</span></div>
        <div class="tot-row"><span>CGST @ ${venueCGSTRate}%</span><span>₹${fmt(venueCGST)}</span></div>
        <div class="tot-row"><span>SGST @ ${venueSGSTRate}%</span><span>₹${fmt(venueSGST)}</span></div>
        ${discount>0?`<div class="tot-row" style="color:#16a34a"><span>Coupon Discount${pb.couponCode?' ('+pb.couponCode+')':''}</span><span>– ₹${fmt(discount)}</span></div>`:''}
        <div class="tot-row tot-grand" style="color:#F59E0B"><span>VENUE INVOICE TOTAL</span><span>₹${fmt(venueTotal)}</span></div>
      </div>

      ${booking?.paymentDetails?.razorpay_payment_id?`
      <div class="note" style="background:#f0fdf4;border-color:#bbf7d0;color:#166534">
        <strong>Payment Details</strong> &nbsp;|&nbsp;
        Payment ID: ${booking.paymentDetails.razorpay_payment_id} &nbsp;|&nbsp;
        Order ID: ${booking.paymentDetails.razorpay_order_id||'—'} &nbsp;|&nbsp;
        Paid: ${fmtDT(booking.paymentDetails.paidAt)}
      </div>`:''}

      ${sigB64?`<div class="sig-area"><div class="sig-box"><img src="${sigB64}" class="sig-img"/><div class="sig-line">Authorized Signatory</div></div></div>`:''}

      <div class="footer">
        <p><strong>RentalMeet</strong> — Book Your Premium Meeting Venue &nbsp;|&nbsp; support@rentalmeet.com</p>
        <p style="margin-top:2px">Booking Ref: ${bookingRef} &nbsp;|&nbsp; Generated: ${fmtDT(new Date())} &nbsp;|&nbsp; Computer-generated invoice</p>
      </div>
    </div>`;
  };

  const buildPlatformHTML = (logoB64, sigB64) => `<div class="wrap" style="font-family:'Segoe UI',Arial,sans-serif">
    <style>${commonCSS}</style>
    <div class="hdr">
      <div>
        ${logoB64 ? `<img src="${logoB64}" class="logo-img" alt="RentalMeet"/>` : `<div style="font-size:20px;font-weight:800;color:#0ea5e9">RentalMeet</div>`}
        <div class="brand-sub">Platform Service Invoice</div>
        <div style="font-size:9px;color:#6b7280;margin-top:2px">support@rentalmeet.com</div>
      </div>
      <div class="inv-right">
        <div class="inv-title" style="color:#0ea5e9">PLATFORM INVOICE</div>
        <div class="inv-no">Ref No: <strong>${bookingRef}</strong></div>
        <div class="inv-no">Date: ${fmtDate(booking?.createdAt)}</div>
        <span class="badge badge-${booking?.paymentStatus||'pending'}">${(booking?.paymentStatus||'pending').toUpperCase()}</span>
      </div>
    </div>
    <div class="divider" style="background:linear-gradient(90deg,#0ea5e9,#38bdf8)"></div>

    <div class="two-col">
      <div class="card" style="background:#f0f9ff;border-color:#bae6fd">
        <div class="card-title" style="color:#0c4a6e;border-color:#bae6fd">Billed To</div>
        <div class="card-row"><div class="card-label">Customer Name</div><div class="card-val">${booking?.customer?.name||booking?.customerDetails?.name||'N/A'}</div></div>
        <div class="card-row"><div class="card-label">Email</div><div class="card-val">${booking?.customer?.email||booking?.customerDetails?.email||'N/A'}</div></div>
        <div class="card-row"><div class="card-label">Phone</div><div class="card-val">${booking?.customerDetails?.phone||booking?.customer?.phone||'N/A'}</div></div>
      </div>
      <div class="card" style="background:#f0f9ff;border-color:#bae6fd">
        <div class="card-title" style="color:#0c4a6e;border-color:#bae6fd">Supplier (Platform)</div>
        <div class="card-row"><div class="card-label">Company</div><div class="card-val">RentalMeet Technologies</div></div>
        <div class="card-row"><div class="card-label">GSTIN</div><div class="card-val">Not Available</div></div>
        <div class="card-row"><div class="card-label">HSN Code</div><div class="card-val">999799</div></div>
        <div class="card-row"><div class="card-label">Reference Booking</div><div class="card-val">${bookingRef}</div></div>
        <div class="card-row"><div class="card-label">Venue</div><div class="card-val">${booking?.venue?.businessName||'N/A'}</div></div>
      </div>
    </div>

    <table>
      <thead><tr style="background:#0ea5e9">
        <th>Description</th><th>Rate</th><th class="right">Base Amount</th><th class="right">Amount</th>
      </tr></thead>
      <tbody>
        <tr><td><strong>Platform Service Fee</strong><br><span style="font-size:8px;color:#6b7280">Booking facilitation for ${booking?.venue?.businessName||''} on ${fmtDate(booking?.bookingDate)}</span></td><td>${pfRate}% of base</td><td class="right">₹${fmt(subtotal)}</td><td class="right"><strong>₹${fmt(platformFee)}</strong></td></tr>
      </tbody>
    </table>

    <div class="totals" style="background:#f0f9ff;border:1px solid #bae6fd">
      <div class="tot-row"><span>Platform Service Fee (${pfRate}%)</span><span>₹${fmt(platformFee)}</span></div>
      <div class="tot-row"><span>CGST @ ${pfCGSTRate}%</span><span>₹${fmt(pfCGST)}</span></div>
      <div class="tot-row"><span>SGST @ ${pfSGSTRate}%</span><span>₹${fmt(pfSGST)}</span></div>
      <div class="tot-row tot-grand" style="color:#0ea5e9"><span>PLATFORM INVOICE TOTAL</span><span>₹${fmt(pfTotal)}</span></div>
    </div>

    <div class="note" style="background:#fefce8;border-color:#fde68a;color:#713f12">
      <strong>Note:</strong> This invoice covers RentalMeet platform service charges only. Venue rental and GST are billed separately in the Venue Tax Invoice.
    </div>

    ${sigB64?`<div class="sig-area"><div class="sig-box"><img src="${sigB64}" class="sig-img"/><div class="sig-line">Authorized Signatory</div></div></div>`:''}

    <div class="footer">
      <p><strong>RentalMeet</strong> — Platform Service Invoice &nbsp;|&nbsp; support@rentalmeet.com</p>
      <p style="margin-top:2px">Booking Ref: ${bookingRef} &nbsp;|&nbsp; Generated: ${fmtDT(new Date())} &nbsp;|&nbsp; Computer-generated invoice</p>
    </div>
  </div>`;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button onClick={() => generatePDF('venue')} disabled={loading.venue}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-60">
        <FileText className="w-3.5 h-3.5" />
        {loading.venue ? 'Generating...' : 'Venue Invoice'}
      </button>
      <button onClick={() => generatePDF('platform')} disabled={loading.platform}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-60">
        <FileText className="w-3.5 h-3.5" />
        {loading.platform ? 'Generating...' : 'Platform Invoice'}
      </button>
    </div>
  );
}
