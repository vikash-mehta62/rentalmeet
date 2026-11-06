'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  Building2, MapPin, Users, Clock, Calendar,
  Wifi, Coffee, Utensils, CheckCircle2, ArrowLeft, ArrowRight,
  Star, Phone, Mail, Share2, Image as ImageIcon, X,
  ChevronLeft, ChevronRight, Sparkles, Award, Shield, PowerOff,
  Projector, Car, Tv, Wind, Zap, Music, Camera, Printer,
  Monitor, Mic, Volume2, Thermometer, Droplets, Flame,
  Package, Dumbbell, Baby, Accessibility, ParkingCircle,
  UtensilsCrossed, CupSoda, Sandwich, ChefHat, Refrigerator,
  Sofa, Bed, Bath, Shirt, Scissors, FlowerIcon, Leaf,
  Send, AlertTriangle, FileText, Bike, Globe, Compass,
  ExternalLink, Eye, ShieldCheck, Layers, BadgePercent,
  Ban, Check, Info, Wine, Dog, Heart
} from 'lucide-react';
import BookingForm from '@/components/booking/BookingForm';
import VenueReviews from '@/components/venue/VenueReviews';
import Navbar from '@/components/Navbar';
import { useFavorites } from '@/lib/favorites';
import { useAuthStore } from '@/lib/store';
import { getDateRateKey, getVenueDurationBasePrice, getVenueStartingPrice, isOnlineBookingOpen, getMinAdvanceBookingDate, formatTime12Hour, isVenueVerified } from '@/lib/venuePricing';
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

function getFoodTypeIcon(foodType) {
  if (foodType === 'Veg') return Leaf;
  if (foodType === 'Non Veg') return UtensilsCrossed;
  return Utensils;
}

const PER_PAX_PACKAGES = [
  { key: 'withoutFood', aliases: ['withoutFood'], label: 'Without Food', desc: 'Space rental charged per guest' },
  { key: 'breakfastOnly', aliases: ['breakfastOnly', 'breakfast', 'onlyBreakfast'], label: 'Only Breakfast', desc: 'Space rental with morning breakfast' },
  { key: 'breakfastLunch', aliases: ['breakfastLunch', 'highTea'], label: 'Breakfast + Lunch', desc: 'Space rental with breakfast & lunch' },
  { key: 'lunchOnly', aliases: ['lunchOnly', 'lunch', 'onlyLunch'], label: 'Only Lunch', desc: 'Space rental with afternoon lunch' },
  { key: 'dinnerOnly', aliases: ['dinnerOnly', 'dinner', 'onlyDinner'], label: 'Only Dinner', desc: 'Space rental with evening dinner' },
  { key: 'allMeals', aliases: ['allMeals', 'fullDayMeal'], label: 'All Meals (B+L+D)', desc: 'Complete daily meal package' }
];

