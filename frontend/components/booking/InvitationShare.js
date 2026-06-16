'use client';

import React from 'react';
import { Share2, X, Download, FileText } from 'lucide-react';

export default function InvitationShare({ booking }) {
  if (!booking || booking.status === 'cancelled') return null;

  const [loading, setLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  // Form States for Customization
  const [hostName, setHostName] = React.useState('');
  const [eventType, setEventType] = React.useState('');
  const [inviteMessage, setInviteMessage] = React.useState("You're Invited!");
  const [eventDateText, setEventDateText] = React.useState('');
  const [eventTimeText, setEventTimeText] = React.useState('');
  const [venueNameText, setVenueNameText] = React.useState('');
  const [venueAddressText, setVenueAddressText] = React.useState('');
  
  // New invitation fields
  const [googleMapsLink, setGoogleMapsLink] = React.useState('');
  const [calendarLink, setCalendarLink] = React.useState('');
  const [parkingDetails, setParkingDetails] = React.useState('');
  const [dressCode, setDressCode] = React.useState('');
  const [specialInstructions, setSpecialInstructions] = React.useState('');
  const [rsvpDate, setRsvpDate] = React.useState('');

  // Helper to generate Google Calendar Link
  const getCalendarLink = (title, dateVal, timeVal, locationVal) => {
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '';
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      
      const parseHourMin = (tStr) => {
        if (!tStr) return { hr: 9, min: 0 };
        const match = tStr.trim().match(/^(\d+):(\d+)\s*(AM|PM)?$/i);
        if (!match) return { hr: 9, min: 0 };
        let hr = parseInt(match[1]);
        const min = parseInt(match[2]);
        const ampm = match[3];
        if (ampm && ampm.toUpperCase() === 'PM' && hr < 12) hr += 12;
        if (ampm && ampm.toUpperCase() === 'AM' && hr === 12) hr = 0;
        return { hr, min };
      };

      const times = (timeVal || '09:00 - 17:00').split('-');
      const startObj = parseHourMin(times[0]);
      const endObj = parseHourMin(times[1] || times[0]);

      const pad = (n) => String(n).padStart(2, '0');
      const startIso = `${yyyy}${mm}${dd}T${pad(startObj.hr)}${pad(startObj.min)}00`;
      const endIso = `${yyyy}${mm}${dd}T${pad(endObj.hr)}${pad(endObj.min)}00`;

      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startIso}/${endIso}&details=Event+Invitation&location=${encodeURIComponent(locationVal)}`;
    } catch {
      return '';
    }
  };

  // Pre-fill states on mount or modal open
  React.useEffect(() => {
    if (booking && isOpen) {
      const host = booking.customerDetails?.name || booking.customer?.name || 'Valued Client';
      const event = booking.customerDetails?.eventType || 'Special Gathering';
      const venue = booking.venue?.businessName || 'Venue';
      
      const loc = booking.venue?.location || {};
      const fullAddress = `${loc.address || ''}, ${loc.area || ''}, ${loc.city || ''} - ${loc.pincode || ''}`;
      
      const formattedDate = booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }) : 'N/A';
      
      const timeSlot = `${booking.startTime || ''} - ${booking.endTime || ''}`;
      const maps = loc.googleMapLink || '';
      const cal = getCalendarLink(event, booking.bookingDate, timeSlot, fullAddress);
      const rsvp = booking.bookingDate ? new Date(new Date(booking.bookingDate).getTime() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }) : 'N/A';

      setHostName(host);
      setEventType(event);
      setVenueNameText(venue);
      setVenueAddressText(fullAddress);
      setEventDateText(formattedDate);
      setEventTimeText(timeSlot);
      setGoogleMapsLink(maps);
      setCalendarLink(cal);
      setParkingDetails(loc.parkingAvailability ? `${loc.parkingAvailability} Parking` : 'Free parking available');
      setDressCode('Smart Casual / Traditional');
      setSpecialInstructions(booking.customerDetails?.specialRequirements || 'Please show this invitation at the gate.');
      setRsvpDate(rsvp);
    }
  }, [booking, isOpen]);

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

  const generatePDFObject = async () => {
    const { default: jsPDF } = await import('jspdf');
    
    // Setup A5 portrait document (148mm x 210mm)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a5'
    });

    const W = 148;
    const H = 210;
    const CW = W - 20;

    // Load Assets
    const logoB64 = await toBase64(window.location.origin + '/logo-pdf.jpg');
    
    // Find featured or first image
    const featuredImage = booking.venue?.images?.find(i => i.isFeatured || i.category === 'Featured')?.url || booking.venue?.images?.[0]?.url;
    const imgB64 = featuredImage ? await toBase64(featuredImage, 110 / 62) : null;

    // ── Draw Borders ─────────────────────────────────────────────────────
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(1);
    doc.roundedRect(6, 6, W - 12, H - 12, 4, 4, 'S');

    doc.setDrawColor(252, 211, 77);
    doc.setLineWidth(0.3);
    doc.roundedRect(8, 8, W - 16, H - 16, 3, 3, 'S');

    let y = 14;

    // ── Header/Logo ──────────────────────────────────────────────────────
    if (logoB64) {
      doc.addImage(logoB64, 'JPEG', (W - 40) / 2, y, 40, 6.9);
      y += 12;
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(217, 119, 6);
      doc.text('RentalMeet', W / 2, y + 4, { align: 'center' });
      y += 12;
    }

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(17, 24, 39);
    doc.text('EVENT INVITATION', W / 2, y, { align: 'center' });
    y += 5.5;

    // Invite Message
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    const splitMessage = doc.splitTextToSize(inviteMessage, CW - 10);
    doc.text(splitMessage, W / 2, y, { align: 'center' });
    y += (splitMessage.length * 4.5) + 1;

    // ── Venue Image ──────────────────────────────────────────────────────
    if (imgB64) {
      const imgW = 110;
      const imgH = 62;
      const imgX = (W - imgW) / 2;
      doc.addImage(imgB64, 'JPEG', imgX, y, imgW, imgH);
      
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.2);
      doc.rect(imgX, y, imgW, imgH, 'S');
      y += imgH + 5;
    } else {
      doc.setFillColor(254, 243, 199);
      doc.roundedRect(15, y, W - 30, 20, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(146, 64, 14);
      doc.text('A Special Celebration Awaits You', W / 2, y + 12, { align: 'center' });
      y += 26;
    }

    // ── Host Info ────────────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(217, 119, 6);
    doc.text(hostName, W / 2, y, { align: 'center' });
    y += 5.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(55, 65, 81);
    doc.text(`invites you to celebrate: ${eventType}`, W / 2, y, { align: 'center' });
    y += 7;

    doc.setDrawColor(243, 244, 246);
    doc.setLineWidth(0.3);
    doc.line(20, y - 2, W - 20, y - 2);

    // ── Venue Name ───────────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(17, 24, 39);
    doc.text(venueNameText, W / 2, y, { align: 'center' });
    y += 8;

    // ── Date & Time ──────────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(107, 114, 128);
    doc.text('DATE & TIME', W / 2, y, { align: 'center' });
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text(`${eventDateText} | ${eventTimeText}`, W / 2, y, { align: 'center' });
    y += 7.5;

    // ── Address ──────────────────────────────────────────────────────────
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(107, 114, 128);
    doc.text('VENUE LOCATION', W / 2, y, { align: 'center' });
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    const splitAddress = doc.splitTextToSize(venueAddressText, CW - 10);
    doc.text(splitAddress, W / 2, y, { align: 'center' });
    y += (splitAddress.length * 4.5) + 3;

    // ── Parking, Dress Code, RSVP ─────────────────────────────────────────
    doc.setDrawColor(243, 244, 246);
    doc.setLineWidth(0.3);
    doc.line(20, y - 1, W - 20, y - 1);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text('PARKING', 18, y + 3);
    doc.text('DRESS CODE', 58, y + 3);
    doc.text('RSVP BY', 102, y + 3);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(55, 65, 81);
    doc.text(parkingDetails.substring(0, 22), 18, y + 7);
    doc.text(dressCode.substring(0, 22), 58, y + 7);
    doc.text(rsvpDate, 102, y + 7);
    y += 11;

    // ── Special Instructions ──────────────────────────────────────────────
    if (specialInstructions && specialInstructions.trim()) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(107, 114, 128);
      doc.text('SPECIAL INSTRUCTIONS', W / 2, y, { align: 'center' });
      y += 4;
      
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(75, 85, 99);
      const splitNote = doc.splitTextToSize(specialInstructions, CW - 10);
      doc.text(splitNote, W / 2, y, { align: 'center' });
      y += (splitNote.length * 4);
    }

    return doc;
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const doc = await generatePDFObject();
      const filename = `Invitation-${booking.bookingNumber || booking._id.slice(-8).toUpperCase()}.pdf`;
      doc.save(filename);
      setIsOpen(false);
    } catch (error) {
      console.error('Error downloading invitation:', error);
      alert('Failed to generate PDF: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    setLoading(true);
    try {
      // User's exact template format with site URL at the bottom for automatic logo preview
      const textMessage = `E-INVITATION
You're Invited!

*Event:* ${eventType}
*Date:* ${eventDateText}
*Time:* ${eventTimeText}
*Venue:* ${venueNameText}
*Host:* ${hostName} 

*Location:* ${googleMapsLink}
*Add to Calendar:* ${calendarLink}

*Parking:* ${parkingDetails}
*Dress Code:* ${dressCode}

*Special Instructions:*
${specialInstructions}

_This invitation was sent via RentalMeet_
https://www.rentalmeet.com`;

      if (navigator.share) {
        await navigator.share({
          title: 'Event Invitation',
          text: textMessage,
        });
      } else {
        await navigator.clipboard.writeText(textMessage);
        alert('Invitation text copied to clipboard! You can paste it on WhatsApp or social media.');
      }
      setIsOpen(false);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing invitation:', error);
        alert('Failed to share: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-semibold transition-colors"
      >
        <Share2 className="w-3.5 h-3.5" />
        Share Invitation
      </button>

      {/* Modal Popup */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-gray-800 text-sm">Customize Invitation Details</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Fields */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Host Name</label>
                <input
                  type="text"
                  value={hostName}
                  onChange={(e) => setHostName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 font-semibold text-gray-700 bg-gray-50/30"
                  placeholder="E.g., John Doe"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Event Type / Celebration</label>
                <input
                  type="text"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 font-semibold text-gray-700 bg-gray-50/30"
                  placeholder="E.g., Wedding Anniversary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Invite Message</label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 font-semibold text-gray-700 bg-gray-50/30 resize-none"
                  placeholder="Short invitation message..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Date</label>
                  <input
                    type="text"
                    value={eventDateText}
                    onChange={(e) => setEventDateText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 font-semibold text-gray-700 bg-gray-50/30"
                    placeholder="Event Date"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Time</label>
                  <input
                    type="text"
                    value={eventTimeText}
                    onChange={(e) => setEventTimeText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 font-semibold text-gray-700 bg-gray-50/30"
                    placeholder="Event Time"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Venue Name</label>
                <input
                  type="text"
                  value={venueNameText}
                  onChange={(e) => setVenueNameText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 font-semibold text-gray-700 bg-gray-50/30"
                  placeholder="Venue Name"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Venue Address</label>
                <textarea
                  value={venueAddressText}
                  onChange={(e) => setVenueAddressText(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 font-semibold text-gray-700 bg-gray-50/30 resize-none"
                  placeholder="Venue Full Address"
                />
              </div>

              {/* Extra customizable template fields */}
              <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Google Maps Link</label>
                  <input
                    type="text"
                    value={googleMapsLink}
                    onChange={(e) => setGoogleMapsLink(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 font-semibold text-gray-700 bg-gray-50/30"
                    placeholder="Google Maps URL"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Calendar Link</label>
                  <input
                    type="text"
                    value={calendarLink}
                    onChange={(e) => setCalendarLink(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 font-semibold text-gray-700 bg-gray-50/30"
                    placeholder="Add to Calendar URL"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Parking Details</label>
                  <input
                    type="text"
                    value={parkingDetails}
                    onChange={(e) => setParkingDetails(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 font-semibold text-gray-700 bg-gray-50/30"
                    placeholder="E.g., Free Parking"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Dress Code</label>
                  <input
                    type="text"
                    value={dressCode}
                    onChange={(e) => setDressCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 font-semibold text-gray-700 bg-gray-50/30"
                    placeholder="E.g., Traditional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">RSVP By Date</label>
                  <input
                    type="text"
                    value={rsvpDate}
                    onChange={(e) => setRsvpDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 font-semibold text-gray-700 bg-gray-50/30"
                    placeholder="RSVP Deadline"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Special Instructions</label>
                  <input
                    type="text"
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500 font-semibold text-gray-700 bg-gray-50/30"
                    placeholder="E.g., RSVP details..."
                  />
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsOpen(false)}
                disabled={loading}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleDownload}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 hover:bg-gray-950 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {loading ? 'Processing...' : 'Download PDF'}
              </button>

              <button
                onClick={handleShare}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                <Share2 className="w-3.5 h-3.5" />
                {loading ? 'Processing...' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

