'use client';

import { useRef, useState } from 'react';
import { X, Download, Printer } from 'lucide-react';

export default function ServiceQuotationModal({ booking, svc, form, selectedDate, quantities, packages, pricing, onClose }) {
  const quotationRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);

  const { subtotal, serviceCgst, serviceSgst, cgstPct, sgstPct, platformFee, platformFeePct, platformFeeGst, platformCgstPct, platformSgstPct, total } = pricing;

  const eventDateStr = selectedDate
    ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  const todayStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  const selectedItems = (packages || []).map((pkg, i) => ({ ...pkg, qty: quantities[i] || 0 })).filter(p => p.qty > 0);

  // Mark as downloaded in DB
  const markDownloaded = (action = 'download') => {
    if (booking?._id) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-bookings/${booking._id}/downloaded`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      }).catch(() => {});
    }
  };

  const handlePrint = async () => {
    setPrinting(true);
    markDownloaded('print');

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
    const fmt = (n) => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const serviceTotal = subtotal + serviceCgst + serviceSgst;
    const platformTotal = platformFee + platformFeeGst;

    const itemRows = selectedItems.map((item, i) =>
      `<tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'};border-bottom:1px solid #e5e7eb">
        <td style="padding:7px 10px;font-size:11px">${item.name}</td>
        <td style="padding:7px 10px;text-align:right;font-size:11px">₹${(item.price || 0).toLocaleString()}</td>
        <td style="padding:7px 10px;text-align:center;font-size:10px;color:#6b7280">${item.unit}</td>
        <td style="padding:7px 10px;text-align:center;font-size:11px;font-weight:600">${item.qty}</td>
        <td style="padding:7px 10px;text-align:right;font-size:11px;font-weight:700;color:#F59E0B">₹${((item.price || 0) * item.qty).toLocaleString()}</td>
      </tr>`
    ).join('');

    const css = `
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',Arial,sans-serif;font-size:12px;color:#1f2937;background:#fff;padding:32px 36px}
      .hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}
      .logo-img{height:44px;object-fit:contain}
      .inv-title{font-size:20px;font-weight:800;letter-spacing:1px;margin-bottom:3px}
      .inv-no{font-size:10px;color:#6b7280;margin-bottom:1px}
      .badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:9px;font-weight:700;margin-top:4px;background:#fef3c7;color:#92400e}
      .divider{height:3px;border-radius:2px;margin-bottom:16px;background:linear-gradient(90deg,#F59E0B,#FCD34D)}
      .meta{display:flex;justify-content:space-between;background:#f9fafb;border-radius:8px;padding:12px 16px;margin-bottom:16px}
      .meta-label{font-size:9px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:1px}
      .meta-val{font-size:12px;font-weight:800;color:#111827}
      .two-col{display:flex;gap:12px;margin-bottom:16px}
      .card{flex:1;border-radius:8px;padding:12px;border:1px solid}
      .card-title{font-size:8px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid}
      .card-row{margin-bottom:5px}
      .card-label{font-size:8px;color:#9ca3af;margin-bottom:1px}
      .card-val{font-size:10px;font-weight:600;color:#111827}
      table{width:100%;border-collapse:collapse;margin-bottom:14px}
      th{padding:7px 9px;text-align:left;font-size:8px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#fff;background:#F59E0B}
      td{padding:6px 9px;border-bottom:1px solid #f3f4f6;font-size:10px;vertical-align:top}
      .inv-section{border:3px solid;border-radius:10px;padding:16px;margin-bottom:16px}
      .inv-section-title{font-size:14px;font-weight:900;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid}
      .totals{border-radius:8px;padding:12px 14px;margin-bottom:8px}
      .tot-row{display:flex;justify-content:space-between;padding:3px 0;font-size:10px}
      .tot-grand{font-size:13px;font-weight:800;border-top:2px solid rgba(0,0,0,.15);margin-top:5px;padding-top:7px}
      .grand-box{background:linear-gradient(135deg,#F59E0B,#FCD34D);border-radius:10px;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
      .footer{text-align:center;font-size:8px;color:#9ca3af;padding-top:8px;border-top:1px solid #e5e7eb}
      @media print{body{padding:16px}}
    `;

    const html = `<!DOCTYPE html><html><head><title>Service Quotation - ${booking?.quotationNumber}</title><style>${css}</style></head><body>
      <div class="hdr">
        <div>
          ${logoB64 ? `<img src="${logoB64}" class="logo-img" alt="RentalMeet"/>` : `<div style="font-size:22px;font-weight:900;color:#F59E0B">RentalMeet</div>`}
          <div style="font-size:9px;color:#6b7280;margin-top:2px">Premium Vendor Services Platform</div>
          <div style="font-size:9px;color:#6b7280">booking@rentalmeet.in | 24/7 Available</div>
        </div>
        <div style="text-align:right">
          <div class="inv-title" style="color:#F59E0B">SERVICE QUOTATION</div>
          <div class="inv-no">Quotation No: <strong>${booking?.quotationNumber || '—'}</strong></div>
          <div class="inv-no">Date: ${todayStr}</div>
          <span class="badge">ENQUIRY</span>
        </div>
      </div>
      <div class="divider"></div>

      <div class="meta">
        <div><div class="meta-label">Valid Until</div><div class="meta-val">${validUntil}</div></div>
        <div style="text-align:center"><div class="meta-label">Event Date</div><div class="meta-val" style="color:#F59E0B">${eventDateStr}</div></div>
        <div style="text-align:right"><div class="meta-label">Status</div><div class="meta-val" style="color:#F59E0B">ENQUIRY</div></div>
      </div>

      <div class="two-col">
        <div class="card" style="background:#eff6ff;border-color:#bfdbfe">
          <div class="card-title" style="color:#1e40af;border-color:#bfdbfe">Billed To</div>
          <div class="card-row"><div class="card-label">Name</div><div class="card-val">${form?.name || '—'}</div></div>
          ${form?.company ? `<div class="card-row"><div class="card-label">Company</div><div class="card-val">${form.company}</div></div>` : ''}
          <div class="card-row"><div class="card-label">Email</div><div class="card-val">${form?.email || '—'}</div></div>
          <div class="card-row"><div class="card-label">Phone</div><div class="card-val">${form?.phone || '—'}</div></div>
          ${form?.eventName ? `<div class="card-row"><div class="card-label">Event</div><div class="card-val">${form.eventName}</div></div>` : ''}
        </div>
        <div class="card" style="background:#fefce8;border-color:#fde68a">
          <div class="card-title" style="color:#92400e;border-color:#fde68a">Service Provider</div>
          <div class="card-row"><div class="card-label">Service</div><div class="card-val">${svc?.title || '—'}</div></div>
          <div class="card-row"><div class="card-label">Category</div><div class="card-val">${svc?.category || '—'}</div></div>
          ${(svc?.vendor?.companyName || svc?.companyName) ? `<div class="card-row"><div class="card-label">Company</div><div class="card-val">${svc?.vendor?.companyName || svc?.companyName}</div></div>` : ''}
          <div class="card-row"><div class="card-label">Location</div><div class="card-val">${[svc?.city, svc?.state].filter(Boolean).join(', ') || '—'}</div></div>
        </div>
      </div>

      <!-- Items Table -->
      <table>
        <thead><tr><th>Service / Item</th><th style="text-align:right">Rate</th><th style="text-align:center">Unit</th><th style="text-align:center">Qty</th><th style="text-align:right">Amount</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>

      <!-- Invoice 1: Service -->
      <div class="inv-section" style="border-color:#93c5fd;background:linear-gradient(135deg,#eff6ff,#fff)">
        <div class="inv-section-title" style="color:#1e40af;border-color:#93c5fd">📄 SERVICE INVOICE</div>
        <div class="totals" style="background:#eff6ff;border:1px solid #bfdbfe">
          <div class="tot-row"><span>Service Amount</span><span>₹${fmt(subtotal)}</span></div>
          <div class="tot-row" style="color:#1d4ed8"><span>CGST (${cgstPct}%)</span><span>₹${fmt(serviceCgst)}</span></div>
          <div class="tot-row" style="color:#1d4ed8"><span>SGST (${sgstPct}%)</span><span>₹${fmt(serviceSgst)}</span></div>
          <div class="tot-row tot-grand" style="color:#1e40af"><span>Service Invoice Total</span><span>₹${fmt(serviceTotal)}</span></div>
        </div>
      </div>

      <!-- Invoice 2: Platform -->
      <div class="inv-section" style="border-color:#c4b5fd;background:linear-gradient(135deg,#faf5ff,#fff)">
        <div class="inv-section-title" style="color:#6d28d9;border-color:#c4b5fd">📄 PLATFORM INVOICE</div>
        <div class="totals" style="background:#faf5ff;border:1px solid #c4b5fd">
          <div class="tot-row"><span>Platform Fee (${platformFeePct}%)</span><span>₹${fmt(platformFee)}</span></div>
          <div class="tot-row" style="color:#7c3aed"><span>CGST (${platformCgstPct}%)</span><span>₹${fmt(Math.round(platformFee * platformCgstPct / 100))}</span></div>
          <div class="tot-row" style="color:#7c3aed"><span>SGST (${platformSgstPct}%)</span><span>₹${fmt(Math.round(platformFee * platformSgstPct / 100))}</span></div>
          <div class="tot-row tot-grand" style="color:#6d28d9"><span>Platform Invoice Total</span><span>₹${fmt(platformTotal)}</span></div>
        </div>
      </div>

      <!-- Grand Total -->
      <div class="grand-box">
        <div style="font-size:18px;font-weight:900;color:#fff">TOTAL AMOUNT</div>
        <div style="font-size:28px;font-weight:900;color:#fff">₹${fmt(total)}</div>
      </div>

      ${form?.notes ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:10px"><strong>Special Requirements:</strong> ${form.notes}</div>` : ''}

      <div class="footer">
        <p>This is a non-binding quotation. Valid for 7 days from date of issue. Final pricing subject to vendor confirmation.</p>
        <p style="margin-top:2px">Generated by RentalMeet · booking@rentalmeet.in · Ref: ${booking?.quotationNumber}</p>
      </div>
    </body></html>`;

    const w = window.open('', '_blank');
    if (!w) { setPrinting(false); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.print(); setPrinting(false); }, 400);
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    markDownloaded('download');
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
      const fmt = (n) => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const serviceTotal = subtotal + serviceCgst + serviceSgst;
      const platformTotal = platformFee + platformFeeGst;

      const itemRows = selectedItems.map((item, i) =>
        `<tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'};border-bottom:1px solid #e5e7eb">
          <td style="padding:7px 10px;font-size:11px">${item.name}</td>
          <td style="padding:7px 10px;text-align:right;font-size:11px">₹${(item.price || 0).toLocaleString()}</td>
          <td style="padding:7px 10px;text-align:center;font-size:10px;color:#6b7280">${item.unit}</td>
          <td style="padding:7px 10px;text-align:center;font-size:11px;font-weight:600">${item.qty}</td>
          <td style="padding:7px 10px;text-align:right;font-size:11px;font-weight:700;color:#F59E0B">₹${((item.price || 0) * item.qty).toLocaleString()}</td>
        </tr>`
      ).join('');

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
        .badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:9px;font-weight:700;letter-spacing:.5px;margin-top:4px;background:#fef3c7;color:#92400e}
        .divider{height:3px;border-radius:2px;margin-bottom:16px}
        .meta{display:flex;justify-content:space-between;background:#f9fafb;border-radius:8px;padding:12px 16px;margin-bottom:16px}
        .meta-label{font-size:9px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:1px}
        .meta-val{font-size:12px;font-weight:800;color:#111827}
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
        .tot-grand{font-size:13px;font-weight:800;border-top:2px solid rgba(0,0,0,.15);margin-top:5px;padding-top:7px}
        .inv-section{border:3px solid;border-radius:10px;padding:16px;margin-bottom:16px}
        .inv-section-title{font-size:14px;font-weight:900;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid}
        .grand-box{border-radius:10px;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}
        .footer{text-align:center;font-size:8px;color:#9ca3af;padding-top:8px;border-top:1px solid #e5e7eb}
      `;

      const htmlContent = `<div class="wrap" style="font-family:'Segoe UI',Arial,sans-serif">
        <style>${commonCSS}</style>
        <div class="hdr">
          <div>
            ${logoB64 ? `<img src="${logoB64}" class="logo-img" alt="RentalMeet"/>` : `<div style="font-size:20px;font-weight:800;color:#F59E0B">RentalMeet</div>`}
            <div class="brand-sub">Premium Vendor Services Platform</div>
            <div style="font-size:9px;color:#6b7280;margin-top:2px">booking@rentalmeet.in | 24/7 Available</div>
          </div>
          <div class="inv-right">
            <div class="inv-title" style="color:#F59E0B">SERVICE QUOTATION</div>
            <div class="inv-no">Quotation No: <strong>${booking?.quotationNumber || '—'}</strong></div>
            <div class="inv-no">Date: ${todayStr}</div>
            <span class="badge">ENQUIRY</span>
          </div>
        </div>
        <div class="divider" style="background:linear-gradient(90deg,#F59E0B,#FCD34D)"></div>

        <div class="meta">
          <div><div class="meta-label">Valid Until</div><div class="meta-val">${validUntil}</div></div>
          <div style="text-align:center"><div class="meta-label">Event Date</div><div class="meta-val" style="color:#F59E0B">${eventDateStr}</div></div>
          <div style="text-align:right"><div class="meta-label">Status</div><div class="meta-val" style="color:#F59E0B">ENQUIRY</div></div>
        </div>

        <div class="two-col">
          <div class="card" style="background:#eff6ff;border-color:#bfdbfe">
            <div class="card-title" style="color:#1e40af;border-color:#bfdbfe">Billed To</div>
            <div class="card-row"><div class="card-label">Name</div><div class="card-val">${form?.name || '—'}</div></div>
            ${form?.company ? `<div class="card-row"><div class="card-label">Company</div><div class="card-val">${form.company}</div></div>` : ''}
            <div class="card-row"><div class="card-label">Email</div><div class="card-val">${form?.email || '—'}</div></div>
            <div class="card-row"><div class="card-label">Phone</div><div class="card-val">${form?.phone || '—'}</div></div>
            ${form?.eventName ? `<div class="card-row"><div class="card-label">Event</div><div class="card-val">${form.eventName}</div></div>` : ''}
          </div>
          <div class="card" style="background:#fefce8;border-color:#fde68a">
            <div class="card-title" style="color:#92400e;border-color:#fde68a">Service Provider</div>
            <div class="card-row"><div class="card-label">Service</div><div class="card-val">${svc?.title || '—'}</div></div>
            <div class="card-row"><div class="card-label">Category</div><div class="card-val">${svc?.category || '—'}</div></div>
            ${(svc?.vendor?.companyName || svc?.companyName) ? `<div class="card-row"><div class="card-label">Company</div><div class="card-val">${svc?.vendor?.companyName || svc?.companyName}</div></div>` : ''}
            <div class="card-row"><div class="card-label">Location</div><div class="card-val">${[svc?.city, svc?.state].filter(Boolean).join(', ') || '—'}</div></div>
          </div>
        </div>

        <table>
          <thead><tr style="background:#F59E0B"><th>Service / Item</th><th style="text-align:right">Rate</th><th style="text-align:center">Unit</th><th style="text-align:center">Qty</th><th style="text-align:right">Amount</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>

        <div class="inv-section" style="border-color:#93c5fd;background:linear-gradient(135deg,#eff6ff,#fff)">
          <div class="inv-section-title" style="color:#1e40af;border-color:#93c5fd">📄 SERVICE INVOICE</div>
          <div class="totals" style="background:#eff6ff;border:1px solid #bfdbfe">
            <div class="tot-row"><span>Service Amount</span><span>₹${fmt(subtotal)}</span></div>
            <div class="tot-row" style="color:#1d4ed8"><span>CGST (${cgstPct}%)</span><span>₹${fmt(serviceCgst)}</span></div>
            <div class="tot-row" style="color:#1d4ed8"><span>SGST (${sgstPct}%)</span><span>₹${fmt(serviceSgst)}</span></div>
            <div class="tot-row tot-grand" style="color:#1e40af"><span>Service Invoice Total</span><span>₹${fmt(serviceTotal)}</span></div>
          </div>
        </div>

        <div class="inv-section" style="border-color:#c4b5fd;background:linear-gradient(135deg,#faf5ff,#fff)">
          <div class="inv-section-title" style="color:#6d28d9;border-color:#c4b5fd">📄 PLATFORM INVOICE</div>
          <div class="totals" style="background:#faf5ff;border:1px solid #c4b5fd">
            <div class="tot-row"><span>Platform Fee (${platformFeePct}%)</span><span>₹${fmt(platformFee)}</span></div>
            <div class="tot-row" style="color:#7c3aed"><span>CGST (${platformCgstPct}%)</span><span>₹${fmt(Math.round(platformFee * platformCgstPct / 100))}</span></div>
            <div class="tot-row" style="color:#7c3aed"><span>SGST (${platformSgstPct}%)</span><span>₹${fmt(Math.round(platformFee * platformSgstPct / 100))}</span></div>
            <div class="tot-row tot-grand" style="color:#6d28d9"><span>Platform Invoice Total</span><span>₹${fmt(platformTotal)}</span></div>
          </div>
        </div>

        <div class="grand-box" style="background:linear-gradient(135deg,#F59E0B,#FCD34D)">
          <div style="font-size:18px;font-weight:900;color:#fff">TOTAL AMOUNT</div>
          <div style="font-size:28px;font-weight:900;color:#fff">₹${fmt(total)}</div>
        </div>

        ${form?.notes ? `<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px 12px;margin-bottom:14px;font-size:10px"><strong>Special Requirements:</strong> ${form.notes}</div>` : ''}

        <div class="footer">
          <p>This is a non-binding quotation. Valid for 7 days from date of issue. Final pricing subject to vendor confirmation.</p>
          <p style="margin-top:2px">Generated by RentalMeet &nbsp;|&nbsp; booking@rentalmeet.in &nbsp;|&nbsp; Ref: ${booking?.quotationNumber}</p>
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
      pdf.save(`ServiceQuotation-${booking?.quotationNumber || 'draft'}.pdf`);
    } catch (e) {
      console.error('PDF error:', e);
      alert('PDF generation failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-primary-50 to-orange-50 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Service Quotation</h2>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} disabled={printing}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
              <Printer className="w-4 h-4" />{printing ? 'Printing...' : 'Print'}
            </button>
            <button onClick={handleDownloadPDF} disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
              <Download className="w-4 h-4" />{downloading ? 'Generating...' : 'Download PDF'}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quotation Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          <div ref={quotationRef} style={{ fontFamily: "'Segoe UI', Arial, sans-serif", color: '#1f2937' }}>

            {/* Branding Header */}
            <div style={{ textAlign: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '2px solid #F59E0B' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#F59E0B', marginBottom: 4 }}>RentalMeet</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Premium Vendor Services Platform</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>booking@rentalmeet.in | 24/7 Available</div>
            </div>

            {/* Quotation Meta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f9fafb', borderRadius: 8, padding: '12px 16px', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Quotation No.</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{booking?.quotationNumber || '—'}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Date</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{todayStr}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Valid Until</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{validUntil}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Status</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#F59E0B' }}>ENQUIRY</div>
              </div>
            </div>

            {/* Two-column: Client + Service */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#1e40af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #bfdbfe' }}>Billed To</div>
                <div style={{ marginBottom: 5 }}><div style={{ fontSize: 9, color: '#9ca3af' }}>Name</div><div style={{ fontSize: 11, fontWeight: 600 }}>{form?.name || '—'}</div></div>
                {form?.company && <div style={{ marginBottom: 5 }}><div style={{ fontSize: 9, color: '#9ca3af' }}>Company</div><div style={{ fontSize: 11, fontWeight: 600 }}>{form.company}</div></div>}
                <div style={{ marginBottom: 5 }}><div style={{ fontSize: 9, color: '#9ca3af' }}>Email</div><div style={{ fontSize: 11, fontWeight: 600 }}>{form?.email || '—'}</div></div>
                <div style={{ marginBottom: 5 }}><div style={{ fontSize: 9, color: '#9ca3af' }}>Phone</div><div style={{ fontSize: 11, fontWeight: 600 }}>{form?.phone || '—'}</div></div>
                {form?.eventName && <div><div style={{ fontSize: 9, color: '#9ca3af' }}>Event</div><div style={{ fontSize: 11, fontWeight: 600 }}>{form.eventName}</div></div>}
              </div>
              <div style={{ flex: 1, background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #fde68a' }}>Service Provider</div>
                <div style={{ marginBottom: 5 }}><div style={{ fontSize: 9, color: '#9ca3af' }}>Service</div><div style={{ fontSize: 11, fontWeight: 600 }}>{svc?.title || '—'}</div></div>
                <div style={{ marginBottom: 5 }}><div style={{ fontSize: 9, color: '#9ca3af' }}>Category</div><div style={{ fontSize: 11, fontWeight: 600 }}>{svc?.category || '—'}</div></div>
                {(svc?.vendor?.companyName || svc?.companyName) && <div style={{ marginBottom: 5 }}><div style={{ fontSize: 9, color: '#9ca3af' }}>Company</div><div style={{ fontSize: 11, fontWeight: 600 }}>{svc?.vendor?.companyName || svc?.companyName}</div></div>}
                <div style={{ marginBottom: 5 }}><div style={{ fontSize: 9, color: '#9ca3af' }}>Location</div><div style={{ fontSize: 11, fontWeight: 600 }}>{[svc?.city, svc?.state].filter(Boolean).join(', ') || '—'}</div></div>
                <div><div style={{ fontSize: 9, color: '#9ca3af' }}>Event Date</div><div style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B' }}>{eventDateStr}</div></div>
              </div>
            </div>

            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr style={{ background: '#F59E0B' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: 0.5 }}>Service / Item</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: '#fff' }}>Rate</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>Unit</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#fff' }}>Qty</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 700, color: '#fff' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedItems.map((item, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '7px 10px', fontSize: 11 }}>{item.name}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontSize: 11 }}>₹{(item.price || 0).toLocaleString()}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'center', fontSize: 10, color: '#6b7280' }}>{item.unit}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'center', fontSize: 11, fontWeight: 600 }}>{item.qty}</td>
                    <td style={{ padding: '7px 10px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#F59E0B' }}>₹{((item.price || 0) * item.qty).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Price Breakdown — two invoices */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              {/* Service Invoice */}
              <div style={{ flex: 1, background: '#eff6ff', border: '2px solid #93c5fd', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#1e40af', marginBottom: 10 }}>📄 Service Invoice</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}><span>Service Amount</span><span>₹{subtotal.toLocaleString()}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4, color: '#1d4ed8' }}><span>CGST ({cgstPct}%)</span><span>₹{serviceCgst.toLocaleString()}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4, color: '#1d4ed8' }}><span>SGST ({sgstPct}%)</span><span>₹{serviceSgst.toLocaleString()}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800, color: '#1e40af', borderTop: '2px solid #93c5fd', paddingTop: 8, marginTop: 6 }}><span>Service Total</span><span>₹{(subtotal + serviceCgst + serviceSgst).toLocaleString()}</span></div>
              </div>
              {/* Platform Invoice */}
              <div style={{ flex: 1, background: '#faf5ff', border: '2px solid #c4b5fd', borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#6d28d9', marginBottom: 10 }}>📄 Platform Invoice</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}><span>Platform Fee ({platformFeePct}%)</span><span>₹{platformFee.toLocaleString()}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4, color: '#7c3aed' }}><span>CGST ({platformCgstPct}%)</span><span>₹{Math.round(platformFee * platformCgstPct / 100).toLocaleString()}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4, color: '#7c3aed' }}><span>SGST ({platformSgstPct}%)</span><span>₹{Math.round(platformFee * platformSgstPct / 100).toLocaleString()}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 800, color: '#6d28d9', borderTop: '2px solid #c4b5fd', paddingTop: 8, marginTop: 6 }}><span>Platform Total</span><span>₹{(platformFee + platformFeeGst).toLocaleString()}</span></div>
              </div>
            </div>

            {/* Grand Total */}
            <div style={{ background: 'linear-gradient(135deg, #F59E0B, #FCD34D)', borderRadius: 10, padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>TOTAL AMOUNT</span>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>₹{total.toLocaleString()}</span>
            </div>

            {/* Notes */}
            {form?.notes && (
              <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: 4 }}>Special Requirements</div>
                <div style={{ fontSize: 11, color: '#374151' }}>{form.notes}</div>
              </div>
            )}

            {/* Footer */}
            <div style={{ textAlign: 'center', fontSize: 9, color: '#9ca3af', paddingTop: 12, borderTop: '1px solid #e5e7eb' }}>
              <div>This is a non-binding quotation. Valid for 7 days from date of issue. Final pricing subject to vendor confirmation.</div>
              <div style={{ marginTop: 4 }}>Generated by RentalMeet · booking@rentalmeet.in · Ref: {booking?.quotationNumber}</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
