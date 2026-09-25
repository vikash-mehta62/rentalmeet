'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  X, Download, Calendar, Clock, MapPin, Users,
  Building2, Phone, Mail, MessageSquare, IndianRupee,
  CheckCircle2, FileText, ArrowRight, Sparkles, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function EnquiryDetailModal({
  enquiry,
  onClose,
  isOwner = false,
  onStatusUpdate = null,
  updatingStatus = false
}) {
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  if (!enquiry) return null;

  const cd = enquiry.customerDetails || {};
  const bd = enquiry.bookingDetails || {};
  const venue = enquiry.venue || {};
  const amenities = enquiry.selectedAmenities || {};
  const pb = enquiry.priceBreakdown || {};

  const cleanPhone = (cd.phone || '').replace(/\D/g, '');
  const rawDate = bd.bookingDate || bd.date;
  const formattedDate = rawDate
    ? new Date(rawDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : '—';

  const getStatusBadge = (status) => {
    switch (status) {
      case 'converted':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Converted
          </span>
        );
      case 'contacted':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
            Contacted
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
            Pending Draft
          </span>
        );
    }
  };

  // ── Helper to convert image URL to base64 for jsPDF ──
  const toBase64 = (url) =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const c = document.createElement('canvas');
        const scale = Math.min(1, 1000 / Math.max(img.width, img.height));
        c.width = img.width * scale;
        c.height = img.height * scale;
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });

  // ── PDF Generation matching invoice fonts & styling ──
  const handleDownloadPDF = async () => {
    setDownloadingPDF(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210;
      const M = 14;
      const CW = W - M * 2;

      const setFont = (style, size, color) => {
        doc.setFont('helvetica', style);
        doc.setFontSize(size);
        if (color) doc.setTextColor(...color);
        else doc.setTextColor(31, 41, 55);
      };
      const right = (text, x, y) => doc.text(String(text || ''), x, y, { align: 'right' });
      const line = (x1, y1, x2, y2, color, w) => {
        doc.setDrawColor(...(color || [229, 231, 235]));
        doc.setLineWidth(w || 0.3);
        doc.line(x1, y1, x2, y2);
      };
      const rect = (x, y, w, h, fillColor, strokeColor) => {
        if (fillColor) doc.setFillColor(...fillColor);
        if (strokeColor) doc.setDrawColor(...strokeColor);
        else doc.setDrawColor(...(fillColor || [255, 255, 255]));
        doc.setLineWidth(0.1);
        doc.roundedRect(x, y, w, h, 2, 2, fillColor ? (strokeColor ? 'FD' : 'F') : 'S');
      };

      let y = M;

      // Header logo
      const logoB64 = await toBase64(window.location.origin + '/logo-pdf.jpg');
      if (logoB64) {
        doc.addImage(logoB64, 'JPEG', M, y, 55, 9.5);
      } else {
        setFont('bold', 15, [245, 158, 11]);
        doc.text('RentalMeet', M, y + 7);
      }

      // Title & Reference on Right
      const accentColor = [245, 158, 11]; // Amber
      setFont('bold', 14, accentColor);
      right('BOOKING ENQUIRY DRAFT', W - M, y + 4);

      setFont('normal', 8, [107, 114, 128]);
      right('Ref No: ' + (enquiry.enquiryNumber || 'ENQ-DRAFT'), W - M, y + 9);
      right('Date: ' + new Date(enquiry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), W - M, y + 13);

      // Status Badge
      const statusText = (enquiry.status || 'PENDING').toUpperCase();
      const badgeW = 22, badgeH = 5;
      const badgeX = W - M - badgeW;
      rect(badgeX, y + 16, badgeW, badgeH, [254, 243, 199], [253, 230, 138]);
      setFont('bold', 7, [146, 64, 14]);
      doc.text(statusText, badgeX + badgeW / 2, y + 19.5, { align: 'center' });

      y += 25;
      line(M, y, W - M, y, accentColor, 0.8);
      y += 5;

      // Two side-by-side cards: CUSTOMER DETAILS + VENUE & TIMING
      const cardW = (CW - 4) / 2;
      const cardH = 38;

      // Left Card: Customer Details
      rect(M, y, cardW, cardH, [255, 251, 235], [253, 230, 138]);
      setFont('bold', 7.5, [146, 64, 14]);
      doc.text('CUSTOMER DETAILS', M + 3, y + 4.5);
      line(M + 3, y + 6, M + cardW - 3, y + 6, [253, 230, 138], 0.3);

      let cy = y + 9.5;
      const cRow = (label, val) => {
        setFont('normal', 7, [107, 114, 128]);
        doc.text(label, M + 3, cy);
        setFont('bold', 7, [17, 24, 39]);
        doc.text(String(val || '—'), M + 22, cy);
        cy += 4;
      };
      cRow('Name', cd.name);
      cRow('Phone', cd.phone);
      cRow('Email', cd.email);
      if (cd.company) cRow('Company', cd.company);
      if (cd.gstin) cRow('GSTIN', cd.gstin);
      cRow('Event Type', cd.eventType || bd.purpose);
      cRow('Guests', cd.guestCount || bd.guests);

      // Right Card: Venue & Timing
      const rx = M + cardW + 4;
      rect(rx, y, cardW, cardH, [255, 251, 235], [253, 230, 138]);
      setFont('bold', 7.5, [146, 64, 14]);
      doc.text('VENUE & SCHEDULE', rx + 3, y + 4.5);
      line(rx + 3, y + 6, rx + cardW - 3, y + 6, [253, 230, 138], 0.3);

      let ry = y + 9.5;
      const vRow = (label, val) => {
        setFont('normal', 7, [107, 114, 128]);
        doc.text(label, rx + 3, ry);
        setFont('bold', 7, [17, 24, 39]);
        doc.text(String(val || '—'), rx + 24, ry);
        ry += 4;
      };
      vRow('Venue', venue.businessName);
      vRow('Location', venue.location?.city || venue.location?.address);
      vRow('Date', formattedDate);
      vRow('Slot', (bd.startTime || '') + ' - ' + (bd.endTime || ''));
      vRow('Duration', (bd.duration ? `${bd.duration} Hours` : '—') + (bd.bookingType ? ` (${bd.bookingType})` : ''));

      y += cardH + 6;

      // Table Header: Itemized Requirements & Pricing
      setFont('bold', 8, [55, 65, 81]);
      doc.text('REQUESTED ITEMS & ESTIMATED BREAKDOWN', M, y);
      y += 2.5;

      const cols = [CW * 0.44, CW * 0.16, CW * 0.18, CW * 0.22];
      const colX = [M, M + cols[0], M + cols[0] + cols[1], M + cols[0] + cols[1] + cols[2]];

      rect(M, y, CW, 6.5, [243, 244, 246], [229, 231, 235]);
      setFont('bold', 7, [75, 85, 99]);
      doc.text('DESCRIPTION', colX[0] + 2, y + 4.2);
      doc.text('QTY / DURATION', colX[1] + 2, y + 4.2);
      right('UNIT RATE (INR)', colX[2] + cols[2] - 2, y + 4.2);
      right('TOTAL (INR)', colX[3] + cols[3] - 2, y + 4.2);
      y += 6.5;

      // Table Row Helper
      const drawTableRow = (desc, qtyStr, rateStr, totalStr, isAlt = false) => {
        const rowH = 6;
        if (isAlt) rect(M, y, CW, rowH, [249, 250, 251], null);
        setFont('normal', 7, [31, 41, 55]);
        doc.text(desc, colX[0] + 2, y + 4);
        doc.text(String(qtyStr || '1'), colX[1] + 2, y + 4);
        right(rateStr, colX[2] + cols[2] - 2, y + 4);
        setFont('bold', 7, [31, 41, 55]);
        right(totalStr, colX[3] + cols[3] - 2, y + 4);
        line(M, y + rowH, W - M, y + rowH, [243, 244, 246], 0.2);
        y += rowH;
      };

      let isAlt = false;

      // 1. Venue Slot Row
      const baseVenuePrice = pb.basePrice || 0;
      drawTableRow(
        `${venue.businessName || 'Venue'} Space Rental (${bd.duration || 1} hrs)`,
        `${bd.duration || 1} hrs`,
        baseVenuePrice > 0 ? baseVenuePrice.toLocaleString('en-IN') : '—',
        baseVenuePrice > 0 ? baseVenuePrice.toLocaleString('en-IN') : '—',
        isAlt
      );
      isAlt = !isAlt;

      // 2. Amenities Items
      if (amenities.basic && Array.isArray(amenities.basic)) {
        amenities.basic.forEach((item) => {
          const name = typeof item === 'string' ? item : item.name;
          const rate = typeof item === 'object' ? item.rate || 0 : 0;
          const q = typeof item === 'object' ? item.quantity || 1 : 1;
          const total = typeof item === 'object' ? item.total || rate * q : rate * q;
          drawTableRow(`Basic: ${name}`, `${q}`, rate > 0 ? rate.toLocaleString('en-IN') : 'Included', total > 0 ? total.toLocaleString('en-IN') : '0', isAlt);
          isAlt = !isAlt;
        });
      }

      if (amenities.beverages && Array.isArray(amenities.beverages)) {
        amenities.beverages.forEach((bev) => {
          const rate = bev.ratePerUnit || bev.price || 0;
          const q = bev.quantity || 1;
          const tot = bev.total || rate * q;
          drawTableRow(`Beverage: ${bev.name}${bev.brand ? ` (${bev.brand})` : ''}`, `${q} units`, rate.toLocaleString('en-IN'), tot.toLocaleString('en-IN'), isAlt);
          isAlt = !isAlt;
        });
      }

      if (amenities.refreshmentFood && Array.isArray(amenities.refreshmentFood)) {
        amenities.refreshmentFood.forEach((food) => {
          const rate = food.ratePerPlate || food.price || 0;
          const q = food.quantity || 1;
          const tot = food.total || rate * q;
          drawTableRow(`Refreshment: ${food.name}`, `${q} plates`, rate.toLocaleString('en-IN'), tot.toLocaleString('en-IN'), isAlt);
          isAlt = !isAlt;
        });
      }

      if (amenities.lunchThalis && Array.isArray(amenities.lunchThalis)) {
        amenities.lunchThalis.forEach((thali) => {
          const rate = thali.ratePerPlate || thali.price || 0;
          const q = thali.quantity || 1;
          const tot = thali.total || rate * q;
          drawTableRow(`Meal: ${thali.thaliType || thali.name || 'Thali'} (${thali.category || 'Standard'})`, `${q} plates`, rate.toLocaleString('en-IN'), tot.toLocaleString('en-IN'), isAlt);
          isAlt = !isAlt;
        });
      }

      y += 4;

      // Summary Box (Right Aligned)
      const sumW = 85;
      const sumX = W - M - sumW;
      const sumH = 34;

      rect(sumX, y, sumW, sumH, [255, 251, 235], [253, 230, 138]);

      let sy = y + 5;
      const sRow = (label, val, bold = false) => {
        setFont(bold ? 'bold' : 'normal', bold ? 8 : 7.5, bold ? [17, 24, 39] : [75, 85, 99]);
        doc.text(label, sumX + 3, sy);
        right(val, W - M - 3, sy);
        sy += 4.5;
      };

      const subtotalVal = pb.subtotal || (pb.basePrice || 0) + (pb.amenitiesTotal || 0);
      sRow('Subtotal', `INR ${subtotalVal.toLocaleString('en-IN')}`);

      const gstTotal = pb.gst || 0;
      if (gstTotal > 0) {
        sRow('GST (Estimated)', `INR ${gstTotal.toLocaleString('en-IN')}`);
      }

      if (pb.platformFeeTotal > 0) {
        sRow('Platform Charges', `INR ${pb.platformFeeTotal.toLocaleString('en-IN')}`);
      }

      if (pb.discount > 0) {
        sRow('Discount Applied', `- INR ${pb.discount.toLocaleString('en-IN')}`);
      }

      line(sumX + 3, sy - 1, W - M - 3, sy - 1, [253, 230, 138], 0.3);
      sy += 1.5;

      const grandTotal = enquiry.estimatedAmount || pb.total || 0;
      setFont('bold', 9, [146, 64, 14]);
      doc.text('Estimated Total:', sumX + 3, sy);
      right(`INR ${grandTotal.toLocaleString('en-IN')}`, W - M - 3, sy);

      // Left Box: Special Requests
      const reqW = CW - sumW - 4;
      const specialReqText = cd.specialRequirements || enquiry.notes || 'None';
      rect(M, y, reqW, sumH, [249, 250, 251], [229, 231, 235]);
      setFont('bold', 7.5, [75, 85, 99]);
      doc.text('CUSTOMER SPECIAL REQUESTS', M + 3, y + 5);
      line(M + 3, y + 6.5, M + reqW - 3, y + 6.5, [229, 231, 235], 0.2);

      setFont('normal', 7, [55, 65, 81]);
      const splitReq = doc.splitTextToSize(specialReqText, reqW - 6);
      doc.text(splitReq, M + 3, y + 11);

      y += sumH + 10;

      // Footer notice
      line(M, y, W - M, y, [229, 231, 235], 0.3);
      y += 4;
      setFont('normal', 6.5, [156, 163, 175]);
      doc.text('This is a computer-generated booking enquiry draft issued by RentalMeet.', M, y);
      right('https://rentalmeet.com • support@rentalmeet.com', W - M, y);

      doc.save(`RentalMeet_Enquiry_${enquiry.enquiryNumber || 'Draft'}.pdf`);
      toast.success('Enquiry Quotation PDF downloaded successfully! 📄');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setDownloadingPDF(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col border border-gray-100 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-slate-100">
                  {cd.name || 'Booking Enquiry Draft'}
                </h2>
                {getStatusBadge(enquiry.status)}
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-mono mt-0.5">
                Ref: #{enquiry.enquiryNumber} • {venue.businessName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              title="Download Enquiry Quotation PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {downloadingPDF ? 'Generating...' : 'Download PDF'}
              </span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-gray-700 dark:text-slate-300">
          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Details Box */}
            <div className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-4 border border-gray-100 dark:border-slate-700/60 space-y-2.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary-500" />
                Customer Contact Information
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400 dark:text-slate-400 block text-[10px]">Name</span>
                  <strong className="text-gray-900 dark:text-slate-100">{cd.name || '—'}</strong>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-slate-400 block text-[10px]">Phone</span>
                  <strong className="text-gray-900 dark:text-slate-100">{cd.phone || '—'}</strong>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-slate-400 block text-[10px]">Email</span>
                  <strong className="text-gray-900 dark:text-slate-100 break-all">{cd.email || '—'}</strong>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-slate-400 block text-[10px]">Event Type</span>
                  <strong className="text-gray-900 dark:text-slate-100">{cd.eventType || bd.purpose || '—'}</strong>
                </div>
                <div>
                  <span className="text-gray-400 dark:text-slate-400 block text-[10px]">Guest Count</span>
                  <strong className="text-gray-900 dark:text-slate-100">{cd.guestCount || bd.guests || '—'} Guests</strong>
                </div>
                {cd.company && (
                  <div>
                    <span className="text-gray-400 dark:text-slate-400 block text-[10px]">Company</span>
                    <strong className="text-gray-900 dark:text-slate-100">{cd.company}</strong>
                  </div>
                )}
                {cd.gstin && (
                  <div>
                    <span className="text-gray-400 dark:text-slate-400 block text-[10px]">GSTIN</span>
                    <strong className="text-gray-900 dark:text-slate-100 font-mono">{cd.gstin}</strong>
                  </div>
                )}
              </div>

              {/* Owner Direct Contact Buttons */}
              {isOwner && cleanPhone && (
                <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-slate-700">
                  <a
                    href={`tel:${cleanPhone}`}
                    className="flex-1 py-1.5 px-2 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg font-bold text-center flex items-center justify-center gap-1 hover:bg-green-100 transition-colors"
                  >
                    <Phone className="w-3 h-3" /> Call
                  </a>
                  <a
                    href={`https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`}?text=Hello%20${encodeURIComponent(cd.name || '')},%20we%20received%20your%20enquiry%20for%20${encodeURIComponent(venue.businessName || 'our venue')}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 px-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg font-bold text-center flex items-center justify-center gap-1 hover:bg-emerald-100 transition-colors"
                  >
                    <MessageSquare className="w-3 h-3" /> WhatsApp
                  </a>
                </div>
              )}
            </div>

            {/* Venue & Schedule Box */}
            <div className="bg-amber-50/50 dark:bg-amber-950/30 rounded-xl p-4 border border-amber-100 dark:border-amber-800/60 space-y-2.5">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Venue & Timing Schedule
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-amber-700/70 dark:text-amber-400/70 block text-[10px]">Venue</span>
                  <strong className="text-gray-900 dark:text-slate-100">{venue.businessName || '—'}</strong>
                </div>
                <div>
                  <span className="text-amber-700/70 dark:text-amber-400/70 block text-[10px]">Location</span>
                  <strong className="text-gray-900 dark:text-slate-100">{venue.location?.city || venue.location?.address || '—'}</strong>
                </div>
                <div>
                  <span className="text-amber-700/70 dark:text-amber-400/70 block text-[10px]">Requested Date</span>
                  <strong className="text-gray-900 dark:text-slate-100">{formattedDate}</strong>
                </div>
                <div>
                  <span className="text-amber-700/70 dark:text-amber-400/70 block text-[10px]">Time Slot</span>
                  <strong className="text-gray-900 dark:text-slate-100">{bd.startTime || '—'} - {bd.endTime || '—'}</strong>
                </div>
                <div>
                  <span className="text-amber-700/70 dark:text-amber-400/70 block text-[10px]">Duration</span>
                  <strong className="text-gray-900 dark:text-slate-100">{bd.duration ? `${bd.duration} Hours` : '—'}</strong>
                </div>
                <div>
                  <span className="text-amber-700/70 dark:text-amber-400/70 block text-[10px]">Booking Type</span>
                  <strong className="text-gray-900 dark:text-slate-100 capitalize">{bd.bookingType || 'Standard'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Itemized Breakdown Table */}
          <div className="border border-gray-100 dark:border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-gray-100 dark:bg-slate-800 px-4 py-2.5 font-bold text-gray-800 dark:text-slate-200 text-xs flex justify-between items-center">
              <span>Itemized Requirements & Selected Amenities</span>
              <span>Estimated Rates</span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-slate-800">
              {/* Venue base rental */}
              <div className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between">
                <div>
                  <span className="font-bold text-gray-900 dark:text-slate-100">Venue Slot Rental</span>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400">
                    {formattedDate} • {bd.startTime} - {bd.endTime || `${bd.duration}h`} ({bd.duration} hrs)
                  </p>
                </div>
                <span className="font-bold text-gray-900 dark:text-slate-100">
                  ₹{Number(pb.basePrice || 0).toLocaleString()}
                </span>
              </div>

              {/* Basic Amenities */}
              {amenities.basic?.map((item, idx) => {
                const name = typeof item === 'string' ? item : item.name;
                const rate = typeof item === 'object' ? item.rate || 0 : 0;
                const q = typeof item === 'object' ? item.quantity || 1 : 1;
                const tot = typeof item === 'object' ? item.total || rate * q : rate * q;
                return (
                  <div key={idx} className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-slate-100">{name}</span>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400">Basic Amenity • Qty: {q}</p>
                    </div>
                    <span className="font-semibold text-gray-700 dark:text-slate-300">
                      {tot > 0 ? `₹${tot.toLocaleString()}` : 'Included'}
                    </span>
                  </div>
                );
              })}

              {/* Beverages */}
              {amenities.beverages?.map((bev, idx) => {
                const rate = bev.ratePerUnit || bev.price || 0;
                const q = bev.quantity || 1;
                const tot = bev.total || rate * q;
                return (
                  <div key={idx} className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-slate-100">{bev.name}</span>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400">
                        Beverage {bev.brand ? `(${bev.brand})` : ''} • Qty: {q} • @ ₹{rate}/unit
                      </p>
                    </div>
                    <span className="font-semibold text-gray-700 dark:text-slate-300">₹{tot.toLocaleString()}</span>
                  </div>
                );
              })}

              {/* Refreshments */}
              {amenities.refreshmentFood?.map((food, idx) => {
                const rate = food.ratePerPlate || food.price || 0;
                const q = food.quantity || 1;
                const tot = food.total || rate * q;
                return (
                  <div key={idx} className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-slate-100">{food.name}</span>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400">
                        Refreshment • Qty: {q} plates • @ ₹{rate}/plate
                      </p>
                    </div>
                    <span className="font-semibold text-gray-700 dark:text-slate-300">₹{tot.toLocaleString()}</span>
                  </div>
                );
              })}

              {/* Meals / Thalis */}
              {amenities.lunchThalis?.map((thali, idx) => {
                const rate = thali.ratePerPlate || thali.price || 0;
                const q = thali.quantity || 1;
                const tot = thali.total || rate * q;
                return (
                  <div key={idx} className="p-3 bg-white dark:bg-slate-900 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-slate-100">
                        {thali.thaliType || thali.name || 'Thali'} ({thali.category || 'Standard'})
                      </span>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400">
                        Meal Thali • Qty: {q} plates • @ ₹{rate}/plate
                      </p>
                    </div>
                    <span className="font-semibold text-gray-700 dark:text-slate-300">₹{tot.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>

            {/* Total Summary Footer */}
            <div className="bg-amber-50/70 dark:bg-amber-950/40 p-4 border-t border-amber-200 dark:border-amber-800/80 space-y-1.5">
              <div className="flex justify-between text-gray-600 dark:text-slate-400">
                <span>Subtotal (Venue + Amenities):</span>
                <span className="font-medium">₹{Number(pb.subtotal || pb.basePrice || 0).toLocaleString()}</span>
              </div>
              {pb.gst > 0 && (
                <div className="flex justify-between text-gray-600 dark:text-slate-400">
                  <span>Estimated GST:</span>
                  <span className="font-medium">₹{Number(pb.gst).toLocaleString()}</span>
                </div>
              )}
              {pb.platformFeeTotal > 0 && (
                <div className="flex justify-between text-gray-600 dark:text-slate-400">
                  <span>Platform Fee:</span>
                  <span className="font-medium">₹{Number(pb.platformFeeTotal).toLocaleString()}</span>
                </div>
              )}
              {pb.discount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Discount Applied:</span>
                  <span className="font-medium">-₹{Number(pb.discount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-amber-900 dark:text-amber-200 pt-2 border-t border-amber-200 dark:border-amber-800">
                <span>Estimated Grand Total:</span>
                <span>₹{Number(enquiry.estimatedAmount || pb.total || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Special Requirements */}
          {(cd.specialRequirements || enquiry.notes) && (
            <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-xl p-4">
              <h4 className="font-bold text-blue-900 dark:text-blue-200 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Customer Special Requirements
              </h4>
              <p className="text-gray-800 dark:text-slate-200 leading-relaxed">
                {cd.specialRequirements || enquiry.notes}
              </p>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Owner Status Dropdown */}
          {isOwner && onStatusUpdate ? (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">Status:</span>
              <select
                value={enquiry.status}
                disabled={updatingStatus}
                onChange={(e) => onStatusUpdate(enquiry._id, e.target.value)}
                className="px-3 py-1.5 text-xs font-bold border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500"
              >
                <option value="pending">Pending Draft</option>
                <option value="contacted">Owner Contacted</option>
                <option value="converted">Converted to Booking</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          ) : (
            <span className="text-xs text-gray-500 dark:text-slate-400">
              Draft submitted on {new Date(enquiry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          )}

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={handleDownloadPDF}
              disabled={downloadingPDF}
              className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingPDF ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>

            {!isOwner && venue.sku && (
              <Link
                href={`/venues/${venue.sku}?enquiryId=${enquiry._id}`}
                className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all"
              >
                <span>Complete Booking Now</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
