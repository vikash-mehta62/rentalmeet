'use client';
import { useParams } from 'next/navigation';
import { useState, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowLeft, Star, MapPin, BadgeCheck, Download, FileText, Package } from 'lucide-react';
import { vendors, serviceCategories } from '@/lib/vendorData';

export default function VendorProfile() {
  const { id } = useParams();
  const printRef = useRef(null);
  const vendor = vendors.find(v => v.id === id);
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', eventDate: '', eventName: '', notes: '' });
  const [quantities, setQuantities] = useState({});
  const [showQuotation, setShowQuotation] = useState(false);

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">Vendor Not Found</h2>
          <Link href="/other-services" className="text-yellow-500 hover:underline text-sm">Back to Services</Link>
        </div>
      </div>
    );
  }

  const cat = serviceCategories.find(c => c.id === vendor.category);
  const subtotal = vendor.services.reduce((sum, svc, i) => sum + svc.rate * (quantities[i] || 0), 0);
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const quoteNo = 'QT-' + String(id).toUpperCase() + '-' + Date.now().toString().slice(-4);

  const handlePrint = () => {
    const content = printRef.current ? printRef.current.innerHTML : '';
    if (!content) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write('<html><head><title>Quotation</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#111}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px}th{background:#f5f5f5}img{max-height:48px}</style></head><body>' + content + '</body></html>');
    w.document.close();
    w.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <Navbar />
      <div className="pt-28 lg:pt-32 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/other-services" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Premium Services
          </Link>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-lg">
                <img src={vendor.image} alt={vendor.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <span className="bg-green-600 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-white" />{vendor.rating}
                  </span>
                  <span className="text-white text-xs">({vendor.reviews} Reviews)</span>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">{vendor.name}</h1>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-yellow-500" />{vendor.location}</span>
                  <span className="flex items-center gap-1 text-green-600"><BadgeCheck className="w-4 h-4" />Verified Vendor</span>
                  {cat && <span className="px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-full text-xs font-semibold">{cat.label}</span>}
                </div>
                <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">{vendor.description}</p>
                <div className="flex flex-wrap gap-2">
                  {vendor.tags.map(tag => (<span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">{tag}</span>))}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800">
                <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-yellow-500" /> Services & Rate List
                </h3>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-800">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-gray-500 font-semibold">Service</th>
                        <th className="text-right px-4 py-2.5 text-gray-500 font-semibold">Rate</th>
                        <th className="text-right px-4 py-2.5 text-gray-500 font-semibold">Unit</th>
                        <th className="text-center px-4 py-2.5 text-gray-500 font-semibold">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendor.services.map((svc, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-gray-50 dark:bg-slate-800/50'}>
                          <td className="px-4 py-2.5 text-gray-800 dark:text-slate-200">{svc.name}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-yellow-600">Rs.{svc.rate.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-right text-gray-400 text-xs">{svc.unit}</td>
                          <td className="px-4 py-2.5 text-center">
                            <input type="number" min="0" value={quantities[i] || 0}
                              onChange={e => setQuantities(prev => ({ ...prev, [i]: Math.max(0, parseInt(e.target.value) || 0) }))}
                              className="w-16 text-center border border-gray-300 rounded-lg px-2 py-1 text-xs" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {subtotal > 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200 space-y-1.5">
                    <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>Rs.{subtotal.toLocaleString()}</span></div>
                    <div className="flex justify-between text-sm text-gray-600"><span>GST (18%)</span><span>Rs.{gst.toLocaleString()}</span></div>
                    <div className="flex justify-between font-bold text-base text-gray-900 pt-1.5 border-t border-yellow-200">
                      <span>Total</span><span className="text-yellow-600">Rs.{total.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="sticky top-28 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-gray-100 dark:border-slate-800 shadow-lg space-y-3">
                <h3 className="font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-yellow-500" /> Get Quotation
                </h3>
                {['name','company','email','phone','eventName','eventDate'].map(key => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1 capitalize">{key.replace(/([A-Z])/g,' ')}</label>
                    <input type={key==='eventDate'?'date':key==='email'?'email':key==='phone'?'tel':'text'}
                      value={form[key]} onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-400 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100" />
                  </div>
                ))}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Notes</label>
                  <textarea rows={2} value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 resize-none" />
                </div>
                <button onClick={() => { if (!form.name.trim()) { alert('Please enter your name'); return; } setShowQuotation(true); setTimeout(() => document.getElementById('qt')?.scrollIntoView({ behavior: 'smooth' }), 100); }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl font-bold text-sm transition-colors">
                  <FileText className="w-4 h-4" /> Generate Quotation
                </button>
                <p className="text-center text-xs text-gray-400">Starting from <strong className="text-yellow-600">Rs.{vendor.startingPrice.toLocaleString()}</strong> {vendor.priceUnit}</p>
              </div>
            </div>
          </div>
          {showQuotation && (
            <div id="qt" className="mt-8 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <h3 className="font-bold text-xl text-gray-900 dark:text-slate-100">Quotation Preview</h3>
                <button onClick={handlePrint} className="flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl text-sm font-bold">
                  <Download className="w-4 h-4" /> Download / Print PDF
                </button>
              </div>
              <div ref={printRef} className="space-y-5">
                <div className="flex items-start justify-between flex-wrap gap-4 pb-4 border-b border-gray-200">
                  <div>
                    <img src="/logo.png" alt="RentalMeet" className="h-12 w-auto object-contain mb-2" />
                    <p className="text-xs text-gray-500">Quote No: <strong>{quoteNo}</strong></p>
                    <p className="text-xs text-gray-500">Date: {today}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{vendor.name}</p>
                    <p className="text-xs text-gray-500">{vendor.location}</p>
                    {cat && <p className="text-xs text-gray-500">{cat.label}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs font-bold text-gray-400 mb-1">CLIENT</p>
                    <p className="font-semibold">{form.name}</p>
                    {form.company && <p className="text-gray-500 text-xs">{form.company}</p>}
                    {form.email && <p className="text-gray-500 text-xs">{form.email}</p>}
                    {form.phone && <p className="text-gray-500 text-xs">{form.phone}</p>}
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs font-bold text-gray-400 mb-1">EVENT</p>
                    {form.eventName && <p className="font-semibold">{form.eventName}</p>}
                    {form.eventDate && <p className="text-gray-500 text-xs">{form.eventDate}</p>}
                    {form.notes && <p className="text-gray-500 text-xs mt-1">{form.notes}</p>}
                  </div>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50"><tr>
                      <th className="text-left px-4 py-2.5 text-gray-500 font-semibold">Service</th>
                      <th className="text-right px-4 py-2.5 text-gray-500 font-semibold">Rate</th>
                      <th className="text-center px-4 py-2.5 text-gray-500 font-semibold">Qty</th>
                      <th className="text-right px-4 py-2.5 text-gray-500 font-semibold">Amount</th>
                    </tr></thead>
                    <tbody>
                      {vendor.services.map((svc, i) => {
                        const qty = quantities[i] || 0;
                        if (!qty) return null;
                        return (
                          <tr key={i} className="border-t border-gray-100">
                            <td className="px-4 py-2.5">{svc.name}</td>
                            <td className="px-4 py-2.5 text-right">Rs.{svc.rate.toLocaleString()}</td>
                            <td className="px-4 py-2.5 text-center">{qty} {svc.unit}</td>
                            <td className="px-4 py-2.5 text-right font-semibold text-yellow-600">Rs.{(svc.rate * qty).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end">
                  <div className="w-64 space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>Rs.{subtotal.toLocaleString()}</span></div>
                    <div className="flex justify-between text-gray-600"><span>GST (18%)</span><span>Rs.{gst.toLocaleString()}</span></div>
                    <div className="flex justify-between font-bold text-base text-gray-900 pt-2 border-t border-gray-200">
                      <span>Total</span><span className="text-yellow-600">Rs.{total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center pt-2 border-t border-gray-100">Non-binding quotation. Valid 7 days. Final pricing subject to confirmation. — RentalMeet</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}