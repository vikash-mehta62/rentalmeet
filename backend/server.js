const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const connectDB = require('./config/database');

const app = express();

// Connect to MongoDB
connectDB();

// Start cron jobs
const { startAutoCancelCron, startAutoDeleteCron } = require('./utils/cronJobs');
startAutoCancelCron();
startAutoDeleteCron();

// Security middleware
app.use(helmet({
  // Relax CSP so Swagger UI assets load correctly
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));
app.use(cors());

// Increase payload limit for large requests (images, etc.)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
// app.use('/api/', limiter);

//Swagger API Documentation only for developement not for Production
if (process.env.NODE_ENV !== 'production') {
  const swaggerOutput = require('./swagger-output.json');

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerOutput, {
      explorer: true,
      swaggerOptions: {
        persistAuthorization: true,   // keeps JWT across page refreshes
        displayRequestDuration: true, // shows response time in UI
        filter: true,                 // enables tag/endpoint search bar
        tryItOutEnabled: true,        // "Try it out" open by default
      },
      customSiteTitle: 'Venue Booking API Docs',
    })
  );
  console.log(`Swagger UI  → http://localhost:${process.env.PORT || 5000}/api-docs`);
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/venues', require('./routes/venues'));
app.use('/api/venue-types', require('./routes/venueTypes'));
app.use('/api/owner', require('./routes/owner'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/terms', require('./routes/terms'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/venues', require('./routes/venueReviews'));

// Public coupon validation
const { validateCoupon } = require('./controllers/couponController');
app.post('/api/coupons/validate', require('./middleware/auth').protect, validateCoupon);

// Public hero slides route
const { getActiveHeroSlides, getPublicContactSettings } = require('./controllers/adminController');
app.get('/api/hero-slides', getActiveHeroSlides);
app.get('/api/contact-settings', getPublicContactSettings);

// FAQ routes
app.use('/api/faqs', require('./routes/faqs'));

// Chatbot routes
app.use('/api/chatbot', require('./routes/chatbot'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
