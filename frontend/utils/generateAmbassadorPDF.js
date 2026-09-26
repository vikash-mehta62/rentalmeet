// frontend/utils/generateAmbassadorPDF.js
import toast from 'react-hot-toast';

/**
 * High-reliability image loader using Next.js server proxy first,
 * then Blob fetch, then HTML Image Canvas fallback.
 * Guarantees zero CORS failures for local assets, S3, Cloudinary, etc.
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

  // Method 1: Use server-side proxy route
  if (typeof window !== 'undefined' && fullUrl.startsWith('http')) {
    try {
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(fullUrl)}`;
      const proxyRes = await fetch(proxyUrl);
      if (proxyRes.ok) {
        const json = await proxyRes.json();
        if (json.success && json.dataUrl) {
          const format = json.contentType?.includes('png') ? 'PNG' : 'JPEG';
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
    } catch {
      // Fallback
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
  } catch {
    // Fallback
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
      } catch {
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
 * Generate and download Official Ambassador Profile & Application Dossier PDF.
 * Styled exactly like Venue Dossier with Logo, clean typography, metadata, KYC images,
 * and complete table of Listed Venues with Names, SKUs, Cities & Statuses.
 * @param {Object} ambassador Ambassador Profile object from DB
 */
export async function generateAmbassadorPDF(ambassador) {
  if (!ambassador) {
    toast.error('Ambassador data not found');
    return;
  }

  const toastId = toast.loading('Generating Ambassador Profile Dossier PDF...');

  try {
    const { default: jsPDF } = await import('jspdf');

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const PAGE_W = 210;
    const PAGE_H = 297;
    const M = 12; // 12mm margins
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

    const renderFooter = (pNum) => {
      doc.saveGraphicsState();
      setFont('normal', 7, [148, 163, 184]);
      drawLine(M, PAGE_H - 9, PAGE_W - M, PAGE_H - 9, [226, 232, 240], 0.2);
      doc.text('RentalMeet Official Ambassador Dossier — Confidential & Verified Partner Record', M, PAGE_H - 5.5);
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

    const ambId = ambassador.ambassadorId || (ambassador.user?.phone ? `RMA${ambassador.user.phone.slice(-10)}` : 'RMA-PENDING');
    const fullName = ambassador.personalInfo?.fullName || ambassador.user?.name || ambassador.userId?.name || 'Ambassador Partner';

    const renderRunningHeader = () => {
      doc.saveGraphicsState();
      setFont('bold', 8, [249, 115, 22]);
      doc.text('RentalMeet', M, y);
      setFont('normal', 7.5, [100, 116, 139]);
      doc.text(` — Ambassador Dossier: ${fullName} (${ambId})`, M + 18, y);
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

    // ── Pre-fetch Logo & Documents ──
    let logoData = await loadImgDataUrl('/logo.png');
    if (!logoData) logoData = await loadImgDataUrl('/logo-pdf.jpg');
    if (!logoData) logoData = await loadImgDataUrl('/logo-new.jpeg');
    if (!logoData) logoData = await loadImgDataUrl('/logo.jpeg');

    const docs = ambassador.documents || {};
    const [photoData, aadhaarFrontData, aadhaarBackData, panData, bankProofData] = await Promise.all([
      loadImgDataUrl(docs.passportPhoto),
      loadImgDataUrl(docs.aadhaarFront || docs.identityProof),
      loadImgDataUrl(docs.aadhaarBack || docs.identityProofBack),
      loadImgDataUrl(docs.panCard),
      loadImgDataUrl(docs.bankProof)
    ]);

    // =========================================================================
    // PAGE 1: COVER HEADER & SUMMARY BANNER
    // =========================================================================

    // Top Header Box (Clean 26mm height)
    drawCard(M, y, CW, 26, [255, 255, 255], [226, 232, 240], 2);

    // Render Official Logo
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
      } catch {
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
    doc.text('AMBASSADOR VERIFICATION DOSSIER', PAGE_W - M - 3, y + 7, { align: 'right' });
    setFont('normal', 7.5, [100, 116, 139]);
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, PAGE_W - M - 3, y + 12, { align: 'right' });
    doc.text(`Ambassador ID: ${ambId}`, PAGE_W - M - 3, y + 17, { align: 'right' });
    doc.text(`Internal ID: ${ambassador._id || 'N/A'}`, PAGE_W - M - 3, y + 22, { align: 'right' });

    y += 29;

    // Ambassador Name & Status Card
    const appStatus = String(ambassador.applicationStatus || ambassador.status || 'pending').toUpperCase();
    let statusBg = [241, 245, 249];
    let statusText = [71, 85, 105];
    if (appStatus === 'APPROVED') {
      statusBg = [220, 252, 231];
      statusText = [22, 101, 52];
    } else if (appStatus === 'REJECTED') {
      statusBg = [254, 226, 226];
      statusText = [153, 27, 27];
    } else if (appStatus === 'PENDING') {
      statusBg = [254, 243, 199];
      statusText = [180, 83, 9];
    }

    drawCard(M, y, CW, 19, [248, 250, 252], [226, 232, 240], 2);

    // Name & Tier
    setFont('bold', 12, [15, 23, 42]);
    doc.text(fullName, M + 4, y + 7);

    setFont('bold', 8, [249, 115, 22]);
    const tierBadge = `${ambassador.assignedLevel || ambassador.level || 'LV.1'} • ${ambassador.badge || 'Bronze Explorer'}`;
    doc.text(tierBadge, M + 4, y + 14);

    // Status Badges on right
    let curX = PAGE_W - M - 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);

    // Application Status Badge
    const stW = doc.getTextWidth(appStatus) + 6;
    doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
    doc.roundedRect(curX - stW, y + 4.5, stW, 5, 1, 1, 'F');
    doc.setTextColor(statusText[0], statusText[1], statusText[2]);
    doc.text(appStatus, curX - stW + 3, y + 8);

    // Activity Badge
    let actText = 'ACTIVE';
    let actBg = [220, 252, 231];
    let actCol = [22, 101, 52];

    const totalSubmittedVenues = ambassador.totalVenuesSubmitted || (Array.isArray(ambassador.venues) ? ambassador.venues.length : 0);

    if (ambassador.activityStatus === 'inactive_auto_blocked' || (!ambassador.isActive && totalSubmittedVenues === 0 && (ambassador.daysSinceApproval || 0) > 30)) {
      actText = 'INACTIVE (30D NO VENUE)';
      actBg = [254, 226, 226];
      actCol = [153, 27, 27];
    } else if (ambassador.isActive === false || ambassador.activityStatus === 'inactive_admin_blocked') {
      actText = 'BLOCKED';
      actBg = [254, 226, 226];
      actCol = [153, 27, 27];
    } else if (appStatus === 'APPROVED') {
      if (totalSubmittedVenues > 0) {
        actText = `ACTIVE (${totalSubmittedVenues} VENUES)`;
      } else {
        actText = `ACTIVE (${ambassador.daysRemaining !== undefined ? ambassador.daysRemaining : 30}D LEFT)`;
      }
    } else {
      actText = 'UNDER REVIEW';
      actBg = [254, 243, 199];
      actCol = [180, 83, 9];
    }

    const actW = doc.getTextWidth(actText) + 6;
    doc.setFillColor(actBg[0], actBg[1], actBg[2]);
    doc.roundedRect(curX - stW - actW - 3, y + 4.5, actW, 5, 1, 1, 'F');
    doc.setTextColor(actCol[0], actCol[1], actCol[2]);
    doc.text(actText, curX - stW - actW - 3 + 3, y + 8);

    y += 22;

    // ── APPLICATION & APPROVAL TIMELINE BANNER ──
    const appDateStr = ambassador.applicationDate || ambassador.createdAt
      ? new Date(ambassador.applicationDate || ambassador.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'N/A';
    const apprDateStr = ambassador.approvalDate || ambassador.verifiedAt
      ? new Date(ambassador.approvalDate || ambassador.verifiedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'Pending / Not Approved';

    renderKVGrid([
      { label: 'Application Date (Submitted)', value: appDateStr, bold: true },
      { label: 'Approval Date (Verified)', value: apprDateStr, bold: true, color: apprDateStr !== 'N/A' && !apprDateStr.includes('Pending') ? [22, 101, 52] : [180, 83, 9] },
      { label: '30-Day Activity Policy', value: 'Must list >= 1 venue in 30 days', bold: true }
    ], 3);

    // ── 1. PERSONAL & CONTACT INFORMATION ──
    renderSectionHeader('1. Personal & Contact Information');
    const pi = ambassador.personalInfo || {};
    const u = ambassador.user || ambassador.userId || {};

    renderKVGrid([
      { label: 'Full Legal Name', value: pi.fullName || u.name || fullName, bold: true },
      { label: 'Father / Parent Name', value: pi.parentName || 'N/A' },
      { label: 'Date of Birth', value: pi.dateOfBirth || 'N/A' },
      { label: 'Gender', value: pi.gender || 'Male' },
      { label: 'Primary Mobile', value: pi.mobileNumber || u.phone || 'N/A', bold: true },
      { label: 'WhatsApp Number', value: pi.whatsAppNumber || pi.mobileNumber || u.phone || 'N/A' },
      { label: 'Email Address', value: pi.email || u.email || 'N/A', bold: true },
      { label: 'Aadhaar Card Number', value: pi.aadhaarNumber || 'N/A', bold: true },
      { label: 'PAN Card Number', value: pi.panNumber || 'N/A' }
    ], 3);

    // ── 2. LOCATION & ASSIGNED AREA COVERAGE ──
    renderSectionHeader('2. Location & Assigned Area Coverage');
    const addr = ambassador.addressDetails || {};

    renderKVGrid([
      { label: 'Current Address', value: addr.currentAddress || 'N/A', bold: true },
      { label: 'Assigned Coverage Locality', value: addr.areaCoverage || 'All Area Covered', bold: true, color: [249, 115, 22] },
      { label: 'City', value: addr.city || u.city || 'N/A', bold: true },
      { label: 'District', value: addr.district || 'N/A' },
      { label: 'State', value: addr.state || u.state || 'N/A', bold: true },
      { label: 'Pincode', value: addr.pincode || 'N/A' }
    ], 3);

    // ── 3. LEVEL, BADGE & PERFORMANCE STATISTICS ──
    renderSectionHeader('3. Level, Tier & Performance Statistics');

    renderKVGrid([
      { label: 'Assigned Tier / Level', value: ambassador.assignedLevel || ambassador.level || 'LV.1 Venue Explorer', bold: true },
      { label: 'Assigned Badge', value: ambassador.badge || 'Bronze Explorer', bold: true },
      { label: 'City Partner Code', value: ambassador.cityPartnerCode || 'N/A' },
      { label: 'Total Venues Submitted', value: String(totalSubmittedVenues), bold: true },
      { label: 'Total Venues Approved', value: String(ambassador.totalVenuesApproved || 0), bold: true, color: [22, 101, 52] },
      { label: 'Total Venues Rejected', value: String(ambassador.totalVenuesRejected || 0) },
      { label: 'Current Wallet Balance', value: `Rs. ${(ambassador.walletBalance || 0).toLocaleString('en-IN')}`, bold: true, color: [22, 101, 52] },
      { label: 'Lifetime Total Earnings', value: `Rs. ${(ambassador.totalEarnings || 0).toLocaleString('en-IN')}`, bold: true },
      { label: '25% 1-Year Recurring Royalty', value: ambassador.profitShareUnlocked ? 'UNLOCKED (Active)' : 'Locked (Requires 7-Day Streak)', bold: true }
    ], 3);

    // ── 4. PROFESSIONAL EXPERIENCE & WORKING PROFILE ──
    renderSectionHeader('4. Professional Experience & Working Profile');
    const prof = ambassador.professionalDetails || {};
    const exp = ambassador.expectedPerformance || {};

    renderKVGrid([
      { label: 'Current Occupation', value: prof.currentOccupation || 'Self Employed / Professional' },
      { label: 'Company / Organization', value: prof.companyName || 'N/A' },
      { label: 'Education Qualification', value: prof.educationQualification || 'Graduate' },
      { label: 'Work Experience', value: prof.workExperience || 'N/A' },
      { label: 'Sales & Marketing Experience', value: prof.salesMarketingExperience ? 'Yes' : 'No' },
      { label: 'Digital Marketing Experience', value: prof.digitalMarketingExperience ? 'Yes' : 'No' },
      { label: 'Profile Type', value: ambassador.profileType || 'Venue Explorer (Part-Time)' },
      { label: 'Target Venues / Month', value: exp.venuesPerMonth || '20-50 Venues' },
      { label: 'Preferred Working Hours', value: exp.preferredWorkingTime || 'Flexible / Part-Time' }
    ], 3);

    // ── 5. BANK DETAILS FOR SETTLEMENTS ──
    renderSectionHeader('5. Bank Details for Payment Settlements');
    const bank = ambassador.bankDetails || {};

    renderKVGrid([
      { label: 'Account Holder Name', value: bank.accountHolderName || pi.fullName || fullName, bold: true },
      { label: 'Bank Name', value: bank.bankName || 'N/A', bold: true },
      { label: 'Account Number', value: bank.accountNumber || 'Encrypted / Confidential', bold: true },
      { label: 'IFSC Code', value: bank.ifscCode || 'N/A', bold: true },
      { label: 'UPI ID for Direct Payout', value: bank.upiId || 'N/A', bold: true, color: [249, 115, 22] },
      { label: 'Referral Info', value: ambassador.referralInfo?.referralCode || 'Direct Application' }
    ], 3);

    // ── 6. LISTED VENUES BY AMBASSADOR (NAMES & DETAILS) ──
    const venueList = Array.isArray(ambassador.venues) ? ambassador.venues : [];
    checkPageBreak(25);
    renderSectionHeader(`6. Listed Venues by Ambassador (${venueList.length} ${venueList.length === 1 ? 'Venue' : 'Venues'})`);

    if (venueList.length === 0) {
      drawCard(M, y, CW, 14, [248, 250, 252], [226, 232, 240], 1.5);
      setFont('italic', 8, [100, 116, 139]);
      doc.text('No venues listed yet by this Ambassador.', M + 4, y + 6);
      setFont('normal', 7.5, [148, 163, 184]);
      doc.text('• 30-Day Policy: Must list at least 1 verified venue within 30 days of approval to maintain Active status.', M + 4, y + 10.5);
      y += 17;
    } else {
      // Table Header: Total 186mm width
      const colWidths = [10, 62, 28, 40, 22, 24];
      const headers = ['#', 'Venue Business Name', 'SKU / ID', 'City / Location', 'Status', 'Listed Date'];

      drawCard(M, y, CW, 6.5, [241, 245, 249], [203, 213, 225], 1);
      setFont('bold', 7, [51, 65, 85]);

      let xOffset = M;
      headers.forEach((h, i) => {
        doc.text(h, xOffset + 2, y + 4.5);
        xOffset += colWidths[i];
      });
      y += 7.5;

      // Table Rows
      venueList.forEach((v, vIdx) => {
        checkPageBreak(8);
        const rowBg = vIdx % 2 === 0 ? [255, 255, 255] : [248, 250, 252];
        drawCard(M, y, CW, 7, rowBg, [241, 245, 249], 0.5);

        let rowX = M;

        // #
        setFont('bold', 7, [100, 116, 139]);
        doc.text(String(vIdx + 1), rowX + 2, y + 4.8);
        rowX += colWidths[0];

        // Venue Name
        setFont('bold', 7.5, [15, 23, 42]);
        const vName = doc.splitTextToSize(v.businessName || 'Venue Listing', colWidths[1] - 4)[0] || '';
        doc.text(vName, rowX + 2, y + 4.8);
        rowX += colWidths[1];

        // SKU
        setFont('normal', 7, [71, 85, 105]);
        doc.text(v.sku || 'N/A', rowX + 2, y + 4.8);
        rowX += colWidths[2];

        // City
        setFont('normal', 7, [71, 85, 105]);
        const vLoc = doc.splitTextToSize(v.location?.city || v.location?.state || 'India', colWidths[3] - 4)[0] || '';
        doc.text(vLoc, rowX + 2, y + 4.8);
        rowX += colWidths[3];

        // Status
        const vStatus = String(v.status || 'pending').toUpperCase();
        let vStatusCol = [180, 83, 9];
        if (vStatus === 'APPROVED') vStatusCol = [22, 101, 52];
        else if (vStatus === 'REJECTED') vStatusCol = [185, 28, 28];
        setFont('bold', 7, vStatusCol);
        doc.text(vStatus, rowX + 2, y + 4.8);
        rowX += colWidths[4];

        // Listed Date
        setFont('normal', 6.8, [100, 116, 139]);
        const vDate = v.createdAt ? new Date(v.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
        doc.text(vDate, rowX + 2, y + 4.8);

        y += 7.8;
      });

      y += 3;
    }

    // ── 7. UPLOADED KYC & VERIFICATION PROOF DOCUMENTS ──
    const docItems = [
      { title: 'Passport Photo', data: photoData, fallback: docs.passportPhoto },
      { title: 'Aadhaar Card (Front)', data: aadhaarFrontData, fallback: docs.aadhaarFront || docs.identityProof },
      { title: 'Aadhaar Card (Back)', data: aadhaarBackData, fallback: docs.aadhaarBack || docs.identityProofBack },
      { title: 'PAN Card', data: panData, fallback: docs.panCard },
      { title: 'Bank / Passbook Proof', data: bankProofData, fallback: docs.bankProof }
    ].filter(d => d.data || d.fallback);

    if (docItems.length > 0) {
      checkPageBreak(50);
      renderSectionHeader('7. Uploaded KYC & Identity Proof Documents');

      const cardW = (CW - 10) / 3;
      const cardH = 38;

      docItems.forEach((docItem, idx) => {
        const cX = M + (idx % 3) * (cardW + 5);
        const cY = y + Math.floor(idx / 3) * (cardH + 4);

        if (idx > 0 && idx % 3 === 0) {
          checkPageBreak(cardH + 4);
        }

        drawCard(cX, cY, cardW, cardH, [255, 255, 255], [226, 232, 240], 1.5);
        setFont('bold', 7.5, [15, 23, 42]);
        doc.text(docItem.title, cX + 3, cY + 4.5);

        if (docItem.data?.dataUrl) {
          try {
            doc.addImage(docItem.data.dataUrl, docItem.data.format || 'JPEG', cX + 3, cY + 6.5, cardW - 6, cardH - 8);
          } catch {
            setFont('normal', 7, [100, 116, 139]);
            doc.text('✓ Document Uploaded', cX + 3, cY + 16);
          }
        } else {
          setFont('normal', 7, [100, 116, 139]);
          doc.text('✓ Document on File (PDF/Link)', cX + 3, cY + 16);
        }
      });

      const numRows = Math.ceil(docItems.length / 3);
      y += numRows * (cardH + 4) + 2;
    }

    // ── 8. COMPLIANCE DECLARATION & VERIFICATION NOTE ──
    checkPageBreak(25);
    drawCard(M, y, CW, 20, [254, 252, 232], [254, 240, 138], 2);
    setFont('bold', 8, [133, 77, 14]);
    doc.text('COMPLIANCE DECLARATION & VERIFICATION NOTE:', M + 4, y + 5);

    setFont('normal', 7.5, [113, 63, 18]);
    doc.text('• Applicant declared all submitted identity and banking information to be authentic under RentalMeet Partner Terms.', M + 4, y + 10);
    doc.text('• Active Policy: Ambassador ID must list at least 1 verified venue within 30 days of approval to maintain active status.', M + 4, y + 14);
    doc.text(`• Verification Officer: ${ambassador.verifiedBy?.name || 'Authorized RentalMeet Admin'}  |  Timestamp: ${new Date().toLocaleString('en-IN')}`, M + 4, y + 18);

    y += 24;

    // Render footer for all pages
    renderFooter(pageNum);

    // Download PDF
    const cleanName = (fullName || 'Ambassador').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Ambassador_Dossier_${ambId}_${cleanName}.pdf`;
    doc.save(fileName);

    toast.success('Ambassador Dossier PDF downloaded successfully!', { id: toastId });
    return true;
  } catch (err) {
    console.error('Error generating Ambassador PDF:', err);
    toast.error('Failed to generate Ambassador PDF: ' + err.message, { id: toastId });
    throw err;
  }
}
