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
  const fmt = (n) => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const serviceTotal = subtotal + serviceCgst + serviceSgst;
  const platformTotal = platformFee + platformFeeGst;
  const qNo = booking?.quotationNumber || '—';

  const markDownloaded = (action = 'download') => {
    if (booking?._id) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/service-bookings/${booking._id}/downloaded`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action })
      }).catch(() => {});
    }
  };

  const toBase64 = (url) => new Promise((resolve) => {
    const img = new Image(); img.crossOrigin = 'anonymous';
    img.onload = () => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0); resolve(c.toDataURL('image/png')); };
    img.onerror = () => resolve(null); img.src = url;
  });

  const buildHTML = (logoB64) => {
    const itemRows = selectedItems.map((item, i) =>
      `<tr style="background:${i%2===0?'#fff':'#fafafa'}">
        <td style="padding:5px 8px;font-size:10px">${item.name}</td>
        <td style="padding:5px 8px;text-align:right;font-size:10px">₹${(item.price||0).toLocaleString()}</td>
        <td style="padding:5px 8px;text-align:center;font-size:10px;color:#6b7280">${item.unit}</td>
        <td style="padding:5px 8px;text-align:center;font-size:10px;font-weight:600">${item.qty}</td>
        <td style="padding:5px 8px;text-align:right;font-size:10px;font-weight:700;color:#d97706">₹${((item.price||0)*item.qty).toLocaleString()}</td>
      </tr>`
    ).join('');

    const kv = (label, value) => value
      ? `<div style="display:flex;gap:4px;margin-bottom:3px;font-size:10px;line-height:1.4">
           <span style="color:#6b7280;white-space:nowrap;min-width:60px">${label}:</span>
           <span style="font-weight:600;color:#111827">${value}</span>
         </div>`
      : '';

    return `<div style="width:794px;background:#fff;padding:28px 32px;font-family:'Segoe UI',Arial,sans-serif;color:#1f2937;font-size:10px">

      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div>
          ${logoB64?`<img src="${logoB64}" style="height:40px;object-fit:contain" alt="RentalMeet"/>`:`<div style="font-size:22px;font-weight:900;color:#F59E0B">RentalMeet</div>`}
          <div style="font-size:9px;color:#6b7280;margin-top:2px">Premium Vendor Services Platform</div>
          <div style="font-size:9px;color:#9ca3af">booking@rentalmeet.com</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:14px;font-weight:900;color:#F59E0B;letter-spacing:1px">SERVICE QUOTATION</div>
          <div style="font-size:10px;color:#374151;margin-top:2px">No: <strong>${qNo}</strong></div>
          <div style="font-size:10px;color:#6b7280">Date: ${todayStr} &nbsp;|&nbsp; Valid: ${validUntil}</div>
          <div style="font-size:10px;color:#F59E0B;font-weight:700;margin-top:2px">Event: ${eventDateStr}</div>
        </div>
      </div>
      <div style="height:3px;background:linear-gradient(90deg,#F59E0B,#FCD34D);border-radius:2px;margin-bottom:12px"></div>

      <!-- Two columns -->
      <div style="display:flex;gap:10px;margin-bottom:12px">
        <div style="flex:1;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px">
          <div style="font-size:9px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:1px;margin-bottom:7px;padding-bottom:5px;border-bottom:1px solid #bfdbfe">BILLED TO</div>
          ${kv('Name', form?.name)}
          ${kv('Company', form?.company)}
          ${kv('Email', form?.email)}
          ${kv('Phone', form?.phone)}
          ${kv('Event', form?.eventName)}
        </div>
        <div style="flex:1;background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:10px">
          <div style="font-size:9px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:1px;margin-bottom:7px;padding-bottom:5px;border-bottom:1px solid #fde68a">SERVICE PROVIDER</div>
          ${kv('Service', svc?.title)}
          ${kv('Category', svc?.category)}
          ${kv('Company', svc?.vendor?.companyName||svc?.companyName)}
          ${kv('Location', [svc?.city,svc?.state].filter(Boolean).join(', '))}
        </div>
      </div>

      <!-- Items Table -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px">
        <thead>
          <tr style="background:#F59E0B">
            <th style="padding:6px 8px;text-align:left;font-size:9px;font-weight:700;color:#fff;text-transform:uppercase">SERVICE / ITEM</th>
            <th style="padding:6px 8px;text-align:right;font-size:9px;font-weight:700;color:#fff">RATE</th>
            <th style="padding:6px 8px;text-align:center;font-size:9px;font-weight:700;color:#fff">UNIT</th>
            <th style="padding:6px 8px;text-align:center;font-size:9px;font-weight:700;color:#fff">QTY</th>
            <th style="padding:6px 8px;text-align:right;font-size:9px;font-weight:700;color:#fff">AMOUNT</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>

      <!-- Two invoice boxes side by side -->
      <div style="display:flex;gap:10px;margin-bottom:12px">
        <div style="flex:1;background:#eff6ff;border:2px solid #93c5fd;border-radius:8px;padding:10px">
          <div style="font-size:10px;font-weight:800;color:#1e40af;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #93c5fd">SERVICE QUOTATION</div>
          <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px"><span>Service Amount</span><span>₹${fmt(subtotal)}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px;color:#1d4ed8"><span>CGST (${cgstPct}%)</span><span>₹${fmt(serviceCgst)}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px;color:#1d4ed8"><span>SGST (${sgstPct}%)</span><span>₹${fmt(serviceSgst)}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:800;color:#1e40af;border-top:2px solid #93c5fd;padding-top:6px;margin-top:4px"><span>Service Quotation Total</span><span>₹${fmt(serviceTotal)}</span></div>
        </div>
        <div style="flex:1;background:#faf5ff;border:2px solid #c4b5fd;border-radius:8px;padding:10px">
          <div style="font-size:10px;font-weight:800;color:#6d28d9;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #c4b5fd">PLATFORM QUOTATION</div>
          <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px"><span>Platform Fee (${platformFeePct}%)</span><span>₹${fmt(platformFee)}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px;color:#7c3aed"><span>CGST (${platformCgstPct}%)</span><span>₹${fmt(Math.round(platformFee*platformCgstPct/100))}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px;color:#7c3aed"><span>SGST (${platformSgstPct}%)</span><span>₹${fmt(Math.round(platformFee*platformSgstPct/100))}</span></div>
          <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:800;color:#6d28d9;border-top:2px solid #c4b5fd;padding-top:6px;margin-top:4px"><span>Platform Quotation Total</span><span>₹${fmt(platformTotal)}</span></div>
        </div>
      </div>

      <!-- Grand Total -->
      <div style="background:linear-gradient(135deg,#F59E0B,#FCD34D);border-radius:8px;padding:10px 16px;display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <span style="font-size:11px;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:0.5px">Total Amount</span>
        <span style="font-size:12px;font-weight:800;color:#fff">₹${fmt(total)}</span>
      </div>

      ${form?.notes?`<div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;margin-bottom:10px;font-size:10px"><strong>Special Requirements:</strong> ${form.notes}</div>`:''}

      <div style="text-align:center;font-size:8px;color:#9ca3af;padding-top:8px;border-top:1px solid #e5e7eb">
        <div>Non-binding quotation · Valid 7 days · Final pricing subject to vendor confirmation</div>
        <div style="margin-top:2px">RentalMeet · booking@rentalmeet.com · Ref: ${qNo}</div>
      </div>
    </div>`;
  };

  const handlePrint = async () => {
    setPrinting(true);
    markDownloaded('print');
    const logoB64 = await toBase64(`${window.location.origin}/logo.png`);
    const html = `<!DOCTYPE html><html><head><title>Service Quotation - ${qNo}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#fff}@media print{body{margin:0}}</style></head><body>${buildHTML(logoB64)}</body></html>`;
    const w = window.open('', '_blank');
    if (!w) { setPrinting(false); return; }
    w.document.open(); w.document.write(html); w.document.close();
    setTimeout(() => { w.print(); setPrinting(false); }, 400);
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    markDownloaded('download');
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const logoB64 = await toBase64(`${window.location.origin}/logo.png`);

      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;z-index:-1';
      container.innerHTML = buildHTML(logoB64);
      document.body.appendChild(container);
      await new Promise(r => setTimeout(r, 300));

      const canvas = await html2canvas(container, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff', logging: false, width: 794, windowWidth: 794 });
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
        while (yPos < pdfH) { if (yPos > 0) pdf.addPage(); pdf.addImage(imgData, 'JPEG', 0, -yPos, pdfW, pdfH); yPos += pageH; }
      }
      pdf.save(`ServiceQuotation-${qNo}.pdf`);
    } catch (e) { console.error('PDF error:', e); alert('PDF generation failed.'); }
    finally { setDownloading(false); }
  };

  return (
    <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-primary-50 to-orange-50 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Service Quotation</h2>
            <p className="text-xs text-gray-500">{qNo}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} disabled={printing}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
              <Printer className="w-4 h-4" />{printing ? 'Printing...' : 'Print'}
            </button>
            <button onClick={handleDownloadPDF} disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50">
              <Download className="w-4 h-4" />{downloading ? 'Generating...' : 'Download PDF'}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div ref={quotationRef} className="bg-white rounded-xl shadow-sm overflow-hidden"
            dangerouslySetInnerHTML={{ __html: buildHTML(null) }} />
        </div>
      </div>
    </div>
  );
}
