require('dotenv').config();
const mongoose = require('mongoose');
const FAQ = require('../models/FAQ');

const faqs = [
  // Venue Seekers
  { category: 'venue_seekers', order: 1, question: 'What is RentalMeet?', answer: 'RentalMeet is an online platform that connects people with premium meeting spaces, conference rooms, training halls, and event venues. We make it easy to find, compare, and book the perfect space for your needs – whether it\'s a 2-hour meeting or a 3-day conference.' },
  { category: 'venue_seekers', order: 2, question: 'How do I book a venue on RentalMeet?', answer: 'Simply visit our website, search for venues in your desired location, filter by capacity and amenities, select your preferred space, choose your date and time, and make a secure payment. Your booking is confirmed instantly!' },
  { category: 'venue_seekers', order: 3, question: 'What types of spaces can I find?', answer: 'We offer a wide variety of venues including: Conference Rooms, Meeting Rooms, Training Halls, Seminar Halls, Auditoriums, Banquet Halls, Community Halls & Party Venues etc.' },
  { category: 'venue_seekers', order: 4, question: 'Can I book for just a few hours?', answer: 'Yes! Most venues on RentalMeet offer flexible hourly bookings. You can book for: Hourly / Half-day / Full-day / Multiple days.' },
  { category: 'venue_seekers', order: 5, question: 'How much does it cost?', answer: 'Prices vary by venue, location, and amenities. You can find spaces starting from as low as Rs. 500 per hour for basic meeting rooms to Rs. 10,000+ per hour for premium banquet halls. All prices are clearly displayed before booking.' },
  { category: 'venue_seekers', order: 6, question: 'What if I need to cancel?', answer: 'Our standard cancellation policy: 48+ hours before: 100% refund, 24-48 hours before: 50% refund, Less than 24 hours: No refund. Some venues may have different policies – always check the listing before booking.' },
  { category: 'venue_seekers', order: 7, question: 'Can I visit the venue before booking?', answer: 'Many hosts offer site visits. You can contact them through our platform to schedule a visit. We also provide detailed photos, 360° virtual tours (where available), and genuine reviews to help you make an informed decision.' },
  { category: 'venue_seekers', order: 8, question: 'How do I contact the venue owner after booking?', answer: 'Once your booking is confirmed, you\'ll receive the venue owner\'s contact details via WhatsApp/E-mail/SMS. You can also message them directly through your RentalMeet dashboard.' },
  // Venue Owners
  { category: 'venue_owners', order: 9, question: 'How do I list my venue on RentalMeet?', answer: 'Listing is free and easy: Sign up as a Venue Owner, complete the registration form with your venue details, upload 5+ high-quality photos, set your pricing and availability, submit for verification (24-48 hours), and start receiving bookings!' },
  { category: 'venue_owners', order: 10, question: 'How much does it cost to list?', answer: 'Listing your venue is completely free! We charge only a nominal platform fee as per our policy when you successfully complete a booking through our platform. No hidden fees.' },
  { category: 'venue_owners', order: 11, question: 'How do I get paid?', answer: 'We process payouts within 24-48 hours after the booking is completed. The amount is transferred directly to your registered bank account. You can track all your earnings in your dashboard.' },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  await FAQ.deleteMany({});
  await FAQ.insertMany(faqs);
  console.log(`✅ Seeded ${faqs.length} FAQs`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
