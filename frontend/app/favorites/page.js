'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useFavorites, toggleVenueFavorite, toggleServiceFavorite } from '@/lib/favorites';
import { shareItem } from '@/lib/share';
import {
  Heart, Share2, Building2, Package, MapPin, Users,
  Sparkles, ArrowRight, Eye, ShieldCheck, Loader2, Utensils, Star, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function FavoritesPage() {
  const router = useRouter();
  const { favoriteVenues, favoriteServices, isLoaded } = useFavorites();
  const [activeTab, setActiveTab] = useState('venues'); // 'venues' | 'services'

  // Live real-time fetched data
  const [venues, setVenues] = useState([]);
  const [services, setServices] = useState([]);
  const [loadingVenues, setLoadingVenues] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);

  // ── Fetch Real-time Venues ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    if (favoriteVenues.length === 0) {
      setVenues([]);
      setLoadingVenues(false);
      return;
    }

    let isMounted = true;
    setLoadingVenues(true);

    const fetchRealtimeVenues = async () => {
      try {
        const idsParam = encodeURIComponent(favoriteVenues.join(','));
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues?ids=${idsParam}&limit=100`, {
          cache: 'no-store'
        });
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.venues)) {
          // Keep venues in the order of favoriteVenues array
          const venueMap = new Map(data.venues.map(v => [String(v._id), v]));
          data.venues.forEach(v => {
            if (v.sku) venueMap.set(String(v.sku), v);
          });
          const ordered = favoriteVenues
            .map(id => venueMap.get(String(id)))
            .filter(Boolean);
          setVenues(ordered);
        }
      } catch (err) {
        console.error('Error fetching realtime favorite venues:', err);
      } finally {
        if (isMounted) setLoadingVenues(false);
      }
    };

    fetchRealtimeVenues();

    return () => {
      isMounted = false;
    };
  }, [favoriteVenues, isLoaded]);

  // ── Fetch Real-time Services ────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    if (favoriteServices.length === 0) {
      setServices([]);
      setLoadingServices(false);
      return;
    }

    let isMounted = true;
    setLoadingServices(true);

    const fetchRealtimeServices = async () => {
      try {
        const idsParam = encodeURIComponent(favoriteServices.join(','));
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor-services?ids=${idsParam}&limit=100`, {
          cache: 'no-store'
        });
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.services)) {
          const serviceMap = new Map(data.services.map(s => [String(s._id), s]));
          data.services.forEach(s => {
            if (s.slug) serviceMap.set(String(s.slug), s);
          });
          const ordered = favoriteServices
            .map(id => serviceMap.get(String(id)))
            .filter(Boolean);
          setServices(ordered);
        }
      } catch (err) {
        console.error('Error fetching realtime favorite services:', err);
      } finally {
        if (isMounted) setLoadingServices(false);
      }
    };

    fetchRealtimeServices();

    return () => {
      isMounted = false;
    };
  }, [favoriteServices, isLoaded]);

  // Handle Share Venue
  const handleShareVenue = (e, venue) => {
    e.preventDefault();
    e.stopPropagation();
    const url = typeof window !== 'undefined' ? `${window.location.origin}/venues/${venue.sku || venue._id}` : '';
    shareItem({
      title: venue.businessName,
      text: `Check out ${venue.businessName} on RentalMeet!`,
      url
    });
  };

  // Handle Share Service
  const handleShareService = (e, svc) => {
    e.preventDefault();
    e.stopPropagation();
    const url = typeof window !== 'undefined' ? `${window.location.origin}/other-services/${svc.slug || svc._id}` : '';
    shareItem({
      title: svc.title,
      text: `Check out ${svc.title} on RentalMeet!`,
      url
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider mb-2 border border-red-200 dark:border-red-900/50">
                <Heart className="w-3.5 h-3.5 fill-current" />
                My Saved Collection
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 dark:text-white tracking-tight">
                Favorite <span className="text-primary-600 dark:text-primary-400">Venues & Services</span>
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                Real-time pricing, live availability, and direct booking for all your bookmarked spaces and vendor services.
              </p>
            </div>

            {/* Quick action buttons */}
            <div className="flex items-center gap-2">
              <Link
                href="/venues"
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-primary-500 hover:text-primary-600 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Building2 className="w-3.5 h-3.5" />
                Browse Venues
              </Link>
              <Link
                href="/other-services"
                className="px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-primary-500 hover:text-primary-600 transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Package className="w-3.5 h-3.5" />
                Browse Services
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-3 mt-6 border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('venues')}
              className={`flex items-center gap-2 pb-3 px-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'venues'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Venues
              <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                activeTab === 'venues'
                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {favoriteVenues.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className={`flex items-center gap-2 pb-3 px-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'services'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Package className="w-4 h-4" />
              Services
              <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                activeTab === 'services'
                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {favoriteServices.length}
              </span>
            </button>
          </div>
        </div>

        {/* Content Tabs */}
        {activeTab === 'venues' && (
          <div>
            {loadingVenues ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 animate-pulse">
                    <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl mb-4" />
                    <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mb-4" />
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                ))}
              </div>
            ) : venues.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {venues.map((venue) => {
                  const image = venue.images?.[0] || '/placeholder-venue.jpg';
                  const city = venue.location?.city || '';
                  const area = venue.location?.area || venue.location?.address || '';
                  const displayLoc = [area, city].filter(Boolean).join(', ') || 'Bhopal, India';

                  // Derive pricing display
                  const p = venue.pricing || {};
                  let priceText = 'Price on Request';
                  let unitText = '';

                  if (p.modelType === 'per_pax' || p.selectedModel === 'per_pax') {
                    const rate = p.perPaxRates?.withoutFood?.rate || p.perPaxRate || p.hourlyRate || 200;
                    priceText = `₹${rate.toLocaleString('en-IN')}`;
                    unitText = '/pax';
                  } else if (p.hourlyRate) {
                    priceText = `₹${p.hourlyRate.toLocaleString('en-IN')}`;
                    unitText = '/hour';
                  } else if (p.halfDayRate) {
                    priceText = `₹${p.halfDayRate.toLocaleString('en-IN')}`;
                    unitText = '/half day';
                  } else if (p.fullDayRate) {
                    priceText = `₹${p.fullDayRate.toLocaleString('en-IN')}`;
                    unitText = '/day';
                  }

                  const gstMode = venue.pricing?.gstMode || 'included';

                  return (
                    <div
                      key={venue._id || venue.sku}
                      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        {/* Image Box */}
                        <div className="relative h-52 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                          <img
                            src={image}
                            alt={venue.businessName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                          {/* Top Badges */}
                          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                            {venue.venueType && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 backdrop-blur-md shadow-sm">
                                {venue.venueType}
                              </span>
                            )}
                            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-500 text-white flex items-center gap-1 shadow-sm">
                              <ShieldCheck className="w-3 h-3" /> Verified
                            </span>
                          </div>

                          {/* Top Right Action Buttons (Favorite + Share) */}
                          <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            <button
                              onClick={(e) => handleShareVenue(e, venue)}
                              className="p-2 rounded-full bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-300 hover:text-primary-600 hover:bg-white shadow-md transition-all active:scale-95"
                              title="Share venue"
                              aria-label="Share venue"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleVenueFavorite(venue)}
                              className="p-2 rounded-full bg-white/95 dark:bg-slate-900/95 text-red-500 hover:bg-white shadow-md transition-all active:scale-95"
                              title="Remove from favorites"
                              aria-label="Remove from favorites"
                            >
                              <Heart className="w-4 h-4 fill-current" />
                            </button>
                          </div>

                          {/* Bottom Image Overlay Info */}
                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                            <div className="flex items-center gap-1 font-semibold">
                              <MapPin className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                              <span className="truncate">{city || 'Bhopal'}</span>
                            </div>
                            {venue.capacity?.maximum && (
                              <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                <Users className="w-3 h-3" />
                                <span>Up to {venue.capacity.maximum} pax</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Body Details */}
                        <div className="p-5">
                          <Link href={`/venues/${venue.sku || venue._id}`}>
                            <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white line-clamp-1 group-hover:text-primary-600 transition-colors">
                              {venue.businessName}
                            </h3>
                          </Link>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            {displayLoc}
                          </p>

                          {/* Quick specs pill */}
                          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                            {venue.foodType && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium">
                                {venue.foodType}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium">
                              Instant Confirmation
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer & Booking CTA */}
                      <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-slate-900 dark:text-white">
                              {priceText}
                            </span>
                            {unitText && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                {unitText}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">
                            {gstMode === 'included' ? 'GST Included' : 'GST Extra'}
                          </p>
                        </div>

                        <Link
                          href={`/venues/${venue.sku || venue._id}`}
                          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-primary-500/25 transition-all flex items-center gap-1.5"
                        >
                          Book Now
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 max-w-lg mx-auto shadow-sm">
                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/50 text-red-500 flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  No Venues in Favorites Yet
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Explore our meeting halls, conference spaces, auditoriums, and banquet halls, and click the heart icon on any card to save it for quick booking.
                </p>
                <Link
                  href="/venues"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary-500/25 transition-all"
                >
                  <Building2 className="w-4 h-4" />
                  Explore Venues Now
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'services' && (
          <div>
            {loadingServices ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 animate-pulse">
                    <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl mb-4" />
                    <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2 mb-4" />
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                ))}
              </div>
            ) : services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((svc) => {
                  const image = svc.featuredImage || svc.images?.[0] || '/placeholder-service.jpg';
                  const city = svc.city || '';
                  const state = svc.state || '';
                  const loc = [city, state].filter(Boolean).join(', ') || 'India';
                  const price = svc.startingPrice ? `₹${svc.startingPrice.toLocaleString('en-IN')}` : 'Price on request';

                  return (
                    <div
                      key={svc._id || svc.slug}
                      className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col justify-between"
                    >
                      <div>
                        {/* Image Box */}
                        <div className="relative h-52 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                          <img
                            src={image}
                            alt={svc.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                          {/* Top Category Badge */}
                          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                            {svc.category && (
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 backdrop-blur-md shadow-sm">
                                {svc.category}
                              </span>
                            )}
                            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-500 text-white flex items-center gap-1 shadow-sm">
                              <ShieldCheck className="w-3 h-3" /> Verified Vendor
                            </span>
                          </div>

                          {/* Action Buttons (Favorite + Share) */}
                          <div className="absolute top-3 right-3 flex items-center gap-1.5">
                            <button
                              onClick={(e) => handleShareService(e, svc)}
                              className="p-2 rounded-full bg-white/95 dark:bg-slate-900/95 text-slate-700 dark:text-slate-300 hover:text-primary-600 hover:bg-white shadow-md transition-all active:scale-95"
                              title="Share service"
                              aria-label="Share service"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => toggleServiceFavorite(svc)}
                              className="p-2 rounded-full bg-white/95 dark:bg-slate-900/95 text-red-500 hover:bg-white shadow-md transition-all active:scale-95"
                              title="Remove from favorites"
                              aria-label="Remove from favorites"
                            >
                              <Heart className="w-4 h-4 fill-current" />
                            </button>
                          </div>

                          {/* Bottom info */}
                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                            <div className="flex items-center gap-1 font-semibold">
                              <MapPin className="w-3.5 h-3.5 text-primary-400 flex-shrink-0" />
                              <span className="truncate">{loc}</span>
                            </div>
                            {svc.vendor?.companyName && (
                              <span className="bg-black/40 px-2 py-0.5 rounded-full text-[10px] truncate max-w-[140px]">
                                {svc.vendor.companyName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Body Details */}
                        <div className="p-5">
                          <Link href={`/other-services/${svc.slug || svc._id}`}>
                            <h3 className="font-serif font-bold text-lg text-slate-900 dark:text-white line-clamp-1 group-hover:text-primary-600 transition-colors">
                              {svc.title}
                            </h3>
                          </Link>
                          {svc.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                              {svc.description}
                            </p>
                          )}

                          {svc.specialization?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                              {svc.specialization.slice(0, 3).map((spec, i) => (
                                <span key={i} className="text-[10px] bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-900/40 px-2 py-0.5 rounded-md font-semibold">
                                  {spec}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Footer & Booking CTA */}
                      <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-slate-900 dark:text-white">
                              {price}
                            </span>
                            {svc.startingPrice && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                onwards
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400">Direct vendor booking</p>
                        </div>

                        <Link
                          href={`/other-services/${svc.slug || svc._id}`}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-green-500/25 transition-all flex items-center gap-1.5"
                        >
                          Book Now
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 max-w-lg mx-auto shadow-sm">
                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/50 text-red-500 flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  No Services in Favorites Yet
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Save your top catering providers, event photographers, decorators, and entertainment services for quick access and quotes.
                </p>
                <Link
                  href="/other-services"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary-500/25 transition-all"
                >
                  <Package className="w-4 h-4" />
                  Explore Services Now
                </Link>
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
