'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Building2, MapPin, Users, Calendar, Clock, 
  CheckCircle2, Coffee, Utensils, Wifi, X 
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import QuotationView from '@/components/booking/QuotationView';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const { token, user } = useAuthStore();
  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingData, setBookingData] = useState(null);
  const [termsConditions, setTermsConditions] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    eventType: '',
    guestCount: '',
    specialRequirements: '',
    acceptTerms: false
  });
  const [showQuotation, setShowQuotation] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    if (!token) {
      toast.error('Please login to book a venue');
      router.push(`/login?redirect=/booking/${params.sku}`);
      return;
    }

    // Fetch venue details
    fetchVenue();
    fetchTermsConditions();
    
    // Get booking data from localStorage
    const savedData = localStorage.getItem('bookingData');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setBookingData(parsed);
    }

    // Set user data
    if (user) {
      setFormData(prev => ({
        ...prev,
        customerName: user.name || '',
        customerEmail: user.email || '',
        customerPhone: user.phone || ''
      }));
    }
  }, [params.sku, token, user]);

  const fetchTermsConditions = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/terms-conditions/active`);
      const data = await response.json();
      
      if (data.success && data.terms) {
        setTermsConditions(data.terms);
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
    }
  };

  const fetchVenue = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues/sku/${params.sku}`);
      const data = await response.json();
      
      if (data.success) {
        setVenue(data.venue);
      } else {
        toast.error('Venue not found');
        router.push('/venues');
      }
    } catch (error) {
      console.error('Error fetching venue:', error);
      toast.error('Failed to load venue');
    } finally {
      setLoading(false);
    }
  };

  // Calculate pricing
  const calculatePrice = () => {
    if (!venue || !bookingData) return { basePrice: 0, amenitiesTotal: 0, total: 0 };

    const duration = parseInt(bookingData.duration);
    let basePrice = 0;

    // Calculate base price based on duration
    if (duration === 1 || duration === 2) {
      basePrice = (venue.pricing?.perHour?.weekday || 0) * duration;
    } else if (duration === 4) {
      basePrice = venue.pricing?.halfDay?.weekday || 0;
    } else if (duration === 8) {
      basePrice = venue.pricing?.fullDay?.weekday || 0;
    }

    // Calculate amenities total
    let amenitiesTotal = 0;
    
    // Basic amenities
    if (bookingData.selectedAmenities?.basic) {
      bookingData.selectedAmenities.basic.forEach(amenity => {
        if (amenity.type === 'Paid') {
          if (amenity.rateType === 'Per Use') {
            const qty = bookingData.quantities?.[`basic_${amenity.name}`] || 0;
            amenitiesTotal += (amenity.rate || 0) * qty;
          } else {
            amenitiesTotal += amenity.rate || 0;
          }
        }
      });
    }

    // Beverages
    if (bookingData.selectedAmenities?.beverages) {
      bookingData.selectedAmenities.beverages.forEach(beverage => {
        const qty = bookingData.quantities?.[`beverage_${beverage.name}`] || 0;
        amenitiesTotal += (beverage.ratePerUnit || 0) * qty;
      });
    }

    // Refreshment Food
    if (bookingData.selectedAmenities?.refreshmentFood) {
      bookingData.selectedAmenities.refreshmentFood.forEach(food => {
        const qty = bookingData.quantities?.[`food_${food.name}`] || 0;
        amenitiesTotal += (food.ratePerPlate || 0) * qty;
      });
    }

    // Lunch Thalis
    if (bookingData.selectedAmenities?.lunchThalis) {
      bookingData.selectedAmenities.lunchThalis.forEach(thali => {
        const qty = bookingData.quantities?.[`thali_${thali.type}`] || 0;
        amenitiesTotal += (thali.ratePerPlate || 0) * qty;
      });
    }

    const total = basePrice + amenitiesTotal;

    return { basePrice, amenitiesTotal, total };
  };

  const pricing = calculatePrice();

  const handleGenerateQuotation = (e) => {
    e.preventDefault();
    
    if (!formData.acceptTerms) {
      toast.error('Please accept terms and conditions');
      return;
    }

    if (!formData.eventType || !formData.guestCount) {
      toast.error('Please fill all required fields');
      return;
    }

    setShowQuotation(true);
    toast.success('Quotation generated successfully!');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.acceptTerms) {
      toast.error('Please accept terms and conditions');
      return;
    }

    // Here you would submit the booking
    toast.success('Booking submitted successfully!');
    localStorage.removeItem('bookingData');
    router.push('/customer/bookings');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-700 mb-2">Venue Not Found</h2>
          <Link href="/venues" className="btn-primary inline-flex items-center gap-2 mt-4">
            <ArrowLeft className="w-5 h-5" />
            Back to Venues
          </Link>
        </div>
      </div>
    );
  }

  const getDurationLabel = (duration) => {
    const d = parseInt(duration);
    if (d === 8) return 'Full Day (8 hours)';
    if (d === 4) return '4 Hours (Half Day)';
    return `${d} Hour${d > 1 ? 's' : ''}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Back Link */}
      <div className="bg-white border-b border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href={`/venues/${params.sku}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to venue details</span>
          </Link>
        </div>
      </div>

      {/* Booking Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Complete Your Booking</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Venue Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Venue Details</h2>
              <div className="flex items-start gap-4">
                {venue.images?.[0]?.url && (
                  <img
                    src={venue.images[0].url}
                    alt={venue.businessName}
                    className="w-32 h-32 rounded-lg object-cover flex-shrink-0"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{venue.businessName}</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary-500" />
                      {venue.location?.city}, {venue.location?.area}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary-500" />
                      Up to {venue.capacity} guests
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary-500" />
                      {venue.availability?.openingTime} - {venue.availability?.closingTime}
                    </div>
                  </div>
                  
                  {/* Venue Types */}
                  {venue.venueType?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-gray-600 mb-2">VENUE TYPES</p>
                      <div className="flex flex-wrap gap-2">
                        {venue.venueType.map((type, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full border border-primary-200"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Booking Details */}
            {bookingData && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Date</p>
                    <p className="font-semibold text-gray-900">
                      {bookingData.date ? new Date(bookingData.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }) : 'Not selected'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Start Time</p>
                    <p className="font-semibold text-gray-900">{bookingData.startTime || 'Not selected'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Duration</p>
                    <p className="font-semibold text-gray-900">{getDurationLabel(bookingData.duration)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Amenities */}
            {bookingData?.selectedAmenities && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Selected Amenities & Services</h2>
                
                {/* Basic Amenities */}
                {bookingData.selectedAmenities.basic?.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-primary-500" />
                      Basic Amenities
                    </h3>
                    <div className="space-y-2">
                      {bookingData.selectedAmenities.basic.map((amenity, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span className="text-gray-700">{amenity.name}</span>
                          <span className="font-semibold text-gray-900">
                            {amenity.type === 'Free' || amenity.type === 'Included' ? (
                              <span className="text-green-600">Free</span>
                            ) : (
                              `₹${(amenity.rate * (bookingData.quantities?.[`basic_${amenity.name}`] || 1)).toLocaleString()}`
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Beverages */}
                {bookingData.selectedAmenities.beverages?.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-primary-500" />
                      Beverages
                    </h3>
                    <div className="space-y-2">
                      {bookingData.selectedAmenities.beverages.map((beverage, idx) => {
                        const qty = bookingData.quantities?.[`beverage_${beverage.name}`] || 0;
                        return (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">{beverage.name} × {qty}</span>
                            <span className="font-semibold text-gray-900">
                              ₹{((beverage.ratePerUnit || 0) * qty).toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Refreshment Food */}
                {bookingData.selectedAmenities.refreshmentFood?.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-primary-500" />
                      Refreshments & Snacks
                    </h3>
                    <div className="space-y-2">
                      {bookingData.selectedAmenities.refreshmentFood.map((food, idx) => {
                        const qty = bookingData.quantities?.[`food_${food.name}`] || 0;
                        return (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">{food.name} × {qty}</span>
                            <span className="font-semibold text-gray-900">
                              ₹{((food.ratePerPlate || 0) * qty).toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Lunch Thalis */}
                {bookingData.selectedAmenities.lunchThalis?.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <Utensils className="w-4 h-4 text-primary-500" />
                      Lunch Thalis
                    </h3>
                    <div className="space-y-2">
                      {bookingData.selectedAmenities.lunchThalis.map((thali, idx) => {
                        const qty = bookingData.quantities?.[`thali_${thali.type}`] || 0;
                        return (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">{thali.type} × {qty}</span>
                            <span className="font-semibold text-gray-900">
                              ₹{((thali.ratePerPlate || 0) * qty).toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Customer Details Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Your Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Event Type *</label>
                  <select
                    required
                    value={formData.eventType}
                    onChange={(e) => setFormData({...formData, eventType: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select event type</option>
                    <option value="Corporate Meeting">Corporate Meeting</option>
                    <option value="Conference">Conference</option>
                    <option value="Training/Workshop">Training/Workshop</option>
                    <option value="Seminar">Seminar</option>
                    <option value="Product Launch">Product Launch</option>
                    <option value="Team Building">Team Building</option>
                    <option value="Birthday Party">Birthday Party</option>
                    <option value="Wedding">Wedding</option>
                    <option value="Anniversary">Anniversary</option>
                    <option value="Reception">Reception</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Guests *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={venue.capacity}
                    value={formData.guestCount}
                    onChange={(e) => setFormData({...formData, guestCount: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Special Requirements</label>
                <textarea
                  rows="3"
                  value={formData.specialRequirements}
                  onChange={(e) => setFormData({...formData, specialRequirements: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Any special requests or requirements..."
                />
              </div>

              <div className="mb-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Terms & Conditions</h3>
                  <div className="space-y-2 text-sm text-gray-700 max-h-48 overflow-y-auto">
                    {termsConditions ? (
                      <div dangerouslySetInnerHTML={{ __html: termsConditions.content.replace(/\n/g, '<br/>') }} />
                    ) : (
                      <>
                        <p className="font-semibold">Booking Policy:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Advance booking required with confirmation</li>
                          <li>Full payment or advance payment as per venue policy</li>
                          <li>Booking confirmation subject to availability</li>
                        </ul>
                        
                        <p className="font-semibold mt-3">Cancellation Policy:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Cancellation 7+ days before: 100% refund</li>
                          <li>Cancellation 3-7 days before: 50% refund</li>
                          <li>Cancellation less than 3 days: No refund</li>
                        </ul>
                        
                        <p className="font-semibold mt-3">General Terms:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Venue capacity must not be exceeded</li>
                          <li>Damage to property will be charged</li>
                          <li>Follow venue rules and regulations</li>
                          <li>Management reserves the right to cancel booking</li>
                        </ul>
                      </>
                    )}
                  </div>
                </div>
                
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) => setFormData({...formData, acceptTerms: e.target.checked})}
                    className="mt-1"
                  />
                  <span className="text-sm text-gray-700">
                    I have read and accept the terms and conditions, cancellation policy, and booking policies mentioned above
                  </span>
                </label>
              </div>

              <div className="flex gap-4">
                <Link
                  href={`/venues/${params.sku}`}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-center"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={handleGenerateQuotation}
                  className="flex-1 px-6 py-3 border-2 border-primary-500 text-primary-500 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
                >
                  Generate Quotation
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>

          {/* Right Column - Price Summary (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 bg-white rounded-xl shadow-xl p-6 border-2 border-primary-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Price Summary</h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Base Price ({getDurationLabel(bookingData?.duration || '2')})</span>
                  <span className="font-semibold text-gray-900">₹{pricing.basePrice.toLocaleString()}</span>
                </div>
                
                {pricing.amenitiesTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Amenities & Services</span>
                    <span className="font-semibold text-gray-900">₹{pricing.amenitiesTotal.toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="border-t-2 border-gray-200 pt-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total Amount</span>
                  <span className="text-3xl font-bold text-primary-600">₹{pricing.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-primary-50 rounded-lg p-4 text-sm text-gray-700">
                <p className="font-semibold mb-2">Note:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Final price may vary based on actual requirements</li>
                  <li>• Payment terms will be shared after confirmation</li>
                  <li>• Cancellation policy applies</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quotation Modal */}
      {showQuotation && (
        <QuotationView
          venue={venue}
          bookingData={{
            ...bookingData,
            customerName: formData.customerName,
            customerEmail: formData.customerEmail,
            customerPhone: formData.customerPhone,
            eventType: formData.eventType,
            guestCount: formData.guestCount,
            specialRequirements: formData.specialRequirements
          }}
          pricing={pricing}
          onClose={() => setShowQuotation(false)}
        />
      )}
    </div>
  );
}