export default function VenueDetail() {
  const params = useParams();
  const router = useRouter();
  const { isVenueFav, toggleVenue } = useFavorites();
  const searchParams = useSearchParams();
  const enquiryId = searchParams?.get('enquiryId');
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
  const [similarVenues, setSimilarVenues] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [showAllIncludedFacilities, setShowAllIncludedFacilities] = useState(false);
  const [initialEnquiryData, setInitialEnquiryData] = useState(null);

  // Fetch booked dates for this venue
  useEffect(() => {
    if (params.sku) fetchBookedDates();
  }, [params.sku]);

  // Load enquiry draft if enquiryId is present in URL
  useEffect(() => {
    if (enquiryId) {
      fetchEnquiryDraft(enquiryId);
    }
  }, [enquiryId]);

  const fetchEnquiryDraft = async (id) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues/enquiry/${id}`);
      const data = await res.json();
      if (data.success && data.enquiry) {
        const enq = data.enquiry;
        setInitialEnquiryData(enq);
        const bd = enq.bookingDetails || {};
        const cd = enq.customerDetails || {};
        const rawDate = bd.bookingDate || bd.date;
        const duration = bd.duration || (bd.bookingType === 'halfday' ? '4' : bd.bookingType === 'fullday' ? '8' : '1');

        setQuickBooking({
          date: rawDate ? new Date(rawDate) : null,
          startTime: bd.startTime || '',
          duration: String(duration),
          guestCount: cd.guestCount || bd.guests || ''
        });

        const sa = enq.selectedAmenities || {};
        const qMap = {};

        const basicList = [];
        (sa.basic || []).forEach(b => {
          if (typeof b === 'string') {
            basicList.push({ name: b });
          } else if (b && b.name) {
            basicList.push(b);
            if (b.quantity) qMap[`basic_${b.name}`] = b.quantity;
          }
        });

        const bevList = [];
        (sa.beverages || []).forEach(b => {
          bevList.push(b);
          if (b.quantity) qMap[`beverage_${b.name}`] = b.quantity;
        });

        const foodList = [];
        (sa.refreshmentFood || []).forEach(f => {
          foodList.push(f);
          if (f.quantity) qMap[`food_${f.name}`] = f.quantity;
        });

        const thaliList = [];
        (sa.lunchThalis || []).forEach(t => {
          thaliList.push(t);
          if (t.quantity) qMap[`thali_${t.thaliType}_${t.category}`] = t.quantity;
        });

        setSelectedAmenities({
          basic: basicList,
          beverages: bevList,
          refreshmentFood: foodList,
          lunchThalis: thaliList,
          additional: sa.additional || []
        });
        setQuantities(qMap);
        setBookingFormOpen(true);
        toast.success('Loaded enquiry draft! Complete your booking below.');
      }
    } catch (e) {
      console.error('Error fetching enquiry draft:', e);
    }
  };

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
  
  const capacityLimit = (() => {
    const text = String(venue?.capacity || '').trim();
    const values = text.match(/\d+/g)?.map(Number).filter(Number.isFinite) || [];
    return values.length ? Math.max(...values) : null;
  })();

  // Quick booking form state
  const [quickBooking, setQuickBooking] = useState({
    date: null,
    startTime: '',
    duration: '1',
    pricingModel: 'Rent with Amenities',
    perPaxPackage: 'withoutFood',
    guestCount: 1
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

    // Auto-select first available duration and pricing model
    if (venue?.pricing) {
      const selectedModels = venue.pricing.selectedPricingModels || [];
      const hasOnlyRent = selectedModels.some(m => m.toLowerCase().includes('only rent')) ||
        (venue.pricing.onlyRent && (venue.pricing.onlyRent.hourly?.rate > 0 || venue.pricing.onlyRent.halfDay?.rate > 0 || venue.pricing.onlyRent.fullDay?.rate > 0));
      const hasRentAmenities = selectedModels.some(m => m.toLowerCase().includes('amenities')) ||
        (venue.pricing.rentWithAmenities && (venue.pricing.rentWithAmenities.hourly?.rate > 0 || venue.pricing.rentWithAmenities.halfDay?.rate > 0 || venue.pricing.rentWithAmenities.fullDay?.rate > 0));
      const hasPerPax = selectedModels.some(m => m.toLowerCase().includes('pax')) ||
        Object.values(venue.pricing.perPax || {}).some(p => Number(p?.rate) > 0);

      let initialModel = 'Only Rent';
      if (selectedModels.length > 0) {
        initialModel = selectedModels[0];
      } else if (hasRentAmenities && !hasOnlyRent) {
        initialModel = 'Rent with Amenities';
      } else if (hasPerPax && !hasOnlyRent && !hasRentAmenities) {
        initialModel = 'Per Pax';
      }

      setQuickBooking(prev => {
        const activeModel = prev.pricingModel || initialModel;
        return {
          ...prev,
          pricingModel: activeModel,
          duration: prev.duration || (getVenueDurationBasePrice(venue, '1', prev.date, { pricingModel: activeModel }) > 0 ? '1' : getVenueDurationBasePrice(venue, '4', prev.date, { pricingModel: activeModel }) > 0 ? '4' : '8'),
          perPaxPackage: prev.perPaxPackage || 'withoutFood',
          guestCount: prev.guestCount || 1
        };
      });
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

  const fetchSimilarVenues = async () => {
    if (!venue) return;
    setSimilarLoading(true);
    try {
      const city = venue.location?.city ? venue.location.city.split(',')[0].trim() : '';
      let url = `${process.env.NEXT_PUBLIC_API_URL}/venues?limit=12`;
      if (city) {
        url += `&city=${encodeURIComponent(city)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      let list = Array.isArray(data.venues) ? data.venues : [];

      // Filter out current venue
      list = list.filter(v => v.sku !== params.sku && v._id !== venue._id);

      // If less than 4 venues found for city, fetch global venues as fallback
      if (list.length < 4) {
        try {
          const fallbackRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues?limit=12`);
          const fallbackData = await fallbackRes.json();
          if (Array.isArray(fallbackData.venues)) {
            const extra = fallbackData.venues.filter(v => v.sku !== params.sku && v._id !== venue._id && !list.some(existing => existing.sku === v.sku));
            list = [...list, ...extra];
          }
        } catch {
          // silent fallback
        }
      }

      // Sort: Verified first, then highest profile score
      const sorted = list.sort((a, b) => {
        const aVer = isVenueVerified(a) ? 1 : 0;
        const bVer = isVenueVerified(b) ? 1 : 0;
        if (bVer !== aVer) return bVer - aVer;
        return (Number(b.profileCompletion) || 0) - (Number(a.profileCompletion) || 0);
      });

      setSimilarVenues(sorted.slice(0, 4));
    } catch (err) {
      console.error('Error fetching similar venues:', err);
    } finally {
      setSimilarLoading(false);
    }
  };

  useEffect(() => {
    if (venue) {
      fetchSimilarVenues();
    }
  }, [venue?._id, venue?.location?.city]);

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
      const categoryItems = prev[category] || [];
      const itemKeyName = item.name || item.type || item.thaliType;
      const exists = categoryItems.find(a => (a.name || a.type || a.thaliType) === itemKeyName);
      
      const key = category === 'beverages' ? `beverage_${item.name}` :
                  category === 'refreshmentFood' ? `food_${item.name}` :
                  category === 'lunchThalis' ? `thali_${item.name || item.thaliType}` : null;
      if (exists) {
        if (key) {
          setQuantities(prevQ => {
            const newQty = { ...prevQ };
            delete newQty[key];
            return newQty;
          });
        }
        
        return {
          ...prev,
          [category]: categoryItems.filter(a => (a.name || a.type || a.thaliType) !== itemKeyName)
        };
      } else {
        if (key) {
          setQuantities(prevQ => ({ ...prevQ, [key]: parseInt(quickBooking.guestCount) || 1 }));
        }
        
        return {
          ...prev,
          [category]: [...categoryItems, item]
        };
      }
    });
  };

  const isAmenitySelected = (category, itemName) => {
    return (selectedAmenities[category] || []).some(a => (a.name || a.type || a.thaliType) === itemName);
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
  const handleBookNowClick = async () => {
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

    // Only check KYC for customers
    if (user?.role === 'customer') {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          const kyc = data.user?.kyc || {};
          if (!kyc.idProof || !kyc.selfie) {
            toast.error('Please complete your KYC (ID proof + selfie) to book a venue.');
            router.push('/customer/profile?tab=kyc');
            return;
          }
        }
      } catch {
        // If fetch fails, let backend handle the check
      }
    }
    
    // User is logged in and KYC is done, open booking form
    setBookingFormOpen(true);
  };

  const handleShareVenue = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : `${process.env.NEXT_PUBLIC_SITE_URL || ''}/venues/${venue?.sku || params?.sku}`;
    const shareData = {
      title: venue?.businessName || 'RentalMeet Venue',
      text: `Check out this venue on RentalMeet: ${venue?.businessName || ''}`,
      url: shareUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled share — no error toast needed
        if (err?.name !== 'AbortError') {
          // Fallback to clipboard if share fails for other reasons
          try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Venue link copied to clipboard');
          } catch {
            toast.error('Unable to share venue');
          }
        }
      }
      return;
    }

    // Fallback for browsers without Web Share API
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Venue link copied to clipboard');
    } catch {
      toast.error('Unable to copy venue link');
    }
  };

  const quickBookingRateKey = getDateRateKey(quickBooking.date);
  const quickBookingRateLabel = quickBookingRateKey === 'weekend' ? 'Weekend' : 'Weekday';

  const getQuickBookingBasePrice = (duration = quickBooking.duration, overrideOptions = {}) => (
    getVenueDurationBasePrice(venue, duration, quickBooking.date, {
      pricingModel: overrideOptions.pricingModel || quickBooking.pricingModel,
      perPaxPackage: overrideOptions.perPaxPackage || quickBooking.perPaxPackage,
      guestCount: overrideOptions.guestCount || quickBooking.guestCount || 1,
      ...overrideOptions
    })
  );

  const availablePricingModels = (() => {
    const models = [];
    const selected = venue?.pricing?.selectedPricingModels || [];
    const hasOnlyRent = selected.some(m => m.toLowerCase().includes('only rent')) ||
      (venue?.pricing?.onlyRent && (venue.pricing.onlyRent.hourly?.rate > 0 || venue.pricing.onlyRent.halfDay?.rate > 0 || venue.pricing.onlyRent.fullDay?.rate > 0));
    const hasRentAmenities = selected.some(m => m.toLowerCase().includes('amenities')) ||
      (venue?.pricing?.rentWithAmenities && (venue.pricing.rentWithAmenities.hourly?.rate > 0 || venue.pricing.rentWithAmenities.halfDay?.rate > 0 || venue.pricing.rentWithAmenities.fullDay?.rate > 0));
    const hasPerPax = selected.some(m => m.toLowerCase().includes('pax')) ||
      Object.values(venue?.pricing?.perPax || {}).some(p => Number(p?.rate) > 0);

    if (hasOnlyRent) models.push('Only Rent');
    if (hasRentAmenities) models.push('Rent with Amenities');
    if (hasPerPax) models.push('Per Pax');
    return models;
  })();

  const resolvePerPaxPackageConfig = (pkgKey) => {
    const pkg = PER_PAX_PACKAGES.find(p => p.key === pkgKey || p.aliases.includes(pkgKey));
    if (!pkg) return { rate: 0, minPax: 1, label: pkgKey || 'Meal Package' };
    for (const a of pkg.aliases) {
      if (venue?.pricing?.perPax?.[a] && Number(venue.pricing.perPax[a].rate) > 0) {
        return {
          rate: Number(venue.pricing.perPax[a].rate),
          minPax: Number(venue.pricing.perPax[a].minPax || 1),
          label: pkg.label
        };
      }
    }
    const direct = venue?.pricing?.perPax?.[pkgKey];
    return {
      rate: Number(direct?.rate || 0),
      minPax: Number(direct?.minPax || 1),
      label: pkg.label
    };
  };

  const availablePerPaxPackages = PER_PAX_PACKAGES.map(p => {
    const cfg = resolvePerPaxPackageConfig(p.key);
    return {
      ...p,
      rate: cfg.rate,
      minPax: cfg.minPax
    };
  }).filter(p => p.rate > 0);

  // Calculate estimate price
  const calculateEstimate = () => {
    if (!venue?.pricing) return { basePrice: 0, amenitiesTotal: 0, subtotal: 0, total: 0, gst: 0, cgst: 0, sgst: 0, netSubtotal: 0, taxType: 'GST Extra', gstRate: 18, isTaxIncluded: false, isTaxNotApplicable: false };
    if (quickBooking.pricingModel !== 'Per Pax' && !quickBooking.duration) {
      return { basePrice: 0, amenitiesTotal: 0, subtotal: 0, total: 0, gst: 0, cgst: 0, sgst: 0, netSubtotal: 0, taxType: 'GST Extra', gstRate: 18, isTaxIncluded: false, isTaxNotApplicable: false };
    }
    const basePrice = getQuickBookingBasePrice();
    
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
    
    // Lunch Thalis & Buffets
    selectedAmenities.lunchThalis.forEach(thali => {
      const key = `thali_${thali.name || thali.thaliType}`;
      const altKey = `thali_${thali.thaliType}_${thali.category}`;
      const qty = quantities[key] || quantities[altKey] || 0;
      amenitiesTotal += (thali.ratePerPlate || 0) * qty;
    });
    
    const subtotal = basePrice + amenitiesTotal;
    const taxType = venue.taxSettings?.taxType || 'GST Extra';
    const gstRate = Number(venue.taxSettings?.gstRate) || 18;
    const isTaxIncluded = taxType === 'GST Included';
    const isTaxNotApplicable = taxType === 'GST Not Applicable';

    let netSubtotal = subtotal;
    let gst = 0;
    let cgst = 0;
    let sgst = 0;
    let total = subtotal;

    if (isTaxNotApplicable) {
      netSubtotal = subtotal;
      gst = 0;
      cgst = 0;
      sgst = 0;
      total = subtotal;
    } else if (isTaxIncluded) {
      // Rates ALREADY INCLUDE GST -> Provide internal tax breakup without adding extra charge!
      netSubtotal = Math.round((subtotal / (1 + (gstRate / 100))) * 100) / 100;
      gst = Math.round((subtotal - netSubtotal) * 100) / 100;
      cgst = Math.round((gst / 2) * 100) / 100;
      sgst = Math.round((gst - cgst) * 100) / 100;
      total = subtotal; // Final customer price stays package total
    } else {
      // GST Extra -> Add GST on top of subtotal!
      netSubtotal = subtotal;
      cgst = Math.round((subtotal * ((gstRate / 2) / 100)) * 100) / 100;
      sgst = Math.round((subtotal * ((gstRate / 2) / 100)) * 100) / 100;
      gst = Math.round((cgst + sgst) * 100) / 100;
      total = Math.round((subtotal + gst) * 100) / 100;
    }
    
    return {
      basePrice,
      amenitiesTotal,
      subtotal,
      netSubtotal,
      gst,
      cgst,
      sgst,
      gstRate,
      taxType,
      isTaxIncluded,
      isTaxNotApplicable,
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

  // Consolidate all basic & categorized facilities
  const allFacilitiesList = [
    ...(venue.amenities?.basic || []),
    ...(venue.amenities?.basicFacilities || []),
    ...(venue.amenities?.meetingFacilities || []),
    ...(venue.amenities?.eventFacilities || []),
    ...(venue.amenities?.foodFacilities || [])
  ].filter((item, index, self) => item?.name && index === self.findIndex(t => t.name?.toLowerCase() === item.name?.toLowerCase()));

  const freeBasicAmenities = allFacilitiesList.filter(a => a.available && (a.type === 'Free' || a.type === 'Included'));
  const paidBasicAmenities = allFacilitiesList.filter(a => a.available && a.type === 'Paid');
  const visibleFreeBasicAmenities = showAllIncludedFacilities ? freeBasicAmenities : freeBasicAmenities.slice(0, 6);

  // Inactive venue — show banner, no booking
  const isInactive = venue.isActive === false;
  const foodType = venue.foodType || 'Veg';
  const FoodTypeIcon = getFoodTypeIcon(foodType);

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
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gray-900 dark:text-slate-100">
                    {venue.businessName}
                  </h1>
                {/* Info vs Verified Badge */}
                {isVenueVerified(venue) ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 shadow-sm dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
                    <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Info
                  </span>
                )}
                {venue.venueType?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {(Array.isArray(venue.venueType) ? venue.venueType : [venue.venueType]).map((vt) => (
                      <span key={vt} className="px-3 py-1 bg-primary-50 dark:bg-slate-800 text-primary-600 dark:text-primary-400 text-xs font-semibold rounded-full border border-primary-200 dark:border-slate-600">
                        {vt}
                      </span>
                    ))}
                  </div>
                )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleShareVenue}
                    className="p-2.5 rounded-full border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 hover:text-primary-600 hover:border-primary-400 shadow-sm transition-all active:scale-95"
                    title="Share Venue"
                    aria-label="Share Venue"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleVenue(venue)}
                    className={`p-2.5 rounded-full border transition-all active:scale-95 shadow-sm ${
                      isVenueFav(venue?._id) || isVenueFav(venue?.sku)
                        ? 'border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/40 text-red-500'
                        : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-300 hover:text-red-500 hover:border-red-300'
                    }`}
                    title="Favorite Venue"
                    aria-label="Favorite Venue"
                  >
                    <Heart className={`w-4 h-4 ${isVenueFav(venue?._id) || isVenueFav(venue?.sku) ? 'fill-current text-red-500' : ''}`} />
                  </button>
                </div>
              </div>
              
              {/* Quick Specs Badges */}
              <div className="flex flex-wrap items-center gap-2.5 text-sm text-gray-600 dark:text-slate-300 mb-3">
                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-xs font-medium">
                  <MapPin className="w-3.5 h-3.5 text-primary-500" />
                  {venue.location?.city}, {venue.location?.area}
                </span>
                <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-xs font-medium">
                  <Users className="w-3.5 h-3.5 text-primary-500" />
                  Up to {venue.capacity} guests
                </span>
                {venue.areaSqft > 0 && (
                  <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-xs font-medium">
                    <Building2 className="w-3.5 h-3.5 text-primary-500" />
                    {venue.areaSqft.toLocaleString()} sq.ft
                  </span>
                )}
                {venue.floor && (
                  <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-xs font-medium">
                    <Layers className="w-3.5 h-3.5 text-primary-500" />
                    {venue.floor}
                  </span>
                )}
                {venue.yearEstablished && (
                  <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-xs font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Est. {venue.yearEstablished}
                  </span>
                )}
                <span className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-lg text-xs font-semibold">
                  <FoodTypeIcon className="w-3.5 h-3.5" />
                  {foodType}
                </span>
                {venue.rating > 0 && (
                  <span className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 px-2.5 py-1 rounded-lg text-xs">
                    <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-gray-900 dark:text-slate-100">{venue.rating}</span>
                    <span className="text-gray-500 dark:text-slate-400">({venue.reviewCount} reviews)</span>
                  </span>
                )}
              </div>

              {/* Action Links (360 Tour, Website & Social Pages) */}
              {(venue.socialLinks?.virtualTourUrl || venue.socialLinks?.website || venue.socialLinks?.instagram || venue.socialLinks?.facebook || (Array.isArray(venue.socialLinks?.youtube) ? venue.socialLinks?.youtube?.[0] : venue.socialLinks?.youtube)) && (
                <div className="flex flex-wrap gap-2.5 pt-3 mb-2 border-t border-gray-100 dark:border-slate-800">
                  {venue.socialLinks?.virtualTourUrl && (
                    <a
                      href={venue.socialLinks.virtualTourUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg text-xs font-bold shadow hover:shadow-md transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Explore 360° Virtual Tour
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  )}
                  {venue.socialLinks?.website && (
                    <a
                      href={venue.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                    >
                      <Globe className="w-3.5 h-3.5 text-primary-500" />
                      Official Website
                      <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                    </a>
                  )}
                  {venue.socialLinks?.instagram && (
                    <a
                      href={venue.socialLinks.instagram.startsWith('http') ? venue.socialLinks.instagram : `https://instagram.com/${venue.socialLinks.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800 rounded-lg text-xs font-semibold hover:bg-pink-100 transition-colors"
                    >
                      <span>Instagram</span>
                      <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                    </a>
                  )}
                  {venue.socialLinks?.facebook && (
                    <a
                      href={venue.socialLinks.facebook.startsWith('http') ? venue.socialLinks.facebook : `https://facebook.com/${venue.socialLinks.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
                    >
                      <span>Facebook</span>
                      <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                    </a>
                  )}
                  {(Array.isArray(venue.socialLinks?.youtube) ? venue.socialLinks?.youtube?.[0] : venue.socialLinks?.youtube) && (
                    <a
                      href={Array.isArray(venue.socialLinks.youtube) ? venue.socialLinks.youtube[0] : venue.socialLinks.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
                    >
                      <span>YouTube</span>
                      <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                    </a>
                  )}
                </div>
              )}

              {/* Availability Info */}
              {(venue.availability?.openingTime || venue.availability?.availableDays?.length > 0) && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 flex flex-wrap gap-4 text-xs text-gray-600 dark:text-slate-300">
                  {venue.availability?.openingTime && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary-500" />
                      <strong>Operating Hours:</strong>
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
                      <Calendar className="w-3.5 h-3.5 text-primary-500" />
                      <strong>Available Days:</strong> {venue.availability.availableDays.join(', ')}
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
              <p className="text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-line text-sm">
                {venue.description}
              </p>
            </div>

            {/* Seating Arrangements (if available) */}
            {venue.seatingArrangements?.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
                <h2 className="font-serif text-xl font-bold text-dark-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary-500" />
                  Seating Arrangements & Layouts
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {venue.seatingArrangements.map((seat, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-2 p-3 rounded-lg bg-primary-50/60 dark:bg-slate-800/80 border border-primary-100 dark:border-slate-700">
                      <Users className="w-4 h-4 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{seat}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Services Available (if available) */}
            {venue.servicesAvailable?.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
                <h2 className="font-serif text-xl font-bold text-dark-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary-500" />
                  Services & Key Highlights
                </h2>
                <div className="flex flex-wrap gap-2">
                  {venue.servicesAvailable.map((srv, sIdx) => (
                    <span key={sIdx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      {srv}
                    </span>
                  ))}
                </div>
              </div>
            )}

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

              {/* Kitchen & Dining Access */}
              {(venue.amenities?.kitchenAccess?.available || venue.amenities?.diningArea?.available) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {venue.amenities?.kitchenAccess?.available && (
                    <div className="p-4 bg-emerald-50/80 dark:bg-slate-800/80 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <ChefHat className="w-4 h-4 text-emerald-600" />
                        <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-300">Kitchen Access</h4>
                      </div>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">
                        {venue.amenities.kitchenAccess.type === 'Included' ? (
                          'Included in venue booking'
                        ) : (
                          `₹${venue.amenities.kitchenAccess.charges} extra charges`
                        )}
                      </p>
                    </div>
                  )}
                  {venue.amenities?.diningArea?.available && (
                    <div className="p-4 bg-blue-50/80 dark:bg-slate-800/80 border border-blue-200 dark:border-blue-800 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Utensils className="w-4 h-4 text-blue-600" />
                        <h4 className="font-bold text-sm text-blue-900 dark:text-blue-300">Dining Area Space</h4>
                      </div>
                      <p className="text-xs text-blue-700 dark:text-blue-400">
                        {venue.amenities.diningArea.type === 'Included' ? (
                          'Included in venue booking'
                        ) : (
                          `₹${venue.amenities.diningArea.charges} extra charges`
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* In-house Catering Services & Menus (Tab 4) */}
            {(() => {
              const catering = venue.cateringFacility || {};
              const beverages = (catering.beverages?.length > 0)
                ? catering.beverages.filter(b => b.available && (b.ratePerUnit > 0 || b.name))
                : (venue.amenities?.beverages?.filter(b => b.available && b.name) || []);

              const breakfast = (catering.breakfast?.length > 0)
                ? catering.breakfast.filter(b => b.available && (b.ratePerPlate > 0 || b.name))
                : (venue.amenities?.refreshmentFood?.filter(b => b.available && b.name) || []);

              const buffets = (catering.lunchDinner?.length > 0)
                ? catering.lunchDinner.filter(b => b.available && (b.ratePerPlate > 0 || b.name))
                : (venue.amenities?.lunchThalis || []).flatMap(t => 
                    (t.categories || []).map(c => ({
                      name: `${t.thaliType} (${c.category})`,
                      available: true,
                      foodType: c.category?.toLowerCase().includes('non') ? 'Non-Veg' : 'Veg',
                      ratePerPlate: c.ratePerPlate,
                      items: c.itemNames || `${c.numberOfItems || ''} items`
                    }))
                  );

              const outsideAllowed = catering.outsideCateringAllowed ?? 
                (venue.rulesAndPolicies?.outsideVendors === 'Allowed' || venue.rulesAndPolicies?.foodPolicy === 'Both Allowed');

              const hasCatering = beverages.length > 0 || breakfast.length > 0 || buffets.length > 0 || catering.outsideCateringAllowed !== undefined;

              if (!hasCatering) return null;

              return (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6 space-y-6">
                  {/* Header & Outside Catering Status */}
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-3 pb-4 border-b border-gray-100 dark:border-slate-800">
                    <div>
                      <h2 className="font-serif text-xl font-bold text-dark-800 dark:text-slate-100 flex items-center gap-2">
                        <UtensilsCrossed className="w-5 h-5 text-primary-500" />
                        In-house Catering Services & Menus
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Specify meal items, buffet rates, refreshment drinks and outside catering permissions.
                      </p>
                    </div>
                    {outsideAllowed ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Outside Catering Allowed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold rounded-full">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        In-house Catering Only
                      </span>
                    )}
                  </div>

                  {/* 1. Beverages & Refreshments */}
                  {beverages.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Coffee className="w-4 h-4 text-amber-500" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          Beverages & Refreshments
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {beverages.map((bev, idx) => {
                          const key = `beverage_${bev.name}`;
                          const qty = quantities[key] || 0;
                          const isSelected = isAmenitySelected('beverages', bev.name);

                          return (
                            <div
                              key={idx}
                              className={`p-3.5 rounded-xl border transition-all ${
                                isSelected
                                  ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/30 ring-2 ring-primary-500/20 shadow-xs'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:border-primary-300'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 flex-1">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleAmenity('beverages', { name: bev.name, ratePerUnit: bev.ratePerUnit })}
                                    className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500 cursor-pointer"
                                  />
                                  <span className="text-xs font-bold text-gray-900 dark:text-slate-100">{bev.name}</span>
                                </div>
                                <span className="text-xs font-bold text-primary-600">₹{bev.ratePerUnit}</span>
                              </div>
                              <p className="text-[10px] text-gray-400 pl-6">per cup / bottle</p>
                              {isSelected && (
                                <div className="flex items-center gap-1.5 pt-2 mt-2 border-t border-gray-100 dark:border-slate-800">
                                  <button type="button" onClick={() => updateQuantity(key, Math.max(0, qty - 1))} className="w-6 h-6 rounded border border-gray-300 dark:border-slate-600 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center text-xs font-bold">-</button>
                                  <input type="number" value={qty} onChange={(e) => updateQuantity(key, parseInt(e.target.value) || 0)} className="w-12 h-6 text-center border border-gray-300 dark:border-slate-700 rounded text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" min="0" />
                                  <button type="button" onClick={() => updateQuantity(key, qty + 1)} className="w-6 h-6 rounded border border-gray-300 dark:border-slate-600 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center text-xs font-bold">+</button>
                                  <span className="text-xs font-bold text-primary-600 ml-auto">₹{((bev.ratePerUnit || 0) * qty).toLocaleString('en-IN')}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. Breakfast Menus */}
                  {breakfast.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Sandwich className="w-4 h-4 text-amber-500" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          Breakfast Menus
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {breakfast.map((bf, idx) => {
                          const key = `food_${bf.name}`;
                          const qty = quantities[key] || 0;
                          const isSelected = isAmenitySelected('refreshmentFood', bf.name);

                          return (
                            <div
                              key={idx}
                              className={`p-4 rounded-xl border transition-all ${
                                isSelected
                                  ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/30 ring-2 ring-primary-500/20 shadow-xs'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:border-primary-300'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleAmenity('refreshmentFood', { name: bf.name, ratePerPlate: bf.ratePerPlate, items: bf.items })}
                                    className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary-500 focus:ring-primary-500 cursor-pointer"
                                  />
                                  <div>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100">{bf.name}</h4>
                                    {bf.items && (
                                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">Menu: </span>
                                        {bf.items}
                                      </p>
                                    )}
                                  </div>
                                </label>
                                <div className="text-right flex-shrink-0">
                                  <span className="text-base font-bold text-primary-600">₹{bf.ratePerPlate}</span>
                                  <span className="text-[10px] text-gray-400 block">/ plate</span>
                                </div>
                              </div>
                              {isSelected && (
                                <div className="flex items-center gap-1.5 pt-2.5 mt-2.5 border-t border-gray-100 dark:border-slate-800">
                                  <span className="text-xs text-gray-500">Plates:</span>
                                  <button type="button" onClick={() => updateQuantity(key, Math.max(0, qty - 1))} className="w-6 h-6 rounded border border-gray-300 dark:border-slate-600 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center text-xs font-bold">-</button>
                                  <input type="number" value={qty} onChange={(e) => updateQuantity(key, parseInt(e.target.value) || 0)} className="w-14 h-6 text-center border border-gray-300 dark:border-slate-700 rounded text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" min="0" />
                                  <button type="button" onClick={() => updateQuantity(key, qty + 1)} className="w-6 h-6 rounded border border-gray-300 dark:border-slate-600 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center text-xs font-bold">+</button>
                                  <span className="text-xs font-bold text-primary-600 ml-auto">Total: ₹{((bf.ratePerPlate || 0) * qty).toLocaleString('en-IN')}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. Lunch / Dinner Buffets */}
                  {buffets.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Utensils className="w-4 h-4 text-amber-500" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          Lunch / Dinner Buffets
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {buffets.map((buffet, idx) => {
                          const key = `thali_${buffet.name}`;
                          const qty = quantities[key] || quantities[`thali_${buffet.thaliType}_${buffet.category}`] || 0;
                          const isSelected = selectedAmenities.lunchThalis?.some(t => (t.thaliType || t.name) === buffet.name);

                          return (
                            <div
                              key={idx}
                              className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                                isSelected
                                  ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/30 ring-2 ring-primary-500/20 shadow-xs'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 hover:border-primary-300'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    buffet.foodType === 'Veg'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                                      : buffet.foodType === 'Non-Veg'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
                                      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                                  }`}>
                                    {buffet.foodType || 'Veg'} Buffet
                                  </span>
                                  <div className="text-right">
                                    <span className="text-base font-bold text-primary-600">₹{buffet.ratePerPlate}</span>
                                    <span className="text-[10px] text-gray-400 ml-1">/ plate</span>
                                  </div>
                                </div>
                                <label className="flex items-start gap-2.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      if (isSelected) {
                                        setSelectedAmenities(prev => ({
                                          ...prev,
                                          lunchThalis: prev.lunchThalis.filter(t => (t.thaliType || t.name) !== buffet.name)
                                        }));
                                        setQuantities(prev => {
                                          const next = { ...prev };
                                          delete next[key];
                                          return next;
                                        });
                                      } else {
                                        setSelectedAmenities(prev => ({
                                          ...prev,
                                          lunchThalis: [...prev.lunchThalis, {
                                            thaliType: buffet.name,
                                            name: buffet.name,
                                            category: buffet.foodType || 'Veg',
                                            ratePerPlate: buffet.ratePerPlate,
                                            itemNames: buffet.items
                                          }]
                                        }));
                                        setQuantities(prev => ({ ...prev, [key]: parseInt(quickBooking.guestCount) || 1 }));
                                      }
                                    }}
                                    className="w-4 h-4 mt-0.5 rounded border-gray-300 text-primary-500 focus:ring-primary-500 cursor-pointer"
                                  />
                                  <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100">{buffet.name}</h4>
                                </label>
                                {buffet.items && (
                                  <p className="text-xs text-gray-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 mt-2.5 leading-relaxed">
                                    {buffet.items}
                                  </p>
                                )}
                              </div>
                              {isSelected && (
                                <div className="flex items-center gap-1.5 pt-2.5 mt-3 border-t border-gray-100 dark:border-slate-800">
                                  <span className="text-xs text-gray-500">Guests:</span>
                                  <button type="button" onClick={() => updateQuantity(key, Math.max(0, qty - 1))} className="w-6 h-6 rounded border border-gray-300 dark:border-slate-600 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center text-xs font-bold">-</button>
                                  <input type="number" value={qty} onChange={(e) => updateQuantity(key, parseInt(e.target.value) || 0)} className="w-14 h-6 text-center border border-gray-300 dark:border-slate-700 rounded text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" min="0" />
                                  <button type="button" onClick={() => updateQuantity(key, qty + 1)} className="w-6 h-6 rounded border border-gray-300 dark:border-slate-600 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center text-xs font-bold">+</button>
                                  <span className="text-xs font-bold text-primary-600 ml-auto">₹{((buffet.ratePerPlate || 0) * qty).toLocaleString('en-IN')}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Dedicated Parking & Transit Information */}
            {(() => {
              const pType = venue.location?.parkingDetails?.type || venue.location?.parkingAvailability || 'None';
              const carCap = venue.location?.parkingDetails?.carsCapacity || 0;
              const bikeCap = venue.location?.parkingDetails?.twoWheelerCapacity || 0;
              const carRate = venue.location?.parkingDetails?.carCharges || 0;
              const bikeRate = venue.location?.parkingDetails?.twoWheelerCharges || 0;
              const hasValet = venue.location?.parkingDetails?.valetParking || venue.servicesAvailable?.includes('Valet Parking') || false;
              const valetRate = venue.location?.parkingDetails?.valetCharges || 0;
              const pNotes = venue.location?.parkingDetails?.notes || '';

              return (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h2 className="font-serif text-xl font-bold text-dark-800 dark:text-slate-100 flex items-center gap-2">
                      <Car className="w-5 h-5 text-primary-500" />
                      Parking & Transit Information
                    </h2>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      pType === 'Free' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                      pType === 'Paid' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                      pType === 'Limited' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {pType === 'Free' ? '✓ Free Parking On-Site' :
                       pType === 'Paid' ? '₹ Paid Parking On-Site' :
                       pType === 'Limited' ? '⚠️ Limited Parking' : 'No Dedicated Parking'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 mb-4">
                    {/* 4-Wheeler Car Parking */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center flex-shrink-0">
                          <Car className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Car Parking</h4>
                          <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                            {carCap > 0 ? `${carCap} Cars Capacity` : (pType !== 'None' ? 'Available' : 'Not Available')}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Rate / Charges:</span>
                        {carRate > 0 ? (
                          <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">₹{carRate}/vehicle</span>
                        ) : (pType === 'Free' || (carCap > 0 && carRate === 0)) ? (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">Free of Cost</span>
                        ) : (
                          <span className="text-slate-500 font-medium">{pType === 'Paid' ? 'Payable at Venue' : 'N/A'}</span>
                        )}
                      </div>
                    </div>

                    {/* 2-Wheeler Bike Parking */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                          <Bike className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bike / Scooter</h4>
                          <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                            {bikeCap > 0 ? `${bikeCap} Bikes Capacity` : (pType !== 'None' ? 'Available' : 'Not Available')}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Rate / Charges:</span>
                        {bikeRate > 0 ? (
                          <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded">₹{bikeRate}/vehicle</span>
                        ) : (pType === 'Free' || (bikeCap > 0 && bikeRate === 0)) ? (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">Free of Cost</span>
                        ) : (
                          <span className="text-slate-500 font-medium">{pType === 'Paid' ? 'Payable at Venue' : 'N/A'}</span>
                        )}
                      </div>
                    </div>

                    {/* Valet Parking */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Valet Assistance</h4>
                          <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                            {hasValet ? 'Valet Available' : 'Self Parking'}
                          </p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Valet Service:</span>
                        {valetRate > 0 ? (
                          <span className="font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded">₹{valetRate}/car</span>
                        ) : hasValet ? (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">Complimentary</span>
                        ) : (
                          <span className="text-slate-500">Standard</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {pNotes && (
                    <div className="text-xs text-slate-700 dark:text-slate-300 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-3 rounded-lg mb-4">
                      <strong className="text-amber-800 dark:text-amber-300 font-bold">Parking Note: </strong>
                      {pNotes}
                    </div>
                  )}

                  {/* Transit Links */}
                  <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-300 items-center justify-between">
                    <div className="flex flex-wrap gap-3">
                      {venue.location?.nearestMetroTrain && (
                        <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md">
                          <Compass className="w-3.5 h-3.5 text-primary-500" />
                          <strong className="text-slate-800 dark:text-slate-200">Metro / Train:</strong> {venue.location.nearestMetroTrain}
                        </span>
                      )}
                      {venue.location?.nearestBusAuto && (
                        <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md">
                          <Compass className="w-3.5 h-3.5 text-primary-500" />
                          <strong className="text-slate-800 dark:text-slate-200">Bus / Auto Stop:</strong> {venue.location.nearestBusAuto}
                        </span>
                      )}
                    </div>
                    {venue.location?.googleMapLink && (
                      <a
                        href={venue.location.googleMapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-bold hover:underline"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        Navigate on Map <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Full Location & Address Details */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
              <h2 className="font-serif text-xl font-bold text-dark-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-500" />
                Address & Location
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-slate-300">
                {venue.location?.address && <div><span className="font-semibold text-gray-800 dark:text-slate-200">Address:</span> {venue.location.address}</div>}
                {venue.location?.landmark && <div><span className="font-semibold text-gray-800 dark:text-slate-200">Landmark:</span> {venue.location.landmark}</div>}
                {venue.location?.area && <div><span className="font-semibold text-gray-800 dark:text-slate-200">Area:</span> {venue.location.area}</div>}
                {venue.location?.city && <div><span className="font-semibold text-gray-800 dark:text-slate-200">City:</span> {venue.location.city}</div>}
                {venue.location?.state && <div><span className="font-semibold text-gray-800 dark:text-slate-200">State:</span> {venue.location.state}</div>}
                {venue.location?.pincode && <div><span className="font-semibold text-gray-800 dark:text-slate-200">Pincode:</span> {venue.location.pincode}</div>}
                {venue.location?.village && <div><span className="font-semibold text-gray-800 dark:text-slate-200">Village:</span> {venue.location.village}</div>}
              </div>
            </div>

            {/* Additional Facilities & Special Arrangements (Tab 5) */}
            {venue.additionalFacilities?.length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2 pb-3 border-b border-gray-100 dark:border-slate-800">
                  <div>
                    <h2 className="font-serif text-xl font-bold text-dark-800 dark:text-slate-100 flex items-center gap-2">
                      <Layers className="w-5 h-5 text-primary-500" />
                      Additional Facilities & Special Arrangements
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                      Special venue amenities and add-on arrangements provided by the venue management.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {venue.additionalFacilities.map((fac, idx) => {
                    const isPaid = fac.type === 'Paid' && fac.charges > 0;
                    return (
                      <div key={idx} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isPaid
                                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                            }`}>
                              {isPaid ? `Paid (₹${fac.charges.toLocaleString('en-IN')})` : 'Included / Free'}
                            </span>
                            {fac.available ? (
                              <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Available
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-400">On Request</span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-gray-900 dark:text-slate-100">{fac.name}</h4>
                          {fac.description && (
                            <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">
                              {fac.description}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pricing Details & Tax Transparency */}
            {venue.pricing && (() => {
              const selectedModels = venue.pricing.selectedPricingModels || [];
              const hasOnlyRent = selectedModels.some(m => m.toLowerCase().includes('only rent')) ||
                (venue.pricing.onlyRent && (venue.pricing.onlyRent.hourly?.rate > 0 || venue.pricing.onlyRent.halfDay?.rate > 0 || venue.pricing.onlyRent.fullDay?.rate > 0));
              const hasRentAmenities = selectedModels.some(m => m.toLowerCase().includes('amenities')) ||
                (venue.pricing.rentWithAmenities && (venue.pricing.rentWithAmenities.hourly?.rate > 0 || venue.pricing.rentWithAmenities.halfDay?.rate > 0 || venue.pricing.rentWithAmenities.fullDay?.rate > 0));
              const hasPerPax = selectedModels.some(m => m.toLowerCase().includes('pax')) ||
                Object.values(venue.pricing.perPax || {}).some(p => Number(p?.rate) > 0);

              return (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-2 pb-4 border-b border-gray-100 dark:border-slate-800">
                    <div>
                      <h2 className="font-serif text-xl font-bold text-dark-800 dark:text-slate-100">
                        Pricing Packages ({quickBookingRateLabel})
                      </h2>
                      <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                        Select any package below to configure your booking directly.
                      </p>
                    </div>
                    <span className="px-3 py-1 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 text-xs font-bold rounded-full border border-primary-200 dark:border-primary-800">
                      {venue.taxSettings?.taxType || 'GST Extra'} ({venue.taxSettings?.gstRate || 18}%)
                    </span>
                  </div>

                  {/* 1. Only Rent (Pure Space Rental) Rates */}
                  {hasOnlyRent && (
                    <div className="mb-7">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                          <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100">
                            Only Rent (Pure Space Rental) Rates
                          </h3>
                          {quickBooking.pricingModel === 'Only Rent' && (
                            <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                              Active Model
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                          Hourly, Half Day & Full Day
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Hourly */}
                        {(venue.pricing.onlyRent?.hourly?.rate > 0 || venue.pricing.perHour?.[quickBookingRateKey] > 0) && (
                          <div
                            onClick={() => setQuickBooking(prev => ({ ...prev, pricingModel: 'Only Rent', duration: '1' }))}
                            className={`p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                              quickBooking.pricingModel === 'Only Rent' && (quickBooking.duration === '1' || quickBooking.duration === '2')
                                ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/40 ring-2 ring-primary-500/20 shadow-sm'
                                : 'border-gray-200 dark:border-slate-700 hover:border-primary-300 bg-white dark:bg-slate-800/40'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold text-gray-700 dark:text-slate-200">1 Hour Slot</span>
                              {quickBooking.pricingModel === 'Only Rent' && (quickBooking.duration === '1' || quickBooking.duration === '2') && (
                                <span className="text-[10px] font-bold text-primary-600 bg-primary-100 dark:bg-primary-900/60 px-2 py-0.5 rounded-full">✓ Selected</span>
                              )}
                            </div>
                            <p className="text-lg font-bold text-primary-600 mt-2">
                              ₹{Number(venue.pricing.onlyRent?.hourly?.rate || venue.pricing.perHour?.[quickBookingRateKey] || 0).toLocaleString('en-IN')}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Flexible hourly booking</p>
                          </div>
                        )}

                        {/* Half Day */}
                        {(venue.pricing.onlyRent?.halfDay?.rate > 0 || venue.pricing.halfDay?.[quickBookingRateKey] > 0) && (
                          <div
                            onClick={() => setQuickBooking(prev => ({ ...prev, pricingModel: 'Only Rent', duration: '4' }))}
                            className={`p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                              quickBooking.pricingModel === 'Only Rent' && (quickBooking.duration === '4' || quickBooking.duration === '6')
                                ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/40 ring-2 ring-primary-500/20 shadow-sm'
                                : 'border-gray-200 dark:border-slate-700 hover:border-primary-300 bg-white dark:bg-slate-800/40'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold text-gray-700 dark:text-slate-200">Half Day</span>
                              {quickBooking.pricingModel === 'Only Rent' && (quickBooking.duration === '4' || quickBooking.duration === '6') && (
                                <span className="text-[10px] font-bold text-primary-600 bg-primary-100 dark:bg-primary-900/60 px-2 py-0.5 rounded-full">✓ Selected</span>
                              )}
                            </div>
                            <p className="text-lg font-bold text-primary-600 mt-2">
                              ₹{Number(venue.pricing.onlyRent?.halfDay?.rate || venue.pricing.halfDay?.[quickBookingRateKey] || 0).toLocaleString('en-IN')}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">4 continuous hours</p>
                          </div>
                        )}

                        {/* Full Day */}
                        {(venue.pricing.onlyRent?.fullDay?.rate > 0 || venue.pricing.fullDay?.[quickBookingRateKey] > 0) && (
                          <div
                            onClick={() => setQuickBooking(prev => ({ ...prev, pricingModel: 'Only Rent', duration: '8' }))}
                            className={`p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                              quickBooking.pricingModel === 'Only Rent' && (quickBooking.duration === '8' || quickBooking.duration === '12')
                                ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/40 ring-2 ring-primary-500/20 shadow-sm'
                                : 'border-gray-200 dark:border-slate-700 hover:border-primary-300 bg-white dark:bg-slate-800/40'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold text-gray-700 dark:text-slate-200">Full Day</span>
                              {quickBooking.pricingModel === 'Only Rent' && (quickBooking.duration === '8' || quickBooking.duration === '12') && (
                                <span className="text-[10px] font-bold text-primary-600 bg-primary-100 dark:bg-primary-900/60 px-2 py-0.5 rounded-full">✓ Selected</span>
                              )}
                            </div>
                            <p className="text-lg font-bold text-primary-600 mt-2">
                              ₹{Number(venue.pricing.onlyRent?.fullDay?.rate || venue.pricing.fullDay?.[quickBookingRateKey] || 0).toLocaleString('en-IN')}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">8 full hours</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 2. Rent with Amenities Package Rates */}
                  {hasRentAmenities && (
                    <div className="mb-7">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                          <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100">
                            Rent with Amenities Package Rates
                          </h3>
                          {quickBooking.pricingModel === 'Rent with Amenities' && (
                            <span className="text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                              Active Model
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium hidden sm:inline">
                          Includes standard venue amenities
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Hourly */}
                        {venue.pricing.rentWithAmenities?.hourly?.rate > 0 && (
                          <div
                            onClick={() => setQuickBooking(prev => ({ ...prev, pricingModel: 'Rent with Amenities', duration: '1' }))}
                            className={`p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                              quickBooking.pricingModel === 'Rent with Amenities' && (quickBooking.duration === '1' || quickBooking.duration === '2')
                                ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/40 ring-2 ring-primary-500/20 shadow-sm'
                                : 'border-gray-200 dark:border-slate-700 hover:border-primary-300 bg-white dark:bg-slate-800/40'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold text-gray-700 dark:text-slate-200">1 Hour Slot</span>
                              {quickBooking.pricingModel === 'Rent with Amenities' && (quickBooking.duration === '1' || quickBooking.duration === '2') && (
                                <span className="text-[10px] font-bold text-primary-600 bg-primary-100 dark:bg-primary-900/60 px-2 py-0.5 rounded-full">✓ Selected</span>
                              )}
                            </div>
                            <p className="text-lg font-bold text-primary-600 mt-2">
                              ₹{Number(venue.pricing.rentWithAmenities.hourly.rate).toLocaleString('en-IN')}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Space + venue amenities</p>
                          </div>
                        )}

                        {/* Half Day */}
                        {venue.pricing.rentWithAmenities?.halfDay?.rate > 0 && (
                          <div
                            onClick={() => setQuickBooking(prev => ({ ...prev, pricingModel: 'Rent with Amenities', duration: '4' }))}
                            className={`p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                              quickBooking.pricingModel === 'Rent with Amenities' && (quickBooking.duration === '4' || quickBooking.duration === '6')
                                ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/40 ring-2 ring-primary-500/20 shadow-sm'
                                : 'border-gray-200 dark:border-slate-700 hover:border-primary-300 bg-white dark:bg-slate-800/40'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold text-gray-700 dark:text-slate-200">Half Day</span>
                              {quickBooking.pricingModel === 'Rent with Amenities' && (quickBooking.duration === '4' || quickBooking.duration === '6') && (
                                <span className="text-[10px] font-bold text-primary-600 bg-primary-100 dark:bg-primary-900/60 px-2 py-0.5 rounded-full">✓ Selected</span>
                              )}
                            </div>
                            <p className="text-lg font-bold text-primary-600 mt-2">
                              ₹{Number(venue.pricing.rentWithAmenities.halfDay.rate).toLocaleString('en-IN')}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">4 continuous hours with amenities</p>
                          </div>
                        )}

                        {/* Full Day */}
                        {venue.pricing.rentWithAmenities?.fullDay?.rate > 0 && (
                          <div
                            onClick={() => setQuickBooking(prev => ({ ...prev, pricingModel: 'Rent with Amenities', duration: '8' }))}
                            className={`p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                              quickBooking.pricingModel === 'Rent with Amenities' && (quickBooking.duration === '8' || quickBooking.duration === '12')
                                ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/40 ring-2 ring-primary-500/20 shadow-sm'
                                : 'border-gray-200 dark:border-slate-700 hover:border-primary-300 bg-white dark:bg-slate-800/40'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold text-gray-700 dark:text-slate-200">Full Day</span>
                              {quickBooking.pricingModel === 'Rent with Amenities' && (quickBooking.duration === '8' || quickBooking.duration === '12') && (
                                <span className="text-[10px] font-bold text-primary-600 bg-primary-100 dark:bg-primary-900/60 px-2 py-0.5 rounded-full">✓ Selected</span>
                              )}
                            </div>
                            <p className="text-lg font-bold text-primary-600 mt-2">
                              ₹{Number(venue.pricing.rentWithAmenities.fullDay.rate).toLocaleString('en-IN')}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">8 full hours with amenities</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. Per Pax (Per Person) Meal Packages */}
                  {hasPerPax && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                          <h3 className="font-bold text-sm text-gray-900 dark:text-slate-100">
                            Per Pax (Per Person) Meal Packages
                          </h3>
                          {quickBooking.pricingModel === 'Per Pax' && (
                            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              Active Model
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium hidden sm:inline">
                          Charges based on guest count
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {PER_PAX_PACKAGES.map(item => {
                          const pkgCfg = resolvePerPaxPackageConfig(item.key);
                          if (pkgCfg.rate <= 0) return null;
                          const isSelected = quickBooking.pricingModel === 'Per Pax' && 
                            (quickBooking.perPaxPackage === item.key || item.aliases.includes(quickBooking.perPaxPackage));

                          return (
                            <div
                              key={item.key}
                              onClick={() => setQuickBooking(prev => ({
                                ...prev,
                                pricingModel: 'Per Pax',
                                perPaxPackage: item.key,
                                guestCount: Math.max(Number(prev.guestCount || 1), pkgCfg.minPax)
                              }))}
                              className={`p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-primary-500 bg-primary-50/70 dark:bg-primary-950/40 ring-2 ring-primary-500/20 shadow-sm'
                                  : 'border-gray-200 dark:border-slate-700 hover:border-primary-300 bg-white dark:bg-slate-800/40'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <span className="text-xs font-bold text-gray-800 dark:text-slate-200">{item.label}</span>
                                {isSelected && (
                                  <span className="text-[10px] font-bold text-primary-600 bg-primary-100 dark:bg-primary-900/60 px-2 py-0.5 rounded-full">✓ Selected</span>
                                )}
                              </div>
                              <div className="mt-2.5 flex items-baseline justify-between">
                                <p className="text-lg font-bold text-primary-600">
                                  ₹{pkgCfg.rate.toLocaleString('en-IN')}<span className="text-xs font-normal text-gray-500"> / pax</span>
                                </p>
                                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                  Min: {pkgCfg.minPax} pax
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-400 mt-1">{item.desc}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Legacy Fallback */}
                  {!hasOnlyRent && !hasRentAmenities && !hasPerPax && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {venue.pricing.enabledOptions?.perHour && venue.pricing.perHour && (
                        <div 
                          onClick={() => setQuickBooking(prev => ({ ...prev, duration: '1' }))}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            quickBooking.duration === '1' 
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' 
                              : 'border-gray-200 dark:border-slate-700 hover:border-primary-300'
                          }`}
                        >
                          <div className="text-center">
                            <h3 className="font-semibold text-sm mb-0.5 text-gray-900 dark:text-slate-100">1 Hour Slot</h3>
                            <p className="text-lg font-bold text-primary-600">₹{getQuickBookingBasePrice('1').toLocaleString('en-IN')}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Flexible hourly booking</p>
                          </div>
                        </div>
                      )}
                      
                      {venue.pricing.enabledOptions?.halfDay && venue.pricing.halfDay && (
                        <div 
                          onClick={() => setQuickBooking(prev => ({ ...prev, duration: '4' }))}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            quickBooking.duration === '4' 
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' 
                              : 'border-gray-200 dark:border-slate-700 hover:border-primary-300'
                          }`}
                        >
                          <div className="text-center">
                            <h3 className="font-semibold text-sm mb-0.5 text-gray-900 dark:text-slate-100">Half Day</h3>
                            <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">4 continuous hours</p>
                            <p className="text-lg font-bold text-primary-600">₹{getQuickBookingBasePrice('4').toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      )}
                      
                      {venue.pricing.enabledOptions?.fullDay && venue.pricing.fullDay && (
                        <div 
                          onClick={() => setQuickBooking(prev => ({ ...prev, duration: '8' }))}
                          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                            quickBooking.duration === '8' 
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30' 
                              : 'border-gray-200 dark:border-slate-700 hover:border-primary-300'
                          }`}
                        >
                          <div className="text-center">
                            <h3 className="font-semibold text-sm mb-0.5 text-gray-900 dark:text-slate-100">Full Day</h3>
                            <p className="text-xs text-gray-400 dark:text-slate-500 mb-0.5">8 full hours</p>
                            <p className="text-lg font-bold text-primary-600">₹{getQuickBookingBasePrice('8').toLocaleString('en-IN')}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {venue.pricing.extraHourRate?.[quickBookingRateKey] > 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      * Additional overtime charges: <strong className="text-slate-800 dark:text-slate-200">₹{venue.pricing.extraHourRate[quickBookingRateKey]}/hour</strong>
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Venue Guidelines & House Rules */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
              <h2 className="font-serif text-xl font-bold text-dark-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-500" />
                Venue Guidelines & House Rules
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2 mb-1 text-slate-600 dark:text-slate-300">
                    <Utensils className="w-4 h-4 text-primary-500" />
                    <span className="text-xs font-semibold">Food Policy</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{venue.rulesAndPolicies?.foodPolicy || 'Both Allowed'}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2 mb-1 text-slate-600 dark:text-slate-300">
                    <Users className="w-4 h-4 text-primary-500" />
                    <span className="text-xs font-semibold">Outside Vendors</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{venue.rulesAndPolicies?.outsideVendors || 'Allowed'}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2 mb-1 text-slate-600 dark:text-slate-300">
                    <Sparkles className="w-4 h-4 text-primary-500" />
                    <span className="text-xs font-semibold">Decoration Policy</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{venue.rulesAndPolicies?.decoration || 'Allowed'}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2 mb-1 text-slate-600 dark:text-slate-300">
                    <Volume2 className="w-4 h-4 text-primary-500" />
                    <span className="text-xs font-semibold">Music & DJ</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{venue.rulesAndPolicies?.musicNoise || 'Restricted after 10 PM'}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2 mb-1 text-slate-600 dark:text-slate-300">
                    <Wine className="w-4 h-4 text-primary-500" />
                    <span className="text-xs font-semibold">Alcohol Policy</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{venue.rulesAndPolicies?.alcohol || 'Not Allowed'}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2 mb-1 text-slate-600 dark:text-slate-300">
                    <Dog className="w-4 h-4 text-primary-500" />
                    <span className="text-xs font-semibold">Pet Policy</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{venue.rulesAndPolicies?.pets || 'Not Allowed'}</p>
                </div>
              </div>
            </div>

            {/* 4-Tier Cancellation & Refund Policy */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="font-serif text-xl font-bold text-dark-800 dark:text-slate-100 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Cancellation & Refund Policy
                </h2>
                <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full border border-emerald-200 dark:border-emerald-800">
                  {venue.cancellationPolicy?.policyType || 'Flexible Policy'}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-center">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-1">&gt; {venue.cancellationPolicy?.moreThanDays || 15} Days</p>
                  <p className="text-xl font-extrabold text-emerald-600">{venue.cancellationPolicy?.moreThanDaysRefund ?? 100}%</p>
                  <p className="text-[10px] text-emerald-700/80">Full Refund</p>
                </div>
                <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-950/20 text-center">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">{venue.cancellationPolicy?.withinDays || 7} - {venue.cancellationPolicy?.moreThanDays || 15} Days</p>
                  <p className="text-xl font-extrabold text-blue-600">{venue.cancellationPolicy?.withinDaysRefund ?? 50}%</p>
                  <p className="text-[10px] text-blue-700/80">Partial Refund</p>
                </div>
                <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-950/20 text-center">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">24 - 48 Hours</p>
                  <p className="text-xl font-extrabold text-amber-600">{venue.cancellationPolicy?.withinHoursRefund ?? 20}%</p>
                  <p className="text-[10px] text-amber-700/80">Partial Refund</p>
                </div>
                <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-800/50 bg-rose-50/50 dark:bg-rose-950/20 text-center">
                  <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 mb-1">&lt; 24h / No-Show</p>
                  <p className="text-xl font-extrabold text-rose-600">{venue.cancellationPolicy?.noShowRefund ?? 0}%</p>
                  <p className="text-[10px] text-rose-700/80">Non-Refundable</p>
                </div>
              </div>
            </div>

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
                
                {/* Price Display */}
                <div className="mb-3 pb-3 border-b border-gray-200 dark:border-slate-700">
                  {(() => {
                    if (quickBooking.pricingModel === 'Per Pax') {
                      const cfg = resolvePerPaxPackageConfig(quickBooking.perPaxPackage);
                      if (cfg.rate > 0) {
                        return (
                          <>
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="text-gray-600 dark:text-slate-400 text-xs">Rate per person</p>
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                {cfg.label}
                              </span>
                            </div>
                            <p className="text-2xl font-bold text-primary-600">
                              ₹{cfg.rate.toLocaleString('en-IN')}
                              <span className="text-xs text-gray-500 dark:text-slate-400 font-normal ml-1">/ person</span>
                            </p>
                          </>
                        );
                      }
                    } else if (quickBooking.pricingModel === 'Rent with Amenities' || quickBooking.pricingModel === 'Only Rent') {
                      const rate = getQuickBookingBasePrice(quickBooking.duration);
                      if (rate > 0) {
                        const durLabel = quickBooking.duration === '1' ? '1 Hour' : quickBooking.duration === '4' ? 'Half Day' : quickBooking.duration === '8' ? 'Full Day' : `${quickBooking.duration}h`;
                        return (
                          <>
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="text-gray-600 dark:text-slate-400 text-xs">{quickBooking.pricingModel} ({durLabel})</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                quickBooking.pricingModel === 'Only Rent'
                                  ? 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                                  : 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300'
                              }`}>
                                {quickBooking.pricingModel}
                              </span>
                            </div>
                            <p className="text-2xl font-bold text-primary-600">
                              ₹{rate.toLocaleString('en-IN')}
                              <span className="text-xs text-gray-500 dark:text-slate-400 font-normal ml-1">
                                {quickBooking.duration === '1' ? '/ hour' : quickBooking.duration === '4' ? '/ half day' : '/ full day'}
                              </span>
                            </p>
                          </>
                        );
                      }
                    }
                    const startingPrice = getVenueStartingPrice(venue);
                    return startingPrice.amount > 0 ? (
                      <>
                        <p className="text-gray-600 dark:text-slate-400 text-xs mb-0.5">Starting from</p>
                        <p className="text-2xl font-bold text-primary-600">
                          {startingPrice.formatted}
                          {startingPrice.label && (
                            <span className="text-xs text-gray-600 dark:text-slate-400 ml-1">
                              {startingPrice.label}
                            </span>
                          )}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-semibold text-gray-500">Price on request</p>
                    );
                  })()}
                </div>

                {/* Booking Form */}
                <div className="space-y-2.5">
                  {/* Pricing Model Switcher (if multiple available) */}
                  {availablePricingModels.length > 1 && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">Select Model</label>
                      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        {availablePricingModels.map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              setQuickBooking(prev => {
                                const next = { ...prev, pricingModel: m };
                                if (m === 'Per Pax') {
                                  const firstPkg = availablePerPaxPackages[0]?.key || 'withoutFood';
                                  next.perPaxPackage = prev.perPaxPackage || firstPkg;
                                  const cfg = resolvePerPaxPackageConfig(next.perPaxPackage);
                                  next.guestCount = Math.max(Number(prev.guestCount || 1), cfg.minPax);
                                }
                                return next;
                              });
                            }}
                            className={`py-1.5 px-1 rounded-md text-[10px] sm:text-[11px] font-bold text-center transition-all truncate ${
                              quickBooking.pricingModel === m
                                ? 'bg-white dark:bg-slate-900 text-primary-600 shadow-sm border border-slate-200 dark:border-slate-700'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                            }`}
                            title={m}
                          >
                            {m === 'Rent with Amenities' ? 'Amenities' : m}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Date + Time — one row */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">Select Date</label>
                      <DatePicker
                        selected={quickBooking.date}
                        onChange={(date) => setQuickBooking(prev => ({ ...prev, date }))}
                        minDate={getMinAdvanceBookingDate(venue?.availability?.advanceBookingRule)}
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

                  {/* Duration OR Per-Pax Details */}
                  {quickBooking.pricingModel === 'Per Pax' ? (
                    <div className="space-y-2">
                      {/* Meal Package dropdown */}
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">Select Meal Package</label>
                        <select
                          value={quickBooking.perPaxPackage || 'withoutFood'}
                          onChange={(e) => {
                            const pkgKey = e.target.value;
                            const cfg = resolvePerPaxPackageConfig(pkgKey);
                            setQuickBooking(prev => ({
                              ...prev,
                              perPaxPackage: pkgKey,
                              guestCount: Math.max(Number(prev.guestCount || 1), cfg.minPax)
                            }));
                          }}
                          className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary-500"
                        >
                          {availablePerPaxPackages.map(pkg => (
                            <option key={pkg.key} value={pkg.key}>
                              {pkg.label} (₹{pkg.rate}/pax - Min {pkg.minPax})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Guest Count Input */}
                      <div>
                        {(() => {
                          const activeCfg = resolvePerPaxPackageConfig(quickBooking.perPaxPackage);
                          return (
                            <>
                              <div className="flex justify-between items-center mb-1">
                                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200">
                                  Number of Guests (Pax)
                                </label>
                                <span className="text-[10px] text-slate-500 font-medium">Min: {activeCfg.minPax} pax</span>
                              </div>
                              <div className="flex items-center">
                                <button
                                  type="button"
                                  onClick={() => setQuickBooking(prev => ({
                                    ...prev,
                                    guestCount: Math.max(activeCfg.minPax, (parseInt(prev.guestCount) || activeCfg.minPax) - 5)
                                  }))}
                                  className="px-3 py-1.5 border border-gray-300 dark:border-slate-700 rounded-l-lg bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-100 font-bold text-xs"
                                >
                                  -5
                                </button>
                                <input
                                  type="number"
                                  min={activeCfg.minPax}
                                  max={capacityLimit || 5000}
                                  value={quickBooking.guestCount || activeCfg.minPax}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setQuickBooking(prev => ({
                                      ...prev,
                                      guestCount: isNaN(val) ? '' : Math.max(1, val)
                                    }));
                                  }}
                                  className="w-full text-center py-1.5 border-y border-gray-300 dark:border-slate-700 text-xs font-bold text-gray-900 dark:text-slate-100 bg-white dark:bg-slate-800"
                                />
                                <button
                                  type="button"
                                  onClick={() => setQuickBooking(prev => ({
                                    ...prev,
                                    guestCount: (parseInt(prev.guestCount) || activeCfg.minPax) + 5
                                  }))}
                                  className="px-3 py-1.5 border border-gray-300 dark:border-slate-700 rounded-r-lg bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-100 font-bold text-xs"
                                >
                                  +5
                                </button>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">Select Duration</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {getQuickBookingBasePrice('1') > 0 && (
                          <>
                            {[{ dur: '1', label: '1h', price: getQuickBookingBasePrice('1') }, { dur: '2', label: '2h', price: getQuickBookingBasePrice('2') }].map(({ dur, label, price }) => (
                              <button
                                key={dur}
                                type="button"
                                onClick={() => setQuickBooking(prev => ({ ...prev, duration: dur }))}
                                className={`py-1.5 px-2 rounded-lg border-2 text-center transition-all ${
                                  quickBooking.duration === dur
                                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500'
                                    : 'border-gray-200 dark:border-slate-700 hover:border-primary-300'
                                }`}
                              >
                                <span className="block text-xs font-bold text-gray-900 dark:text-slate-100">{label}</span>
                                <span className={`text-xs font-semibold ${quickBooking.duration === dur ? 'text-primary-600' : 'text-gray-500 dark:text-slate-400'}`}>₹{price.toLocaleString('en-IN')}</span>
                              </button>
                            ))}
                          </>
                        )}
                        {getQuickBookingBasePrice('4') > 0 && (
                          <button
                            type="button"
                            onClick={() => setQuickBooking(prev => ({ ...prev, duration: '4' }))}
                            className={`py-1.5 px-2 rounded-lg border-2 text-center transition-all ${
                              quickBooking.duration === '4'
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500'
                                : 'border-gray-200 dark:border-slate-700 hover:border-primary-300'
                            }`}
                          >
                            <span className="block text-xs font-bold text-gray-900 dark:text-slate-100">Half Day (4h)</span>
                            <span className={`text-xs font-semibold ${quickBooking.duration === '4' ? 'text-primary-600' : 'text-gray-500 dark:text-slate-400'}`}>₹{getQuickBookingBasePrice('4').toLocaleString('en-IN')}</span>
                          </button>
                        )}
                        {getQuickBookingBasePrice('8') > 0 && (
                          <button
                            type="button"
                            onClick={() => setQuickBooking(prev => ({ ...prev, duration: '8' }))}
                            className={`py-1.5 px-2 rounded-lg border-2 text-center transition-all ${
                              quickBooking.duration === '8'
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500'
                                : 'border-gray-200 dark:border-slate-700 hover:border-primary-300'
                            }`}
                          >
                            <span className="block text-xs font-bold text-gray-900 dark:text-slate-100">Full Day (8h)</span>
                            <span className={`text-xs font-semibold ${quickBooking.duration === '8' ? 'text-primary-600' : 'text-gray-500 dark:text-slate-400'}`}>₹{getQuickBookingBasePrice('8').toLocaleString('en-IN')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* End Time (auto-calculated for hourly/daily models) */}
                  {quickBooking.pricingModel !== 'Per Pax' && quickBooking.startTime && quickBooking.duration && (
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

                  {/* Estimated Total with GST Transparency */}
                  {estimate.total > 0 && (
                    <div className="bg-primary-50/70 dark:bg-slate-800/60 rounded-xl p-3 border border-primary-200 dark:border-slate-700 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600 dark:text-slate-300">
                          {quickBooking.pricingModel === 'Per Pax'
                            ? `Base Price (${quickBooking.guestCount || 1} Guests):`
                            : 'Base Space Rental:'}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-slate-100">₹{estimate.basePrice.toLocaleString('en-IN')}</span>
                      </div>

                      {estimate.amenitiesTotal > 0 && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-600 dark:text-slate-300">Amenities & Catering:</span>
                          <span className="font-semibold text-gray-900 dark:text-slate-100">₹{estimate.amenitiesTotal.toLocaleString('en-IN')}</span>
                        </div>
                      )}

                      {/* GST Extra Calculation */}
                      {!estimate.isTaxIncluded && !estimate.isTaxNotApplicable && (
                        <>
                          <div className="flex justify-between items-center text-xs pt-1 border-t border-primary-200/60 dark:border-slate-700">
                            <span className="text-gray-600 dark:text-slate-400">Subtotal:</span>
                            <span className="font-semibold text-gray-900 dark:text-slate-100">₹{estimate.subtotal.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-blue-700 dark:text-blue-300 font-medium">
                            <span className="flex items-center gap-1">
                              <span>GST Extra ({estimate.gstRate}%):</span>
                            </span>
                            <span>+₹{estimate.gst.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-500 pl-2">
                            <span>CGST ({estimate.gstRate / 2}%): ₹{estimate.cgst.toLocaleString('en-IN')}</span>
                            <span>SGST ({estimate.gstRate / 2}%): ₹{estimate.sgst.toLocaleString('en-IN')}</span>
                          </div>
                        </>
                      )}

                      {/* GST Included Breakup */}
                      {estimate.isTaxIncluded && (
                        <div className="pt-1.5 border-t border-primary-200/60 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 p-2.5 rounded-lg border border-primary-100 dark:border-slate-800 text-[11px] space-y-1">
                          <div className="flex justify-between text-gray-600 dark:text-slate-400">
                            <span>Net Base (Excl. Tax):</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">₹{estimate.netSubtotal.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                            <span>GST Included ({estimate.gstRate}%):</span>
                            <span>₹{estimate.gst.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-gray-400 dark:text-slate-500 pl-2">
                            <span>CGST ({estimate.gstRate / 2}%): ₹{estimate.cgst.toLocaleString('en-IN')}</span>
                            <span>SGST ({estimate.gstRate / 2}%): ₹{estimate.sgst.toLocaleString('en-IN')}</span>
                          </div>
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold italic pt-0.5">
                            ✓ Tax is already included in displayed price
                          </p>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-2 border-t-2 border-primary-300 dark:border-slate-700">
                        <div>
                          <span className="text-xs font-bold text-gray-900 dark:text-slate-100 block">Estimated Total:</span>
                          <span className="text-[10px] text-gray-500 dark:text-slate-400">
                            {estimate.isTaxIncluded
                              ? `Includes ₹${estimate.gst.toLocaleString('en-IN')} GST`
                              : estimate.isTaxNotApplicable
                              ? 'GST Not Applicable'
                              : `Includes +₹${estimate.gst.toLocaleString('en-IN')} GST Extra`}
                          </span>
                        </div>
                        <span className="text-xl font-bold text-primary-600">₹{estimate.total.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  )}

                  {/* Reserve Now Button or Stopped Booking Notice */}
                  {venue?.isBookingStopped ? (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-center">
                      <p className="text-xs font-bold text-rose-700 dark:text-rose-300 mb-0.5">🚫 Online Bookings Paused</p>
                      <p className="text-[11px] text-rose-600 dark:text-rose-400">
                        {venue?.stopBookingReason || 'Bookings for this venue are temporarily stopped by administration.'}
                      </p>
                    </div>
                  ) : (
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
                  )}
              </div>
              </>
              )}
            </div>

              {/* Actions: Favorite & Share Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => toggleVenue(venue)}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-md border active:scale-95 ${
                    isVenueFav(venue?._id) || isVenueFav(venue?.sku)
                      ? 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-red-500 hover:border-red-300'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isVenueFav(venue?._id) || isVenueFav(venue?.sku) ? 'fill-current text-red-500' : ''}`} />
                  {isVenueFav(venue?._id) || isVenueFav(venue?.sku) ? 'Saved' : 'Favorite'}
                </button>

                <button
                  type="button"
                  onClick={handleShareVenue}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border-2 border-primary-500 text-primary-500 rounded-lg text-xs font-semibold hover:bg-primary-50 dark:hover:bg-slate-800 transition-colors shadow-md active:scale-95"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </button>
              </div>

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
      
        {/* Similar Venues Nearby / You May Also Like Section */}
        {similarVenues.length > 0 && (
          <div className="mt-14 pt-10 border-t-2 border-gray-200/80 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-7 gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 text-xs font-bold mb-2 border border-primary-200/60 dark:border-primary-800/40">
                  <Sparkles className="w-3.5 h-3.5 text-primary-500" />
                  <span>You May Also Like</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-dark-800 dark:text-slate-100">
                  Similar Venues in {venue.location?.city || 'the Area'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
                  Discover other popular and verified venues in {venue.location?.city || 'the city'} for your event.
                </p>
              </div>
              <Link
                href={`/venues?city=${encodeURIComponent(venue.location?.city || '')}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100 text-xs font-bold text-primary-700 dark:text-primary-300 rounded-lg border border-primary-200 dark:border-primary-800 transition-colors flex-shrink-0"
              >
                <span>View all in {venue.location?.city || 'City'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Venues Grid (4 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {similarVenues.map((simVenue) => {
                const featuredImg = simVenue.images?.find((img) => img.isFeatured)?.url || simVenue.images?.[0]?.url || '/hero-img.jpg';
                const fType = simVenue.foodType || 'Veg';
                const FIcon = getFoodTypeIcon(fType);
                const startingPrice = getVenueStartingPrice(simVenue);
                const typeLabel = Array.isArray(simVenue.venueType) ? simVenue.venueType.join(', ') : (simVenue.venueType || 'Venue');
                const capText = simVenue.capacity ? `${simVenue.capacity} guests` : 'On request';
                const isVer = isVenueVerified(simVenue);

                return (
                  <div
                    key={simVenue._id}
                    onClick={() => {
                      router.push(`/venues/${simVenue.sku}`);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group relative bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200/80 dark:border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Container */}
                      <div className="relative h-44 overflow-hidden bg-gray-100 dark:bg-slate-800">
                        <img
                          src={featuredImg}
                          alt={simVenue.businessName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Capacity Badge */}
                        <div className="absolute top-2.5 left-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                          <Users className="w-3 h-3 text-slate-700 dark:text-slate-300" />
                          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                            {capText}
                          </span>
                        </div>

                        {/* Top-Right Badges: Share & Favorite */}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 z-10">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const url = typeof window !== 'undefined' ? `${window.location.origin}/venues/${simVenue.sku || simVenue._id}` : '';
                              if (navigator.share) {
                                navigator.share({ title: simVenue.businessName, url }).catch(() => {});
                              } else {
                                navigator.clipboard?.writeText(url);
                              }
                            }}
                            className="w-7 h-7 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 hover:text-primary-600 shadow-md flex items-center justify-center transition-all active:scale-95"
                            title="Share venue"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleVenue(simVenue);
                            }}
                            className={`w-7 h-7 rounded-full shadow-md flex items-center justify-center transition-all active:scale-95 ${
                              isVenueFav(simVenue._id) || isVenueFav(simVenue.sku)
                                ? 'bg-red-50 text-red-500'
                                : 'bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 hover:text-red-500'
                            }`}
                            title="Favorite venue"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isVenueFav(simVenue._id) || isVenueFav(simVenue.sku) ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        {/* Verified Pill Overlay */}
                        {isVer && (
                          <div className="absolute bottom-2.5 right-2.5 z-10">
                            <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" /> Verified
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1 line-clamp-1">
                          {typeLabel}
                        </p>
                        <h3 className="font-serif text-base font-bold text-slate-900 dark:text-slate-100 mb-1 line-clamp-1 group-hover:text-primary-500 transition-colors">
                          {simVenue.businessName}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-3 flex items-center gap-1 line-clamp-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span>{[simVenue.location?.area, simVenue.location?.city].filter(Boolean).join(', ') || 'Location on request'}</span>
                        </p>

                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                            <FIcon className="w-3 h-3" />
                            {fType}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer / Price and CTA */}
                    <div className="p-4 pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-gray-400 block leading-tight">Starting from</span>
                        <span className="text-sm font-extrabold text-[#F59F0A]">
                          {startingPrice.amount > 0 ? (
                            <>
                              {startingPrice.formatted}
                              {startingPrice.label && (
                                <span className="text-[10px] font-normal text-gray-500 dark:text-slate-400 ml-0.5">
                                  {startingPrice.label}
                                </span>
                              )}
                            </>
                          ) : (
                            'Price on request'
                          )}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 group-hover:translate-x-0.5 transition-transform">
                        <span>View</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
          initialData={{
            ...quickBooking,
            guestCount: quickBooking.pricingModel === 'Per Pax'
              ? Math.max(resolvePerPaxPackageConfig(quickBooking.perPaxPackage).minPax, Number(quickBooking.guestCount || 1))
              : quickBooking.guestCount
          }}
          initialAmenities={selectedAmenities}
          initialQuantities={quantities}
          isEnquiryMode={!isOnlineBookingOpen(venue?.availability)}
          initialEnquiryData={initialEnquiryData}
          onClose={() => setBookingFormOpen(false)} 
        />
      )}
    </div>
  );
}
