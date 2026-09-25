import toast from 'react-hot-toast';

/**
 * High-reliability image loader using Next.js server proxy first,
 * then Blob fetch, then HTML Image Canvas fallback.
 * Guarantees zero CORS failures for AWS S3, Cloudinary, and external images.
 */
async function loadImgDataUrl(url, timeoutMs = 8000) {
  if (!url) return null;

  // If already base64 data URL
  if (typeof url === 'string' && url.startsWith('data:image')) {
    const format = url.includes('image/png') ? 'PNG' : 'JPEG';
    return { dataUrl: url, format, width: 400, height: 300 };
  }

  // Handle relative URLs like /logo.png
  let fullUrl = url;
  if (typeof url === 'string' && url.startsWith('/')) {
    if (typeof window !== 'undefined') {
      fullUrl = window.location.origin + url;
    }
  }

  // Method 1: Use server-side proxy route to bypass all CORS restrictions
  if (typeof window !== 'undefined' && fullUrl.startsWith('http')) {
    try {
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(fullUrl)}`;
      const proxyRes = await fetch(proxyUrl);
      if (proxyRes.ok) {
        const json = await proxyRes.json();
        if (json.success && json.dataUrl) {
          const format = json.contentType?.includes('png') ? 'PNG' : 'JPEG';
          // Calculate image dimensions
          const dimensions = await new Promise((resolve) => {
            const tempImg = new Image();
            tempImg.onload = () => resolve({ width: tempImg.width, height: tempImg.height });
            tempImg.onerror = () => resolve({ width: 400, height: 300 });
            tempImg.src = json.dataUrl;
          });
          return {
            dataUrl: json.dataUrl,
            format,
            width: dimensions.width,
            height: dimensions.height
          };
        }
      }
    } catch (err) {
      // Fallback to direct fetch
    }
  }

  // Method 2: Direct Blob fetch
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(fullUrl, { mode: 'cors', signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const blob = await res.blob();
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const format = blob.type.includes('png') ? 'PNG' : 'JPEG';
      const dimensions = await new Promise((resolve) => {
        const tempImg = new Image();
        tempImg.onload = () => resolve({ width: tempImg.width, height: tempImg.height });
        tempImg.onerror = () => resolve({ width: 400, height: 300 });
        tempImg.src = dataUrl;
      });
      return { dataUrl, format, width: dimensions.width, height: dimensions.height };
    }
  } catch (e) {
    // Fallback to canvas
  }

  // Method 3: HTML Image + Canvas
  return new Promise((resolve) => {
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    }, timeoutMs);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      try {
        const c = document.createElement('canvas');
        const maxDim = 800;
        let w = img.width || 400;
        let h = img.height || 300;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        c.width = w;
        c.height = h;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve({
          dataUrl: c.toDataURL('image/jpeg', 0.85),
          format: 'JPEG',
          width: w,
          height: h
        });
      } catch (err) {
        resolve(null);
      }
    };
    img.onerror = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      resolve(null);
    };
    img.src = fullUrl;
  });
}

/**
 * Generate and download a complete section-wise PDF for a Venue.
 * Formats all currencies cleanly with "Rs. " for 100% font compatibility in jsPDF.
 * @param {Object} venue Venue object from database
 * @param {Object} platformSettings Optional platform settings
 */
export async function downloadVenuePDF(venue, platformSettings = null) {
  if (!venue) {
    toast.error('Venue details not available');
    return;
  }

  const toastId = toast.loading('Generating complete Venue Dossier PDF (including all photos)...');

  try {
    const { default: jsPDF } = await import('jspdf');

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const PAGE_W = 210;
    const PAGE_H = 297;
    const M = 12; // Margin
    const CW = PAGE_W - M * 2; // 186mm content width
    const BOTTOM_LIMIT = PAGE_H - 14;

    let y = M;
    let pageNum = 1;

    // ── Helper functions ──
    const setFont = (style = 'normal', size = 9, color = [31, 41, 55]) => {
      doc.setFont('helvetica', style);
      doc.setFontSize(size);
      doc.setTextColor(color[0], color[1], color[2]);
    };

    const drawLine = (x1, y1, x2, y2, color = [226, 232, 240], lineWidth = 0.25) => {
      doc.setDrawColor(color[0], color[1], color[2]);
      doc.setLineWidth(lineWidth);
      doc.line(x1, y1, x2, y2);
    };

    const drawCard = (x, yPos, w, h, fill = [255, 255, 255], border = [226, 232, 240], radius = 1.5) => {
      if (fill) doc.setFillColor(fill[0], fill[1], fill[2]);
      if (border) doc.setDrawColor(border[0], border[1], border[2]);
      doc.setLineWidth(0.2);
      doc.roundedRect(x, yPos, w, h, radius, radius, fill ? (border ? 'FD' : 'F') : 'S');
    };

    const drawBadge = (x, yPos, text, bg = [241, 245, 249], textCol = [71, 85, 105]) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      const str = String(text || '');
      const strW = doc.getTextWidth(str);
      const badgeW = strW + 6;
      const badgeH = 4.5;
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.roundedRect(x, yPos - 3.2, badgeW, badgeH, 1, 1, 'F');
      doc.setTextColor(textCol[0], textCol[1], textCol[2]);
      doc.text(str, x + 3, yPos);
      return badgeW;
    };

    const renderFooter = (pNum) => {
      doc.saveGraphicsState();
      setFont('normal', 7, [148, 163, 184]);
      drawLine(M, PAGE_H - 9, PAGE_W - M, PAGE_H - 9, [226, 232, 240], 0.2);
      doc.text('RentalMeet Official Venue Dossier — Confidential & Verified Record', M, PAGE_H - 5.5);
      const rightText = `Page ${pNum} | ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
      doc.text(rightText, PAGE_W - M, PAGE_H - 5.5, { align: 'right' });
      doc.restoreGraphicsState();
    };

    const checkPageBreak = (neededHeight) => {
      if (y + neededHeight > BOTTOM_LIMIT) {
        renderFooter(pageNum);
        doc.addPage();
        pageNum++;
        y = M + 4;
        renderRunningHeader();
      }
    };

    const renderRunningHeader = () => {
      doc.saveGraphicsState();
      setFont('bold', 8, [249, 115, 22]);
      doc.text('RentalMeet', M, y);
      setFont('normal', 7.5, [100, 116, 139]);
      doc.text(` — Venue Dossier: ${venue.businessName || 'Venue'} (${venue.sku || 'N/A'})`, M + 18, y);
      drawLine(M, y + 2, PAGE_W - M, y + 2, [241, 245, 249], 0.2);
      y += 6;
      doc.restoreGraphicsState();
    };

    const renderSectionHeader = (title, accentColor = [249, 115, 22]) => {
      checkPageBreak(12);
      drawCard(M, y, CW, 7, [248, 250, 252], [226, 232, 240], 1.5);
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(M, y, 2.5, 7, 'F');

      setFont('bold', 8.5, [15, 23, 42]);
      doc.text(title.toUpperCase(), M + 5.5, y + 4.6);
      y += 9.5;
    };

    const renderKVGrid = (items, cols = 3, cardBg = [255, 255, 255], borderCol = [241, 245, 249]) => {
      const colW = (CW - (cols - 1) * 2.5) / cols;
      const rowHeight = 11.5;
      const numRows = Math.ceil(items.length / cols);
      const totalH = numRows * (rowHeight + 2);

      checkPageBreak(totalH + 2);

      items.forEach((item, index) => {
        const colIndex = index % cols;
        const rowIndex = Math.floor(index / cols);
        const itemX = M + colIndex * (colW + 2.5);
        const itemY = y + rowIndex * (rowHeight + 2);

        drawCard(itemX, itemY, colW, rowHeight, cardBg, borderCol, 1.5);

        setFont('bold', 6.8, [100, 116, 139]);
        const lbl = String(item.label || '').toUpperCase();
        doc.text(lbl, itemX + 2.5, itemY + 3.8);

        setFont(item.bold ? 'bold' : 'normal', 8, item.color || [15, 23, 42]);
        const val = String(item.value ?? 'N/A');
        const truncated = doc.splitTextToSize(val, colW - 5)[0] || 'N/A';
        doc.text(truncated, itemX + 2.5, itemY + 8.2);
      });

      y += totalH + 1.5;
    };

    // ── Pre-fetch all Images in parallel via Proxy (Logo, ALL Gallery Photos, Document Proofs) ──
    let logoData = await loadImgDataUrl('/logo.png');
    if (!logoData) logoData = await loadImgDataUrl('/logo-pdf.jpg');
    if (!logoData) logoData = await loadImgDataUrl('/logo-new.jpeg');
    if (!logoData) logoData = await loadImgDataUrl('/logo.jpeg');

    const [selfieData, aadhaarFrontData, aadhaarBackData, panData, businessProofData, bankProofData, gstCertData] = await Promise.all([
      loadImgDataUrl(venue.documents?.selfieUrl || venue.ownerInfo?.selfieUrl),
      loadImgDataUrl(venue.documents?.idProof?.aadhaarFrontUrl || venue.documents?.idProof?.frontUrl),
      loadImgDataUrl(venue.documents?.idProof?.aadhaarBackUrl || venue.documents?.idProof?.backUrl),
      loadImgDataUrl(venue.documents?.idProof?.panUrl),
      loadImgDataUrl(venue.documents?.businessProof?.documentUrl || venue.documents?.businessProof?.url),
      loadImgDataUrl(venue.bankDetails?.bankProofUrl),
      loadImgDataUrl(venue.documents?.gstDocUrl || venue.ownerInfo?.gstCertificateUrl)
    ]);

    // Fetch ALL gallery photos (no limit - includes every single uploaded image!)
    const rawImages = Array.isArray(venue.images) ? venue.images : [];
    const galleryBase64List = await Promise.all(
      rawImages.map(async (imgObj) => {
        const imgUrl = typeof imgObj === 'string' ? imgObj : imgObj?.url;
        const b64 = await loadImgDataUrl(imgUrl);
        return {
          category: typeof imgObj === 'object' ? imgObj.category : 'Venue',
          isFeatured: typeof imgObj === 'object' ? imgObj.isFeatured : false,
          base64: b64,
          url: imgUrl
        };
      })
    );

    // =========================================================================
    // PAGE 1: COVER HEADER & SUMMARY BANNER
    // =========================================================================

    // Top Header Box (Clean 26mm height)
    drawCard(M, y, CW, 26, [255, 255, 255], [226, 232, 240], 2);

    // Render Logo with exact aspect ratio preservation
    if (logoData?.dataUrl) {
      try {
        const logoAspect = (logoData.width && logoData.height) ? (logoData.width / logoData.height) : 3.5;
        const maxH = 14;
        const maxW = 55;
        let lW = maxH * logoAspect;
        let lH = maxH;
        if (lW > maxW) {
          lW = maxW;
          lH = lW / logoAspect;
        }
        const logoOffsetY = y + 2.5 + (maxH - lH) / 2;
        doc.addImage(logoData.dataUrl, logoData.format || 'PNG', M + 3.5, logoOffsetY, lW, lH);
      } catch (e) {
        setFont('bold', 15, [249, 115, 22]);
        doc.text('RentalMeet', M + 4, y + 10);
      }
    } else {
      setFont('bold', 15, [249, 115, 22]);
      doc.text('RentalMeet', M + 4, y + 10);
    }
    setFont('normal', 7, [100, 116, 139]);
    doc.text("India's Premier Venue & Event Ecosystem", M + 3.5, y + 21.5);

    // Right side dossier details
    setFont('bold', 11, [15, 23, 42]);
    doc.text('VENUE VERIFICATION DOSSIER', PAGE_W - M - 3, y + 7, { align: 'right' });
    setFont('normal', 7.5, [100, 116, 139]);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, PAGE_W - M - 3, y + 12, { align: 'right' });
    doc.text(`Venue SKU: ${venue.sku || 'N/A'}`, PAGE_W - M - 3, y + 17, { align: 'right' });
    doc.text(`Internal ID: ${venue._id || 'N/A'}`, PAGE_W - M - 3, y + 22, { align: 'right' });

    y += 29;

    // Venue Name & Status Card
    const status = String(venue.status || 'pending').toUpperCase();
    let statusBg = [241, 245, 249];
    let statusText = [71, 85, 105];
    if (status === 'APPROVED') {
      statusBg = [220, 252, 231];
      statusText = [22, 101, 52];
    } else if (status === 'PENDING') {
      statusBg = [254, 249, 195];
      statusText = [133, 77, 14];
    } else if (status === 'SUSPENDED' || status === 'REJECTED') {
      statusBg = [254, 226, 226];
      statusText = [153, 27, 27];
    } else if (status === 'RESUBMITTED') {
      statusBg = [219, 234, 254];
      statusText = [30, 64, 175];
    }

    drawCard(M, y, CW, 20, [248, 250, 252], [226, 232, 240], 2);
    setFont('bold', 13, [15, 23, 42]);
    const nameStr = doc.splitTextToSize(venue.businessName || 'Unnamed Venue', CW - 55)[0];
    doc.text(nameStr, M + 4, y + 7.5);

    // Status Badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    const statusTextWidth = doc.getTextWidth(status) + 6;
    drawBadge(PAGE_W - M - statusTextWidth - 3, y + 7, status, statusBg, statusText);

    // Subtitle line (Types, Area, Capacity, Food)
    setFont('normal', 8, [71, 85, 105]);
    const venueTypesStr = Array.isArray(venue.venueType) ? venue.venueType.join(', ') : (venue.venueType || 'Meeting Hall');
    doc.text(`Type: ${venueTypesStr}  |  Capacity: ${venue.capacity || 'N/A'} Guests  |  Area: ${venue.areaSqft || 'N/A'} sq.ft  |  Food: ${venue.foodType || 'Veg'}`, M + 4, y + 14.5);

    y += 23;

    // =========================================================================
    // SECTION 1: BASIC INFORMATION & OVERVIEW
    // =========================================================================
    renderSectionHeader('1. Basic Information & Overview', [249, 115, 22]);

    const basicItems = [
      { label: 'Business Name', value: venue.businessName, bold: true },
      { label: 'Status', value: venue.status?.toUpperCase(), color: statusText, bold: true },
      { label: 'Venue Type', value: venueTypesStr },
      { label: 'Food Preference', value: venue.foodType || 'Pure Veg' },
      { label: 'Guest Capacity', value: `${venue.capacity || 'N/A'} guests` },
      { label: 'Total Area', value: `${venue.areaSqft || 'N/A'} sq.ft` },
      { label: 'Total Bookings', value: venue.totalBookings || 0 },
      { label: 'Star Rating', value: venue.rating ? `* ${venue.rating.toFixed(1)} (${venue.reviewCount || 0} reviews)` : 'Not Rated' },
      { label: 'Listing Source', value: venue.listingSource ? venue.listingSource.toUpperCase() : (venue.ambassador ? 'AMBASSADOR' : 'DIRECT OWNER') }
    ];
    renderKVGrid(basicItems, 3);

    // Venue Description
    if (venue.description) {
      checkPageBreak(18);
      drawCard(M, y, CW, 15, [255, 255, 255], [241, 245, 249], 1.5);
      setFont('bold', 6.8, [100, 116, 139]);
      doc.text('VENUE DESCRIPTION', M + 2.5, y + 3.8);
      setFont('normal', 7.5, [51, 65, 85]);
      const descLines = doc.splitTextToSize(venue.description, CW - 6);
      doc.text(descLines.slice(0, 3), M + 2.5, y + 7.5);
      y += 17;
    }

    // Suspension / Rejection Notice
    if ((venue.rejectionReason || venue.suspensionReason) && (venue.status === 'rejected' || venue.status === 'suspended' || venue.status === 'resubmitted')) {
      checkPageBreak(13);
      drawCard(M, y, CW, 11, [254, 242, 242], [252, 165, 165], 1.5);
      setFont('bold', 7.5, [153, 27, 27]);
      doc.text(`Notice / Action Reason: ${venue.rejectionReason || venue.suspensionReason}`, M + 3, y + 6.5);
      y += 13.5;
    }

    // =========================================================================
    // SECTION 2: LOCATION, TRANSIT & PARKING
    // =========================================================================
    renderSectionHeader('2. Location, Transit & Parking Facilities', [14, 165, 233]);

    const locationItems = [
      { label: 'Complete Address', value: venue.location?.address || 'N/A' },
      { label: 'Landmark', value: venue.location?.landmark || 'N/A' },
      { label: 'Area / Locality', value: venue.location?.area || 'N/A' },
      { label: 'City', value: venue.location?.city || 'N/A', bold: true },
      { label: 'State', value: venue.location?.state || 'N/A' },
      { label: 'Pincode', value: venue.location?.pincode || 'N/A' },
      { label: 'Parking Facility', value: `${venue.location?.parkingAvailability || venue.location?.parkingType || 'Free'} Parking`, bold: true },
      { label: 'Nearest Metro / Train', value: venue.location?.nearestMetro || venue.location?.nearestMetroTrain || 'Not specified' },
      { label: 'Nearest Bus / Auto Stand', value: venue.location?.nearestBusStop || venue.location?.nearestBusAuto || 'Not specified' },
      { label: 'Nearest Railway Station', value: venue.location?.nearestRailway || 'Not specified' },
      { label: 'Village (if any)', value: venue.location?.village || 'N/A' },
      { label: 'Google Maps Link', value: venue.location?.googleMapLink ? 'Available on portal' : 'N/A' }
    ];
    renderKVGrid(locationItems, 3);

    // =========================================================================
    // SECTION 3: AMENITIES, FOOD & REFRESHMENTS
    // =========================================================================
    renderSectionHeader('3. Amenities, Food & Refreshments', [234, 88, 12]);

    // Basic Amenities list
    const basicList = (venue.amenities?.basic || []).map(a =>
      typeof a === 'string' ? { name: a, type: 'Included', rate: null } : a
    ).filter(a => a && a.available !== false);

    if (basicList.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);

      const badgeItems = basicList.map(amenity => {
        const rateStr = (amenity.type === 'Paid' && amenity.rate) ? ` (Rs. ${amenity.rate})` : ` (${amenity.type || 'Included'})`;
        const text = `${amenity.name}${rateStr}`;
        const bw = doc.getTextWidth(text) + 6;
        const isPaid = amenity.type === 'Paid';
        return {
          text,
          bw,
          bg: isPaid ? [255, 237, 213] : [240, 253, 244],
          fg: isPaid ? [194, 65, 12] : [21, 128, 61]
        };
      });

      const maxLineWidth = CW - 5;
      const lines = [];
      let currentLine = [];
      let currentLineWidth = 0;

      badgeItems.forEach(item => {
        const itemNeededWidth = (currentLine.length === 0 ? 0 : 2) + item.bw;
        if (currentLine.length > 0 && (currentLineWidth + itemNeededWidth > maxLineWidth)) {
          lines.push(currentLine);
          currentLine = [item];
          currentLineWidth = item.bw;
        } else {
          currentLine.push(item);
          currentLineWidth += itemNeededWidth;
        }
      });
      if (currentLine.length > 0) lines.push(currentLine);

      const cardH = Math.max(14, 6.5 + lines.length * 5.8 + 1.5);
      checkPageBreak(cardH + 2);

      drawCard(M, y, CW, cardH, [255, 255, 255], [241, 245, 249], 1.5);
      setFont('bold', 7, [100, 116, 139]);
      doc.text('BASIC AMENITIES & INCLUSIONS', M + 2.5, y + 3.8);

      let lineY = y + 8.2;
      lines.forEach(line => {
        let curX = M + 2.5;
        line.forEach(item => {
          drawBadge(curX, lineY, item.text, item.bg, item.fg);
          curX += item.bw + 2;
        });
        lineY += 5.8;
      });

      y += cardH + 2.5;
    }

    // Food, Beverages & Kitchen Summary
    const bevCount = (venue.amenities?.beverages || []).filter(b => b.available).length;
    const foodCount = (venue.amenities?.refreshmentFood || []).filter(f => f.available).length;
    const thaliCount = (venue.amenities?.lunchThalis || []).filter(t => t.available !== false).length;

    const foodItems = [
      { label: 'Beverages Options', value: bevCount > 0 ? `${bevCount} Beverage Items Configured` : 'None / Not Provided' },
      { label: 'Refreshments & Snacks', value: foodCount > 0 ? `${foodCount} Snacks & Refreshments` : 'None / Not Provided' },
      { label: 'Lunch / Dinner Thalis', value: thaliCount > 0 ? `${thaliCount} Thali Varieties Configured` : 'None / Not Provided' },
      { label: 'Kitchen Access', value: venue.amenities?.kitchenAccess?.available ? `${venue.amenities.kitchenAccess.type || 'Available'} ${venue.amenities.kitchenAccess.charges ? `(Rs. ${venue.amenities.kitchenAccess.charges})` : ''}` : 'No Access' },
      { label: 'Dining Hall Area', value: venue.amenities?.diningArea?.available ? `${venue.amenities.diningArea.type || 'Available'} ${venue.amenities.diningArea.charges ? `(Rs. ${venue.amenities.diningArea.charges})` : ''}` : 'Not Available' },
      { label: 'Additional Safety & CCTV', value: (venue.amenities?.additional || []).length > 0 ? `${venue.amenities.additional.length} Safety Amenities` : 'Standard' }
    ];
    renderKVGrid(foodItems, 3);

    // =========================================================================
    // SECTION 4: PRICING, OPERATING TIMINGS & RULES
    // =========================================================================
    renderSectionHeader('4. Pricing, Operating Timings & Booking Rules', [16, 185, 129]);

    const p = venue.pricing || {};
    const avail = venue.availability || {};

    const pricingItems = [
      { label: 'Per Hour (Weekday)', value: p.perHour?.weekday ? `Rs. ${p.perHour.weekday} / hr` : 'N/A', bold: true, color: [2, 132, 199] },
      { label: 'Per Hour (Weekend)', value: p.perHour?.weekend ? `Rs. ${p.perHour.weekend} / hr` : 'N/A', bold: true, color: [2, 132, 199] },
      { label: 'Half Day (4 hrs Weekday)', value: p.halfDay?.weekday ? `Rs. ${p.halfDay.weekday}` : 'N/A' },
      { label: 'Half Day (4 hrs Weekend)', value: p.halfDay?.weekend ? `Rs. ${p.halfDay.weekend}` : 'N/A' },
      { label: 'Full Day (Weekday)', value: p.fullDay?.weekday ? `Rs. ${p.fullDay.weekday}` : 'N/A', bold: true, color: [16, 185, 129] },
      { label: 'Full Day (Weekend)', value: p.fullDay?.weekend ? `Rs. ${p.fullDay.weekend}` : 'N/A', bold: true, color: [16, 185, 129] },
      { label: 'Extra Hour Overtime', value: p.extraHourRate?.weekday ? `Rs. ${p.extraHourRate.weekday}/hr (Wkday) | Rs. ${p.extraHourRate.weekend}/hr (Wkend)` : 'Standard' },
      { label: 'Operating Timings', value: `${avail.openingTime || p.openingTime || '09:00'} to ${avail.closingTime || p.closingTime || '22:00'}` },
      { label: 'Online Booking Window', value: `${avail.onlineBookingSchedule?.openingTime || p.onlineBookingSchedule?.openingTime || '06:00'} to ${avail.onlineBookingSchedule?.closingTime || p.onlineBookingSchedule?.closingTime || '02:00'}` },
      { label: 'Advance Booking Rule', value: avail.advanceBookingRule || p.advanceBookingRule || '1 Day Prior' },
      { label: 'Confirmation Time Limit', value: `${avail.confirmationHours ?? p.confirmationHours ?? 3} Hours` },
      { label: 'Available Days', value: (avail.availableDays || p.availableDays || ['All 7 Days']).join(', ') }
    ];
    renderKVGrid(pricingItems, 3);

    // =========================================================================
    // SECTION 5: VENUE PHOTOGRAPHS & FULL GALLERY (ALL PHOTOS)
    // =========================================================================
    renderSectionHeader('5. Venue Photographs & Gallery', [147, 51, 234]);

    if (galleryBase64List.length > 0) {
      const photosPerRow = 4;
      const photoW = (CW - (photosPerRow - 1) * 3) / photosPerRow;
      const photoH = 32;

      checkPageBreak(photoH + 12);

      let colIdx = 0;

      galleryBase64List.forEach((imgObj) => {
        if (colIdx >= photosPerRow) {
          colIdx = 0;
          y += photoH + 4;
          checkPageBreak(photoH + 10);
        }

        const imgX = M + colIdx * (photoW + 3);

        // Frame card
        drawCard(imgX, y, photoW, photoH, [248, 250, 252], [226, 232, 240], 1.5);

        if (imgObj.base64?.dataUrl) {
          try {
            doc.addImage(imgObj.base64.dataUrl, imgObj.base64.format || 'JPEG', imgX + 1, y + 1, photoW - 2, photoH - 7);
          } catch (e) {
            setFont('normal', 7, [148, 163, 184]);
            doc.text('Photo Available', imgX + photoW / 2, y + photoH / 2, { align: 'center' });
          }
        } else {
          setFont('normal', 7, [148, 163, 184]);
          doc.text('Photo Available', imgX + photoW / 2, y + photoH / 2, { align: 'center' });
        }

        // Category Tag at bottom
        setFont('bold', 6.5, [71, 85, 105]);
        const catText = `${imgObj.category || 'Venue'}${imgObj.isFeatured ? ' *' : ''}`;
        doc.text(catText, imgX + photoW / 2, y + photoH - 2, { align: 'center' });

        colIdx++;
      });

      y += photoH + 6;
    } else {
      checkPageBreak(10);
      drawCard(M, y, CW, 9, [255, 255, 255], [241, 245, 249], 1.5);
      setFont('normal', 7.5, [148, 163, 184]);
      doc.text('No gallery photos uploaded for this venue.', M + 4, y + 5.5);
      y += 11;
    }

    // =========================================================================
    // SECTION 6: OWNER & BOOKING AUTHORISED PERSON DETAILS
    // =========================================================================
    renderSectionHeader('6. Owner & Booking Authorised Person Details', [59, 130, 246]);

    const ownerInfo = venue.ownerInfo || {};
    const authPerson = ownerInfo.authorisedPerson || {};
    const ownerObj = venue.owner || {};

    const ownerItems = [
      { label: 'Owner Full Name', value: ownerInfo.fullName || ownerObj.name || 'N/A', bold: true },
      { label: 'Owner Mobile', value: ownerInfo.mobile || ownerObj.phone || 'N/A', bold: true },
      { label: 'Owner Email', value: ownerInfo.email || ownerObj.email || 'N/A' },
      { label: 'Owner Alternate Phone', value: ownerInfo.alternatePhone || 'None' },
      { label: 'GST Registration', value: ownerInfo.hasGST || venue.documents?.hasGST ? `Yes (${ownerInfo.gstNumber || venue.documents?.gstNumber || 'Provided'})` : 'No GST' },
      { label: 'Associated User ID', value: venue.owner?._id || venue.owner || 'N/A' },

      { label: 'Authorised Person Name', value: authPerson.fullName || authPerson.name || ownerInfo.fullName || 'Same as Owner', bold: true },
      { label: 'Designation / Role', value: authPerson.designation || authPerson.role || 'Proprietor / Manager', bold: true },
      { label: 'Authorised Mobile', value: authPerson.mobile || authPerson.phone || ownerInfo.mobile || 'N/A' },
      { label: 'Authorised Alternate Mobile', value: authPerson.alternatePhone || 'None' },
      { label: 'Authorised Email', value: authPerson.email || ownerInfo.email || 'N/A' },
      { label: 'Verification Role', value: 'Primary Booking Coordinator' }
    ];
    renderKVGrid(ownerItems, 3);

    // =========================================================================
    // SECTION 7: DOCUMENTS, KYC & VERIFICATION PROOFS (WITH IMAGES)
    // =========================================================================
    renderSectionHeader('7. Verification Documents & Identity Proofs', [16, 185, 129]);

    const docProof = venue.documents || {};
    const idProof = docProof.idProof || {};

    const docKV = [
      { label: 'Aadhaar Card Number', value: idProof.aadhaarNumber || idProof.number || 'Not Provided', bold: true },
      { label: 'PAN Card Number', value: idProof.panNumber || 'Not Provided', bold: true },
      { label: 'Business Proof Type', value: docProof.businessProof?.type || 'Not Specified' },
      { label: 'Business Proof Specified', value: docProof.businessProof?.otherSpecify || 'Standard' },
      { label: 'Fire NOC Certificate', value: docProof.fireNOC?.url ? 'Uploaded / Verified' : 'Not Provided' },
      { label: 'FSSAI License / Certificate', value: docProof.fssai?.url ? 'Uploaded / Verified' : 'Not Provided' }
    ];
    renderKVGrid(docKV, 3);

    // Document Thumbnails Preview (Aadhaar Front/Back, PAN, Live Selfie, Business Proof, Bank Proof)
    const docThumbs = [
      { title: 'Aadhaar Front', img: aadhaarFrontData },
      { title: 'Aadhaar Back', img: aadhaarBackData },
      { title: 'PAN Card', img: panData },
      { title: 'Live Selfie Proof', img: selfieData },
      { title: 'Business Proof', img: businessProofData },
      { title: 'Bank Proof Document', img: bankProofData },
      { title: 'GST Certificate', img: gstCertData }
    ].filter(dt => dt.img !== null);

    if (docThumbs.length > 0) {
      checkPageBreak(38);
      const thCols = Math.min(docThumbs.length, 4);
      const thumbW = (CW - (thCols - 1) * 3) / thCols;
      const thumbH = 30;

      let cIdx = 0;
      docThumbs.forEach((dt) => {
        if (cIdx >= thCols) {
          cIdx = 0;
          y += thumbH + 4;
          checkPageBreak(thumbH + 8);
        }

        const thX = M + cIdx * (thumbW + 3);
        drawCard(thX, y, thumbW, thumbH, [248, 250, 252], [226, 232, 240], 1.5);

        if (dt.img?.dataUrl) {
          try {
            doc.addImage(dt.img.dataUrl, dt.img.format || 'JPEG', thX + 1, y + 1, thumbW - 2, thumbH - 7);
          } catch (e) {
            setFont('normal', 7, [148, 163, 184]);
            doc.text('Document Attached', thX + thumbW / 2, y + thumbH / 2, { align: 'center' });
          }
        } else {
          setFont('normal', 7, [148, 163, 184]);
          doc.text('Attached', thX + thumbW / 2, y + thumbH / 2, { align: 'center' });
        }

        setFont('bold', 6.5, [71, 85, 105]);
        doc.text(dt.title, thX + thumbW / 2, y + thumbH - 2, { align: 'center' });
        cIdx++;
      });

      y += thumbH + 6;
    }

    // =========================================================================
    // SECTION 8: BANK ACCOUNT & PAYOUT DETAILS
    // =========================================================================
    renderSectionHeader('8. Bank Account & Payout Details', [13, 148, 136]);

    const bank = venue.bankDetails || {};
    const bankItems = [
      { label: 'Account Holder Name', value: bank.accountHolderName || 'N/A', bold: true },
      { label: 'Account Type', value: `${bank.accountType || 'Current'} Account`, bold: true },
      { label: 'Bank Name', value: bank.bankName || 'N/A', bold: true },
      { label: 'Branch Name', value: bank.branchName || 'N/A' },
      { label: 'IFSC Code', value: bank.ifscCode || 'N/A', bold: true, color: [13, 148, 136] },
      { label: 'Account Number', value: bank.accountNumber || 'N/A', bold: true, color: [15, 23, 42] },
      { label: 'UPI ID (if any)', value: bank.upiId || 'N/A' },
      { label: 'Bank Proof Document', value: bank.bankProofUrl ? 'Attached / Verified' : 'Not Provided' },
      { label: 'Payout Processing Mode', value: 'Direct NEFT / RTGS / UPI' }
    ];
    renderKVGrid(bankItems, 3);

    // =========================================================================
    // SECTION 9: CUSTOM COMMISSIONS & PLATFORM SETTINGS (IF CONFIGURED)
    // =========================================================================
    if (venue.customGST?.enabled || venue.customPlatformFee?.enabled) {
      renderSectionHeader('9. Custom GST & Commission Settings', [99, 102, 241]);

      const customItems = [];
      if (venue.customGST?.enabled) {
        customItems.push({ label: 'Custom Venue GST', value: `CGST ${venue.customGST.cgstRate}% + SGST ${venue.customGST.sgstRate}% (HSN ${venue.customGST.hsnCode || '9973'})`, bold: true });
      }
      if (venue.customPlatformFee?.enabled) {
        const feeLabel = venue.customPlatformFee.feeType === 'fixed' ? `Rs. ${venue.customPlatformFee.feeValue} Fixed` : `${venue.customPlatformFee.feeValue}%`;
        customItems.push({ label: 'Custom Platform Fee', value: `${feeLabel} (CGST ${venue.customPlatformFee.platformCGSTRate}% + SGST ${venue.customPlatformFee.platformSGSTRate}%)`, bold: true });
      }
      renderKVGrid(customItems, 2);
    }

    // =========================================================================
    // SECTION 10: TERMS, COMPLIANCE & TIMELINE
    // =========================================================================
    renderSectionHeader('10. Terms, Compliance & Timeline', [100, 116, 139]);

    const timeline = venue.verificationTimeline || {};
    const complianceItems = [
      { label: 'Terms & Conditions Accepted', value: venue.termsAccepted ? 'Yes (Accepted on Registration)' : 'Not Accepted', bold: true },
      { label: 'Accepted Date', value: venue.termsAcceptedDate ? new Date(venue.termsAcceptedDate).toLocaleDateString('en-IN') : 'N/A' },
      { label: 'Application Review Date', value: timeline.applicationReview ? new Date(timeline.applicationReview).toLocaleDateString('en-IN') : 'Completed' },
      { label: 'Document Verification', value: timeline.documentVerification ? new Date(timeline.documentVerification).toLocaleDateString('en-IN') : 'Completed' },
      { label: 'Listing Activation Date', value: timeline.listingActivation ? new Date(timeline.listingActivation).toLocaleDateString('en-IN') : (venue.ambassadorListingApprovedAt ? new Date(venue.ambassadorListingApprovedAt).toLocaleDateString('en-IN') : 'Active') },
      { label: 'Active Status', value: venue.isActive !== false ? 'Active & Listed' : 'Temporarily Disabled', bold: true }
    ];
    renderKVGrid(complianceItems, 3);

    // =========================================================================
    // OFFICIAL DECLARATION / SIGN-OFF BLOCK
    // =========================================================================
    checkPageBreak(24);
    drawCard(M, y, CW, 20, [250, 250, 250], [226, 232, 240], 2);
    setFont('bold', 7.5, [15, 23, 42]);
    doc.text('OFFICIAL VERIFICATION DECLARATION', M + 3, y + 4.5);
    setFont('normal', 6.8, [100, 116, 139]);
    const declText = 'This document is generated directly from the RentalMeet Venue Management Database. All information, documents, photographs, and identity proofs presented herein have been submitted during venue onboarding and verification. Any unauthorized duplication or tampering is strictly prohibited.';
    const declLines = doc.splitTextToSize(declText, CW - 6);
    doc.text(declLines, M + 3, y + 8.5);

    setFont('bold', 7, [249, 115, 22]);
    doc.text(`Record ID: ${venue._id} | RentalMeet Operations & Compliance`, M + 3, y + 17.5);

    y += 24;

    // Render footer on the last page
    renderFooter(pageNum);

    // Save and download PDF
    const cleanFileName = `Venue-Dossier-${(venue.businessName || 'Venue').replace(/[^a-zA-Z0-9-_]/g, '-')}-${venue.sku || venue._id}.pdf`;
    doc.save(cleanFileName);

    toast.success('Venue PDF downloaded successfully!', { id: toastId });
  } catch (error) {
    console.error('Failed to generate Venue PDF:', error);
    toast.error('Failed to generate Venue PDF. Please try again.', { id: toastId });
  }
}
