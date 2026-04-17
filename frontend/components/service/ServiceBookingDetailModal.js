'use client';

import { useRef } from 'react';
import {
  X, Download, Printer, CheckCircle2, Clock, XCircle,
  Tag, CreditCard, Calendar, MapPin, User, Briefcase, Package
} from 'lucide-react';

const STATUS_STYLE = {
  enquiry:   { cls: 'bg-yellow-100 text-yellow-700', icon: Clock,        label: 'Enquiry' },
  confirmed: { cls: 'bg-green-100 text-green-700',  icon: CheckCircle2, label: 'Confirmed' },
  cancelled: { cls: 'bg-red-100 text-red-700',      icon: XCircle,      label: 'Cancelled' },
};
const PAY_STYLE = {
  paid:    'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed:  'bg-red-100 text-red-700',
};

export default function ServiceBookingDetailModal({ booking: b, onClose, onStatusChange, canChangeStatus = false }) {
  const printRef = useRef(null);
  if (!b) return null;

  const bNum = b.bookingNumber || b.quotationNumber || '—';
  const st = STATUS_STYLE[b.status] || STATUS_STYLE.enquiry;
  const Icon = st.icon;

  const svcTotal = (b.pricing?.subtotal || 0) + (b.pricing?.serviceCGST || 0) + (b.pricing?.serviceSGST || 0);
  const platTotal = (b.pricing?.platformFee || 0) + (b.pricing?.platformFeeGST || 0);
  const grandTotal = b.pricing?.total || 0;

  const handlePrint = () => {
    const content = printRef.current?.innerHTML;
    if (!content) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(`<html><head><title>Booking ${bNum}</title><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',Arial,sans-serif;padding:24px;color:#111;font-size:12px}
      table{width:100%;border-collapse:collapse;margin-bottom:12px}
      th,td{border:1px solid #e5e7eb;padding:7px 10px;text-align:left}
      th{background:#f9fafb;font-weight:700;font-size:11px}
      .text-right{text-align:right} .text-center{text-align:center}
      .badge{display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700}
      .grid2{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
      .card{border:1px solid #e5e7eb;border-radius:8px;padding:12px}
      .label{font-size:9px;color:#9ca3af;text-transform:uppercase;font-weight:700;margin-bottom:6px}
      .total-row{display:flex;justify-content:space-between;padding:3px 0;font-size:11px}
      .grand{font-size:16px;font-weight:900;color:#F59E0B}
    </style></head><body>${content}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const handleDownloadPDF = async () => {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const container = document.createElement('div');
      container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;z-index:-1;padding:32px';
      container.innerHTML = printRef.current?.innerHTML || '';
      document.body.appendChild(container);
      await new Promise(r => setTimeout(r, 300));
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false, width: 794, windowWidth: 794 });
      document.body.removeChild(container);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      const pageH = pdf.internal.pageSize.getHeight();
      if (pdfH <= pageH) { pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pdfW, pdfH); }
      else { let y = 0; while (y < pdfH) { if (y > 0) pdf.addPage(); pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, -y, pdfW, pdfH); y += pageH; } }
      pdf.save(`ServiceBooking-${bNum}.pdf`);
    } catch { alert('PDF generation failed. Please try Print instead.'); }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0 bg-gradient-to-r from-primary-50 to-orange-50 rounded-t-2xl">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Service Booking</h2>
            <code className="text-xs font-mono text-primary-600 bg-white px-2 py-0.5 rounded border border-primary-200 mt-0.5 inline-block">{bNum}</code>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-semibold transition-colors">
              <Printer className="w-3.5 h-3.5" /> Print
            </button>
            <button onClick={handleDownloadPDF} className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold transition-colors">
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/80 rounded-xl transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5" ref={printRef}>

          {/* Status badges + change */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold ${st.cls}`}>
              <Icon className="w-3.5 h-3.5" />{st.label}
            </span>
            {b.paymentStatus && (
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${PAY_STYLE[b.paymentStatus] || PAY_STYLE.pending}`}>
                <CreditCard className="w-3 h-3 inline mr-1" />{b.paymentStatus}
              </span>
            )}
            {b.eventDate && (
              <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                <Calendar className="w-3 h-3" />
                {new Date(b.eventDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            )}
            {canChangeStatus && onStatusChange && (
              <div className="ml-auto">
                <select value={b.status} onChange={e => onStatusChange(b._id, e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="enquiry">Enquiry</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            )}
          </div>

          {/* Customer + Service */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-xs font-bold text-blue-800 uppercase mb-3 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Customer Details
              </p>
              <p className="font-semibold text-gray-900 text-sm">{b.customerInfo?.name || '—'}</p>
              {b.customerInfo?.company && <p className="text-xs text-gray-600 mt-0.5">{b.customerInfo.company}</p>}
              <p className="text-xs text-gray-600 mt-0.5">{b.customerInfo?.email}</p>
              <p className="text-xs text-gray-600">{b.customerInfo?.phone}</p>
              {b.customerInfo?.eventName && (
                <p className="text-xs text-gray-700 mt-2 bg-white rounded-lg px-2 py-1 border border-blue-100">
                  Event: <strong>{b.customerInfo.eventName}</strong>
                </p>
              )}
              {b.customerInfo?.notes && (
                <p className="text-xs text-gray-500 mt-1 italic">"{b.customerInfo.notes}"</p>
              )}
            </div>

            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
              <p className="text-xs font-bold text-yellow-800 uppercase mb-3 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" /> Service Provider
              </p>
              <p className="font-semibold text-gray-900 text-sm">{b.serviceSnapshot?.title || b.service?.title || '—'}</p>
              <p className="text-xs text-gray-600">{b.serviceSnapshot?.category}</p>
              {b.serviceSnapshot?.companyName && <p className="text-xs text-gray-600">{b.serviceSnapshot.companyName}</p>}
              {(b.serviceSnapshot?.city || b.serviceSnapshot?.state) && (
                <p className="text-xs text-gray-600 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {[b.serviceSnapshot?.city, b.serviceSnapshot?.state].filter(Boolean).join(', ')}
                </p>
              )}
              {(b.vendor?.name || b.vendor?.companyName) && (
                <p className="text-xs text-gray-500 mt-1">
                  Vendor: {b.vendor?.companyName || b.vendor?.name}
                </p>
              )}
            </div>
          </div>

          {/* Items Table */}
          {b.items?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5" /> Selected Services
              </p>
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Service</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Rate</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-gray-500">Qty</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.items.map((item, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 text-xs">{item.name}<div className="text-[10px] text-gray-400">{item.unit}</div></td>
                        <td className="px-3 py-2 text-xs text-right">₹{(item.price || 0).toLocaleString()}</td>
                        <td className="px-3 py-2 text-xs text-center font-semibold">{item.quantity}</td>
                        <td className="px-3 py-2 text-xs text-right font-semibold text-primary-600">₹{(item.amount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Price Breakdown */}
          {b.pricing && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-xs space-y-1.5">
                <p className="font-bold text-blue-800 mb-2">📄 Service Invoice</p>
                <div className="flex justify-between text-gray-600"><span>Service Amount</span><span>₹{(b.pricing.subtotal || 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-gray-600"><span>CGST ({b.pricing.cgstPct || 0}%)</span><span>₹{(b.pricing.serviceCGST || 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-gray-600"><span>SGST ({b.pricing.sgstPct || 0}%)</span><span>₹{(b.pricing.serviceSGST || 0).toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-blue-900 border-t border-blue-200 pt-1.5 mt-1">
                  <span>Service Total</span><span>₹{svcTotal.toLocaleString()}</span>
                </div>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 text-xs space-y-1.5">
                <p className="font-bold text-purple-800 mb-2">📄 Platform Invoice</p>
                <div className="flex justify-between text-gray-600"><span>Platform Fee ({b.pricing.platformFeePct || 0}%)</span><span>₹{(b.pricing.platformFee || 0).toLocaleString()}</span></div>
                <div className="flex justify-between text-gray-600"><span>Platform GST</span><span>₹{(b.pricing.platformFeeGST || 0).toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-purple-900 border-t border-purple-200 pt-1.5 mt-1">
                  <span>Platform Total</span><span>₹{platTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Coupon + Grand Total */}
          <div className="bg-gradient-to-r from-primary-50 to-orange-50 rounded-xl p-4 border border-primary-200">
            {b.coupon?.code && (
              <div className="flex justify-between text-sm text-green-700 mb-3 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Tag className="w-3.5 h-3.5" /> Coupon Applied: <strong>{b.coupon.code}</strong>
                </span>
                <span className="font-bold">- ₹{(b.coupon.discountAmount || 0).toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Grand Total</p>
                <p className="text-3xl font-black text-primary-600">₹{grandTotal.toLocaleString()}</p>
              </div>
              <div className="text-right text-xs text-gray-500 space-y-0.5">
                <p>Service: ₹{svcTotal.toLocaleString()}</p>
                <p>Platform: ₹{platTotal.toLocaleString()}</p>
                {b.coupon?.discountAmount > 0 && <p className="text-green-600">Discount: -₹{b.coupon.discountAmount.toLocaleString()}</p>}
              </div>
            </div>
          </div>

          {/* Payment Details */}
          {b.paymentDetails?.razorpay_payment_id && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-100 text-xs">
              <p className="font-bold text-green-800 mb-2 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" /> Payment Details
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <p className="text-gray-600">Payment ID: <code className="font-mono bg-white px-1 rounded">{b.paymentDetails.razorpay_payment_id}</code></p>
                <p className="text-gray-600">Order ID: <code className="font-mono bg-white px-1 rounded">{b.paymentDetails.razorpay_order_id}</code></p>
                {b.paymentDetails.paidAt && <p className="text-gray-600">Paid At: <strong>{new Date(b.paymentDetails.paidAt).toLocaleString('en-IN')}</strong></p>}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
