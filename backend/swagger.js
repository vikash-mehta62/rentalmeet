const swaggerAutogen = require('swagger-autogen')({ openapi: '3.0.0' });
const fs = require('fs');

const doc = {
    info: {
        title: 'Venue Booking API',
        version: '1.0.0',
        description: 'Auto-generated API documentation for the Venue Booking platform',
        contact: { name: 'API Support' },
    },
    servers: [
        { url: 'http://localhost:5000', description: 'Development Server' },
        { url: 'https://your-production-url.com', description: 'Production Server' },
    ],

    components: {
        securitySchemes: {
            bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
        schemas: {
            // ── Auth ─────────────────────────────────────────────────────────────
            AuthRegister: {
                type: 'object',
                required: ['name', 'email', 'phone', 'password'],
                properties: {
                    name: { type: 'string', example: 'John Doe' },
                    email: { type: 'string', example: 'john@example.com' },
                    phone: { type: 'string', example: '9876543210' },
                    password: { type: 'string', example: 'Strong@123' },
                },
            },
            AuthLogin: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', example: 'john@example.com' },
                    password: { type: 'string', example: 'Strong@123' },
                },
            },
            UserUpdate: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    phone: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    address: { type: 'string' },
                },
            },
            ChangePassword: {
                type: 'object',
                required: ['currentPassword', 'newPassword'],
                properties: {
                    currentPassword: { type: 'string', example: 'OldPass@1' },
                    newPassword: { type: 'string', example: 'NewPass@2' },
                },
            },

            // ── Venues ───────────────────────────────────────────────────────────
            VenueCreate: {
                type: 'object',
                required: ['businessName', 'venueType', 'description', 'capacity', 'areaSqft', 'location', 'amenities', 'pricing', 'termsAccepted'],
                properties: {
                    businessName: { type: 'string', example: 'ABC Conference Hall' },
                    venueType: { type: 'array', items: { type: 'string' }, example: ['Meeting Hall'] },
                    description: { type: 'string' },
                    capacity: { type: 'string', example: '100-200' },
                    areaSqft: { type: 'number', example: 2500 },
                    location: {
                        type: 'object',
                        required: ['address', 'landmark', 'city', 'area', 'pincode', 'googleMapLink', 'parkingAvailability'],
                        properties: {
                            address: { type: 'string' },
                            landmark: { type: 'string' },
                            city: { type: 'string' },
                            area: { type: 'string' },
                            pincode: { type: 'string' },
                            googleMapLink: { type: 'string' },
                            parkingAvailability: { type: 'string', enum: ['Free', 'Paid', 'Limited', 'None'] },
                        },
                    },
                    amenities: { type: 'object' },
                    pricing: { type: 'object' },
                    images: { type: 'array', items: { type: 'object' } },
                    documents: { type: 'object' },
                    bankDetails: { type: 'object' },
                    termsAccepted: { type: 'boolean', example: true },
                },
            },
            VenueUpdate: { $ref: '#/components/schemas/VenueCreate' },
            VenueCustomSettingsUpdate: {
                type: 'object',
                properties: {
                    customPlatformFee: {
                        type: 'object',
                        properties: {
                            enabled: { type: 'boolean' },
                            feeType: { type: 'string', enum: ['fixed', 'percentage'] },
                            feeValue: { type: 'number' },
                        },
                    },
                    customGST: {
                        type: 'object',
                        properties: {
                            enabled: { type: 'boolean' },
                            rate: { type: 'number' },
                        },
                    },
                },
            },

            // ── Platform / Admin ─────────────────────────────────────────────────
            PlatformSettingsUpdate: {
                type: 'object',
                properties: {
                    gstRate: { type: 'number', example: 18 },
                    platformFeeType: { type: 'string', enum: ['fixed', 'percentage'], example: 'percentage' },
                    platformFeeValue: { type: 'number', example: 5 },
                },
            },

            // ── Venue Bookings ───────────────────────────────────────────────────
            BookingCreate: {
                type: 'object',
                required: ['venue', 'bookingDate', 'startTime', 'endTime', 'bookingType', 'amount'],
                properties: {
                    venue: { type: 'string', example: '65f0c1...' },
                    bookingDate: { type: 'string', format: 'date', example: '2026-03-20' },
                    startTime: { type: 'string', example: '10:00 AM' },
                    endTime: { type: 'string', example: '02:00 PM' },
                    bookingType: { type: 'string', enum: ['hourly', 'halfday', 'fullday'] },
                    amount: { type: 'number', example: 11800 },
                    selectedAmenities: { type: 'object' },
                    amenitiesTotal: { type: 'number', example: 800 },
                    priceBreakdown: {
                        type: 'object',
                        properties: {
                            basePrice: { type: 'number' },
                            amenitiesTotal: { type: 'number' },
                            subtotal: { type: 'number' },
                            gstRate: { type: 'number' },
                            gst: { type: 'number' },
                            platformFee: { type: 'number' },
                            total: { type: 'number' },
                        },
                    },
                    customerDetails: {
                        type: 'object',
                        properties: {
                            name: { type: 'string' },
                            email: { type: 'string' },
                            phone: { type: 'string' },
                            eventType: { type: 'string' },
                            guestCount: { type: 'number' },
                            specialRequirements: { type: 'string' },
                        },
                    },
                },
            },
            BookingUpdateStatus: {
                type: 'object',
                required: ['status'],
                properties: {
                    status: { type: 'string', enum: ['pending', 'confirmed', 'cancelled', 'completed'] },
                },
            },
            BookingCancel: {
                type: 'object',
                properties: { reason: { type: 'string' } },
            },

            // ── Service Bookings ─────────────────────────────────────────────────
            ServiceBookingCreate: {
                type: 'object',
                required: ['serviceId', 'eventDate', 'customerInfo', 'items', 'pricing'],
                properties: {
                    serviceId: { type: 'string', example: '65f0c1...' },
                    eventDate: { type: 'string', format: 'date', example: '2026-05-15' },
                    couponCode: { type: 'string', example: 'SAVE10' },
                    customerInfo: {
                        type: 'object',
                        required: ['name', 'email', 'phone'],
                        properties: {
                            name: { type: 'string', example: 'Jane Doe' },
                            email: { type: 'string', example: 'jane@example.com' },
                            phone: { type: 'string', example: '9876543210' },
                            company: { type: 'string' },
                            eventName: { type: 'string' },
                        },
                    },
                    items: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                name: { type: 'string' },
                                quantity: { type: 'number' },
                                price: { type: 'number' },
                            },
                        },
                    },
                    pricing: {
                        type: 'object',
                        properties: {
                            subtotal: { type: 'number' },
                            serviceCGST: { type: 'number' },
                            serviceSGST: { type: 'number' },
                            platformFee: { type: 'number' },
                            platformFeeGST: { type: 'number' },
                            total: { type: 'number' },
                        },
                    },
                },
            },
            ServiceCouponValidate: {
                type: 'object',
                required: ['code', 'serviceId', 'bookingAmount'],
                properties: {
                    code: { type: 'string', example: 'SAVE10' },
                    serviceId: { type: 'string', example: '65f0c1...' },
                    bookingAmount: { type: 'number', example: 5000 },
                },
            },
            CouponValidate: {
                type: 'object',
                required: ['code'],
                properties: {
                    code: { type: 'string', example: 'WELCOME20' },
                    venueId: { type: 'string', example: '65f0c1...' },
                    bookingAmount: { type: 'number', example: 10000 },
                },
            },
            ServiceBookingDownloaded: {
                type: 'object',
                properties: {
                    action: { type: 'string', enum: ['download', 'view'], example: 'download' },
                },
            },

            // ── Blog ─────────────────────────────────────────────────────────────
            BlogCreate: {
                type: 'object',
                required: ['title', 'slug'],
                properties: {
                    title:            { type: 'string', example: 'Top 10 Venue Booking Tips' },
                    slug:             { type: 'string', example: 'top-10-venue-booking-tips' },
                    category:         { type: 'string', example: 'Venue Tips' },
                    tags:             { type: 'array', items: { type: 'string' }, example: ['venues', 'tips'] },
                    shortDescription: { type: 'string', example: 'A quick guide to booking the perfect venue.' },
                    content:          { type: 'string', description: 'HTML content from Tiptap editor' },
                    author:           { type: 'string', example: 'Admin' },
                    status:           { type: 'string', enum: ['draft', 'published', 'archived'], example: 'draft' },
                    featuredImage:    { type: 'string', example: 'https://your_bucket_name.s3.ap-southeast-2.amazonaws.com/public/blogs/image.jpg' },
                    featuredImageAlt: { type: 'string', example: 'Venue booking tips' },
                    seo: {
                        type: 'object',
                        properties: {
                            focusKeyword:    { type: 'string', example: 'venue booking' },
                            metaTitle:       { type: 'string', example: 'Top 10 Venue Booking Tips | RentalMeet' },
                            metaDescription: { type: 'string', example: 'Discover the top 10 tips for booking the perfect venue for your event.' },
                            canonicalUrl:    { type: 'string', example: 'https://rentalmeet.com/blog/top-10-venue-booking-tips' },
                            ogTitle:         { type: 'string' },
                            ogDescription:   { type: 'string' },
                            ogImage:         { type: 'string' },
                            noIndex:         { type: 'boolean', example: false },
                        },
                    },
                    schemaMarkup: {
                        type: 'object',
                        properties: {
                            article:   { type: 'boolean', example: true },
                            faqPage:   { type: 'boolean', example: false },
                            breadcrumb:{ type: 'boolean', example: true },
                        },
                    },
                    faqs: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                question: { type: 'string', example: 'How do I book a venue?' },
                                answer:   { type: 'string', example: 'Visit RentalMeet and search for venues in your city.' },
                            },
                        },
                    },
                },
            },
            BlogUpdate: { $ref: '#/components/schemas/BlogCreate' },

            // ── Upload ───────────────────────────────────────────────────────────
            UploadBase64: {
                type: 'object',
                required: ['file'],
                properties: {
                    file: { type: 'string', description: 'base64 encoded data URL' },
                    folder: { type: 'string', example: 'documents' },
                },
            },
        },
    },

    security: [{ bearerAuth: [] }],

    tags: [
        { name: 'Auth', description: 'Authentication & registration' },
        { name: 'Venues', description: 'Public venue browsing' },
        { name: 'Bookings', description: 'Venue booking management' },
        { name: 'Services', description: 'Vendor service catalogue & service bookings' },
        { name: 'Vendor', description: 'Vendor / service-provider operations' },
        { name: 'Owner', description: 'Venue owner operations' },
        { name: 'Admin', description: 'Admin panel operations' },
        { name: 'Payment', description: 'Payment processing' },
        { name: 'Reviews', description: 'Venue & service reviews' },
        { name: 'Blog', description: 'Blog CMS — public & admin' },
        { name: 'FAQs', description: 'Frequently asked questions' },
        { name: 'Chatbot', description: 'Chatbot interactions' },
        { name: 'Upload', description: 'File / image uploads' },
        { name: 'Health', description: 'Health check & system status' },
    ],
};

