'use client';

import { useState, useMemo } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Utensils, Sparkles, Camera, ShieldAlert, Star, Music,
  Flower2, Truck, Filter, X, Search, MapPin, User, Heart,
  Package, Calendar, IndianRupee, Building2, Phone, Mail,
  CheckCircle2, BadgeCheck, Printer, Plus, Minus, FileText,
  ChevronDown, ChevronUp
} from 'lucide-react';

const serviceCategories = [
  { id: 'catering',      label: 'Catering',           icon: Utensils,    bg: '#FFF3E0', iconColor: '#E65100', border: '#FFB74D' },
  { id: 'makeup',        label: 'Makeup & Beauty',    icon: Sparkles,    bg: '#FCE4EC', iconColor: '#C2185B', border: '#F48FB1' },
  { id: 'photography',   label: 'Photography',        icon: Camera,      bg: '#E3F2FD', iconColor: '#1565C0', border: '#90CAF9' },
  { id: 'entertainment', label: 'Entertainment',      icon: Music,       bg: '#F3E5F5', iconColor: '#6A1B9A', border: '#CE93D8' },
  { id: 'decor',         label: 'Decor & Floral',     icon: Flower2,     bg: '#E8F5E9', iconColor: '#2E7D32', border: '#A5D6A7' },
  { id: 'security',      label: 'Security',           icon: ShieldAlert, bg: '#FFEBEE', iconColor: '#B71C1C', border: '#EF9A9A' },
  { id: 'celebrity',     label: 'Celebrity',          icon: Star,        bg: '#FFFDE7', iconColor: '#F57F17', border: '#FFF176' },
  { id: 'logistics',     label: 'Logistics & Support',icon: Truck,       bg: '#E0F7FA', iconColor: '#00695C', border: '#80DEEA' },
];

