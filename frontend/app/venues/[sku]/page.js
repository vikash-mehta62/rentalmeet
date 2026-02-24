'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, MapPin, Users, Clock, Calendar,
  Wifi, Coffee, Utensils, CheckCircle2, ArrowLeft,
  Star, Phone, Mail, Share2, Image as ImageIcon, X,
  ChevronLeft, ChevronRight, Sparkles, Award, Shield
} from 'lucide-react';
import BookingForm from '@/components/booking/BookingForm';
import Navbar from '@/components/Navbar';

export default function VenueDetail() {
  const params = useParams();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [bookingFormOpen, setBookingFormOpen] = useState(false);

  useEffect(() => {
    if (params.sku) {
      fetchVenue();
    }
  }, [params.sku]);

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

            {/* Pricing */}
            {venue.pricing && (
              <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
                <h2 className="text-2xl font-bold text-dark-800 mb-4">Pricing</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Period</th>
                        <th className="text-left py-3 px-4">Weekday</th>
                        <th className="text-left py-3 px-4">Weekend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {venue.pricing.perHour && (
                        <tr>
                          <td className="py-3 px-4 font-medium">Per Hour</td>
                          <td className="py-3 px-4">₹{venue.pricing.perHour.weekday?.toLocaleString()}</td>
                          <td className="py-3 px-4">₹{venue.pricing.perHour.weekend?.toLocaleString()}</td>
                        </tr>
                      )}
                      {venue.pricing.halfDay && (
                        <tr>
                          <td className="py-3 px-4 font-medium">Half Day (4 hrs)</td>
                          <td className="py-3 px-4">₹{venue.pricing.halfDay.weekday?.toLocaleString()}</td>
                          <td className="py-3 px-4">₹{venue.pricing.halfDay.weekend?.toLocaleString()}</td>
                        </tr>
                      )}
                      {venue.pricing.fullDay && (
                        <tr>
                          <td className="py-3 px-4 font-medium">Full Day (8 hrs)</td>
                          <td className="py-3 px-4">₹{venue.pricing.fullDay.weekday?.toLocaleString()}</td>
                          <td className="py-3 px-4">₹{venue.pricing.fullDay.weekend?.toLocaleString()}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Amenities - Complete */}
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
              <h2 className="text-2xl font-bold text-dark-800 mb-6">Amenities & Facilities</h2>
              
              {/* Basic Amenities */}
              {venue.amenities?.basic?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-dark-700 mb-3 flex items-center gap-2">
                    <Wifi className="w-5 h-5 text-primary-500" />
                    Basic Amenities
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {venue.amenities.basic.filter(a => a.available).map((amenity, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-700">{amenity.name}</span>
                        </div>
                        {amenity.type === 'Paid' ? (
                          <span className="text-sm font-semibold text-orange-600">
                            ₹{amenity.rate}
                          </span>
                        ) : (
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                            Included
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Beverages */}
              {venue.amenities?.beverages?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-dark-700 mb-3 flex items-center gap-2">
                    <Coffee className="w-5 h-5 text-primary-500" />
                    Beverages Available
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {venue.amenities.beverages.filter(b => b.available && b.name).map((beverage, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{beverage.name}</span>
                        <span className="text-sm font-semibold text-primary-600">
                          ₹{beverage.ratePerUnit || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Food Options */}
              {venue.amenities?.refreshmentFood?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-dark-700 mb-3 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-primary-500" />
                    Refreshments & Snacks
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {venue.amenities.refreshmentFood.filter(f => f.available).map((food, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{food.name}</span>
                        <span className="text-sm font-semibold text-primary-600">
                          ₹{food.ratePerPlate}/plate
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Lunch Thalis */}
              {venue.amenities?.lunchThalis?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-dark-700 mb-3 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-primary-500" />
                    Lunch Thalis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {venue.amenities.lunchThalis.filter(t => t.available).map((thali, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{thali.type}</span>
                        <span className="text-sm font-semibold text-primary-600">
                          ₹{thali.ratePerPlate}/plate
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Kitchen & Dining */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

              {/* Additional Facilities */}
              {venue.amenities?.additional?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-dark-700 mb-3">Additional Facilities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {venue.amenities.additional.filter(a => a.available && a.name).map((facility, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-gray-700">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{facility.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Booking Card - Now opens inline booking */}
              <div className="bg-gradient-to-br from-primary-50 to-orange-50 rounded-2xl shadow-lg border-2 border-primary-200 p-6">
                <div className="text-center mb-6">
                  <p className="text-gray-600 mb-2 font-medium">Starting from</p>
                  <p className="text-4xl font-bold text-primary-600">
                    ₹{venue.pricing?.perHour?.weekday?.toLocaleString()}
                    <span className="text-lg text-gray-600">/hour</span>
                  </p>
                </div>

                <button 
                  onClick={() => setBookingFormOpen(true)}
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

              {/* Owner Contact */}
              {venue.ownerInfo && (
                <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-dark-800 mb-4">Contact Owner</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-5 h-5 text-primary-500" />
                      <span>{venue.ownerInfo.mobile}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-5 h-5 text-primary-500" />
                      <span>{venue.ownerInfo.email}</span>
                    </div>
                  </div>
                </div>
              )}

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
          onClose={() => setBookingFormOpen(false)} 
        />
      )}
    </div>
  );
}