// ─── Prefix → Tag (longest-first to avoid partial matches) ──────────────────
const TAG_MAP = [
    { prefix: '/api/service-platform-settings', tag: 'Services' },
    { prefix: '/api/vendor-services', tag: 'Services' },
    { prefix: '/api/service-bookings', tag: 'Services' },
    { prefix: '/api/service-coupons', tag: 'Services' },
    { prefix: '/api/customer/service-bookings', tag: 'Services' },
    { prefix: '/api/bookings', tag: 'Bookings' },
    { prefix: '/api/coupons', tag: 'Bookings' },
    { prefix: '/api/venues', tag: 'Venues' },
    { prefix: '/api/venue-types', tag: 'Venues' },
    { prefix: '/api/reviews', tag: 'Reviews' },
    { prefix: '/api/upload', tag: 'Upload' },
    { prefix: '/api/payment', tag: 'Payment' },
    { prefix: '/api/owner', tag: 'Owner' },
    { prefix: '/api/vendor', tag: 'Vendor' },
    { prefix: '/api/admin', tag: 'Admin' },
    { prefix: '/api/auth', tag: 'Auth' },
    { prefix: '/api/faqs', tag: 'FAQs' },
    { prefix: '/api/blogs', tag: 'Blog' },
    { prefix: '/api/chatbot', tag: 'Chatbot' },
    { prefix: '/api/terms', tag: 'Venues' },
    { prefix: '/api/hero-slides', tag: 'Admin' },
    { prefix: '/api/contact-settings', tag: 'Admin' },
    { prefix: '/health', tag: 'Health' },
];

