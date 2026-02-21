'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, MapPin, Users, IndianRupee, Clock, Calendar,
  Wifi, Car, Coffee, Utensils, CheckCircle2, ArrowLeft,
  Star, Phone, Mail, Share2, Image as ImageIcon, X,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import BookingForm from '@/components/booking/BookingForm';

export default function VenueDetail() {
  const params = useParams();
  const router = useRouter();
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
      const response = await fetch(`http://localhost:5000/api/venues/sku/${params.sku}`);
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
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 bg-gradient-orange rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold font-heading text-dark-700">
                Rental<span className="text-primary-500">Meet</span>
              </span>
            </Link>
            
            <Link href="/venues" className="flex items-center gap-2 text-dark-700 hover:text-primary-500 font-medium transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Back to Browse
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Image Section with Category Slider */}
      <div className="relative bg-gradient-to-br from-primary-100 to-primary-200">
        {/* Main Featured Image */}
        <div className="h-96 relative">
          {venue.images?.find(img => img.isFeatured)?.url || venue.images?.[0]?.url ? (
            <img
              src={venue.images.find(img => img.isFeatured)?.url || venue.images[0].url}
              alt={venue.businessName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="w-32 h-32 text-primary-500" />
            </div>
          )}
          
          {/* Status Badge */}
          <div className={`absolute top-6 left-6 px-4 py-2 rounded-full shadow-lg text-sm font-semibold ${
            venue.status === 'approved' ? 'bg-green-500 text-white' :
            venue.status === 'pending' ? 'bg-yellow-500 text-white' :
            'bg-red-500 text-white'
          }`}>
            {venue.status?.toUpperCase()}
          </div>

          {/* Image Count Badge */}
          {venue.images?.length > 0 && (
            <div className="absolute bottom-6 right-6 px-4 py-2 bg-black/70 text-white rounded-full text-sm font-semibold flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              {venue.images.length} Photos
            </div>
          )}
        </div>

        {/* Category-based Photo Thumbnails */}
        {venue.images?.length > 0 && (
          <div className="bg-white border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              {/* Category Tabs */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                      selectedCategory === category
                        ? 'bg-primary-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category}
                    {category !== 'All' && (
                      <span className="ml-2 text-xs opacity-75">
                        ({venue.images.filter(img => img.category === category).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Photo Grid */}
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {filteredImages.slice(0, 8).map((image, idx) => (
                  <div
                    key={idx}
                    onClick={() => openLightbox(idx)}
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                  >
                    <img
                      src={image.url}
                      alt={`${venue.businessName} - ${image.category}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        {image.category}
                      </span>
                    </div>
                  </div>
                ))}
                {filteredImages.length > 8 && (
                  <div
                    onClick={() => openLightbox(8)}
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer bg-gray-900 flex items-center justify-center"
                  >
                    <span className="text-white font-bold text-lg">
                      +{filteredImages.length - 8}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && filteredImages.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 p-2"
          >
            <X className="w-8 h-8" />
          </button>
          
          <button
            onClick={prevImage}
            className="absolute left-4 text-white hover:text-gray-300 p-2"
          >
            <ChevronLeft className="w-12 h-12" />
          </button>
          
          <div className="max-w-6xl max-h-[90vh] flex flex-col items-center">
            <img
              src={filteredImages[lightboxIndex]?.url}
              alt={`${venue.businessName} - ${filteredImages[lightboxIndex]?.category}`}
              className="max-w-full max-h-[80vh] object-contain"
            />
            <div className="mt-4 text-center">
              <p className="text-white text-lg font-semibold">
                {filteredImages[lightboxIndex]?.category}
              </p>
              <p className="text-gray-400 text-sm">
                {lightboxIndex + 1} / {filteredImages.length}
              </p>
            </div>
          </div>
          
          <button
            onClick={nextImage}
            className="absolute right-4 text-white hover:text-gray-300 p-2"
          >
            <ChevronRight className="w-12 h-12" />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Location */}
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
              <h1 className="text-3xl md:text-4xl font-bold text-dark-800 mb-4">
                {venue.businessName}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
                <span className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary-500" />
                  {venue.location?.city}, {venue.location?.area}
                </span>
                <span className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-500" />
                  Capacity: {venue.capacity}
                </span>
                {venue.rating > 0 && (
                  <span className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    {venue.rating} ({venue.reviewCount} reviews)
                  </span>
                )}
              </div>

              {/* Venue Types */}
              <div className="flex flex-wrap gap-2">
                {venue.venueType?.map((type, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-primary-50 text-primary-600 text-sm font-medium rounded-full"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
              <h2 className="text-2xl font-bold text-dark-800 mb-4">About This Venue</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
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
                    {venue.amenities.beverages.filter(b => b.available).map((beverage, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">{beverage.name}</span>
                        <span className="text-sm font-semibold text-primary-600">
                          ₹{beverage.ratePerUnit}
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
                    {venue.amenities.additional.filter(a => a.available).map((facility, idx) => (
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
              {/* Booking Card */}
              <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
                <div className="text-center mb-6">
                  <p className="text-gray-600 mb-2">Starting from</p>
                  <p className="text-4xl font-bold text-primary-500">
                    ₹{venue.pricing?.perHour?.weekday?.toLocaleString()}
                    <span className="text-lg text-gray-600">/hour</span>
                  </p>
                </div>

                <button 
                  onClick={() => setBookingFormOpen(true)}
                  className="w-full btn-primary py-4 text-lg font-semibold mb-4"
                >
                  Send Inquiry
                </button>

                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary-500" />
                    <span>{venue.availability?.openingTime} - {venue.availability?.closingTime}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-500" />
                    <span>{venue.availability?.availableDays?.join(', ')}</span>
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
