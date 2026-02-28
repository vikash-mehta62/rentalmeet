'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, MapPin, Users, Clock, Calendar,
  Wifi, Coffee, Utensils, CheckCircle2, ArrowLeft,
  Star, Phone, Mail, Share2, Image as ImageIcon, X,
  ChevronLeft, ChevronRight, Sparkles, Award, Shield
} from 'lucide-react';
import BookingForm from '@/components/booking/BookingForm';
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
  const [bookingFormOpen, setBookingFormOpen] = useState(false);
  
  // Quick booking form state
  const [quickBooking, setQuickBooking] = useState({
    date: '',
    startTime: '',
    duration: '2' // Default 2 hours
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
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    const filtered = getFilteredImages();
    setLightboxIndex((lightboxIndex + 1) % filtered.length);
  };

  const prevImage = () => {
    const filtered = getFilteredImages();
    setLightboxIndex((lightboxIndex - 1 + filtered.length) % filtered.length);
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
      const qty = quantities[`thali_${thali.type}`] || 0;
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading venue details...</p>
        </div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Venue Not Found</h2>
          <p className="text-gray-500 mb-6">{error || 'The venue you are looking for does not exist'}</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Hero Image Section - Modern & Attractive */}
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800">
        {/* Main Featured Image with Overlay */}
        <div className="relative h-[400px] md:h-[450px]">
          {venue.images?.find(img => img.isFeatured)?.url || venue.images?.[0]?.url ? (
            <>
              <img
                src={venue.images.find(img => img.isFeatured)?.url || venue.images[0].url}
                alt={venue.businessName}
                className="w-full h-full object-cover"
              />
              {/* Gradient Overlay for better text visibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
              <Building2 className="w-32 h-32 text-white/30" />
            </div>
          )}
          
          {/* Top Badges Row */}
          <div className="absolute top-4 left-0 right-0 px-4 md:px-6 flex items-center justify-between">
            {/* Status Badge */}
            <div className={`px-4 py-2 rounded-full shadow-xl text-xs md:text-sm font-bold backdrop-blur-sm ${
              venue.status === 'approved' ? 'bg-green-500/90 text-white' :
              venue.status === 'pending' ? 'bg-yellow-500/90 text-white' :
              'bg-red-500/90 text-white'
            }`}>
              ✓ {venue.status?.toUpperCase()}
            </div>

            {/* Image Count Badge */}
            {venue.images?.length > 0 && (
              <div className="px-4 py-2 bg-white/95 backdrop-blur-sm text-gray-900 rounded-full text-xs md:text-sm font-bold flex items-center gap-2 shadow-xl">
                <ImageIcon className="w-4 h-4" />
                {venue.images.length} Photos
              </div>
            )}
          </div>

          {/* Bottom Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-end justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-3 drop-shadow-lg">
                    {venue.businessName}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 text-white/90 text-sm">
                    <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <MapPin className="w-3.5 h-3.5" />
                      {venue.location?.city}, {venue.location?.area}
                    </span>
                    <span className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                      <Users className="w-3.5 h-3.5" />
                      Up to {venue.capacity} guests
                    </span>
                    {venue.rating > 0 && (
                      <span className="flex items-center gap-1.5 bg-yellow-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-white font-semibold">
                        <Star className="w-3.5 h-3.5 fill-white" />
                        {venue.rating} ({venue.reviewCount})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Gallery Section with Categories */}
        {venue.images?.length > 0 && (
          <div className="bg-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-5">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 md:gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                <span className="text-xs md:text-sm font-semibold text-gray-700 whitespace-nowrap">View:</span>
                {categories.map((category) => {
                  const count = category === 'All' 
                    ? venue.images.length 
                    : venue.images.filter(img => img.category === category).length;
                  
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                        selectedCategory === category
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-105'
                      }`}
                    >
                      {category}
                      <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                        selectedCategory === category 
                          ? 'bg-white/30' 
                          : 'bg-gray-200'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Photo Grid - Professional Masonry Layout */}
              <div className="grid grid-cols-4 md:grid-cols-6 gap-2 md:gap-3 auto-rows-[100px] md:auto-rows-[130px]">
                {/* Layout Pattern for first 10 images */}
                {filteredImages.length > 0 && (
                  <>
                    {/* First Image - Large Featured (2x2) */}
                    {filteredImages[0] && (
                      <div
                        onClick={() => openLightbox(0)}
                        className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden cursor-pointer group shadow-lg hover:shadow-2xl transition-all duration-300"
                      >
                        <img
                          src={filteredImages[0].url}
                          alt={`${venue.businessName} - ${filteredImages[0].category}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-4 left-4 right-4">
                            <span className="text-white font-bold text-base drop-shadow-lg block mb-1">
                              {filteredImages[0].category}
                            </span>
                            <span className="text-white/80 text-xs">Click to view</span>
                          </div>
                        </div>
                        <div className="absolute top-3 right-3 bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          Featured
                        </div>
                      </div>
                    )}

                    {/* Images 2-3 - Vertical Stack */}
                    {filteredImages[1] && (
                      <div
                        onClick={() => openLightbox(1)}
                        className="col-span-1 row-span-1 relative rounded-xl overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition-all duration-300"
                      >
                        <img
                          src={filteredImages[1].url}
                          alt={`${venue.businessName} - ${filteredImages[1].category}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-2 left-2 right-2">
                            <span className="text-white text-xs font-semibold drop-shadow-lg line-clamp-1">
                              {filteredImages[1].category}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {filteredImages[2] && (
                      <div
                        onClick={() => openLightbox(2)}
                        className="col-span-1 row-span-1 relative rounded-xl overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition-all duration-300"
                      >
                        <img
                          src={filteredImages[2].url}
                          alt={`${venue.businessName} - ${filteredImages[2].category}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-2 left-2 right-2">
                            <span className="text-white text-xs font-semibold drop-shadow-lg line-clamp-1">
                              {filteredImages[2].category}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Images 4-5 - Tall Images (1x2) */}
                    {filteredImages[3] && (
                      <div
                        onClick={() => openLightbox(3)}
                        className="col-span-1 row-span-2 relative rounded-xl overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition-all duration-300"
                      >
                        <img
                          src={filteredImages[3].url}
                          alt={`${venue.businessName} - ${filteredImages[3].category}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-3 left-3 right-3">
                            <span className="text-white text-sm font-semibold drop-shadow-lg line-clamp-2">
                              {filteredImages[3].category}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {filteredImages[4] && (
                      <div
                        onClick={() => openLightbox(4)}
                        className="col-span-1 row-span-2 relative rounded-xl overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition-all duration-300"
                      >
                        <img
                          src={filteredImages[4].url}
                          alt={`${venue.businessName} - ${filteredImages[4].category}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-3 left-3 right-3">
                            <span className="text-white text-sm font-semibold drop-shadow-lg line-clamp-2">
                              {filteredImages[4].category}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Images 6-9 - Regular Grid */}
                    {filteredImages.slice(5, 9).map((image, idx) => (
                      <div
                        key={idx + 5}
                        onClick={() => openLightbox(idx + 5)}
                        className="col-span-1 row-span-1 relative rounded-xl overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition-all duration-300"
                      >
                        <img
                          src={image.url}
                          alt={`${venue.businessName} - ${image.category}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="absolute bottom-2 left-2 right-2">
                            <span className="text-white text-xs font-semibold drop-shadow-lg line-clamp-1">
                              {image.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Show More Button - if more than 9 images */}
                    {filteredImages.length > 9 && (
                      <div
                        onClick={() => openLightbox(9)}
                        className="col-span-2 row-span-1 relative rounded-xl overflow-hidden cursor-pointer bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex flex-col items-center justify-center shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
                      >
                        <div className="text-center">
                          <ImageIcon className="w-8 h-8 text-white mb-1 mx-auto group-hover:scale-110 transition-transform" />
                          <span className="text-white font-bold text-xl block">
                            +{filteredImages.length - 9}
                          </span>
                          <span className="text-white/90 text-xs font-medium">More Photos</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox - Enhanced */}
      {lightboxOpen && filteredImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/98 flex items-center justify-center backdrop-blur-sm">
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute top-6 right-6 text-white hover:text-gray-300 p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all z-10"
          >
            <X className="w-8 h-8" />
          </button>
          
          {/* Previous Button */}
          <button
            onClick={prevImage}
            className="absolute left-6 text-white hover:text-gray-300 p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all z-10"
          >
            <ChevronLeft className="w-12 h-12" />
          </button>
          
          {/* Image Container */}
          <div className="max-w-7xl max-h-[90vh] flex flex-col items-center px-4">
            <div className="relative">
              <img
                src={filteredImages[lightboxIndex]?.url}
                alt={`${venue.businessName} - ${filteredImages[lightboxIndex]?.category}`}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
              />
              {/* Image Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
                <p className="text-white text-xl font-bold mb-1">
                  {filteredImages[lightboxIndex]?.category}
                </p>
                <p className="text-gray-300 text-sm">
                  {venue.businessName}
                </p>
              </div>
            </div>
            
            {/* Counter */}
            <div className="mt-6 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full">
              <p className="text-white font-semibold">
                {lightboxIndex + 1} / {filteredImages.length}
              </p>
            </div>
          </div>
          
          {/* Next Button */}
          <button
            onClick={nextImage}
            className="absolute right-6 text-white hover:text-gray-300 p-3 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all z-10"
          >
            <ChevronRight className="w-12 h-12" />
          </button>

          {/* Thumbnail Strip */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 max-w-4xl overflow-x-auto">
            <div className="flex gap-2 px-4">
              {filteredImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all ${
                    idx === lightboxIndex 
                      ? 'ring-4 ring-white scale-110' 
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={img.url}
                    alt={img.category}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Venue Types - Attractive Pills */}
            {venue.venueType?.length > 0 && (
              <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl shadow-soft border border-primary-100 p-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Venue Types</h3>
                <div className="flex flex-wrap gap-3">
                  {venue.venueType.map((type, idx) => (
                    <span
                      key={idx}
                      className="px-5 py-2.5 bg-white text-primary-700 text-sm font-bold rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105 border border-primary-200"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 md:p-8">
              <h2 className="text-2xl font-bold text-dark-800 mb-4 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-primary-500" />
                About This Venue
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
                {venue.description}
              </p>
            </div>

            {/* Amenities - Interactive Selection */}
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
              <h2 className="text-2xl font-bold text-dark-800 mb-6">Select Amenities & Services</h2>
              
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
                                isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                              }`}
                            >
                              <label className="flex items-center gap-2 cursor-pointer mb-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleAmenity('basic', amenity)}
                                  className="w-4 h-4 rounded border-2 border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                                />
                                <div className="flex-1">
                                  <span className="font-medium text-xs block">{amenity.name}</span>
                                  <span className="text-xs text-gray-500">₹{amenity.rate} {amenity.rateType || 'Fixed'}</span>
                                </div>
                                {!isPerUse && (
                                  <span className="text-xs font-semibold text-primary-600">₹{amenity.rate}</span>
                                )}
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
                                    className={`w-12 h-6 text-center border border-gray-300 rounded text-xs ${
                                      !isSelected ? 'bg-gray-100 cursor-not-allowed' : ''
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
                            isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                          }`}
                        >
                          <label className="flex items-center gap-2 cursor-pointer mb-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleAmenity('beverages', beverage)}
                              className="w-4 h-4 rounded border-2 border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                            />
                            <div className="flex-1">
                              <span className="font-medium text-xs block">{beverage.name}</span>
                              <span className="text-xs text-gray-500">₹{beverage.ratePerUnit}/person</span>
                            </div>
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
                              className={`w-12 h-6 text-center border border-gray-300 rounded text-xs ${
                                !isSelected ? 'bg-gray-100 cursor-not-allowed' : ''
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
                            isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                          }`}
                        >
                          <label className="flex items-center gap-2 cursor-pointer mb-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleAmenity('refreshmentFood', food)}
                              className="w-4 h-4 rounded border-2 border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                            />
                            <div className="flex-1">
                              <span className="font-medium text-xs block">{food.name}</span>
                              <span className="text-xs text-gray-500">₹{food.ratePerPlate}/plate</span>
                            </div>
                          </label>
                          
                          {isSelected && (
                            <div className="flex items-center gap-1 ml-6">
                              <button
                                type="button"
                                onClick={() => updateQuantity(key, Math.max(0, qty - 1))}
                                className="w-6 h-6 rounded border border-gray-300 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center text-xs font-bold"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={qty}
                                onChange={(e) => updateQuantity(key, parseInt(e.target.value) || 0)}
                                className="w-12 h-6 text-center border border-gray-300 rounded text-xs"
                                min="0"
                              />
                              <button
                                type="button"
                                onClick={() => updateQuantity(key, qty + 1)}
                                className="w-6 h-6 rounded border border-gray-300 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center text-xs font-bold"
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

              {/* Lunch Thalis */}
              {venue.amenities?.lunchThalis?.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-base font-semibold text-dark-700 mb-2 flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-primary-500" />
                    Lunch Thalis
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {venue.amenities.lunchThalis.filter(t => t.available).map((thali, idx) => {
                      const key = `thali_${thali.type}`;
                      const qty = quantities[key] || 0;
                      const isSelected = isAmenitySelected('lunchThalis', thali.type);
                      
                      return (
                        <div
                          key={idx}
                          className={`p-2 border-2 rounded-lg transition-all ${
                            isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200'
                          }`}
                        >
                          <label className="flex items-center gap-2 cursor-pointer mb-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleAmenity('lunchThalis', { ...thali, name: thali.type })}
                              className="w-4 h-4 rounded border-2 border-gray-300 text-primary-500 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                            />
                            <div className="flex-1">
                              <span className="font-medium text-xs block">{thali.type}</span>
                              <span className="text-xs text-gray-500">₹{thali.ratePerPlate}/plate</span>
                            </div>
                          </label>
                          
                          {isSelected && (
                            <div className="flex items-center gap-1 ml-6">
                              <button
                                type="button"
                                onClick={() => updateQuantity(key, Math.max(0, qty - 1))}
                                className="w-6 h-6 rounded border border-gray-300 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center text-xs font-bold"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={qty}
                                onChange={(e) => updateQuantity(key, parseInt(e.target.value) || 0)}
                                className="w-12 h-6 text-center border border-gray-300 rounded text-xs"
                                min="0"
                              />
                              <button
                                type="button"
                                onClick={() => updateQuantity(key, qty + 1)}
                                className="w-6 h-6 rounded border border-gray-300 hover:border-primary-500 hover:bg-primary-50 flex items-center justify-center text-xs font-bold"
                              >
                                +
                              </button>
                              <span className="text-xs font-semibold text-primary-600 ml-1">₹{((thali.ratePerPlate || 0) * qty).toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
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
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
              <h2 className="text-2xl font-bold text-dark-800 mb-4">Location</h2>
              <div className="space-y-3 text-gray-600">
                <p><strong>Address:</strong> {venue.location?.address}</p>
                <p><strong>Landmark:</strong> {venue.location?.landmark}</p>
                <p><strong>City:</strong> {venue.location?.city}</p>
                <p><strong>Area:</strong> {venue.location?.area}</p>
                <p><strong>Pincode:</strong> {venue.location?.pincode}</p>
                <p><strong>Parking:</strong> {venue.location?.parkingAvailability}</p>
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
              <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
                <h2 className="text-2xl font-bold text-dark-800 mb-4">Pricing (Weekday)</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 1 Hour Card */}
                  {venue.pricing.perHour && (
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
                        <h3 className="font-bold text-lg mb-1">1 Hour</h3>
                        <p className="text-2xl font-bold text-primary-600">₹{venue.pricing.perHour.weekday?.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* 4 Hours Card */}
                  {venue.pricing.halfDay && (
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
                        <h3 className="font-bold text-lg mb-1">4 Hours</h3>
                        <p className="text-sm text-gray-500 mb-1">Half Day</p>
                        <p className="text-2xl font-bold text-primary-600">₹{venue.pricing.halfDay.weekday?.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* 8 Hours Card */}
                  {venue.pricing.fullDay && (
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
                        <h3 className="font-bold text-lg mb-1">Full Day</h3>
                        <p className="text-sm text-gray-500 mb-1">8 hours</p>
                        <p className="text-2xl font-bold text-primary-600">₹{venue.pricing.fullDay.weekday?.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
              {/* Booking Card with Inline Form */}
              <div className="bg-gradient-to-br from-primary-50 to-orange-50 rounded-2xl shadow-lg border-2 border-primary-200 p-6">
                <div className="text-center mb-6">
                  <p className="text-gray-600 mb-2 font-medium">Starting from</p>
                  <p className="text-4xl font-bold text-primary-600">
                    ₹{venue.pricing?.perHour?.weekday?.toLocaleString()}
                    <span className="text-lg text-gray-600">/hour</span>
                  </p>
                </div>

                {/* Quick Booking Form */}
                <div className="space-y-4 bg-white rounded-xl p-4 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Select Date</label>
                    <input
                      type="date"
                      value={quickBooking.date}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      onChange={(e) => setQuickBooking(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Start Time</label>
                    <select
                      value={quickBooking.startTime}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                      onChange={(e) => setQuickBooking(prev => ({ ...prev, startTime: e.target.value }))}
                    >
                      <option value="">Select start time</option>
                      <option value="09:00">09:00 AM</option>
                      <option value="09:30">09:30 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="10:30">10:30 AM</option>
                      <option value="11:00">11:00 AM</option>
                      <option value="11:30">11:30 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="12:30">12:30 PM</option>
                      <option value="13:00">01:00 PM</option>
                      <option value="13:30">01:30 PM</option>
                      <option value="14:00">02:00 PM</option>
                      <option value="14:30">02:30 PM</option>
                      <option value="15:00">03:00 PM</option>
                      <option value="15:30">03:30 PM</option>
                      <option value="16:00">04:00 PM</option>
                      <option value="16:30">04:30 PM</option>
                      <option value="17:00">05:00 PM</option>
                      <option value="17:30">05:30 PM</option>
                      <option value="18:00">06:00 PM</option>
                      <option value="18:30">06:30 PM</option>
                      <option value="19:00">07:00 PM</option>
                      <option value="19:30">07:30 PM</option>
                      <option value="20:00">08:00 PM</option>
                      <option value="20:30">08:30 PM</option>
                      <option value="21:00">09:00 PM</option>
                      <option value="21:30">09:30 PM</option>
                      <option value="22:00">10:00 PM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">Duration</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['1', '2', '4', '8'].map((hours) => (
                        <button
                          key={hours}
                          type="button"
                          onClick={() => setQuickBooking(prev => ({ ...prev, duration: hours }))}
                          className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                            quickBooking.duration === hours
                              ? 'bg-primary-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {hours === '8' ? 'Full Day' : `${hours} Hour${hours > '1' ? 's' : ''}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Estimate Breakdown */}
                {estimate.total > 0 && (
                  <div className="bg-white rounded-xl p-4 mb-4 border-2 border-primary-200">
                    <h3 className="text-sm font-bold text-gray-800 mb-3">Booking Estimate</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>Base Price ({quickBooking.duration}h):</span>
                        <span className="font-semibold">₹{estimate.basePrice.toLocaleString()}</span>
                      </div>
                      {estimate.amenitiesTotal > 0 && (
                        <div className="flex justify-between text-gray-600">
                          <span>Amenities & Services:</span>
                          <span className="font-semibold">₹{estimate.amenitiesTotal.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t-2 border-primary-300">
                        <span className="font-bold text-gray-800">Total Amount:</span>
                        <span className="text-xl font-bold text-primary-600">₹{estimate.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleBookNowClick}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white py-4 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all mb-4"
                >
                  Book Now
                </button>

                <div className="space-y-3 text-sm text-gray-700 bg-white/50 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary-500" />
                    <span className="font-medium">{venue.availability?.openingTime} - {venue.availability?.closingTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-500" />
                    <span className="font-medium">{venue.availability?.availableDays?.join(', ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary-500" />
                    <span className="font-medium">Capacity: {venue.capacity}</span>
                  </div>
                </div>
              </div>

              {/* Share */}
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-primary-500 text-primary-500 rounded-xl font-semibold hover:bg-primary-50 transition-colors">
                <Share2 className="w-5 h-5" />
                Share Venue
              </button>
            </div>
          </div>
        </div>
      </div>

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
