'use client';

import { useRef } from 'react';
import { Printer, Download, X, Mail, Phone, MapPin, Calendar, Clock, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function QuotationView({ 
  venue, 
  formData, 
  selectedAmenities, 
  quantities, 
  calculatedPrice, 
  onClose, 
  onConfirm 
}) {
  
  const quotationRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      const element = quotationRef.current;
      if (!element) return;

      // Show loading toast
      const loadingToast = document.createElement('div');
      loadingToast.className = 'fixed top-4 right-4 bg-primary-500 text-white px-6 py-3 rounded-lg shadow-lg z-[200]';
      loadingToast.textContent = 'Generating PDF...';
      document.body.appendChild(loadingToast);

      // Temporarily remove scroll and set full height for capture
      const originalOverflow = element.style.overflow;
      const originalMaxHeight = element.style.maxHeight;
      element.style.overflow = 'visible';
      element.style.maxHeight = 'none';

      // Wait for layout to settle
      await new Promise(resolve => setTimeout(resolve, 100));

      // Capture the element as canvas with better quality
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      // Restore original styles
      element.style.overflow = originalOverflow;
      element.style.maxHeight = originalMaxHeight;

      // PDF dimensions (A4)
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Canvas dimensions
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      // Convert canvas to image
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate how many pages needed
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      
      // Add additional pages if content is longer
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      // Generate filename
      const quotationNumber = `QT-${Date.now().toString().slice(-8)}`;
      const filename = `RentalMeet_Quotation_${quotationNumber}.pdf`;
      
      // Download PDF
      pdf.save(filename);

      // Remove loading toast
      document.body.removeChild(loadingToast);

      // Show success toast
      const successToast = document.createElement('div');
      successToast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[200]';
      successToast.textContent = 'PDF Downloaded Successfully!';
      document.body.appendChild(successToast);
      setTimeout(() => document.body.removeChild(successToast), 3000);

    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const quotationNumber = `QT-${Date.now().toString().slice(-8)}`;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        
        {/* Header - Print Hidden */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b bg-gradient-to-r from-primary-50 to-orange-50 print:hidden">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Booking Quotation</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 md:px-4 py-2 bg-primary-500 text-white rounded-lg flex items-center gap-2 hover:bg-primary-600 transition-all text-sm md:text-base"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden md:inline">Print</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-3 md:px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2 hover:bg-green-600 transition-all text-sm md:text-base"
            >
              <Download className="w-4 h-4" />
              <span className="hidden md:inline">PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>

        {/* Quotation Content - Scrollable */}
        <div ref={quotationRef} className="flex-1 overflow-y-auto p-6 md:p-8 bg-white">
          
          {/* Company Header */}
          <div className="text-center mb-8 pb-6 border-b-2 border-primary-500">
            <h1 className="text-3xl md:text-4xl font-black text-primary-600 mb-2">RentalMeet</h1>
            <p className="text-gray-600 text-sm md:text-base font-medium">Venue Booking Platform</p>
            <p className="text-gray-500 text-xs md:text-sm mt-1">
              Email: bookings@rentalmeet.com | Phone: +91 98765 43210
            </p>
          </div>

          {/* Quotation Info */}
          <div className="grid grid-cols-2 gap-4 mb-8 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Quotation No.</p>
              <p className="text-sm md:text-base font-bold text-gray-900">{quotationNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-semibold uppercase">Date</p>
              <p className="text-sm md:text-base font-bold text-gray-900">{formatDate(new Date())}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase">Valid Until</p>
              <p className="text-sm md:text-base font-bold text-gray-900">
                {formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-semibold uppercase">Status</p>
              <p className="text-sm md:text-base font-bold text-orange-600">DRAFT</p>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            
            {/* Venue Details */}
            <div className="bg-blue-50 p-5 rounded-xl border-l-4 border-blue-500">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Venue Details
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Venue:</span>
                  <p className="text-gray-900">{venue.businessName}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Location:</span>
                  <p className="text-gray-900">{venue.location?.city}, {venue.location?.area}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Address:</span>
                  <p className="text-gray-900">{venue.location?.address}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Capacity:</span>
                  <p className="text-gray-900">{venue.capacity}</p>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-green-50 p-5 rounded-xl border-l-4 border-green-500">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Customer Details
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Name:</span>
                  <p className="text-gray-900">{formData.customerName}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Email:</span>
                  <p className="text-gray-900">{formData.customerEmail}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Phone:</span>
                  <p className="text-gray-900">{formData.customerPhone}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Event Type:</span>
                  <p className="text-gray-900">{formData.eventType}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Guest Count:</span>
                  <p className="text-gray-900">{formData.guestCount} persons</p>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-purple-50 p-5 rounded-xl border-l-4 border-purple-500 mb-8">
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Booking Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-700 block">Date:</span>
                <p className="text-gray-900">{formatDate(formData.bookingDate)}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700 block">Time:</span>
                <p className="text-gray-900">{formData.startTime} - {formData.endTime}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700 block">Type:</span>
                <p className="text-gray-900 capitalize">{formData.bookingType}</p>
              </div>
              <div>
                <span className="font-semibold text-gray-700 block">Day Type:</span>
                <p className="text-gray-900">{formData.isWeekend ? 'Weekend' : 'Weekday'}</p>
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="mb-8">
            <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4 pb-2 border-b-2">
              Price Breakdown
            </h3>

            {/* Base Price */}
            <div className="bg-white border-2 border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <p className="font-bold text-gray-900">Venue Rental</p>
                  <p className="text-xs text-gray-500">
                    {formData.bookingType === 'hourly' ? 'Per Hour' : 
                     formData.bookingType === 'halfday' ? 'Half Day (4 hours)' : 
                     'Full Day (8 hours)'} • {formData.isWeekend ? 'Weekend Rate' : 'Weekday Rate'}
                  </p>
                </div>
                <p className="text-xl font-black text-gray-900">
                  ₹{calculatedPrice.basePrice.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* Amenities & Services */}
            {calculatedPrice.amenitiesTotal > 0 && (
              <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4 mb-4">
                <h4 className="font-bold text-gray-900 mb-3 text-base">Selected Amenities & Services</h4>
                
                {/* Basic Amenities */}
                {selectedAmenities.basic.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Basic Amenities:</p>
                    <div className="space-y-1">
                      {selectedAmenities.basic.map((amenity, idx) => (
                        <div key={idx} className="flex justify-between text-sm pl-4">
                          <span className="text-gray-700">• {amenity.name}</span>
                          <span className="font-semibold text-gray-900">
                            {amenity.type === 'Paid' ? `₹${amenity.rate.toLocaleString('en-IN')}` : 'Included'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Beverages */}
                {selectedAmenities.beverages.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Beverages:</p>
                    <div className="space-y-1">
                      {selectedAmenities.beverages.map((beverage, idx) => {
                        const qty = beverage.quantity || 0;
                        const total = beverage.total || ((beverage.ratePerUnit || 0) * qty);
                        return (
                          <div key={idx} className="flex justify-between text-sm pl-4">
                            <span className="text-gray-700">
                              • {beverage.name} 
                              <span className="text-xs text-gray-500"> (₹{beverage.ratePerUnit} × {qty} persons)</span>
                            </span>
                            <span className="font-semibold text-gray-900">₹{total.toLocaleString('en-IN')}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Refreshments */}
                {selectedAmenities.refreshmentFood.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Refreshments & Snacks:</p>
                    <div className="space-y-1">
                      {selectedAmenities.refreshmentFood.map((food, idx) => {
                        const qty = food.quantity || 0;
                        const total = food.total || ((food.ratePerPlate || 0) * qty);
                        return (
                          <div key={idx} className="flex justify-between text-sm pl-4">
                            <span className="text-gray-700">
                              • {food.name}
                              <span className="text-xs text-gray-500"> (₹{food.ratePerPlate} × {qty} plates)</span>
                            </span>
                            <span className="font-semibold text-gray-900">₹{total.toLocaleString('en-IN')}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Lunch Thalis */}
                {selectedAmenities.lunchThalis.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Lunch Thalis:</p>
                    <div className="space-y-1">
                      {selectedAmenities.lunchThalis.map((thali, idx) => {
                        // Use quantity from thali object directly (already calculated in booking data)
                        const qty = thali.quantity || 0;
                        const total = thali.total || ((thali.ratePerPlate || 0) * qty);
                        return (
                          <div key={idx} className="flex justify-between text-sm pl-4">
                            <span className="text-gray-700">
                              • {thali.thaliType} - {thali.category}
                              <span className="text-xs text-gray-500"> (₹{thali.ratePerPlate} × {qty} plates)</span>
                            </span>
                            <span className="font-semibold text-gray-900">₹{total.toLocaleString('en-IN')}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Additional Facilities */}
                {selectedAmenities.additional.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Additional Facilities:</p>
                    <div className="space-y-1">
                      {selectedAmenities.additional.map((facility, idx) => (
                        <div key={idx} className="flex justify-between text-sm pl-4">
                          <span className="text-gray-700">• {facility.name}</span>
                          <span className="font-semibold text-gray-900">
                            {facility.type === 'Paid' ? `₹${facility.charges.toLocaleString('en-IN')}` : 'Included'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-3 mt-3 border-t-2 border-orange-300">
                  <span className="font-bold text-gray-900">Amenities Total:</span>
                  <span className="font-black text-gray-900 text-lg">
                    ₹{calculatedPrice.amenitiesTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-gradient-to-br from-primary-50 to-orange-50 border-2 border-primary-300 rounded-lg p-5">
              <div className="space-y-3">
                <div className="flex justify-between text-base">
                  <span className="font-semibold text-gray-700">Subtotal:</span>
                  <span className="font-bold text-gray-900">₹{calculatedPrice.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-3 border-t-2 border-primary-400">
                  <span className="text-xl font-black text-gray-900">Grand Total:</span>
                  <span className="text-2xl md:text-3xl font-black text-primary-600">
                    ₹{calculatedPrice.total.toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-xs text-gray-600 text-center pt-2">
                  Amount in Indian Rupees (INR)
                </p>
              </div>
            </div>
          </div>

          {/* Special Requirements */}
          {formData.specialRequirements && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg mb-8">
              <h4 className="font-bold text-gray-900 mb-2">Special Requirements:</h4>
              <p className="text-sm text-gray-700">{formData.specialRequirements}</p>
            </div>
          )}

          {/* Terms & Conditions */}
          <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-5 mb-8">
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3">Terms & Conditions:</h3>
            <ul className="space-y-2 text-xs md:text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold">•</span>
                <span>This quotation is valid for 7 days from the date of issue.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold">•</span>
                <span>This is a booking request and not a confirmed booking. Final confirmation subject to venue owner approval.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold">•</span>
                <span>Payment to be made after venue owner confirmation through RentalMeet platform.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold">•</span>
                <span>Cancellation policy: Full refund if cancelled 48 hours before booking date, 50% refund if cancelled 24 hours before, no refund for same-day cancellations.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold">•</span>
                <span>Customer is responsible for any damages to the venue property during the event.</span>
              </li>
            </ul>
          </div>

          {/* Footer */}
          <div className="text-center pt-6 border-t-2 border-gray-300">
            <p className="text-sm font-semibold text-gray-900 mb-2">Thank you for choosing RentalMeet!</p>
            <p className="text-xs text-gray-600 mb-1">For any queries or support:</p>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3" /> support@rentalmeet.com
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" /> +91 98765 43210
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              © {new Date().getFullYear()} RentalMeet. All rights reserved.
            </p>
          </div>
        </div>

        {/* Action Buttons - Print Hidden */}
        <div className="border-t bg-gray-50 p-4 md:p-6 flex flex-col sm:flex-row gap-3 print:hidden">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-bold hover:bg-gray-100 transition-colors text-sm md:text-base"
          >
            Back to Edit
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-6 py-3 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 shadow-lg transition-all text-sm md:text-base"
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
}

