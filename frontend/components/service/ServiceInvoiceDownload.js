'use client';

import React from 'react';
import { FileText } from 'lucide-react';

export default function ServiceInvoiceDownload({ booking: b, userRole = 'customer' }) {
  if (!b) return null;

  const [settings, setSettings] = React.useState(null);
  const [loading, setLoading] = React.useState({ service: false, platform: false });

  React.useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues/platform-settings/public`)
      .then(r => r.json()).then(d => { if (d.success) setSettings(d.settings); }).catch(() => {});
  }, []);

  const fmt   = (n) => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtD  = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
  const fmtDT = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

  const p          = b.pricing || {};
  const subtotal   = p.subtotal   || 0;
  const svcCGST    = p.serviceCGST || 0;
  const svcSGST    = p.serviceSGST || 0;
  const svcCGSTRate = p.cgstPct   || 9;
  const svcSGSTRate = p.sgstPct   || 9;
  const svcTotal   = subtotal + svcCGST + svcSGST;
  const pfee       = p.platformFee || 0;
  const pfRate     = p.platformFeePct || 5;
  const pfGST      = p.platformFeeGST || 0;
  const pfCGST     = pfGST / 2;
  const pfSGST     = pfGST / 2;
  const pfCGSTRate = 9;
  const pfSGSTRate = 9;
  const pfTotal    = pfee + pfGST;
  const discount   = b.coupon?.discountAmount || 0;
  const grandTotal = b.pricing?.total || 0;
  const bookingRef = b.bookingNumber || b._id?.slice(-8).toUpperCase() || 'N/A';
  const logoUrl    = typeof window !== 'undefined' ? window.location.origin + '/logo-pdf.jpg' : '/logo-pdf.jpg';

  const toBase64 = (url) => new Promise((resolve) => {
    fetch(url)
      .then(r => r.blob())
      .then(blob => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => resolve(null); reader.readAsDataURL(blob); })
      .catch(() => {
        const img = new Image(); img.crossOrigin = 'anonymous';
        img.onload = () => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0); resolve(c.toDataURL('image/jpeg', 0.85)); };
        img.onerror = () => resolve(null); img.src = url;
      });
  });

  const generatePDF = async (type) => {
    setLoading(p => ({ ...p, [type]: true }));
    try {
      const { default: jsPDF } = await import('jspdf');

      let freshSettings = settings;
      if (!freshSettings?.gstInvoiceSignature && !freshSettings?.platformInvoiceSignature) {
        try {
          const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues/platform-settings/public`);
          const d = await r.json();
          if (d.success) freshSettings = d.settings;
        } catch {}
      }

      const logoB64 = await toBase64(logoUrl);
      const sigUrl  = type === 'service' ? freshSettings?.gstInvoiceSignature : freshSettings?.platformInvoiceSignature;
      const sigB64  = sigUrl ? await toBase64(sigUrl) : null;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210, M = 14, CW = W - M * 2;

      const setFont = (style, size, color) => {
        doc.setFont('helvetica', style);
        doc.setFontSize(size);
        doc.setTextColor(...(color || [31, 41, 55]));
      };
      const right = (text, x, y) => doc.text(text, x, y, { align: 'right' });
      const line  = (x1, y1, x2, y2, color, w) => { doc.setDrawColor(...(color || [229, 231, 235])); doc.setLineWidth(w || 0.3); doc.line(x1, y1, x2, y2); };
      const rect  = (x, y, w, h, fill, stroke) => {
        if (fill) doc.setFillColor(...fill);
        doc.setDrawColor(...(stroke || fill || [229, 231, 235]));
        doc.setLineWidth(0.1);
        doc.roundedRect(x, y, w, h, 2, 2, fill ? (stroke ? 'FD' : 'F') : 'S');
      };

      const accentColor = type === 'service' ? [14, 165, 233] : [139, 92, 246];
      let y = M;

      // Logo
      if (logoB64) doc.addImage(logoB64, 'JPEG', M, y, 62, 10.7);
      else { setFont('bold', 16, [245, 158, 11]); doc.text('RentalMeet', M, y + 8); }

      // Invoice type + meta
      setFont('bold', 15, accentColor);
      right(type === 'service' ? 'SERVICE INVOICE' : 'PLATFORM INVOICE', W - M, y + 5);
      setFont('normal', 8, [107, 114, 128]);
      right('Invoice No: ' + bookingRef, W - M, y + 10);
      right('Date: ' + fmtD(b.createdAt), W - M, y + 14);

      // Badge
      const status = (b.paymentStatus || 'pending').toUpperCase();
      const badgeColors = { PAID: [[209,250,229],[6,95,70]], PENDING: [[254,243,199],[146,64,14]], FAILED: [[254,226,226],[153,27,27]] };
      const [bgC, txC] = badgeColors[status] || badgeColors.PENDING;
      rect(W - M - 18, y + 17, 18, 5, bgC, bgC);
      setFont('bold', 7, txC);
      doc.text(status, W - M - 9, y + 17 + 3.5, { align: 'center' });
      y += 26;

      // Divider
      line(M, y, W - M, y, accentColor, 1);
      y += 5;

      // Cards
      const cardH = 32, cardW = (CW - 4) / 2;
      const custName  = b.customerInfo?.name  || b.customer?.name  || b.customerDetails?.name  || 'N/A';
      const custEmail = b.customerInfo?.email || b.customer?.email || b.customerDetails?.email || 'N/A';
      const custPhone = b.customerInfo?.phone || b.customerDetails?.phone || b.customer?.phone || 'N/A';
      const eventType = b.customerInfo?.eventName || b.customerDetails?.eventType || b.eventType || '';

      // Left card — Billed To
      const lCardColor = type === 'service' ? [[240,249,255],[186,230,253],[12,74,110]] : [[245,243,255],[221,214,254],[76,29,149]];
      rect(M, y, cardW, cardH, lCardColor[0], lCardColor[1]);
      setFont('bold', 7, lCardColor[2]);
      doc.text('BILLED TO', M + 3, y + 5);
      line(M + 3, y + 6.5, M + cardW - 3, y + 6.5, lCardColor[1], 0.3);
      let cy = y + 10;
      const kv = (label, val, xx, yy) => {
        setFont('normal', 7.5, [107, 114, 128]); doc.text(label, xx + 3, yy);
        setFont('bold',   7.5, [17, 24, 39]);    doc.text(String(val || ''), xx + 22, yy);
      };
      kv('Customer', custName,  M, cy); cy += 4.5;
      kv('Email',    custEmail, M, cy); cy += 4.5;
      kv('Phone',    custPhone, M, cy); cy += 4.5;
      if (eventType) kv('Event', eventType, M, cy);

      // Right card — Supplier
      const rx = M + cardW + 4;
      const rCardColor = type === 'service' ? [[255,251,235],[253,230,138],[146,64,14]] : [[245,243,255],[221,214,254],[76,29,149]];
      rect(rx, y, cardW, cardH, rCardColor[0], rCardColor[1]);
      setFont('bold', 7, rCardColor[2]);
      doc.text(type === 'service' ? 'SERVICE PROVIDER' : 'SUPPLIER (PLATFORM)', rx + 3, y + 5);
      line(rx + 3, y + 6.5, rx + cardW - 3, y + 6.5, rCardColor[1], 0.3);
      let ry = y + 10;
      if (type === 'service') {
        const svcName    = b.service?.title || b.vendorSnapshot?.title || b.serviceName || 'N/A';
        const vendorName = b.vendorSnapshot?.companyName || b.vendor?.companyName || b.vendor?.name || 'N/A';
        const category   = b.service?.category || b.vendorSnapshot?.category || '';
        const city       = b.vendorSnapshot?.city || b.vendor?.address?.city || '';
        kv('Service',  svcName,    rx, ry); ry += 4.5;
        kv('Category', category,   rx, ry); ry += 4.5;
        kv('Vendor',   vendorName, rx, ry); ry += 4.5;
        if (city) kv('Location', city, rx, ry);
      } else {
        kv('Company',  'RentalMeet Technologies', rx, ry); ry += 4.5;
        kv('GSTIN',    'Not Available',           rx, ry); ry += 4.5;
        kv('HSN Code', '999799',                  rx, ry); ry += 4.5;
        kv('Ref',      bookingRef,                rx, ry);
      }
      y += cardH + 6;

      // Table
      const cols = [CW * 0.44, CW * 0.14, CW * 0.21, CW * 0.21];
      const colX = [M, M + cols[0], M + cols[0] + cols[1], M + cols[0] + cols[1] + cols[2]];
      rect(M, y, CW, 7, accentColor, accentColor);
      setFont('bold', 7.5, [255, 255, 255]);
      doc.text('DESCRIPTION', colX[0] + 2, y + 4.8);
      doc.text(type === 'service' ? 'UNIT' : 'RATE', colX[1] + 2, y + 4.8);
      right(type === 'service' ? 'RATE' : 'BASE AMOUNT', colX[3] - 2, y + 4.8);
      right('AMOUNT', colX[3] + cols[3] - 2, y + 4.8);
      y += 7;

      if (type === 'service') {
        // Service items
        const items = b.items || b.selectedServices || b.services || [];
        if (items.length > 0) {
          items.forEach((item, i) => {
            const name  = item.name || item.serviceName || 'Service';
            const unit  = item.unit || item.pricingType || '';
            const rate  = item.rate || item.price || 0;
            const qty   = item.quantity || 1;
            const total = item.total || (rate * qty);
            rect(M, y, CW, 8, i % 2 === 0 ? [255,255,255] : [249,250,251], [243,244,246]);
            setFont('bold',   8.5, [17, 24, 39]);
            doc.text(name, colX[0] + 2, y + 4);
            setFont('normal', 7, [107, 114, 128]);
            doc.text(unit, colX[0] + 2, y + 7);
            setFont('normal', 8.5, [17, 24, 39]);
            doc.text(String(qty), colX[1] + 2, y + 5.5);
            right('Rs.' + fmt(rate),  colX[3] - 2,           y + 5.5);
            setFont('bold', 8.5, [17, 24, 39]);
            right('Rs.' + fmt(total), colX[3] + cols[3] - 2, y + 5.5);
            y += 8;
          });
        } else {
          // Fallback single row
          rect(M, y, CW, 10, [255,255,255], [243,244,246]);
          setFont('bold',   8.5, [17, 24, 39]);
          doc.text(b.service?.title || 'Service', colX[0] + 2, y + 4);
          setFont('normal', 7, [107, 114, 128]);
          doc.text(fmtD(b.eventDate || b.createdAt), colX[0] + 2, y + 8);
          setFont('normal', 8.5, [17, 24, 39]);
          doc.text('1', colX[1] + 2, y + 5.5);
          right('-', colX[3] - 2, y + 5.5);
          setFont('bold', 8.5, [17, 24, 39]);
          right('Rs.' + fmt(subtotal), colX[3] + cols[3] - 2, y + 5.5);
          y += 10;
        }
        y += 4;

        // Totals
        const totLines = [
          ['Service Amount (Subtotal)', 'Rs.' + fmt(subtotal)],
          ['CGST @ ' + svcCGSTRate + '%', 'Rs.' + fmt(svcCGST)],
          ['SGST @ ' + svcSGSTRate + '%', 'Rs.' + fmt(svcSGST)],
        ];
        if (discount > 0) totLines.push(['Coupon Discount' + (b.coupon?.code ? ' (' + b.coupon.code + ')' : ''), '- Rs.' + fmt(discount)]);
        const totH = totLines.length * 6 + 10;
        rect(M, y, CW, totH, [240, 249, 255], [186, 230, 253]);
        let ty = y + 5;
        totLines.forEach(([label, val], i) => {
          setFont('normal', 8.5, i === totLines.length - 1 && discount > 0 ? [22, 163, 74] : [55, 65, 81]);
          doc.text(label, M + 4, ty);
          right(val, W - M - 4, ty);
          ty += 6;
        });
        line(M + 4, ty - 1, W - M - 4, ty - 1, [186, 230, 253], 0.5);
        setFont('bold', 10, accentColor);
        doc.text('SERVICE INVOICE TOTAL', M + 4, ty + 4);
        right('Rs.' + fmt(svcTotal - discount), W - M - 4, ty + 4);
        y += totH + 6;

      } else {
        // Platform invoice row
        rect(M, y, CW, 10, [255,255,255], [243,244,246]);
        setFont('bold',   8.5, [17, 24, 39]);
        doc.text('Platform Service Fee', colX[0] + 2, y + 4);
        setFont('normal', 7, [107, 114, 128]);
        doc.text('Service facilitation for ' + (b.service?.title || 'service') + ' on ' + fmtD(b.createdAt), colX[0] + 2, y + 8);
        setFont('normal', 8.5, [17, 24, 39]);
        doc.text(pfRate + '% of base', colX[1] + 2, y + 5.5);
        right('Rs.' + fmt(subtotal), colX[3] - 2, y + 5.5);
        setFont('bold', 8.5, [17, 24, 39]);
        right('Rs.' + fmt(pfee), colX[3] + cols[3] - 2, y + 5.5);
        y += 14;

        const totLines = [
          ['Platform Service Fee (' + pfRate + '%)', 'Rs.' + fmt(pfee)],
          ['CGST @ ' + pfCGSTRate + '%', 'Rs.' + fmt(pfCGST)],
          ['SGST @ ' + pfSGSTRate + '%', 'Rs.' + fmt(pfSGST)],
        ];
        const totH = totLines.length * 6 + 10;
        rect(M, y, CW, totH, [245, 243, 255], [221, 214, 254]);
        let ty = y + 5;
        totLines.forEach(([label, val]) => {
          setFont('normal', 8.5, [55, 65, 81]);
          doc.text(label, M + 4, ty);
          right(val, W - M - 4, ty);
          ty += 6;
        });
        line(M + 4, ty - 1, W - M - 4, ty - 1, [221, 214, 254], 0.5);
        setFont('bold', 10, accentColor);
        doc.text('PLATFORM INVOICE TOTAL', M + 4, ty + 4);
        right('Rs.' + fmt(pfTotal), W - M - 4, ty + 4);
        y += totH + 6;

        // Note
        rect(M, y, CW, 10, [254, 252, 232], [253, 230, 138]);
        setFont('bold',   7.5, [113, 63, 18]);
        doc.text('Note:', M + 3, y + 4);
        setFont('normal', 7.5, [113, 63, 18]);
        doc.text('This invoice covers RentalMeet platform service charges only. Service charges are billed separately in the Service Invoice.', M + 14, y + 4);
        y += 14;
      }

      // Payment details
      if (b.paymentDetails?.razorpay_payment_id) {
        rect(M, y, CW, 8, [240, 253, 244], [187, 247, 208]);
        setFont('bold',   7.5, [6, 95, 70]);
        doc.text('Payment Details', M + 3, y + 3.5);
        setFont('normal', 7, [6, 95, 70]);
        doc.text('Payment ID: ' + b.paymentDetails.razorpay_payment_id + '   |   Order ID: ' + (b.paymentDetails.razorpay_order_id || '-') + '   |   Paid: ' + fmtDT(b.paymentDetails.paidAt), M + 3, y + 6.5);
        y += 12;
      }

      // Signature
      if (sigB64) {
        const sigW = 40, sigH = 14, sigX = W - M - sigW;
        doc.addImage(sigB64, 'JPEG', sigX, y, sigW, sigH);
        line(sigX, y + sigH + 1, sigX + sigW, y + sigH + 1, [55, 65, 81], 0.3);
        setFont('bold', 7, [55, 65, 81]);
        doc.text('Authorized Signatory', sigX + sigW / 2, y + sigH + 4.5, { align: 'center' });
        y += sigH + 8;
      }

      // Footer
      const footerY = 287;
      line(M, footerY - 3, W - M, footerY - 3, [229, 231, 235], 0.3);
      setFont('normal', 7, [156, 163, 175]);
      doc.text('RentalMeet  -  Book Your Premium Meeting Venue  |  support@rentalmeet.com', W / 2, footerY, { align: 'center' });
      doc.text('Booking Ref: ' + bookingRef + '  |  Generated: ' + fmtDT(new Date()) + '  |  Computer-generated invoice', W / 2, footerY + 4, { align: 'center' });

      doc.save(type === 'service' ? 'ServiceInvoice-' + bookingRef + '.pdf' : 'PlatformInvoice-' + bookingRef + '.pdf');
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
        onClick={() => generatePDF('service')}
        disabled={loading.service}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-60"
      >
        <FileText className="w-3.5 h-3.5" />
        {loading.service ? 'Generating...' : 'Service Invoice'}
      </button>
      <button
        onClick={() => generatePDF('platform')}
        disabled={loading.platform}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-60"
      >
        <FileText className="w-3.5 h-3.5" />
        {loading.platform ? 'Generating...' : 'Platform Invoice'}
      </button>
    </div>
  );
}
