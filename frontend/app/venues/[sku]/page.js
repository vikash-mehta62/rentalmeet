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
  ChevronLeft, ChevronRight, Sparkles, Award, Shield
} from 'lucide-react';
import BookingForm from '@/components/booking/BookingForm';
import VenueReviews from '@/components/venue/VenueReviews';
import Navbar from '@/components/Navbar';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function VenueDetail() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuthStore();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [currentMainImage, setCurrentMainImage] = useState(0);
  const [bookingFormOpen, setBookingFormOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

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

  // Update quantity
  const updateQuantity = (key, value) => {
    const qty = parseInt(value) || 0;
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950" style={{ fontFamily: 'Georgia, serif' }}>
      {/* Navbar */}
      <Navbar />

      {/* Back to all venues link - with top padding for fixed navbar */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 mt-[102px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/venues" className="inline-flex items-center gap-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to all venues</span>
          </Link>
        </div>
      </div>

      {/* Content - 2 Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Images & Details (65%) - Scrollable */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image with Scrollable Thumbnails */}
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden border border-transparent dark:border-slate-800">
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-6 border border-transparent dark:border-slate-800">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-slate-100 mb-4">
                {venue.businessName}
              </h1>
              <div className="flex flex-wrap items-center gap-3 text-gray-600 dark:text-slate-300">
                <span className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary-500" />
                  {venue.location?.city}, {venue.location?.area}
                </span>
                <span className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-500" />
                  Up to {venue.capacity} guests
                </span>
                {venue.rating > 0 && (
                  <span className="flex items-center gap-2 bg-yellow-50 px-3 py-1 rounded-full">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-gray-900">{venue.rating}</span>
                    <span className="text-gray-600">({venue.reviewCount} reviews)</span>
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
            {/* Venue Types - Attractive Pills */}
            {venue.venueType?.length > 0 && (
            <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl shadow-soft border border-primary-100 dark:border-slate-700 p-6">
                <h3 className="text-sm font-semibold text-gray-600 dark:text-slate-300 mb-3 uppercase tracking-wide">Venue Types</h3>
                <div className="flex flex-wrap gap-3">
                  {venue.venueType.map((type, idx) => (
                    <span
                      key={idx}
                      className="px-5 py-2.5 bg-white dark:bg-slate-900 text-primary-700 text-sm font-bold rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105 border border-primary-200 dark:border-slate-700"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft border border-gray-100 dark:border-slate-800 p-6 md:p-8">
              <h2 className="text-2xl font-bold text-dark-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-primary-500" />
                About This Venue
              </h2>
              <p className="text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line text-lg">
                {venue.description}
              </p>
            </div>

            {/* Amenities - Interactive Selection */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft border border-gray-100 dark:border-slate-800 p-6">
              <h2 className="text-2xl font-bold text-dark-800 dark:text-slate-100 mb-6">Select Amenities & Services</h2>
              
              {/* Basic Amenities */}
              {venue.amenities?.basic?.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-base font-semibold text-dark-700 mb-2 flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-primary-500" />
                    Basic Amenities
                  </h3>
                  
                  {/* Included (Free) Amenities - Display only, no selection */}
                  {venue.amenities.basic.filter(a => a.available && (a.type === 'Free' || a.type === 'Included')).length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-green-700 mb-2 bg-green-50 px-2 py-1 rounded inline-block">Included</p>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {venue.amenities.basic.filter(a => a.available && (a.type === 'Free' || a.type === 'Included')).map((amenity, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2 border-2 border-green-200 bg-green-50 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span className="font-medium text-xs text-green-800">{amenity.name}</span>
                            </div>
                            <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded">Free</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  
                  {/* Paid Amenities - Selectable */}
                  {venue.amenities.basic.filter(a => a.available && a.type === 'Paid').length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-orange-700 mb-2 bg-orange-50 px-2 py-1 rounded inline-block">Paid</p>
                      <div className="grid grid-cols-2 gap-2">
                        {venue.amenities.basic.filter(a => a.available && a.type === 'Paid').map((amenity, idx) => {
                          const key = `basic_${amenity.name}`;
                          const qty = quantities[key] || 0;
                          const isSelected = isAmenitySelected('basic', amenity.name);
                          const isPerUse = amenity.rateType === 'Per Use';
                          
                          return (
                            <div
                              key={idx}
                              className={`p-2 border-2 rounded-lg transition-all ${
                                isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 dark:border-slate-700'
                              }`}
                            >
                              <label className="flex items-center justify-between cursor-pointer mb-2">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleAmenity('basic', amenity)}
                                    className="w-4 h-4 rounded border-2 border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                                  />
                                  <span className="font-medium text-xs">{amenity.name}</span>
                                </div>
                                <span className="text-xs font-semibold text-primary-600">₹{amenity.rate}</span>
                              </label>
                              
                              {isPerUse && (
                                <div className="flex items-center gap-1 ml-6">
                                  <button
                                    type="button"
                                    onClick={() => isSelected && updateQuantity(key, Math.max(0, qty - 1))}
                                    disabled={!isSelected}
                                    className={`w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-xs font-bold ${
                                      isSelected ? 'hover:border-primary-500 hover:bg-primary-50 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                                    }`}
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    value={qty}
                                    onChange={(e) => isSelected && updateQuantity(key, parseInt(e.target.value) || 0)}
                                    disabled={!isSelected}
                                    className={`w-12 h-6 text-center border border-gray-300 dark:border-slate-700 rounded text-xs ${
                                      !isSelected ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                                    }`}
                                    min="0"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => isSelected && updateQuantity(key, qty + 1)}
                                    disabled={!isSelected}
                                    className={`w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-xs font-bold ${
                                      isSelected ? 'hover:border-primary-500 hover:bg-primary-50 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                                    }`}
                                  >
                                    +
                                  </button>
                                  <span className="text-xs font-semibold text-primary-600 ml-1">₹{((amenity.rate || 0) * qty).toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Beverages */}
              {venue.amenities?.beverages?.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-base font-semibold text-dark-700 mb-2 flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-primary-500" />
                    Beverages
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {venue.amenities.beverages.filter(b => b.available && b.name).map((beverage, idx) => {
                      const key = `beverage_${beverage.name}`;
                      const qty = quantities[key] || 0;
                      const isSelected = isAmenitySelected('beverages', beverage.name);
                      
                      return (
                        <div
                          key={idx}
                          className={`p-2 border-2 rounded-lg transition-all ${
                            isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 dark:border-slate-700'
                          }`}
                        >
                          <label className="flex items-center justify-between cursor-pointer mb-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleAmenity('beverages', beverage)}
                                className="w-4 h-4 rounded border-2 border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                              />
                              <span className="font-medium text-xs">{beverage.name}</span>
                            </div>
                            <span className="text-xs font-semibold text-primary-600">₹{beverage.ratePerUnit}/person</span>
                          </label>
                          
                          <div className="flex items-center gap-1 ml-6">
                            <button
                              type="button"
                              onClick={() => isSelected && updateQuantity(key, Math.max(0, qty - 1))}
                              disabled={!isSelected}
                              className={`w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-xs font-bold ${
                                isSelected ? 'hover:border-primary-500 hover:bg-primary-50 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                              }`}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={qty}
                              onChange={(e) => isSelected && updateQuantity(key, parseInt(e.target.value) || 0)}
                              disabled={!isSelected}
                            className={`w-12 h-6 text-center border border-gray-300 dark:border-slate-700 rounded text-xs ${
                              !isSelected ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed' : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                              }`}
                              min="0"
                            />
                            <button
                              type="button"
                              onClick={() => isSelected && updateQuantity(key, qty + 1)}
                              disabled={!isSelected}
                              className={`w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-xs font-bold ${
                                isSelected ? 'hover:border-primary-500 hover:bg-primary-50 cursor-pointer' : 'opacity-50 cursor-not-allowed'
                              }`}
                            >
                              +
                            </button>
                            <span className="text-xs font-semibold text-primary-600 ml-1">₹{((beverage.ratePerUnit || 0) * qty).toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Refreshment Food */}
              {venue.amenities?.refreshmentFood?.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-base font-semibold text-dark-700 mb-2 flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-primary-500" />
                    Refreshments & Snacks
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {venue.amenities.refreshmentFood.filter(f => f.available).map((food, idx) => {
                      const key = `food_${food.name}`;
                      const qty = quantities[key] || 0;
                      const isSelected = isAmenitySelected('refreshmentFood', food.name);
                      
                      return (
                        <div
                          key={idx}
                          className={`p-2 border-2 rounded-lg transition-all ${
                            isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 dark:border-slate-700'
                          }`}
                        >
                          <label className="flex items-center justify-between cursor-pointer mb-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleAmenity('refreshmentFood', food)}
                                className="w-4 h-4 rounded border-2 border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                              />
                              <span className="font-medium text-xs">{food.name}</span>
                            </div>
                            <span className="text-xs font-semibold text-primary-600">₹{food.ratePerPlate}/plate</span>
                          </label>
                          
                          {isSelected && (
                            <div className="flex items-center gap-1 ml-6">
                              <button
                                type="button"
                                onClick={() => updateQuantity(key, Math.max(0, qty - 1))}
                                  className="w-6 h-6 rounded border border-gray-300 dark:border-slate-700 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center text-xs font-bold"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={qty}
                                onChange={(e) => updateQuantity(key, parseInt(e.target.value) || 0)}
                                  className="w-12 h-6 text-center border border-gray-300 dark:border-slate-700 rounded text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                min="0"
                              />
                              <button
                                type="button"
                                onClick={() => updateQuantity(key, qty + 1)}
                                  className="w-6 h-6 rounded border border-gray-300 dark:border-slate-700 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center text-xs font-bold"
                              >
                                +
                              </button>
                              <span className="text-xs font-semibold text-primary-600 ml-1">₹{((food.ratePerPlate || 0) * qty).toLocaleString()}</span>
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
                <div className="mb-5">
                  <h3 className="text-base font-semibold text-dark-700 mb-3 flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-primary-500" />
                    Lunch Thalis
                  </h3>
                  <div className="space-y-3">
                    {venue.amenities.lunchThalis.map((thali, thaliIdx) => (
                      <div key={thaliIdx} className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-slate-800 dark:to-slate-800 border-2 border-orange-200 dark:border-slate-700 rounded-xl p-3">
                        {/* Thali Type Header */}
                        <h4 className="font-bold text-orange-900 mb-2 text-sm">{thali.thaliType}</h4>
                        
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
                                className={`p-2 border-2 rounded-lg transition-all bg-white dark:bg-slate-900 ${
                                  isSelected ? 'border-orange-500 bg-orange-50' : 'border-orange-200 dark:border-slate-700'
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
                                    <button
                                      type="button"
                                      onClick={() => updateQuantity(key, Math.max(0, qty - 1))}
                                      className="w-6 h-6 rounded border border-orange-300 hover:border-orange-500 hover:bg-orange-100 flex items-center justify-center text-xs font-bold"
                                    >
                                      -
                                    </button>
                                    <input
                                      type="number"
                                      value={qty}
                                      onChange={(e) => updateQuantity(key, parseInt(e.target.value) || 0)}
                                      className="w-12 h-6 text-center border border-orange-300 dark:border-slate-700 rounded text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                                      min="0"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => updateQuantity(key, qty + 1)}
                                      className="w-6 h-6 rounded border border-orange-300 hover:border-orange-500 hover:bg-orange-100 flex items-center justify-center text-xs font-bold"
                                    >
                                      +
                                    </button>
                                    <span className="text-xs font-semibold text-orange-600 ml-1">
                                      ₹{((category.ratePerPlate || 0) * qty).toLocaleString()}
                                    </span>
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft border border-gray-100 dark:border-slate-800 p-6">
              <h2 className="text-2xl font-bold text-dark-800 dark:text-slate-100 mb-4">Location</h2>
              <div className="space-y-3 text-gray-600 dark:text-slate-300">
                <p><strong>Address:</strong> {venue.location?.address}</p>
                <p><strong>Landmark:</strong> {venue.location?.landmark}</p>
                {venue.location?.state && (
                  <p><strong>State:</strong> {venue.location?.state}</p>
                )}
                <p><strong>City:</strong> {venue.location?.city}</p>
                {venue.location?.village && (
                  <p><strong>Village:</strong> {venue.location?.village}</p>
                )}
                <p><strong>Area:</strong> {venue.location?.area}</p>
                <p><strong>Pincode:</strong> {venue.location?.pincode}</p>
                <p><strong>Parking:</strong> {venue.location?.parkingAvailability}</p>
                {venue.location?.nearestBusAuto && (
                  <p><strong>Nearest Bus/Auto:</strong> {venue.location?.nearestBusAuto}</p>
                )}
                {venue.location?.nearestMetroTrain && (
                  <p><strong>Nearest Metro/Train:</strong> {venue.location?.nearestMetroTrain}</p>
                )}
                {venue.location?.googleMapLink && (
                  <a
                    href={venue.location.googleMapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 font-medium"
                  >
                    <MapPin className="w-5 h-5" />
                    View on Google Maps
                  </a>
                )}
              </div>
            </div>

            {/* Pricing - Card Format - Moved to bottom */}
            {venue.pricing && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-soft border border-gray-100 dark:border-slate-800 p-6">
                <h2 className="text-2xl font-bold text-dark-800 dark:text-slate-100 mb-4">Pricing (Weekday)</h2>
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
                        <Clock className="w-8 h-8 mx-auto mb-2 text-primary-500" />
                        <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-slate-100">1 Hour</h3>
                        <p className="text-2xl font-bold text-primary-600">₹{venue.pricing.perHour.weekday?.toLocaleString()}</p>
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
                        <Clock className="w-8 h-8 mx-auto mb-2 text-primary-500" />
                        <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-slate-100">4 Hours</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Half Day</p>
                        <p className="text-2xl font-bold text-primary-600">₹{venue.pricing.halfDay.weekday?.toLocaleString()}</p>
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
                        <Calendar className="w-8 h-8 mx-auto mb-2 text-primary-500" />
                        <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-slate-100">Full Day</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">8 hours</p>
                        <p className="text-2xl font-bold text-primary-600">₹{venue.pricing.fullDay.weekday?.toLocaleString()}</p>
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
              {/* Booking Card - Extra Compact */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-200 dark:border-slate-800 p-3">
                <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">Book This Venue</h2>
                
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
                  {/* Date Picker */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">Select Date</label>
                    <DatePicker
                      selected={quickBooking.date}
                      onChange={(date) => setQuickBooking(prev => ({ ...prev, date }))}
                      minDate={(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })()}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Pick a date"
                      className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      calendarClassName="custom-calendar"
                    />
                  </div>
                  
                  {/* Time Dropdown - dynamic based on venue opening/closing time */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-200 mb-1">Start Time</label>
                    <select
                      value={quickBooking.startTime}
                      className="w-full px-2.5 py-1.5 border border-gray-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      onChange={(e) => setQuickBooking(prev => ({ ...prev, startTime: e.target.value }))}
                    >
                      <option value="">Select start time</option>
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

                  {/* Duration Cards */}
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
                              className={`flex flex-col items-center py-2 px-1 rounded-lg border-2 transition-all ${
                                quickBooking.duration === dur
                                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                  : 'border-gray-200 dark:border-slate-700 hover:border-primary-300'
                              }`}
                            >
                              <Clock className={`w-4 h-4 mb-0.5 ${quickBooking.duration === dur ? 'text-primary-500' : 'text-gray-400'}`} />
                              <span className="text-xs font-bold text-gray-900 dark:text-slate-100">{label}</span>
                              <span className={`text-xs font-semibold ${quickBooking.duration === dur ? 'text-primary-600' : 'text-gray-600 dark:text-slate-300'}`}>₹{price.toLocaleString('en-IN')}</span>
                            </button>
                          ))}
                        </>
                      )}
                      {venue.pricing?.enabledOptions?.halfDay && venue.pricing?.halfDay?.weekday && (
                        <button
                          type="button"
                          onClick={() => setQuickBooking(prev => ({ ...prev, duration: '4' }))}
                          className={`flex flex-col items-center py-2 px-1 rounded-lg border-2 transition-all ${
                            quickBooking.duration === '4'
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-slate-700 hover:border-primary-300'
                          }`}
                        >
                          <Clock className={`w-4 h-4 mb-0.5 ${quickBooking.duration === '4' ? 'text-primary-500' : 'text-gray-400'}`} />
                          <span className="text-xs font-bold text-gray-900 dark:text-slate-100">4h</span>
                          <span className={`text-xs font-semibold ${quickBooking.duration === '4' ? 'text-primary-600' : 'text-gray-600 dark:text-slate-300'}`}>₹{venue.pricing.halfDay.weekday.toLocaleString('en-IN')}</span>
                        </button>
                      )}
                      {venue.pricing?.enabledOptions?.fullDay && venue.pricing?.fullDay?.weekday && (
                        <button
                          type="button"
                          onClick={() => setQuickBooking(prev => ({ ...prev, duration: '8' }))}
                          className={`flex flex-col items-center py-2 px-1 rounded-lg border-2 transition-all ${
                            quickBooking.duration === '8'
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-slate-700 hover:border-primary-300'
                          }`}
                        >
                          <Clock className={`w-4 h-4 mb-0.5 ${quickBooking.duration === '8' ? 'text-primary-500' : 'text-gray-400'}`} />
                          <span className="text-xs font-bold text-gray-900 dark:text-slate-100">Full Day</span>
                          <span className={`text-xs font-semibold ${quickBooking.duration === '8' ? 'text-primary-600' : 'text-gray-600 dark:text-slate-300'}`}>₹{venue.pricing.fullDay.weekday.toLocaleString('en-IN')}</span>
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
                      setBookingFormOpen(true);
                    }}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2.5 rounded-lg text-sm font-bold shadow-lg hover:shadow-xl transition-all"
                  >
                    Reserve Now
                  </button>
                </div>
              </div>

              {/* Share Button */}
              <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border-2 border-primary-500 text-primary-500 rounded-lg text-xs font-semibold hover:bg-primary-50 dark:hover:bg-slate-800 transition-colors shadow-md">
                <Share2 className="w-3.5 h-3.5" />
                Share Venue
              </button>
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
