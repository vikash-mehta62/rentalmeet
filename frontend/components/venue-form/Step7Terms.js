'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useVenueFormStore, useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function Step7Terms() {
  const router = useRouter();
  const { formData, setStep, resetForm } = useVenueFormStore();
  const { token } = useAuthStore();
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!accepted) {
      toast.error('Please accept terms and conditions');
      return;
    }

    if (!token) {
      toast.error('Please login first');
      router.push('/login');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const isEditMode = formData.isEditMode && formData.venueId;
      
      // Prepare venue data from all steps (without images for now)
      const venueData = {
        // Step 1: Basic Info
        businessName: formData.basicInfo?.businessName || '',
        venueType: formData.basicInfo?.venueType || [],
        description: formData.basicInfo?.description || '',
        capacity: formData.basicInfo?.capacity || '',
        areaSqft: Number(formData.basicInfo?.areaSqft) || 0,
        
        // Step 2: Location
        location: {
          address: formData.location?.address || '',
          landmark: formData.location?.landmark || '',
          state: formData.location?.state || '',
          city: formData.location?.city || '',
          village: formData.location?.village || '',
          area: formData.location?.area || '',
          pincode: formData.location?.pincode || '',
          googleMapLink: formData.location?.googleMapLink || '',
          parkingAvailability: formData.location?.parkingAvailability || 'None',
          nearestBusAuto: formData.location?.nearestBusAuto || '',
          nearestMetroTrain: formData.location?.nearestMetroTrain || ''
        },
        
        // Step 3: Amenities
        amenities: {
          basic: formData.amenities?.basic || [],
          beverages: formData.amenities?.beverages || [],
          refreshmentFood: formData.amenities?.refreshmentFood || [],
          lunchThalis: formData.amenities?.lunchThalis || [],
          kitchenAccess: formData.amenities?.kitchenAccess || { available: false },
          diningArea: formData.amenities?.diningArea || { available: false },
          additional: formData.amenities?.additional || []
        },
        
        // Step 4: Pricing & Availability
        pricing: {
          enabledOptions: formData.pricing?.enabledOptions || { perHour: true, halfDay: false, fullDay: false },
          perHour: {
            weekday: Number(formData.pricing?.perHour?.weekday) || 0,
            weekend: Number(formData.pricing?.perHour?.weekend) || 0
          },
          halfDay: {
            weekday: Number(formData.pricing?.halfDay?.weekday) || 0,
            weekend: Number(formData.pricing?.halfDay?.weekend) || 0
          },
          fullDay: {
            weekday: Number(formData.pricing?.fullDay?.weekday) || 0,
            weekend: Number(formData.pricing?.fullDay?.weekend) || 0
          },
          extraHourRate: {
            weekday: Number(formData.pricing?.extraHourRate?.weekday) || 0,
            weekend: Number(formData.pricing?.extraHourRate?.weekend) || 0
          }
        },
        availability: {
          openingTime: formData.pricing?.openingTime || '09:00',
          closingTime: formData.pricing?.closingTime || '18:00',
          availableDays: formData.pricing?.availableDays || [],
          advanceBookingRule: formData.pricing?.advanceBookingRule || 'Same day allowed',
          blackoutDates: []
        },
        
        // Step 5: Photos (with Cloudinary URLs)
        images: formData.images || [],
        
        // Step 6: Owner Info & Documents
        ownerInfo: {
          fullName: formData.ownerInfo?.fullName || '',
          email: formData.ownerInfo?.email || '',
          mobile: formData.ownerInfo?.mobile || '',
          alternatePhone: formData.ownerInfo?.alternatePhone || '',
          role: formData.ownerInfo?.role || 'Owner',
          hasGST: formData.ownerInfo?.hasGST || false,
          gstNumber: formData.ownerInfo?.gstNumber || ''
        },
        documents: {
          idProof: {
            type: formData.documents?.idProofType || 'Aadhaar',
            number: formData.documents?.idProofNumber || '',
            frontUrl: formData.documents?.idProofFrontUrl || '',
            backUrl: formData.documents?.idProofBackUrl || ''
          },
          selfieUrl: formData.documents?.selfieUrl || '',
          businessProof: {
            type: formData.documents?.businessProofType || 'GST Certificate',
            documentUrl: formData.documents?.businessProofUrl || '',
            otherSpecify: formData.documents?.businessProofOther || ''
          },
          verified: false
        },
        bankDetails: {
          accountHolderName: formData.bankDetails?.accountHolderName || '',
          accountNumber: formData.bankDetails?.accountNumber || '',
          ifscCode: formData.bankDetails?.ifscCode || '',
          bankName: formData.bankDetails?.bankName || '',
          branchName: formData.bankDetails?.branchName || '',
          accountType: formData.bankDetails?.accountType || 'Savings'
        },
        
        // Step 7: Terms
        termsAccepted: true,
        termsAcceptedDate: new Date()
      };

      console.log('=== VENUE SUBMISSION DEBUG ===');
      console.log('1. Form Data from localStorage:', formData);
      console.log('2. Amenities:', {
        basic: formData.amenities?.basic?.length || 0,
        beverages: formData.amenities?.beverages?.length || 0,
        food: formData.amenities?.refreshmentFood?.length || 0,
        thalis: formData.amenities?.lunchThalis?.length || 0,
        kitchenAccess: formData.amenities?.kitchenAccess?.available,
        diningArea: formData.amenities?.diningArea?.available,
        additional: formData.amenities?.additional?.length || 0
      });
      console.log('3. Images count:', formData.images?.length || 0);
      console.log('4. Documents:', {
        idProofFront: !!formData.documents?.idProofFrontUrl,
        idProofBack: !!formData.documents?.idProofBackUrl,
        selfie: !!formData.documents?.selfieUrl,
        businessProof: !!formData.documents?.businessProofUrl
      });
      console.log('5. Bank Details:', {
        accountHolder: !!formData.bankDetails?.accountHolderName,
        accountNumber: !!formData.bankDetails?.accountNumber,
        ifsc: !!formData.bankDetails?.ifscCode,
        bankName: !!formData.bankDetails?.bankName
      });
      console.log('6. Preparing venue data...');
      console.log('7. Venue data to submit:', venueData);
      console.log('8. Token present:', !!token);
      console.log('9. Edit mode:', isEditMode);
      console.log('10. Venue ID:', formData.venueId);

      const url = isEditMode 
        ? `${process.env.NEXT_PUBLIC_API_URL}/venues/${formData.venueId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/venues`;
      
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(venueData)
      });

      console.log('11. Response status:', response.status);
      const data = await response.json();
      console.log('12. Response data:', data);

      if (data.success) {
        console.log('13. Venue saved successfully!');
        console.log('   Venue ID:', data.venue._id);
        console.log('   Venue SKU:', data.venue.sku);
        toast.success(isEditMode ? 'Venue updated successfully! 🎉' : 'Venue submitted successfully! 🎉');
        
        // Clear localStorage and reset form
        setTimeout(() => {
          localStorage.removeItem('venue-form-storage');
          resetForm();
          router.push('/owner/dashboard');
        }, 1500);
      } else {
        toast.error(data.message || `Failed to ${isEditMode ? 'update' : 'submit'} venue`);
        console.error('Submission error:', data);
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    setStep(6);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="bg-primary-50 border-l-4 border-primary-500 rounded-xl p-4">
        <div className="flex items-start">
          <AlertCircle className="w-6 h-6 text-primary-500 mr-3 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-bold text-dark-800">Terms & Conditions</h3>
            <p className="text-sm text-dark-600 mt-1">
              Please read and accept the terms before submitting
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-dark-200 rounded-xl p-6 max-h-96 overflow-y-auto">
        <h4 className="font-bold text-dark-800 mb-4">RentalMeet Venue Owner Agreement</h4>
        
        <div className="space-y-4 text-sm text-dark-600">
          <div>
            <h5 className="font-semibold text-dark-700 mb-2">1. Commission Agreement</h5>
            <ul className="list-disc pl-5 space-y-1">
              <li>I agree to pay RentalMeet 15% commission on all confirmed bookings</li>
              <li>Commission will be deducted before payout</li>
              <li>Payouts processed within 24-48 hours after event completion</li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-dark-700 mb-2">2. Venue Standards</h5>
            <ul className="list-disc pl-5 space-y-1">
              <li>Maintain venue as described in listing</li>
              <li>Provide all promised amenities and facilities</li>
              <li>Ensure venue is clean and ready before each booking</li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-dark-700 mb-2">3. Booking Management</h5>
            <ul className="list-disc pl-5 space-y-1">
              <li>Respond to booking requests within 2 hours</li>
              <li>Honor confirmed bookings</li>
              <li>Update calendar regularly</li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-dark-700 mb-2">4. Legal Compliance</h5>
            <ul className="list-disc pl-5 space-y-1">
              <li>Have all necessary permits and licenses</li>
              <li>Comply with fire safety and building regulations</li>
              <li>Maintain adequate insurance coverage</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-dark-50 rounded-xl p-4">
        <label className="flex items-start cursor-pointer group">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="w-5 h-5 rounded border-dark-200 text-primary-500 focus:ring-primary-500 focus:ring-2 mt-1 mr-3"
          />
          <span className="text-sm text-dark-700 group-hover:text-primary-500 transition-colors">
            I have read and agree to all terms and conditions. I confirm that all information provided is accurate and truthful.
          </span>
        </label>
      </div>

      <div className="flex justify-between pt-4">
        <button
          type="button"
          onClick={goBack}
          className="btn-secondary flex items-center group"
        >
          <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!accepted || submitting}
          className={`flex items-center px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
            accepted && !submitting
              ? 'bg-success text-white hover:bg-green-600 hover:scale-105' 
              : 'bg-dark-200 text-dark-400 cursor-not-allowed'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          {submitting ? 'Submitting...' : (formData.isEditMode ? 'Update Venue' : 'Submit Venue')}
        </button>
      </div>
    </div>
  );
}

