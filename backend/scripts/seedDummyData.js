/**
 * Seed Script — 200 Dummy Venues + 200 Dummy Vendor Services
 * Run: node backend/scripts/seedDummyData.js
 * 
 * Creates:
 *  - 10 owner users  (owner1@test.com ... owner10@test.com)  password: Test@1234
 *  - 10 vendor users (vendor1@test.com ... vendor10@test.com) password: Test@1234
 *  - 200 venues (20 per owner, mixed statuses)
 *  - 200 vendor services (20 per vendor, mixed statuses)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Venue = require('../models/Venue');
const VendorService = require('../models/VendorService');

// ── Data pools ────────────────────────────────────────────────────────────────

const CITIES = [
  { city: 'Mumbai', state: 'Maharashtra', area: 'Andheri' },
  { city: 'Delhi', state: 'Delhi', area: 'Connaught Place' },
  { city: 'Bangalore', state: 'Karnataka', area: 'Koramangala' },
  { city: 'Hyderabad', state: 'Telangana', area: 'Banjara Hills' },
  { city: 'Chennai', state: 'Tamil Nadu', area: 'T. Nagar' },
  { city: 'Kolkata', state: 'West Bengal', area: 'Park Street' },
  { city: 'Pune', state: 'Maharashtra', area: 'Kothrud' },
  { city: 'Ahmedabad', state: 'Gujarat', area: 'Navrangpura' },
  { city: 'Jaipur', state: 'Rajasthan', area: 'Malviya Nagar' },
  { city: 'Indore', state: 'Madhya Pradesh', area: 'Vijay Nagar' },
  { city: 'Bhopal', state: 'Madhya Pradesh', area: 'MP Nagar' },
  { city: 'Surat', state: 'Gujarat', area: 'Adajan' },
  { city: 'Lucknow', state: 'Uttar Pradesh', area: 'Hazratganj' },
  { city: 'Nagpur', state: 'Maharashtra', area: 'Dharampeth' },
  { city: 'Chandigarh', state: 'Punjab', area: 'Sector 17' },
];

const VENUE_NAMES = [
  'Royal Banquet Hall', 'Grand Palace', 'The Celebration Hub', 'Elite Events Center',
  'Majestic Lawns', 'Crystal Ballroom', 'Heritage Haveli', 'The Garden Retreat',
  'Skyline Convention', 'Lotus Banquet', 'Sunrise Party Hall', 'Golden Gate Events',
  'The Terrace Venue', 'Emerald Gardens', 'Silver Oak Hall', 'Prestige Convention',
  'The Grand Marquee', 'Bliss Banquet', 'Harmony Hall', 'Pinnacle Events',
  'Regal Celebrations', 'The Orchid Venue', 'Sapphire Banquet', 'Opulent Hall',
  'The Courtyard', 'Festive Fiesta', 'Grandeur Events', 'The Pavilion',
  'Celebration Square', 'Luxe Banquet', 'The Atrium', 'Radiance Hall',
  'Serene Gardens', 'The Landmark', 'Vivanta Events', 'Splendor Hall',
  'The Oasis', 'Magnolia Banquet', 'Zenith Convention', 'The Promenade',
];

const VENUE_TYPES = [
  'Banquet Hall', 'Farmhouse', 'Rooftop', 'Garden Venue', 'Convention Center',
  'Hotel Banquet', 'Resort', 'Club House', 'Community Hall', 'Party Plot',
];

const CAPACITIES = [
  '50-100', '100-200', '200-300', '300-400', '400-500',
  '500-600', '600-700', '700-800', '800-1000', '1000-1500',
];

const STATUSES_VENUE = ['approved', 'approved', 'approved', 'pending', 'rejected'];

const SERVICE_CATEGORIES = [
  'Catering', 'Photography', 'Decoration', 'DJ & Music', 'Mehendi Artist',
  'Makeup Artist', 'Event Management', 'Tent & Furniture', 'Lighting', 'Florist',
  'Choreographer', 'Invitation Cards', 'Cake & Bakery', 'Transportation', 'Security',
];

const SERVICE_TITLES = [
  'Premium Catering Services', 'Wedding Photography & Videography', 'Floral Decoration',
  'DJ & Sound System', 'Bridal Mehendi', 'Bridal Makeup Studio', 'Full Event Management',
  'Tent & Shamiana Setup', 'LED Lighting Solutions', 'Fresh Flower Arrangements',
  'Sangeet Choreography', 'Digital Invitation Design', 'Custom Wedding Cakes',
  'Luxury Car Rental', 'Event Security Services', 'Drone Photography',
  'Live Band Performance', 'Caricature Artist', 'Photo Booth Setup', 'Fireworks Display',
  'Haldi Ceremony Decor', 'Engagement Ring Ceremony Setup', 'Birthday Party Planning',
  'Corporate Event Management', 'Kids Party Entertainment', 'Balloon Decoration',
  'Candle Light Dinner Setup', 'Mehndi Tent Decoration', 'Baraat Band', 'Horse & Buggy',
  'Anchor & Emcee Services', 'Photobooth Props', 'Cocktail Bar Setup', 'Ice Sculpture',
  'Chocolate Fountain', 'Candy Bar Setup', 'Vintage Car Rental', 'Dhol Players',
  'Turban Tying Service', 'Rangoli Artist',
];

const STATUSES_SERVICE = ['approved', 'approved', 'approved', 'pending', 'rejected'];

// ── Helpers ───────────────────────────────────────────────────────────────────

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randPrice = (min, max) => Math.round(randInt(min, max) / 100) * 100;

const hashPassword = async (pw) => bcrypt.hash(pw, 10);

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected\n');

  // ── 1. Create owner users ──────────────────────────────────────────────────
  console.log('👤 Creating 10 owner users...');
  const ownerIds = [];
  for (let i = 1; i <= 10; i++) {
    const email = `owner${i}@test.com`;
    let user = await User.findOne({ email });
    if (!user) {
      const phone = `98000000${String(i).padStart(2, '0')}`;
      user = await User.create({
        name: `Test Owner ${i}`,
        email,
        phone,
        password: await hashPassword('Test@1234'),
        role: 'owner',
        city: CITIES[i % CITIES.length].city,
        state: CITIES[i % CITIES.length].state,
        isActive: true,
      });
      console.log(`  ✓ Created owner: ${email}`);
    } else {
      console.log(`  ↩ Already exists: ${email}`);
    }
    ownerIds.push(user._id);
  }

  // ── 2. Create vendor users ─────────────────────────────────────────────────
  console.log('\n👤 Creating 10 vendor users...');
  const vendorIds = [];
  for (let i = 1; i <= 10; i++) {
    const email = `vendor${i}@test.com`;
    let user = await User.findOne({ email });
    if (!user) {
      const phone = `97000000${String(i).padStart(2, '0')}`;
      user = await User.create({
        name: `Test Vendor ${i}`,
        email,
        phone,
        password: await hashPassword('Test@1234'),
        role: 'vendor',
        vendorCategory: rand(SERVICE_CATEGORIES),
        city: CITIES[i % CITIES.length].city,
        state: CITIES[i % CITIES.length].state,
        isActive: true,
      });
      console.log(`  ✓ Created vendor: ${email}`);
    } else {
      console.log(`  ↩ Already exists: ${email}`);
    }
    vendorIds.push(user._id);
  }

  // ── 3. Create 200 venues (20 per owner) ───────────────────────────────────
  console.log('\n🏛️  Creating 200 venues...');
  let venueCount = 0;
  for (let o = 0; o < ownerIds.length; o++) {
    for (let v = 0; v < 20; v++) {
      const loc = rand(CITIES);
      const nameBase = VENUE_NAMES[(o * 20 + v) % VENUE_NAMES.length];
      const businessName = `${nameBase} ${o + 1}-${v + 1}`;
      const status = STATUSES_VENUE[(o * 20 + v) % STATUSES_VENUE.length];

      // Skip if already exists (idempotent)
      const exists = await Venue.findOne({ businessName, owner: ownerIds[o] });
      if (exists) { venueCount++; process.stdout.write('.'); continue; }

      await Venue.create({
        owner: ownerIds[o],
        businessName,
        venueType: [rand(VENUE_TYPES)],
        description: `${businessName} is a premium event venue located in ${loc.city}. Perfect for weddings, corporate events, and social gatherings. We offer state-of-the-art facilities with professional staff to make your event memorable.`,
        capacity: rand(CAPACITIES),
        areaSqft: randInt(1000, 10000),
        location: {
          address: `${randInt(1, 999)}, ${loc.area} Road`,
          landmark: `Near ${loc.area} Metro Station`,
          state: loc.state,
          city: loc.city,
          area: loc.area,
          pincode: `${randInt(100000, 999999)}`,
          googleMapLink: 'https://maps.google.com',
          parkingAvailability: rand(['Free', 'Paid', 'Limited']),
        },
        amenities: {
          basic: [
            { name: 'AC', available: true, type: 'Included', rate: 0, rateType: 'Fixed' },
            { name: 'WiFi', available: true, type: 'Included', rate: 0, rateType: 'Fixed' },
            { name: 'Projector', available: true, type: 'Paid', rate: randPrice(500, 2000), rateType: 'Fixed' },
          ],
          beverages: [
            { name: 'Tea/Coffee', available: true, ratePerUnit: randPrice(20, 50) },
          ],
          refreshmentFood: [],
          lunchThalis: [],
          additional: [
            { name: 'Generator Backup', available: true, type: 'Included', charges: 0 },
          ],
        },
        pricing: {
          enabledOptions: { perHour: true, halfDay: true, fullDay: true },
          perHour: {
            weekday: randPrice(1000, 5000),
            weekend: randPrice(1500, 7000),
          },
          halfDay: {
            weekday: randPrice(5000, 20000),
            weekend: randPrice(8000, 30000),
          },
          fullDay: {
            weekday: randPrice(10000, 40000),
            weekend: randPrice(15000, 60000),
          },
          extraHourRate: {
            weekday: randPrice(500, 2000),
            weekend: randPrice(800, 3000),
          },
        },
        availability: {
          openingTime: '08:00',
          closingTime: '23:00',
          availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          advanceBookingRule: rand(['Same day allowed', '24 hours in advance', '48 hours in advance']),
          confirmationHours: 3,
        },
        images: [
          {
            url: `https://picsum.photos/seed/${businessName.replace(/\s/g, '')}/800/600`,
            category: 'Featured',
            isFeatured: true,
          },
          {
            url: `https://picsum.photos/seed/${businessName.replace(/\s/g, '')}2/800/600`,
            category: 'Interior',
            isFeatured: false,
          },
        ],
        ownerInfo: {
          fullName: `Owner ${o + 1}`,
          email: `owner${o + 1}@test.com`,
          mobile: `98000000${String(o + 1).padStart(2, '0')}`,
          role: 'Owner',
          hasGST: false,
        },
        documents: { verified: false },
        termsAccepted: true,
        status,
        totalBookings: randInt(0, 50),
        totalEarnings: randInt(0, 500000),
        rating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // 3.0 - 5.0
        reviewCount: randInt(0, 100),
      });

      venueCount++;
      process.stdout.write('.');
    }
  }
  console.log(`\n  ✅ ${venueCount} venues done`);

  // ── 4. Create 200 vendor services (20 per vendor) ─────────────────────────
  console.log('\n🛠️  Creating 200 vendor services...');
  let svcCount = 0;
  for (let vi = 0; vi < vendorIds.length; vi++) {
    for (let s = 0; s < 20; s++) {
      const loc = rand(CITIES);
      const titleBase = SERVICE_TITLES[(vi * 20 + s) % SERVICE_TITLES.length];
      const title = `${titleBase} ${vi + 1}-${s + 1}`;
      const category = SERVICE_CATEGORIES[(vi * 20 + s) % SERVICE_CATEGORIES.length];
      const status = STATUSES_SERVICE[(vi * 20 + s) % STATUSES_SERVICE.length];

      const exists = await VendorService.findOne({ title, vendor: vendorIds[vi] });
      if (exists) { svcCount++; process.stdout.write('.'); continue; }

      await VendorService.create({
        vendor: vendorIds[vi],
        title,
        category,
        companyName: `${titleBase} Co. ${vi + 1}`,
        brandName: `Brand ${vi + 1}`,
        experienceYears: randInt(1, 20),
        description: `${title} — Professional ${category} services for all types of events. We bring creativity, experience, and passion to every event we handle. Our team of experts ensures your event is nothing short of perfect.`,
        specialization: [category, 'Weddings', 'Corporate Events'],
        tags: [category.toLowerCase(), 'events', 'wedding', 'party'],
        officeAddress: `${randInt(1, 999)}, ${loc.area}`,
        state: loc.state,
        city: loc.city,
        area: loc.area,
        pincode: `${randInt(100000, 999999)}`,
        serviceableAreas: [loc.city, CITIES[randInt(0, CITIES.length - 1)].city],
        startingPrice: randPrice(2000, 50000),
        minimumOrderPrice: randPrice(1000, 10000),
        packages: [
          {
            sno: 1,
            name: 'Basic Package',
            price: randPrice(2000, 10000),
            unit: 'Per Event',
            minQty: 1,
            maxQty: null,
          },
          {
            sno: 2,
            name: 'Premium Package',
            price: randPrice(10000, 50000),
            unit: 'Per Event',
            minQty: 1,
            maxQty: null,
          },
        ],
        featuredImage: `https://picsum.photos/seed/${title.replace(/\s/g, '')}/800/600`,
        images: [
          `https://picsum.photos/seed/${title.replace(/\s/g, '')}1/800/600`,
          `https://picsum.photos/seed/${title.replace(/\s/g, '')}2/800/600`,
        ],
        availability: [
          { day: 'Monday', isAvailable: true, startTime: '09:00', endTime: '20:00' },
          { day: 'Tuesday', isAvailable: true, startTime: '09:00', endTime: '20:00' },
          { day: 'Wednesday', isAvailable: true, startTime: '09:00', endTime: '20:00' },
          { day: 'Thursday', isAvailable: true, startTime: '09:00', endTime: '20:00' },
          { day: 'Friday', isAvailable: true, startTime: '09:00', endTime: '20:00' },
          { day: 'Saturday', isAvailable: true, startTime: '09:00', endTime: '22:00' },
          { day: 'Sunday', isAvailable: true, startTime: '10:00', endTime: '22:00' },
        ],
        advanceBooking: '24h',
        termsAccepted: true,
        status,
        totalEnquiries: randInt(0, 100),
        totalBookings: randInt(0, 50),
        isActive: true,
        currentStep: 8,
      });

      svcCount++;
      process.stdout.write('.');
    }
  }
  console.log(`\n  ✅ ${svcCount} services done`);

  // ── Summary ────────────────────────────────────────────────────────────────
  const totalVenues = await Venue.countDocuments();
  const totalServices = await VendorService.countDocuments();
  const totalOwners = await User.countDocuments({ role: 'owner' });
  const totalVendors = await User.countDocuments({ role: 'vendor' });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ SEED COMPLETE');
  console.log(`   Owners  : ${totalOwners}`);
  console.log(`   Vendors : ${totalVendors}`);
  console.log(`   Venues  : ${totalVenues}`);
  console.log(`   Services: ${totalServices}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🔑 Test credentials:');
  console.log('   owner1@test.com  → owner10@test.com  | password: Test@1234');
  console.log('   vendor1@test.com → vendor10@test.com | password: Test@1234');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
