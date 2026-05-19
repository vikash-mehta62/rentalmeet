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

  const fmtAmt = (n) => 'Rs.' + (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtD   = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
  const fmtDT  = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

  const pb         = booking?.priceBreakdown || {};
  const subtotal   = pb.subtotal   ?? booking?.ownerEarnings ?? 0;
  const vCGST      = pb.venueCGST  ?? (pb.gst ? pb.gst / 2 : 0);
  const vSGST      = pb.venueSGST  ?? (pb.gst ? pb.gst / 2 : 0);
  const vCGSTRate  = pb.venueCGSTRate ?? 9;
  const vSGSTRate  = pb.venueSGSTRate ?? 9;
  const pfee       = pb.platformFee ?? 0;
  const pfRate     = pb.platformFeeRate ?? 5;
  const pfCGST     = pb.platformFeeCGST ?? (pb.platformFeeGST ? pb.platformFeeGST / 2 : 0);
  const pfSGST     = pb.platformFeeSGST ?? (pb.platformFeeGST ? pb.platformFeeGST / 2 : 0);
  const pfCGSTRate = pb.platformFeeCGSTRate ?? 9;
  const pfSGSTRate = pb.platformFeeSGSTRate ?? 9;
  const pfTotal    = pb.platformFeeTotal ?? (pfee + pfCGST + pfSGST);
  const discount   = pb.discount ?? 0;
  const bookingRef = booking?.bookingNumber || (booking?._id ? booking._id.slice(-8).toUpperCase() : 'N/A');

  const toBase64 = (url) => new Promise((resolve) => {
    // Try fetch first (handles CORS better for external URLs like Cloudinary)
    fetch(url)
      .then(r => r.blob())
      .then(blob => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      })
      .catch(() => {
        // Fallback to Image element
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const c = document.createElement('canvas');
          const maxW = 600;
          const scale = img.width > maxW ? maxW / img.width : 1;
          c.width  = img.width  * scale;
          c.height = img.height * scale;
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => resolve(null);
        img.src = url;
      });
  });

  const generatePDF = async (type) => {
    setLoading(p => ({ ...p, [type]: true }));
    try {
      const { default: jsPDF } = await import('jspdf');

      // Always fetch fresh settings to ensure signatures are available
      let freshSettings = settings;
      if (!freshSettings?.gstInvoiceSignature && !freshSettings?.platformInvoiceSignature) {
        try {
          const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues/platform-settings/public`);
          const d = await r.json();
          if (d.success) freshSettings = d.settings;
        } catch (e) { console.warn('Settings fetch failed:', e); }
      }
      console.log('[Invoice] freshSettings signatures:', freshSettings?.gstInvoiceSignature, freshSettings?.platformInvoiceSignature);
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210; // A4 width mm
      const M = 14;  // margin
      const CW = W - M * 2; // content width

      // ── helpers ──────────────────────────────────────────────────────────
      const setFont = (style, size, color) => {
        doc.setFont('helvetica', style);
        doc.setFontSize(size);
        if (color) doc.setTextColor(...color);
        else doc.setTextColor(31, 41, 55);
      };
      const right = (text, x, y) => doc.text(text, x, y, { align: 'right' });
      const line  = (x1, y1, x2, y2, color, w) => {
        doc.setDrawColor(...(color || [229, 231, 235]));
        doc.setLineWidth(w || 0.3);
        doc.line(x1, y1, x2, y2);
      };
      const rect  = (x, y, w, h, fillColor, strokeColor) => {
        if (fillColor) doc.setFillColor(...fillColor);
        if (strokeColor) doc.setDrawColor(...strokeColor);
        else doc.setDrawColor(...(fillColor || [255,255,255]));
        doc.setLineWidth(0.1);
        doc.roundedRect(x, y, w, h, 2, 2, fillColor ? (strokeColor ? 'FD' : 'F') : 'S');
      };
      const wrap = (text, maxW) => doc.splitTextToSize(String(text || ''), maxW);

      // ── logo ─────────────────────────────────────────────────────────────
      let y = M;
      const logoB64 = await toBase64(window.location.origin + '/logo-pdf.jpg');
      // Load signature for this invoice type
      const sigUrl = type === 'venue'
        ? freshSettings?.gstInvoiceSignature
        : freshSettings?.platformInvoiceSignature;
      const sigB64 = sigUrl ? await toBase64(sigUrl) : null;
      console.log('[Invoice] sigUrl:', sigUrl, '| sigB64 loaded:', !!sigB64);
      if (logoB64) {
        // logo-pdf.jpg is 2419x419 — aspect ratio 5.77:1
        // display at 62mm wide → height = 62 / 5.77 ≈ 10.7mm
        doc.addImage(logoB64, 'JPEG', M, y, 62, 10.7);
      } else {
        setFont('bold', 16, [245, 158, 11]);
        doc.text('RentalMeet', M, y + 8);
      }

      // ── invoice type + meta (right side) ─────────────────────────────────
      const accentColor = type === 'venue' ? [245, 158, 11] : [14, 165, 233];
      setFont('bold', 15, accentColor);
      right(type === 'venue' ? 'VENUE INVOICE' : 'PLATFORM INVOICE', W - M, y + 5);

      setFont('normal', 8, [107, 114, 128]);
      right('Invoice No: ' + bookingRef, W - M, y + 10);
      right('Date: ' + fmtD(booking?.createdAt), W - M, y + 14);

      // PAID badge
      const status = (booking?.paymentStatus || 'pending').toUpperCase();
      const badgeColors = { PAID: [[209,250,229],[6,95,70]], PENDING: [[254,243,199],[146,64,14]], REFUNDED: [[224,231,255],[55,48,163]], CANCELLED: [[254,226,226],[153,27,27]] };
      const [bgC, txC] = badgeColors[status] || badgeColors.PENDING;
      const badgeW = 18, badgeH = 5;
      const badgeX = W - M - badgeW;
      rect(badgeX, y + 17, badgeW, badgeH, bgC, bgC);
      setFont('bold', 7, txC);
      doc.text(status, badgeX + badgeW / 2, y + 17 + 3.5, { align: 'center' });

      y += 26;

      // ── divider ───────────────────────────────────────────────────────────
      line(M, y, W - M, y, accentColor, 1);
      y += 5;

      if (type === 'venue') {
        // ── BILLED TO + SUPPLIER cards ──────────────────────────────────────
        const cardH = 38;
        const cardW = (CW - 4) / 2;

        // Left card
        rect(M, y, cardW, cardH, [255, 251, 235], [253, 230, 138]);
        setFont('bold', 7, [146, 64, 14]);
        doc.text('BILLED TO', M + 3, y + 5);
        line(M + 3, y + 6.5, M + cardW - 3, y + 6.5, [253, 230, 138], 0.3);

        const custName  = booking?.customer?.name  || booking?.customerDetails?.name  || 'N/A';
        const custEmail = booking?.customer?.email || booking?.customerDetails?.email || 'N/A';
        const custPhone = booking?.customerDetails?.phone || booking?.customer?.phone || 'N/A';
        const eventType = booking?.customerDetails?.eventType || '';
        const guests    = booking?.customerDetails?.guestCount || '';

        let cy = y + 10;
        const kvLine = (label, val, yy) => {
          setFont('normal', 7.5, [107, 114, 128]); doc.text(label, M + 3, yy);
          setFont('bold',   7.5, [17, 24, 39]);    doc.text(String(val || ''), M + 22, yy);
        };
        kvLine('Customer', custName,  cy); cy += 4.5;
        kvLine('Email',    custEmail, cy); cy += 4.5;
        kvLine('Phone',    custPhone, cy); cy += 4.5;
        if (eventType) { kvLine('Event Type', eventType, cy); cy += 4.5; }
        if (guests)    { kvLine('Guests',     guests,    cy); }

        // Right card
        const rx = M + cardW + 4;
        rect(rx, y, cardW, cardH, [255, 251, 235], [253, 230, 138]);
        setFont('bold', 7, [146, 64, 14]);
        doc.text('SUPPLIER (VENUE)', rx + 3, y + 5);
        line(rx + 3, y + 6.5, rx + cardW - 3, y + 6.5, [253, 230, 138], 0.3);

        const venueName = booking?.venue?.businessName || 'N/A';
        const city      = booking?.venue?.location?.city || '';
        const area      = booking?.venue?.location?.area || '';
        const location  = city + (area ? ', ' + area : '');
        const gstin     = booking?.venue?.documents?.gstNumber || 'Not Available';

        let ry = y + 10;
        const rkvLine = (label, val, yy) => {
          setFont('normal', 7.5, [107, 114, 128]); doc.text(label, rx + 3, yy);
          setFont('bold',   7.5, [17, 24, 39]);    doc.text(String(val || ''), rx + 22, yy);
        };
        rkvLine('Venue',        venueName,                    ry); ry += 4.5;
        rkvLine('Location',     location,                     ry); ry += 4.5;
        rkvLine('GSTIN',        gstin,                        ry); ry += 4.5;
        rkvLine('HSN Code',     '9973',                       ry); ry += 4.5;
        rkvLine('Booking Date', fmtD(booking?.bookingDate),   ry); ry += 4.5;
        rkvLine('Time Slot',    (booking?.startTime || '') + ' - ' + (booking?.endTime || '') + ' (' + (booking?.bookingType || '') + ')', ry);

        y += cardH + 6;

        // ── items table ─────────────────────────────────────────────────────
        const cols = [CW * 0.44, CW * 0.14, CW * 0.21, CW * 0.21];
        const colX = [M, M + cols[0], M + cols[0] + cols[1], M + cols[0] + cols[1] + cols[2]];

        // Header
        rect(M, y, CW, 7, accentColor, accentColor);
        setFont('bold', 7.5, [255, 255, 255]);
        doc.text('DESCRIPTION', colX[0] + 2, y + 4.8);
        doc.text('QTY / TYPE',  colX[1] + 2, y + 4.8);
        right('RATE',   colX[3] - 2,          y + 4.8);
        right('AMOUNT', colX[3] + cols[3] - 2, y + 4.8);
        y += 7;

        // Venue rental row
        const rowBg = [249, 250, 251];
        rect(M, y, CW, 10, [255,255,255], [243,244,246]);
        setFont('bold',   8.5, [17, 24, 39]);
        doc.text('Venue Rental - ' + (booking?.venue?.businessName || ''), colX[0] + 2, y + 4);
        setFont('normal', 7,   [107, 114, 128]);
        doc.text(fmtD(booking?.bookingDate) + '  |  ' + (booking?.startTime || '') + ' - ' + (booking?.endTime || ''), colX[0] + 2, y + 8);
        setFont('normal', 8.5, [17, 24, 39]);
        doc.text((booking?.bookingType || '').charAt(0).toUpperCase() + (booking?.bookingType || '').slice(1), colX[1] + 2, y + 5.5);
        right('-',                    colX[3] - 2,           y + 5.5);
        setFont('bold', 8.5, [17, 24, 39]);
        right(fmtAmt(pb.basePrice || 0), colX[3] + cols[3] - 2, y + 5.5);
        y += 10;

        // Amenities
        const basic  = (booking?.selectedAmenities?.basic  || []).filter(a => a.type === 'Paid' && a.total > 0);
        const bev    =  booking?.selectedAmenities?.beverages       || [];
        const food   =  booking?.selectedAmenities?.refreshmentFood || [];
        const thalis =  booking?.selectedAmenities?.lunchThalis     || [];
        const add    = (booking?.selectedAmenities?.additional || []).filter(a => a.total > 0);
        const allAmen = [...basic, ...bev, ...food, ...thalis, ...add];

        if (allAmen.length > 0) {
          rect(M, y, CW, 6, [254, 249, 195], [253, 230, 138]);
          setFont('bold', 7, [146, 64, 14]);
          doc.text('AMENITIES & SERVICES', colX[0] + 2, y + 4);
          y += 6;
          allAmen.forEach((a, i) => {
            const name  = a.name || (a.thaliType ? a.thaliType + ' - ' + (a.category || '') : 'Item');
            const qty   = String(a.quantity || 1);
            const rate  = a.rate || a.ratePerUnit || a.ratePerPlate || a.charges || 0;
            const total = a.total || 0;
            rect(M, y, CW, 6, i % 2 === 0 ? [255,255,255] : rowBg, [243,244,246]);
            setFont('normal', 8, [17, 24, 39]);
            doc.text(name, colX[0] + 5, y + 4);
            doc.text(qty,  colX[1] + 2, y + 4);
            right(fmtAmt(rate),  colX[3] - 2,           y + 4);
            right(fmtAmt(total), colX[3] + cols[3] - 2, y + 4);
            y += 6;
          });
          if (pb.amenitiesTotal > 0) {
            rect(M, y, CW, 6, rowBg, [229,231,235]);
            setFont('bold', 8, [17, 24, 39]);
            doc.text('Amenities Subtotal', colX[0] + 2, y + 4);
            right(fmtAmt(pb.amenitiesTotal), colX[3] + cols[3] - 2, y + 4);
            y += 6;
          }
        }

        y += 4;

        // ── totals box ───────────────────────────────────────────────────────
        const totLines = [
          ['Taxable Value (Subtotal)', fmtAmt(subtotal), null],
          ['CGST @ ' + vCGSTRate + '%', fmtAmt(vCGST), null],
          ['SGST @ ' + vSGSTRate + '%', fmtAmt(vSGST), null],
        ];
        if (discount > 0) totLines.push(['Coupon Discount' + (pb.couponCode ? ' (' + pb.couponCode + ')' : ''), '- ' + fmtAmt(discount), [22, 163, 74]]);
        const invoiceTotal = booking?.amount ?? Math.max(0, subtotal + vCGST + vSGST - discount);
        const totH = totLines.length * 6 + 10;
        rect(M, y, CW, totH, [255, 251, 235], [253, 230, 138]);

        let ty = y + 5;
        totLines.forEach(([label, val, color]) => {
          setFont('normal', 8.5, color || [55, 65, 81]);
          doc.text(label, M + 4, ty);
          right(val, W - M - 4, ty);
          ty += 6;
        });
        // grand total line
        line(M + 4, ty - 1, W - M - 4, ty - 1, [253, 230, 138], 0.5);
        setFont('bold', 10, accentColor);
        doc.text('VENUE INVOICE TOTAL', M + 4, ty + 4);
        right(fmtAmt(invoiceTotal), W - M - 4, ty + 4);
        y += totH + 6;

        // ── payment details ──────────────────────────────────────────────────
        if (booking?.paymentDetails?.razorpay_payment_id) {
          rect(M, y, CW, 8, [240, 253, 244], [187, 247, 208]);
          setFont('bold',   7.5, [6, 95, 70]);
          doc.text('Payment Details', M + 3, y + 3.5);
          setFont('normal', 7,   [6, 95, 70]);
          const payText = 'Payment ID: ' + booking.paymentDetails.razorpay_payment_id + '   |   Order ID: ' + (booking.paymentDetails.razorpay_order_id || '-') + '   |   Paid: ' + fmtDT(booking.paymentDetails.paidAt);
          doc.text(payText, M + 3, y + 6.5);
          y += 12;
        }

        // signature for venue invoice
        if (sigB64) {
          const sigW = 40, sigH = 14;
          const sigX = W - M - sigW;
          doc.addImage(sigB64, 'JPEG', sigX, y, sigW, sigH);
          line(sigX, y + sigH + 1, sigX + sigW, y + sigH + 1, [55, 65, 81], 0.3);
          setFont('bold', 7, [55, 65, 81]);
          doc.text('Authorized Signatory', sigX + sigW / 2, y + sigH + 4.5, { align: 'center' });
          y += sigH + 8;
        }

      } else {
        // ── PLATFORM INVOICE ─────────────────────────────────────────────────
        const cardH = 30;
        const cardW = (CW - 4) / 2;

        rect(M, y, cardW, cardH, [240, 249, 255], [186, 230, 253]);
        setFont('bold', 7, [12, 74, 110]);
        doc.text('BILLED TO', M + 3, y + 5);
        line(M + 3, y + 6.5, M + cardW - 3, y + 6.5, [186, 230, 253], 0.3);
        const custName  = booking?.customer?.name  || booking?.customerDetails?.name  || 'N/A';
        const custEmail = booking?.customer?.email || booking?.customerDetails?.email || 'N/A';
        const custPhone = booking?.customerDetails?.phone || booking?.customer?.phone || 'N/A';
        let cy = y + 10;
        const kvL = (label, val, yy) => {
          setFont('normal', 7.5, [107, 114, 128]); doc.text(label, M + 3, yy);
          setFont('bold',   7.5, [17, 24, 39]);    doc.text(String(val || ''), M + 22, yy);
        };
        kvL('Customer', custName,  cy); cy += 4.5;
        kvL('Email',    custEmail, cy); cy += 4.5;
        kvL('Phone',    custPhone, cy);

        const rx = M + cardW + 4;
        rect(rx, y, cardW, cardH, [240, 249, 255], [186, 230, 253]);
        setFont('bold', 7, [12, 74, 110]);
        doc.text('SUPPLIER (PLATFORM)', rx + 3, y + 5);
        line(rx + 3, y + 6.5, rx + cardW - 3, y + 6.5, [186, 230, 253], 0.3);
        const venueName = booking?.venue?.businessName || 'N/A';
        let ry = y + 10;
        const rkvL = (label, val, yy) => {
          setFont('normal', 7.5, [107, 114, 128]); doc.text(label, rx + 3, yy);
          setFont('bold',   7.5, [17, 24, 39]);    doc.text(String(val || ''), rx + 22, yy);
        };
        rkvL('Company',     'RentalMeet Technologies', ry); ry += 4.5;
        rkvL('GSTIN',       'Not Available',           ry); ry += 4.5;
        rkvL('HSN Code',    '999799',                  ry);
        y += cardH + 6;

        // table header
        const cols = [CW * 0.44, CW * 0.14, CW * 0.21, CW * 0.21];
        const colX = [M, M + cols[0], M + cols[0] + cols[1], M + cols[0] + cols[1] + cols[2]];
        rect(M, y, CW, 7, accentColor, accentColor);
        setFont('bold', 7.5, [255, 255, 255]);
        doc.text('DESCRIPTION', colX[0] + 2, y + 4.8);
        doc.text('RATE',        colX[1] + 2, y + 4.8);
        right('BASE AMOUNT', colX[3] - 2,           y + 4.8);
        right('AMOUNT',      colX[3] + cols[3] - 2, y + 4.8);
        y += 7;

        rect(M, y, CW, 10, [255,255,255], [243,244,246]);
        setFont('bold',   8.5, [17, 24, 39]);
        doc.text('Platform Service Fee', colX[0] + 2, y + 4);
        setFont('normal', 7,   [107, 114, 128]);
        doc.text('Booking facilitation for ' + venueName + ' on ' + fmtD(booking?.bookingDate), colX[0] + 2, y + 8);
        setFont('normal', 8.5, [17, 24, 39]);
        doc.text(pfRate + '% ', colX[1] + 2, y + 5.5);
        right(fmtAmt(subtotal), colX[3] - 2,           y + 5.5);
        setFont('bold', 8.5, [17, 24, 39]);
        right(fmtAmt(pfee),     colX[3] + cols[3] - 2, y + 5.5);
        y += 14;

        const totLines = [
          ['Platform Service Fee (' + pfRate + '%)', fmtAmt(pfee)],
          ['CGST @ ' + pfCGSTRate + '%',             fmtAmt(pfCGST)],
          ['SGST @ ' + pfSGSTRate + '%',             fmtAmt(pfSGST)],
        ];
        const totH = totLines.length * 6 + 10;
        rect(M, y, CW, totH, [240, 249, 255], [186, 230, 253]);
        let ty = y + 5;
        totLines.forEach(([label, val]) => {
          setFont('normal', 8.5, [55, 65, 81]);
          doc.text(label, M + 4, ty);
          right(val, W - M - 4, ty);
          ty += 6;
        });
        line(M + 4, ty - 1, W - M - 4, ty - 1, [186, 230, 253], 0.5);
        setFont('bold', 10, accentColor);
        doc.text('PLATFORM INVOICE TOTAL', M + 4, ty + 4);
        right(fmtAmt(pfTotal), W - M - 4, ty + 4);
        y += totH + 6;

        // note box
        rect(M, y, CW, 10, [254, 252, 232], [253, 230, 138]);
        setFont('bold',   7.5, [113, 63, 18]);
        doc.text('Note:', M + 3, y + 4);
        setFont('normal', 7.5, [113, 63, 18]);
        doc.text('This invoice covers RentalMeet platform service charges only. Venue rental and GST are billed separately in the Venue Invoice.', M + 14, y + 4);
        y += 14;
      }

      // ── signature for platform invoice ───────────────────────────────────
      if (type === 'platform' && sigB64) {
        const sigW = 40, sigH = 14;
        const sigX = W - M - sigW;
        doc.addImage(sigB64, 'JPEG', sigX, y, sigW, sigH);
        line(sigX, y + sigH + 1, sigX + sigW, y + sigH + 1, [55, 65, 81], 0.3);
        setFont('bold', 7, [55, 65, 81]);
        doc.text('Authorized Signatory', sigX + sigW / 2, y + sigH + 4.5, { align: 'center' });
        y += sigH + 8;
      }

      // ── footer ────────────────────────────────────────────────────────────
      const footerY = 287;
      line(M, footerY - 3, W - M, footerY - 3, [229, 231, 235], 0.3);
      setFont('normal', 7, [156, 163, 175]);
      doc.text('RentalMeet  -  Book Your Premium Meeting Venue  |  support@rentalmeet.com', W / 2, footerY, { align: 'center' });
      doc.text('Booking Ref: ' + bookingRef + '  |  Generated: ' + fmtDT(new Date()) + '  |  Computer-generated invoice', W / 2, footerY + 4, { align: 'center' });

      doc.save(type === 'venue' ? 'VenueInvoice-' + bookingRef + '.pdf' : 'PlatformInvoice-' + bookingRef + '.pdf');
    } catch (e) {
      console.error('PDF error:', e);
      alert('PDF generation failed: ' + e.message);
    } finally {
      setLoading(p => ({ ...p, [type]: false }));
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => generatePDF('venue')}
        disabled={loading.venue}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-60"
      >
        <FileText className="w-3.5 h-3.5" />
        {loading.venue ? 'Generating...' : 'Venue Invoice'}
      </button>
      <button
        onClick={() => generatePDF('platform')}
        disabled={loading.platform}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-60"
      >
        <FileText className="w-3.5 h-3.5" />
        {loading.platform ? 'Generating...' : 'Platform Invoice'}
      </button>
    </div>
  );
}
