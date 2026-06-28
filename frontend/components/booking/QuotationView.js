'use client';

import { useRef, useState, useEffect } from 'react';
import { Printer, Download, X, Mail, Phone, MapPin, Calendar, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { calculatePlatformFee, formatPlatformFeeLabel, getVenuePricingMeta, numberOr } from '@/lib/venuePricing';

export default function QuotationView({ 
  venue, 
  formData,        // from BookingForm component
  bookingData,     // from booking/[sku]/page.js (merged customer + booking data)
  selectedAmenities,
  quantities, 
  calculatedPrice,
  pricing,         // alias for calculatedPrice from booking/[sku]/page.js
  onClose, 
  onConfirm,
  token
}) {
  // Normalize: support both prop shapes
  const fd = formData || bookingData || {};
  const cp = calculatedPrice || pricing || {};
  const sa = selectedAmenities || {};
  const qty = quantities || {};
  
  const quotationRef = useRef(null);
  const [platformSettings, setPlatformSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues/platform-settings/public`);
        const data = await response.json();
        if (data.success) {
          // Normalize to match admin settings shape
          const feeType = data.settings.platformFeeType || data.settings.platformFee?.feeType || 'percentage';
          const feeValue = numberOr(data.settings.platformFeeValue ?? data.settings.platformFee?.feeValue ?? data.settings.platformFeePercentage, 5);
          setPlatformSettings({
            ...data.settings,
            platformFeePercentage: feeType === 'percentage' ? feeValue : 0,
            platformFeeType: feeType,
            platformFeeValue: feeValue,
            venueCGST: data.settings.venueCGST || 9,
            venueSGST: data.settings.venueSGST || 9,
            platformCGST: data.settings.platformCGST || 9,
            platformSGST: data.settings.platformSGST || 9,
          });
        } else {
          setPlatformSettings({
            venueCGST: 9,
            venueSGST: 9,
            platformCGST: 9,
            platformSGST: 9,
          });
        }
      } catch (error) {
        console.error('Error fetching platform settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const calculateVenueInvoice = () => {
    const baseAmount = (cp.basePrice || 0) + (cp.amenitiesTotal || 0);
    const pricingMeta = getVenuePricingMeta(venue, platformSettings);
    const cgstRate = cp.venueCGSTRate ?? pricingMeta.venueCGSTRate;
    const sgstRate = cp.venueSGSTRate ?? pricingMeta.venueSGSTRate;
    const venueCGST = cp.venueCGST ?? ((baseAmount * cgstRate) / 100);
    const venueSGST = cp.venueSGST ?? ((baseAmount * sgstRate) / 100);
    const total = baseAmount + venueCGST + venueSGST;
    return { baseAmount, cgst: venueCGST, sgst: venueSGST, cgstRate, sgstRate, total };
  };

  const calculatePlatformInvoice = () => {
    const baseAmount = (cp.basePrice || 0) + (cp.amenitiesTotal || 0);
    const pricingMeta = getVenuePricingMeta(venue, platformSettings);
    const feeType = cp.platformFeeType || pricingMeta.platformFeeType;
    const feeValue = numberOr(cp.platformFeeValue ?? cp.platformFeeRate, pricingMeta.platformFeeValue);
    const platformFee = cp.platformFee !== undefined
      ? numberOr(cp.platformFee, 0)
      : calculatePlatformFee(baseAmount, feeType, feeValue);
    const cgstRate = cp.platformFeeCGSTRate ?? pricingMeta.platformCGSTRate;
    const sgstRate = cp.platformFeeSGSTRate ?? pricingMeta.platformSGSTRate;
    const platformCGST = cp.platformFeeCGST ?? ((platformFee * cgstRate) / 100);
    const platformSGST = cp.platformFeeSGST ?? ((platformFee * sgstRate) / 100);
    const total = platformFee + platformCGST + platformSGST;
    const feeLabel = formatPlatformFeeLabel(feeType, feeValue);
    return { platformFee, cgst: platformCGST, sgst: platformSGST, cgstRate, sgstRate, feeType, feeValue, feeLabel, total };
  };

  const venueInvoice = calculateVenueInvoice();
  const platformInvoice = calculatePlatformInvoice();
  const subtotalBeforeDiscount = venueInvoice.total + platformInvoice.total;
  const couponDiscount = cp.discount || 0;
  const grandTotal = Math.max(0, subtotalBeforeDiscount - couponDiscount);

  // ── Common: record download/print to backend ────────────────────────────────
  const recordToBackend = async (action = 'download') => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues/${venue._id}/quotation-download`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          quotationNumber,
          action,                          // 'download' or 'print'
          totalAmount: grandTotal,
          venueSnapshot: {
            businessName: venue.businessName,
            sku: venue.sku,
            city: venue.location?.city,
            state: venue.location?.state,
            address: venue.location?.address,
            capacity: venue.capacity
          },
          customerSnapshot: {
            name: fd.customerName,
            email: fd.customerEmail,
            phone: fd.customerPhone,
            eventType: fd.eventType,
            guestCount: fd.guestCount ? Number(fd.guestCount) : undefined,
            specialRequirements: fd.specialRequirements
          },
          bookingSnapshot: {
            date: fd.bookingDate || fd.date,
            startTime: fd.startTime,
            endTime: fd.endTime,
            bookingType: fd.bookingType,
            duration: fd.duration
          },
          priceSnapshot: {
            basePrice: cp.basePrice || 0,
            amenitiesTotal: cp.amenitiesTotal || 0,
            subtotal: cp.subtotal || (cp.basePrice || 0) + (cp.amenitiesTotal || 0),
            gst: cp.gst || 0,
            platformFee: cp.platformFee || 0,
            platformFeeGST: cp.platformFeeGST || 0,
            discount: cp.discount || 0,
            grandTotal
          }
        })
      });
    } catch (e) {
      // silently fail — don't block user
    }
  };

  const handlePrint = async () => {
    await recordToBackend('print');

    // Build same invoice-style HTML for print (mirrors PDF output)
    const logoUrl = `${window.location.origin}/logo.png`;
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

    const logoB64 = await toBase64(logoUrl);
    const sigVenueB64 = platformSettings?.gstInvoiceSignature ? await toBase64(platformSettings.gstInvoiceSignature) : null;
    const sigPlatformB64 = platformSettings?.platformInvoiceSignature ? await toBase64(platformSettings.platformInvoiceSignature) : null;

    const fmt = (n) => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    // Build amenity rows
    const amenRows = [];
    const basic = (sa.basic || []).filter(a => a.type === 'Paid' && a.total > 0);
    const bev = sa.beverages || [];
    const food = sa.refreshmentFood || [];
    const thalis = sa.lunchThalis || [];
    const add = (sa.additional || []).filter(a => a.total > 0);
    [...basic, ...bev, ...food, ...thalis, ...add].forEach(a => {
      const name = a.name || a.thaliType || 'Item';
      const q = a.quantity || 1;
      const rate = a.rate || a.ratePerUnit || a.ratePerPlate || a.charges || 0;
      const total = a.total || 0;
      amenRows.push(`<tr><td style="padding-left:18px">${name}</td><td>${q}</td><td style="text-align:right">₹${fmt(rate)}</td><td style="text-align:right">₹${fmt(total)}</td></tr>`);
    });

    const css = `
      *{margin:0;padding:0;box-sizing:border-box}
      body,div{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1f2937;-webkit-print-color-adjust:exact}
      .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px}
      .logo-img{height:36px;object-fit:contain}
      .brand-sub{font-size:10px;color:#6b7280;margin-top:2px}
      .inv-right{display:flex;flex-direction:column;align-items:flex-end;text-align:right}
      .inv-title{font-size:18px;font-weight:800;letter-spacing:1px;margin-bottom:2px}
      .inv-no{font-size:10px;color:#6b7280;margin-bottom:1px}
      .badge{display:flex;align-items:center;justify-content:center;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700;letter-spacing:.5px;margin-top:4px;background:#fef3c7;color:#92400e;line-height:1;height:16px}
      .divider{height:2px;border-radius:1px;margin-bottom:10px}
      .meta{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#f9fafb;border-radius:6px;padding:8px 12px;margin-bottom:10px}
      .meta-label{font-size:9px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:0.5px}
      .meta-val{font-size:11px;font-weight:800;color:#111827}
      .meta-right{text-align:right}
      .two-col{display:flex;gap:10px;margin-bottom:10px}
      .card{flex:1;border-radius:6px;padding:10px;border:1px solid}
      .card-title{font-size:9px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:6px;padding-bottom:3px;border-bottom:1px solid}
      .card-row{display:flex;margin-bottom:4px;line-height:1.3}
      .card-label{width:90px;flex-shrink:0;font-size:10.5px;color:#6b7280;font-weight:500}
      .card-val{flex-grow:1;font-size:10.5px;font-weight:700;color:#111827;word-break:break-all}
      table{width:100%;border-collapse:collapse;margin-bottom:8px}
      th{height:26px;padding:0 8px;text-align:left;vertical-align:middle;font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#fff}
      .th-label{display:block;position:relative;top:-6px;line-height:10px}
      td{padding:5px 8px;border-bottom:1px solid #f3f4f6;font-size:11px;vertical-align:middle}
      .right{text-align:right}
      .totals{border-radius:6px;padding:8px 10px;margin-bottom:8px}
      .tot-row{display:flex;justify-content:space-between;padding:2px 0;font-size:11px}
      .tot-grand{font-size:13px;font-weight:800;border-top:1.5px solid rgba(0,0,0,.15);margin-top:4px;padding-top:4px}
      .inv-section{border:2px solid;border-radius:8px;padding:12px;margin-bottom:10px}
      .inv-section-title{font-size:13px;font-weight:900;margin-bottom:8px;padding-bottom:6px;border-bottom:1.5px solid}
      .grand-box{border-radius:8px;padding:10px 16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
      .footer{text-align:center;font-size:9px;color:#9ca3af;padding-top:6px;border-top:1px solid #e5e7eb}
      @media print{body{padding:10px}}
    `;

    const html = `<!DOCTYPE html><html><head><title>Quotation - ${quotationNumber}</title><style>${css}</style></head><body>
      <div class="hdr">
        <div>
          ${logoB64 ? `<img src="${logoB64}" class="logo-img" alt="RentalMeet"/>` : `<div style="font-size:18px;font-weight:800;color:#F59E0B">RentalMeet</div>`}
          <div class="brand-sub">Venue Booking Platform</div>
          <div style="font-size:9px;color:#6b7280;margin-top:2px">bookings@rentalmeet.com | +91 98765 43210</div>
        </div>
        <div class="inv-right">
          <div class="inv-title" style="color:#F59E0B">BOOKING QUOTATION</div>
          <div class="inv-no">Quotation No: <strong>${quotationNumber}</strong></div>
          <div class="inv-no">Date: ${fmtDate(new Date())}</div>
        </div>
      </div>
      <div class="divider" style="background:linear-gradient(90deg,#F59E0B,#FCD34D)"></div>

      <div class="meta">
        <div><div class="meta-label">Valid Until</div><div class="meta-val">${fmtDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}</div></div>
        <div class="meta-right"><div class="meta-label">Status</div><div class="meta-val" style="color:#10B981">VALID</div></div>
      </div>

      <div class="two-col">
        <div class="card" style="background:#eff6ff;border-color:#bfdbfe">
          <div class="card-title" style="color:#1e40af;border-color:#bfdbfe">Venue Details</div>
          <div class="card-row"><div class="card-label">Venue</div><div class="card-val">${venue.businessName}</div></div>
          <div class="card-row"><div class="card-label">Location</div><div class="card-val">${venue.location?.city || ''}${venue.location?.area ? ', ' + venue.location.area : ''}</div></div>
          <div class="card-row"><div class="card-label">Address</div><div class="card-val">${venue.location?.address || '—'}</div></div>
          <div class="card-row"><div class="card-label">Capacity</div><div class="card-val">${venue.capacity || '—'}</div></div>
          <div class="card-row"><div class="card-label">Date</div><div class="card-val">${fmtDate(fd.bookingDate || fd.date)}</div></div>
          <div class="card-row"><div class="card-label">Time</div><div class="card-val">${fd.startTime || ''} – ${fd.endTime || ''} (${fd.bookingType || ''})</div></div>
        </div>
        <div class="card" style="background:#f0fdf4;border-color:#bbf7d0">
          <div class="card-title" style="color:#166534;border-color:#bbf7d0">Customer Details</div>
          <div class="card-row"><div class="card-label">Name</div><div class="card-val">${fd.customerName || '—'}</div></div>
          <div class="card-row"><div class="card-label">Email</div><div class="card-val">${fd.customerEmail || '—'}</div></div>
          <div class="card-row"><div class="card-label">Phone</div><div class="card-val">${fd.customerPhone || '—'}</div></div>
          <div class="card-row"><div class="card-label">Event Type</div><div class="card-val">${fd.eventType || '—'}</div></div>
          <div class="card-row"><div class="card-label">Guests</div><div class="card-val">${fd.guestCount || '—'}</div></div>
          ${fd.isWeekend !== undefined ? `<div class="card-row"><div class="card-label">Day Type</div><div class="card-val">${fd.isWeekend ? 'Weekend' : 'Weekday'}</div></div>` : ''}
        </div>
      </div>

      <!-- Estimate 1: Venue -->
      <div class="inv-section" style="border-color:#93c5fd;background:linear-gradient(135deg,#eff6ff,#fff)">
        <div class="inv-section-title" style="color:#1e40af;border-color:#93c5fd">📄 VENUE RENTAL ESTIMATE &nbsp;<span style="font-size:11px;font-weight:600;color:#6b7280">${quotationNumber}-V</span></div>
        <table>
          <thead><tr style="background:#F59E0B"><th><span class="th-label">Description</span></th><th><span class="th-label">Qty</span></th><th class="right"><span class="th-label">Rate</span></th><th class="right"><span class="th-label">Amount</span></th></tr></thead>
          <tbody>
            <tr><td><strong>Venue Rental – ${venue.businessName}</strong><br><span style="font-size:10px;color:#6b7280">${fmtDate(fd.bookingDate || fd.date)} | ${fd.startTime || ''} – ${fd.endTime || ''}</span></td><td style="text-transform:capitalize">${fd.bookingType || ''}</td><td class="right">—</td><td class="right"><strong>₹${fmt(cp.basePrice || 0)}</strong></td></tr>
            ${amenRows.length ? `<tr style="background:#fef9c3"><td colspan="4" style="font-size:11px;font-weight:700;color:#92400e;padding:4px 9px">AMENITIES & SERVICES</td></tr>${amenRows.join('')}` : ''}
            ${(cp.amenitiesTotal || 0) > 0 ? `<tr style="background:#f9fafb"><td colspan="3"><strong>Amenities Subtotal</strong></td><td class="right"><strong>₹${fmt(cp.amenitiesTotal)}</strong></td></tr>` : ''}
          </tbody>
        </table>
        <div class="totals" style="background:#eff6ff;border:1px solid #bfdbfe">
          <div class="tot-row"><span>Subtotal (Rental + Amenities)</span><span>₹${fmt(venueInvoice.baseAmount)}</span></div>
          <div class="tot-row" style="color:#1d4ed8"><span>CGST (${venueInvoice.cgstRate}%)</span><span>₹${fmt(venueInvoice.cgst)}</span></div>
          <div class="tot-row" style="color:#1d4ed8"><span>SGST (${venueInvoice.sgstRate}%)</span><span>₹${fmt(venueInvoice.sgst)}</span></div>
          <div class="tot-row tot-grand" style="color:#1e40af"><span>Venue Rental Total</span><span>₹${fmt(venueInvoice.total)}</span></div>
        </div>
      </div>

      <!-- Estimate 2: Platform -->
      <div class="inv-section" style="border-color:#c4b5fd;background:linear-gradient(135deg,#faf5ff,#fff)">
        <div class="inv-section-title" style="color:#6d28d9;border-color:#c4b5fd">📄 PLATFORM FEE ESTIMATE &nbsp;<span style="font-size:11px;font-weight:600;color:#6b7280">${quotationNumber}-P</span></div>
        <table>
          <thead><tr style="background:#7c3aed"><th><span class="th-label">Description</span></th><th><span class="th-label">Rate</span></th><th class="right"><span class="th-label">Base Amount</span></th><th class="right"><span class="th-label">Amount</span></th></tr></thead>
          <tbody>
            <tr><td><strong>Platform Service Fee</strong><br><span style="font-size:10px;color:#6b7280">Booking facilitation for ${venue.businessName} on ${fmtDate(fd.bookingDate || fd.date)}</span></td><td>${platformInvoice.feeLabel}</td><td class="right">₹${fmt(venueInvoice.baseAmount)}</td><td class="right"><strong>₹${fmt(platformInvoice.platformFee)}</strong></td></tr>
          </tbody>
        </table>
        <div class="totals" style="background:#faf5ff;border:1px solid #c4b5fd">
          <div class="tot-row"><span>Platform Fee (${platformInvoice.feeLabel})</span><span>₹${fmt(platformInvoice.platformFee)}</span></div>
          <div class="tot-row" style="color:#7c3aed"><span>CGST (${platformInvoice.cgstRate}%)</span><span>₹${fmt(platformInvoice.cgst)}</span></div>
          <div class="tot-row" style="color:#7c3aed"><span>SGST (${platformInvoice.sgstRate}%)</span><span>₹${fmt(platformInvoice.sgst)}</span></div>
          <div class="tot-row tot-grand" style="color:#6d28d9"><span>Platform Fee Total</span><span>₹${fmt(platformInvoice.total)}</span></div>
        </div>
      </div>

      <!-- Grand Total -->
      <div class="grand-box" style="background:linear-gradient(135deg,#16a34a,#22c55e)">
        <div>
          <div style="font-size:9.5px;color:rgba(255,255,255,.85)">Venue Rental Total + Platform Fee Total${couponDiscount > 0 ? ' − Coupon Discount' : ''}</div>
          <div style="font-size:14px;font-weight:900;color:#fff">GRAND TOTAL</div>
        </div>
        <div style="font-size:20px;font-weight:900;color:#fff">₹${fmt(grandTotal)}</div>
      </div>

      ${fd.specialRequirements ? `<div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:12px"><strong>Special Requirements:</strong> ${fd.specialRequirements}</div>` : ''}

      <div class="footer">
        <p><strong>RentalMeet</strong> — Venue Booking Platform | bookings@rentalmeet.com | +91 98765 43210</p>
        <p style="margin-top:2px">Quotation Ref: ${quotationNumber} | Valid for 7 days | This is a non-binding quotation, not a confirmed booking.</p>
      </div>
    </body></html>`;

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.print(); }, 400);
  };

  const handleDownloadPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      const logoUrl = `${window.location.origin}/logo.png`;
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

      const logoB64 = await toBase64(logoUrl);
      const sigVenueB64 = platformSettings?.gstInvoiceSignature ? await toBase64(platformSettings.gstInvoiceSignature) : null;
      const sigPlatformB64 = platformSettings?.platformInvoiceSignature ? await toBase64(platformSettings.platformInvoiceSignature) : null;

      const fmt = (n) => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

      const amenRows = [];
      const basic = (sa.basic || []).filter(a => a.type === 'Paid' && a.total > 0);
      const bev = sa.beverages || [];
      const food = sa.refreshmentFood || [];
      const thalis = sa.lunchThalis || [];
      const add = (sa.additional || []).filter(a => a.total > 0);
      [...basic, ...bev, ...food, ...thalis, ...add].forEach(a => {
        const name = a.name || a.thaliType || 'Item';
        const q = a.quantity || 1;
        const rate = a.rate || a.ratePerUnit || a.ratePerPlate || a.charges || 0;
        const total = a.total || 0;
        amenRows.push(`<tr><td style="padding-left:18px">${name}</td><td>${q}</td><td style="text-align:right">₹${fmt(rate)}</td><td style="text-align:right">₹${fmt(total)}</td></tr>`);
      });

      const commonCSS = `
        *{margin:0;padding:0;box-sizing:border-box}
        body,div{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1f2937;-webkit-print-color-adjust:exact}
        .wrap{width:794px;background:#fff;padding:20px 24px}
        .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px}
        .logo-img{height:36px;object-fit:contain}
        .brand-sub{font-size:10px;color:#6b7280;margin-top:2px}
        .inv-right{display:flex;flex-direction:column;align-items:flex-end;text-align:right}
        .inv-title{font-size:18px;font-weight:800;letter-spacing:1px;margin-bottom:2px}
        .inv-no{font-size:10px;color:#6b7280;margin-bottom:1px}
        .badge{display:flex;align-items:center;justify-content:center;padding:2px 8px;border-radius:10px;font-size:9px;font-weight:700;letter-spacing:.5px;margin-top:4px;background:#fef3c7;color:#92400e;line-height:1;height:16px}
        .divider{height:2px;border-radius:1px;margin-bottom:10px}
        .meta{display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#f9fafb;border-radius:6px;padding:8px 12px;margin-bottom:10px}
        .meta-label{font-size:9px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:0.5px}
        .meta-val{font-size:11px;font-weight:800;color:#111827}
        .meta-right{text-align:right}
        .two-col{display:flex;gap:10px;margin-bottom:10px}
        .card{flex:1;border-radius:6px;padding:10px;border:1px solid}
        .card-title{font-size:9px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:6px;padding-bottom:3px;border-bottom:1px solid}
        .card-row{display:flex;margin-bottom:4px;line-height:1.3}
        .card-label{width:90px;flex-shrink:0;font-size:10.5px;color:#6b7280;font-weight:500}
        .card-val{flex-grow:1;font-size:10.5px;font-weight:700;color:#111827;word-break:break-all}
        table{width:100%;border-collapse:collapse;margin-bottom:8px}
        th{height:26px;padding:0 8px;text-align:left;vertical-align:middle;font-size:10px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#fff}
        .th-label{display:block;position:relative;top:-6px;line-height:10px}
        td{padding:5px 8px;border-bottom:1px solid #f3f4f6;font-size:11px;vertical-align:middle}
        .right{text-align:right}
        .totals{border-radius:6px;padding:8px 10px;margin-bottom:8px}
        .tot-row{display:flex;justify-content:space-between;padding:2px 0;font-size:11px}
        .tot-grand{font-size:13px;font-weight:800;border-top:1.5px solid rgba(0,0,0,.15);margin-top:4px;padding-top:4px}
        .inv-section{border:2px solid;border-radius:8px;padding:12px;margin-bottom:10px}
        .inv-section-title{font-size:13px;font-weight:900;margin-bottom:8px;padding-bottom:6px;border-bottom:1.5px solid}
        .grand-box{border-radius:8px;padding:10px 16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
        .footer{text-align:center;font-size:9px;color:#9ca3af;padding-top:6px;border-top:1px solid #e5e7eb}
      `;

      const htmlContent = `<div class="wrap" style="font-family:'Segoe UI',Arial,sans-serif">
        <style>${commonCSS}</style>
        <div class="hdr">
          <div>
            ${logoB64 ? `<img src="${logoB64}" class="logo-img" alt="RentalMeet"/>` : `<div style="font-size:18px;font-weight:800;color:#F59E0B">RentalMeet</div>`}
            <div class="brand-sub">Venue Booking Platform</div>
            <div style="font-size:9px;color:#6b7280;margin-top:2px">bookings@rentalmeet.com | +91 98765 43210</div>
          </div>
          <div class="inv-right">
            <div class="inv-title" style="color:#F59E0B">BOOKING QUOTATION</div>
            <div class="inv-no">Quotation No: <strong>${quotationNumber}</strong></div>
            <div class="inv-no">Date: ${fmtDate(new Date())}</div>
          </div>
        </div>
        <div class="divider" style="background:linear-gradient(90deg,#F59E0B,#FCD34D)"></div>

        <div class="meta">
          <div><div class="meta-label">Valid Until</div><div class="meta-val">${fmtDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}</div></div>
          <div class="meta-right"><div class="meta-label">Status</div><div class="meta-val" style="color:#10B981">VALID</div></div>
        </div>

        <div class="two-col">
          <div class="card" style="background:#eff6ff;border-color:#bfdbfe">
            <div class="card-title" style="color:#1e40af;border-color:#bfdbfe">Venue Details</div>
            <div class="card-row"><div class="card-label">Venue</div><div class="card-val">${venue.businessName}</div></div>
            <div class="card-row"><div class="card-label">Location</div><div class="card-val">${venue.location?.city || ''}${venue.location?.area ? ', ' + venue.location.area : ''}</div></div>
            <div class="card-row"><div class="card-label">Address</div><div class="card-val">${venue.location?.address || '—'}</div></div>
            <div class="card-row"><div class="card-label">Capacity</div><div class="card-val">${venue.capacity || '—'}</div></div>
            <div class="card-row"><div class="card-label">Date</div><div class="card-val">${fmtDate(fd.bookingDate || fd.date)}</div></div>
            <div class="card-row"><div class="card-label">Time</div><div class="card-val">${fd.startTime || ''} – ${fd.endTime || ''} (${fd.bookingType || ''})</div></div>
          </div>
          <div class="card" style="background:#f0fdf4;border-color:#bbf7d0">
            <div class="card-title" style="color:#166534;border-color:#bbf7d0">Customer Details</div>
            <div class="card-row"><div class="card-label">Name</div><div class="card-val">${fd.customerName || '—'}</div></div>
            <div class="card-row"><div class="card-label">Email</div><div class="card-val">${fd.customerEmail || '—'}</div></div>
            <div class="card-row"><div class="card-label">Phone</div><div class="card-val">${fd.customerPhone || '—'}</div></div>
            <div class="card-row"><div class="card-label">Event Type</div><div class="card-val">${fd.eventType || '—'}</div></div>
            <div class="card-row"><div class="card-label">Guests</div><div class="card-val">${fd.guestCount || '—'}</div></div>
            ${fd.isWeekend !== undefined ? `<div class="card-row"><div class="card-label">Day Type</div><div class="card-val">${fd.isWeekend ? 'Weekend' : 'Weekday'}</div></div>` : ''}
          </div>
        </div>

        <div class="inv-section" style="border-color:#93c5fd;background:linear-gradient(135deg,#eff6ff,#fff)">
          <div class="inv-section-title" style="color:#1e40af;border-color:#93c5fd">📄 VENUE RENTAL ESTIMATE &nbsp;<span style="font-size:11px;font-weight:600;color:#6b7280">${quotationNumber}-V</span></div>
          <table>
            <thead><tr style="background:#F59E0B"><th><span class="th-label">Description</span></th><th><span class="th-label">Qty</span></th><th class="right"><span class="th-label">Rate</span></th><th class="right"><span class="th-label">Amount</span></th></tr></thead>
            <tbody>
              <tr><td><strong>Venue Rental – ${venue.businessName}</strong><br><span style="font-size:10px;color:#6b7280">${fmtDate(fd.bookingDate || fd.date)} | ${fd.startTime || ''} – ${fd.endTime || ''}</span></td><td style="text-transform:capitalize">${fd.bookingType || ''}</td><td class="right">—</td><td class="right"><strong>₹${fmt(cp.basePrice || 0)}</strong></td></tr>
              ${amenRows.length ? `<tr style="background:#fef9c3"><td colspan="4" style="font-size:11px;font-weight:700;color:#92400e;padding:4px 9px">AMENITIES & SERVICES</td></tr>${amenRows.join('')}` : ''}
              ${(cp.amenitiesTotal || 0) > 0 ? `<tr style="background:#f9fafb"><td colspan="3"><strong>Amenities Subtotal</strong></td><td class="right"><strong>₹${fmt(cp.amenitiesTotal)}</strong></td></tr>` : ''}
            </tbody>
          </table>
          <div class="totals" style="background:#eff6ff;border:1px solid #bfdbfe">
            <div class="tot-row"><span>Subtotal (Rental + Amenities)</span><span>₹${fmt(venueInvoice.baseAmount)}</span></div>
            <div class="tot-row" style="color:#1d4ed8"><span>CGST (${venueInvoice.cgstRate}%)</span><span>₹${fmt(venueInvoice.cgst)}</span></div>
            <div class="tot-row" style="color:#1d4ed8"><span>SGST (${venueInvoice.sgstRate}%)</span><span>₹${fmt(venueInvoice.sgst)}</span></div>
            <div class="tot-row tot-grand" style="color:#1e40af"><span>Venue Rental Total</span><span>₹${fmt(venueInvoice.total)}</span></div>
          </div>
        </div>

        <div class="inv-section" style="border-color:#c4b5fd;background:linear-gradient(135deg,#faf5ff,#fff)">
          <div class="inv-section-title" style="color:#6d28d9;border-color:#c4b5fd">📄 PLATFORM FEE ESTIMATE &nbsp;<span style="font-size:11px;font-weight:600;color:#6b7280">${quotationNumber}-P</span></div>
          <table>
            <thead><tr style="background:#7c3aed"><th><span class="th-label">Description</span></th><th><span class="th-label">Rate</span></th><th class="right"><span class="th-label">Base Amount</span></th><th class="right"><span class="th-label">Amount</span></th></tr></thead>
            <tbody>
              <tr><td><strong>Platform Service Fee</strong><br><span style="font-size:10px;color:#6b7280">Booking facilitation for ${venue.businessName} on ${fmtDate(fd.bookingDate || fd.date)}</span></td><td>${platformInvoice.feeLabel}</td><td class="right">₹${fmt(venueInvoice.baseAmount)}</td><td class="right"><strong>₹${fmt(platformInvoice.platformFee)}</strong></td></tr>
            </tbody>
          </table>
          <div class="totals" style="background:#faf5ff;border:1px solid #c4b5fd">
            <div class="tot-row"><span>Platform Fee (${platformInvoice.feeLabel})</span><span>₹${fmt(platformInvoice.platformFee)}</span></div>
            <div class="tot-row" style="color:#7c3aed"><span>CGST (${platformInvoice.cgstRate}%)</span><span>₹${fmt(platformInvoice.cgst)}</span></div>
            <div class="tot-row" style="color:#7c3aed"><span>SGST (${platformInvoice.sgstRate}%)</span><span>₹${fmt(platformInvoice.sgst)}</span></div>
            <div class="tot-row tot-grand" style="color:#6d28d9"><span>Platform Fee Total</span><span>₹${fmt(platformInvoice.total)}</span></div>
          </div>
        </div>

        <div class="grand-box" style="background:linear-gradient(135deg,#16a34a,#22c55e)">
          <div>
            <div style="font-size:9.5px;color:rgba(255,255,255,.85)">Venue Rental Total + Platform Fee Total${couponDiscount > 0 ? ' − Coupon Discount' : ''}</div>
            <div style="font-size:14px;font-weight:900;color:#fff">GRAND TOTAL</div>
          </div>
          <div style="font-size:20px;font-weight:900;color:#fff">₹${fmt(grandTotal)}</div>
        </div>

        ${fd.specialRequirements ? `<div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:12px"><strong>Special Requirements:</strong> ${fd.specialRequirements}</div>` : ''}

        <div class="footer">
          <p><strong>RentalMeet</strong> — Venue Booking Platform &nbsp;|&nbsp; bookings@rentalmeet.com &nbsp;|&nbsp; +91 98765 43210</p>
          <p style="margin-top:2px">Quotation Ref: ${quotationNumber} &nbsp;|&nbsp; Valid for 7 days &nbsp;|&nbsp; Non-binding quotation, not a confirmed booking.</p>
        </div>
      </div>`;

      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;z-index:-1';
      container.innerHTML = htmlContent;
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

      pdf.save(`RentalMeet_Quotation_${quotationNumber}.pdf`);
      await recordToBackend('download');

    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const [quotationNumber, setQuotationNumber] = useState('');

  // Fetch sequential quotation number from backend on mount
  useEffect(() => {
    const fetchQuotationNumber = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues/generate-quotation-number`);
        const data = await res.json();
        if (data.success) setQuotationNumber(data.quotationNumber);
      } catch {
        // fallback — should not happen in normal flow
        setQuotationNumber(`QT-${new Date().getFullYear()}-ESTIMATE`);
      }
    };
    fetchQuotationNumber();
  }, []);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        
        <div className="flex items-center justify-between p-4 md:p-6 border-b bg-gradient-to-r from-primary-50 to-orange-50 print:hidden">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Booking Quotation</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 md:px-4 py-2 bg-primary-500 text-white rounded-lg flex items-center gap-2 hover:bg-primary-600 transition-all text-sm md:text-base"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden md:inline">Print</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-3 md:px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2 hover:bg-green-600 transition-all text-sm md:text-base"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>

        <div ref={quotationRef} className="flex-1 overflow-y-auto p-6 md:p-8 bg-white">
          
          <div className="text-center mb-6 pb-4 border-b border-primary-500">
            <h1 className="text-2xl md:text-3xl font-extrabold text-primary-600 mb-1">RentalMeet</h1>
            <p className="text-gray-600 text-xs md:text-sm font-medium">Venue Booking Platform</p>
            <p className="text-gray-500 text-xs mt-1">
              bookings@rentalmeet.com | +91 98765 43210
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Quotation No.</p>
              <p className="text-sm md:text-base font-bold text-gray-900">{quotationNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-semibold uppercase">Date</p>
              <p className="text-sm md:text-base font-bold text-gray-900">{formatDate(new Date())}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Valid Until</p>
              <p className="text-sm md:text-base font-bold text-gray-900">
                {formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-semibold uppercase">Status</p>
              <p className="text-sm md:text-base font-bold text-green-600">VALID</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-200">
              <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider mb-4 pb-2 border-b border-blue-200/60 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                Venue Details
              </h3>
              <div className="space-y-2.5 text-xs md:text-sm">
                <div className="flex items-start">
                  <span className="text-gray-500 font-medium w-[95px] flex-shrink-0">Venue</span>
                  <span className="font-bold text-gray-900">{venue.businessName}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 font-medium w-[95px] flex-shrink-0">Location</span>
                  <span className="font-bold text-gray-900">{venue.location?.city || ''}{venue.location?.area ? ', ' + venue.location.area : ''}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 font-medium w-[95px] flex-shrink-0">Address</span>
                  <span className="font-bold text-gray-900">{venue.location?.address || '—'}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 font-medium w-[95px] flex-shrink-0">Capacity</span>
                  <span className="font-bold text-gray-900">{venue.capacity || '—'}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 font-medium w-[95px] flex-shrink-0">Date</span>
                  <span className="font-bold text-gray-900">{formatDate(fd.bookingDate || fd.date)}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 font-medium w-[95px] flex-shrink-0">Time</span>
                  <span className="font-bold text-gray-900">{fd.startTime || ''} – {fd.endTime || ''} ({fd.bookingType || ''})</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50/50 p-5 rounded-xl border border-green-200">
              <h3 className="text-sm font-bold text-green-800 uppercase tracking-wider mb-4 pb-2 border-b border-green-200/60 flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" />
                Customer Details
              </h3>
              <div className="space-y-2.5 text-xs md:text-sm">
                <div className="flex items-start">
                  <span className="text-gray-500 font-medium w-[95px] flex-shrink-0">Name</span>
                  <span className="font-bold text-gray-900">{fd.customerName || '—'}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 font-medium w-[95px] flex-shrink-0">Email</span>
                  <span className="font-bold text-gray-900 break-all">{fd.customerEmail || '—'}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 font-medium w-[95px] flex-shrink-0">Phone</span>
                  <span className="font-bold text-gray-900">{fd.customerPhone || '—'}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 font-medium w-[95px] flex-shrink-0">Event Type</span>
                  <span className="font-bold text-gray-900">{fd.eventType || '—'}</span>
                </div>
                <div className="flex items-start">
                  <span className="text-gray-500 font-medium w-[95px] flex-shrink-0">Guests</span>
                  <span className="font-bold text-gray-900">{fd.guestCount || '—'}</span>
                </div>
                {fd.isWeekend !== undefined && (
                  <div className="flex items-start">
                    <span className="text-gray-500 font-medium w-[95px] flex-shrink-0">Day Type</span>
                    <span className="font-bold text-gray-900">{fd.isWeekend ? 'Weekend' : 'Weekday'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mb-6 border-2 border-blue-200 rounded-xl p-5 md:p-6 bg-gradient-to-br from-blue-50/30 to-white">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-blue-200">
              <h3 className="text-base md:text-lg font-bold text-blue-900">
                📄 VENUE RENTAL ESTIMATE
              </h3>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 font-semibold uppercase">Quotation No.</p>
                <p className="text-xs md:text-sm font-bold text-blue-950">{quotationNumber}-V</p>
              </div>
            </div>

            <div className="bg-white border border-blue-100 rounded-lg p-3.5 mb-3.5">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-800 text-sm">Venue Rental Charges</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {fd.bookingType === 'hourly' ? 'Per Hour' : 
                     fd.bookingType === 'halfday' ? 'Half Day (4 hours)' : 
                     'Full Day (8 hours)'} • {fd.isWeekend ? 'Weekend Rate' : 'Weekday Rate'}
                  </p>
                </div>
                <p className="text-base md:text-lg font-bold text-gray-900">
                  ₹{(cp.basePrice || 0).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {((cp.amenitiesTotal > 0) || (sa.basic?.length > 0)) && (
              <div className="bg-white border-2 border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-bold text-gray-900 mb-3 text-base">Amenities & Services</h4>
                
                {sa.basic?.length > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 font-semibold">Basic Amenities (Included):</span>
                      <span className="font-semibold text-gray-900">₹0</span>
                    </div>
                  </div>
                )}

                {sa.beverages?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Beverages:</p>
                    <div className="space-y-1">
                      {sa.beverages.map((beverage, idx) => {
                        const q = qty[`beverage_${beverage.name}`] || qty[`beverages_${beverage.name}`] || 0;
                        const rate = beverage.ratePerUnit || 0;
                        const total = rate * q;
                        return (
                          <div key={idx} className="flex justify-between text-sm pl-4">
                            <span className="text-gray-700">
                              • {beverage.name}
                              {rate > 0 && <span className="text-xs text-gray-500"> (₹{rate} × {q} persons)</span>}
                            </span>
                            <span className="font-semibold text-gray-900">
                              {rate > 0 ? `₹${total.toLocaleString('en-IN')}` : '₹0'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {sa.refreshmentFood?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Refreshments & Snacks:</p>
                    <div className="space-y-1">
                      {sa.refreshmentFood.map((food, idx) => {
                        const q = qty[`food_${food.name}`] || qty[`refreshmentFood_${food.name}`] || 0;
                        const rate = food.ratePerPlate || 0;
                        const total = rate * q;
                        return (
                          <div key={idx} className="flex justify-between text-sm pl-4">
                            <span className="text-gray-700">
                              • {food.name}
                              {rate > 0 && <span className="text-xs text-gray-500"> (₹{rate} × {q} plates)</span>}
                            </span>
                            <span className="font-semibold text-gray-900">
                              {rate > 0 ? `₹${total.toLocaleString('en-IN')}` : '₹0'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {sa.lunchThalis?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Lunch Thalis:</p>
                    <div className="space-y-1">
                      {sa.lunchThalis.map((thali, idx) => {
                        const q = qty[`thali_${thali.thaliType}_${thali.category}`] || qty[`lunchThalis_${thali.thaliType}_${thali.category}`] || 0;
                        const rate = thali.ratePerPlate || 0;
                        const total = rate * q;
                        return (
                          <div key={idx} className="flex justify-between text-sm pl-4">
                            <span className="text-gray-700">
                              • {thali.thaliType} - {thali.category}
                              {rate > 0 && <span className="text-xs text-gray-500"> (₹{rate} × {q} plates)</span>}
                            </span>
                            <span className="font-semibold text-gray-900">
                              {rate > 0 ? `₹${total.toLocaleString('en-IN')}` : '₹0'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {sa.additional?.length > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 font-semibold">Additional Facilities (Included):</span>
                      <span className="font-semibold text-gray-900">₹0</span>
                    </div>
                  </div>
                )}

                {cp.amenitiesTotal > 0 && (
                  <div className="flex justify-between pt-2 mt-2 border-t border-gray-200">
                    <span className="font-bold text-gray-700 text-sm">Amenities Subtotal:</span>
                    <span className="font-bold text-gray-900 text-sm">
                      ₹{cp.amenitiesTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="bg-gradient-to-br from-blue-100/30 to-blue-50/30 border border-blue-200 rounded-lg p-3.5">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">Subtotal (Rental + Amenities):</span>
                  <span className="font-bold text-gray-800">₹{venueInvoice.baseAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">CGST ({venueInvoice.cgstRate}%):</span>
                  <span className="font-semibold text-blue-600">₹{venueInvoice.cgst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">SGST ({venueInvoice.sgstRate}%):</span>
                  <span className="font-semibold text-blue-600">₹{venueInvoice.sgst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-2 mt-1 border-t border-blue-200">
                  <span className="text-sm font-bold text-blue-900">Venue Rental Total:</span>
                  <span className="text-base font-bold text-blue-900">
                    ₹{venueInvoice.total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 border-2 border-purple-200 rounded-xl p-5 md:p-6 bg-gradient-to-br from-purple-50/30 to-white">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-purple-200">
              <h3 className="text-base md:text-lg font-bold text-purple-900">
                📄 PLATFORM FEE ESTIMATE
              </h3>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 font-semibold uppercase">Quotation No.</p>
                <p className="text-xs md:text-sm font-bold text-purple-900">{quotationNumber}-P</p>
              </div>
            </div>

            <div className="bg-white border border-purple-100 rounded-lg p-3.5 mb-3.5">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Base Amount (Rental + Amenities):</span>
                  <span className="font-semibold text-gray-800">₹{venueInvoice.baseAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">Platform Service Fee</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{platformInvoice.feeLabel}</p>
                  </div>
                  <p className="text-base md:text-lg font-bold text-gray-900">
                    ₹{platformInvoice.platformFee.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-100/30 to-purple-50/30 border border-purple-200 rounded-lg p-3.5">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">Platform Fee:</span>
                  <span className="font-bold text-gray-800">₹{platformInvoice.platformFee.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">CGST ({platformInvoice.cgstRate}%):</span>
                  <span className="font-semibold text-purple-600">₹{platformInvoice.cgst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">SGST ({platformInvoice.sgstRate}%):</span>
                  <span className="font-semibold text-purple-600">₹{platformInvoice.sgst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-2 mt-1 border-t border-purple-200">
                  <span className="text-sm font-bold text-purple-900">Platform Fee Total:</span>
                  <span className="text-base font-bold text-purple-900">
                    ₹{platformInvoice.total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 bg-gradient-to-br from-green-50/40 to-green-100/40 border border-green-300 rounded-xl p-5 md:p-6">
            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Venue Rental Total:</span>
                <span className="font-semibold">₹{venueInvoice.total.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Platform Fee Total:</span>
                <span className="font-semibold">₹{platformInvoice.total.toLocaleString('en-IN')}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-xs text-green-700 font-semibold">
                  <span>Coupon Discount ({cp.couponCode || ''}):</span>
                  <span>- ₹{couponDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center border-t border-green-300 pt-3">
              <div>
                <p className="text-[11px] text-gray-500">Total Amount Payable</p>
                <p className="text-base md:text-lg font-bold text-green-800 uppercase tracking-wide">GRAND TOTAL</p>
              </div>
              <div className="text-right">
                <p className="text-xl md:text-2xl font-bold text-green-800">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {fd.specialRequirements && (
            <div className="bg-yellow-50/50 border border-yellow-200 p-3.5 rounded-lg mb-6">
              <h4 className="font-bold text-gray-800 text-xs mb-1">Special Requirements:</h4>
              <p className="text-xs text-gray-700">{fd.specialRequirements}</p>
            </div>
          )}

          <div className="bg-gray-50/60 border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-bold text-gray-800 mb-2">Terms & Conditions:</h3>
            <ul className="space-y-1.5 text-[11px] md:text-xs text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold">•</span>
                <span>This quotation is valid for 7 days from the date of issue.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold">•</span>
                <span>Two separate invoices will be generated: Venue Invoice and Platform Invoice.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold">•</span>
                <span>This is a booking request and not a confirmed booking. Final confirmation subject to venue owner approval.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold">•</span>
                <span>Payment to be made after venue owner confirmation through RentalMeet platform.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold">•</span>
                <span>Cancellation policy: Full refund if cancelled 48 hours before booking date, 50% refund if cancelled 24 hours before, no refund for same-day cancellations.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold">•</span>
                <span>Customer is responsible for any damages to the venue property during the event.</span>
              </li>
            </ul>
          </div>

          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-800 mb-1.5">Thank you for choosing RentalMeet!</p>
            <p className="text-[11px] text-gray-500 mb-1">For any queries or support:</p>
            <div className="flex flex-wrap justify-center gap-4 text-[11px] text-gray-500">
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" /> support@rentalmeet.com
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" /> +91 98765 43210
              </span>
            </div>
            <p className="text-[10px] text-gray-400 mt-3">
              © {new Date().getFullYear()} RentalMeet. All rights reserved.
            </p>
          </div>
        </div>

        <div className="border-t bg-gray-50 p-4 md:p-6 flex flex-col sm:flex-row gap-3 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-100 transition-colors text-sm md:text-base"
          >
            Back to Edit
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 shadow-lg transition-all text-sm md:text-base"
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
}
