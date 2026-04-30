'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Building2, MapPin, Users, Clock, Calendar,
  Wifi, Coffee, Utensils, CheckCircle2, ArrowLeft,
  Star, Phone, Mail, Share2, Image as ImageIcon, X,
  ChevronLeft, ChevronRight, Sparkles, Award, Shield, PowerOff,
  Projector, Car, Tv, Wind, Zap, Music, Camera, Printer,
  Monitor, Mic, Volume2, Thermometer, Droplets, Flame,
  Package, Dumbbell, Baby, Accessibility, ParkingCircle,
  UtensilsCrossed, CupSoda, Sandwich, ChefHat, Refrigerator,
  Sofa, Bed, Bath, Shirt, Scissors, FlowerIcon
} from 'lucide-react';
import BookingForm from '@/components/booking/BookingForm';
import VenueReviews from '@/components/venue/VenueReviews';
import Navbar from '@/components/Navbar';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

// ── Amenity icon map ─────────────────────────────────────────────────────
const AMENITY_ICONS = {
  // Connectivity
  'wifi': Wifi, 'wi-fi': Wifi, 'internet': Wifi, 'broadband': Wifi,
  // AV / Projection
  'projector': Projector, 'projection': Projector, 'screen': Monitor,
  'tv': Tv, 'television': Tv, 'display': Monitor, 'monitor': Monitor,
  'led': Tv, 'led screen': Tv,
  // Audio
  'mic': Mic, 'microphone': Mic, 'speaker': Volume2, 'sound system': Volume2,
  'pa system': Volume2, 'audio': Volume2, 'music system': Music,
  // Climate
  'ac': Wind, 'air conditioning': Wind, 'air conditioner': Wind,
  'heater': Thermometer, 'heating': Thermometer, 'fan': Wind,
  // Power
  'power backup': Zap, 'generator': Zap, 'ups': Zap, 'electricity': Zap,
  // Parking
  'parking': ParkingCircle, 'car parking': ParkingCircle, 'valet': Car,
  // Food & Beverage
  'catering': ChefHat, 'kitchen': UtensilsCrossed, 'dining': Utensils,
  'coffee': Coffee, 'tea': Coffee, 'beverages': CupSoda, 'water': Droplets,
  'snacks': Sandwich, 'food': Utensils, 'lunch': Utensils, 'dinner': Utensils,
  'refrigerator': Refrigerator, 'fridge': Refrigerator,
  // Security
  'security': Shield, 'cctv': Camera, 'guard': Shield, 'fire safety': Flame,
  'fire extinguisher': Flame, 'first aid': Award,
  // Comfort
  'sofa': Sofa, 'lounge': Sofa, 'waiting area': Sofa,
  'washroom': Bath, 'restroom': Bath, 'toilet': Bath, 'bathroom': Bath,
  // Photography
  'photography': Camera, 'videography': Camera,
  // Printing
  'printer': Printer, 'whiteboard': Monitor, 'flip chart': Monitor,
  // Accessibility
  'wheelchair': Accessibility, 'lift': Accessibility, 'elevator': Accessibility,
  // Laundry
  'laundry': Shirt, 'ironing': Shirt,
  // Gym
  'gym': Dumbbell, 'fitness': Dumbbell,
  // Kids
  'kids area': Baby, 'play area': Baby,
  // Decor
  'decoration': Sparkles, 'flowers': Sparkles,
};

function getAmenityIcon(name) {
  if (!name) return Package;
  const lower = name.toLowerCase().trim();
  // Exact match
  if (AMENITY_ICONS[lower]) return AMENITY_ICONS[lower];
  // Partial match
  for (const [key, Icon] of Object.entries(AMENITY_ICONS)) {
    if (lower.includes(key) || key.includes(lower)) return Icon;
  }
  return Package;
}

