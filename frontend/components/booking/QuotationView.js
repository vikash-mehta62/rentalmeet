'use client';

import { useRef, useState, useEffect } from 'react';
import { Printer, Download, X, Mail, Phone, MapPin, Calendar, Users } from 'lucide-react';
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
  const [platformSettings, setPlatformSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/platform-settings`);
        const data = await response.json();
        if (data.success) {
          setPlatformSettings(data.settings);
        }
      } catch (error) {
        console.error('Error fetching platform settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const calculateVenueInvoice = () => {
    const baseAmount = calculatedPrice.basePrice + calculatedPrice.amenitiesTotal;
    const venueCGST = platformSettings ? (baseAmount * (platformSettings.venueCGST || 0)) / 100 : 0;
    const venueSGST = platformSettings ? (baseAmount * (platformSettings.venueSGST || 0)) / 100 : 0;
    const total = baseAmount + venueCGST + venueSGST;
    
    return {
      baseAmount,
      cgst: venueCGST,
      sgst: venueSGST,
      cgstRate: platformSettings?.venueCGST || 0,
      sgstRate: platformSettings?.venueSGST || 0,
      total
    };
  };

  const calculatePlatformInvoice = () => {
    const baseAmount = calculatedPrice.basePrice + calculatedPrice.amenitiesTotal;
    const platformFee = platformSettings ? (baseAmount * (platformSettings.platformFeePercentage || 0)) / 100 : 0;
    const platformCGST = platformSettings ? (platformFee * (platformSettings.platformCGST || 0)) / 100 : 0;
    const platformSGST = platformSettings ? (platformFee * (platformSettings.platformSGST || 0)) / 100 : 0;
    const total = platformFee + platformCGST + platformSGST;
    
    return {
      platformFee,
      cgst: platformCGST,
      sgst: platformSGST,
      cgstRate: platformSettings?.platformCGST || 0,
      sgstRate: platformSettings?.platformSGST || 0,
      feePercentage: platformSettings?.platformFeePercentage || 0,
      total
    };
  };

  const venueInvoice = calculateVenueInvoice();
  const platformInvoice = calculatePlatformInvoice();
  const grandTotal = venueInvoice.total + platformInvoice.total;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      const element = quotationRef.current;
      if (!element) return;

      const loadingToast = document.createElement('div');
      loadingToast.className = 'fixed top-4 right-4 bg-primary-500 text-white px-6 py-3 rounded-lg shadow-lg z-[200]';
      loadingToast.textContent = 'Generating PDF...';
      document.body.appendChild(loadingToast);

      const originalOverflow = element.style.overflow;
      const originalMaxHeight = element.style.maxHeight;
      element.style.overflow = 'visible';
      element.style.maxHeight = 'none';

      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      element.style.overflow = originalOverflow;
      element.style.maxHeight = originalMaxHeight;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      const imgData = canvas.toDataURL('image/png');
      
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      const quotationNumber = `QT-${Date.now().toString().slice(-8)}`;
      const filename = `RentalMeet_Quotation_${quotationNumber}.pdf`;
      
      pdf.save(filename);

      document.body.removeChild(loadingToast);

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

        <div ref={quotationRef} className="flex-1 overflow-y-auto p-6 md:p-8 bg-white">
          
          <div className="text-center mb-8 pb-6 border-b-2 border-primary-500">
            <h1 className="text-3xl md:text-4xl font-black text-primary-600 mb-2">RentalMeet</h1>
            <p className="text-gray-600 text-sm md:text-base font-medium">Venue Booking Platform</p>
            <p className="text-gray-500 text-xs md:text-sm mt-1">
              Email: bookings@rentalmeet.com | Phone: +91 98765 43210
            </p>
          </div>

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

          <div className="grid md:grid-cols-2 gap-6 mb-8">
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

          <div className="mb-8 border-4 border-blue-300 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-blue-400">
              <h3 className="text-xl md:text-2xl font-black text-blue-900">
                📄 INVOICE 1: VENUE RENTAL
              </h3>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-semibold">Invoice No.</p>
                <p className="text-sm font-bold text-blue-900">{quotationNumber}-V</p>
              </div>
            </div>

            <div className="bg-white border-2 border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-900">Venue Rental Charges</p>
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

            {(calculatedPrice.amenitiesTotal > 0 || selectedAmenities.basic.length > 0) && (
              <div className="bg-white border-2 border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-bold text-gray-900 mb-3 text-base">Amenities & Services</h4>
                
                {selectedAmenities.basic.length > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 font-semibold">Basic Amenities (Included):</span>
                      <span className="font-semibold text-gray-900">₹0</span>
                    </div>
                  </div>
                )}

                {selectedAmenities.beverages.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Beverages:</p>
                    <div className="space-y-1">
                      {selectedAmenities.beverages.map((beverage, idx) => {
                        const qty = beverage.quantity || 0;
                        const rate = beverage.ratePerUnit || 0;
                        const total = beverage.total || (rate * qty);
                        return (
                          <div key={idx} className="flex justify-between text-sm pl-4">
                            <span className="text-gray-700">
                              • {beverage.name}
                              {rate > 0 && <span className="text-xs text-gray-500"> (₹{rate} × {qty} persons)</span>}
                            </span>
                            <span className="font-semibold text-gray-900">
                              {rate > 0 ? `₹${total.toLocaleString('en-IN')}` : '₹0'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedAmenities.refreshmentFood.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Refreshments & Snacks:</p>
                    <div className="space-y-1">
                      {selectedAmenities.refreshmentFood.map((food, idx) => {
                        const qty = food.quantity || 0;
                        const rate = food.ratePerPlate || 0;
                        const total = food.total || (rate * qty);
                        return (
                          <div key={idx} className="flex justify-between text-sm pl-4">
                            <span className="text-gray-700">
                              • {food.name}
                              {rate > 0 && <span className="text-xs text-gray-500"> (₹{rate} × {qty} plates)</span>}
                            </span>
                            <span className="font-semibold text-gray-900">
                              {rate > 0 ? `₹${total.toLocaleString('en-IN')}` : '₹0'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedAmenities.lunchThalis.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Lunch Thalis:</p>
                    <div className="space-y-1">
                      {selectedAmenities.lunchThalis.map((thali, idx) => {
                        const qty = thali.quantity || 0;
                        const rate = thali.ratePerPlate || 0;
                        const total = thali.total || (rate * qty);
                        return (
                          <div key={idx} className="flex justify-between text-sm pl-4">
                            <span className="text-gray-700">
                              • {thali.thaliType} - {thali.category}
                              {rate > 0 && <span className="text-xs text-gray-500"> (₹{rate} × {qty} plates)</span>}
                            </span>
                            <span className="font-semibold text-gray-900">
                              {rate > 0 ? `₹${total.toLocaleString('en-IN')}` : '₹0'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedAmenities.additional.length > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 font-semibold">Additional Facilities (Included):</span>
                      <span className="font-semibold text-gray-900">₹0</span>
                    </div>
                  </div>
                )}

                {calculatedPrice.amenitiesTotal > 0 && (
                  <div className="flex justify-between pt-3 mt-3 border-t-2 border-gray-300">
                    <span className="font-bold text-gray-900">Amenities Subtotal:</span>
                    <span className="font-black text-gray-900 text-lg">
                      ₹{calculatedPrice.amenitiesTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="bg-gradient-to-br from-blue-100 to-blue-50 border-2 border-blue-400 rounded-lg p-5">
              <div className="space-y-3">
                <div className="flex justify-between text-base">
                  <span className="font-semibold text-gray-700">Subtotal (Rental + Amenities):</span>
                  <span className="font-bold text-gray-900">₹{venueInvoice.baseAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">CGST ({venueInvoice.cgstRate}%):</span>
                  <span className="font-semibold text-blue-700">₹{venueInvoice.cgst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">SGST ({venueInvoice.sgstRate}%):</span>
                  <span className="font-semibold text-blue-700">₹{venueInvoice.sgst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-3 border-t-2 border-blue-500">
                  <span className="text-xl font-black text-blue-900">Venue Invoice Total:</span>
                  <span className="text-2xl md:text-3xl font-black text-blue-900">
                    ₹{venueInvoice.total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {platformSettings?.gstInvoiceSignature && (
              <div className="mt-6 pt-6 border-t-2 border-blue-300">
                <div className="flex justify-end">
                  <div className="text-center">
                    <img 
                      src={platformSettings.gstInvoiceSignature} 
                      alt="Authorized Signature" 
                      className="h-16 mb-2 mx-auto"
                    />
                    <p className="text-xs text-gray-600 font-semibold border-t border-gray-400 pt-1">
                      Authorized Signature
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mb-8 border-4 border-purple-300 rounded-xl p-6 bg-gradient-to-br from-purple-50 to-white">
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-purple-400">
              <h3 className="text-xl md:text-2xl font-black text-purple-900">
                📄 INVOICE 2: PLATFORM FEE
              </h3>
              <div className="text-right">
                <p className="text-xs text-gray-500 font-semibold">Invoice No.</p>
                <p className="text-sm font-bold text-purple-900">{quotationNumber}-P</p>
              </div>
            </div>

            <div className="bg-white border-2 border-purple-200 rounded-lg p-4 mb-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-700">Base Amount (Rental + Amenities):</span>
                  <span className="font-semibold text-gray-900">₹{venueInvoice.baseAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-900">Platform Service Fee</p>
                    <p className="text-xs text-gray-500">{platformInvoice.feePercentage}% of base amount</p>
                  </div>
                  <p className="text-xl font-black text-gray-900">
                    ₹{platformInvoice.platformFee.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-100 to-purple-50 border-2 border-purple-400 rounded-lg p-5">
              <div className="space-y-3">
                <div className="flex justify-between text-base">
                  <span className="font-semibold text-gray-700">Platform Fee:</span>
                  <span className="font-bold text-gray-900">₹{platformInvoice.platformFee.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">CGST ({platformInvoice.cgstRate}%):</span>
                  <span className="font-semibold text-purple-700">₹{platformInvoice.cgst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">SGST ({platformInvoice.sgstRate}%):</span>
                  <span className="font-semibold text-purple-700">₹{platformInvoice.sgst.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-3 border-t-2 border-purple-500">
                  <span className="text-xl font-black text-purple-900">Platform Invoice Total:</span>
                  <span className="text-2xl md:text-3xl font-black text-purple-900">
                    ₹{platformInvoice.total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {platformSettings?.platformInvoiceSignature && (
              <div className="mt-6 pt-6 border-t-2 border-purple-300">
                <div className="flex justify-end">
                  <div className="text-center">
                    <img 
                      src={platformSettings.platformInvoiceSignature} 
                      alt="Authorized Signature" 
                      className="h-16 mb-2 mx-auto"
                    />
                    <p className="text-xs text-gray-600 font-semibold border-t border-gray-400 pt-1">
                      Authorized Signature
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mb-8 bg-gradient-to-br from-green-50 to-green-100 border-4 border-green-400 rounded-xl p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Amount Payable</p>
                <p className="text-2xl md:text-3xl font-black text-green-900">GRAND TOTAL</p>
              </div>
              <div className="text-right">
                <p className="text-4xl md:text-5xl font-black text-green-900">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  (Venue: ₹{venueInvoice.total.toLocaleString('en-IN')} + Platform: ₹{platformInvoice.total.toLocaleString('en-IN')})
                </p>
              </div>
            </div>
          </div>

          {formData.specialRequirements && (
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg mb-8">
              <h4 className="font-bold text-gray-900 mb-2">Special Requirements:</h4>
              <p className="text-sm text-gray-700">{formData.specialRequirements}</p>
            </div>
          )}

          <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-5 mb-8">
            <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3">Terms & Conditions:</h3>
            <ul className="space-y-2 text-xs md:text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold">•</span>
                <span>This quotation is valid for 7 days from the date of issue.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 font-bold">•</span>
                <span>Two separate invoices will be generated: Venue Invoice and Platform Invoice.</span>
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
