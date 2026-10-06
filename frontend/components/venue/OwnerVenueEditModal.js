'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { State, City } from 'country-state-city';
import {
  X,
  Save,
  Building2,
  MapPin,
  Sparkles,
  UtensilsCrossed,
  Layers,
  IndianRupee,
  Camera,
  Share2,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Upload,
  Trash2,
  Plus,
  Locate,
  Coffee,
  Video,
  Clock,
  AlertCircle
} from 'lucide-react';
import { uploadToStorage, uploadDocument } from '@/lib/storage';

// ── 12 Specific Categories ──────────────────────────────────────
const VENUE_CATEGORIES = [
  'Meeting Hall',
  'Restaurant',
  'Conference Hall',
  'Co-Work Space',
  'Auditorium',
  'Guest House',
  'Banquet Hall',
  'Training Center',
  'Farm House',
  'Marriage Garden',
  'Hotel',
  'Play Zone'
];

const CAPACITY_OPTIONS = [
  'Up to 10',
  '10-25',
  '25–50',
  '50–100',
  '100–150',
  '150–200',
  '200-300',
  '300-400',
  '400-500',
  '500-700',
  '700-1000',
  '1000-1500',
  '1500-2000',
  '2000+'
];

const FOOD_TYPES = ['Veg', 'Non-Veg', 'Both', 'Pure Veg & Jain'];
const PARKING_OPTIONS = ['None', 'Free', 'Limited', 'Paid'];
const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const ADVANCE_DAYS = ['Same Day', '1 Day', '2 Days', '3 Days', '7 Days', '15 Days', '30 Days'];
const ADVANCE_WEEKS = ['1 Week', '2 Weeks', '3 Weeks', '4 Weeks'];

const FLOOR_OPTIONS = ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor', 'Other'];
const SEATING_ARRANGEMENTS = [
  'Theatre',
  'Classroom',
  'Boardroom',
  'U-Shape',
  'Cluster',
  'Banquet',
  'Cabaret',
  'Auditorium',
  'Open Seating'
];

const SERVICES_AVAILABLE_OPTIONS = [
  'Catering',
  'Makeup & Beauty',
  'Photography',
  'Entertainment',
  'Security & Bouncer',
  'Decor & Floral',
  'Celebrity / Artist',
  'Logistic & Support'
];

const DEFAULT_TERMS = `RentalMeet Venue Owner Agreement

1. Commission Agreement
• I agree to pay RentalMeet platform service fee on all confirmed bookings
• Platform fee will be deducted before payout
• Payouts processed within 24-48 hours after event completion

2. Venue Standards
• Maintain venue as described in listing
• Provide all promised amenities and facilities
• Ensure venue is clean and ready before each booking

3. Booking Management
• Respond to booking requests within given confirmation time
• Honor confirmed bookings
• Update calendar regularly

4. Legal Compliance
• Have all necessary permits and licenses
• Comply with fire safety and building regulations
• Maintain adequate insurance coverage`;

const CATEGORY_AMENITIES_MAP = {
  'Meeting Hall': ['Seating capacity', 'Boardroom', 'Projector', 'Whiteboard', 'Wi-Fi', 'Video conferencing', 'Hourly pricing'],
  'Conference Hall': ['Conference seating', 'Boardroom', 'Projector', 'LED screen', 'Microphone', 'Video conferencing', 'Half-day/full-day pricing'],
  'Auditorium': ['Seating capacity', 'Stage', 'Sound system', 'Green room', 'Projector', 'Lighting', 'Parking'],
  'Banquet Hall': ['Dining capacity', 'Stage', 'Catering', 'Decoration', 'Bridal room', 'DJ/music', 'Parking', 'Per-event pricing'],
  'Farm House': ['Lawn area', 'Pool', 'Outdoor area', 'Bedrooms', 'Kitchen', 'Parking', 'Overnight stay', 'Event restrictions'],
  'Hotel': ['Number of rooms', 'Room types', 'Conference facilities', 'Restaurant', 'Banquet facilities', 'Check-in/check-out', 'Room pricing'],
  'Restaurant': ['Seating capacity', 'Cuisine', 'Table arrangement', 'Private dining', 'Catering', 'Per-person pricing'],
  'Co-Work Space': ['Number of desks', 'Private cabins', 'Meeting rooms', 'Internet speed', 'Printing', 'Workstations', 'Hour/day/month pricing'],
  'Guest House': ['Number of rooms', 'Room types', 'Beds', 'Check-in/check-out', 'Meals', 'Parking', 'Per-night pricing'],
  'Training Center': ['Classroom capacity', 'Projector', 'Whiteboard', 'Computers', 'Internet', 'Training equipment', 'Per-hour/day pricing'],
  'Marriage Garden': ['Lawn size', 'Guest capacity', 'Catering', 'Decoration', 'Parking', 'Stage', 'Bridal room', 'Event pricing'],
  'Play Zone': ['Indoor/outdoor', 'Activities', 'Age groups', 'Maximum capacity', 'Safety equipment', 'Locker/changing room', 'Per-hour/per-person pricing']
};

