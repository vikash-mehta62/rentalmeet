'use client';

import { useState, useEffect, useRef } from 'react';
import { State, City } from 'country-state-city';
import {
  X, Building2, MapPin, IndianRupee, Clock, Users,
  Check, Loader2, UserCheck, ShieldCheck, Sparkles, AlertCircle,
  FileCheck, Coffee, Utensils, Wifi, Shield, Lock, Navigation,
  Bus, Train, FileText, Camera, CreditCard,
  Download, Eye, Image as ImageIcon, Trash2, Plus, Star, Upload,
  ExternalLink, CheckCircle2, ChevronDown, AlertTriangle, PlayCircle,
  PauseCircle, ShieldAlert, RefreshCw, Car, Bike, Globe,
  UtensilsCrossed, Layers, Share2, Locate
} from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadToStorage, deleteFromStorage, uploadDocument } from '@/lib/storage';

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

const BUSINESS_PROOF_TYPES = [
  'Udyam Aadhaar (MSME)',
  'Gumasta (Shop & Establishment)',
  'Building Permission',
  'Fire NOC',
  'FSSAI Certificate',
  'Firm Registration',
  'Trade License',
  'Certificate of Incorporation',
  'Partnership Deed',
  'Other'
];

const PROPERTY_PROOF_TYPES = [
  'Electricity Bill',
  'Property Tax Receipt',
  'Rent / Lease Agreement',
  'Ownership Registry / Sale Deed',
  'NOC from Property Owner',
  'Other'
];

const REJECTION_REASONS = [
  'Incomplete or inaccurate venue information',
  'Poor quality images or missing required photos',
  'Pricing does not match platform or market standards',
  'Location or address details are invalid/unclear',
  'Amenities or capacity information is misleading',
  'Duplicate listing detected on platform',
  'Missing owner identification or property documents',
  'other'
];

const SUSPENSION_REASONS = [
  'Venue temporarily closed / Under renovation',
  'Owner requested temporary listing pause',
  'Quality or customer safety compliance issues reported',
  'Repeated booking rejections or communication failure',
  'Pricing dispute or unauthorized rate change',
  'Account verification / KYC compliance audit pending',
  'other'
];

const STOP_BOOKING_REASONS = [
  'Temporary maintenance / Renovation work in progress',
  'Venue owner requested pause on new online bookings',
  'High offline booking demand / Dates fully blocked',
  'Administrative review or safety verification hold',
  'Payment settlement or bank documentation pending',
  'other'
];

const DEFAULT_BASIC_AMENITIES = [
  // 1. Basic Facilities (18 Items)
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

  // 2. Meeting / Conference Facilities (15 Items)
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

  // 3. Event Facilities (16 Items)
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

  // 4. Food Facilities (8 Items)
  { name: 'In-house Catering', category: 'Food Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Outside Catering Allowed', category: 'Food Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Veg Only Kitchen', category: 'Food Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Non-Veg Allowed', category: 'Food Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Jain Food Available', category: 'Food Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Buffet Setup', category: 'Food Facilities', type: 'Included', rate: 0, rateType: 'Fixed' },
  { name: 'Live Counter Setup', category: 'Food Facilities', type: 'Paid', rate: 1500, rateType: 'Fixed' },
  { name: 'Bar / Mocktail Counter', category: 'Food Facilities', type: 'Paid', rate: 2500, rateType: 'Fixed' }
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

const PHOTO_CATEGORIES = [
  'Featured', 'Front / Entrance', 'Main Hall / Space', 'Additional Hall',
  'Seating Area', 'Stage', 'Dining Area', 'Kitchen', 'Bedroom',
  'Washroom', 'Parking', 'Garden / Lawn', 'Outdoor Area', 'Exterior',
  'Interior', 'Amenities', 'Other'
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
  { id: 'documents', label: '9. Documents & Proofs', icon: FileCheck },
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
          category: item.category || 'Other Facilities'
        });
      }
    }
  });

  return [...merged, ...customItems];
};

