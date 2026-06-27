'use client';

import { useState } from 'react';
import { Building2, FileText, Mail, MapPin, Package, Phone, User, Users, ChevronDown } from 'lucide-react';
import { formatPlatformFeeLabel } from '@/lib/venuePricing';

const money = (value) => `₹${Math.round(Number(value) || 0).toLocaleString('en-IN')}`;

const splitGst = (combined, first, second) => {
  if (first !== undefined || second !== undefined) {
    return [Number(first) || 0, Number(second) || 0];
  }
  const half = (Number(combined) || 0) / 2;
  return [half, half];
};

const sectionTone = {
  green: {
    wrap: 'border-green-100 bg-green-50 dark:border-slate-700 dark:bg-slate-800',
    title: 'text-green-700 dark:text-green-400',
    amount: 'text-green-700 dark:text-green-400',
  },
  orange: {
    wrap: 'border-orange-100 bg-orange-50 dark:border-slate-700 dark:bg-slate-800',
    title: 'text-orange-700 dark:text-orange-400',
    amount: 'text-orange-700 dark:text-orange-400',
  },
  blue: {
    wrap: 'border-blue-100 bg-blue-50 dark:border-slate-700 dark:bg-slate-800',
    title: 'text-blue-700 dark:text-blue-400',
    amount: 'text-blue-700 dark:text-blue-400',
  },
  rose: {
    wrap: 'border-rose-100 bg-rose-50 dark:border-slate-700 dark:bg-slate-800',
    title: 'text-rose-700 dark:text-rose-400',
    amount: 'text-rose-700 dark:text-rose-400',
  },
  amber: {
    wrap: 'border-amber-100 bg-amber-50 dark:border-slate-700 dark:bg-slate-800',
    title: 'text-amber-700 dark:text-amber-400',
    amount: 'text-amber-700 dark:text-amber-400',
  },
  purple: {
    wrap: 'border-purple-100 bg-purple-50 dark:border-slate-700 dark:bg-slate-800',
    title: 'text-purple-700 dark:text-purple-400',
    amount: 'text-purple-700 dark:text-purple-400',
  },
};

const itemTotal = (item) => Number(item?.total ?? item?.amount ?? 0) || 0;
const itemQty = (item) => Number(item?.quantity) || 1;