function assignTagsFromPaths(outputFile) {
    const spec = JSON.parse(fs.readFileSync(outputFile, 'utf8'));

    for (const [routePath, methods] of Object.entries(spec.paths || {})) {
        const match = TAG_MAP.find(({ prefix }) => routePath.startsWith(prefix));
        if (!match) continue;

        for (const operation of Object.values(methods)) {
            if (typeof operation !== 'object' || Array.isArray(operation)) continue;
            operation.tags = [match.tag];
        }
    }

    fs.writeFileSync(outputFile, JSON.stringify(spec, null, 2));
    console.log('🏷️   Tags auto-assigned from URL prefixes');
}

function augmentSpec(outputFile) {
    const spec = JSON.parse(fs.readFileSync(outputFile, 'utf8'));

    // ── Public endpoints (no auth) ────────────────────────────────────────────
    const publicEndpoints = new Set([
        // Auth
        'post /api/auth/register',
        'post /api/auth/login',

        // Venues
        'get /api/venues',
        'get /api/venues/sku/{sku}',
        'get /api/venues/locations/all',
        'get /api/venues/platform-settings/public',

        // Vendor services (public catalogue)
        'get /api/service-platform-settings',
        'get /api/vendor-services/categories',
        'get /api/vendor-services',
        'get /api/vendor-services/{id}',

        // Service bookings (guest allowed)
        'post /api/service-bookings',
        'patch /api/service-bookings/{id}/downloaded',
        'post /api/service-coupons/validate',

        // Misc public
        'get /api/terms',
        'get /api/hero-slides',
        'get /api/contact-settings',
        'get /api/faqs',
        'get /health',

        // Blog (public)
        'get /api/blogs',
        'get /api/blogs/categories',
        'get /api/blogs/sitemap',
        'get /api/blogs/{slug}',
    ]);

    // ── Operation summaries & request bodies ─────────────────────────────────
    const opMap = {
        // Auth
        'post /api/auth/register': { summary: 'Register new user', requestBody: { $ref: '#/components/schemas/AuthRegister' } },
        'post /api/auth/login': { summary: 'Login user', requestBody: { $ref: '#/components/schemas/AuthLogin' } },
        'put /api/auth/update-profile': { summary: 'Update profile', requestBody: { $ref: '#/components/schemas/UserUpdate' } },
        'put /api/auth/change-password': { summary: 'Change password', requestBody: { $ref: '#/components/schemas/ChangePassword' } },

        // Venues
        'post /api/venues': { summary: 'Create new venue', requestBody: { $ref: '#/components/schemas/VenueCreate' } },
        'put /api/venues/{id}': { summary: 'Update venue', requestBody: { $ref: '#/components/schemas/VenueUpdate' } },

        // Venue bookings
        'post /api/bookings': { summary: 'Create venue booking', requestBody: { $ref: '#/components/schemas/BookingCreate' } },
        'put /api/bookings/{id}/status': { summary: 'Update booking status', requestBody: { $ref: '#/components/schemas/BookingUpdateStatus' } },
        'put /api/bookings/{id}/cancel': { summary: 'Cancel booking', requestBody: { $ref: '#/components/schemas/BookingCancel' } },

        // Coupon (venue)
        'post /api/coupons/validate': { summary: 'Validate venue coupon', requestBody: { $ref: '#/components/schemas/CouponValidate' } },

        // Platform / admin
        'put /api/admin/platform-settings': { summary: 'Update GST & Platform Fee', requestBody: { $ref: '#/components/schemas/PlatformSettingsUpdate' } },
        'put /api/admin/venues/{id}/settings': { summary: 'Update custom GST/Platform Fee for venue', requestBody: { $ref: '#/components/schemas/VenueCustomSettingsUpdate' } },

        // Vendor services (public)
        'get /api/service-platform-settings': { summary: 'Get service platform settings (public)' },
        'get /api/vendor-services/categories': { summary: 'List vendor service categories with stats (public)' },
        'get /api/vendor-services': { summary: 'List vendor services (public, filterable)' },
        'get /api/vendor-services/{id}': { summary: 'Get a single vendor service (public)' },

        // Service bookings
        'post /api/service-bookings': {
            summary: 'Create service booking / quotation (guest allowed)',
            requestBody: { $ref: '#/components/schemas/ServiceBookingCreate' },
        },
        'patch /api/service-bookings/{id}/downloaded': {
            summary: 'Mark service quotation as downloaded / viewed',
            requestBody: { $ref: '#/components/schemas/ServiceBookingDownloaded' },
        },
        'post /api/service-coupons/validate': {
            summary: 'Validate a service coupon (public)',
            requestBody: { $ref: '#/components/schemas/ServiceCouponValidate' },
        },
        'get /api/customer/service-bookings': { summary: "List authenticated customer's service bookings" },

        // Upload
        'post /api/upload/image': { summary: 'Upload image (base64)', requestBody: { $ref: '#/components/schemas/UploadBase64' } },
        'post /api/upload/document': { summary: 'Upload document (base64)', requestBody: { $ref: '#/components/schemas/UploadBase64' } },
        'post /api/upload': { summary: 'Upload file (multipart/form-data)', multipart: true },

        // Misc
        'get /api/hero-slides': { summary: 'Get active hero/banner slides (public)' },
        'get /api/contact-settings': { summary: 'Get public contact settings' },
        'get /health': { summary: 'Health check' },

        // Blog — public
        'get /api/blogs':            { summary: 'List published blogs (paginated, filterable)' },
        'get /api/blogs/categories': { summary: 'Get all blog categories (published only)' },
        'get /api/blogs/sitemap':    { summary: 'Get blog slugs for sitemap generation' },
        'get /api/blogs/{slug}':     { summary: 'Get single published blog by slug (increments views)' },

        // Blog — admin
        'get /api/blogs/admin/all':  { summary: 'List all blogs — all statuses (admin)' },
        'get /api/blogs/admin/{id}': { summary: 'Get single blog by ID (admin)' },
        'post /api/blogs': {
            summary: 'Create new blog post (admin)',
            requestBody: { $ref: '#/components/schemas/BlogCreate' },
        },
        'put /api/blogs/{id}': {
            summary: 'Update blog post (admin)',
            requestBody: { $ref: '#/components/schemas/BlogUpdate' },
        },
        'delete /api/blogs/{id}': { summary: 'Delete blog post (admin)' },
    };

    for (const [path, methods] of Object.entries(spec.paths || {})) {
        for (const [method, operation] of Object.entries(methods)) {
            if (typeof operation !== 'object' || Array.isArray(operation)) continue;

            const key = `${method.toLowerCase()} ${path}`;

            // Strip security for public endpoints
            if (publicEndpoints.has(key)) {
                operation.security = [];
            }

            // Apply summary & request body
            const conf = opMap[key];
            if (!conf) continue;

            if (conf.summary) operation.summary = conf.summary;

            if (conf.requestBody) {
                operation.requestBody = {
                    required: true,
                    content: {
                        'application/json': { schema: conf.requestBody },
                    },
                };
            }

            if (conf.multipart) {
                operation.requestBody = {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: {
                                type: 'object',
                                required: ['file'],
                                properties: {
                                    file: { type: 'string', format: 'binary' },
                                    folder: { type: 'string' },
                                },
                            },
                        },
                    },
                };
            }
        }
    }

    fs.writeFileSync(outputFile, JSON.stringify(spec, null, 2));
    console.log('🧩  Spec augmented with summaries, request bodies and security rules');
}

// ─────────────────────────────────────────────────────────────────────────────

const outputFile = './swagger-output.json';
const routes = ['./server.js'];

swaggerAutogen(outputFile, routes, doc).then(() => {
    assignTagsFromPaths(outputFile);
    augmentSpec(outputFile);
    console.log('✅  swagger-output.json generated successfully');
});
