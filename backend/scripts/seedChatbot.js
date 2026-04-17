require('dotenv').config();
const mongoose = require('mongoose');
const ChatbotSettings = require('../models/ChatbotSettings');

const defaultSettings = {
  isEnabled: true,
  welcomeMessage: "Hello! I'm your RentalMeet booking assistant. How can I help you today?",
  quickReplies: [
    {
      question: 'How to book a venue?',
      answer: "Booking a venue is simple:\n1. Browse venues on the Venues page\n2. Select your preferred venue\n3. Choose date, time & duration\n4. Fill in your details & confirm\n\nYou'll receive a confirmation instantly!",
    },
    {
      question: 'Pricing & rates',
      answer: "Venue pricing on RentalMeet:\n• Co-Work Spaces: ₹500–₹2,000/hr\n• Meeting Halls: ₹1,500–₹3,500/hr\n• Conference Halls: ₹6,000–₹12,000/hr\n• Function Halls: ₹7,000–₹15,000/hr\n• Marriage Gardens: ₹9,000–₹20,000/hr",
    },
    {
      question: 'List my venue',
      answer: "To list your venue:\n1. Click 'List Your Venue' in navigation\n2. Fill in venue details & upload photos\n3. Set pricing and availability\n4. Submit for review\n\nApproval within 24–48 hours.",
    },
    {
      question: 'Premium services',
      answer: "Our Premium Services:\n• Catering & Food\n• Makeup & Beauty\n• Photography & Videography\n• Entertainment & DJ\n• Decor & Floral\n• Security & Bouncers\n• Celebrity Appearances\n• Logistics & Support\n\nVisit Premium Services page!",
    },
    {
      question: 'Contact support',
      answer: "Reach us anytime:\n📞 +91 9425796767\n📧 booking@rentalmeet.in\n📍 G-137, Gautam Nagar, Bhopal\n\nAvailable 24/7!",
    },
    {
      question: 'Payment & refund',
      answer: "Payment & Refund:\n• All major payment modes accepted\n• 100% secured payments\n• Refunds in 24–48 hours\n• Cancellation policy varies by venue\n\nCall +91 9425796767 for help.",
    },
    {
      question: 'Cities we serve',
      answer: "We're active in:\n\nMadhya Pradesh:\nBhopal, Indore, Gwalior, Jabalpur, Ujjain\n\nRajasthan:\nJaipur, Udaipur, Jodhpur, Sikar, Ajmer\n\nMore cities coming soon!",
    },
  ],
};

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  await ChatbotSettings.deleteMany({});
  await ChatbotSettings.create(defaultSettings);
  console.log('✅ Chatbot settings seeded successfully');
  process.exit(0);
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });
