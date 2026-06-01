'use client';

import React from 'react';
import { Share2 } from 'lucide-react';

export default function InvitationShare({ booking }) {
  if (!booking || booking.status === 'cancelled') return null;

  const [loading, setLoading] = React.useState(false);

  const fmtD = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const toBase64 = (url, targetAspectRatio = null) => new Promise((resolve) => {
    fetch(url)
      .then(r => r.blob())
      .then(blob => {
        const objectURL = URL.createObjectURL(blob);
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          let drawW = img.width;
          let drawH = img.height;
          let sx = 0;
          let sy = 0;

          if (targetAspectRatio) {
            const imgAspect = img.width / img.height;
            if (imgAspect > targetAspectRatio) {
              drawW = img.height * targetAspectRatio;
              sx = (img.width - drawW) / 2;
            } else {
              drawH = img.width / targetAspectRatio;
              sy = (img.height - drawH) / 2;
            }
          }

          const maxW = 800;
          const scale = drawW > maxW ? maxW / drawW : 1;
          canvas.width = drawW * scale;
          canvas.height = drawH * scale;

          ctx.drawImage(img, sx, sy, drawW, drawH, 0, 0, canvas.width, canvas.height);
          
          URL.revokeObjectURL(objectURL);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => {
          URL.revokeObjectURL(objectURL);
          resolve(null);
        };
        img.src = objectURL;
      })
      .catch(() => {
        // Direct image fallback in case fetch fails
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          let drawW = img.width;
          let drawH = img.height;
          let sx = 0;
          let sy = 0;

          if (targetAspectRatio) {
            const imgAspect = img.width / img.height;
            if (imgAspect > targetAspectRatio) {
              drawW = img.height * targetAspectRatio;
              sx = (img.width - drawW) / 2;
            } else {
              drawH = img.width / targetAspectRatio;
              sy = (img.height - drawH) / 2;
            }
          }

          const maxW = 800;
          const scale = drawW > maxW ? maxW / drawW : 1;
          canvas.width = drawW * scale;
          canvas.height = drawH * scale;

          ctx.drawImage(img, sx, sy, drawW, drawH, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => resolve(null);
        img.src = url;
      });
  });

  const generateInvitationPDF = async () => {
    setLoading(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      
      // Setup A5 portrait document (148mm x 210mm)
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5'
      });

      const W = 148;
      const H = 210;
      const CW = W - 20; // content width with 10mm margins

      // Load Assets
      const logoB64 = await toBase64(window.location.origin + '/logo-pdf.jpg');
      
      // Find featured or first image
      const featuredImage = booking.venue?.images?.find(i => i.isFeatured || i.category === 'Featured')?.url || booking.venue?.images?.[0]?.url;
      const imgB64 = featuredImage ? await toBase64(featuredImage, 110 / 62) : null;

      // ── Draw Invitation Borders ──────────────────────────────────────────
      // Outer Amber/Gold Border
      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(1);
      doc.roundedRect(6, 6, W - 12, H - 12, 4, 4, 'S');

      // Inner Soft Gold Border
      doc.setDrawColor(252, 211, 77);
      doc.setLineWidth(0.3);
      doc.roundedRect(8, 8, W - 16, H - 16, 3, 3, 'S');

      let y = 14;

      // ── Logo/Header ───────────────────────────────────────────────────────
      if (logoB64) {
        // Logo size: 40mm wide, 40 / 5.77 = ~6.9mm high
        doc.addImage(logoB64, 'JPEG', (W - 40) / 2, y, 40, 6.9);
        y += 12;
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(217, 119, 6); // primary-600
        doc.text('RentalMeet', W / 2, y + 4, { align: 'center' });
        y += 12;
      }

      // Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(17, 24, 39);
      doc.text('EVENT INVITATION', W / 2, y, { align: 'center' });
      y += 5.5;

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text("You're cordially invited to attend the event at our venue", W / 2, y, { align: 'center' });
      y += 5.5;

      // ── Venue Image Card ──────────────────────────────────────────────────
      if (imgB64) {
        const imgW = 110;
        const imgH = 62;
        const imgX = (W - imgW) / 2;
        doc.addImage(imgB64, 'JPEG', imgX, y, imgW, imgH);
        
        // Draw thin border around image
        doc.setDrawColor(229, 231, 235);
        doc.setLineWidth(0.2);
        doc.rect(imgX, y, imgW, imgH, 'S');
        y += imgH + 6;
      } else {
        // Fallback decorative box if there's no image
        doc.setFillColor(254, 243, 199); // light gold
        doc.roundedRect(15, y, W - 30, 20, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(146, 64, 14);
        doc.text('A Special Celebration Awaits You', W / 2, y + 12, { align: 'center' });
        y += 28;
      }

      // ── Host Info ─────────────────────────────────────────────────────────
      const hostName = booking.customerDetails?.name || booking.customer?.name || 'Valued Client';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11.5);
      doc.setTextColor(217, 119, 6);
      doc.text(hostName, W / 2, y, { align: 'center' });
      y += 5.5;

      const eventType = booking.customerDetails?.eventType || 'Special Gathering';
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(55, 65, 81);
      doc.text(`invites you to celebrate: ${eventType}`, W / 2, y, { align: 'center' });
      y += 8;

      // Thin divider
      doc.setDrawColor(243, 244, 246);
      doc.setLineWidth(0.3);
      doc.line(20, y - 2, W - 20, y - 2);

      // ── Venue Name ────────────────────────────────────────────────────────
      const venueName = booking.venue?.businessName || 'RentalMeet Venue';
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(17, 24, 39);
      doc.text(venueName, W / 2, y, { align: 'center' });
      y += 8;

      // ── Date ──────────────────────────────────────────────────────────────
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(107, 114, 128);
      doc.text('DATE', W / 2, y, { align: 'center' });
      y += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(17, 24, 39);
      doc.text(fmtD(booking.bookingDate), W / 2, y, { align: 'center' });
      y += 7.5;

      // ── Time ──────────────────────────────────────────────────────────────
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(107, 114, 128);
      doc.text('TIME', W / 2, y, { align: 'center' });
      y += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(17, 24, 39);
      doc.text(`${booking.startTime} - ${booking.endTime}`, W / 2, y, { align: 'center' });
      y += 8;

      // ── Address ───────────────────────────────────────────────────────────
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(107, 114, 128);
      doc.text('VENUE LOCATION', W / 2, y, { align: 'center' });
      y += 4.5;

      const loc = booking.venue?.location || {};
      const fullAddress = `${loc.address || ''}, ${loc.area || ''}, ${loc.city || ''} - ${loc.pincode || ''}`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(55, 65, 81);
      const splitAddress = doc.splitTextToSize(fullAddress, CW - 10);
      doc.text(splitAddress, W / 2, y, { align: 'center' });
      y += (splitAddress.length * 4.5) + 3;

      // ── Map Link Button ───────────────────────────────────────────────────
      if (loc.googleMapLink) {
        const btnW = 56;
        const btnH = 8;
        const btnX = (W - btnW) / 2;
        
        doc.setFillColor(217, 119, 6); // Solid gold background
        doc.roundedRect(btnX, y, btnW, btnH, 1.5, 1.5, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(255, 255, 255);
        doc.text('View Location on Map', W / 2, y + 5.2, { align: 'center' });
        
        // Make the button clickable
        doc.link(btnX, y, btnW, btnH, { url: loc.googleMapLink });
      }

      // Save PDF
      const filename = `Invitation-${booking.bookingNumber || booking._id.slice(-8).toUpperCase()}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error('Error generating invitation PDF:', error);
      alert('Failed to generate invitation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={generateInvitationPDF}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-60"
    >
      <Share2 className="w-3.5 h-3.5" />
      {loading ? 'Generating...' : 'Share Invitation'}
    </button>
  );
}