export default function AdminVenueQuickEditModal({
  venue,
  token,
  venueTypes = [],
  onClose,
  onSaveSuccess
}) {
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);

  // Status Changer & Stop Booking Admin States
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [statusModal, setStatusModal] = useState({ open: false, targetStatus: '', reason: '', customReason: '' });
  const [stopBookingModal, setStopBookingModal] = useState({ open: false, reason: '', customReason: '' });
  const statusMenuRef = useRef(null);

  // States & Cities from library
  const [indianStates, setIndianStates] = useState([]);
  const [citiesList, setCitiesList] = useState([]);

  // Upload States
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState({});
  const [uploadPhotoCategory, setUploadPhotoCategory] = useState('Front / Entrance');
  const [customAmenity, setCustomAmenity] = useState({ name: '', category: 'Basic Facilities', type: 'Included', rate: 0, rateType: 'Fixed' });

  // Initialize Indian States
  useEffect(() => {
    try {
      const states = State.getStatesOfCountry('IN');
      setIndianStates(states || []);
    } catch (_) {}
  }, []);

  // Form State initialized comprehensively from venue
  const [formData, setFormData] = useState({
    businessName: venue?.businessName || '',
    venueType: Array.isArray(venue?.venueType)
      ? venue.venueType
      : (venue?.venueType ? [venue.venueType] : ['Meeting Hall']),
    foodType: venue?.foodType || 'Veg',
    capacity: venue?.capacity || '50–100',
    areaSqft: venue?.areaSqft || 1000,
    yearEstablished: venue?.yearEstablished || '',
    floor: venue?.floor || 'Ground Floor',
    floorOther: (venue?.floor && !FLOOR_OPTIONS.includes(venue?.floor)) ? venue.floor : '',
    seatingArrangements: Array.isArray(venue?.seatingArrangements) ? venue.seatingArrangements : ['Banquet', 'Theatre'],
    servicesAvailable: Array.isArray(venue?.servicesAvailable) ? venue.servicesAvailable : ['Catering', 'Decor & Floral'],
    description: venue?.description || '',

    // Status & Booking Acceptance Control
    status: venue?.status || 'approved',
    rejectionReason: venue?.rejectionReason || '',
    suspensionReason: venue?.suspensionReason || '',
    statusReason: venue?.statusReason || '',
    isBookingStopped: venue?.isBookingStopped ?? false,
    stopBookingReason: venue?.stopBookingReason || '',
    stoppedBookingAt: venue?.stoppedBookingAt || null,

    // Location
    location: {
      address: venue?.location?.address || '',
      landmark: venue?.location?.landmark || '',
      state: venue?.location?.state || '',
      stateCode: venue?.location?.stateCode || '',
      city: venue?.location?.city || '',
      village: venue?.location?.village || '',
      area: venue?.location?.area || '',
      pincode: venue?.location?.pincode || '',
      googleMapLink: venue?.location?.googleMapLink || '',
      parkingAvailability: venue?.location?.parkingAvailability || venue?.location?.parkingType || 'Free',
      parkingDetails: {
        type: venue?.parkingDetails?.type || venue?.location?.parkingDetails?.type || venue?.location?.parkingAvailability || 'Free',
        carsCapacity: venue?.parkingDetails?.cars?.capacity || venue?.location?.parkingDetails?.carsCapacity || 20,
        twoWheelerCapacity: venue?.parkingDetails?.twoWheelers?.capacity || venue?.location?.parkingDetails?.twoWheelerCapacity || 50,
        carCharges: venue?.parkingDetails?.cars?.chargePerVehicle || venue?.location?.parkingDetails?.carCharges || 0,
        twoWheelerCharges: venue?.parkingDetails?.twoWheelers?.chargePerVehicle || venue?.location?.parkingDetails?.twoWheelerCharges || 0,
        valetAvailable: venue?.parkingDetails?.valetAvailable ?? (venue?.location?.parkingDetails?.valetParking || false)
      },
      nearestBusAuto: venue?.location?.nearestBusAuto || venue?.location?.nearestBusStop || '',
      nearestBusStop: venue?.location?.nearestBusStop || venue?.location?.nearestBusAuto || '',
      nearestMetroTrain: venue?.location?.nearestMetroTrain || venue?.location?.nearestMetro || '',
      nearestMetro: venue?.location?.nearestMetro || venue?.location?.nearestMetroTrain || '',
      nearestRailway: venue?.location?.nearestRailway || ''
    },

    // Amenities (4 categorized groups)
    amenities: {
      basic: mergeAmenitiesWithDefaults(venue?.amenities?.basic || []),
      beverages: venue?.amenities?.beverages || DEFAULT_BEVERAGES,
      refreshmentFood: venue?.amenities?.refreshmentFood || DEFAULT_BREAKFAST,
      lunchThalis: venue?.amenities?.lunchThalis || []
    },

    // Catering
    catering: venue?.catering || {
      available: true,
      outsideCateringAllowed: true,
      beverages: DEFAULT_BEVERAGES,
      breakfast: DEFAULT_BREAKFAST,
      lunchDinner: DEFAULT_LUNCH_DINNER
    },

    // Additional Facilities
    additionalFacilities: venue?.additionalFacilities || DEFAULT_ADDITIONAL_FACILITIES,

    // Pricing & Taxes
    pricing: {
      perHour: {
        weekday: venue?.pricing?.perHour?.weekday ?? 1000,
        weekend: venue?.pricing?.perHour?.weekend ?? 1200
      },
      halfDay: {
        weekday: venue?.pricing?.halfDay?.weekday ?? 4000,
        weekend: venue?.pricing?.halfDay?.weekend ?? 4800
      },
      fullDay: {
        weekday: venue?.pricing?.fullDay?.weekday ?? 8000,
        weekend: venue?.pricing?.fullDay?.weekend ?? 9500
      },
      extraHourRate: {
        weekday: venue?.pricing?.extraHourRate?.weekday ?? 500,
        weekend: venue?.pricing?.extraHourRate?.weekend ?? 600
      },
      availableDays: venue?.pricing?.availableDays || venue?.availability?.availableDays || DAYS_OF_WEEK,
      advanceBookingRule: venue?.pricing?.advanceBookingRule || venue?.availability?.advanceBookingRule || '1 Day',
      confirmationHours: venue?.pricing?.confirmationHours ?? venue?.availability?.confirmationHours ?? 3
    },

    availability: {
      openingTime: venue?.availability?.openingTime || venue?.pricing?.openingTime || '09:00',
      closingTime: venue?.availability?.closingTime || venue?.pricing?.closingTime || '22:00',
      advanceBookingRule: venue?.availability?.advanceBookingRule || venue?.pricing?.advanceBookingRule || '1 Day',
      confirmationHours: venue?.availability?.confirmationHours ?? venue?.pricing?.confirmationHours ?? 3,
      availableDays: venue?.availability?.availableDays || venue?.pricing?.availableDays || DAYS_OF_WEEK,
      onlineBookingSchedule: {
        enabled: venue?.availability?.onlineBookingSchedule?.enabled ?? true,
        openingTime: venue?.availability?.onlineBookingSchedule?.openingTime || venue?.pricing?.onlineBookingOpeningTime || '06:00',
        closingTime: venue?.availability?.onlineBookingSchedule?.closingTime || venue?.pricing?.onlineBookingClosingTime || '02:00'
      }
    },

    // Taxes
    taxSettings: {
      gstType: venue?.taxSettings?.gstType || (venue?.ownerInfo?.hasGST ? 'Extra (Exclusive)' : 'Not Applicable'),
      gstRate: venue?.taxSettings?.gstRate ?? 18,
      gstin: venue?.taxSettings?.gstin || venue?.ownerInfo?.gstNumber || venue?.documents?.gstNumber || ''
    },

    // Photos
    images: Array.isArray(venue?.images) ? venue.images : [],

    // Social Links
    socialLinks: {
      website: venue?.socialLinks?.website || '',
      facebook: venue?.socialLinks?.facebook || '',
      instagram: venue?.socialLinks?.instagram || '',
      youtube: venue?.socialLinks?.youtube || '',
      virtualTour: venue?.socialLinks?.virtualTour || '',
      contactMobile: venue?.socialLinks?.contactMobile || venue?.ownerInfo?.mobile || '',
      alternateMobile: venue?.socialLinks?.alternateMobile || venue?.ownerInfo?.alternatePhone || '',
      contactEmail: venue?.socialLinks?.contactEmail || venue?.ownerInfo?.email || ''
    },

    // Owner & Authorised Person
    ownerInfo: {
      fullName: venue?.ownerInfo?.fullName || venue?.owner?.name || '',
      email: venue?.ownerInfo?.email || venue?.owner?.email || '',
      mobile: venue?.ownerInfo?.mobile || venue?.owner?.phone || '',
      alternatePhone: venue?.ownerInfo?.alternatePhone || '',
      role: venue?.ownerInfo?.role || 'Owner',
      hasGST: venue?.ownerInfo?.hasGST ?? (venue?.documents?.hasGST || false),
      gstNumber: venue?.ownerInfo?.gstNumber || venue?.documents?.gstNumber || '',
      authorisedPerson: {
        fullName: venue?.ownerInfo?.authorisedPerson?.fullName || venue?.ownerInfo?.authorisedPerson?.name || '',
        name: venue?.ownerInfo?.authorisedPerson?.name || venue?.ownerInfo?.authorisedPerson?.fullName || '',
        designation: venue?.ownerInfo?.authorisedPerson?.designation || venue?.ownerInfo?.authorisedPerson?.role || 'Venue Owner / Proprietor',
        role: venue?.ownerInfo?.authorisedPerson?.role || venue?.ownerInfo?.authorisedPerson?.designation || 'Venue Owner / Proprietor',
        mobile: venue?.ownerInfo?.authorisedPerson?.mobile || venue?.ownerInfo?.authorisedPerson?.phone || '',
        phone: venue?.ownerInfo?.authorisedPerson?.phone || venue?.ownerInfo?.authorisedPerson?.mobile || '',
        alternatePhone: venue?.ownerInfo?.authorisedPerson?.alternatePhone || '',
        email: venue?.ownerInfo?.authorisedPerson?.email || ''
      }
    },

    // Documents (4 Categories)
    documents: {
      idProof: {
        type: venue?.documents?.idProof?.type || 'Both',
        number: venue?.documents?.idProof?.number || venue?.documents?.idProof?.aadhaarNumber || '',
        aadhaarNumber: venue?.documents?.idProof?.aadhaarNumber || venue?.documents?.idProof?.number || '',
        aadhaarFrontUrl: venue?.documents?.idProof?.aadhaarFrontUrl || venue?.documents?.idProof?.frontUrl || '',
        aadhaarBackUrl: venue?.documents?.idProof?.aadhaarBackUrl || venue?.documents?.idProof?.backUrl || '',
        panNumber: venue?.documents?.idProof?.panNumber || '',
        panUrl: venue?.documents?.idProof?.panUrl || ''
      },
      selfieUrl: venue?.documents?.selfieUrl || '',
      businessProof: {
        type: venue?.documents?.businessProof?.type || 'Udyam Aadhaar (MSME)',
        otherSpecify: venue?.documents?.businessProof?.otherSpecify || '',
        documentUrl: venue?.documents?.businessProof?.documentUrl || venue?.documents?.businessProof?.url || ''
      },
      propertyProof: {
        type: venue?.documents?.propertyProof?.type || 'Electricity Bill',
        otherSpecify: venue?.documents?.propertyProof?.otherSpecify || '',
        documentUrl: venue?.documents?.propertyProof?.documentUrl || venue?.documents?.propertyProof?.url || ''
      },
      applicableCertificates: {
        fireNOCUrl: venue?.documents?.applicableCertificates?.fireNOCUrl || venue?.documents?.fireNOC?.url || '',
        fssaiUrl: venue?.documents?.applicableCertificates?.fssaiUrl || venue?.documents?.fssai?.url || '',
        tradeLicenseUrl: venue?.documents?.applicableCertificates?.tradeLicenseUrl || '',
        pollutionCertificateUrl: venue?.documents?.applicableCertificates?.pollutionCertificateUrl || ''
      },
      hasGST: venue?.documents?.hasGST ?? venue?.ownerInfo?.hasGST ?? false,
      gstNumber: venue?.documents?.gstNumber || venue?.ownerInfo?.gstNumber || '',
      gstDocUrl: venue?.documents?.gstDocUrl || venue?.ownerInfo?.gstCertificateUrl || '',
      fireNOC: { url: venue?.documents?.fireNOC?.url || '' },
      fssai: { url: venue?.documents?.fssai?.url || '' }
    },

    // Bank Details
    bankDetails: {
      accountHolderName: venue?.bankDetails?.accountHolderName || '',
      accountNumber: venue?.bankDetails?.accountNumber || '',
      ifscCode: venue?.bankDetails?.ifscCode || '',
      bankName: venue?.bankDetails?.bankName || '',
      branchName: venue?.bankDetails?.branchName || '',
      accountType: venue?.bankDetails?.accountType || 'Current',
      bankProofUrl: venue?.bankDetails?.bankProofUrl || ''
    },

    // Rules & Policies
    rulesAndPolicies: {
      alcoholAllowed: venue?.rulesAndPolicies?.alcoholAllowed ?? false,
      smokingAllowed: venue?.rulesAndPolicies?.smokingAllowed ?? false,
      outsideFoodAllowed: venue?.rulesAndPolicies?.outsideFoodAllowed ?? true,
      musicDeadline: venue?.rulesAndPolicies?.musicDeadline || '10:00 PM',
      firecrackersAllowed: venue?.rulesAndPolicies?.firecrackersAllowed ?? false,
      petFriendly: venue?.rulesAndPolicies?.petFriendly ?? false,
      customRules: venue?.rulesAndPolicies?.customRules || ''
    },

    // 4-Tier Cancellation Policy
    cancellationPolicy: {
      tier1: { days: venue?.cancellationPolicy?.tier1?.days ?? 7, refundPercent: venue?.cancellationPolicy?.tier1?.refundPercent ?? 100 },
      tier2: { days: venue?.cancellationPolicy?.tier2?.days ?? 3, refundPercent: venue?.cancellationPolicy?.tier2?.refundPercent ?? 50 },
      tier3: { hours: venue?.cancellationPolicy?.tier3?.hours ?? 24, refundPercent: venue?.cancellationPolicy?.tier3?.refundPercent ?? 0 },
      tier4: { refundPercent: venue?.cancellationPolicy?.tier4?.refundPercent ?? 0 }
    },

    // Custom Admin Settings
    customPlatformFee: {
      enabled: venue?.customPlatformFee?.enabled ?? false,
      feeType: venue?.customPlatformFee?.feeType || 'percentage',
      feeValue: venue?.customPlatformFee?.feeValue ?? (venue?.customPlatformFee?.percentage || 0)
    },
    customGST: {
      enabled: venue?.customGST?.enabled ?? false,
      rate: venue?.customGST?.rate ?? 18,
      cgstRate: venue?.customGST?.cgstRate ?? 9,
      sgstRate: venue?.customGST?.sgstRate ?? 9,
      hsnCode: venue?.customGST?.hsnCode || '9973'
    }
  });

  // Populate Cities when state changes
  useEffect(() => {
    if (formData.location.stateCode) {
      try {
        const cities = City.getCitiesOfState('IN', formData.location.stateCode);
        setCitiesList(cities || []);
      } catch (_) {
        setCitiesList([]);
      }
    }
  }, [formData.location.stateCode]);

  // Status Changer Execution
  const handleSelectStatus = (targetStatus) => {
    setStatusMenuOpen(false);
    if (targetStatus === 'rejected' || targetStatus === 'suspended') {
      setStatusModal({ open: true, targetStatus, reason: '', customReason: '' });
    } else {
      setFormData(prev => ({
        ...prev,
        status: targetStatus,
        rejectionReason: '',
        suspensionReason: '',
        statusReason: ''
      }));
      toast.success(`Status set to ${targetStatus.toUpperCase()}`);
    }
  };

  const confirmStatusChange = () => {
    const finalReason = statusModal.reason === 'other' ? statusModal.customReason : statusModal.reason;
    if (!finalReason) {
      toast.error('Please specify a reason');
      return;
    }
    setFormData(prev => ({
      ...prev,
      status: statusModal.targetStatus,
      rejectionReason: statusModal.targetStatus === 'rejected' ? finalReason : '',
      suspensionReason: statusModal.targetStatus === 'suspended' ? finalReason : '',
      statusReason: finalReason
    }));
    setStatusModal({ open: false, targetStatus: '', reason: '', customReason: '' });
    toast.success(`Status updated to ${statusModal.targetStatus.toUpperCase()}`);
  };

  const confirmStopBooking = () => {
    const finalReason = stopBookingModal.reason === 'other' ? stopBookingModal.customReason : stopBookingModal.reason;
    if (!finalReason) {
      toast.error('Please specify a reason to pause bookings');
      return;
    }
    setFormData(prev => ({
      ...prev,
      isBookingStopped: true,
      stopBookingReason: finalReason,
      stoppedBookingAt: new Date()
    }));
    setStopBookingModal({ open: false, reason: '', customReason: '' });
    toast.success('Online bookings paused');
  };

  const resumeBooking = () => {
    setFormData(prev => ({
      ...prev,
      isBookingStopped: false,
      stopBookingReason: '',
      stoppedBookingAt: null
    }));
    toast.success('Online bookings resumed');
  };

  // Image upload
  const handleImageFilesUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if ((formData.images?.length || 0) + files.length > 30) {
      toast.error('Maximum 30 photos allowed per venue');
      return;
    }

    setUploadingImages(true);
    const newImages = [...(formData.images || [])];

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 10MB`);
        continue;
      }
      try {
        toast.loading(`Uploading ${file.name}...`, { id: file.name });
        const res = await uploadToStorage(file, `venues/${venue._id || 'temp'}`);
        newImages.push({
          url: res.url,
          publicId: res.publicId || null,
          category: uploadPhotoCategory,
          isFeatured: newImages.length === 0
        });
        toast.success(`${file.name} uploaded! ✅`, { id: file.name });
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`, { id: file.name });
      }
    }

    setFormData(prev => ({ ...prev, images: newImages }));
    setUploadingImages(false);
  };

  const handleRemoveImage = async (index) => {
    const img = formData.images[index];
    try {
      if (img?.publicId) {
        await deleteFromStorage(img.publicId).catch(() => {});
      }
    } catch (_) {}
    setFormData(prev => {
      const updated = [...(prev.images || [])];
      const removed = updated.splice(index, 1)[0];
      if (removed?.isFeatured && updated.length > 0) {
        updated[0] = { ...updated[0], isFeatured: true };
      }
      return { ...prev, images: updated };
    });
    toast.success('Photo removed');
  };

  const handleSetFeaturedImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).map((img, i) => ({
        ...img,
        isFeatured: i === index,
        category: i === index ? 'Featured' : (img.category === 'Featured' ? 'Front / Entrance' : img.category)
      }))
    }));
    toast.success('Featured cover photo updated! ⭐');
  };

  const handleDocFileUpload = async (file, docKey, updateFn) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error(`${file.name} is larger than 10MB`);
      return;
    }
    setUploadingDoc(prev => ({ ...prev, [docKey]: true }));
    try {
      toast.loading(`Uploading ${file.name}...`, { id: docKey });
      const res = await uploadDocument(file, 'documents');
      updateFn(res.url);
      toast.success(`${file.name} uploaded successfully! ✅`, { id: docKey });
    } catch (err) {
      toast.error(`Upload failed: ${err.message || 'Error'}`, { id: docKey });
    } finally {
      setUploadingDoc(prev => ({ ...prev, [docKey]: false }));
    }
  };

  // Submit Quick Edit
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const finalFloor = formData.floor === 'Other' ? (formData.floorOther || 'Other') : formData.floor;

      const payload = {
        ...formData,
        floor: finalFloor,
        images: formData.images || [],
        documents: {
          ...formData.documents,
          businessProof: {
            type: formData.documents.businessProof?.type || 'Udyam Aadhaar (MSME)',
            otherSpecify: formData.documents.businessProof?.otherSpecify || '',
            documentUrl: formData.documents.businessProof?.documentUrl || ''
          },
          propertyProof: {
            type: formData.documents.propertyProof?.type || 'Electricity Bill',
            otherSpecify: formData.documents.propertyProof?.otherSpecify || '',
            documentUrl: formData.documents.propertyProof?.documentUrl || ''
          }
        }
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/venues/${venue._id}/quick-edit`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Venue updated successfully! ✅');
        if (onSaveSuccess) {
          onSaveSuccess(data.venue);
        }
        onClose();
      } else {
        toast.error(data.message || 'Failed to update venue');
      }
    } catch (err) {
      console.error('Quick edit error:', err);
      toast.error('Failed to update venue');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[94vh] overflow-hidden flex flex-col relative border border-slate-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-600/30 border border-primary-500/40 text-primary-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold tracking-tight">{formData.businessName || 'Venue Quick Edit'}</h2>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  formData.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  formData.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                  formData.status === 'rejected' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  formData.status === 'resubmitted' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                  'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {formData.status}
                </span>
                {formData.isBookingStopped ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold inline-flex items-center gap-1">
                    <PauseCircle className="w-3 h-3" /> Bookings Paused
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold inline-flex items-center gap-1">
                    <PlayCircle className="w-3 h-3" /> Bookings Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Admin Full Management & Quick Editor • SKU: {venue.sku || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Selector Dropdown */}
            <div className="relative" ref={statusMenuRef}>
              <button
                type="button"
                onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Set Status</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {statusMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white text-gray-900 rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 text-xs">
                  <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    Change Venue Status
                  </div>
                  <button
                    onClick={() => handleSelectStatus('approved')}
                    className="w-full text-left px-3 py-2 hover:bg-green-50 text-green-700 font-semibold flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Approve Venue
                  </button>
                  <button
                    onClick={() => handleSelectStatus('suspended')}
                    className="w-full text-left px-3 py-2 hover:bg-amber-50 text-amber-700 font-semibold flex items-center gap-2"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Suspend (Reason)
                  </button>
                  <button
                    onClick={() => handleSelectStatus('rejected')}
                    className="w-full text-left px-3 py-2 hover:bg-red-50 text-red-700 font-semibold flex items-center gap-2"
                  >
                    <X className="w-3.5 h-3.5 text-red-600" /> Reject (Reason)
                  </button>
                  <button
                    onClick={() => handleSelectStatus('pending')}
                    className="w-full text-left px-3 py-2 hover:bg-yellow-50 text-yellow-800 font-semibold flex items-center gap-2"
                  >
                    <Clock className="w-3.5 h-3.5 text-yellow-600" /> Mark Pending
                  </button>
                  <button
                    onClick={() => handleSelectStatus('resubmitted')}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 text-blue-700 font-semibold flex items-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600" /> Mark Resubmitted
                  </button>
                </div>
              )}
            </div>

            {/* Toggle Booking Button */}
            {formData.isBookingStopped ? (
              <button
                type="button"
                onClick={resumeBooking}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <PlayCircle className="w-3.5 h-3.5" /> Allow Booking
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStopBookingModal({ open: true, reason: '', customReason: '' })}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <PauseCircle className="w-3.5 h-3.5" /> Stop Booking
              </button>
            )}

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-1.5 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{saving ? 'Saving...' : 'Save All'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 10 Navigation Tabs */}
        <div className="border-b border-gray-200 bg-slate-50 px-3 overflow-x-auto flex-shrink-0">
          <div className="flex gap-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 font-bold text-xs transition-all whitespace-nowrap ${
                    isActive
                      ? 'border-b-2 border-primary-600 text-primary-700 bg-white -mb-px shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary-600' : 'text-gray-500'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-700 block mb-1">Business Name *</label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl font-semibold"
                    placeholder="e.g. Royal Palace Banquet & Lawns"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Food Type *</label>
                  <select
                    value={formData.foodType}
                    onChange={(e) => setFormData({ ...formData, foodType: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                  >
                    {FOOD_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Guest Capacity *</label>
                  <select
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                  >
                    {CAPACITY_OPTIONS.map(c => <option key={c} value={c}>{c} guests</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Total Space Area (sq.ft) *</label>
                  <input
                    type="number"
                    value={formData.areaSqft}
                    onChange={(e) => setFormData({ ...formData, areaSqft: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Year Established</label>
                  <input
                    type="number"
                    value={formData.yearEstablished}
                    onChange={(e) => setFormData({ ...formData, yearEstablished: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                    placeholder="e.g. 2018"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Floor Level</label>
                  <select
                    value={FLOOR_OPTIONS.includes(formData.floor) ? formData.floor : 'Other'}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                  >
                    {FLOOR_OPTIONS.map(fl => <option key={fl} value={fl}>{fl}</option>)}
                  </select>
                </div>

                {formData.floor === 'Other' && (
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Specify Custom Floor</label>
                    <input
                      type="text"
                      value={formData.floorOther}
                      onChange={(e) => setFormData({ ...formData, floorOther: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                      placeholder="e.g. 4th Floor / Rooftop"
                    />
                  </div>
                )}
              </div>

              {/* Venue Categories (Multi-select) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="text-xs font-bold text-slate-900 block mb-2">Venue Categories (Select all that apply) *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {VENUE_CATEGORIES.map((cat) => {
                    const selected = formData.venueType.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          const current = formData.venueType;
                          const next = selected ? current.filter(c => c !== cat) : [...current, cat];
                          setFormData({ ...formData, venueType: next.length > 0 ? next : [cat] });
                        }}
                        className={`p-2 rounded-lg text-xs font-bold text-left transition-all border ${
                          selected
                            ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Seating Arrangements (Multi-select) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <label className="text-xs font-bold text-slate-900 block mb-2 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary-600" />
                  Seating Arrangements Supported
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {SEATING_ARRANGEMENTS.map((seat) => {
                    const selected = (formData.seatingArrangements || []).includes(seat);
                    return (
                      <label key={seat} className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                        selected ? 'bg-primary-50 border-primary-300 text-primary-900' : 'bg-white border-gray-200 text-gray-700'
                      }`}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            const cur = formData.seatingArrangements || [];
                            const next = e.target.checked ? [...cur, seat] : cur.filter(s => s !== seat);
                            setFormData({ ...formData, seatingArrangements: next });
                          }}
                          className="rounded text-primary-600 focus:ring-primary-500"
                        />
                        <span>{seat}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Services Available */}
              <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-200">
                <label className="text-xs font-bold text-indigo-950 block mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Services Available At Venue
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {SERVICES_AVAILABLE_OPTIONS.map((srv) => {
                    const selected = (formData.servicesAvailable || []).includes(srv);
                    return (
                      <label key={srv} className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                        selected ? 'bg-indigo-100/80 border-indigo-300 text-indigo-950' : 'bg-white border-indigo-100 text-gray-700'
                      }`}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={(e) => {
                            const cur = formData.servicesAvailable || [];
                            const next = e.target.checked ? [...cur, srv] : cur.filter(s => s !== srv);
                            setFormData({ ...formData, servicesAvailable: next });
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>{srv}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Venue Description */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Venue Description & Details</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                  placeholder="Describe venue highlights, suitable events, rules, ambiance..."
                />
              </div>
            </div>
          )}

          {/* TAB 2: LOCATION & PARKING */}
          {activeTab === 'location' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div className="sm:col-span-2 md:col-span-3">
                  <label className="text-xs font-bold text-gray-700 block mb-1">Complete Address *</label>
                  <input
                    type="text"
                    value={formData.location.address}
                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location, address: e.target.value } })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                    placeholder="Full street address, building name, plot number"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Landmark</label>
                  <input
                    type="text"
                    value={formData.location.landmark}
                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location, landmark: e.target.value } })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                    placeholder="Near metro / hospital / ring road"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">State *</label>
                  <select
                    value={formData.location.stateCode}
                    onChange={(e) => {
                      const selectedState = indianStates.find(s => s.isoCode === e.target.value);
                      setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          stateCode: e.target.value,
                          state: selectedState ? selectedState.name : '',
                          city: ''
                        }
                      });
                    }}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                  >
                    <option value="">Select State</option>
                    {indianStates.map(s => <option key={s.isoCode} value={s.isoCode}>{s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">City *</label>
                  <select
                    value={formData.location.city}
                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location, city: e.target.value } })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                  >
                    <option value="">Select City</option>
                    {citiesList.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Area / Locality *</label>
                  <input
                    type="text"
                    value={formData.location.area}
                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location, area: e.target.value } })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                    placeholder="e.g. Vijay Nagar / Whitefield"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Village / Ward</label>
                  <input
                    type="text"
                    value={formData.location.village}
                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location, village: e.target.value } })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                    placeholder="Optional village / sub-district"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Pincode *</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={formData.location.pincode}
                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location, pincode: e.target.value } })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl font-mono font-bold"
                    placeholder="6-digit pincode"
                  />
                </div>

                <div className="sm:col-span-2 md:col-span-3">
                  <label className="text-xs font-bold text-gray-700 block mb-1">Google Maps Direction Link</label>
                  <input
                    type="url"
                    value={formData.location.googleMapLink}
                    onChange={(e) => setFormData({ ...formData, location: { ...formData.location, googleMapLink: e.target.value } })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl"
                    placeholder="https://maps.google.com/..."
                  />
                </div>
              </div>

              {/* Parking Configuration Card */}
              <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200">
                <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-blue-600" />
                  Parking Facility & Capacity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-gray-600 block mb-1 font-semibold">Parking Availability</label>
                    <select
                      value={formData.location.parkingDetails?.type || formData.location.parkingAvailability}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          parkingAvailability: e.target.value,
                          parkingDetails: { ...formData.location.parkingDetails, type: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 text-xs border border-blue-200 rounded-lg bg-white"
                    >
                      {PARKING_OPTIONS.map(p => <option key={p} value={p}>{p} Parking</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-600 block mb-1 font-semibold">2-Wheeler (Bike) Capacity</label>
                    <input
                      type="number"
                      value={formData.location.parkingDetails?.twoWheelerCapacity || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          parkingDetails: { ...formData.location.parkingDetails, twoWheelerCapacity: Number(e.target.value) || 0 }
                        }
                      })}
                      className="w-full px-3 py-2 text-xs border border-blue-200 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-gray-600 block mb-1 font-semibold">4-Wheeler (Car) Capacity</label>
                    <input
                      type="number"
                      value={formData.location.parkingDetails?.carsCapacity || 0}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: {
                          ...formData.location,
                          parkingDetails: { ...formData.location.parkingDetails, carsCapacity: Number(e.target.value) || 0 }
                        }
                      })}
                      className="w-full px-3 py-2 text-xs border border-blue-200 rounded-lg bg-white"
                    />
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-blue-950">
                      <input
                        type="checkbox"
                        checked={formData.location.parkingDetails?.valetAvailable || false}
                        onChange={(e) => setFormData({
                          ...formData,
                          location: {
                            ...formData.location,
                            parkingDetails: { ...formData.location.parkingDetails, valetAvailable: e.target.checked }
                          }
                        })}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Valet Parking Available</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Transit & Connectivity */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-primary-600" />
                  Transit & Connectivity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Nearest Metro Station</label>
                    <input
                      type="text"
                      value={formData.location.nearestMetro}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, nearestMetro: e.target.value, nearestMetroTrain: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg"
                      placeholder="e.g. MG Road Metro (500m)"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Nearest Bus / Auto Stand</label>
                    <input
                      type="text"
                      value={formData.location.nearestBusStop}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, nearestBusStop: e.target.value, nearestBusAuto: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg"
                      placeholder="e.g. Central Bus Stand (200m)"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Nearest Railway Station</label>
                    <input
                      type="text"
                      value={formData.location.nearestRailway}
                      onChange={(e) => setFormData({
                        ...formData,
                        location: { ...formData.location, nearestRailway: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg"
                      placeholder="e.g. Junction Railway Station (4km)"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AMENITIES (4 Categorized Groups) */}
          {activeTab === 'amenities' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <h3 className="text-xs font-bold uppercase text-slate-800">Amenities & Facilities Configuration</h3>
                  <p className="text-[11px] text-gray-500">Configure free included amenities or charge extra per service</p>
                </div>
                <span className="text-xs font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-lg border border-primary-200">
                  Total {(formData.amenities.basic || []).length} Facilities
                </span>
              </div>

              {/* 4 Categorized Sections */}
              {['Basic Facilities', 'Meeting / Conference Facilities', 'Event Facilities', 'Food Facilities'].map((catName) => {
                const items = (formData.amenities.basic || []).filter(a => a.category === catName);
                if (items.length === 0) return null;

                return (
                  <div key={catName} className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary-600" />
                        {catName} ({items.length} Items)
                      </span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {items.map((amenity, idx) => {
                        const globalIdx = (formData.amenities.basic || []).findIndex(a => a.name === amenity.name && a.category === amenity.category);
                        return (
                          <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between space-y-2">
                            <span className="font-bold text-xs text-gray-900">{amenity.name}</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...formData.amenities.basic];
                                  updated[globalIdx] = { ...updated[globalIdx], type: 'Included', rate: 0 };
                                  setFormData({ ...formData, amenities: { ...formData.amenities, basic: updated } });
                                }}
                                className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                                  amenity.type === 'Included' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white text-gray-600 border border-gray-200'
                                }`}
                              >
                                Free / Included
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...formData.amenities.basic];
                                  updated[globalIdx] = { ...updated[globalIdx], type: 'Paid', rate: updated[globalIdx].rate || 500 };
                                  setFormData({ ...formData, amenities: { ...formData.amenities, basic: updated } });
                                }}
                                className={`flex-1 py-1 rounded-lg text-xs font-bold transition-all ${
                                  amenity.type === 'Paid' ? 'bg-orange-600 text-white shadow-xs' : 'bg-white text-gray-600 border border-gray-200'
                                }`}
                              >
                                Paid
                              </button>
                            </div>
                            {amenity.type === 'Paid' && (
                              <div className="flex items-center gap-1.5 pt-1">
                                <span className="text-xs font-bold text-gray-500">₹</span>
                                <input
                                  type="number"
                                  value={amenity.rate || 0}
                                  onChange={(e) => {
                                    const updated = [...formData.amenities.basic];
                                    updated[globalIdx] = { ...updated[globalIdx], rate: Number(e.target.value) || 0 };
                                    setFormData({ ...formData, amenities: { ...formData.amenities, basic: updated } });
                                  }}
                                  className="w-20 px-2 py-1 text-xs border border-gray-300 rounded-lg font-bold text-orange-700 bg-white"
                                />
                                <select
                                  value={amenity.rateType || 'Fixed'}
                                  onChange={(e) => {
                                    const updated = [...formData.amenities.basic];
                                    updated[globalIdx] = { ...updated[globalIdx], rateType: e.target.value };
                                    setFormData({ ...formData, amenities: { ...formData.amenities, basic: updated } });
                                  }}
                                  className="flex-1 px-1.5 py-1 text-[11px] border border-gray-300 rounded-lg bg-white"
                                >
                                  <option value="Fixed">Fixed</option>
                                  <option value="Per Hour">Per Hour</option>
                                  <option value="Per Person">Per Person</option>
                                </select>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Add Custom Amenity */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">Add Custom Amenity</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Amenity Name"
                    value={customAmenity.name}
                    onChange={(e) => setCustomAmenity({ ...customAmenity, name: e.target.value })}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                  />
                  <select
                    value={customAmenity.category}
                    onChange={(e) => setCustomAmenity({ ...customAmenity, category: e.target.value })}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="Basic Facilities">Basic Facilities</option>
                    <option value="Meeting / Conference Facilities">Meeting / Conference Facilities</option>
                    <option value="Event Facilities">Event Facilities</option>
                    <option value="Food Facilities">Food Facilities</option>
                  </select>
                  <select
                    value={customAmenity.type}
                    onChange={(e) => setCustomAmenity({ ...customAmenity, type: e.target.value })}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="Included">Free / Included</option>
                    <option value="Paid">Paid Extra</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (!customAmenity.name.trim()) {
                        toast.error('Please enter amenity name');
                        return;
                      }
                      setFormData({
                        ...formData,
                        amenities: {
                          ...formData.amenities,
                          basic: [...formData.amenities.basic, { ...customAmenity }]
                        }
                      });
                      setCustomAmenity({ name: '', category: 'Basic Facilities', type: 'Included', rate: 0, rateType: 'Fixed' });
                      toast.success('Custom amenity added');
                    }}
                    className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold"
                  >
                    + Add Amenity
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CATERING FACILITY */}
          {activeTab === 'catering' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200">
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-amber-600" />
                  Beverages Rates
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {(formData.amenities.beverages || []).map((bev, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-amber-100 shadow-xs">
                      <span className="font-bold text-xs text-gray-900 block mb-1">{bev.name}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-gray-500">₹</span>
                        <input
                          type="number"
                          value={bev.ratePerUnit || 0}
                          onChange={(e) => {
                            const updated = [...(formData.amenities.beverages || [])];
                            updated[idx] = { ...updated[idx], ratePerUnit: Number(e.target.value) || 0 };
                            setFormData({ ...formData, amenities: { ...formData.amenities, beverages: updated } });
                          }}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded-lg font-bold text-amber-800"
                        />
                        <span className="text-[10px] text-gray-400">/unit</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Refreshments */}
              <div className="p-4 bg-orange-50/70 rounded-xl border border-orange-200">
                <h4 className="text-xs font-bold text-orange-950 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-orange-600" />
                  Snacks & Breakfast Rates
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(formData.amenities.refreshmentFood || []).map((food, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-orange-100 shadow-xs flex items-center justify-between gap-3">
                      <div>
                        <span className="font-bold text-xs text-gray-900 block">{food.name}</span>
                        <span className="text-[10px] text-gray-500">{food.items}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-xs font-bold text-gray-500">₹</span>
                        <input
                          type="number"
                          value={food.ratePerPlate || 0}
                          onChange={(e) => {
                            const updated = [...(formData.amenities.refreshmentFood || [])];
                            updated[idx] = { ...updated[idx], ratePerPlate: Number(e.target.value) || 0 };
                            setFormData({ ...formData, amenities: { ...formData.amenities, refreshmentFood: updated } });
                          }}
                          className="w-20 px-2 py-1 text-xs border border-gray-300 rounded-lg font-bold text-orange-700"
                        />
                        <span className="text-[10px] text-gray-400">/plate</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ADDITIONAL FACILITIES */}
          {activeTab === 'facilities' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200">
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  Additional Facilities & Event Services
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(formData.additionalFacilities || []).map((fac, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-emerald-100 shadow-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-xs text-gray-900">{fac.name}</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={fac.available || false}
                            onChange={(e) => {
                              const updated = [...(formData.additionalFacilities || [])];
                              updated[idx] = { ...updated[idx], available: e.target.checked };
                              setFormData({ ...formData, additionalFacilities: updated });
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                      </div>
                      <p className="text-[11px] text-gray-500 mb-2">{fac.description}</p>
                      {fac.available && (
                        <div className="flex items-center gap-2">
                          <select
                            value={fac.type || 'Paid'}
                            onChange={(e) => {
                              const updated = [...(formData.additionalFacilities || [])];
                              updated[idx] = { ...updated[idx], type: e.target.value };
                              setFormData({ ...formData, additionalFacilities: updated });
                            }}
                            className="px-2 py-1 text-xs border border-gray-300 rounded-lg bg-white"
                          >
                            <option value="Included">Included</option>
                            <option value="Paid">Paid Extra</option>
                          </select>
                          {fac.type === 'Paid' && (
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-gray-500">₹</span>
                              <input
                                type="number"
                                value={fac.charges || 0}
                                onChange={(e) => {
                                  const updated = [...(formData.additionalFacilities || [])];
                                  updated[idx] = { ...updated[idx], charges: Number(e.target.value) || 0 };
                                  setFormData({ ...formData, additionalFacilities: updated });
                                }}
                                className="w-24 px-2 py-1 text-xs border border-gray-300 rounded-lg font-bold text-emerald-800"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PRICING & TAXES */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Per Hour */}
                <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200">
                  <h4 className="text-xs font-bold text-blue-950 uppercase mb-2">Hourly Rent (₹)</h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="text-gray-500 block mb-0.5">Weekday Rate / hr</label>
                      <input
                        type="number"
                        value={formData.pricing.perHour?.weekday || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: { ...formData.pricing, perHour: { ...formData.pricing.perHour, weekday: Number(e.target.value) || 0 } }
                        })}
                        className="w-full px-2.5 py-1.5 border border-blue-200 rounded-lg font-bold text-blue-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-gray-500 block mb-0.5">Weekend Rate / hr</label>
                      <input
                        type="number"
                        value={formData.pricing.perHour?.weekend || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: { ...formData.pricing, perHour: { ...formData.pricing.perHour, weekend: Number(e.target.value) || 0 } }
                        })}
                        className="w-full px-2.5 py-1.5 border border-blue-200 rounded-lg font-bold text-blue-900 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Half Day */}
                <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200">
                  <h4 className="text-xs font-bold text-emerald-950 uppercase mb-2">Half Day (4 hrs)</h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="text-gray-500 block mb-0.5">Weekday (4 hrs)</label>
                      <input
                        type="number"
                        value={formData.pricing.halfDay?.weekday || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: { ...formData.pricing, halfDay: { ...formData.pricing.halfDay, weekday: Number(e.target.value) || 0 } }
                        })}
                        className="w-full px-2.5 py-1.5 border border-emerald-200 rounded-lg font-bold text-emerald-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-gray-500 block mb-0.5">Weekend (4 hrs)</label>
                      <input
                        type="number"
                        value={formData.pricing.halfDay?.weekend || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: { ...formData.pricing, halfDay: { ...formData.pricing.halfDay, weekend: Number(e.target.value) || 0 } }
                        })}
                        className="w-full px-2.5 py-1.5 border border-emerald-200 rounded-lg font-bold text-emerald-900 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Full Day */}
                <div className="p-4 bg-purple-50/70 rounded-xl border border-purple-200">
                  <h4 className="text-xs font-bold text-purple-950 uppercase mb-2">Full Day (8+ hrs)</h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <label className="text-gray-500 block mb-0.5">Weekday Full Day</label>
                      <input
                        type="number"
                        value={formData.pricing.fullDay?.weekday || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: { ...formData.pricing, fullDay: { ...formData.pricing.fullDay, weekday: Number(e.target.value) || 0 } }
                        })}
                        className="w-full px-2.5 py-1.5 border border-purple-200 rounded-lg font-bold text-purple-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-gray-500 block mb-0.5">Weekend Full Day</label>
                      <input
                        type="number"
                        value={formData.pricing.fullDay?.weekend || 0}
                        onChange={(e) => setFormData({
                          ...formData,
                          pricing: { ...formData.pricing, fullDay: { ...formData.pricing.fullDay, weekend: Number(e.target.value) || 0 } }
                        })}
                        className="w-full px-2.5 py-1.5 border border-purple-200 rounded-lg font-bold text-purple-900 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Taxes & GST Configuration */}
              <div className="p-4 bg-teal-50/70 rounded-xl border border-teal-200">
                <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-teal-600" />
                  Taxes & GST Configuration
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-gray-600 block mb-1 font-semibold">GST Application Mode</label>
                    <select
                      value={formData.taxSettings.gstType}
                      onChange={(e) => setFormData({
                        ...formData,
                        taxSettings: { ...formData.taxSettings, gstType: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-xs border border-teal-200 rounded-lg bg-white"
                    >
                      <option value="Not Applicable">Not Applicable / Exempted</option>
                      <option value="Included (Inclusive)">Included in price (Inclusive)</option>
                      <option value="Extra (Exclusive)">Extra Charge (Exclusive)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-600 block mb-1 font-semibold">GST Rate (%)</label>
                    <input
                      type="number"
                      value={formData.taxSettings.gstRate}
                      onChange={(e) => setFormData({
                        ...formData,
                        taxSettings: { ...formData.taxSettings, gstRate: Number(e.target.value) || 0 }
                      })}
                      className="w-full px-3 py-2 text-xs border border-teal-200 rounded-lg bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-gray-600 block mb-1 font-semibold">GSTIN Registration Number</label>
                    <input
                      type="text"
                      value={formData.taxSettings.gstin}
                      onChange={(e) => setFormData({
                        ...formData,
                        taxSettings: { ...formData.taxSettings, gstin: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-xs border border-teal-200 rounded-lg bg-white font-mono uppercase"
                      placeholder="15-digit GSTIN"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Admin Platform Fee & GST Overrides */}
              <div className="p-4 bg-slate-100 rounded-xl border border-slate-300">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-slate-700" />
                  Admin Custom Fee & GST Overrides (Per-Venue)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Custom Platform Fee */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-800">Custom Platform Fee</span>
                      <input
                        type="checkbox"
                        checked={formData.customPlatformFee.enabled}
                        onChange={(e) => setFormData({
                          ...formData,
                          customPlatformFee: { ...formData.customPlatformFee, enabled: e.target.checked }
                        })}
                        className="rounded text-primary-600 focus:ring-primary-500"
                      />
                    </div>
                    {formData.customPlatformFee.enabled && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <select
                          value={formData.customPlatformFee.feeType}
                          onChange={(e) => setFormData({
                            ...formData,
                            customPlatformFee: { ...formData.customPlatformFee, feeType: e.target.value }
                          })}
                          className="px-2 py-1 text-xs border rounded"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed (₹)</option>
                        </select>
                        <input
                          type="number"
                          value={formData.customPlatformFee.feeValue}
                          onChange={(e) => setFormData({
                            ...formData,
                            customPlatformFee: { ...formData.customPlatformFee, feeValue: Number(e.target.value) || 0 }
                          })}
                          className="px-2 py-1 text-xs border rounded font-bold"
                        />
                      </div>
                    )}
                  </div>

                  {/* Custom GST */}
                  <div className="bg-white p-3 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-gray-800">Custom GST Override</span>
                      <input
                        type="checkbox"
                        checked={formData.customGST.enabled}
                        onChange={(e) => setFormData({
                          ...formData,
                          customGST: { ...formData.customGST, enabled: e.target.checked }
                        })}
                        className="rounded text-primary-600 focus:ring-primary-500"
                      />
                    </div>
                    {formData.customGST.enabled && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div>
                          <span className="text-[10px] text-gray-400 block">CGST %</span>
                          <input
                            type="number"
                            value={formData.customGST.cgstRate}
                            onChange={(e) => setFormData({
                              ...formData,
                              customGST: { ...formData.customGST, cgstRate: Number(e.target.value) || 0 }
                            })}
                            className="w-full px-2 py-1 text-xs border rounded"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block">SGST %</span>
                          <input
                            type="number"
                            value={formData.customGST.sgstRate}
                            onChange={(e) => setFormData({
                              ...formData,
                              customGST: { ...formData.customGST, sgstRate: Number(e.target.value) || 0 }
                            })}
                            className="w-full px-2 py-1 text-xs border rounded"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 block">HSN</span>
                          <input
                            type="text"
                            value={formData.customGST.hsnCode}
                            onChange={(e) => setFormData({
                              ...formData,
                              customGST: { ...formData.customGST, hsnCode: e.target.value }
                            })}
                            className="w-full px-2 py-1 text-xs border rounded"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PHOTOS & GALLERY */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              {/* Upload control */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-700">Target Photo Category:</span>
                  <select
                    value={uploadPhotoCategory}
                    onChange={(e) => setUploadPhotoCategory(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                  >
                    {PHOTO_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <label className={`px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-colors ${uploadingImages ? 'opacity-50 pointer-events-none' : ''}`}>
                  {uploadingImages ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>{uploadingImages ? 'Uploading...' : 'Upload Photos'}</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageFilesUpload}
                    className="hidden"
                    disabled={uploadingImages}
                  />
                </label>
              </div>

              {/* Photos Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {(formData.images || []).map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-xs bg-slate-100">
                    <img
                      src={img.url}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute top-1.5 left-1.5">
                      <span className="bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-bold">
                        {img.category || 'Photo'}
                      </span>
                    </div>

                    {img.isFeatured && (
                      <span className="absolute top-1.5 right-1.5 bg-yellow-500 text-white text-[10px] px-2 py-0.5 rounded font-bold shadow-xs">
                        ⭐ Cover
                      </span>
                    )}

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {!img.isFeatured && (
                        <button
                          type="button"
                          onClick={() => handleSetFeaturedImage(idx)}
                          className="p-1.5 bg-yellow-500 text-white rounded-lg text-xs font-bold"
                          title="Set as Featured Cover"
                        >
                          <Star className="w-4 h-4" />
                        </button>
                      )}
                      <a
                        href={img.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-white text-gray-800 rounded-lg text-xs font-bold"
                        title="View Full Photo"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="p-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold"
                        title="Delete Photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: SOCIAL PAGES & LINKS */}
          {activeTab === 'social' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-primary-600" />
                  Social Media Profiles & 360 Virtual Tour
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-gray-700 font-semibold block mb-1">Official Website URL</label>
                    <input
                      type="url"
                      value={formData.socialLinks.website}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialLinks: { ...formData.socialLinks, website: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white"
                      placeholder="https://venue.com"
                    />
                  </div>
                  <div>
                    <label className="text-gray-700 font-semibold block mb-1">360° Virtual Tour Link</label>
                    <input
                      type="url"
                      value={formData.socialLinks.virtualTour}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialLinks: { ...formData.socialLinks, virtualTour: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white"
                      placeholder="https://my.matterport.com/..."
                    />
                  </div>
                  <div>
                    <label className="text-gray-700 font-semibold block mb-1">Instagram Profile</label>
                    <input
                      type="text"
                      value={formData.socialLinks.instagram}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialLinks: { ...formData.socialLinks, instagram: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white"
                      placeholder="https://instagram.com/venue"
                    />
                  </div>
                  <div>
                    <label className="text-gray-700 font-semibold block mb-1">Facebook Page</label>
                    <input
                      type="text"
                      value={formData.socialLinks.facebook}
                      onChange={(e) => setFormData({
                        ...formData,
                        socialLinks: { ...formData.socialLinks, facebook: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white"
                      placeholder="https://facebook.com/venue"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: DOCUMENTS & PROOFS */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              {/* 1. Authorised ID Proofs */}
              <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200">
                <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-blue-600" />
                  1. Authorised Person ID Proofs (Aadhaar & PAN)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-gray-700 font-semibold block mb-1">Aadhaar Number</label>
                    <input
                      type="text"
                      value={formData.documents.idProof?.aadhaarNumber || formData.documents.idProof?.number || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        documents: {
                          ...formData.documents,
                          idProof: { ...formData.documents.idProof, aadhaarNumber: e.target.value, number: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 text-xs border border-blue-200 rounded-lg bg-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-gray-700 font-semibold block mb-1">PAN Card Number</label>
                    <input
                      type="text"
                      value={formData.documents.idProof?.panNumber || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        documents: {
                          ...formData.documents,
                          idProof: { ...formData.documents.idProof, panNumber: e.target.value.toUpperCase() }
                        }
                      })}
                      className="w-full px-3 py-2 text-xs border border-blue-200 rounded-lg bg-white font-mono font-bold uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Business Documentation Proof */}
              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200">
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  2. Business Proof Document
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-gray-700 font-semibold block mb-1">Proof Type</label>
                    <select
                      value={formData.documents.businessProof?.type}
                      onChange={(e) => setFormData({
                        ...formData,
                        documents: {
                          ...formData.documents,
                          businessProof: { ...formData.documents.businessProof, type: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 text-xs border border-emerald-200 rounded-lg bg-white"
                    >
                      {BUSINESS_PROOF_TYPES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-700 font-semibold block mb-1">Upload / Replace Business Doc</label>
                    <label className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{formData.documents.businessProof?.documentUrl ? 'Replace Document' : 'Upload Document'}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleDocFileUpload(e.target.files?.[0], 'businessProof', (url) => {
                          setFormData(prev => ({
                            ...prev,
                            documents: {
                              ...prev.documents,
                              businessProof: { ...prev.documents.businessProof, documentUrl: url }
                            }
                          }));
                        })}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* 3. Property Documentation Proof */}
              <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-200">
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  3. Property Proof Document
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-gray-700 font-semibold block mb-1">Property Proof Type</label>
                    <select
                      value={formData.documents.propertyProof?.type}
                      onChange={(e) => setFormData({
                        ...formData,
                        documents: {
                          ...formData.documents,
                          propertyProof: { ...formData.documents.propertyProof, type: e.target.value }
                        }
                      })}
                      className="w-full px-3 py-2 text-xs border border-indigo-200 rounded-lg bg-white"
                    >
                      {PROPERTY_PROOF_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-700 font-semibold block mb-1">Upload / Replace Property Doc</label>
                    <label className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{formData.documents.propertyProof?.documentUrl ? 'Replace Document' : 'Upload Document'}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => handleDocFileUpload(e.target.files?.[0], 'propertyProof', (url) => {
                          setFormData(prev => ({
                            ...prev,
                            documents: {
                              ...prev.documents,
                              propertyProof: { ...prev.documents.propertyProof, documentUrl: url }
                            }
                          }));
                        })}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Bank Account Details */}
              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200">
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Payout Bank Account Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-gray-700 font-semibold block mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={formData.bankDetails.accountHolderName}
                      onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, accountHolderName: e.target.value } })}
                      className="w-full px-3 py-2 text-xs border border-emerald-200 rounded-lg bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-gray-700 font-semibold block mb-1">Account Number</label>
                    <input
                      type="text"
                      value={formData.bankDetails.accountNumber}
                      onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, accountNumber: e.target.value } })}
                      className="w-full px-3 py-2 text-xs border border-emerald-200 rounded-lg bg-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-gray-700 font-semibold block mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={formData.bankDetails.ifscCode}
                      onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, ifscCode: e.target.value.toUpperCase() } })}
                      className="w-full px-3 py-2 text-xs border border-emerald-200 rounded-lg bg-white font-mono font-bold uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-gray-700 font-semibold block mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={formData.bankDetails.bankName}
                      onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, bankName: e.target.value } })}
                      className="w-full px-3 py-2 text-xs border border-emerald-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-gray-700 font-semibold block mb-1">Branch Name</label>
                    <input
                      type="text"
                      value={formData.bankDetails.branchName}
                      onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, branchName: e.target.value } })}
                      className="w-full px-3 py-2 text-xs border border-emerald-200 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-gray-700 font-semibold block mb-1">Account Type</label>
                    <select
                      value={formData.bankDetails.accountType}
                      onChange={(e) => setFormData({ ...formData, bankDetails: { ...formData.bankDetails, accountType: e.target.value } })}
                      className="w-full px-3 py-2 text-xs border border-emerald-200 rounded-lg bg-white font-bold text-emerald-900"
                    >
                      <option value="Current">Current Account</option>
                      <option value="Savings">Savings Account</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: RULES & TERMS */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              {/* Rules & Policies */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary-600" />
                  Venue Rules & Guest Guidelines
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-3">
                  <label className="flex items-center gap-2 p-2.5 rounded-lg border bg-white border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.rulesAndPolicies.alcoholAllowed}
                      onChange={(e) => setFormData({
                        ...formData,
                        rulesAndPolicies: { ...formData.rulesAndPolicies, alcoholAllowed: e.target.checked }
                      })}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="font-semibold text-gray-800">Alcohol Allowed</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border bg-white border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.rulesAndPolicies.smokingAllowed}
                      onChange={(e) => setFormData({
                        ...formData,
                        rulesAndPolicies: { ...formData.rulesAndPolicies, smokingAllowed: e.target.checked }
                      })}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="font-semibold text-gray-800">Smoking Allowed</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border bg-white border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.rulesAndPolicies.outsideFoodAllowed}
                      onChange={(e) => setFormData({
                        ...formData,
                        rulesAndPolicies: { ...formData.rulesAndPolicies, outsideFoodAllowed: e.target.checked }
                      })}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="font-semibold text-gray-800">Outside Food Allowed</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border bg-white border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.rulesAndPolicies.firecrackersAllowed}
                      onChange={(e) => setFormData({
                        ...formData,
                        rulesAndPolicies: { ...formData.rulesAndPolicies, firecrackersAllowed: e.target.checked }
                      })}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="font-semibold text-gray-800">Firecrackers Allowed</span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-lg border bg-white border-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.rulesAndPolicies.petFriendly}
                      onChange={(e) => setFormData({
                        ...formData,
                        rulesAndPolicies: { ...formData.rulesAndPolicies, petFriendly: e.target.checked }
                      })}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="font-semibold text-gray-800">Pet Friendly</span>
                  </label>

                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                    <span className="text-[10px] text-gray-500 block mb-0.5">DJ / Music Deadline</span>
                    <input
                      type="text"
                      value={formData.rulesAndPolicies.musicDeadline}
                      onChange={(e) => setFormData({
                        ...formData,
                        rulesAndPolicies: { ...formData.rulesAndPolicies, musicDeadline: e.target.value }
                      })}
                      className="w-full px-2 py-0.5 text-xs border border-gray-300 rounded font-semibold"
                      placeholder="e.g. 10:00 PM"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Custom House Rules</label>
                  <textarea
                    rows={2}
                    value={formData.rulesAndPolicies.customRules}
                    onChange={(e) => setFormData({
                      ...formData,
                      rulesAndPolicies: { ...formData.rulesAndPolicies, customRules: e.target.value }
                    })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white"
                    placeholder="Additional custom policies..."
                  />
                </div>
              </div>

              {/* 4-Tier Cancellation Policy */}
              <div className="p-4 bg-rose-50/70 rounded-xl border border-rose-200">
                <h4 className="text-xs font-bold text-rose-950 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  4-Tier Custom Cancellation Policy
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-lg border border-rose-100 shadow-xs">
                    <span className="text-gray-500 block mb-1">Tier 1: Before Days</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={formData.cancellationPolicy.tier1.days}
                        onChange={(e) => setFormData({
                          ...formData,
                          cancellationPolicy: {
                            ...formData.cancellationPolicy,
                            tier1: { ...formData.cancellationPolicy.tier1, days: Number(e.target.value) || 0 }
                          }
                        })}
                        className="w-14 px-1.5 py-1 border rounded text-xs"
                      />
                      <span>Days</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-gray-500 block mb-0.5">Refund %</span>
                      <input
                        type="number"
                        value={formData.cancellationPolicy.tier1.refundPercent}
                        onChange={(e) => setFormData({
                          ...formData,
                          cancellationPolicy: {
                            ...formData.cancellationPolicy,
                            tier1: { ...formData.cancellationPolicy.tier1, refundPercent: Number(e.target.value) || 0 }
                          }
                        })}
                        className="w-full px-2 py-1 border rounded text-xs font-bold text-emerald-600"
                      />
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-rose-100 shadow-xs">
                    <span className="text-gray-500 block mb-1">Tier 2: Within Days</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={formData.cancellationPolicy.tier2.days}
                        onChange={(e) => setFormData({
                          ...formData,
                          cancellationPolicy: {
                            ...formData.cancellationPolicy,
                            tier2: { ...formData.cancellationPolicy.tier2, days: Number(e.target.value) || 0 }
                          }
                        })}
                        className="w-14 px-1.5 py-1 border rounded text-xs"
                      />
                      <span>Days</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-gray-500 block mb-0.5">Refund %</span>
                      <input
                        type="number"
                        value={formData.cancellationPolicy.tier2.refundPercent}
                        onChange={(e) => setFormData({
                          ...formData,
                          cancellationPolicy: {
                            ...formData.cancellationPolicy,
                            tier2: { ...formData.cancellationPolicy.tier2, refundPercent: Number(e.target.value) || 0 }
                          }
                        })}
                        className="w-full px-2 py-1 border rounded text-xs font-bold text-amber-600"
                      />
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-rose-100 shadow-xs">
                    <span className="text-gray-500 block mb-1">Tier 3: Within Hours</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={formData.cancellationPolicy.tier3.hours}
                        onChange={(e) => setFormData({
                          ...formData,
                          cancellationPolicy: {
                            ...formData.cancellationPolicy,
                            tier3: { ...formData.cancellationPolicy.tier3, hours: Number(e.target.value) || 0 }
                          }
                        })}
                        className="w-14 px-1.5 py-1 border rounded text-xs"
                      />
                      <span>Hours</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-gray-500 block mb-0.5">Refund %</span>
                      <input
                        type="number"
                        value={formData.cancellationPolicy.tier3.refundPercent}
                        onChange={(e) => setFormData({
                          ...formData,
                          cancellationPolicy: {
                            ...formData.cancellationPolicy,
                            tier3: { ...formData.cancellationPolicy.tier3, refundPercent: Number(e.target.value) || 0 }
                          }
                        })}
                        className="w-full px-2 py-1 border rounded text-xs font-bold text-rose-600"
                      />
                    </div>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-rose-100 shadow-xs">
                    <span className="text-gray-500 block mb-1">Tier 4: Event Day</span>
                    <p className="text-xs text-gray-500 mb-2">No-Show / Event Day</p>
                    <div className="mt-2">
                      <span className="text-gray-500 block mb-0.5">Refund %</span>
                      <input
                        type="number"
                        value={formData.cancellationPolicy.tier4.refundPercent}
                        onChange={(e) => setFormData({
                          ...formData,
                          cancellationPolicy: {
                            ...formData.cancellationPolicy,
                            tier4: { ...formData.cancellationPolicy.tier4, refundPercent: Number(e.target.value) || 0 }
                          }
                        })}
                        className="w-full px-2 py-1 border rounded text-xs font-bold text-rose-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-gray-200 bg-slate-50 px-5 py-3.5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Venue Status:</span>
            <span className="text-xs font-bold uppercase text-gray-900 bg-white px-2 py-0.5 rounded border">
              {formData.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-5 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{saving ? 'Saving Venue Details...' : 'Save All Changes'}</span>
            </button>
          </div>
        </div>

        {/* Status Reason Modal Dialog */}
        {statusModal.open && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-gray-200">
              <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Reason for {statusModal.targetStatus.toUpperCase()}
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Please select or enter the specific reason why this venue is being {statusModal.targetStatus}.
              </p>

              <div className="space-y-2 mb-3">
                {(statusModal.targetStatus === 'rejected' ? REJECTION_REASONS : SUSPENSION_REASONS).map((r) => (
                  <label key={r} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="statusReason"
                      value={r}
                      checked={statusModal.reason === r}
                      onChange={(e) => setStatusModal({ ...statusModal, reason: e.target.value })}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span>{r}</span>
                  </label>
                ))}
              </div>

              {statusModal.reason === 'other' && (
                <div className="mb-3">
                  <textarea
                    rows={2}
                    placeholder="Enter custom reason..."
                    value={statusModal.customReason}
                    onChange={(e) => setStatusModal({ ...statusModal, customReason: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStatusModal({ open: false, targetStatus: '', reason: '', customReason: '' })}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmStatusChange}
                  className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-bold"
                >
                  Confirm Status
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stop Booking Modal Dialog */}
        {stopBookingModal.open && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-gray-200">
              <h3 className="text-sm font-bold text-rose-950 mb-2 flex items-center gap-2">
                <PauseCircle className="w-4 h-4 text-rose-600" />
                Reason to Pause / Stop Online Bookings
              </h3>
              <p className="text-xs text-gray-500 mb-3">
                Customers will not be able to book this venue online while stopped.
              </p>

              <div className="space-y-2 mb-3">
                {STOP_BOOKING_REASONS.map((r) => (
                  <label key={r} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="stopReason"
                      value={r}
                      checked={stopBookingModal.reason === r}
                      onChange={(e) => setStopBookingModal({ ...stopBookingModal, reason: e.target.value })}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span>{r}</span>
                  </label>
                ))}
              </div>

              {stopBookingModal.reason === 'other' && (
                <div className="mb-3">
                  <textarea
                    rows={2}
                    placeholder="Enter custom stop booking reason..."
                    value={stopBookingModal.customReason}
                    onChange={(e) => setStopBookingModal({ ...stopBookingModal, customReason: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setStopBookingModal({ open: false, reason: '', customReason: '' })}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmStopBooking}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
                >
                  Confirm Stop Booking
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