const AmenitySection = ({ title, tone = 'blue', items }) => {
  const [isOpen, setIsOpen] = useState(true);
  if (!items?.length) return null;
  const c = sectionTone[tone] || sectionTone.blue;

  return (
    <div className={`rounded-xl border p-3 ${c.wrap} transition-all`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left focus:outline-none"
      >
        <span className={`text-[11px] font-bold uppercase ${c.title}`}>{title}</span>
        <ChevronDown className={`w-4 h-4 ${c.title} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="space-y-1.5 mt-2 transition-all">
          {items.map((item, idx) => (
            <div key={`${title}-${idx}`} className="rounded-lg bg-white dark:bg-slate-900 border border-white/70 dark:border-slate-700 px-2.5 py-2">
              <div className="flex items-start justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 dark:text-slate-100 break-words">{item.label}</p>
                  {item.meta && <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">{item.meta}</p>}
                </div>
                <span className={`font-bold whitespace-nowrap ${c.amount}`}>{item.amountLabel}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export function getVenueBookingBreakdown(booking) {
  const pb = booking?.priceBreakdown || {};
  const basePrice = Number(pb.basePrice) || 0;
  const amenitiesTotal = Number(pb.amenitiesTotal ?? booking?.amenitiesTotal) || 0;
  const fallbackSubtotal = basePrice || amenitiesTotal ? basePrice + amenitiesTotal : booking?.ownerEarnings;
  const subtotal = Number(pb.subtotal ?? fallbackSubtotal) || 0;
  const [venueCGST, venueSGST] = splitGst(pb.gst, pb.venueCGST, pb.venueSGST);
  const venueCGSTRate = pb.venueCGSTRate ?? (pb.gstRate ? pb.gstRate / 2 : 9);
  const venueSGSTRate = pb.venueSGSTRate ?? (pb.gstRate ? pb.gstRate / 2 : 9);
  const platformFee = Number(pb.platformFee) || 0;
  const [platformCGST, platformSGST] = splitGst(pb.platformFeeGST, pb.platformFeeCGST, pb.platformFeeSGST);
  const platformCGSTRate = pb.platformFeeCGSTRate ?? 9;
  const platformSGSTRate = pb.platformFeeSGSTRate ?? 9;
  const platformFeeType = pb.platformFeeType || 'percentage';
  const platformFeeValue = pb.platformFeeValue ?? pb.platformFeeRate ?? pb.platformFeePercentage ?? 0;
  const platformFeeLabel = formatPlatformFeeLabel(platformFeeType, platformFeeValue);
  const venueTotal = subtotal + venueCGST + venueSGST;
  const platformTotal = Number(pb.platformFeeTotal ?? (platformFee + platformCGST + platformSGST)) || 0;
  const discount = Number(pb.discount ?? booking?.coupon?.discountAmount) || 0;
  const grandTotal = Math.max(0, venueTotal + platformTotal - discount);

  return {
    basePrice,
    amenitiesTotal,
    subtotal,
    venueCGST,
    venueSGST,
    venueCGSTRate,
    venueSGSTRate,
    venueTotal,
    platformFee,
    platformCGST,
    platformSGST,
    platformCGSTRate,
    platformSGSTRate,
    platformFeeType,
    platformFeeValue,
    platformFeeLabel,
    platformTotal,
    discount,
    couponCode: pb.couponCode || booking?.coupon?.code,
    grandTotal,
  };
}

export function VenueBookingPartyCards({ booking }) {
  const customerName = booking?.customer?.name || booking?.customerDetails?.name || '—';
  const customerEmail = booking?.customer?.email || booking?.customerDetails?.email || '—';
  const customerPhone = booking?.customerDetails?.phone || booking?.customer?.phone || '—';
  const venueName = booking?.venue?.businessName || 'Venue';
  const location = [
    booking?.venue?.location?.area,
    booking?.venue?.location?.city,
    booking?.venue?.location?.state,
  ].filter(Boolean).join(', ');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-blue-50 dark:bg-slate-800 rounded-xl p-4 border border-blue-100 dark:border-slate-700">
        <p className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase mb-3 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" /> Customer Details
        </p>
        <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm">{customerName}</p>
        <p className="text-xs text-gray-600 dark:text-slate-300 mt-1 flex items-center gap-1.5 break-all">
          <Mail className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" /> {customerEmail}
        </p>
        <p className="text-xs text-gray-600 dark:text-slate-300 mt-1 flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" /> {customerPhone}
        </p>
        {(booking?.customerDetails?.eventType || booking?.customerDetails?.guestCount) && (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {booking?.customerDetails?.eventType && (
              <p className="text-xs text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-lg px-2 py-1 border border-blue-100 dark:border-slate-700">
                Event: <strong>{booking.customerDetails.eventType}</strong>
              </p>
            )}
            {booking?.customerDetails?.guestCount && (
              <p className="text-xs text-gray-700 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-lg px-2 py-1 border border-blue-100 dark:border-slate-700 flex items-center gap-1">
                <Users className="w-3 h-3" /> Guests: <strong>{booking.customerDetails.guestCount}</strong>
              </p>
            )}
          </div>
        )}
        {booking?.customerDetails?.specialRequirements && (
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 italic">"{booking.customerDetails.specialRequirements}"</p>
        )}
      </div>

      <div className="bg-yellow-50 dark:bg-slate-800 rounded-xl p-4 border border-yellow-100 dark:border-slate-700">
        <p className="text-xs font-bold text-yellow-800 dark:text-yellow-500 uppercase mb-3 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5" /> Venue Details
        </p>
        <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm">{venueName}</p>
        {location && (
          <p className="text-xs text-gray-600 dark:text-slate-300 mt-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-yellow-700 dark:text-yellow-500 flex-shrink-0" /> {location}
          </p>
        )}
        {booking?.bookingDate && (
          <p className="text-xs text-gray-700 dark:text-slate-300 mt-3 bg-white dark:bg-slate-900 rounded-lg px-2 py-1 border border-yellow-100 dark:border-slate-700">
            Date: <strong>{new Date(booking.bookingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
          </p>
        )}
        {(booking?.startTime || booking?.endTime) && (
          <p className="text-xs text-gray-600 dark:text-slate-300 mt-1">
            Time: <strong>{booking?.startTime || '—'} - {booking?.endTime || '—'}</strong>
          </p>
        )}
      </div>
    </div>
  );
}

export function VenueAmenitiesDetails({ booking }) {
  const selected = booking?.selectedAmenities || {};
  const freeBasic = (selected.basic || [])
    .filter(item => item.type === 'Free' || item.type === 'Included')
    .map(item => ({
      label: item.name || 'Included amenity',
      meta: 'Included with venue',
      amountLabel: '₹0',
    }));
  const paidBasic = (selected.basic || [])
    .filter(item => item.type === 'Paid' || itemTotal(item) > 0)
    .map(item => ({
      label: item.name || 'Paid add-on',
      meta: `${item.rateType || 'Rate'}${itemQty(item) > 1 ? ` x ${itemQty(item)}` : ''}`,
      amountLabel: money(itemTotal(item)),
    }));
  const beverages = (selected.beverages || []).map(item => ({
    label: item.name || 'Beverage',
    meta: [item.brand, `${itemQty(item)} unit${itemQty(item) > 1 ? 's' : ''}`, item.ratePerUnit ? `${money(item.ratePerUnit)} / unit` : ''].filter(Boolean).join(' | '),
    amountLabel: money(itemTotal(item)),
  }));
  const refreshments = (selected.refreshmentFood || []).map(item => ({
    label: item.name || 'Refreshment',
    meta: [item.items, `${itemQty(item)} plate${itemQty(item) > 1 ? 's' : ''}`, item.ratePerPlate ? `${money(item.ratePerPlate)} / plate` : ''].filter(Boolean).join(' | '),
    amountLabel: money(itemTotal(item)),
  }));
  const thalis = (selected.lunchThalis || []).map(item => ({
    label: [item.thaliType, item.category].filter(Boolean).join(' - ') || 'Lunch thali',
    meta: [item.itemNames || (item.numberOfItems ? `${item.numberOfItems} items` : ''), `${itemQty(item)} plate${itemQty(item) > 1 ? 's' : ''}`, item.ratePerPlate ? `${money(item.ratePerPlate)} / plate` : ''].filter(Boolean).join(' | '),
    amountLabel: money(itemTotal(item)),
  }));
  const additional = (selected.additional || []).map(item => ({
    label: item.name || 'Additional service',
    meta: [item.type, item.charges ? `${money(item.charges)} charge` : '', itemQty(item) > 1 ? `Qty ${itemQty(item)}` : ''].filter(Boolean).join(' | '),
    amountLabel: itemTotal(item) > 0 ? money(itemTotal(item)) : '₹0',
  }));
  const total = Number(booking?.amenitiesTotal ?? booking?.priceBreakdown?.amenitiesTotal) ||
    [...paidBasic, ...beverages, ...refreshments, ...thalis, ...additional].reduce((sum, item) => {
      const numeric = Number(String(item.amountLabel).replace(/[₹,]/g, '')) || 0;
      return sum + numeric;
    }, 0);
  const hasAmenities = [freeBasic, paidBasic, beverages, refreshments, thalis, additional].some(list => list.length > 0);

  if (!hasAmenities) return null;

  return (
    <div>
      <p className="text-xs font-bold text-gray-500 dark:text-slate-300 uppercase mb-2 flex items-center gap-1.5">
        <Package className="w-3.5 h-3.5" /> Selected Amenities & Services
      </p>
      <div className="flex flex-col gap-3">
        <AmenitySection title={`Included Free (${freeBasic.length})`} tone="green" items={freeBasic} />
        <AmenitySection title="Paid Add-ons" tone="orange" items={paidBasic} />
        <AmenitySection title="Beverages" tone="blue" items={beverages} />
        <AmenitySection title="Refreshments" tone="rose" items={refreshments} />
        <AmenitySection title="Lunch Thalis" tone="amber" items={thalis} />
        <AmenitySection title="Additional Services" tone="purple" items={additional} />
      </div>
      {total > 0 && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-purple-100 dark:border-slate-700 bg-purple-50 dark:bg-slate-800 px-4 py-3 text-sm">
          <span className="font-bold text-purple-800 dark:text-purple-400">Amenities Total</span>
          <span className="font-black text-purple-800 dark:text-purple-400">{money(total)}</span>
        </div>
      )}
    </div>
  );
}

export function VenueInvoiceBreakdownCards({ booking }) {
  const d = getVenueBookingBreakdown(booking);

  return (
    <div>
      <p className="text-xs font-bold text-gray-500 dark:text-slate-300 uppercase mb-2">Price Breakdown</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-slate-800 rounded-xl p-4 border border-blue-100 dark:border-slate-700 text-xs space-y-1.5">
          <p className="font-bold text-blue-800 dark:text-blue-400 mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Venue Invoice
          </p>
          <div className="flex justify-between text-gray-600 dark:text-slate-300"><span>Base Price</span><span>{money(d.basePrice)}</span></div>
          {d.amenitiesTotal > 0 && (
            <div className="flex justify-between text-gray-600 dark:text-slate-300"><span>Amenities</span><span>{money(d.amenitiesTotal)}</span></div>
          )}
          <div className="flex justify-between text-gray-600 dark:text-slate-300"><span>Subtotal</span><span>{money(d.subtotal)}</span></div>
          {d.venueCGST > 0 && (
            <div className="flex justify-between text-gray-600 dark:text-slate-300"><span>CGST ({d.venueCGSTRate}%)</span><span>{money(d.venueCGST)}</span></div>
          )}
          {d.venueSGST > 0 && (
            <div className="flex justify-between text-gray-600 dark:text-slate-300"><span>SGST ({d.venueSGSTRate}%)</span><span>{money(d.venueSGST)}</span></div>
          )}
          <div className="flex justify-between font-bold text-blue-900 dark:text-blue-300 border-t border-blue-200 dark:border-slate-700 pt-1.5 mt-1">
            <span>Venue Total</span><span>{money(d.venueTotal)}</span>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-slate-800 rounded-xl p-4 border border-purple-100 dark:border-slate-700 text-xs space-y-1.5">
          <p className="font-bold text-purple-800 dark:text-purple-400 mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Platform Invoice
          </p>
          <div className="flex justify-between text-gray-600 dark:text-slate-300">
            <span>Platform Fee{d.platformFeeValue ? ` (${d.platformFeeLabel})` : ''}</span><span>{money(d.platformFee)}</span>
          </div>
          {d.platformCGST > 0 && (
            <div className="flex justify-between text-gray-600 dark:text-slate-300"><span>CGST ({d.platformCGSTRate}%)</span><span>{money(d.platformCGST)}</span></div>
          )}
          {d.platformSGST > 0 && (
            <div className="flex justify-between text-gray-600 dark:text-slate-300"><span>SGST ({d.platformSGSTRate}%)</span><span>{money(d.platformSGST)}</span></div>
          )}
          <div className="flex justify-between font-bold text-purple-900 dark:text-purple-300 border-t border-purple-200 dark:border-slate-700 pt-1.5 mt-1">
            <span>Platform Total</span><span>{money(d.platformTotal)}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 bg-gradient-to-r from-primary-50 to-orange-50 dark:from-slate-800 dark:to-slate-800 rounded-xl p-4 border border-primary-200 dark:border-slate-700 text-sm space-y-2">
        {d.discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Coupon Discount {d.couponCode ? `(${d.couponCode})` : ''}</span>
            <span className="font-bold">- {money(d.discount)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-primary-200 dark:border-slate-700 pt-2">
          <span className="font-bold text-gray-900 dark:text-slate-100">Grand Total</span>
          <span className="font-black text-primary-600">{money(d.grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}