const vendors = [
  { id: 'v1', category: 'catering', name: 'Royal Flavors Catering', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80', description: 'Premium multi-cuisine catering for corporate and social events. Serving 50-5000 guests with live counters and buffet setups.', tags: ['North Indian', 'Continental', 'Live Counters', 'Buffet'], rating: 4.5, reviews: 120, location: 'Bhopal, MP', startingPrice: 450, priceUnit: 'Per Plate', services: [{ name: 'Veg Buffet (Basic)', rate: 450, unit: 'Per Plate' }, { name: 'Veg Buffet (Premium)', rate: 650, unit: 'Per Plate' }, { name: 'Non-Veg Buffet', rate: 850, unit: 'Per Plate' }, { name: 'Live Counter Setup', rate: 5000, unit: 'Per Counter' }, { name: 'Welcome Drinks', rate: 50, unit: 'Per Person' }, { name: 'Dessert Station', rate: 100, unit: 'Per Person' }] },
  { id: 'v2', category: 'catering', name: 'Spice Garden Events', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80', description: 'Authentic flavors with modern presentation. Specializing in South Indian and fusion cuisine for weddings and conferences.', tags: ['South Indian', 'Fusion', 'Wedding Catering'], rating: 4.3, reviews: 85, location: 'Bhopal, MP', startingPrice: 350, priceUnit: 'Per Plate', services: [{ name: 'South Indian Thali', rate: 350, unit: 'Per Plate' }, { name: 'Fusion Buffet', rate: 550, unit: 'Per Plate' }, { name: 'Wedding Full Catering', rate: 900, unit: 'Per Plate' }, { name: 'Tea / Coffee Service', rate: 30, unit: 'Per Person' }] },
  { id: 'v3', category: 'makeup', name: 'Glow Studio by Priya', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80', description: 'Award-winning bridal and party makeup artists. HD techniques for every skin tone. On-location services available.', tags: ['Bridal', 'HD Makeup', 'Party', 'On-Location'], rating: 4.8, reviews: 210, location: 'Bhopal, MP', startingPrice: 5000, priceUnit: 'Per Session', services: [{ name: 'Basic Glam Makeup', rate: 5000, unit: 'Per Person' }, { name: 'HD Party Makeup', rate: 8000, unit: 'Per Person' }, { name: 'Bridal Makeup (Full)', rate: 18000, unit: 'Per Person' }, { name: 'Hairstyling', rate: 3000, unit: 'Per Person' }, { name: 'Pre-Bridal Package', rate: 12000, unit: 'Per Session' }] },
  { id: 'v4', category: 'makeup', name: 'Modern Bride Artists', image: 'https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=800&q=80', description: 'Contemporary bridal looks with traditional charm. Expert in corporate grooming and event makeup.', tags: ['Corporate', 'Bridal', 'Event Makeup'], rating: 4.4, reviews: 95, location: 'Indore, MP', startingPrice: 3500, priceUnit: 'Per Session', services: [{ name: 'Corporate Grooming', rate: 3500, unit: 'Per Person' }, { name: 'Event Makeup', rate: 5500, unit: 'Per Person' }, { name: 'Bridal Makeup', rate: 15000, unit: 'Per Person' }, { name: 'Saree/Draping', rate: 2000, unit: 'Per Person' }] },
  { id: 'v5', category: 'photography', name: 'Pixel Perfect Studios', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80', description: 'Cinematic storytelling for weddings and corporate events. Candid photography with drone aerial shots.', tags: ['Candid', 'Drone', 'Cinematic', 'Corporate'], rating: 4.7, reviews: 180, location: 'Bhopal, MP', startingPrice: 15000, priceUnit: 'Per Event', services: [{ name: 'Basic Photo Coverage (4 hrs)', rate: 15000, unit: 'Per Event' }, { name: 'Full Day Photography', rate: 25000, unit: 'Per Day' }, { name: 'Drone Aerial Shoot', rate: 10000, unit: 'Per Session' }, { name: 'Cinematic Video', rate: 20000, unit: 'Per Event' }, { name: 'Photo Album (40 pages)', rate: 8000, unit: 'Per Album' }, { name: 'Same Day Edit (SDE)', rate: 12000, unit: 'Per Event' }] },
  { id: 'v6', category: 'photography', name: 'Cinematic Stories', image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80', description: 'Award-winning wedding films and event highlights. Traditional + candid photography packages available.', tags: ['Wedding Films', 'Traditional', 'Candid'], rating: 4.6, reviews: 140, location: 'Bhopal, MP', startingPrice: 20000, priceUnit: 'Per Event', services: [{ name: 'Photography Only', rate: 20000, unit: 'Per Event' }, { name: 'Videography Only', rate: 25000, unit: 'Per Event' }, { name: 'Photo + Video Combo', rate: 40000, unit: 'Per Event' }, { name: 'Highlight Reel (3-5 min)', rate: 8000, unit: 'Per Video' }, { name: 'Pre-Wedding Shoot', rate: 15000, unit: 'Per Session' }] },
  { id: 'v7', category: 'entertainment', name: 'Vibe Entertainment', image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80', description: 'Live bands, DJs, and solo performers for all event types. Curated playlists and custom setlists.', tags: ['Live Bands', 'DJs', 'Solo Singers'], rating: 4.5, reviews: 160, location: 'Bhopal, MP', startingPrice: 10000, priceUnit: 'Per Event', services: [{ name: 'DJ Set (4 hrs)', rate: 10000, unit: 'Per Event' }, { name: 'Live Band (3 hrs)', rate: 25000, unit: 'Per Event' }, { name: 'Solo Singer', rate: 15000, unit: 'Per Event' }, { name: 'Sound System Setup', rate: 8000, unit: 'Per Event' }, { name: 'LED Dance Floor', rate: 12000, unit: 'Per Event' }] },
  { id: 'v8', category: 'entertainment', name: 'Indie Artists Hub', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80', description: 'Platform for indie artists, stand-up comedians, and dance troupes. Perfect for corporate events and private functions.', tags: ['Stand-up Comedy', 'Dance Troupes', 'Indie Music'], rating: 4.2, reviews: 72, location: 'Indore, MP', startingPrice: 7000, priceUnit: 'Per Event', services: [{ name: 'Stand-up Comedy (1 hr)', rate: 7000, unit: 'Per Show' }, { name: 'Dance Troupe (6 members)', rate: 18000, unit: 'Per Show' }, { name: 'Indie Band Performance', rate: 12000, unit: 'Per Show' }, { name: 'Flash Mob', rate: 20000, unit: 'Per Event' }] },
  { id: 'v9', category: 'decor', name: 'Decor Dreams', image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80', description: 'Theme-based venue decoration with fresh and artificial floral arrangements. Stage, entrance, and table décor specialists.', tags: ['Stage Decor', 'Floral', 'Theme-Based', 'Table Decor'], rating: 4.6, reviews: 195, location: 'Bhopal, MP', startingPrice: 8000, priceUnit: 'Per Event', services: [{ name: 'Stage Decoration (Basic)', rate: 8000, unit: 'Per Event' }, { name: 'Stage Decoration (Premium)', rate: 18000, unit: 'Per Event' }, { name: 'Entrance Arch', rate: 5000, unit: 'Per Arch' }, { name: 'Table Centerpieces', rate: 800, unit: 'Per Table' }, { name: 'Fresh Floral Arrangements', rate: 3000, unit: 'Per Setup' }, { name: 'Balloon Decor', rate: 4000, unit: 'Per Area' }] },
  { id: 'v10', category: 'security', name: 'Guardian Shield Security', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80', description: 'Licensed security personnel for events of all sizes. Crowd management, VIP detail, and CCTV surveillance setup.', tags: ['Bouncers', 'CCTV', 'VIP Detail', 'Crowd Management'], rating: 4.4, reviews: 88, location: 'Bhopal, MP', startingPrice: 800, priceUnit: 'Per Guard/Day', services: [{ name: 'Security Guard', rate: 800, unit: 'Per Guard/Day' }, { name: 'Bouncer', rate: 1500, unit: 'Per Person/Day' }, { name: 'VIP Security Detail', rate: 5000, unit: 'Per Day' }, { name: 'CCTV Setup (8 cameras)', rate: 8000, unit: 'Per Event' }, { name: 'Crowd Manager', rate: 1200, unit: 'Per Person/Day' }] },
  { id: 'v11', category: 'celebrity', name: 'Star Appearances Agency', image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80', description: 'Book Bollywood actors, TV personalities, and social media influencers for your events. Verified bookings with confirmed appearances.', tags: ['Bollywood', 'TV Stars', 'Influencers', 'Brand Ambassadors'], rating: 4.9, reviews: 45, location: 'Pan India', startingPrice: 50000, priceUnit: 'Per Appearance', services: [{ name: 'Meet & Greet (30 min)', rate: 50000, unit: 'Per Appearance' }, { name: 'Stage Performance (1 hr)', rate: 150000, unit: 'Per Event' }, { name: 'Brand Ambassador (1 day)', rate: 250000, unit: 'Per Day' }, { name: 'Social Media Shoutout', rate: 30000, unit: 'Per Post' }, { name: 'Influencer (Micro)', rate: 15000, unit: 'Per Event' }] },
  { id: 'v12', category: 'logistics', name: 'Elite Logistics Solutions', image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80', description: 'End-to-end event logistics — shuttle services, luxury car rentals, professional hosts, and on-site staffing.', tags: ['Shuttle', 'Luxury Cars', 'Hosts', 'Waiters', 'Bartenders'], rating: 4.3, reviews: 110, location: 'Bhopal, MP', startingPrice: 2000, priceUnit: 'Per Service', services: [{ name: 'Shuttle Bus (AC, 32-seater)', rate: 5000, unit: 'Per Trip' }, { name: 'Luxury Car Rental', rate: 3000, unit: 'Per Car/Day' }, { name: 'Host/Hostess', rate: 2000, unit: 'Per Person/Day' }, { name: 'Waiter/Server', rate: 800, unit: 'Per Person/Day' }, { name: 'Bartender', rate: 1500, unit: 'Per Person/Day' }, { name: 'Event Clean-up Crew', rate: 5000, unit: 'Per Event' }] },
];

const BUDGET_MIN = 0;
const BUDGET_MAX = 1000000;

// ── Vendor Profile Modal ──────────────────────────────────────────────────
function VendorProfileModal({ vendor, onClose, onBook }) {
  const cat = serviceCategories.find(c => c.id === vendor.category);
  const Icon = cat?.icon ?? Package;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Image */}
        <div className="relative aspect-[16/7] overflow-hidden rounded-t-2xl">
          <img src={vendor.image} alt={vendor.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 fill-white" />{vendor.rating}
            </span>
            <span className="text-white text-xs">({vendor.reviews} Reviews)</span>
          </div>
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center hover:bg-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <h2 className="text-2xl font-black text-gray-900">{vendor.name}</h2>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-primary-500" />{vendor.location}</span>
            <span className="flex items-center gap-1"><Icon className="w-4 h-4 text-primary-500" />{cat?.label}</span>
            <span className="flex items-center gap-1 text-green-600"><BadgeCheck className="w-4 h-4" />Verified Vendor</span>
          </div>
          <p className="text-gray-600 leading-relaxed">{vendor.description}</p>
          <div className="flex flex-wrap gap-2">
            {vendor.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{tag}</span>
            ))}
          </div>

          {/* Rate Table */}
          <div>
            <h4 className="font-bold text-gray-900 mb-2">Services & Rate List</h4>
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-gray-500 font-medium">Service</th>
                    <th className="text-right px-3 py-2 text-gray-500 font-medium">Rate</th>
                    <th className="text-right px-3 py-2 text-gray-500 font-medium">Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {vendor.services.map((svc, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-2">{svc.name}</td>
                      <td className="px-3 py-2 text-right font-semibold text-primary-600">₹{svc.rate.toLocaleString()}</td>
                      <td className="px-3 py-2 text-right text-gray-400 text-xs">{svc.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4 pt-2 border-t">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Starting from</p>
              <p className="text-2xl font-black text-gray-900">₹{vendor.startingPrice.toLocaleString()} <span className="text-sm font-normal text-gray-400">{vendor.priceUnit}</span></p>
            </div>
            <div className="flex gap-2">
              <a href="tel:+919425796767" className="flex items-center gap-1.5 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:border-primary-500 hover:text-primary-500 transition-all">
                <Phone className="w-4 h-4" />Call
              </a>
              <a href="mailto:booking@rentalmeet.in" className="flex items-center gap-1.5 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:border-primary-500 hover:text-primary-500 transition-all">
                <Mail className="w-4 h-4" />Email
              </a>
              <button onClick={() => { onClose(); onBook(); }} className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all">
                <Calendar className="w-4 h-4" />Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Quotation View ────────────────────────────────────────────────────────
function QuotationView({ vendor, form, onPrint }) {
  const selectedItems = vendor.services.filter((_, i) => (form.quantities[i] ?? 0) > 0);
  const subtotal = vendor.services.reduce((sum, svc, i) => sum + svc.rate * (form.quantities[i] ?? 0), 0);
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const quoteNo = `QT-${Date.now().toString().slice(-6)}`;
  const cat = serviceCategories.find(c => c.id === vendor.category);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1"><FileText className="w-5 h-5 text-primary-500" /><h3 className="text-xl font-black">Quotation</h3></div>
          <p className="text-xs text-gray-500">Quote No: <span className="font-medium">{quoteNo}</span></p>
          <p className="text-xs text-gray-500">Date: {today}</p>
        </div>
        <button onClick={onPrint} className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:border-primary-500 hover:text-primary-500 transition-all">
          <Printer className="w-4 h-4" />Print / Save PDF
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="p-3 rounded-xl bg-gray-50">
          <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Service Provider</p>
          <p className="font-semibold">{vendor.name}</p>
          <p className="text-gray-500 text-xs">{vendor.location}</p>
          <p className="text-gray-500 text-xs">{cat?.label}</p>
        </div>
        <div className="p-3 rounded-xl bg-gray-50">
          <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Client Details</p>
          <p className="font-semibold">{form.name || '—'}</p>
          {form.company && <p className="text-gray-500 text-xs">{form.company}</p>}
          <p className="text-gray-500 text-xs">{form.email || '—'}</p>
          <p className="text-gray-500 text-xs">{form.phone || '—'}</p>
        </div>
      </div>

      {form.eventName && (
        <div className="flex gap-4 text-sm px-1 flex-wrap">
          <span className="text-gray-500">Event:</span><span className="font-medium">{form.eventName}</span>
          {form.eventDate && <><span className="text-gray-500">Date:</span><span className="font-medium">{new Date(form.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></>}
        </div>
      )}

      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2 text-gray-500 font-medium">Service</th>
              <th className="text-right px-3 py-2 text-gray-500 font-medium">Rate</th>
              <th className="text-right px-3 py-2 text-gray-500 font-medium">Qty</th>
              <th className="text-right px-3 py-2 text-gray-500 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {selectedItems.map((svc, idx) => {
              const origIdx = vendor.services.indexOf(svc);
              const qty = form.quantities[origIdx] ?? 0;
              return (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2">{svc.name}<div className="text-[10px] text-gray-400">{svc.unit}</div></td>
                  <td className="px-3 py-2 text-right">₹{svc.rate.toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">{qty}</td>
                  <td className="px-3 py-2 text-right font-semibold">₹{(svc.rate * qty).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t">
            <tr><td colSpan={3} className="px-3 py-1.5 text-right text-sm text-gray-500">Subtotal</td><td className="px-3 py-1.5 text-right font-medium">₹{subtotal.toLocaleString()}</td></tr>
            <tr><td colSpan={3} className="px-3 py-1.5 text-right text-sm text-gray-500">GST (18%)</td><td className="px-3 py-1.5 text-right font-medium">₹{gst.toLocaleString()}</td></tr>
            <tr className="bg-primary-50">
              <td colSpan={3} className="px-3 py-2 text-right font-bold">Total</td>
              <td className="px-3 py-2 text-right font-black text-primary-600 text-lg">₹{total.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {form.message && (
        <div className="p-3 rounded-xl bg-gray-50 text-sm">
          <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Special Requirements</p>
          <p className="text-gray-600">{form.message}</p>
        </div>
      )}
      <p className="text-[10px] text-gray-400">This is a preliminary quotation. Final pricing subject to confirmation.</p>
    </div>
  );
}

// ── Booking Modal ─────────────────────────────────────────────────────────
function VendorBookingModal({ vendor, onClose }) {
  const [showQuotation, setShowQuotation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', eventDate: '', eventName: '', message: '', quantities: {} });

  const setQty = (idx, delta) => {
    setForm(f => {
      const curr = f.quantities[idx] ?? 0;
      const next = Math.max(0, curr + delta);
      return { ...f, quantities: { ...f.quantities, [idx]: next } };
    });
  };

  const subtotal = vendor.services.reduce((sum, svc, i) => sum + svc.rate * (form.quantities[i] ?? 0), 0);
  const gst = Math.round(subtotal * 0.18);
  const total = subtotal + gst;
  const hasItems = subtotal > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.eventDate) return alert('Please fill all required fields.');
    if (!hasItems) return alert('Please add at least one service with quantity.');
    setSubmitting(true);
    setTimeout(() => { setSubmitting(false); setSubmitted(true); }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            {showQuotation ? <><FileText className="w-5 h-5 text-primary-500" />Quotation — {vendor.name}</> : <>Book {vendor.name}</>}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-9 h-9 text-green-600" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Booking Request Sent!</h3>
              <p className="text-gray-500 mb-6">{vendor.name} will contact you within 24 hours.</p>
              <button onClick={onClose} className="px-6 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 transition-all">Close</button>
            </div>
          ) : showQuotation ? (
            <div className="space-y-4">
              <QuotationView vendor={vendor} form={form} onPrint={() => window.print()} />
              <div className="flex gap-3 pt-2 border-t">
                <button onClick={() => setShowQuotation(false)} className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all">Back to Form</button>
                <button onClick={handleSubmit} disabled={submitting} className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-60">
                  {submitting ? 'Sending...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Starting price badge */}
              <div className="p-3 rounded-xl bg-primary-50 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Starting from</p>
                  <p className="font-black text-lg text-gray-900">₹{vendor.startingPrice.toLocaleString()} <span className="text-xs font-normal text-gray-400">{vendor.priceUnit}</span></p>
                </div>
                <span className="px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-full text-xs font-semibold">
                  {serviceCategories.find(c => c.id === vendor.category)?.label}
                </span>
              </div>

              {/* Form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'name', label: 'Full Name *', placeholder: 'John Doe', type: 'text', key: 'name' },
                  { id: 'company', label: 'Company / Organisation', placeholder: 'ABC Corp', type: 'text', key: 'company' },
                  { id: 'email', label: 'Email *', placeholder: 'john@example.com', type: 'email', key: 'email' },
                  { id: 'phone', label: 'Phone *', placeholder: '+91 00000 00000', type: 'tel', key: 'phone' },
                  { id: 'event', label: 'Event Name', placeholder: 'Annual Conference 2026', type: 'text', key: 'eventName' },
                  { id: 'date', label: 'Event Date *', placeholder: '', type: 'date', key: 'eventDate' },
                ].map(f => (
                  <div key={f.id}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm outline-none" />
                  </div>
                ))}
              </div>

              {/* Services table */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Services & Quantity</label>
                <div className="rounded-xl border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-3 py-2 text-gray-500 font-medium">Service</th>
                        <th className="text-right px-3 py-2 text-gray-500 font-medium">Rate</th>
                        <th className="text-center px-3 py-2 text-gray-500 font-medium w-28">Qty</th>
                        <th className="text-right px-3 py-2 text-gray-500 font-medium">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendor.services.map((svc, i) => {
                        const qty = form.quantities[i] ?? 0;
                        return (
                          <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-3 py-2"><p>{svc.name}</p><p className="text-[10px] text-gray-400">{svc.unit}</p></td>
                            <td className="px-3 py-2 text-right text-primary-600 font-medium">₹{svc.rate.toLocaleString()}</td>
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-center gap-1">
                                <button type="button" onClick={() => setQty(i, -1)} disabled={qty === 0}
                                  className="w-7 h-7 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 transition-all">
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-7 text-center font-bold text-sm">{qty}</span>
                                <button type="button" onClick={() => setQty(i, 1)}
                                  className="w-7 h-7 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-all">
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right font-semibold">{qty > 0 ? `₹${(svc.rate * qty).toLocaleString()}` : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {hasItems && (
                      <tfoot className="border-t">
                        <tr><td colSpan={3} className="px-3 py-1.5 text-right text-gray-500 text-xs">Subtotal</td><td className="px-3 py-1.5 text-right font-medium text-sm">₹{subtotal.toLocaleString()}</td></tr>
                        <tr><td colSpan={3} className="px-3 py-1.5 text-right text-gray-500 text-xs">GST (18%)</td><td className="px-3 py-1.5 text-right font-medium text-sm">₹{gst.toLocaleString()}</td></tr>
                        <tr className="bg-primary-50">
                          <td colSpan={3} className="px-3 py-2 text-right font-bold">Total</td>
                          <td className="px-3 py-2 text-right font-black text-primary-600">₹{total.toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Special Requirements</label>
                <textarea rows={3} placeholder="Any specific requirements..." value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm outline-none resize-none" />
              </div>

              <p className="text-[10px] text-gray-400">GST @ 18% applicable. Lightweight changes free after confirmation.</p>

              <div className="flex gap-3 flex-wrap">
                <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all">Cancel</button>
                <button type="button" onClick={() => setShowQuotation(true)} disabled={!hasItems}
                  className="flex-1 px-4 py-3 border-2 border-primary-500 text-primary-500 rounded-xl font-semibold hover:bg-primary-50 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />Generate Quotation
                </button>
                <button type="submit" disabled={submitting || !hasItems}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all disabled:opacity-60">
                  {submitting ? 'Sending...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Vendor Card ───────────────────────────────────────────────────────────
function VendorCard({ vendor, isFavorite, onToggleFavorite }) {
  const cat = serviceCategories.find(c => c.id === vendor.category);
  const Icon = cat?.icon ?? Package;
  const [profileOpen, setProfileOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

  return (
    <>
      {profileOpen && <VendorProfileModal vendor={vendor} onClose={() => setProfileOpen(false)} onBook={() => setBookingOpen(true)} />}
      {bookingOpen && <VendorBookingModal vendor={vendor} onClose={() => setBookingOpen(false)} />}

      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col md:flex-row">
        {/* Image */}
        <div className="relative w-full md:w-72 flex-shrink-0 h-52 md:h-auto overflow-hidden">
          <img src={vendor.image} alt={vendor.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
          <div className="absolute top-2 left-2">
            <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">
              <Icon className="w-3 h-3" />{cat?.label}
            </span>
          </div>
          <button onClick={() => onToggleFavorite(vendor.id)}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-all ${isFavorite ? 'bg-red-50 text-red-500' : 'bg-white/80 text-gray-400 hover:text-red-400'}`}>
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 flex flex-col">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-xl font-black text-gray-900 leading-tight">{vendor.name}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
            <MapPin className="w-3.5 h-3.5 text-primary-500" />{vendor.location}
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <Star className="w-3 h-3 fill-white" />{vendor.rating}
            </span>
            <span className="text-xs text-gray-500">({vendor.reviews} Reviews) · Verified Vendor</span>
          </div>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">{vendor.description}</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {vendor.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-[10px] font-medium">{tag}</span>
            ))}
          </div>
          <div className="mt-auto flex items-end justify-between gap-4 flex-wrap">
            <div>
              <span className="text-2xl font-black text-gray-900">₹{vendor.startingPrice.toLocaleString()}</span>
              <span className="text-sm text-gray-400 ml-1">{vendor.priceUnit}</span>
              <p className="text-[10px] text-gray-400 mt-0.5">Direct booking available</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setProfileOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:border-primary-500 hover:text-primary-500 transition-all">
                <User className="w-4 h-4" />View Profile
              </button>
              <button onClick={() => setBookingOpen(true)}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-lg">
                <Calendar className="w-4 h-4" />Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function OtherServicesPage() {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [budgetRange, setBudgetRange] = useState([BUDGET_MIN, BUDGET_MAX]);
  const [favorites, setFavorites] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);

  const toggleFavorite = (id) => setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);

  const filteredVendors = useMemo(() => vendors.filter(v => {
    if (selectedCategories.length > 0 && !selectedCategories.includes(v.category)) return false;
    if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.description.toLowerCase().includes(search.toLowerCase()) && !v.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false;
    if (citySearch && !v.location.toLowerCase().includes(citySearch.toLowerCase())) return false;
    if (v.startingPrice < budgetRange[0] || v.startingPrice > budgetRange[1]) return false;
    return true;
  }), [selectedCategories, search, citySearch, budgetRange]);

  const hasActiveFilters = selectedCategories.length > 0 || search !== '' || citySearch !== '' || budgetRange[0] !== BUDGET_MIN || budgetRange[1] !== BUDGET_MAX;

  const handleReset = () => { setSelectedCategories([]); setSearch(''); setCitySearch(''); setBudgetRange([BUDGET_MIN, BUDGET_MAX]); };

  const formatBudget = (val) => {
    if (val >= 1000000) return '₹10L+';
    if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}K`;
    return `₹${val}`;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Navbar />

      <div className="min-h-screen pt-28 lg:pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header */}
          <div className="mb-6">
            <span className="inline-block border border-gray-300 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full mb-4">Premium Services</span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{ fontFamily: 'Georgia, serif' }}>Browse All Services</h1>
            <p className="text-gray-500 max-w-2xl">From catering to celebrity appearances — find verified vendors for every aspect of your event.</p>
          </div>

          {/* Category Button Strip — single row, square tiles */}
          <div className="mb-8">
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(9, 1fr)' }}>
              {/* All Services tile */}
              <button
                onClick={() => setSelectedCategories([])}
                className={`flex flex-col items-center justify-center gap-2 border-2 rounded-xl transition-all aspect-square ${
                  selectedCategories.length === 0
                    ? 'bg-primary-500 text-white border-primary-500 shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-500 border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                }`}>
                <Package className="w-7 h-7" />
                <span className="text-[11px] font-semibold text-center leading-tight px-1">All Services</span>
              </button>
              {serviceCategories.map(cat => {
                const Icon = cat.icon;
                const isActive = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategories(isActive ? selectedCategories.filter(c => c !== cat.id) : [cat.id])}
                    className={`flex flex-col items-center justify-center gap-2 border-2 rounded-xl transition-all aspect-square ${isActive ? 'shadow-lg scale-105' : 'hover:brightness-95'}`}
                    style={{
                      backgroundColor: isActive ? cat.iconColor : cat.bg,
                      borderColor: isActive ? cat.iconColor : cat.border,
                      color: isActive ? '#fff' : cat.iconColor,
                    }}>
                    <Icon className="w-7 h-7" />
                    <span className="text-[11px] font-semibold text-center leading-tight px-1">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filter — desktop */}
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-28">
                <h3 className="font-semibold mb-6 flex items-center gap-2">
                  <Filter className="w-4 h-4" />Filters
                  {hasActiveFilters && <span className="ml-auto text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Active</span>}
                </h3>
                <FilterPanel search={search} setSearch={setSearch} citySearch={citySearch} setCitySearch={setCitySearch} budgetRange={budgetRange} setBudgetRange={setBudgetRange} formatBudget={formatBudget} onReset={handleReset} selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories} />
              </div>
            </aside>

            {/* Vendor List */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <p className="text-sm text-gray-500">Showing <span className="font-bold text-gray-900">{filteredVendors.length}</span> of {vendors.length} vendors</p>
                <button onClick={() => setFilterOpen(!filterOpen)} className="lg:hidden flex items-center gap-2 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:border-primary-500 transition-all">
                  <Filter className="w-4 h-4" />Filters {hasActiveFilters && <span className="w-2 h-2 bg-primary-500 rounded-full inline-block" />}
                </button>
              </div>

              {/* Mobile filter panel */}
              {filterOpen && (
                <div className="lg:hidden bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
                  <FilterPanel search={search} setSearch={setSearch} citySearch={citySearch} setCitySearch={setCitySearch} budgetRange={budgetRange} setBudgetRange={setBudgetRange} formatBudget={formatBudget} onReset={handleReset} selectedCategories={selectedCategories} setSelectedCategories={setSelectedCategories} />
                </div>
              )}

              {filteredVendors.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="font-bold text-gray-700 mb-2">No vendors found</h3>
                  <p className="text-sm text-gray-500 mb-4">Try adjusting your filters.</p>
                  <button onClick={handleReset} className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:border-primary-500 transition-all">Clear Filters</button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredVendors.map(vendor => (
                    <VendorCard key={vendor.id} vendor={vendor} isFavorite={favorites.includes(vendor.id)} onToggleFavorite={toggleFavorite} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

// ── Filter Panel (shared desktop + mobile) ────────────────────────────────
function FilterPanel({ search, setSearch, citySearch, setCitySearch, budgetRange, setBudgetRange, formatBudget, onReset, selectedCategories, setSelectedCategories }) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input placeholder="e.g. Bhopal, Mumbai..." value={citySearch} onChange={e => setCitySearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
          {citySearch && <button onClick={() => setCitySearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>}
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Budget</label>
        <p className="text-xs text-gray-500 mb-2">{formatBudget(budgetRange[0])} – {formatBudget(budgetRange[1])}</p>
        <input type="range" min={0} max={1000000} step={10000} value={budgetRange[1]}
          onChange={e => setBudgetRange([budgetRange[0], parseInt(e.target.value)])}
          className="w-full accent-primary-500" />
        <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>₹0</span><span>₹10L+</span></div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Service Category</label>
        <div className="space-y-1">
          <button onClick={() => setSelectedCategories([])}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors text-left ${selectedCategories.length === 0 ? 'bg-primary-50 text-primary-600 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Package className="w-4 h-4 flex-shrink-0" />All Services
          </button>
          {serviceCategories.map(cat => {
            const Icon = cat.icon;
            const isActive = selectedCategories.includes(cat.id);
            return (
              <button key={cat.id} onClick={() => setSelectedCategories(isActive ? selectedCategories.filter(c => c !== cat.id) : [cat.id])}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors text-left ${isActive ? 'font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                style={isActive ? { backgroundColor: cat.bg, color: cat.iconColor } : {}}>
                <Icon className="w-4 h-4 flex-shrink-0" style={{ color: cat.iconColor }} />
                {cat.label}
                {isActive && <X className="w-3 h-3 ml-auto" />}
              </button>
            );
          })}
        </div>
      </div>
      <button onClick={onReset} className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:border-red-300 hover:text-red-500 transition-all">
        <X className="w-4 h-4" />Reset Filters
      </button>
    </div>
  );
}