const DEFAULT_BASIC_AMENITIES = [
  // ── 1. Basic Facilities ──────────────────────────────────────────────────
  { name: 'Air Conditioning', category: 'Basic Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Wi-Fi', category: 'Basic Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Parking', category: 'Basic Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Power Backup', category: 'Basic Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Generator', category: 'Basic Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Lift', category: 'Basic Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Washrooms', category: 'Basic Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Drinking Water', category: 'Basic Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Reception', category: 'Basic Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Waiting Area', category: 'Basic Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'CCTV', category: 'Basic Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Security', category: 'Basic Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Wheelchair Accessibility', category: 'Basic Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Ramp', category: 'Basic Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Fire Extinguishers', category: 'Basic Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'First Aid', category: 'Basic Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Locker / Changing Room', category: 'Basic Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Safety Equipment', category: 'Basic Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },

  // ── 2. Meeting / Conference Facilities ──────────────────────────────────
  { name: 'Projector', category: 'Meeting / Conference Facilities', type: 'Paid', rate: 500, rateType: 'Fixed' },
  { name: 'LED Screen', category: 'Meeting / Conference Facilities', type: 'Paid', rate: 1000, rateType: 'Fixed' },
  { name: 'Sound System', category: 'Meeting / Conference Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Microphone', category: 'Meeting / Conference Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Podium', category: 'Meeting / Conference Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Whiteboard', category: 'Meeting / Conference Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Conference Table', category: 'Meeting / Conference Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Office Chairs', category: 'Meeting / Conference Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Video Conferencing', category: 'Meeting / Conference Facilities', type: 'Paid', rate: 1500, rateType: 'Fixed' },
  { name: 'Printing Facility', category: 'Meeting / Conference Facilities', type: 'Paid', rate: 200, rateType: 'Fixed' },
  { name: 'Scanner', category: 'Meeting / Conference Facilities', type: 'Paid', rate: 200, rateType: 'Fixed' },
  { name: 'Laptop / Computer Facility', category: 'Meeting / Conference Facilities', type: 'Paid', rate: 500, rateType: 'Fixed' },
  { name: 'Dedicated Workstations', category: 'Meeting / Conference Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Private Cabins / Meeting Rooms', category: 'Meeting / Conference Facilities', type: 'Paid', rate: 1000, rateType: 'Fixed' },
  { name: 'Training Equipment / AV Setup', category: 'Meeting / Conference Facilities', type: 'Paid', rate: 800, rateType: 'Fixed' },

  // ── 3. Event Facilities ──────────────────────────────────────────────────
  { name: 'Stage', category: 'Event Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Green Room', category: 'Event Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Bridal Room', category: 'Event Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Changing Room', category: 'Event Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Dining Area', category: 'Event Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Kitchen', category: 'Event Facilities', type: 'Paid', rate: 2000, rateType: 'Fixed' },
  { name: 'Lawn', category: 'Event Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Garden', category: 'Event Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Rooftop', category: 'Event Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Swimming Pool', category: 'Event Facilities', type: 'Paid', rate: 3000, rateType: 'Fixed' },
  { name: 'DJ Area', category: 'Event Facilities', type: 'Paid', rate: 5000, rateType: 'Fixed' },
  { name: 'Lighting', category: 'Event Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Overnight Stay / AC Bedrooms', category: 'Event Facilities', type: 'Paid', rate: 2500, rateType: 'Fixed' },
  { name: 'Private Dining Area', category: 'Event Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Indoor / Outdoor Play Area', category: 'Event Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Gaming & Play Zone Activities', category: 'Event Facilities', type: 'Paid', rate: 1000, rateType: 'Fixed' },

  // ── 4. Food Facilities ───────────────────────────────────────────────────
  { name: 'In-house Catering', category: 'Food Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Outside Catering Allowed', category: 'Food Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Vegetarian Food', category: 'Food Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Non-Vegetarian Food', category: 'Food Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Jain Food', category: 'Food Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Buffet', category: 'Food Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Kitchen Available', category: 'Food Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Dining Area', category: 'Food Facilities', type: 'Included', rate: 0, rateType: 'Fixed' }
];

const DEFAULT_BEVERAGES = [
  { name: 'Tea (Regular / Masala)', available: true, ratePerUnit: 15 },
  { name: 'Coffee (Hot / Cold)', available: true, ratePerUnit: 25 },
  { name: 'Soft Drinks / Mocktails', available: true, ratePerUnit: 40 },
  { name: 'Mineral Water Bottles', available: true, ratePerUnit: 20 }
];

const DEFAULT_BREAKFAST = [
  { name: 'Poha & Jalebi', available: true, ratePerPlate: 60, items: 'Poha, Jalebi, Sev, Chutney' },
  { name: 'Idli, Vada & Sambar', available: true, ratePerPlate: 80, items: '2 Idli, 1 Vada, Sambar, Coconut Chutney' },
  { name: 'Aloo / Paneer Paratha', available: true, ratePerPlate: 90, items: '2 Parathas, Curd, Pickle, Butter' },
  { name: 'Puri Sabzi & Sweet', available: true, ratePerPlate: 100, items: '4 Puris, Aloo Sabzi, Halwa, Pickle' }
];

const DEFAULT_LUNCH_DINNER = [
  { name: 'Standard Veg Buffet', available: true, foodType: 'Veg', ratePerPlate: 350, items: 'Paneer Sabzi, Dal Tadka, Seasonal Veg, Jeera Rice, Rotis, Gulab Jamun, Salad' },
  { name: 'Deluxe Veg Buffet', available: true, foodType: 'Veg', ratePerPlate: 500, items: '2 Paneer Sabzis, Dal Makhani, Pulao, Naan/Roti, 2 Sweets, Ice Cream, Starter' },
  { name: 'Non-Veg Special Buffet', available: true, foodType: 'Non-Veg', ratePerPlate: 650, items: 'Chicken Curry, Mutton/Fish, Veg Sabzi, Biryani, Breads, Dessert, Starters' }
];

const DEFAULT_ADDITIONAL_FACILITIES = [
  { name: 'AC Guest Rooms / Bridal Suite', available: false, type: 'Paid', charges: 1500, description: 'Comfortable furnished room with attached bathroom' },
  { name: 'Open Lawn / Garden Area', available: false, type: 'Included', charges: 0, description: 'Lawn space for outdoor functions' },
  { name: 'DJ & Music Setup', available: false, type: 'Paid', charges: 5000, description: 'DJ with lighting setup (allowed till 10 PM)' },
  { name: 'Theme Decoration & Florist', available: false, type: 'Paid', charges: 10000, description: 'Customized balloon, flower and stage decor' },
  { name: 'Valet Parking & Guards', available: false, type: 'Paid', charges: 2000, description: 'Uniformed security and valet staff' }
];

const PHOTO_SLOTS = [
  { key: 'Front / Entrance', label: 'Front / Entrance (Cover Photo *)', required: true, hint: 'Exterior or main entrance view (Primary Cover)' },
  { key: 'Main Hall / Space', label: 'Main Hall / Space Photo *', required: true, hint: 'Central hall or main function space' },
  { key: 'Additional Hall', label: 'Additional Hall Photo', required: false, hint: 'Secondary hall or meeting space' },
  { key: 'Seating Area', label: 'Seating Area Photo *', required: true, hint: 'Guest chairs, tables, or banquet seating' },
  { key: 'Stage', label: 'Stage / Podium Photo', required: false, hint: 'Stage, podium, or backdrop' },
  { key: 'Dining Area', label: 'Dining Area Photo', required: false, hint: 'Buffet or dining setup' },
  { key: 'Kitchen', label: 'Kitchen / Food Prep Photo', required: false, hint: 'Kitchen or catering area' },
  { key: 'Bedroom', label: 'Bedroom / Guest Room Photo', required: false, hint: 'Guest or bridal changing room' },
  { key: 'Washroom', label: 'Washroom / Restroom Photo', required: false, hint: 'Clean guest washroom' },
  { key: 'Parking', label: 'Parking Area Photo', required: false, hint: 'Vehicle parking space' },
  { key: 'Garden / Lawn', label: 'Garden / Lawn Photo', required: false, hint: 'Lawn or open green area' },
  { key: 'Outdoor Area', label: 'Outdoor / Rooftop Photo', required: false, hint: 'Terrace, balcony or open deck' },
  { key: 'Other', label: 'Other Photo', required: false, hint: 'Any additional highlight view' }
];

const TABS = [
  { id: 'basic', label: '1. Basic Info', icon: Building2 },
  { id: 'location', label: '2. Address Location', icon: MapPin },
  { id: 'amenities', label: '3. Amenities', icon: Sparkles },
  { id: 'catering', label: '4. Catering Facility', icon: UtensilsCrossed },
  { id: 'facilities', label: '5. Additional Facilities', icon: Layers },
  { id: 'pricing', label: '6. Pricing & Taxes', icon: IndianRupee },
  { id: 'photos', label: '7. Photos', icon: Camera },
  { id: 'social', label: '8. Social Pages', icon: Share2 },
  { id: 'documents', label: '9. Documents', icon: FileText },
  { id: 'terms', label: '10. Rules & Terms', icon: ShieldCheck }
];

// Helper to merge existing amenities with full categorized defaults
const mergeAmenitiesWithDefaults = (existingList = []) => {
  if (!existingList || existingList.length === 0) {
    return DEFAULT_BASIC_AMENITIES.map(a => ({ ...a }));
  }

  const normalize = (n) => (n || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const existingMap = new Map();

  existingList.forEach((item) => {
    const key = normalize(item.name);
    existingMap.set(key, item);
  });

  const matchedKeys = new Set();

  const merged = DEFAULT_BASIC_AMENITIES.map((def) => {
    const defKey = normalize(def.name);
    let matched = existingMap.get(defKey);
    let matchedKey = defKey;

    if (!matched) {
      for (const [k, v] of existingMap.entries()) {
        if (k.includes(defKey) || defKey.includes(k)) {
          matched = v;
          matchedKey = k;
          break;
        }
      }
    }

    if (matched) {
      matchedKeys.add(matchedKey);
      return {
        ...def,
        type: matched.type || def.type,
        rate: matched.rate !== undefined ? matched.rate : def.rate,
        rateType: matched.rateType || def.rateType,
        available: matched.available !== undefined ? matched.available : true
      };
    }
    return { ...def };
  });

  // Any custom amenity added by user
  const customItems = [];
  existingList.forEach((item) => {
    const key = normalize(item.name);
    if (!matchedKeys.has(key)) {
      const isDefault = DEFAULT_BASIC_AMENITIES.some((def) => {
        const defKey = normalize(def.name);
        return key === defKey || key.includes(defKey) || defKey.includes(key);
      });
      if (!isDefault) {
        customItems.push({
          ...item,
          category: item.category || 'Other'
        });
      }
    }
  });

  return [...merged, ...customItems];
};

export default function OwnerVenueEditModal({
  venue = null,
  isOpen,
  onClose,
  onSaveSuccess
}) {
  const { user, token } = useAuthStore();
  const [activeTab, setActiveTab] = useState('basic');
  const [savingTab, setSavingTab] = useState(false);
  const [currentVenueId, setCurrentVenueId] = useState(venue?._id || null);
  const [submittedVenueData, setSubmittedVenueData] = useState(null);

  // Dynamic terms state
  const [termsText, setTermsText] = useState(DEFAULT_TERMS);
  const [loadingTerms, setLoadingTerms] = useState(false);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      setLoadingTerms(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/terms`);
      const data = await res.json();
      if (data.success && data.terms?.venueOnboardingTerms) {
        setTermsText(data.terms.venueOnboardingTerms);
      }
    } catch (e) {
      setTermsText(DEFAULT_TERMS);
    } finally {
      setLoadingTerms(false);
    }
  };

  // Comprehensive Form State
  const [formData, setFormData] = useState({
    businessName: '',
    venueType: ['Meeting Hall'],
    foodType: 'Veg',
    capacity: '50–100',
    areaSqft: 1000,
    yearEstablished: '',
    floor: 'Ground Floor',
    seatingArrangements: ['Banquet', 'Theatre'],
    description: '',

    location: {
      address: '',
      landmark: '',
      state: '',
      stateCode: '',
      city: '',
      village: '',
      area: '',
      pincode: '',
      googleMapLink: '',
      parkingAvailability: 'None',
      parkingDetails: {
        type: 'None',
        carsCapacity: 0,
        twoWheelerCapacity: 0,
        carCharges: 0,
        twoWheelerCharges: 0
      },
      nearestBusAuto: '',
      nearestMetroTrain: ''
    },

    amenities: {
      basic: DEFAULT_BASIC_AMENITIES.map(a => ({ ...a }))
    },

    cateringFacility: {
      available: false,
      outsideCateringAllowed: true,
      beverages: DEFAULT_BEVERAGES,
      breakfast: DEFAULT_BREAKFAST,
      lunchDinner: DEFAULT_LUNCH_DINNER
    },

    additionalFacilities: DEFAULT_ADDITIONAL_FACILITIES,
    servicesAvailable: ['Catering', 'Decor & Floral', 'Security & Bouncer'],

    pricing: {
      selectedPricingModels: ['Only Rent'],
      onlyRent: {
        hourly: { rate: 0, extraPerHour: 0 },
        halfDay: { rate: 0, extraPerHour: 0 },
        fullDay: { rate: 0, extraPerHour: 0 }
      },
      rentWithAmenities: {
        hourly: { rate: 0, extraPerHour: 0 },
        halfDay: { rate: 0, extraPerHour: 0 },
        fullDay: { rate: 0, extraPerHour: 0 }
      },
      perPax: {
        withoutFood: { rate: 0, minPax: 50 },
        breakfastOnly: { rate: 0, minPax: 50 },
        breakfastLunch: { rate: 0, minPax: 50 },
        lunchOnly: { rate: 0, minPax: 50 },
        dinnerOnly: { rate: 0, minPax: 50 },
        allMeals: { rate: 0, minPax: 50 }
      },
      advanceBookingRule: '1 Day',
      confirmationHours: 3,
      openingTime: '09:00',
      closingTime: '22:00',
      onlineBookingOpeningTime: '06:00',
      onlineBookingClosingTime: '02:00',
      availableDays: DAYS_OF_WEEK
    },

    taxSettings: {
      taxType: 'GST Included',
      gstRate: 18
    },

    rulesAndPolicies: {
      foodPolicy: 'Both Allowed',
      outsideVendors: 'Allowed',
      decoration: 'Allowed',
      musicNoise: 'Restricted',
      alcohol: 'Not Allowed',
      pets: 'Not Allowed'
    },

    cancellationPolicy: {
      policyType: 'Flexible',
      customNoticeDays: 7,
      customRefundPercent: 50,
      moreThanDays: 15,
      moreThanDaysRefund: 100,
      withinDays: 7,
      withinDaysRefund: 50,
      withinHours: 24,
      withinHoursRefund: 20,
      noShowRefund: 0
    },

    images: [],

    socialLinks: {
      instagram: '',
      facebook: '',
      youtube: [''],
      website: ''
    },

    ownerInfo: {
      fullName: user?.name || '',
      email: user?.email || '',
      mobile: user?.phone || '',
      alternatePhone: '',
      hasGST: false,
      gstNumber: '',
      gstCertificateUrl: '',
      authorisedPerson: {
        fullName: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        alternatePhone: '',
        designation: 'Owner'
      }
    },

    documents: {
      selfieUrl: '',
      selfiePublicId: '',
      idProof: {
        type: 'Aadhaar',
        aadhaarFrontUrl: '',
        aadhaarBackUrl: '',
        aadhaarNumber: '',
        documentNumber: '',
        documentUrl: ''
      },
      businessProof: {
        type: 'PAN Card',
        documentUrl: '',
        publicId: ''
      },
      propertyProof: {
        type: 'Ownership Proof',
        documentUrl: '',
        publicId: ''
      },
      applicableCertificates: {
        type: 'Fire Safety Certificate',
        documentUrl: '',
        publicId: ''
      }
    },

    bankDetails: {
      accountHolderName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
      branchName: '',
      accountType: 'Savings',
      bankProofUrl: '',
      bankProofPublicId: ''
    },

    termsAccepted: true
  });

  // State & City Lists
  const stateOptions = State.getStatesOfCountry('IN').map((s) => ({
    name: s.name,
    code: s.isoCode
  }));

  const cityOptions = formData.location.stateCode
    ? City.getCitiesOfState('IN', formData.location.stateCode).map((c) => c.name)
    : [];

  // Populate data when venue changes
  useEffect(() => {
    if (venue) {
      setCurrentVenueId(venue._id);
      const matchedState = stateOptions.find(
        (s) => s.name.toLowerCase() === (venue.location?.state || '').toLowerCase()
      );

      setFormData((prev) => ({
        ...prev,
        businessName: venue.businessName || '',
        venueType: Array.isArray(venue.venueType) ? venue.venueType : (venue.venueType ? [venue.venueType] : []),
        foodType: venue.foodType || 'Veg',
        capacity: venue.capacity || '50–100',
        areaSqft: venue.areaSqft || 1000,
        yearEstablished: venue.yearEstablished || '',
        floor: venue.floor || 'Ground Floor',
        seatingArrangements: venue.seatingArrangements?.length ? venue.seatingArrangements : ['Banquet', 'Theatre'],
        description: venue.description || '',

        location: {
          ...prev.location,
          address: venue.location?.address || '',
          landmark: venue.location?.landmark || '',
          state: venue.location?.state || '',
          stateCode: venue.location?.stateCode || matchedState?.code || '',
          city: venue.location?.city || '',
          village: venue.location?.village || '',
          area: venue.location?.area || '',
          pincode: venue.location?.pincode || '',
          googleMapLink: venue.location?.googleMapLink || '',
          parkingAvailability: venue.parkingDetails?.type || venue.location?.parkingAvailability || 'None',
          parkingDetails: {
            type: venue.parkingDetails?.type || venue.location?.parkingAvailability || 'None',
            carsCapacity: venue.parkingDetails?.cars?.capacity || venue.location?.parkingDetails?.carsCapacity || 0,
            twoWheelerCapacity: venue.parkingDetails?.twoWheelers?.capacity || venue.location?.parkingDetails?.twoWheelerCapacity || 0,
            carCharges: venue.parkingDetails?.cars?.chargePerVehicle || venue.location?.parkingDetails?.carCharges || 0,
            twoWheelerCharges: venue.parkingDetails?.twoWheelers?.chargePerVehicle || venue.location?.parkingDetails?.twoWheelerCharges || 0
          },
          nearestBusAuto: venue.location?.nearestBusAuto || '',
          nearestMetroTrain: venue.location?.nearestMetroTrain || ''
        },

        amenities: {
          basic: mergeAmenitiesWithDefaults(venue.amenities?.basic)
        },

        cateringFacility: {
          available: venue.cateringFacility?.available ?? false,
          outsideCateringAllowed: venue.cateringFacility?.outsideCateringAllowed ?? true,
          beverages: venue.cateringFacility?.beverages?.length ? venue.cateringFacility.beverages : DEFAULT_BEVERAGES,
          breakfast: venue.cateringFacility?.breakfast?.length ? venue.cateringFacility.breakfast : DEFAULT_BREAKFAST,
          lunchDinner: venue.cateringFacility?.lunchDinner?.length ? venue.cateringFacility.lunchDinner : DEFAULT_LUNCH_DINNER
        },

        additionalFacilities: venue.additionalFacilities?.length ? venue.additionalFacilities : DEFAULT_ADDITIONAL_FACILITIES,
        servicesAvailable: venue.servicesAvailable?.length ? venue.servicesAvailable : ['Catering', 'Decor & Floral', 'Security & Bouncer'],

        pricing: {
          ...prev.pricing,
          ...(venue.pricing || {}),
          selectedPricingModels: venue.pricing?.selectedPricingModels?.length ? venue.pricing.selectedPricingModels : ['Only Rent'],
          onlyRent: {
            hourly: {
              rate: venue.pricing?.onlyRent?.hourly?.rate ?? venue.pricing?.perHour?.weekday ?? 0,
              extraPerHour: venue.pricing?.onlyRent?.hourly?.extraPerHour ?? venue.pricing?.extraHourRate?.weekday ?? 0
            },
            halfDay: {
              rate: venue.pricing?.onlyRent?.halfDay?.rate ?? venue.pricing?.halfDay?.weekday ?? 0,
              extraPerHour: venue.pricing?.onlyRent?.halfDay?.extraPerHour ?? venue.pricing?.extraHourRate?.weekday ?? 0
            },
            fullDay: {
              rate: venue.pricing?.onlyRent?.fullDay?.rate ?? venue.pricing?.fullDay?.weekday ?? 0,
              extraPerHour: venue.pricing?.onlyRent?.fullDay?.extraPerHour ?? venue.pricing?.extraHourRate?.weekday ?? 0
            }
          },
          rentWithAmenities: {
            hourly: {
              rate: venue.pricing?.rentWithAmenities?.hourly?.rate ?? 0,
              extraPerHour: venue.pricing?.rentWithAmenities?.hourly?.extraPerHour ?? 0
            },
            halfDay: {
              rate: venue.pricing?.rentWithAmenities?.halfDay?.rate ?? 0,
              extraPerHour: venue.pricing?.rentWithAmenities?.halfDay?.extraPerHour ?? 0
            },
            fullDay: {
              rate: venue.pricing?.rentWithAmenities?.fullDay?.rate ?? 0,
              extraPerHour: venue.pricing?.rentWithAmenities?.fullDay?.extraPerHour ?? 0
            }
          },
          perPax: {
            withoutFood: {
              rate: venue.pricing?.perPax?.withoutFood?.rate ?? 0,
              minPax: venue.pricing?.perPax?.withoutFood?.minPax ?? 50
            },
            breakfastOnly: {
              rate: venue.pricing?.perPax?.breakfastOnly?.rate ?? 0,
              minPax: venue.pricing?.perPax?.breakfastOnly?.minPax ?? 50
            },
            breakfastLunch: {
              rate: venue.pricing?.perPax?.breakfastLunch?.rate ?? 0,
              minPax: venue.pricing?.perPax?.breakfastLunch?.minPax ?? 50
            },
            lunchOnly: {
              rate: venue.pricing?.perPax?.lunchOnly?.rate ?? 0,
              minPax: venue.pricing?.perPax?.lunchOnly?.minPax ?? 50
            },
            dinnerOnly: {
              rate: venue.pricing?.perPax?.dinnerOnly?.rate ?? 0,
              minPax: venue.pricing?.perPax?.dinnerOnly?.minPax ?? 50
            },
            allMeals: {
              rate: venue.pricing?.perPax?.allMeals?.rate ?? 0,
              minPax: venue.pricing?.perPax?.allMeals?.minPax ?? 50
            }
          },
          advanceBookingRule: venue.pricing?.advanceBookingRule || venue.availability?.advanceBookingRule || '1 Day',
          confirmationHours: venue.pricing?.confirmationHours ?? venue.availability?.confirmationHours ?? 3,
          openingTime: venue.availability?.openingTime || venue.pricing?.openingTime || '09:00',
          closingTime: venue.availability?.closingTime || venue.pricing?.closingTime || '22:00',
          onlineBookingOpeningTime: venue.availability?.onlineBookingSchedule?.openingTime || venue.pricing?.onlineBookingOpeningTime || '06:00',
          onlineBookingClosingTime: venue.availability?.onlineBookingSchedule?.closingTime || venue.pricing?.onlineBookingClosingTime || '02:00',
          availableDays: venue.availability?.availableDays?.length ? venue.availability.availableDays : DAYS_OF_WEEK
        },

        taxSettings: venue.taxSettings || {
          taxType: 'GST Included',
          gstRate: 18
        },

        rulesAndPolicies: venue.rulesAndPolicies || {
          foodPolicy: 'Both Allowed',
          outsideVendors: 'Allowed',
          decoration: 'Allowed',
          musicNoise: 'Restricted',
          alcohol: 'Not Allowed',
          pets: 'Not Allowed'
        },

        cancellationPolicy: {
          policyType: venue.cancellationPolicy?.policyType || 'Flexible',
          customNoticeDays: venue.cancellationPolicy?.customNoticeDays ?? 7,
          customRefundPercent: venue.cancellationPolicy?.customRefundPercent ?? 50,
          moreThanDays: venue.cancellationPolicy?.moreThanDays ?? 15,
          moreThanDaysRefund: venue.cancellationPolicy?.moreThanDaysRefund ?? 100,
          withinDays: venue.cancellationPolicy?.withinDays ?? 7,
          withinDaysRefund: venue.cancellationPolicy?.withinDaysRefund ?? 50,
          withinHours: venue.cancellationPolicy?.withinHours ?? 24,
          withinHoursRefund: venue.cancellationPolicy?.withinHoursRefund ?? 20,
          noShowRefund: venue.cancellationPolicy?.noShowRefund ?? 0
        },

        images: Array.isArray(venue.images) ? venue.images : [],

        socialLinks: {
          instagram: venue.socialLinks?.instagram || '',
          facebook: venue.socialLinks?.facebook || '',
          youtube: venue.socialLinks?.youtube?.length ? venue.socialLinks.youtube : [''],
          website: venue.socialLinks?.website || ''
        },

        ownerInfo: {
          ...prev.ownerInfo,
          ...(venue.ownerInfo || {}),
          authorisedPerson: {
            ...prev.ownerInfo.authorisedPerson,
            ...(venue.ownerInfo?.authorisedPerson || {})
          }
        },

        documents: {
          ...prev.documents,
          ...(venue.documents || {}),
          idProof: {
            ...prev.documents.idProof,
            ...(venue.documents?.idProof || {})
          },
          businessProof: {
            ...prev.documents.businessProof,
            ...(venue.documents?.businessProof || {})
          },
          propertyProof: {
            ...prev.documents.propertyProof,
            ...(venue.documents?.propertyProof || {})
          },
          applicableCertificates: {
            ...prev.documents.applicableCertificates,
            ...(venue.documents?.applicableCertificates || {})
          }
        },

        bankDetails: {
          ...prev.bankDetails,
          ...(venue.bankDetails || {})
        },

        termsAccepted: venue.termsAccepted ?? true
      }));
    } else {
      setCurrentVenueId(null);
    }
  }, [venue]);

  if (!isOpen) return null;

  // ── Auto Detect Location via GPS ──────────────────────────────────────────
  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    toast.loading('Detecting location via GPS...', { id: 'gps-toast' });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const gMapUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.address) {
            const detectedState = data.address.state || '';
            const detectedCity = data.address.city || data.address.town || data.address.suburb || '';
            const matchedState = stateOptions.find(s => s.name.toLowerCase() === detectedState.toLowerCase());

            setFormData((prev) => ({
              ...prev,
              location: {
                ...prev.location,
                address: prev.location.address || data.display_name || '',
                state: matchedState ? matchedState.name : prev.location.state,
                stateCode: matchedState ? matchedState.code : prev.location.stateCode,
                city: detectedCity || prev.location.city,
                googleMapLink: gMapUrl
              }
            }));
            toast.success('Location detected successfully! 📍', { id: 'gps-toast' });
          } else {
            setFormData(prev => ({ ...prev, location: { ...prev.location, googleMapLink: gMapUrl } }));
            toast.success('GPS coordinates captured! 📍', { id: 'gps-toast' });
          }
        } catch {
          setFormData(prev => ({ ...prev, location: { ...prev.location, googleMapLink: gMapUrl } }));
          toast.success('Coordinates captured from GPS! 📍', { id: 'gps-toast' });
        }
      },
      (err) => {
        toast.error('Unable to fetch GPS position. Please enter manually.', { id: 'gps-toast' });
      },
      { timeout: 15000, enableHighAccuracy: true }
    );
  };

  // ── Generic Single-Tab Save Handler ────────────────────────────────────────
  const handleSaveTab = async (tabName, isFinalSubmit = false) => {
    if (!formData.businessName.trim()) {
      toast.error('Business / Venue Name is required in Tab 1');
      setActiveTab('basic');
      return;
    }

    setSavingTab(true);
    const toastId = toast.loading(`Saving ${tabName}...`);

    try {
      const payload = {
        businessName: formData.businessName.trim(),
        venueType: formData.venueType,
        foodType: formData.foodType,
        capacity: formData.capacity,
        areaSqft: Number(formData.areaSqft) || 1000,
        yearEstablished: formData.yearEstablished,
        floor: formData.floor,
        seatingArrangements: formData.seatingArrangements,
        description: formData.description,

        location: {
          ...formData.location,
          parkingAvailability: formData.location.parkingDetails.type,
          parkingDetails: {
            ...formData.location.parkingDetails,
            carsCapacity: Number(formData.location.parkingDetails.carsCapacity || 0),
            twoWheelerCapacity: Number(formData.location.parkingDetails.twoWheelerCapacity || 0),
            carCharges: Number(formData.location.parkingDetails.carCharges || 0),
            twoWheelerCharges: Number(formData.location.parkingDetails.twoWheelerCharges || 0)
          }
        },

        parkingDetails: {
          type: formData.location.parkingDetails.type,
          cars: {
            capacity: Number(formData.location.parkingDetails.carsCapacity || 0),
            chargePerVehicle: Number(formData.location.parkingDetails.carCharges || 0),
            isChargeable: formData.location.parkingDetails.type === 'Paid'
          },
          twoWheelers: {
            capacity: Number(formData.location.parkingDetails.twoWheelerCapacity || 0),
            chargePerVehicle: Number(formData.location.parkingDetails.twoWheelerCharges || 0),
            isChargeable: formData.location.parkingDetails.type === 'Paid'
          }
        },

        amenities: formData.amenities,
        cateringFacility: formData.cateringFacility,
        additionalFacilities: formData.additionalFacilities,
        servicesAvailable: formData.servicesAvailable,
        pricing: formData.pricing,
        taxSettings: formData.taxSettings,
        rulesAndPolicies: formData.rulesAndPolicies,
        cancellationPolicy: formData.cancellationPolicy,
        availability: {
          openingTime: formData.pricing.openingTime,
          closingTime: formData.pricing.closingTime,
          onlineBookingSchedule: {
            enabled: true,
            openingTime: formData.pricing.onlineBookingOpeningTime || '06:00',
            closingTime: formData.pricing.onlineBookingClosingTime || '02:00'
          },
          advanceBookingRule: formData.pricing.advanceBookingRule,
          confirmationHours: formData.pricing.confirmationHours,
          availableDays: formData.pricing.availableDays
        },
        images: formData.images,
        socialLinks: {
          ...formData.socialLinks,
          youtube: (formData.socialLinks.youtube || []).filter(Boolean)
        },
        ownerInfo: formData.ownerInfo,
        documents: formData.documents,
        bankDetails: formData.bankDetails,
        termsAccepted: true
      };

      if (isFinalSubmit) {
        payload.status = 'pending';
      }

      let res;
      if (currentVenueId) {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/owner/venues/${currentVenueId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/venues`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to save venue');
      }

      if (data.venue?._id) {
        setCurrentVenueId(data.venue._id);
      }

      toast.success(
        isFinalSubmit
          ? 'Venue submitted for Admin Review successfully! 🎉'
          : `${tabName} saved successfully! ✅`,
        { id: toastId }
      );

      if (onSaveSuccess) onSaveSuccess(data.venue || data);
      if (isFinalSubmit) {
        setSubmittedVenueData(data.venue || { _id: currentVenueId, sku: data.venue?.sku });
      }
    } catch (err) {
      console.error('Save error:', err);
      toast.error(err.message || 'Failed to save', { id: toastId });
    } finally {
      setSavingTab(false);
    }
  };

  // ── Document Upload Helper ────────────────────────────────────────────────
  const handleDocUpload = async (e, fieldPath) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading(`Uploading ${file.name}...`);
    try {
      const uploadData = await uploadDocument(file, 'documents');
      setFormData((prev) => {
        const next = { ...prev };
        if (fieldPath === 'selfie') {
          next.documents.selfieUrl = uploadData.url;
          next.documents.selfiePublicId = uploadData.publicId;
        } else if (fieldPath === 'aadhaarFront') {
          next.documents.idProof.aadhaarFrontUrl = uploadData.url;
          next.documents.idProof.aadhaarFrontPublicId = uploadData.publicId;
        } else if (fieldPath === 'aadhaarBack') {
          next.documents.idProof.aadhaarBackUrl = uploadData.url;
          next.documents.idProof.aadhaarBackPublicId = uploadData.publicId;
        } else if (fieldPath === 'businessDoc') {
          next.documents.businessProof.documentUrl = uploadData.url;
          next.documents.businessProof.publicId = uploadData.publicId;
        } else if (fieldPath === 'propertyDoc') {
          next.documents.propertyProof.documentUrl = uploadData.url;
          next.documents.propertyProof.publicId = uploadData.publicId;
        } else if (fieldPath === 'certificateDoc') {
          next.documents.applicableCertificates.documentUrl = uploadData.url;
          next.documents.applicableCertificates.publicId = uploadData.publicId;
        } else if (fieldPath === 'bankProof') {
          next.bankDetails.bankProofUrl = uploadData.url;
          next.bankDetails.bankProofPublicId = uploadData.publicId;
        } else if (fieldPath === 'gstCert') {
          next.ownerInfo.gstCertificateUrl = uploadData.url;
          next.ownerInfo.gstCertificatePublicId = uploadData.publicId;
        }
        return next;
      });
      toast.success('Uploaded successfully! ✅', { id: toastId });
    } catch (err) {
      console.error('Doc upload error:', err);
      toast.error('Upload failed. Please try again.', { id: toastId });
    }
  };

  // ── Photo Upload Helper ───────────────────────────────────────────────────
  const handlePhotoUpload = async (e, category) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading(`Uploading ${category} photo...`);
    try {
      const uploadData = await uploadToStorage(file, 'venues');
      setFormData((prev) => {
        const filtered = prev.images.filter((img) => img.category !== category);
        return {
          ...prev,
          images: [
            ...filtered,
            {
              url: uploadData.url,
              publicId: uploadData.publicId,
              category,
              isFeatured: category === 'Front / Entrance',
              uploadedAt: new Date()
            }
          ]
        };
      });
      toast.success(`${category} photo uploaded! ✅`, { id: toastId });
    } catch (err) {
      console.error('Photo upload error:', err);
      toast.error('Failed to upload photo', { id: toastId });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* ── Modal Header ──────────────────────────────────────────────────── */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-500/20 border border-primary-500/30 rounded-2xl text-primary-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  {currentVenueId ? 'Update Venue Details' : 'Register New Venue'}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-500/30 text-primary-300 font-bold uppercase tracking-wider">
                  Owner Portal
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate max-w-md">
                {formData.businessName ? (
                  <>Venue: <strong className="text-white">{formData.businessName}</strong></>
                ) : (
                  'Fill in the 10 sections below and save individual tabs anytime.'
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── 10 Tabs Horizontal Navigation ─────────────────────────────────── */}
        <div className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 px-3 overflow-x-auto flex-shrink-0 no-scrollbar">
          <div className="flex gap-1.5 py-2 min-w-max">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-sm scale-[1.02]'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Modal Body / Tab Content ──────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">

          {/* ════════════════════════════════════════════════════════════════════
              TAB 1: BASIC INFO
             ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'basic' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Business / Venue Name *
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500 font-semibold"
                    placeholder="e.g. Royal Grand Palace"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Food Type *
                  </label>
                  <select
                    value={formData.foodType}
                    onChange={(e) => setFormData({ ...formData, foodType: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 font-semibold"
                  >
                    {FOOD_TYPES.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Multi-Select Venue Types */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Venue Categories / Types (Multi-select) *
                  </label>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
                    {formData.venueType.length} Selected
                  </span>
                </div>
                <div className="p-3 bg-gray-50/80 dark:bg-slate-800/40 rounded-2xl border border-gray-200 dark:border-slate-700">
                  <div className="flex flex-wrap gap-2">
                    {VENUE_CATEGORIES.map((cat) => {
                      const isSelected = formData.venueType.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            const updated = isSelected
                              ? formData.venueType.filter((t) => t !== cat)
                              : [...formData.venueType, cat];
                            setFormData({ ...formData, venueType: updated });
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-primary-600 border-primary-600 text-white shadow-xs scale-[1.02]'
                              : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-primary-400 hover:bg-gray-50'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-md flex items-center justify-center text-[10px] ${
                            isSelected ? 'bg-white/20 text-white' : 'border border-gray-400 text-transparent'
                          }`}>
                            ✓
                          </span>
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Maximum Capacity Range *
                  </label>
                  <select
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 font-semibold"
                  >
                    {CAPACITY_OPTIONS.map((cap) => (
                      <option key={cap} value={cap}>{cap} Persons</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Total Area (sq.ft) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.areaSqft}
                    onChange={(e) => setFormData({ ...formData, areaSqft: Number(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 font-semibold"
                    placeholder="1000"
                  />
                </div>
              </div>

              {/* Year Established & Floor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Year Established (YYYY)
                  </label>
                  <input
                    type="number"
                    min={1900}
                    max={2030}
                    value={formData.yearEstablished}
                    onChange={(e) => setFormData({ ...formData, yearEstablished: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 font-semibold"
                    placeholder="e.g. 2018"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Floor
                  </label>
                  <div className="space-y-2">
                    <select
                      value={FLOOR_OPTIONS.includes(formData.floor) ? formData.floor : 'Other'}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, floor: val === 'Other' ? '' : val });
                      }}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 font-semibold"
                    >
                      {FLOOR_OPTIONS.map((fl) => (
                        <option key={fl} value={fl}>{fl}</option>
                      ))}
                    </select>
                    {(!['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor'].includes(formData.floor)) && (
                      <input
                        type="text"
                        value={formData.floor}
                        onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 font-semibold"
                        placeholder="Other: Specify floor (e.g. 4th Floor, Rooftop, Basement)..."
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Seating Arrangements (Multi-select) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Seating Arrangements Supported
                  </label>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
                    {(formData.seatingArrangements || []).length} Selected
                  </span>
                </div>
                <div className="p-3 bg-gray-50/80 dark:bg-slate-800/40 rounded-2xl border border-gray-200 dark:border-slate-700">
                  <div className="flex flex-wrap gap-2">
                    {SEATING_ARRANGEMENTS.map((seat) => {
                      const isSelected = (formData.seatingArrangements || []).includes(seat);
                      return (
                        <button
                          key={seat}
                          type="button"
                          onClick={() => {
                            const current = formData.seatingArrangements || [];
                            const updated = isSelected
                              ? current.filter((s) => s !== seat)
                              : [...current, seat];
                            setFormData({ ...formData, seatingArrangements: updated });
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-primary-600 border-primary-600 text-white shadow-xs scale-[1.02]'
                              : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-primary-400 hover:bg-gray-50'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-md flex items-center justify-center text-[10px] ${
                            isSelected ? 'bg-white/20 text-white' : 'border border-gray-400 text-transparent'
                          }`}>
                            ✓
                          </span>
                          {seat}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Venue Description (Max 200 words) *
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 focus:ring-2 focus:ring-primary-500"
                  placeholder="Describe your venue ambiance, highlights, perfect use-cases (weddings, meetings, birthdays)..."
                />
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveTab('Basic Info')}
                  disabled={savingTab}
                  className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold shadow-md cursor-pointer"
                >
                  {savingTab ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Basic Info</span>
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 2: ADDRESS & LOCATION (WITH GPS AUTO-DETECT & PHASE-1 PARKING)
             ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'location' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Complete Address *
                </label>
                <textarea
                  rows={2}
                  value={formData.location.address}
                  onChange={(e) => setFormData({
                    ...formData,
                    location: { ...formData.location, address: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Plot/Building No, Street, Landmark..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Landmark *</label>
                  <input
                    type="text"
                    value={formData.location.landmark}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, landmark: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                    placeholder="Near City Center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">State *</label>
                  <select
                    value={formData.location.state}
                    onChange={(e) => {
                      const selectedState = stateOptions.find(s => s.name === e.target.value);
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          state: e.target.value,
                          stateCode: selectedState ? selectedState.code : '',
                          city: ''
                        }
                      });
                    }}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="">Select State</option>
                    {stateOptions.map((s) => (
                      <option key={s.code} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">City *</label>
                  <select
                    value={formData.location.city}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, city: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="">Select City</option>
                    {cityOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Area / Locality *</label>
                  <input
                    type="text"
                    value={formData.location.area}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, area: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                    placeholder="e.g. MP Nagar Zone 2"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Village (Optional)</label>
                  <input
                    type="text"
                    value={formData.location.village}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, village: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                    placeholder="Village name (if applicable)"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Pincode *</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.location.pincode}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, pincode: e.target.value.replace(/\D/g, '') }
                    })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                    placeholder="462011"
                  />
                </div>
              </div>

              {/* Nearest Transport */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Nearest Bus / Auto Stand
                  </label>
                  <input
                    type="text"
                    value={formData.location.nearestBusAuto}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, nearestBusAuto: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                    placeholder="e.g. ISBT Bus Terminal - 1.5 KM"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Nearest Metro / Train Station
                  </label>
                  <input
                    type="text"
                    value={formData.location.nearestMetroTrain}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, nearestMetroTrain: e.target.value }
                    })}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                    placeholder="e.g. Bhopal Junction - 3.2 KM"
                  />
                </div>
              </div>

              {/* Google Map Link + Auto Detect Button */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Google Maps Link / GPS Coordinates *
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={formData.location.googleMapLink}
                    onChange={(e) => setFormData({
                      ...formData,
                      location: { ...formData.location, googleMapLink: e.target.value }
                    })}
                    className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                    placeholder="https://maps.google.com/..."
                  />
                  <button
                    type="button"
                    onClick={handleAutoDetectLocation}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-800 cursor-pointer transition-colors whitespace-nowrap"
                  >
                    <Locate className="w-4 h-4" />
                    <span>Auto-Detect GPS</span>
                  </button>
                </div>
              </div>

              {/* Parking Availability */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                    Parking Facility *
                  </label>
                  <span className="text-[11px] text-gray-500">Free, Paid, Limited or None</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {PARKING_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          parkingAvailability: opt,
                          parkingDetails: { ...formData.location.parkingDetails, type: opt }
                        }
                      })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        formData.location.parkingDetails.type === opt
                          ? 'bg-primary-600 border-primary-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-primary-300'
                      }`}
                    >
                      {opt} Parking
                    </button>
                  ))}
                </div>

                {(formData.location.parkingDetails.type === 'Free' || formData.location.parkingDetails.type === 'Limited') && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Cars Capacity</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.location.parkingDetails.carsCapacity}
                        onChange={(e) => setFormData({
                          ...formData,
                          location: {
                            ...formData.location,
                            parkingDetails: { ...formData.location.parkingDetails, carsCapacity: Number(e.target.value) || 0 }
                          }
                        })}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                        placeholder="e.g. 30 Cars"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Two Wheelers Capacity</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.location.parkingDetails.twoWheelerCapacity}
                        onChange={(e) => setFormData({
                          ...formData,
                          location: {
                            ...formData.location,
                            parkingDetails: { ...formData.location.parkingDetails, twoWheelerCapacity: Number(e.target.value) || 0 }
                          }
                        })}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                        placeholder="e.g. 60 Bikes"
                      />
                    </div>
                  </div>
                )}

                {formData.location.parkingDetails.type === 'Paid' && (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Car Charge (₹ / vehicle)</label>
                        <input
                          type="number"
                          min={0}
                          value={formData.location.parkingDetails.carCharges}
                          onChange={(e) => setFormData({
                            ...formData,
                            location: {
                              ...formData.location,
                              parkingDetails: { ...formData.location.parkingDetails, carCharges: Number(e.target.value) || 0 }
                            }
                          })}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 font-semibold"
                          placeholder="₹ 50"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Two Wheeler Charge (₹ / vehicle)</label>
                        <input
                          type="number"
                          min={0}
                          value={formData.location.parkingDetails.twoWheelerCharges}
                          onChange={(e) => setFormData({
                            ...formData,
                            location: {
                              ...formData.location,
                              parkingDetails: { ...formData.location.parkingDetails, twoWheelerCharges: Number(e.target.value) || 0 }
                            }
                          })}
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800 font-semibold"
                          placeholder="₹ 20"
                        />
                      </div>
                    </div>

                    {/* Note: Paid at venue notice */}
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300">
                      <span className="font-bold">ℹ️ Note:</span>
                      <span>
                        Paid parking charges will be collected directly at the venue during event. (Not charged online during customer booking).
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveTab('Location & Parking')}
                  disabled={savingTab}
                  className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold shadow-md cursor-pointer"
                >
                  {savingTab ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Address & Location</span>
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 3: AMENITIES (FREE / INCLUDED VS PAID)
             ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'amenities' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">Amenities & Facilities</h3>
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200">
                      Total {(formData.amenities.basic || []).length} Facilities
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Configure free included amenities or charge extra per service.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newAmenityName = prompt('Enter custom amenity name:');
                    if (newAmenityName && newAmenityName.trim()) {
                      setFormData({
                        ...formData,
                        amenities: {
                          basic: [
                            ...formData.amenities.basic,
                            { name: newAmenityName.trim(), category: 'Other', type: 'Included', rate: 0, rateType: 'Fixed' }
                          ]
                        }
                      });
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-300 text-xs font-bold border border-primary-200 dark:border-primary-800 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Custom Amenity</span>
                </button>
              </div>

              {/* 4 Categorized Sections matching prompt */}
              <div className="space-y-6">
                {['Basic Facilities', 'Meeting / Conference Facilities', 'Event Facilities', 'Food Facilities', 'Other'].map((cat) => {
                  const itemsWithOriginalIndices = formData.amenities.basic
                    .map((item, originalIndex) => ({ ...item, originalIndex }))
                    .filter((item) => {
                      if (cat === 'Other') {
                        return !['Basic Facilities', 'Meeting / Conference Facilities', 'Event Facilities', 'Food Facilities'].includes(item.category);
                      }
                      return item.category === cat;
                    });

                  if (itemsWithOriginalIndices.length === 0) return null;

                  return (
                    <div key={cat} className="space-y-3">
                      <div className="flex items-center gap-2 pt-2 border-b border-gray-200 dark:border-slate-800 pb-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                          {cat}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 font-bold">
                          {itemsWithOriginalIndices.length} Items
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {itemsWithOriginalIndices.map((amenity) => {
                          const idx = amenity.originalIndex;
                          return (
                            <div
                              key={idx}
                              className="p-3.5 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col justify-between gap-2.5 shadow-2xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                  {amenity.name}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = formData.amenities.basic.filter((_, i) => i !== idx);
                                    setFormData({ ...formData, amenities: { basic: updated } });
                                  }}
                                  className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                                  title="Remove amenity"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-slate-700/60">
                                <div className="flex rounded-lg bg-gray-100 dark:bg-slate-700 p-0.5 text-[11px] font-bold">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...formData.amenities.basic];
                                      updated[idx] = { ...updated[idx], type: 'Included', rate: 0 };
                                      setFormData({ ...formData, amenities: { basic: updated } });
                                    }}
                                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                                      amenity.type === 'Included'
                                        ? 'bg-green-600 text-white shadow-xs'
                                        : 'text-gray-600 dark:text-gray-300'
                                    }`}
                                  >
                                    Free / Included
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...formData.amenities.basic];
                                      updated[idx] = { ...updated[idx], type: 'Paid', rate: updated[idx].rate || 500 };
                                      setFormData({ ...formData, amenities: { basic: updated } });
                                    }}
                                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                                      amenity.type === 'Paid'
                                        ? 'bg-amber-600 text-white shadow-xs'
                                        : 'text-gray-600 dark:text-gray-300'
                                    }`}
                                  >
                                    Paid
                                  </button>
                                </div>

                                {amenity.type === 'Paid' && (
                                  <div className="flex items-center gap-1.5 flex-1 justify-end">
                                    <span className="text-xs text-gray-500">₹</span>
                                    <input
                                      type="number"
                                      min={0}
                                      value={amenity.rate}
                                      onChange={(e) => {
                                        const updated = [...formData.amenities.basic];
                                        updated[idx] = { ...updated[idx], rate: Number(e.target.value) || 0 };
                                        setFormData({ ...formData, amenities: { basic: updated } });
                                      }}
                                      className="w-20 px-2 py-1 text-xs rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 font-bold"
                                      placeholder="Rate"
                                    />
                                    <select
                                      value={amenity.rateType || 'Fixed'}
                                      onChange={(e) => {
                                        const updated = [...formData.amenities.basic];
                                        updated[idx] = { ...updated[idx], rateType: e.target.value };
                                        setFormData({ ...formData, amenities: { basic: updated } });
                                      }}
                                      className="px-2 py-1 text-[11px] rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700"
                                    >
                                      <option value="Fixed">Fixed</option>
                                      <option value="Per Use">Per Use</option>
                                    </select>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveTab('Amenities')}
                  disabled={savingTab}
                  className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold shadow-md cursor-pointer"
                >
                  {savingTab ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Amenities</span>
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 4: CATERING FACILITY (BEVERAGES, BREAKFAST, BUFFET & OUTSIDE)
             ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'catering' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-amber-50/70 dark:bg-slate-800/60 border border-amber-200 dark:border-slate-700">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">In-house Catering Services</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Specify meal items, buffet rates and outside catering permissions.
                  </p>
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.cateringFacility.outsideCateringAllowed}
                    onChange={(e) => setFormData({
                      ...formData,
                      cateringFacility: { ...formData.cateringFacility, outsideCateringAllowed: e.target.checked }
                    })}
                    className="rounded text-primary-600"
                  />
                  <span>Outside Catering Allowed</span>
                </label>
              </div>

              {/* 1. Beverages Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300 flex items-center gap-1.5">
                    <Coffee className="w-4 h-4" /> Beverages & Refreshments
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const name = prompt('Beverage Item Name:');
                      if (name && name.trim()) {
                        setFormData({
                          ...formData,
                          cateringFacility: {
                            ...formData.cateringFacility,
                            beverages: [...formData.cateringFacility.beverages, { name: name.trim(), available: true, ratePerUnit: 20 }]
                          }
                        });
                      }
                    }}
                    className="text-xs font-bold text-primary-600 hover:text-primary-700 cursor-pointer"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formData.cateringFacility.beverages.map((bev, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="checkbox"
                          checked={bev.available}
                          onChange={(e) => {
                            const updated = [...formData.cateringFacility.beverages];
                            updated[idx] = { ...updated[idx], available: e.target.checked };
                            setFormData({
                              ...formData,
                              cateringFacility: { ...formData.cateringFacility, beverages: updated }
                            });
                          }}
                          className="rounded text-primary-600"
                        />
                        <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{bev.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400">₹</span>
                        <input
                          type="number"
                          min={0}
                          value={bev.ratePerUnit}
                          onChange={(e) => {
                            const updated = [...formData.cateringFacility.beverages];
                            updated[idx] = { ...updated[idx], ratePerUnit: Number(e.target.value) || 0 };
                            setFormData({
                              ...formData,
                              cateringFacility: { ...formData.cateringFacility, beverages: updated }
                            });
                          }}
                          className="w-16 px-2 py-1 text-xs rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 font-bold"
                          placeholder="Rate"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.cateringFacility.beverages.filter((_, i) => i !== idx);
                            setFormData({
                              ...formData,
                              cateringFacility: { ...formData.cateringFacility, beverages: updated }
                            });
                          }}
                          className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Breakfast Packs Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                    Breakfast Menus
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const name = prompt('Breakfast Item Name:');
                      if (name && name.trim()) {
                        setFormData({
                          ...formData,
                          cateringFacility: {
                            ...formData.cateringFacility,
                            breakfast: [...formData.cateringFacility.breakfast, { name: name.trim(), available: true, ratePerPlate: 80, items: '' }]
                          }
                        });
                      }
                    }}
                    className="text-xs font-bold text-primary-600 hover:text-primary-700 cursor-pointer"
                  >
                    + Add Menu
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formData.cateringFacility.breakfast.map((bf, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={bf.available}
                            onChange={(e) => {
                              const updated = [...formData.cateringFacility.breakfast];
                              updated[idx] = { ...updated[idx], available: e.target.checked };
                              setFormData({
                                ...formData,
                                cateringFacility: { ...formData.cateringFacility, breakfast: updated }
                              });
                            }}
                            className="rounded text-primary-600"
                          />
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{bf.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-400">₹/Plate:</span>
                          <input
                            type="number"
                            min={0}
                            value={bf.ratePerPlate}
                            onChange={(e) => {
                              const updated = [...formData.cateringFacility.breakfast];
                              updated[idx] = { ...updated[idx], ratePerPlate: Number(e.target.value) || 0 };
                              setFormData({
                                ...formData,
                                cateringFacility: { ...formData.cateringFacility, breakfast: updated }
                              });
                            }}
                            className="w-16 px-2 py-1 text-xs rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 font-bold"
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        value={bf.items}
                        onChange={(e) => {
                          const updated = [...formData.cateringFacility.breakfast];
                          updated[idx] = { ...updated[idx], items: e.target.value };
                          setFormData({
                            ...formData,
                            cateringFacility: { ...formData.cateringFacility, breakfast: updated }
                          });
                        }}
                        className="w-full px-2.5 py-1 text-xs rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 text-gray-600"
                        placeholder="Included food items (comma separated)"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Lunch / Dinner Buffet Menus */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                    Lunch / Dinner Buffets
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      const name = prompt('Buffet Package Name:');
                      if (name && name.trim()) {
                        setFormData({
                          ...formData,
                          cateringFacility: {
                            ...formData.cateringFacility,
                            lunchDinner: [...formData.cateringFacility.lunchDinner, { name: name.trim(), available: true, foodType: 'Veg', ratePerPlate: 400, items: '' }]
                          }
                        });
                      }
                    }}
                    className="text-xs font-bold text-primary-600 hover:text-primary-700 cursor-pointer"
                  >
                    + Add Buffet
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.cateringFacility.lunchDinner.map((buffet, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={buffet.available}
                            onChange={(e) => {
                              const updated = [...formData.cateringFacility.lunchDinner];
                              updated[idx] = { ...updated[idx], available: e.target.checked };
                              setFormData({
                                ...formData,
                                cateringFacility: { ...formData.cateringFacility, lunchDinner: updated }
                              });
                            }}
                            className="rounded text-primary-600"
                          />
                          <span className="text-xs font-bold text-gray-900 dark:text-white">{buffet.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${buffet.foodType === 'Veg' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {buffet.foodType}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">₹/Plate:</span>
                          <input
                            type="number"
                            min={0}
                            value={buffet.ratePerPlate}
                            onChange={(e) => {
                              const updated = [...formData.cateringFacility.lunchDinner];
                              updated[idx] = { ...updated[idx], ratePerPlate: Number(e.target.value) || 0 };
                              setFormData({
                                ...formData,
                                cateringFacility: { ...formData.cateringFacility, lunchDinner: updated }
                              });
                            }}
                            className="w-20 px-2 py-1 text-xs rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.cateringFacility.lunchDinner.filter((_, i) => i !== idx);
                              setFormData({
                                ...formData,
                                cateringFacility: { ...formData.cateringFacility, lunchDinner: updated }
                              });
                            }}
                            className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={buffet.items}
                        onChange={(e) => {
                          const updated = [...formData.cateringFacility.lunchDinner];
                          updated[idx] = { ...updated[idx], items: e.target.value };
                          setFormData({
                            ...formData,
                            cateringFacility: { ...formData.cateringFacility, lunchDinner: updated }
                          });
                        }}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-slate-700 dark:bg-slate-800 text-gray-600"
                        placeholder="Buffet item list (Paneer sabzi, Dal, Roti, Rice, Sweet, etc.)"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveTab('Catering Facility')}
                  disabled={savingTab}
                  className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold shadow-md cursor-pointer"
                >
                  {savingTab ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Catering</span>
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 5: ADDITIONAL FACILITIES (ROOMS, LAWN, DJ, DECOR, VALET)
             ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'facilities' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Additional Facilities</h3>
                  <p className="text-xs text-gray-500">Rooms, lawn, DJ & sound setup, stage decoration, valet services.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const name = prompt('Facility Name:');
                    if (name && name.trim()) {
                      setFormData({
                        ...formData,
                        additionalFacilities: [
                          ...formData.additionalFacilities,
                          { name: name.trim(), available: true, type: 'Paid', charges: 1000, description: '' }
                        ]
                      });
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary-50 text-primary-600 text-xs font-bold border border-primary-200 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Facility</span>
                </button>
              </div>

              <div className="space-y-3">
                {formData.additionalFacilities.map((fac, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={fac.available}
                          onChange={(e) => {
                            const updated = [...formData.additionalFacilities];
                            updated[idx] = { ...updated[idx], available: e.target.checked };
                            setFormData({ ...formData, additionalFacilities: updated });
                          }}
                          className="rounded text-primary-600"
                        />
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{fac.name}</span>
                      </div>

                      {fac.available && (
                        <div className="flex items-center gap-2">
                          <div className="flex rounded-lg bg-gray-100 dark:bg-slate-700 p-0.5 text-[11px] font-bold">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...formData.additionalFacilities];
                                updated[idx] = { ...updated[idx], type: 'Included', charges: 0 };
                                setFormData({ ...formData, additionalFacilities: updated });
                              }}
                              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                                fac.type === 'Included'
                                  ? 'bg-green-600 text-white shadow-xs'
                                  : 'text-gray-600 dark:text-gray-300'
                              }`}
                            >
                              Free
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...formData.additionalFacilities];
                                updated[idx] = { ...updated[idx], type: 'Paid', charges: updated[idx].charges || 1000 };
                                setFormData({ ...formData, additionalFacilities: updated });
                              }}
                              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                                fac.type === 'Paid'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'text-gray-600 dark:text-gray-300'
                              }`}
                            >
                              Paid
                            </button>
                          </div>

                          {fac.type === 'Paid' && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-400">₹</span>
                              <input
                                type="number"
                                min={0}
                                value={fac.charges}
                                onChange={(e) => {
                                  const updated = [...formData.additionalFacilities];
                                  updated[idx] = { ...updated[idx], charges: Number(e.target.value) || 0 };
                                  setFormData({ ...formData, additionalFacilities: updated });
                                }}
                                className="w-24 px-2 py-1 text-xs rounded-lg border border-gray-300 dark:border-slate-600 dark:bg-slate-700 font-bold"
                                placeholder="Charges"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <input
                      type="text"
                      value={fac.description}
                      onChange={(e) => {
                        const updated = [...formData.additionalFacilities];
                        updated[idx] = { ...updated[idx], description: e.target.value };
                        setFormData({ ...formData, additionalFacilities: updated });
                      }}
                      className="w-full px-2.5 py-1 text-xs rounded-lg border border-gray-100 dark:border-slate-700 dark:bg-slate-800 text-gray-500"
                      placeholder="Notes / description (e.g., Timing restrictions, setup details...)"
                    />
                  </div>
                ))}
              </div>

              {/* Services Available (From Updates Doc) */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                    Services Available with Venue
                  </label>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800">
                    {(formData.servicesAvailable || []).length} Selected
                  </span>
                </div>
                <div className="p-3 bg-gray-50/80 dark:bg-slate-800/40 rounded-2xl border border-gray-200 dark:border-slate-700">
                  <div className="flex flex-wrap gap-2">
                    {SERVICES_AVAILABLE_OPTIONS.map((srv) => {
                      const isSelected = (formData.servicesAvailable || []).includes(srv);
                      return (
                        <button
                          key={srv}
                          type="button"
                          onClick={() => {
                            const current = formData.servicesAvailable || [];
                            const updated = isSelected
                              ? current.filter((s) => s !== srv)
                              : [...current, srv];
                            setFormData({ ...formData, servicesAvailable: updated });
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-primary-600 border-primary-600 text-white shadow-xs scale-[1.02]'
                              : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-primary-400 hover:bg-gray-50'
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded-md flex items-center justify-center text-[10px] ${
                            isSelected ? 'bg-white/20 text-white' : 'border border-gray-400 text-transparent'
                          }`}>
                            ✓
                          </span>
                          {srv}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveTab('Additional Facilities & Services')}
                  disabled={savingTab}
                  className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold shadow-md cursor-pointer"
                >
                  {savingTab ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Facilities & Services</span>
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 6: PRICING (ALL MODELS, OPERATING HOURS, ONLINE BOOKING SCHEDULE)
             ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'pricing' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Pricing Models Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Select Pricing Models *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {['Only Rent', 'Rent with Amenities', 'Per Pax'].map((model) => {
                    const isSelected = formData.pricing.selectedPricingModels.includes(model);
                    return (
                      <button
                        key={model}
                        type="button"
                        onClick={() => {
                          const exists = formData.pricing.selectedPricingModels.includes(model);
                          if (exists && formData.pricing.selectedPricingModels.length === 1) {
                            toast.error('At least 1 pricing model must be selected');
                            return;
                          }
                          const updated = exists
                            ? formData.pricing.selectedPricingModels.filter(m => m !== model)
                            : [...formData.pricing.selectedPricingModels, model];
                          setFormData({
                            ...formData,
                            pricing: { ...formData.pricing, selectedPricingModels: updated }
                          });
                        }}
                        className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-primary-600 bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 ring-1 ring-primary-500 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isSelected && '✓ '} {model}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 1. Only Rent Rates */}
              {formData.pricing.selectedPricingModels.includes('Only Rent') && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">Only Rent (Pure Space Rental) Rates</h4>
                    <span className="text-[11px] text-gray-500">Hourly, Half Day & Full Day</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Hourly Rate (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.pricing.onlyRent.hourly.rate}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: {
                            ...formData.pricing,
                            onlyRent: {
                              ...formData.pricing.onlyRent,
                              hourly: { ...formData.pricing.onlyRent.hourly, rate: Number(e.target.value) || 0 }
                            }
                          }
                        })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 font-bold"
                        placeholder="₹ 1000"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Half Day Rate (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.pricing.onlyRent.halfDay.rate}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: {
                            ...formData.pricing,
                            onlyRent: {
                              ...formData.pricing.onlyRent,
                              halfDay: { ...formData.pricing.onlyRent.halfDay, rate: Number(e.target.value) || 0 }
                            }
                          }
                        })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 font-bold"
                        placeholder="₹ 4000"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Full Day Rate (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.pricing.onlyRent.fullDay.rate}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: {
                            ...formData.pricing,
                            onlyRent: {
                              ...formData.pricing.onlyRent,
                              fullDay: { ...formData.pricing.onlyRent.fullDay, rate: Number(e.target.value) || 0 }
                            }
                          }
                        })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 font-bold"
                        placeholder="₹ 8000"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Rent with Amenities Rates */}
              {formData.pricing.selectedPricingModels.includes('Rent with Amenities') && (
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-800/40 border border-blue-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-blue-950 dark:text-blue-200">Rent with Amenities Package Rates</h4>
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">Includes standard venue amenities</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Hourly Rate (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.pricing.rentWithAmenities?.hourly?.rate || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: {
                            ...formData.pricing,
                            rentWithAmenities: {
                              ...formData.pricing.rentWithAmenities,
                              hourly: { ...formData.pricing.rentWithAmenities?.hourly, rate: Number(e.target.value) || 0 }
                            }
                          }
                        })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 font-bold"
                        placeholder="₹ 1500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Half Day Rate (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.pricing.rentWithAmenities?.halfDay?.rate || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: {
                            ...formData.pricing,
                            rentWithAmenities: {
                              ...formData.pricing.rentWithAmenities,
                              halfDay: { ...formData.pricing.rentWithAmenities?.halfDay, rate: Number(e.target.value) || 0 }
                            }
                          }
                        })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 font-bold"
                        placeholder="₹ 6000"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Full Day Rate (₹)</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.pricing.rentWithAmenities?.fullDay?.rate || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: {
                            ...formData.pricing,
                            rentWithAmenities: {
                              ...formData.pricing.rentWithAmenities,
                              fullDay: { ...formData.pricing.rentWithAmenities?.fullDay, rate: Number(e.target.value) || 0 }
                            }
                          }
                        })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 font-bold"
                        placeholder="₹ 12000"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Per Pax (Per Person) Meal Packages */}
              {formData.pricing.selectedPricingModels.includes('Per Pax') && (
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-slate-800/40 border border-emerald-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">Per Pax (Per Person) Meal Packages</h4>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Charges based on guest count</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { key: 'withoutFood', label: 'Without Food', defaultRate: 200 },
                      { key: 'breakfastOnly', label: 'Only Breakfast', defaultRate: 350 },
                      { key: 'breakfastLunch', label: 'Breakfast + Lunch', defaultRate: 600 },
                      { key: 'lunchOnly', label: 'Only Lunch', defaultRate: 450 },
                      { key: 'dinnerOnly', label: 'Only Dinner', defaultRate: 500 },
                      { key: 'allMeals', label: 'All Meals (B+L+D)', defaultRate: 850 }
                    ].map((pkg) => (
                      <div key={pkg.key} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-100 dark:border-slate-700 space-y-1.5">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{pkg.label}</span>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-[10px] text-gray-400">Rate / Pax (₹)</label>
                            <input
                              type="number"
                              min={0}
                              value={formData.pricing.perPax?.[pkg.key]?.rate || ''}
                              onChange={(e) => setFormData({
                                ...formData,
                                pricing: {
                                  ...formData.pricing,
                                  perPax: {
                                    ...formData.pricing.perPax,
                                    [pkg.key]: {
                                      ...formData.pricing.perPax?.[pkg.key],
                                      rate: Number(e.target.value) || 0
                                    }
                                  }
                                }
                              })}
                              className="w-full px-2 py-1 text-xs rounded-lg border border-gray-300 dark:border-slate-600 font-bold"
                              placeholder={`₹ ${pkg.defaultRate}`}
                            />
                          </div>
                          <div className="w-16">
                            <label className="block text-[10px] text-gray-400">Min Pax</label>
                            <input
                              type="number"
                              min={1}
                              value={formData.pricing.perPax?.[pkg.key]?.minPax || '25'}
                              onChange={(e) => setFormData({
                                ...formData,
                                pricing: {
                                  ...formData.pricing,
                                  perPax: {
                                    ...formData.pricing.perPax,
                                    [pkg.key]: {
                                      ...formData.pricing.perPax?.[pkg.key],
                                      minPax: Number(e.target.value) || 25
                                    }
                                  }
                                }
                              })}
                              className="w-full px-2 py-1 text-xs rounded-lg border border-gray-300 dark:border-slate-600"
                              placeholder="25"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Physical Venue Operating Hours */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Physical Venue Operating Hours</span>
                  </div>
                  {/* Quick Presets */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-gray-400 font-semibold">Presets:</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, pricing: { ...formData.pricing, openingTime: '09:00', closingTime: '18:00' } })}
                      className="px-2 py-0.5 text-[11px] font-semibold rounded bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 cursor-pointer"
                    >
                      9 AM – 6 PM
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, pricing: { ...formData.pricing, openingTime: '08:00', closingTime: '22:00' } })}
                      className="px-2 py-0.5 text-[11px] font-semibold rounded bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 cursor-pointer"
                    >
                      8 AM – 10 PM
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, pricing: { ...formData.pricing, openingTime: '00:00', closingTime: '23:59' } })}
                      className="px-2 py-0.5 text-[11px] font-semibold rounded bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 cursor-pointer"
                    >
                      24 Hours
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Opening Time</label>
                    <input
                      type="time"
                      value={formData.pricing.openingTime}
                      onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, openingTime: e.target.value } })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Closing Time</label>
                    <input
                      type="time"
                      value={formData.pricing.closingTime}
                      onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, closingTime: e.target.value } })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Online Booking Schedule (Accepting Online Bookings Window) */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/40 border border-indigo-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">Online Booking Schedule (Accepting Orders)</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-gray-400 font-semibold">Presets:</span>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, pricing: { ...formData.pricing, onlineBookingOpeningTime: '06:00', onlineBookingClosingTime: '02:00' } })}
                      className="px-2 py-0.5 text-[11px] font-semibold rounded bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 cursor-pointer"
                    >
                      6 AM – 2 AM Next Day
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, pricing: { ...formData.pricing, onlineBookingOpeningTime: '08:00', onlineBookingClosingTime: '23:00' } })}
                      className="px-2 py-0.5 text-[11px] font-semibold rounded bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 cursor-pointer"
                    >
                      8 AM – 11 PM
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Online Booking Opens</label>
                    <input
                      type="time"
                      value={formData.pricing.onlineBookingOpeningTime || '06:00'}
                      onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, onlineBookingOpeningTime: e.target.value } })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Online Booking Closes</label>
                    <input
                      type="time"
                      value={formData.pricing.onlineBookingClosingTime || '02:00'}
                      onChange={(e) => setFormData({ ...formData, pricing: { ...formData.pricing, onlineBookingClosingTime: e.target.value } })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* 6. Available Days */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Available Days *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map((day) => {
                    const isSelected = (formData.pricing.availableDays || []).includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const list = formData.pricing.availableDays || [];
                          const updated = isSelected ? list.filter(d => d !== day) : [...list, day];
                          setFormData({ ...formData, pricing: { ...formData.pricing, availableDays: updated } });
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-primary-600 border-primary-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-primary-300'
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 7. Minimum Advance Booking Required (Days & Weeks Selector) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Minimum Advance Booking Required *
                </label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[11px] font-bold text-gray-400 self-center mr-1">Days:</span>
                    {ADVANCE_DAYS.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setFormData({ ...formData, pricing: { ...formData.pricing, advanceBookingRule: d } })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          formData.pricing.advanceBookingRule === d
                            ? 'bg-primary-600 border-primary-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-primary-300'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[11px] font-bold text-gray-400 self-center mr-1">Weeks:</span>
                    {ADVANCE_WEEKS.map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setFormData({ ...formData, pricing: { ...formData.pricing, advanceBookingRule: w } })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          formData.pricing.advanceBookingRule === w
                            ? 'bg-primary-600 border-primary-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-primary-300'
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 8. Confirmation Hours */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Maximum Booking Request Confirmation Window
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { value: 0.5, label: '30 Min' },
                    { value: 1, label: '1 Hour' },
                    { value: 2, label: '2 Hours' },
                    { value: 3, label: '3 Hours' }
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, pricing: { ...formData.pricing, confirmationHours: item.value } })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        Number(formData.pricing.confirmationHours) === item.value
                          ? 'bg-primary-600 border-primary-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-primary-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 9. Taxes & GST Configuration (From Updates Doc) */}
              <div className="p-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-1">
                    Taxes & GST Application
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    Choose whether GST is included in rates, charged extra, or not applicable.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {['GST Included', 'GST Extra', 'GST Not Applicable'].map((tax) => (
                    <button
                      key={tax}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        taxSettings: { ...formData.taxSettings, taxType: tax }
                      })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        formData.taxSettings?.taxType === tax
                          ? 'bg-primary-600 border-primary-600 text-white shadow-xs'
                          : 'bg-gray-50 dark:bg-slate-700/60 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 hover:border-primary-300'
                      }`}
                    >
                      {tax}
                    </button>
                  ))}
                </div>

                {formData.taxSettings?.taxType !== 'GST Not Applicable' && (
                  <div className="flex items-center gap-3 pt-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300">GST Rate (%):</label>
                    <input
                      type="number"
                      min={0}
                      max={28}
                      value={formData.taxSettings?.gstRate ?? 18}
                      onChange={(e) => setFormData({
                        ...formData,
                        taxSettings: { ...formData.taxSettings, gstRate: Number(e.target.value) || 0 }
                      })}
                      className="w-24 px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-700 font-bold"
                      placeholder="18"
                    />
                    <span className="text-xs text-gray-400">%</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveTab('Pricing')}
                  disabled={savingTab}
                  className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold shadow-md cursor-pointer"
                >
                  {savingTab ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Pricing</span>
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 7: PHOTOS (AUTO-COMPRESSION < 5MB)
             ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'photos' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Venue Photographs</h3>
                  <p className="text-xs text-gray-500">
                    Supported: <span className="font-semibold">JPG, JPEG, PNG, WebP</span> • Max 5 MB (Auto-compressed).
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200 w-fit">
                  {formData.images.length} Photos Uploaded
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {PHOTO_SLOTS.map((slot) => {
                  const uploaded = formData.images.find((img) => img.category === slot.key);
                  return (
                    <div
                      key={slot.key}
                      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between min-h-[170px] ${
                        uploaded
                          ? 'border-green-300 bg-green-50/20 dark:bg-green-950/20'
                          : slot.required
                          ? 'border-amber-200 bg-amber-50/30 dark:bg-amber-950/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {slot.label}
                          </span>
                          {uploaded ? (
                            <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px]">
                              ✓
                            </span>
                          ) : (
                            slot.required && (
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                                Required
                              </span>
                            )
                          )}
                        </div>
                        <p className="text-[11px] text-gray-400">{slot.hint}</p>
                      </div>

                      {uploaded ? (
                        <div className="mt-3 relative group">
                          <img
                            src={uploaded.url}
                            alt={slot.key}
                            className="w-full h-24 object-cover rounded-xl border border-gray-200 dark:border-slate-700"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                images: formData.images.filter((img) => img.category !== slot.key)
                              });
                            }}
                            className="absolute top-1.5 right-1.5 p-1 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-md cursor-pointer"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="mt-3">
                          <label className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                            <Upload className="w-4 h-4 text-slate-400" />
                            <span>Upload Photo</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handlePhotoUpload(e, slot.key)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveTab('Photos')}
                  disabled={savingTab}
                  className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold shadow-md cursor-pointer"
                >
                  {savingTab ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Photos</span>
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 8: SOCIAL PAGES & VIDEO LINKS
             ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'social' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Social Media & Video Links</h3>
                <p className="text-xs text-gray-500">Add your Instagram, Facebook, and YouTube tour videos.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Instagram Profile / Post URL
                  </label>
                  <input
                    type="url"
                    value={formData.socialLinks.instagram}
                    onChange={(e) => setFormData({
                      ...formData,
                      socialLinks: { ...formData.socialLinks, instagram: e.target.value }
                    })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                    placeholder="https://instagram.com/yourvenue"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    Facebook Page URL
                  </label>
                  <input
                    type="url"
                    value={formData.socialLinks.facebook}
                    onChange={(e) => setFormData({
                      ...formData,
                      socialLinks: { ...formData.socialLinks, facebook: e.target.value }
                    })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                    placeholder="https://facebook.com/yourvenue"
                  />
                </div>
              </div>

              {/* YouTube Videos List (+ +) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-red-500" />
                    YouTube Video Links (+ +)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        socialLinks: {
                          ...formData.socialLinks,
                          youtube: [...(formData.socialLinks.youtube || []), '']
                        }
                      });
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-primary-600 hover:text-primary-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Video Link</span>
                  </button>
                </div>

                {(formData.socialLinks.youtube || ['']).map((yt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="url"
                      value={yt}
                      onChange={(e) => {
                        const updated = [...formData.socialLinks.youtube];
                        updated[idx] = e.target.value;
                        setFormData({
                          ...formData,
                          socialLinks: { ...formData.socialLinks, youtube: updated }
                        });
                      }}
                      className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                    {formData.socialLinks.youtube.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = formData.socialLinks.youtube.filter((_, i) => i !== idx);
                          setFormData({
                            ...formData,
                            socialLinks: { ...formData.socialLinks, youtube: updated }
                          });
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Official Website (Optional)
                </label>
                <input
                  type="url"
                  value={formData.socialLinks.website}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialLinks: { ...formData.socialLinks, website: e.target.value }
                  })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-slate-700 dark:bg-slate-800"
                  placeholder="https://yourvenue.com"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveTab('Social Links')}
                  disabled={savingTab}
                  className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold shadow-md cursor-pointer"
                >
                  {savingTab ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Social Pages</span>
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 9: DOCUMENTS (NO PAN CARD, CAMERA & GALLERY SELFIE OPTION)
             ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'documents' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Owner & Verification Documents</h3>
                <p className="text-xs text-gray-500">
                  Authorised Person details, Selfie, Aadhaar Card, Business Document and Bank Proof.
                  <span className="text-primary-600 font-semibold block mt-0.5">*(Note: Authorised person PAN card is not required).*</span>
                </p>
              </div>

              {/* Authorised Person */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Authorised Person Name *</label>
                  <input
                    type="text"
                    value={formData.ownerInfo.authorisedPerson?.fullName || formData.ownerInfo.fullName}
                    onChange={(e) => setFormData({
                      ...formData,
                      ownerInfo: {
                        ...formData.ownerInfo,
                        fullName: e.target.value,
                        authorisedPerson: { ...formData.ownerInfo.authorisedPerson, fullName: e.target.value, name: e.target.value }
                      }
                    })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 font-semibold"
                    placeholder="e.g. Rajesh Sharma"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={formData.ownerInfo.authorisedPerson?.phone || formData.ownerInfo.mobile}
                    onChange={(e) => setFormData({
                      ...formData,
                      ownerInfo: {
                        ...formData.ownerInfo,
                        mobile: e.target.value,
                        authorisedPerson: { ...formData.ownerInfo.authorisedPerson, phone: e.target.value, mobile: e.target.value }
                      }
                    })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 font-semibold"
                    placeholder="9876543210"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.ownerInfo.authorisedPerson?.email || formData.ownerInfo.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      ownerInfo: {
                        ...formData.ownerInfo,
                        email: e.target.value,
                        authorisedPerson: { ...formData.ownerInfo.authorisedPerson, email: e.target.value }
                      }
                    })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 dark:bg-slate-800 font-semibold"
                    placeholder="owner@gmail.com"
                  />
                </div>
              </div>

              {/* 1. Selfie Upload with Both Camera & Gallery Options */}
              <div className="p-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-primary-500" />
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Authorised Person Selfie *</span>
                  </div>
                  {formData.documents.selfieUrl && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">Uploaded ✓</span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {formData.documents.selfieUrl ? (
                    <div className="relative">
                      <img
                        src={formData.documents.selfieUrl}
                        alt="Selfie"
                        className="w-20 h-20 object-cover rounded-2xl border-2 border-green-500 shadow-sm"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-slate-700 border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                      <Camera className="w-6 h-6" />
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {/* Camera Capture Option */}
                    <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold cursor-pointer transition-colors">
                      <Camera className="w-3.5 h-3.5" />
                      <span>Take Photo (Camera)</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="user"
                        onChange={(e) => handleDocUpload(e, 'selfie')}
                        className="hidden"
                      />
                    </label>

                    {/* Gallery File Upload Option */}
                    <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-xs font-bold cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload from Gallery</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleDocUpload(e, 'selfie')}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* 2. Owner / Authorized Person ID Proof */}
              <div className="p-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Owner / Authorized Person ID *</span>
                    <select
                      value={formData.documents.idProof?.type || 'Aadhaar'}
                      onChange={(e) => setFormData({
                        ...formData,
                        documents: {
                          ...formData.documents,
                          idProof: { ...formData.documents.idProof, type: e.target.value }
                        }
                      })}
                      className="px-2.5 py-1 text-xs rounded-xl border border-gray-300 dark:border-slate-700 font-semibold"
                    >
                      <option value="Aadhaar">Aadhaar</option>
                      <option value="Driving Licence">Driving Licence</option>
                      <option value="Passport">Passport</option>
                      <option value="Voter ID">Voter ID</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <input
                    type="text"
                    value={formData.documents.idProof?.aadhaarNumber || formData.documents.idProof?.documentNumber || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      documents: {
                        ...formData.documents,
                        idProof: {
                          ...formData.documents.idProof,
                          aadhaarNumber: e.target.value,
                          documentNumber: e.target.value
                        }
                      }
                    })}
                    className="w-full sm:w-56 px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-slate-700 font-bold"
                    placeholder="Enter ID / Document Number"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Front / Document File</span>
                    {formData.documents.idProof?.aadhaarFrontUrl ? (
                      <span className="text-xs font-bold text-green-600">Uploaded ✓</span>
                    ) : (
                      <label className="px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-xs font-bold cursor-pointer hover:bg-primary-100">
                        Upload Front
                        <input type="file" accept="image/*,application/pdf" onChange={(e) => handleDocUpload(e, 'aadhaarFront')} className="hidden" />
                      </label>
                    )}
                  </div>

                  <div className="p-3 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Back Side (if applicable)</span>
                    {formData.documents.idProof?.aadhaarBackUrl ? (
                      <span className="text-xs font-bold text-green-600">Uploaded ✓</span>
                    ) : (
                      <label className="px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-xs font-bold cursor-pointer hover:bg-primary-100">
                        Upload Back
                        <input type="file" accept="image/*,application/pdf" onChange={(e) => handleDocUpload(e, 'aadhaarBack')} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. Business Documents */}
              <div className="p-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Business Documents</span>
                  <select
                    value={formData.documents.businessProof?.type || 'PAN Card'}
                    onChange={(e) => setFormData({
                      ...formData,
                      documents: {
                        ...formData.documents,
                        businessProof: { ...formData.documents.businessProof, type: e.target.value }
                      }
                    })}
                    className="px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-slate-700 font-semibold"
                  >
                    <option value="PAN Card">PAN Card</option>
                    <option value="GST Certificate">GST Certificate</option>
                    <option value="Business Registration">Business Registration</option>
                    <option value="Trade License">Trade License</option>
                    <option value="Partnership Deed">Partnership Deed</option>
                    <option value="Company Registration">Company Registration</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Attach Business Document (PDF/JPG)</span>
                  {formData.documents.businessProof?.documentUrl ? (
                    <span className="text-xs font-bold text-green-600">Uploaded ✓</span>
                  ) : (
                    <label className="px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-xs font-bold cursor-pointer hover:bg-primary-100">
                      Upload Document
                      <input type="file" accept="image/*,application/pdf" onChange={(e) => handleDocUpload(e, 'businessDoc')} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              {/* 4. Property / Venue Documents */}
              <div className="p-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Property / Venue Documents</span>
                  <select
                    value={formData.documents.propertyProof?.type || 'Ownership Proof'}
                    onChange={(e) => setFormData({
                      ...formData,
                      documents: {
                        ...formData.documents,
                        propertyProof: { ...formData.documents.propertyProof, type: e.target.value }
                      }
                    })}
                    className="px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-slate-700 font-semibold"
                  >
                    <option value="Ownership Proof">Ownership Proof</option>
                    <option value="Lease Agreement">Lease Agreement</option>
                    <option value="Rent Agreement">Rent Agreement</option>
                    <option value="Authorization Letter">Authorization Letter</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="p-3 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Attach Property Document (PDF/JPG)</span>
                  {formData.documents.propertyProof?.documentUrl ? (
                    <span className="text-xs font-bold text-green-600">Uploaded ✓</span>
                  ) : (
                    <label className="px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-xs font-bold cursor-pointer hover:bg-primary-100">
                      Upload Document
                      <input type="file" accept="image/*,application/pdf" onChange={(e) => handleDocUpload(e, 'propertyDoc')} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              {/* 5. Applicable Certificates */}
              <div className="p-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">Applicable Certificates</span>
                  <select
                    value={formData.documents.applicableCertificates?.type || 'Fire Safety Certificate'}
                    onChange={(e) => setFormData({
                      ...formData,
                      documents: {
                        ...formData.documents,
                        applicableCertificates: { ...formData.documents.applicableCertificates, type: e.target.value }
                      }
                    })}
                    className="px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-slate-700 font-semibold"
                  >
                    <option value="Fire Safety Certificate">Fire Safety Certificate</option>
                    <option value="FSSAI">FSSAI</option>
                    <option value="Hotel Registration">Hotel Registration</option>
                    <option value="Local Authority Permission">Local Authority Permission</option>
                    <option value="Other License">Other License</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                </div>

                {formData.documents.applicableCertificates?.type !== 'Not Applicable' && (
                  <div className="p-3 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Attach Certificate (PDF/JPG)</span>
                    {formData.documents.applicableCertificates?.documentUrl ? (
                      <span className="text-xs font-bold text-green-600">Uploaded ✓</span>
                    ) : (
                      <label className="px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-xs font-bold cursor-pointer hover:bg-primary-100">
                        Upload Certificate
                        <input type="file" accept="image/*,application/pdf" onChange={(e) => handleDocUpload(e, 'certificateDoc')} className="hidden" />
                      </label>
                    )}
                  </div>
                )}
              </div>

              {/* 6. Bank Details & Passbook / Cheque */}
              <div className="p-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
                <span className="text-xs font-bold text-gray-900 dark:text-white">Bank Account & Settlement Details *</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Account Holder</label>
                    <input
                      type="text"
                      value={formData.bankDetails.accountHolderName}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, accountHolderName: e.target.value }
                      })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-slate-700 font-semibold"
                      placeholder="Name on Bank Account"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={formData.bankDetails.accountNumber}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, accountNumber: e.target.value }
                      })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-slate-700 font-semibold"
                      placeholder="Account Number"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={formData.bankDetails.ifscCode}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, ifscCode: e.target.value.toUpperCase() }
                      })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-slate-700 font-bold uppercase"
                      placeholder="SBIN0001234"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 flex items-center justify-between">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Cancelled Cheque or Passbook Photo</span>
                  {formData.bankDetails.bankProofUrl ? (
                    <span className="text-xs font-bold text-green-600">Uploaded ✓</span>
                  ) : (
                    <label className="px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-xs font-bold cursor-pointer hover:bg-primary-100">
                      Upload Cheque / Passbook
                      <input type="file" accept="image/*,application/pdf" onChange={(e) => handleDocUpload(e, 'bankProof')} className="hidden" />
                    </label>
                  )}
                </div>
              </div>

              {/* 7. GST Certificate (Optional) */}
              <div className="p-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.ownerInfo.hasGST}
                      onChange={(e) => setFormData({
                        ...formData,
                        ownerInfo: { ...formData.ownerInfo, hasGST: e.target.checked }
                      })}
                      className="rounded text-primary-600"
                    />
                    <span>I have a GST Registration Number (Optional)</span>
                  </label>
                </div>

                {formData.ownerInfo.hasGST && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <input
                      type="text"
                      maxLength={15}
                      value={formData.ownerInfo.gstNumber}
                      onChange={(e) => setFormData({
                        ...formData,
                        ownerInfo: { ...formData.ownerInfo, gstNumber: e.target.value.toUpperCase() }
                      })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-slate-700 font-bold uppercase"
                      placeholder="15-digit GSTIN (e.g. 23AAAAA0000A1Z5)"
                    />
                    <label className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-700 border border-dashed border-gray-300 dark:border-slate-600 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{formData.ownerInfo.gstCertificateUrl ? 'GST Uploaded ✓' : 'Upload GST Certificate'}</span>
                      <input type="file" accept="image/*,application/pdf" onChange={(e) => handleDocUpload(e, 'gstCert')} className="hidden" />
                    </label>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleSaveTab('Documents')}
                  disabled={savingTab}
                  className="btn-primary flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold shadow-md cursor-pointer"
                >
                  {savingTab ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save Documents</span>
                </button>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════════════
              TAB 10: RULES, POLICIES & TERMS
             ════════════════════════════════════════════════════════════════════ */}
          {activeTab === 'terms' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* 1. Venue Rules & Policies (From Updates Doc) */}
              <div className="p-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">VENUE RULES & POLICIES</h3>
                  <p className="text-xs text-gray-500">Define customer usage policies for your venue.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Food Policy */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Food Policy</label>
                    <select
                      value={formData.rulesAndPolicies?.foodPolicy || 'Both Allowed'}
                      onChange={(e) => setFormData({
                        ...formData,
                        rulesAndPolicies: { ...formData.rulesAndPolicies, foodPolicy: e.target.value }
                      })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-slate-700 font-semibold"
                    >
                      <option value="In-house Catering Only">In-house Catering Only</option>
                      <option value="Outside Food Allowed">Outside Food Allowed</option>
                      <option value="Both Allowed">Both Allowed</option>
                      <option value="Subject to Approval">Subject to Approval</option>
                    </select>
                  </div>

                  {/* Outside Vendors */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Outside Vendors</label>
                    <select
                      value={formData.rulesAndPolicies?.outsideVendors || 'Allowed'}
                      onChange={(e) => setFormData({
                        ...formData,
                        rulesAndPolicies: { ...formData.rulesAndPolicies, outsideVendors: e.target.value }
                      })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-slate-700 font-semibold"
                    >
                      <option value="Allowed">Allowed</option>
                      <option value="Not Allowed">Not Allowed</option>
                      <option value="Allowed with Approval">Allowed with Approval</option>
                    </select>
                  </div>

                  {/* Decoration */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Decoration</label>
                    <select
                      value={formData.rulesAndPolicies?.decoration || 'Allowed'}
                      onChange={(e) => setFormData({
                        ...formData,
                        rulesAndPolicies: { ...formData.rulesAndPolicies, decoration: e.target.value }
                      })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-slate-700 font-semibold"
                    >
                      <option value="Allowed">Allowed</option>
                      <option value="Not Allowed">Not Allowed</option>
                      <option value="Allowed with Approval">Allowed with Approval</option>
                    </select>
                  </div>

                  {/* Music / Noise */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Music / Noise</label>
                    <select
                      value={formData.rulesAndPolicies?.musicNoise || 'Restricted'}
                      onChange={(e) => setFormData({
                        ...formData,
                        rulesAndPolicies: { ...formData.rulesAndPolicies, musicNoise: e.target.value }
                      })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-slate-700 font-semibold"
                    >
                      <option value="Allowed">Allowed</option>
                      <option value="Restricted">Restricted</option>
                      <option value="Not Allowed">Not Allowed</option>
                    </select>
                  </div>

                  {/* Alcohol Policy */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Alcohol</label>
                    <select
                      value={formData.rulesAndPolicies?.alcohol || 'Not Allowed'}
                      onChange={(e) => setFormData({
                        ...formData,
                        rulesAndPolicies: { ...formData.rulesAndPolicies, alcohol: e.target.value }
                      })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-slate-700 font-semibold"
                    >
                      <option value="Not Allowed">Not Allowed</option>
                      <option value="Allowed subject to applicable law/license">Allowed subject to applicable law/license</option>
                      <option value="Allowed with prior approval">Allowed with prior approval</option>
                    </select>
                  </div>

                  {/* Pets Policy */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Pets</label>
                    <select
                      value={formData.rulesAndPolicies?.pets || 'Not Allowed'}
                      onChange={(e) => setFormData({
                        ...formData,
                        rulesAndPolicies: { ...formData.rulesAndPolicies, pets: e.target.value }
                      })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-gray-300 dark:border-slate-700 font-semibold"
                    >
                      <option value="Allowed">Allowed</option>
                      <option value="Not Allowed">Not Allowed</option>
                      <option value="With Approval">With Approval</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. Cancellation Policy (From Updates Doc) */}
              <div className="p-4 rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">CANCELLATION POLICY</h3>
                    <p className="text-xs text-gray-500">Select standard policy or configure custom refund rules.</p>
                  </div>
                  <div className="flex gap-2">
                    {['Flexible', 'Moderate', 'Strict', 'Custom'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          cancellationPolicy: { ...formData.cancellationPolicy, policyType: p }
                        })}
                        className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          formData.cancellationPolicy?.policyType === p
                            ? 'bg-primary-600 border-primary-600 text-white shadow-xs'
                            : 'bg-gray-50 dark:bg-slate-700/60 border-gray-200 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {formData.cancellationPolicy?.policyType === 'Custom' && (
                  <div className="p-4 bg-gray-50 dark:bg-slate-700/40 rounded-xl space-y-3 pt-3">
                    <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wide">Custom Policy Tiers</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-600 space-y-1">
                        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400">Cancellation more than (days) before booking:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={formData.cancellationPolicy?.moreThanDays ?? 15}
                            onChange={(e) => setFormData({
                              ...formData,
                              cancellationPolicy: { ...formData.cancellationPolicy, moreThanDays: Number(e.target.value) || 0 }
                            })}
                            className="w-20 px-2 py-1 text-xs rounded-lg border font-bold"
                          />
                          <span>days → Refund:</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={formData.cancellationPolicy?.moreThanDaysRefund ?? 100}
                            onChange={(e) => setFormData({
                              ...formData,
                              cancellationPolicy: { ...formData.cancellationPolicy, moreThanDaysRefund: Number(e.target.value) || 0 }
                            })}
                            className="w-16 px-2 py-1 text-xs rounded-lg border font-bold"
                          />
                          <span>%</span>
                        </div>
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-600 space-y-1">
                        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400">Cancellation within (days) before booking:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={formData.cancellationPolicy?.withinDays ?? 7}
                            onChange={(e) => setFormData({
                              ...formData,
                              cancellationPolicy: { ...formData.cancellationPolicy, withinDays: Number(e.target.value) || 0 }
                            })}
                            className="w-20 px-2 py-1 text-xs rounded-lg border font-bold"
                          />
                          <span>days → Refund:</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={formData.cancellationPolicy?.withinDaysRefund ?? 50}
                            onChange={(e) => setFormData({
                              ...formData,
                              cancellationPolicy: { ...formData.cancellationPolicy, withinDaysRefund: Number(e.target.value) || 0 }
                            })}
                            className="w-16 px-2 py-1 text-xs rounded-lg border font-bold"
                          />
                          <span>%</span>
                        </div>
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-600 space-y-1">
                        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400">Cancellation within (hours) before booking:</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            value={formData.cancellationPolicy?.withinHours ?? 24}
                            onChange={(e) => setFormData({
                              ...formData,
                              cancellationPolicy: { ...formData.cancellationPolicy, withinHours: Number(e.target.value) || 0 }
                            })}
                            className="w-20 px-2 py-1 text-xs rounded-lg border font-bold"
                          />
                          <span>hours → Refund:</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={formData.cancellationPolicy?.withinHoursRefund ?? 20}
                            onChange={(e) => setFormData({
                              ...formData,
                              cancellationPolicy: { ...formData.cancellationPolicy, withinHoursRefund: Number(e.target.value) || 0 }
                            })}
                            className="w-16 px-2 py-1 text-xs rounded-lg border font-bold"
                          />
                          <span>%</span>
                        </div>
                      </div>

                      <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-600 space-y-1">
                        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400">No-show Refund:</label>
                        <div className="flex items-center gap-2">
                          <span>No-show → Refund:</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={formData.cancellationPolicy?.noShowRefund ?? 0}
                            onChange={(e) => setFormData({
                              ...formData,
                              cancellationPolicy: { ...formData.cancellationPolicy, noShowRefund: Number(e.target.value) || 0 }
                            })}
                            className="w-16 px-2 py-1 text-xs rounded-lg border font-bold"
                          />
                          <span>%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Dynamic Terms Agreement */}
              <div className="bg-primary-50 border-l-4 border-primary-500 rounded-2xl p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-primary-500 mr-2.5 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-dark-800">RentalMeet Partner Terms & Declaration</h3>
                    <p className="text-xs text-dark-600 mt-0.5">
                      Please read and confirm the legal declaration before submitting your venue for verification.
                    </p>
                  </div>
                </div>
              </div>

              {/* Scrollable Terms Container */}
              <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 max-h-56 overflow-y-auto shadow-inner">
                <h4 className="font-bold text-sm text-dark-800 dark:text-white mb-3">RentalMeet Venue Owner Agreement</h4>
                {loadingTerms ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap text-xs text-gray-700 dark:text-gray-300 font-sans leading-relaxed">
                    {termsText}
                  </pre>
                )}
              </div>

              {/* FINAL SUBMISSION Declaration Checkbox */}
              <div className="bg-slate-50 dark:bg-slate-800/70 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                <label className="flex items-start cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => setFormData({ ...formData, termsAccepted: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500 mt-0.5 mr-3 cursor-pointer"
                  />
                  <span className="text-xs text-gray-800 dark:text-gray-200 group-hover:text-primary-600 transition-colors font-medium">
                    I have reviewed all information and confirm that it is correct.
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveTab('Terms Draft')}
                    disabled={savingTab}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 hover:bg-gray-100 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    SAVE AS DRAFT
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('basic')}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-slate-700 hover:bg-gray-100 text-xs font-bold text-gray-700 dark:text-gray-300 cursor-pointer"
                  >
                    EDIT INFORMATION
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleSaveTab('Final Submit', true)}
                  disabled={savingTab || !formData.termsAccepted}
                  className={`px-8 py-3 rounded-2xl font-extrabold text-sm shadow-lg flex items-center gap-2 cursor-pointer transition-all ${
                    formData.termsAccepted && !savingTab
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-green-600/30 hover:scale-[1.02]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {savingTab ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  <span>SUBMIT FOR VERIFICATION 🚀</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          POST-SUBMISSION SUCCESS POPUP MODAL
         ════════════════════════════════════════════════════════════════════════ */}
      {submittedVenueData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl border border-gray-100 dark:border-slate-700 space-y-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-950/50 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-green-50 dark:ring-green-950/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold font-heading text-dark-800 dark:text-white">
                Venue Submitted Successfully!
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                Thank you for registering your venue with <span className="font-bold text-primary-600">RentalMeet</span>.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-600 text-left space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 dark:text-gray-400 font-semibold">Your Venue ID:</span>
                <span className="font-mono font-bold text-dark-800 dark:text-white text-sm bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border">
                  RMV-{(submittedVenueData.sku || submittedVenueData._id || 'PENDING').slice(-8).toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 dark:text-gray-400 font-semibold">Your listing is now:</span>
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 uppercase tracking-wide">
                  UNDER VERIFICATION
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed px-2">
              Our team will review your venue details and documents. You will receive a notification when your venue is approved and published.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href={`/venues/${submittedVenueData.sku || submittedVenueData._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl border border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 text-xs font-bold text-gray-700 dark:text-gray-200 transition-colors flex items-center justify-center gap-1.5"
              >
                VIEW VENUE
              </a>
              <button
                type="button"
                onClick={() => {
                  setSubmittedVenueData(null);
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-lg shadow-primary-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                GO TO VENUE DASHBOARD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