export default function VenueDetail() {
  const params = useParams();
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [currentMainImage, setCurrentMainImage] = useState(0);
  const [bookingFormOpen, setBookingFormOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [bookedDates, setBookedDates] = useState([]);
  const [venueCoupons, setVenueCoupons] = useState([]);
  const [showAllIncludedFacilities, setShowAllIncludedFacilities] = useState(false);

  // Fetch booked dates for this venue
  useEffect(() => {
    if (params.sku) fetchBookedDates();
  }, [params.sku]);

  const fetchBookedDates = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookings/booked-dates/${params.sku}`);
      const data = await res.json();
      if (data.success && data.dates) {
        setBookedDates(data.dates.map(d => new Date(d)));
      }
    } catch (e) {
      // silently fail
    }
  };

  // Auto-slideshow
  useEffect(() => {
    if (!venue?.images?.length || venue.images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentMainImage(prev => (prev + 1) % venue.images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [venue?.images?.length]);
  
  // Quick booking form state
  const [quickBooking, setQuickBooking] = useState({
    date: null,
    startTime: '',
    duration: ''
  });

  // Selected amenities state
  const [selectedAmenities, setSelectedAmenities] = useState({
    basic: [],
    beverages: [],
    refreshmentFood: [],
    lunchThalis: []
  });

  // Quantities for items
  const [quantities, setQuantities] = useState({});

  useEffect(() => {
    if (params.sku) {
      fetchVenue();
    }
  }, [params.sku]);

  // Auto-select free/included amenities when venue loads
  useEffect(() => {
    if (venue?.amenities?.basic) {
      const freeAmenities = venue.amenities.basic.filter(
        a => a.available && (a.type === 'Free' || a.type === 'Included')
      );
      
      if (freeAmenities.length > 0) {
        setSelectedAmenities(prev => ({
          ...prev,
          basic: [...prev.basic, ...freeAmenities.filter(
            fa => !prev.basic.some(pa => pa.name === fa.name)
          )]
        }));
      }
    }

    // Auto-select first enabled duration
    if (venue?.pricing?.enabledOptions) {
      const opts = venue.pricing.enabledOptions;
      if (opts.perHour) setQuickBooking(prev => ({ ...prev, duration: '1' }));
      else if (opts.halfDay) setQuickBooking(prev => ({ ...prev, duration: '4' }));
      else if (opts.fullDay) setQuickBooking(prev => ({ ...prev, duration: '8' }));
    }
  }, [venue]);

  // Check for pending booking after login
  useEffect(() => {
    const checkPendingBooking = () => {
      const pendingBookingStr = localStorage.getItem('pendingBooking');
      if (pendingBookingStr && venue) {
        try {
          const pendingBooking = JSON.parse(pendingBookingStr);
          
          // Check if this is the same venue
          if (pendingBooking.venueSku === params.sku) {
            // Restore booking data
            if (pendingBooking.quickBooking) {
              setQuickBooking(pendingBooking.quickBooking);
            }
            if (pendingBooking.selectedAmenities) {
              setSelectedAmenities(pendingBooking.selectedAmenities);
            }
            if (pendingBooking.quantities) {
              setQuantities(pendingBooking.quantities);
            }
            
            // Open booking form automatically if flag is set
            if (pendingBooking.shouldOpenModal) {
              setBookingFormOpen(true);
            }
            
            toast.success('Welcome back! Continue your booking');
            
            // Clear pending booking after restoring
            localStorage.removeItem('pendingBooking');
          }
        } catch (error) {
          console.error('Error restoring pending booking:', error);
        }
      }
    };

    if (venue) {
      checkPendingBooking();
    }
  }, [venue, params.sku]);

  const fetchVenue = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues/sku/${params.sku}`);
      const data = await response.json();
      
      if (data.success) {
        setVenue(data.venue);
        // Fetch coupons for this venue
        fetchVenueCoupons(data.venue._id);
      } else {
        setError('Venue not found');
      }
    } catch (error) {
      console.error('Error fetching venue:', error);
      setError('Failed to load venue');
    } finally {
      setLoading(false);
    }
  };

  const fetchVenueCoupons = async (venueId) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues/${venueId}/coupons`);
      const data = await res.json();
      if (data.success) setVenueCoupons(data.coupons);
    } catch (e) { /* silently fail */ }
  };

  // Get unique categories from images
  const getImageCategories = () => {
    if (!venue?.images?.length) return [];
    const categories = ['All', ...new Set(venue.images.map(img => img.category))];
    return categories;
  };

  // Filter images by category
  const getFilteredImages = () => {
    if (!venue?.images?.length) return [];
    if (selectedCategory === 'All') return venue.images;
    return venue.images.filter(img => img.category === selectedCategory);
  };

  // Get images by category for organized display
  const getImagesByCategory = () => {
    if (!venue?.images?.length) return {};
    const grouped = {};
    venue.images.forEach(img => {
      if (!grouped[img.category]) {
        grouped[img.category] = [];
      }
      grouped[img.category].push(img);
    });
    return grouped;
  };

  const openLightbox = (index) => {
    setCurrentMainImage(index);
  };

  const nextImage = () => {
    if (venue.images?.length > 0) {
      setCurrentMainImage((currentMainImage + 1) % venue.images.length);
    }
  };

  const prevImage = () => {
    if (venue.images?.length > 0) {
      setCurrentMainImage((currentMainImage - 1 + venue.images.length) % venue.images.length);
    }
  };

  // Toggle amenity selection
  const toggleAmenity = (category, item) => {
    setSelectedAmenities(prev => {
      const categoryItems = prev[category];
      const exists = categoryItems.find(a => (a.name || a.type) === (item.name || item.type));
      
      if (exists) {
        // Remove quantity when unchecking
        const key = category === 'beverages' ? `beverage_${item.name}` :
                    category === 'refreshmentFood' ? `food_${item.name}` :
                    category === 'lunchThalis' ? `thali_${item.type}` : null;
        if (key) {
          setQuantities(prev => {
            const newQty = { ...prev };
            delete newQty[key];
            return newQty;
          });
        }
        
        return {
          ...prev,
          [category]: categoryItems.filter(a => (a.name || a.type) !== (item.name || item.type))
        };
      } else {
        // Set default quantity when checking
        const key = category === 'beverages' ? `beverage_${item.name}` :
                    category === 'refreshmentFood' ? `food_${item.name}` :
                    category === 'lunchThalis' ? `thali_${item.type}` : null;
        if (key) {
          setQuantities(prev => ({ ...prev, [key]: parseInt(quickBooking.guestCount) || 1 }));
        }
        
        return {
          ...prev,
          [category]: [...categoryItems, item]
        };
      }
    });
  };

  const isAmenitySelected = (category, itemName) => {
    return selectedAmenities[category].some(a => (a.name || a.type) === itemName);
  };

  const getBasicAmenityMaxQuantity = (key) => {
    if (!key?.startsWith('basic_')) return null;
    const amenityName = key.replace('basic_', '');
    const amenity = venue?.amenities?.basic?.find(a => a.name === amenityName);
    const max = Number(amenity?.maxQuantity);
    return Number.isFinite(max) && max > 0 ? max : null;
  };

  // Update quantity
  const updateQuantity = (key, value) => {
    const parsed = parseInt(value);
    const nextQty = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    const maxQty = getBasicAmenityMaxQuantity(key);
    const qty = maxQty ? Math.min(nextQty, maxQty) : nextQty;

    if (maxQty && nextQty > maxQty) {
      toast.error(`Maximum allowed is ${maxQty}`);
    }

    setQuantities(prev => ({ ...prev, [key]: qty }));
  };

  // Handle Book Now button click
  const handleBookNowClick = () => {
    if (!token) {
      // Save current booking state to localStorage
      const pendingBooking = {
        venueId: venue._id,
        venueSku: venue.sku,
        venueName: venue.businessName,
        quickBooking: quickBooking,
        selectedAmenities: selectedAmenities,
        quantities: quantities,
        shouldOpenModal: true, // Flag to open modal after login
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('pendingBooking', JSON.stringify(pendingBooking));
      toast.success('Please login to continue booking');
      router.push(`/login?redirect=/venues/${venue.sku}`);
      return;
    }
    
    // User is logged in, open booking form
    setBookingFormOpen(true);
  };

  const handleShareVenue = async () => {
    try {
      const shareUrl = typeof window !== 'undefined' ? window.location.href : `${process.env.NEXT_PUBLIC_SITE_URL || ''}/venues/${venue?.sku || params?.sku}`;
      const shareData = {
        title: venue?.businessName || 'RentalMeet Venue',
        text: `Check out this venue on RentalMeet: ${venue?.businessName || ''}`,
        url: shareUrl
      };

      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      toast.success('Venue link copied');
    } catch {
      toast.error('Unable to share venue');
    }
  };

  // Calculate estimate price
  const calculateEstimate = () => {
    if (!venue?.pricing || !quickBooking.duration) return 0;
    
    // Calculate base price
    const duration = parseInt(quickBooking.duration);
    let basePrice = 0;
    
    if (duration === 1 || duration === 2) {
      basePrice = (venue.pricing.perHour?.weekday || 0) * duration;
    } else if (duration === 4) {
      basePrice = venue.pricing.halfDay?.weekday || 0;
    } else if (duration === 8) {
      basePrice = venue.pricing.fullDay?.weekday || 0;
    }
    
    // Calculate amenities total
    let amenitiesTotal = 0;
    
    // Basic amenities
    selectedAmenities.basic.forEach(amenity => {
      if (amenity.type === 'Paid') {
        if (amenity.rateType === 'Per Use') {
          const qty = quantities[`basic_${amenity.name}`] || 0;
          amenitiesTotal += (amenity.rate || 0) * qty;
        } else {
          amenitiesTotal += amenity.rate || 0;
        }
      }
    });
    
    // Beverages
    selectedAmenities.beverages.forEach(beverage => {
      const qty = quantities[`beverage_${beverage.name}`] || 0;
      amenitiesTotal += (beverage.ratePerUnit || 0) * qty;
    });
    
    // Refreshment Food
    selectedAmenities.refreshmentFood.forEach(food => {
      const qty = quantities[`food_${food.name}`] || 0;
      amenitiesTotal += (food.ratePerPlate || 0) * qty;
    });
    
    // Lunch Thalis
    selectedAmenities.lunchThalis.forEach(thali => {
      const key = `thali_${thali.thaliType}_${thali.category}`;
      const qty = quantities[key] || 0;
      amenitiesTotal += (thali.ratePerPlate || 0) * qty;
    });
    
    const total = basePrice + amenitiesTotal;
    
    return {
      basePrice,
      amenitiesTotal,
      total
    };
  };

  const estimate = calculateEstimate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-slate-300">Loading venue details...</p>
        </div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 dark:text-slate-200 mb-2">Venue Not Found</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-6">{error || 'The venue you are looking for does not exist'}</p>
          <Link href="/venues" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  const categories = getImageCategories();
  const filteredImages = getFilteredImages();
  const imagesByCategory = getImagesByCategory();
  const freeBasicAmenities = venue.amenities?.basic?.filter(a => a.available && (a.type === 'Free' || a.type === 'Included')) || [];
  const paidBasicAmenities = venue.amenities?.basic?.filter(a => a.available && a.type === 'Paid') || [];
  const visibleFreeBasicAmenities = showAllIncludedFacilities ? freeBasicAmenities : freeBasicAmenities.slice(0, 4);

  // Inactive venue — show banner, no booking
  const isInactive = venue.isActive === false;

  return (
    <div className="min-h-screen bg-[#F5F0E8] dark:bg-slate-950">
      {/* Navbar */}
      <Navbar />

      {/* Back to all venues link */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 mt-[102px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Link href="/venues" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to all venues
          </Link>
        </div>
      </div>

      {/* Content - 2 Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images & Details (65%) - Scrollable */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image with Scrollable Thumbnails */}
            <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-800">
              {/* Main Large Image */}
              <div className="relative w-full aspect-[16/10] bg-gray-900 group overflow-hidden rounded-t-xl">
                {venue.images?.[currentMainImage]?.url ? (
                  <img
                    src={venue.images[currentMainImage].url}
                    alt={venue.businessName}
                    className="w-full h-full object-cover rounded-t-xl"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 rounded-t-xl">
                    <Building2 className="w-24 h-24 text-white/30" />
                  </div>
                )}

                {/* Watermark */}
                <div className="watermark-logo">
                  <img src="/logo.png" alt="" draggable={false} />
                </div>
                
                {/* Navigation Arrows */}
                {venue.images?.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-900 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
                
                {/* Status Badge */}
                <div className={`absolute top-3 left-3 px-3 py-1 rounded-full shadow-lg text-xs font-semibold backdrop-blur-sm ${
                  venue.status === 'approved' ? 'bg-green-500/90 text-white' :
                  venue.status === 'pending' ? 'bg-yellow-500/90 text-white' :
                  'bg-red-500/90 text-white'
                }`}>
                  {venue.status?.toUpperCase()}
                </div>

                {/* Image Counter */}
                {venue.images?.length > 0 && (
                  <div className="absolute top-3 right-3 px-3 py-1 bg-black/70 backdrop-blur-sm text-white rounded-full text-xs font-semibold">
                    {currentMainImage + 1} / {venue.images.length}
                  </div>
                )}

                {/* Category Badge */}
                {venue.images?.[currentMainImage]?.category && (
                  <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/70 backdrop-blur-sm text-white rounded-lg text-xs font-semibold">
                    {venue.images[currentMainImage].category}
                  </div>
                )}
              </div>

              {/* Scrollable Thumbnail Images */}
              {venue.images?.length > 1 && (
                <div className="relative bg-gray-50 dark:bg-slate-800 p-3">
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {venue.images.map((image, idx) => (
                      <div
                        key={idx}
                        onClick={() => setCurrentMainImage(idx)}
                        className={`relative flex-shrink-0 w-20 h-16 rounded-md overflow-hidden cursor-pointer group ${
                          currentMainImage === idx ? 'ring-2 ring-primary-500' : ''
                        }`}
                      >
                        <img
                          src={image.url}
                          alt={`${venue.businessName} - ${image.category}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className={`absolute inset-0 transition-colors duration-300 ${
                          currentMainImage === idx ? 'bg-black/0' : 'bg-black/0 group-hover:bg-black/20'
                        }`}></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Venue Name & Basic Info */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
              {isInactive && (
                <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 mb-4">
                  <PowerOff className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-red-700 dark:text-red-400">This venue is currently inactive</p>
                    <p className="text-xs text-red-500 dark:text-red-500">Bookings are not available at this time. Please check back later.</p>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100">
                  {venue.businessName}
                </h1>
                {venue.venueType?.length > 0 && (
                  <span className="px-3 py-1 bg-primary-50 dark:bg-slate-800 text-primary-600 dark:text-primary-400 text-xs font-semibold rounded-full border border-primary-200 dark:border-slate-600">
                    {venue.venueType[0]}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary-500" />
                  {venue.location?.city}, {venue.location?.area}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary-500" />
                  Up to {venue.capacity} guests
                </span>
                {venue.rating > 0 && (
                  <span className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 px-2.5 py-1 rounded-full">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-gray-900 dark:text-slate-100 text-sm">{venue.rating}</span>
                    <span className="text-gray-500 dark:text-slate-400 text-xs">({venue.reviewCount} reviews)</span>
                  </span>
                )}
              </div>

              {/* Availability Info */}
              {(venue.availability?.openingTime || venue.availability?.availableDays?.length > 0) && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-slate-300">
                  {venue.availability?.openingTime && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-primary-500" />
                      {(() => {
                        const to12 = (t) => {
                          const [h, m] = t.split(':').map(Number);
                          const period = h < 12 ? 'AM' : 'PM';
                          const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                          return `${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${period}`;
                        };
                        return `${to12(venue.availability.openingTime)} - ${to12(venue.availability.closingTime)}`;
                      })()}
                    </span>
                  )}
                  {venue.availability?.availableDays?.length > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-primary-500" />
                      {venue.availability.availableDays.join(', ')}
                    </span>
                  )}
                </div>
              )}
            </div>
            {/* Description */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
              <h2 className="font-serif text-xl font-bold text-dark-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-500" />
                About This Venue
              </h2>
              <p className="text-gray-500 dark:text-slate-400 leading-relaxed whitespace-pre-line text-sm">
                {venue.description}
              </p>
            </div>

            {/* Amenities - Interactive Selection */}
            <div className="space-y-4">
              <h2 className="font-serif text-xl font-bold text-dark-800 dark:text-slate-100">Select Amenities & Services</h2>
              
              {/* Basic Amenities */}
              {venue.amenities?.basic?.length > 0 && (
                <div className="space-y-4">
                  
                  {/* Included (Free) — white card */}
                  {freeBasicAmenities.length > 0 && (
                    <div className="bg-green-50 dark:bg-slate-900 rounded-xl border border-green-300 dark:border-green-800 p-5">
                      <h3 className="inline-flex items-center gap-2 font-semibold text-base text-green-800 dark:text-green-200 mb-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 px-3 py-1.5 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        Included Facilities (Free)
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {visibleFreeBasicAmenities.map((amenity, idx) => {
                          const AIcon = getAmenityIcon(amenity.name);
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-2 p-3 rounded-lg bg-green-100/70 dark:bg-green-900/20 border border-green-300 dark:border-green-800"
                            >
                              <AIcon className="w-4 h-4 text-green-600 flex-shrink-0" />
                              <span className="text-sm text-green-900 dark:text-green-100">{amenity.name}</span>
                            </div>
                          );
                        })}
                      </div>
                      {freeBasicAmenities.length > 4 && (
                        <button
                          type="button"
                          onClick={() => setShowAllIncludedFacilities(prev => !prev)}
                          className="mt-4 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
                        >
                          {showAllIncludedFacilities ? 'Show Less' : `+${freeBasicAmenities.length - 4} More`}
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Paid Amenities — warm tinted card */}
                  {paidBasicAmenities.length > 0 && (
                    <div className="bg-orange-50 dark:bg-slate-900 rounded-xl border border-orange-300 dark:border-orange-800 p-5">
                      <h3 className="inline-flex items-center gap-2 font-semibold text-base text-orange-800 dark:text-orange-200 mb-4 bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 px-3 py-1.5 rounded-lg">
                        <span className="w-5 h-5 rounded-full border-2 border-orange-500 flex items-center justify-center text-orange-500 text-xs font-bold">+</span>
                        Paid Facilities (Optional)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {paidBasicAmenities.map((amenity, idx) => {
                          const key = `basic_${amenity.name}`;
                          const qty = quantities[key] || 0;
                          const isSelected = isAmenitySelected('basic', amenity.name);
                          const isPerUse = amenity.rateType === 'Per Use';
                          
                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg border transition-all bg-orange-100/70 dark:bg-orange-900/20 ${
                                isSelected ? 'border-orange-500 ring-2 ring-orange-200 dark:ring-orange-900/30' : 'border-orange-300 dark:border-orange-800'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 flex-1">
                                  {(() => { const PIcon = getAmenityIcon(amenity.name); return <PIcon className="w-4 h-4 text-orange-600 flex-shrink-0" />; })()}
                                  <div className="flex flex-col flex-1">
                                    <span className="text-sm font-medium text-orange-900 dark:text-orange-100">{amenity.name}</span>
                                    <span className="text-[10px] text-orange-700 dark:text-orange-300 font-semibold">₹{amenity.rate} {amenity.rateType || 'Fixed'}</span>
                                  </div>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleAmenity('basic', amenity)}
                                  className="w-4 h-4 rounded border-2 border-orange-300 text-orange-500 focus:ring-2 focus:ring-orange-500 cursor-pointer"
                                />
                              </div>
                              
                              {isPerUse && isSelected && (
                                <div className="flex items-center gap-1.5 pt-2 border-t border-orange-200 dark:border-orange-900/30">
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(key, Math.max(0, qty - 1))}
                                    className="w-7 h-7 rounded border border-orange-300 dark:border-orange-700 hover:border-orange-500 hover:bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-700"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    value={qty}
                                    onChange={(e) => updateQuantity(key, parseInt(e.target.value) || 0)}
                                    className="w-14 h-7 text-center border border-orange-300 dark:border-orange-700 rounded text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                    min="0"
                                    max={amenity.maxQuantity || undefined}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(key, qty + 1)}
                                    className="w-7 h-7 rounded border border-orange-300 dark:border-orange-700 hover:border-orange-500 hover:bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-700"
                                  >
                                    +
                                  </button>
                                  <span className="text-xs font-semibold text-orange-700 ml-auto">₹{((amenity.rate || 0) * qty).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Beverages */}
              {venue.amenities?.beverages?.length > 0 && (
                <div className="bg-[#FEF7ED] dark:bg-slate-900 rounded-xl border border-[#F59F0A]/30 dark:border-slate-700 p-5">
                  <h3 className="font-semibold text-base text-primary-600 dark:text-primary-400 mb-4 flex items-center gap-2">
                    <Coffee className="w-5 h-5 text-primary-500" />
                    Beverages
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {venue.amenities.beverages.filter(b => b.available && b.name).map((beverage, idx) => {
                      const key = `beverage_${beverage.name}`;
                      const qty = quantities[key] || 0;
                      const isSelected = isAmenitySelected('beverages', beverage.name);
                      
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border transition-all bg-white dark:bg-slate-900 ${
                            isSelected ? 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-900/30' : 'border-gray-200 dark:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1">
                              {(() => { const BIcon = getAmenityIcon(beverage.name); return <BIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />; })()}
                              <div className="flex flex-col flex-1">
                                <span className="text-sm font-medium text-gray-800 dark:text-slate-200">{beverage.name}</span>
                                <span className="text-[10px] text-primary-500 font-semibold">₹{beverage.ratePerUnit}/person</span>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleAmenity('beverages', beverage)}
                              className="w-4 h-4 rounded border-2 border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                            />
                          </div>
                          {isSelected && (
                          <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100 dark:border-slate-800">
                            <button type="button" onClick={() => updateQuantity(key, Math.max(0, qty - 1))} className="w-7 h-7 rounded border border-gray-300 dark:border-slate-600 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center text-sm font-bold">-</button>
                            <input type="number" value={qty} onChange={(e) => updateQuantity(key, parseInt(e.target.value) || 0)} className="w-14 h-7 text-center border border-gray-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" min="0" />
                            <button type="button" onClick={() => updateQuantity(key, qty + 1)} className="w-7 h-7 rounded border border-gray-300 dark:border-slate-600 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center text-sm font-bold">+</button>
                            <span className="text-xs font-semibold text-primary-600 ml-auto">₹{((beverage.ratePerUnit || 0) * qty).toLocaleString()}</span>
                          </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Refreshment Food */}
              {venue.amenities?.refreshmentFood?.length > 0 && (
                <div className="bg-[#FEF7ED] dark:bg-slate-900 rounded-xl border border-[#F59F0A]/30 dark:border-slate-700 p-5">
                  <h3 className="font-semibold text-base text-primary-600 dark:text-primary-400 mb-4 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-primary-500" />
                    Refreshments & Snacks
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {venue.amenities.refreshmentFood.filter(f => f.available).map((food, idx) => {
                      const key = `food_${food.name}`;
                      const qty = quantities[key] || 0;
                      const isSelected = isAmenitySelected('refreshmentFood', food.name);
                      
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg border transition-all bg-white dark:bg-slate-900 ${
                            isSelected ? 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-900/30' : 'border-gray-200 dark:border-slate-700'
                          }`}
                        >
                          <label className="flex items-center justify-between cursor-pointer mb-2">
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleAmenity('refreshmentFood', food)}
                                className="w-4 h-4 rounded border-2 border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                              />
                              {(() => { const FIcon = getAmenityIcon(food.name); return <FIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />; })()}
                              <div className="flex flex-col flex-1">
                                <span className="text-sm font-medium text-gray-800 dark:text-slate-200">{food.name}</span>
                                <span className="text-[10px] text-primary-500 font-semibold">₹{food.ratePerPlate}/plate</span>
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleAmenity('refreshmentFood', food)}
                              className="w-4 h-4 rounded border-2 border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                            />
                          </label>
                          
                          {isSelected && (
                            <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100 dark:border-slate-800">
                              <button type="button" onClick={() => updateQuantity(key, Math.max(0, qty - 1))} className="w-7 h-7 rounded border border-gray-300 dark:border-slate-600 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center text-sm font-bold">-</button>
                              <input type="number" value={qty} onChange={(e) => updateQuantity(key, parseInt(e.target.value) || 0)} className="w-14 h-7 text-center border border-gray-300 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" min="0" />
                              <button type="button" onClick={() => updateQuantity(key, qty + 1)} className="w-7 h-7 rounded border border-gray-300 dark:border-slate-600 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center text-sm font-bold">+</button>
                              <span className="text-xs font-semibold text-primary-600 ml-auto">₹{((food.ratePerPlate || 0) * qty).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lunch Thalis - New Structure */}
              {venue.amenities?.lunchThalis?.length > 0 && (
                <div className="bg-[#FEF7ED] dark:bg-slate-900 rounded-xl border border-[#F59F0A]/30 dark:border-slate-700 p-5">
                  <h3 className="font-semibold text-base text-primary-600 dark:text-primary-400 mb-4 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-primary-500" />
                    Lunch Thalis
                  </h3>
                  <div className="space-y-3">
                    {venue.amenities.lunchThalis.map((thali, thaliIdx) => (
                      <div key={thaliIdx} className="bg-white dark:bg-slate-800 border border-[#F59F0A]/20 dark:border-slate-700 rounded-xl p-4">
                        {/* Thali Type Header */}
                        <h4 className="font-semibold text-gray-800 dark:text-slate-200 mb-3 text-sm">{thali.thaliType}</h4>
                        
                        {/* Categories */}
                        <div className="space-y-2">
                          {thali.categories?.map((category, catIdx) => {
                            const key = `thali_${thali.thaliType}_${category.category}`;
                            const qty = quantities[key] || 0;
                            const isSelected = selectedAmenities.lunchThalis?.some(
                              t => t.thaliType === thali.thaliType && t.category === category.category
                            );
                            
                            return (
                              <div
                                key={catIdx}
                                className={`p-3 border rounded-lg transition-all bg-white dark:bg-slate-900 ${
                                  isSelected ? 'border-primary-500 ring-2 ring-primary-100 dark:ring-primary-900/30' : 'border-gray-200 dark:border-slate-700'
                                }`}
                              >
                                <label className="flex items-center justify-between cursor-pointer mb-2">
                                  <div className="flex items-center gap-2 flex-1">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => {
                                        if (isSelected) {
                                          // Remove from selection
                                          setSelectedAmenities(prev => ({
                                            ...prev,
                                            lunchThalis: prev.lunchThalis.filter(
                                              t => !(t.thaliType === thali.thaliType && t.category === category.category)
                                            )
                                          }));
                                          // Reset quantity
                                          setQuantities(prev => ({ ...prev, [key]: 0 }));
                                        } else {
                                          // Add to selection
                                          setSelectedAmenities(prev => ({
                                            ...prev,
                                            lunchThalis: [...prev.lunchThalis, {
                                              thaliType: thali.thaliType,
                                              category: category.category,
                                              ratePerPlate: category.ratePerPlate,
                                              numberOfItems: category.numberOfItems,
                                              itemNames: category.itemNames
                                            }]
                                          }));
                                          // Set initial quantity to 1
                                          setQuantities(prev => ({ ...prev, [key]: 1 }));
                                        }
                                      }}
                                      className="w-4 h-4 rounded border-2 border-orange-300 text-orange-500 focus:ring-2 focus:ring-orange-500 cursor-pointer"
                                    />
                                    <div className="flex-1">
                                      <span className="font-semibold text-xs block text-gray-800">{category.category}</span>
                                      <span className="text-xs text-gray-500">
                                        {category.numberOfItems} items
                                      </span>
                                      {category.itemNames && (
                                        <span className="text-xs text-gray-500 block mt-0.5 italic">
                                          {category.itemNames}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-xs font-semibold text-orange-600">₹{category.ratePerPlate}/plate</span>
                                </label>
                                
                                {isSelected && (
                                  <div className="flex items-center gap-1 ml-6">
                                    <button type="button" onClick={() => updateQuantity(key, Math.max(0, qty - 1))} className="w-7 h-7 rounded border border-gray-300 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center text-xs font-bold">-</button>
                                    <input type="number" value={qty} onChange={(e) => updateQuantity(key, parseInt(e.target.value) || 0)} className="w-12 h-7 text-center border border-gray-300 dark:border-slate-700 rounded text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" min="0" />
                                    <button type="button" onClick={() => updateQuantity(key, qty + 1)} className="w-7 h-7 rounded border border-gray-300 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center text-xs font-bold">+</button>
                                    <span className="text-xs font-semibold text-primary-600 ml-1">₹{((category.ratePerPlate || 0) * qty).toLocaleString()}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Kitchen & Dining */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {venue.amenities?.kitchenAccess?.available && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Kitchen Access</h4>
                    <p className="text-sm text-green-700">
                      {venue.amenities.kitchenAccess.type === 'Included' ? (
                        'Included in booking'
                      ) : (
                        `₹${venue.amenities.kitchenAccess.charges} extra`
                      )}
                    </p>
                  </div>
                )}
                {venue.amenities?.diningArea?.available && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Dining Area</h4>
                    <p className="text-sm text-blue-700">
                      {venue.amenities.diningArea.type === 'Included' ? (
                        'Included in booking'
                      ) : (
                        `₹${venue.amenities.diningArea.charges} extra`
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Location Details */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
              <h2 className="font-serif text-xl font-bold text-dark-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-500" />
                Location
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-slate-300">
                {venue.location?.address && <div><span className="font-semibold text-gray-800 dark:text-slate-200">Address:</span> {venue.location.address}</div>}
                {venue.location?.landmark && <div><span className="font-semibold text-gray-800 dark:text-slate-200">Landmark:</span> {venue.location.landmark}</div>}
                {venue.location?.state && <div><span className="font-semibold text-gray-800 dark:text-slate-200">State:</span> {venue.location.state}</div>}
                {venue.location?.city && <div><span className="font-semibold text-gray-800 dark:text-slate-200">City:</span> {venue.location.city}</div>}
                {venue.location?.village && <div><span className="font-semibold text-gray-800 dark:text-slate-200">Village:</span> {venue.location.village}</div>}
                {venue.location?.area && <div><span className="font-semibold text-gray-800 dark:text-slate-200">Area:</span> {venue.location.area}</div>}
                {venue.location?.pincode && <div><span className="font-semibold text-gray-800 dark:text-slate-200">Pincode:</span> {venue.location.pincode}</div>}
                {venue.location?.parkingAvailability && <div><span className="font-semibold text-gray-800 dark:text-slate-200">Parking:</span> {venue.location.parkingAvailability}</div>}
                {venue.location?.nearestBusAuto && <div><span className="font-semibold text-gray-800 dark:text-slate-200">Nearest Bus/Auto:</span> {venue.location.nearestBusAuto}</div>}
                {venue.location?.nearestMetroTrain && <div><span className="font-semibold text-gray-800 dark:text-slate-200">Nearest Metro/Train:</span> {venue.location.nearestMetroTrain}</div>}
              </div>
                {venue.location?.googleMapLink && (
                  <a
                    href={venue.location.googleMapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-sm text-primary-500 hover:text-primary-600 font-medium"
                  >
                    <MapPin className="w-4 h-4" />
                    View on Google Maps
                  </a>
                )}
            </div>

            {/* Pricing - Card Format */}
            {venue.pricing && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
                <h2 className="font-serif text-xl font-bold text-dark-800 dark:text-slate-100 mb-4">Pricing (Weekday)</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 1 Hour Card - Only show if enabled */}
                  {venue.pricing.enabledOptions?.perHour && venue.pricing.perHour && (
                    <div 
                      onClick={() => setQuickBooking(prev => ({ ...prev, duration: '1' }))}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        quickBooking.duration === '1' 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="text-center">
                        <h3 className="font-semibold text-sm mb-0.5 text-gray-900 dark:text-slate-100">1 Hour</h3>
                        <p className="text-lg font-bold text-primary-600">₹{venue.pricing.perHour.weekday?.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* 4 Hours Card - Only show if enabled */}
                  {venue.pricing.enabledOptions?.halfDay && venue.pricing.halfDay && (
                    <div 
                      onClick={() => setQuickBooking(prev => ({ ...prev, duration: '4' }))}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        quickBooking.duration === '4' 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="text-center">
                        <h3 className="font-semibold text-sm mb-0.5 text-gray-900 dark:text-slate-100">Half Day</h3>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">4 hours</p>
                        <p className="text-lg font-bold text-primary-600">₹{venue.pricing.halfDay.weekday?.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* 8 Hours Card - Only show if enabled */}
                  {venue.pricing.enabledOptions?.fullDay && venue.pricing.fullDay && (
                    <div 
                      onClick={() => setQuickBooking(prev => ({ ...prev, duration: '8' }))}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        quickBooking.duration === '8' 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="text-center">
                        <h3 className="font-semibold text-sm mb-0.5 text-gray-900 dark:text-slate-100">Full Day</h3>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">8 hours</p>
                        <p className="text-lg font-bold text-primary-600">₹{venue.pricing.fullDay.weekday?.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reviews Section */}
            <VenueReviews venueId={venue._id} />
          </div>

          {/* Right Column - Sticky Booking Card (35%) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-[100px] space-y-3">
              {/* Booking Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-4">
                {isInactive ? (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <PowerOff className="w-7 h-7 text-red-500" />
                    </div>
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100 mb-1">Venue Inactive</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">This venue is temporarily unavailable. Bookings are disabled.</p>
                  </div>
                ) : (
                <>
                <h2 className="font-serif text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">Book This Venue</h2>
                
                {/* Price Range */}
                <div className="mb-3 pb-3 border-b border-gray-200 dark:border-slate-700">
                  {(() => {
                    const p = venue.pricing;
                    const opts = p?.enabledOptions || {};
                    // Find the lowest enabled price
                    const prices = [];
                    if (opts.perHour && p?.perHour?.weekday) prices.push({ label: '/hour', val: p.perHour.weekday });
                    if (opts.halfDay && p?.halfDay?.weekday) prices.push({ label: '/half day', val: p.halfDay.weekday });
                    if (opts.fullDay && p?.fullDay?.weekday) prices.push({ label: '/full day', val: p.fullDay.weekday });
                    const min = prices.length > 0 ? prices.reduce((a, b) => a.val < b.val ? a : b) : null;
                    return min ? (
                      <>
                        <p className="text-gray-600 dark:text-slate-400 text-xs mb-0.5">Starting from</p>
                        <p className="text-2xl font-bold text-primary-600">
                          ₹{min.val.toLocaleString()}
                          <span className="text-xs text-gray-600 dark:text-slate-400">{min.label}</span>
                        </p>
                      </>
                    ) : null;
                  })()}
                </div>

                {/* Booking Form */}
                <div className="space-y-2.5">
                  {/* Date + Time — one row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">Select Date</label>
                      <DatePicker
                        selected={quickBooking.date}
                        onChange={(date) => setQuickBooking(prev => ({ ...prev, date }))}
                        minDate={(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })()}
                        filterDate={(date) => {
                          const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
                          const dayName = dayNames[date.getDay()];
                          const availableDays = venue?.availability?.availableDays || [];
                          if (availableDays.length > 0 && !availableDays.includes(dayName)) return false;
                          return !bookedDates.some(bd =>
                            bd.getFullYear() === date.getFullYear() &&
                            bd.getMonth() === date.getMonth() &&
                            bd.getDate() === date.getDate()
                          );
                        }}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Pick a date"
                        className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        calendarClassName="custom-calendar"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">Start Time</label>
                      <select
                        value={quickBooking.startTime}
                        className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                        onChange={(e) => setQuickBooking(prev => ({ ...prev, startTime: e.target.value }))}
                      >
                        <option value="">Select time</option>
                        {(() => {
                          const opening = venue.availability?.openingTime || '00:00';
                          const closing = venue.availability?.closingTime || '23:30';
                          const [openH, openM] = opening.split(':').map(Number);
                          const [closeH, closeM] = closing.split(':').map(Number);
                          const openMins = openH * 60 + openM;
                          const closeMins = closeH * 60 + closeM;
                          const slots = [];
                          for (let m = openMins; m < closeMins; m += 30) {
                            const h = Math.floor(m / 60);
                            const min = m % 60;
                            const val = `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`;
                            const period = h < 12 ? 'AM' : 'PM';
                            const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
                            const label = `${String(h12).padStart(2,'0')}:${String(min).padStart(2,'0')} ${period}`;
                            slots.push(<option key={val} value={val}>{label}</option>);
                          }
                          return slots;
                        })()}
                      </select>
                    </div>
                  </div>

                  {/* Duration Cards — no icon, compact */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">Select Duration</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {venue.pricing?.enabledOptions?.perHour && venue.pricing?.perHour?.weekday && (
                        <>
                          {[{ dur: '1', label: '1h', price: venue.pricing.perHour.weekday }, { dur: '2', label: '2h', price: venue.pricing.perHour.weekday * 2 }].map(({ dur, label, price }) => (
                            <button
                              key={dur}
                              type="button"
                              onClick={() => setQuickBooking(prev => ({ ...prev, duration: dur }))}
                              className={`py-1.5 px-2 rounded-lg border-2 text-center transition-all ${
                                quickBooking.duration === dur
                                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                  : 'border-gray-200 dark:border-slate-700 hover:border-primary-300'
                              }`}
                            >
                              <span className="block text-xs font-bold text-gray-900 dark:text-slate-100">{label}</span>
                              <span className={`text-xs font-semibold ${quickBooking.duration === dur ? 'text-primary-600' : 'text-gray-500 dark:text-slate-400'}`}>₹{price.toLocaleString('en-IN')}</span>
                            </button>
                          ))}
                        </>
                      )}
                      {venue.pricing?.enabledOptions?.halfDay && venue.pricing?.halfDay?.weekday && (
                        <button
                          type="button"
                          onClick={() => setQuickBooking(prev => ({ ...prev, duration: '4' }))}
                          className={`py-1.5 px-2 rounded-lg border-2 text-center transition-all ${
                            quickBooking.duration === '4'
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-slate-700 hover:border-primary-300'
                          }`}
                        >
                          <span className="block text-xs font-bold text-gray-900 dark:text-slate-100">Half Day</span>
                          <span className={`text-xs font-semibold ${quickBooking.duration === '4' ? 'text-primary-600' : 'text-gray-500 dark:text-slate-400'}`}>₹{venue.pricing.halfDay.weekday.toLocaleString('en-IN')}</span>
                        </button>
                      )}
                      {venue.pricing?.enabledOptions?.fullDay && venue.pricing?.fullDay?.weekday && (
                        <button
                          type="button"
                          onClick={() => setQuickBooking(prev => ({ ...prev, duration: '8' }))}
                          className={`py-1.5 px-2 rounded-lg border-2 text-center transition-all ${
                            quickBooking.duration === '8'
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-slate-700 hover:border-primary-300'
                          }`}
                        >
                          <span className="block text-xs font-bold text-gray-900 dark:text-slate-100">Full Day</span>
                          <span className={`text-xs font-semibold ${quickBooking.duration === '8' ? 'text-primary-600' : 'text-gray-500 dark:text-slate-400'}`}>₹{venue.pricing.fullDay.weekday.toLocaleString('en-IN')}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* End Time (auto-calculated) */}
                  {quickBooking.startTime && quickBooking.duration && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">End Time</label>
                      <div className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg text-xs bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400">
                        {(() => {
                          const [h, m] = quickBooking.startTime.split(':').map(Number);
                          const totalMins = h * 60 + m + parseInt(quickBooking.duration) * 60;
                          const endH = Math.floor(totalMins / 60) % 24;
                          const endM = totalMins % 60;
                          const period = endH < 12 ? 'AM' : 'PM';
                          const h12 = endH === 0 ? 12 : endH > 12 ? endH - 12 : endH;
                          return `${String(h12).padStart(2,'0')}:${String(endM).padStart(2,'0')} ${period}`;
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Estimated Total */}
                  {estimate.total > 0 && (
                  <div className="bg-primary-50 dark:bg-slate-800/50 rounded-lg p-2.5 border border-primary-200 dark:border-slate-700">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600 dark:text-slate-300">Base Price:</span>
                        <span className="text-xs font-semibold text-gray-900 dark:text-slate-100">₹{estimate.basePrice.toLocaleString()}</span>
                      </div>
                      {estimate.amenitiesTotal > 0 && (
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-600 dark:text-slate-300">Amenities:</span>
                          <span className="text-xs font-semibold text-gray-900 dark:text-slate-100">₹{estimate.amenitiesTotal.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-1.5 border-t border-primary-300 dark:border-slate-700">
                        <span className="text-xs font-bold text-gray-900 dark:text-slate-100">Estimated Total:</span>
                        <span className="text-lg font-bold text-primary-600">₹{estimate.total.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {/* Reserve Now Button */}
                  <button
                    onClick={() => {
                      if (!token) {
                        setLoginModalOpen(true);
                        return;
                      }
                      // KYC check — customer must have ID proof + selfie
                      if (user?.role === 'customer' && (!user?.kyc?.idProof || !user?.kyc?.selfie)) {
                        router.push('/customer/profile?tab=kyc');
                        toast.error('Please complete your KYC (ID proof + selfie) to book a venue.');
                        return;
                      }
                      setBookingFormOpen(true);
                    }}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2.5 rounded-lg text-sm font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    Reserve Now
                  </button>
              </div>
              </>
              )}
            </div>

              {/* Share Button */}
              <button
                onClick={handleShareVenue}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border-2 border-primary-500 text-primary-500 rounded-lg text-xs font-semibold hover:bg-primary-50 dark:hover:bg-slate-800 transition-colors shadow-md"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share Venue
              </button>

              {/* Available Coupons */}
              {venueCoupons.length > 0 && (
                <div className="bg-green-50 dark:bg-slate-900 rounded-xl border-2 border-green-300 dark:border-green-800 p-3 shadow-sm">
                  <p className="inline-flex items-center gap-1 text-xs font-bold text-green-800 dark:text-green-200 mb-2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 px-2.5 py-1 rounded-md">Available Coupons</p>
                  <div className="space-y-2">
                    {venueCoupons.map((c) => (
                      <div key={c._id} className="flex items-center justify-between bg-green-100/70 dark:bg-green-900/20 border border-green-300 dark:border-green-800 rounded-lg px-3 py-2">
                        <div>
                          <span className="text-xs font-black text-green-700 dark:text-green-300 tracking-wider">{c.code}</span>
                          <p className="text-[10px] text-green-800/80 dark:text-green-200/80 mt-0.5">
                            {c.discountType === 'percentage'
                              ? `${c.discountValue}% off${c.maxDiscount ? ` (max ₹${c.maxDiscount})` : ''}`
                              : `₹${c.discountValue} off`}
                            {c.minBookingAmount > 0 ? ` · min ₹${c.minBookingAmount}` : ''}
                          </p>
                        </div>
                        <button
                          onClick={() => { navigator.clipboard.writeText(c.code); toast.success(`Copied: ${c.code}`); }}
                          className="text-[10px] text-green-700 dark:text-green-300 font-bold hover:underline"
                        >
                          Copy
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100 mb-2">Login Required</h3>
            <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">Please login or register to book this venue.</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setLoginModalOpen(false);
                  router.push(`/login?redirect=/venues/${venue.sku}`);
                }}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2.5 rounded-lg font-semibold transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setLoginModalOpen(false);
                  router.push(`/register?redirect=/venues/${venue.sku}`);
                }}
                className="w-full border-2 border-primary-500 text-primary-500 hover:bg-primary-50 py-2.5 rounded-lg font-semibold transition-colors"
              >
                Register
              </button>
              <button
                onClick={() => setLoginModalOpen(false)}
                className="w-full text-gray-500 hover:text-gray-700 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      {bookingFormOpen && (
        <BookingForm 
          venue={venue}
          initialData={quickBooking}
          initialAmenities={selectedAmenities}
          initialQuantities={quantities}
          onClose={() => setBookingFormOpen(false)} 
        />
      )}
    </div>
  );
}
